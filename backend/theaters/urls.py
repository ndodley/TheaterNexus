from rest_framework.routers import DefaultRouter
from .views import TheaterViewSet, ScreenViewSet, SeatViewSet

router = DefaultRouter()
router.register(r'theaters', TheaterViewSet)
router.register(r'screens', ScreenViewSet)
router.register(r'seats', SeatViewSet)

urlpatterns = router.urls
