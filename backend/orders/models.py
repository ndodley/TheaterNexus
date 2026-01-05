from django.db import models
from django.conf import settings
from django.utils import timezone


class Cart(models.Model):
	STATUS_ACTIVE = 'active'
	STATUS_EXPIRED = 'expired'
	STATUS_CONVERTED = 'converted'

	STATUS_CHOICES = [
		(STATUS_ACTIVE, 'Active'),
		(STATUS_EXPIRED, 'Expired'),
		(STATUS_CONVERTED, 'Converted'),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='carts')
	status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
	expires_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self) -> str:
		return f"Cart #{self.pk} for {getattr(self.user, 'email', self.user_id)} ({self.status})"


class CartItem(models.Model):
	cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
	showtime = models.ForeignKey('showtimes.ShowTime', on_delete=models.CASCADE, related_name='cart_items')
	seat = models.ForeignKey('theaters.Seat', on_delete=models.CASCADE, related_name='cart_items')
	unit_price = models.DecimalField(max_digits=8, decimal_places=2)
	hold_expires_at = models.DateTimeField()
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['showtime_id', 'seat_id']
		constraints = [
			models.UniqueConstraint(fields=['cart', 'showtime', 'seat'], name='uniq_cart_item_seat_showtime'),
		]

	def __str__(self) -> str:
		return f"CartItem {self.cart_id} — {self.showtime_id} seat {self.seat_id}"


class Order(models.Model):
	STATUS_PENDING = 'pending'
	STATUS_PAID = 'paid'
	STATUS_REFUNDED = 'refunded'
	STATUS_CANCELED = 'canceled'

	STATUS_CHOICES = [
		(STATUS_PENDING, 'Pending'),
		(STATUS_PAID, 'Paid'),
		(STATUS_REFUNDED, 'Refunded'),
		(STATUS_CANCELED, 'Canceled'),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
	currency = models.CharField(max_length=8, default=getattr(settings, 'ORDER_CURRENCY', 'usd'))
	status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_PENDING)

	subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	fees = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

	payment_intent_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self) -> str:
		return f"Order #{self.pk} — {self.status}"


class OrderItem(models.Model):
	order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
	showtime = models.ForeignKey('showtimes.ShowTime', on_delete=models.PROTECT, related_name='order_items')
	seat = models.ForeignKey('theaters.Seat', on_delete=models.PROTECT, related_name='order_items')
	unit_price = models.DecimalField(max_digits=8, decimal_places=2)

	class Meta:
		ordering = ['order_id']
		constraints = [
			models.UniqueConstraint(fields=['order', 'seat'], name='uniq_seat_per_order'),
		]

	def __str__(self) -> str:
		return f"OrderItem {self.order_id} — {self.showtime_id} seat {self.seat_id}"


class Ticket(models.Model):
	STATUS_VALID = 'valid'
	STATUS_VOID = 'void'

	STATUS_CHOICES = [
		(STATUS_VALID, 'Valid'),
		(STATUS_VOID, 'Void'),
	]

	order_item = models.OneToOneField(OrderItem, on_delete=models.CASCADE, related_name='ticket')
	code = models.CharField(max_length=32, unique=True)
	status = models.CharField(max_length=8, choices=STATUS_CHOICES, default=STATUS_VALID)
	issued_at = models.DateTimeField(auto_now_add=True)

	def __str__(self) -> str:
		return f"Ticket {self.code} ({self.status})"


class PaymentEvent(models.Model):
	order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_events')
	payment_intent_id = models.CharField(max_length=64, db_index=True)
	type = models.CharField(max_length=64)
	payload = models.JSONField()
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self) -> str:
		return f"PaymentEvent {self.type} — {self.payment_intent_id}"
