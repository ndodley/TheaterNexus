from rest_framework import serializers
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
            return img.url if img else None
        except Exception:
            return None


class SeatSerializer(serializers.ModelSerializer):
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Seat
        fields = ['id', 'row', 'number', 'seat_type', 'status', 'is_available']

    def get_is_available(self, obj):
        try:
            return obj.status != Seat.SeatStatus.BLOCKED
        except Exception:
            return True
