from rest_framework import serializers
from django.conf import settings
from .models import Genre, Movie, Favorite


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "name"]


class MovieSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    mpa_rating_label = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = [
            "id",
            "title",
            "duration_minutes",
            "image",
            "image_url",
            "plot_summary",
            "release_date",
            "rating_average",
            "mpa_rating",
            "mpa_rating_label",
            "is_favorite",
            "availability_status",
            "genres",
        ]

    def get_image_url(self, obj: Movie):
        request = self.context.get('request') if hasattr(self, 'context') else None
        url = None
        if getattr(obj, 'image', None):
            try:
                # If legacy default path was saved, remap to new location
                name = getattr(obj.image, 'name', '') or ''
                if name.endswith('default_movie.jpg') and 'default_poster/' not in name:
                    media = getattr(settings, 'MEDIA_URL', '/media/')
                    url = f"{media.rstrip('/')}/default_poster/default_movie.jpg"
                else:
                    url = obj.image.url
            except Exception:
                url = None
        # Fallback to default poster if no image set
        if not url and getattr(settings, 'MEDIA_URL', None):
            url = f"{settings.MEDIA_URL.rstrip('/')}/default_poster/default_movie.jpg"
        return request.build_absolute_uri(url) if (request and url and url.startswith('/')) else url

    def get_mpa_rating_label(self, obj: Movie):
        try:
            # Django provides get_FOO_display() for choice fields
            return obj.get_mpa_rating_display() if obj.mpa_rating else None
        except Exception:
            return None

    def get_is_favorite(self, obj: Movie):
        request = self.context.get('request') if hasattr(self, 'context') else None
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False
        try:
            return Favorite.objects.filter(user=user, movie=obj).exists()
        except Exception:
            return False
