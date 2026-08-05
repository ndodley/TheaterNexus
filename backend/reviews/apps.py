from django.apps import AppConfig


class ReviewsConfig(AppConfig):
    name = 'reviews'

    def ready(self):
        try:
            from . import signals  # noqa: F401
        except Exception:
            # Avoid hard failures during certain management commands.
            pass
