from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem, Ticket, PaymentEvent
from backend.admin_utils import ExportCsvAdminMixin


@admin.register(Cart)
class CartAdmin(ExportCsvAdminMixin, admin.ModelAdmin):
	list_display = ('id', 'user', 'status', 'expires_at', 'created_at')
	list_filter = ('status',)
	search_fields = ('user__email',)
	change_list_template = "admin/csv_export_change_list.html"


@admin.register(CartItem)
class CartItemAdmin(ExportCsvAdminMixin, admin.ModelAdmin):
	list_display = ('id', 'cart', 'showtime', 'seat', 'unit_price', 'hold_expires_at')
	list_filter = ('showtime',)
	search_fields = ('cart__user__email', 'seat__row')
	change_list_template = "admin/csv_export_change_list.html"


@admin.register(Order)
class OrderAdmin(ExportCsvAdminMixin, admin.ModelAdmin):
	list_display = ('id', 'user', 'status', 'total', 'currency', 'payment_intent_id', 'created_at')
	list_filter = ('status', 'currency')
	search_fields = ('user__email', 'payment_intent_id')
	change_list_template = "admin/csv_export_change_list.html"


@admin.register(OrderItem)
class OrderItemAdmin(ExportCsvAdminMixin, admin.ModelAdmin):
	list_display = ('id', 'order', 'showtime', 'seat', 'unit_price')
	list_filter = ('showtime',)
	search_fields = ('order__user__email',)
	change_list_template = "admin/csv_export_change_list.html"


@admin.register(Ticket)
class TicketAdmin(ExportCsvAdminMixin, admin.ModelAdmin):
	list_display = ('id', 'order_item', 'code', 'status', 'issued_at')
	list_filter = ('status',)
	search_fields = ('code',)
	change_list_template = "admin/csv_export_change_list.html"


@admin.register(PaymentEvent)
class PaymentEventAdmin(ExportCsvAdminMixin, admin.ModelAdmin):
	list_display = ('id', 'type', 'payment_intent_id', 'order', 'created_at')
	list_filter = ('type',)
	search_fields = ('payment_intent_id',)
	change_list_template = "admin/csv_export_change_list.html"
