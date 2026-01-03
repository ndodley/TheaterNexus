from django.urls import path
from . import views

urlpatterns = [
	path('cart/', views.CartView.as_view(), name='orders-cart'),
	path('cart/add/', views.CartAddItemView.as_view(), name='orders-cart-add'),
	path('cart/remove/<int:item_id>/', views.CartRemoveItemView.as_view(), name='orders-cart-remove'),
	path('checkout/create-intent/', views.CreatePaymentIntentView.as_view(), name='orders-create-intent'),
	path('checkout/finalize/<int:order_id>/', views.FinalizeOrderView.as_view(), name='orders-finalize'),
	path('webhooks/', views.StripeWebhookView.as_view(), name='orders-webhooks'),
	path('config/', views.OrdersConfigView.as_view(), name='orders-config'),
	path('', views.OrdersListView.as_view(), name='orders-list'),
	path('<int:order_id>/', views.OrderDetailView.as_view(), name='orders-detail'),
]
