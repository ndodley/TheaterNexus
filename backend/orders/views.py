from datetime import timedelta
import hashlib
import os

import stripe
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import Cart, CartItem, Order, OrderItem, Ticket, PaymentEvent
from .serializers import CartSerializer, OrderSerializer


def _get_or_create_active_cart(user: settings.AUTH_USER_MODEL) -> Cart:
	cart = Cart.objects.filter(user=user, status=Cart.STATUS_ACTIVE).order_by('-created_at').first()
	if cart is None:
		cart = Cart.objects.create(user=user)
		# set expiry window
		minutes = int(getattr(settings, 'CART_HOLD_MINUTES', 10) or 10)
		cart.expires_at = timezone.now() + timedelta(minutes=minutes)
		cart.save(update_fields=['expires_at'])
	return cart


def _seat_available_for_showtime(showtime_id: int, seat_id: int) -> bool:
	# Check not already sold
	if OrderItem.objects.filter(showtime_id=showtime_id, seat_id=seat_id, order__status=Order.STATUS_PAID).exists():
		return False
	# Check not held by another active cart
	active_items = CartItem.objects.filter(showtime_id=showtime_id, seat_id=seat_id, hold_expires_at__gt=timezone.now())
	return not active_items.exists()


class CartView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		cart = _get_or_create_active_cart(request.user)
		return Response(CartSerializer(cart).data)


