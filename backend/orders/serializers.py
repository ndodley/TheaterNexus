from rest_framework import serializers
from django.conf import settings
from .models import Cart, CartItem, Order, OrderItem, Ticket


class CartItemSerializer(serializers.ModelSerializer):
	seat_label = serializers.SerializerMethodField()
	showtime_info = serializers.SerializerMethodField()

	class Meta:
		model = CartItem
		fields = ['id', 'showtime', 'seat', 'seat_label', 'unit_price', 'hold_expires_at', 'showtime_info']

	def get_seat_label(self, obj):
		return f"{obj.seat.row}{obj.seat.number}"

	def get_showtime_info(self, obj):
		st = getattr(obj, 'showtime', None)
		if not st:
			return None
		movie = getattr(st, 'movie', None)
		# Safely convert image field to URL/path string; avoid raw bytes
		img = None
		try:
			if movie and getattr(movie, 'image', None):
				f = movie.image
				name = getattr(f, 'name', '') or ''
				if name.endswith('default_movie.jpg') and 'default_poster/' not in name:
					media = getattr(settings, 'MEDIA_URL', '/media/')
					img = f"{media.rstrip('/')}/default_poster/default_movie.jpg"
				else:
					img = getattr(f, 'url', None) or (str(f) if f else None)
		except Exception:
			img = None
		if not img:
			media = getattr(settings, 'MEDIA_URL', '/media/')
			img = f"{media.rstrip('/')}/default_poster/default_movie.jpg"
		return {
			'movie_id': getattr(movie, 'id', None),
			'movie_title': getattr(movie, 'title', ''),
			'movie_image': img,
			'theater_name': getattr(st.screen.theater, 'name', '') if getattr(st, 'screen', None) else '',
			'screen_name': getattr(st.screen, 'name', '') if getattr(st, 'screen', None) else '',
			'start_time': st.start_time,
		}


class CartSerializer(serializers.ModelSerializer):
	items = CartItemSerializer(many=True, read_only=True)

	class Meta:
		model = Cart
		fields = ['id', 'status', 'expires_at', 'created_at', 'items']


class OrderItemSerializer(serializers.ModelSerializer):
	seat_label = serializers.SerializerMethodField()
	showtime_info = serializers.SerializerMethodField()

	class Meta:
		model = OrderItem
		fields = ['id', 'showtime', 'seat', 'seat_label', 'unit_price', 'showtime_info']

	def get_seat_label(self, obj):
		return f"{obj.seat.row}{obj.seat.number}"

	def get_showtime_info(self, obj):
		st = getattr(obj, 'showtime', None)
		if not st:
			return None
		movie = getattr(st, 'movie', None)
		img = None
		try:
			if movie and getattr(movie, 'image', None):
				f = movie.image
				name = getattr(f, 'name', '') or ''
				if name.endswith('default_movie.jpg') and 'default_poster/' not in name:
					media = getattr(settings, 'MEDIA_URL', '/media/')
					img = f"{media.rstrip('/')}/default_poster/default_movie.jpg"
				else:
					img = getattr(f, 'url', None) or (str(f) if f else None)
		except Exception:
			img = None
		if not img:
			media = getattr(settings, 'MEDIA_URL', '/media/')
			img = f"{media.rstrip('/')}/default_poster/default_movie.jpg"
		return {
			'movie_id': getattr(movie, 'id', None),
			'movie_title': getattr(movie, 'title', ''),
			'movie_image': img,
			'theater_name': getattr(st.screen.theater, 'name', '') if getattr(st, 'screen', None) else '',
			'screen_name': getattr(st.screen, 'name', '') if getattr(st, 'screen', None) else '',
			'start_time': st.start_time,
		}


class TicketSerializer(serializers.ModelSerializer):
	class Meta:
		model = Ticket
		fields = ['code', 'status', 'issued_at']


class OrderSerializer(serializers.ModelSerializer):
	items = OrderItemSerializer(many=True, read_only=True)

	class Meta:
		model = Order
		fields = ['id', 'status', 'currency', 'subtotal', 'fees', 'tax', 'total', 'payment_intent_id', 'created_at', 'items']
