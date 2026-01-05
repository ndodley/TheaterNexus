from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    movie_title = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'user_email', 'movie', 'movie_title', 'rating', 'title', 'content', 'created_at', 'updated_at']
        read_only_fields = ['user', 'movie', 'created_at', 'updated_at']
        extra_kwargs = {
            'movie': {'read_only': True},
            'user': {'read_only': True},
        }

    def get_user_name(self, obj):
        u = getattr(obj, 'user', None)
        return getattr(u, 'username', None) or ''

    def get_user_email(self, obj):
        u = getattr(obj, 'user', None)
        return getattr(u, 'email', '')

    def get_movie_title(self, obj):
        m = getattr(obj, 'movie', None)
        return getattr(m, 'title', '')

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value
