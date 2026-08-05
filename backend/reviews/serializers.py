from rest_framework import serializers
from django.conf import settings
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    movie_title = serializers.SerializerMethodField()
    movie_image = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'user_email', 'movie', 'movie_title', 'movie_image', 'rating', 'title', 'content', 'created_at', 'updated_at']
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

    def get_movie_image(self, obj):
        # Mirrors ShowTimeSerializer.get_movie_image so a review's poster
        # renders identically to every other poster in the app (including
        # the legacy default-poster path remap).
        try:
            m = getattr(obj, 'movie', None)
            img = getattr(m, 'image', None)
            if img:
                name = getattr(img, 'name', '') or ''
                if name.endswith('default_movie.jpg') and 'default_poster/' not in name:
                    media = getattr(settings, 'MEDIA_URL', '/media/')
                    return f"{media.rstrip('/')}/default_poster/default_movie.jpg"
                return img.url
        except Exception:
            pass
        media = getattr(settings, 'MEDIA_URL', '/media/')
        return f"{media.rstrip('/')}/default_poster/default_movie.jpg"

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value
