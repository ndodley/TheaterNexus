from rest_framework import serializers
from .models import Theater, Screen, Seat


class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = [
            "id",
            "screen",
            "row",
            "number",
            "seat_type",
            "status",
        ]
        read_only_fields = ["screen"]


class ScreenSerializer(serializers.ModelSerializer):
    seat_count = serializers.IntegerField(read_only=True)
    seats = SeatSerializer(many=True, read_only=True)

    class Meta:
        model = Screen
        fields = [
            "id",
            "theater",
            "name",
            "number",
            "is_active",
            "seat_count",
            "seats",
        ]


class TheaterSerializer(serializers.ModelSerializer):
    screen_count = serializers.SerializerMethodField()
    screens = ScreenSerializer(many=True, read_only=True)

    class Meta:
        model = Theater
        fields = [
            "id",
            "name",
            "address",
            "is_active",
            "screen_count",
            "screens",
        ]

    def get_screen_count(self, obj):
        try:
            return obj.screens.count()
        except Exception:
            return 0
