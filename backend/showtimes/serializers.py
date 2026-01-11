from rest_framework import serializers
from django.conf import settings
from .models import ShowTime
from theaters.models import Seat
from orders.models import Cart, CartItem, Order, OrderItem
from django.utils import timezone


class ShowTimeSerializer(serializers.ModelSerializer):
    theater = serializers.SerializerMethodField()
    theater_name = serializers.SerializerMethodField()
    theater_address = serializers.SerializerMethodField()
    screen_name = serializers.SerializerMethodField()
    movie_title = serializers.SerializerMethodField()
    movie_image = serializers.SerializerMethodField()
    movie_duration_minutes = serializers.SerializerMethodField()
    movie_rating_average = serializers.SerializerMethodField()
    movie_mpa_rating = serializers.SerializerMethodField()
    movie_mpa_rating_label = serializers.SerializerMethodField()
    seat_count = serializers.IntegerField(read_only=True)
    available_seat_count = serializers.SerializerMethodField()

    class Meta:
        model = ShowTime
        fields = [
            'id', 'movie', 'movie_title', 'movie_image', 'movie_duration_minutes', 'movie_rating_average',
            'movie_mpa_rating', 'movie_mpa_rating_label',
            'screen', 'screen_name', 'theater', 'theater_name', 'theater_address',
            'start_time', 'end_time', 'base_price', 'status',
            'seat_count', 'available_seat_count',
        ]

    def get_theater(self, obj):
        return obj.screen.theater_id

    def get_theater_name(self, obj):
        return obj.screen.theater.name

    def get_theater_address(self, obj):
        try:
            return getattr(obj.screen.theater, 'address', '')
        except Exception:
            return ''

    def get_screen_name(self, obj):
        return obj.screen.name

    def get_movie_title(self, obj):
        return obj.movie.title

    def get_movie_image(self, obj):
        try:
            img = getattr(obj.movie, 'image', None)
            if img:
                name = getattr(img, 'name', '') or ''
                if name.endswith('default_movie.jpg') and 'default_poster/' not in name:
                    media = getattr(settings, 'MEDIA_URL', '/media/')
                    return f"{media.rstrip('/')}/default_poster/default_movie.jpg"
                return img.url
        except Exception:
            pass
        # Fallback to default poster
        media = getattr(settings, 'MEDIA_URL', '/media/')
        return f"{media.rstrip('/')}/default_poster/default_movie.jpg"

    def get_movie_duration_minutes(self, obj):
        try:
            return int(getattr(obj.movie, 'duration_minutes', 0) or 0)
        except Exception:
            return 0

    def get_movie_rating_average(self, obj):
        try:
            return getattr(obj.movie, 'rating_average', 0)
        except Exception:
            return 0

    def get_movie_mpa_rating(self, obj):
        try:
            return getattr(obj.movie, 'mpa_rating', None)
        except Exception:
            return None

    def get_movie_mpa_rating_label(self, obj):
        try:
            # If the movie has the choice set, Django provides get_FOO_display
            return obj.movie.get_mpa_rating_display() if getattr(obj.movie, 'mpa_rating', None) else None
        except Exception:
            return None

    def get_available_seat_count(self, obj):
        try:
            # Total selectable seats are those on the screen that are not BLOCKED
            seats_qs = obj.screen.seats.all()
            blocked_ids = set(seats_qs.filter(status=Seat.SeatStatus.BLOCKED).values_list('id', flat=True))

            # Paid seats
            paid_ids = set(
                OrderItem.objects.filter(
                    showtime=obj,
                    order__status=Order.STATUS_PAID,
                ).values_list('seat_id', flat=True)
            )

            # Held seats (active carts, not expired)
            now = timezone.now()
            held_ids = set(
                CartItem.objects.filter(
                    showtime=obj,
                    hold_expires_at__gt=now,
                    cart__status=Cart.STATUS_ACTIVE,
                ).values_list('seat_id', flat=True)
            )

            unavailable = blocked_ids.union(paid_ids).union(held_ids)
            # Available = seats with status AVAILABLE and not in unavailable set
            available_count = seats_qs.exclude(id__in=list(unavailable)).filter(status=Seat.SeatStatus.AVAILABLE).count()
            return int(available_count)
        except Exception:
            # Fallback to seat_count if anything goes wrong
            try:
                return int(getattr(obj, 'seat_count', 0) or 0)
            except Exception:
                return 0


class SeatSerializer(serializers.ModelSerializer):
    is_available = serializers.SerializerMethodField()
    is_paid = serializers.SerializerMethodField()
    is_held = serializers.SerializerMethodField()

    class Meta:
        model = Seat
        fields = ['id', 'row', 'number', 'seat_type', 'status', 'is_available', 'is_paid', 'is_held']

    def get_is_available(self, obj):
        try:
            ctx = getattr(self, 'context', {}) or {}
            paid_self = ctx.get('paid_self_seat_ids') or set()
            paid_other = ctx.get('paid_other_seat_ids') or set()
            held = ctx.get('held_seat_ids') or set()
            if obj.id in paid_self or obj.id in paid_other or obj.id in held:
                return False
            return obj.status != Seat.SeatStatus.BLOCKED
        except Exception:
            return True

    def get_is_paid(self, obj):
        try:
            ctx = getattr(self, 'context', {}) or {}
            paid_self = ctx.get('paid_self_seat_ids') or set()
            return obj.id in paid_self
        except Exception:
            return False

    def get_is_held(self, obj):
        try:
            ctx = getattr(self, 'context', {}) or {}
            held = ctx.get('held_seat_ids') or set()
            return obj.id in held
        except Exception:
            return False