class CartAddItemView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		showtime_id = int(request.data.get('showtime_id') or 0)
		seat_id = int(request.data.get('seat_id') or 0)
		if not showtime_id or not seat_id:
			return Response({'detail': 'showtime_id and seat_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

		if not _seat_available_for_showtime(showtime_id, seat_id):
			return Response({'detail': 'Seat is already taken or on hold.'}, status=status.HTTP_409_CONFLICT)

		cart = _get_or_create_active_cart(request.user)
		# price: base showtime price (simple)
		from showtimes.models import ShowTime
		st = get_object_or_404(ShowTime, pk=showtime_id)
		unit_price = st.base_price
		minutes = int(getattr(settings, 'CART_HOLD_MINUTES', 10) or 10)
		hold_until = timezone.now() + timedelta(minutes=minutes)
		item, created = CartItem.objects.get_or_create(
			cart=cart, showtime_id=showtime_id, seat_id=seat_id,
			defaults={'unit_price': unit_price, 'hold_expires_at': hold_until}
		)
		if not created:
			# refresh hold
			item.hold_expires_at = hold_until
			item.unit_price = unit_price
			item.save(update_fields=['hold_expires_at', 'unit_price'])
		return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartRemoveItemView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request, item_id: int):
		cart = _get_or_create_active_cart(request.user)
		item = CartItem.objects.filter(id=item_id, cart=cart).first()
		if not item:
			return Response({'detail': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
		item.delete()
		return Response(CartSerializer(cart).data)


class CreatePaymentIntentView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		cart = _get_or_create_active_cart(request.user)
		items = list(cart.items.select_related('showtime', 'seat'))
		if not items:
			return Response({'detail': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

		# compute totals (simple: subtotal is sum of unit_price; fees/tax 0 for now)
		subtotal = sum([float(i.unit_price) for i in items])
		fees = 0.0
		tax = 0.0
		total = subtotal + fees + tax
		amount = int(round(total * 100))

		if not settings.STRIPE_SECRET_KEY:
			return Response({'detail': 'Stripe secret key not configured.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		stripe.api_key = settings.STRIPE_SECRET_KEY

		# Idempotency: reuse most recent pending order if it exists
		order = Order.objects.filter(user=request.user, status=Order.STATUS_PENDING).order_by('-created_at').first()
		intent = None
		if order and order.payment_intent_id:
			try:
				intent = stripe.PaymentIntent.retrieve(order.payment_intent_id)
				# If intent is cancelable or requires payment, ensure amount matches
				if intent and intent.get('status') in ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing']:
					if int(intent.get('amount') or 0) != amount:
						intent = stripe.PaymentIntent.modify(order.payment_intent_id, amount=amount)
				elif intent and intent.get('status') == 'canceled':
					intent = None  # create a new one below
				elif intent and intent.get('status') == 'succeeded':
					# Already paid; create new pending intent/order for current cart
					order = None
					intent = None
			except Exception:
				intent = None

		if intent is None:
			intent = stripe.PaymentIntent.create(
				amount=amount,
				currency=getattr(settings, 'ORDER_CURRENCY', 'usd'),
				metadata={
					'cart_id': str(cart.id),
					'user_id': str(request.user.id),
				},
			)
			if order is None:
				order = Order.objects.create(
					user=request.user,
					currency=getattr(settings, 'ORDER_CURRENCY', 'usd'),
					status=Order.STATUS_PENDING,
					subtotal=subtotal,
					fees=fees,
					tax=tax,
					total=total,
					payment_intent_id=intent['id'],
				)
			else:
				# Update existing order totals to reflect latest cart
				order.subtotal = subtotal
				order.fees = fees
				order.tax = tax
				order.total = total
				order.payment_intent_id = intent['id']
				order.save(update_fields=['subtotal', 'fees', 'tax', 'total', 'payment_intent_id', 'updated_at'])

		return Response({'client_secret': intent['client_secret'], 'order_id': order.id})


class StripeWebhookView(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		payload = request.body
		sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
		wh_secret = settings.STRIPE_WEBHOOK_SECRET
		if not wh_secret:
			return Response({'detail': 'Webhook secret not configured.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

		try:
			event = stripe.Webhook.construct_event(payload=payload, sig_header=sig_header, secret=wh_secret)
		except Exception as e:
			return Response({'detail': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

		etype = event['type']
		edata = event['data']['object']
		payment_intent_id = edata.get('id') or edata.get('payment_intent')
		order = Order.objects.filter(payment_intent_id=payment_intent_id).first()
		PaymentEvent.objects.create(order=order, payment_intent_id=payment_intent_id or '', type=etype, payload=event)

		if etype == 'payment_intent.succeeded' and order:
			with transaction.atomic():
				# Re-check cart items linked via cart_id metadata if available
				# since we created an Order on intent creation, convert active cart items to order items
				# For simplicity, attach all user's active cart items.
				cart = Cart.objects.filter(user=order.user, status=Cart.STATUS_ACTIVE).order_by('-created_at').first()
				if not cart:
					return Response({'ok': True})
				# Create order items ensuring seats are still available
				items = list(cart.items.select_related('showtime', 'seat'))
				for it in items:
					# if seat is sold in another paid order, skip
					if OrderItem.objects.filter(showtime=it.showtime, seat=it.seat, order__status=Order.STATUS_PAID).exists():
						continue
					OrderItem.objects.create(order=order, showtime=it.showtime, seat=it.seat, unit_price=it.unit_price)
					# issue ticket code
					code = hashlib.sha256(f"{order.id}-{it.showtime_id}-{it.seat_id}-{timezone.now().isoformat()}".encode()).hexdigest()[:12]
					Ticket.objects.create(order_item=order.items.latest('id'), code=code)
				# Mark order as paid
				order.status = Order.STATUS_PAID
				order.save(update_fields=['status'])
				# Convert cart
				cart.status = Cart.STATUS_CONVERTED
				cart.save(update_fields=['status'])
				# Clear items
				CartItem.objects.filter(cart=cart).delete()

		return Response({'ok': True})


class FinalizeOrderView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, order_id: int):
		order = get_object_or_404(Order.objects.filter(user=request.user), pk=order_id)
		if order.status == Order.STATUS_PAID:
			return Response({'ok': True})
		if not settings.STRIPE_SECRET_KEY:
			return Response({'detail': 'Stripe secret key not configured.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		stripe.api_key = settings.STRIPE_SECRET_KEY
		try:
			intent = stripe.PaymentIntent.retrieve(order.payment_intent_id)
		except Exception:
			return Response({'detail': 'Unable to verify payment intent.'}, status=status.HTTP_400_BAD_REQUEST)

		if intent and intent.get('status') == 'succeeded':
			with transaction.atomic():
				cart = Cart.objects.filter(user=order.user, status=Cart.STATUS_ACTIVE).order_by('-created_at').first()
				if cart:
					items = list(cart.items.select_related('showtime', 'seat'))
					for it in items:
						if OrderItem.objects.filter(showtime=it.showtime, seat=it.seat, order__status=Order.STATUS_PAID).exists():
							continue
						OrderItem.objects.create(order=order, showtime=it.showtime, seat=it.seat, unit_price=it.unit_price)
						code = hashlib.sha256(f"{order.id}-{it.showtime_id}-{it.seat_id}-{timezone.now().isoformat()}".encode()).hexdigest()[:12]
						Ticket.objects.create(order_item=order.items.latest('id'), code=code)
					cart.status = Cart.STATUS_CONVERTED
					cart.save(update_fields=['status'])
					CartItem.objects.filter(cart=cart).delete()
				order.status = Order.STATUS_PAID
				order.save(update_fields=['status'])
			return Response({'ok': True})
		return Response({'detail': 'Payment not completed.'}, status=status.HTTP_400_BAD_REQUEST)


class OrdersConfigView(APIView):
	permission_classes = [AllowAny]
	authentication_classes = []

	def get(self, request):
		pk = getattr(settings, 'STRIPE_PUBLISHABLE_KEY', None)
		currency = getattr(settings, 'ORDER_CURRENCY', 'usd')
		return Response({'publishable_key': pk, 'currency': currency})


class OrdersListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		orders = Order.objects.filter(user=request.user, status=Order.STATUS_PAID).order_by('-created_at')
		data = OrderSerializer(orders, many=True).data
		return Response(data)


class OrderDetailView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, order_id: int):
		order = get_object_or_404(Order.objects.filter(user=request.user), pk=order_id)
		return Response(OrderSerializer(order).data)
