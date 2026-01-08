from rest_framework import serializers
from django.conf import settings
from .models import ShowTime
from theaters.models import Seat


class ShowTimeSerializer(serializers.ModelSerializer):
    theater = serializers.SerializerMethodField()
    theater_name = serializers.SerializerMethodField()
    screen_name = serializers.SerializerMethodField()
    movie_title = serializers.SerializerMethodField()
    movie_image = serializers.SerializerMethodField()
    seat_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ShowTime
        fields = [
            'id', 'movie', 'movie_title', 'movie_image', 'screen', 'screen_name', 'theater', 'theater_name',
            'start_time', 'end_time', 'base_price', 'status',
            'seat_count',
        ]

    def get_theater(self, obj):
        return obj.screen.theater_id

    def get_theater_name(self, obj):
        return obj.screen.theater.name

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
