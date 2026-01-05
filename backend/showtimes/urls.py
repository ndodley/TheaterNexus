from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ShowTimeViewSet

router = DefaultRouter()
router.register(r'showtimes', ShowTimeViewSet, basename='showtime')

urlpatterns = [
    path('', include(router.urls)),
]
