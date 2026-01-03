from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem, Ticket, PaymentEvent


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
	list_display = ('id', 'user', 'status', 'expires_at', 'created_at')
	list_filter = ('status',)
	search_fields = ('user__email',)


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
	list_display = ('id', 'cart', 'showtime', 'seat', 'unit_price', 'hold_expires_at')
	list_filter = ('showtime',)
	search_fields = ('cart__user__email', 'seat__row')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
	list_display = ('id', 'user', 'status', 'total', 'currency', 'payment_intent_id', 'created_at')
	list_filter = ('status', 'currency')
	search_fields = ('user__email', 'payment_intent_id')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
	list_display = ('id', 'order', 'showtime', 'seat', 'unit_price')
	list_filter = ('showtime',)
	search_fields = ('order__user__email',)


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
	list_display = ('id', 'order_item', 'code', 'status', 'issued_at')
	list_filter = ('status',)
	search_fields = ('code',)


@admin.register(PaymentEvent)
class PaymentEventAdmin(admin.ModelAdmin):
	list_display = ('id', 'type', 'payment_intent_id', 'order', 'created_at')
	list_filter = ('type',)
	search_fields = ('payment_intent_id',)
