from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = 'accounts'

    def ready(self):
        try:
            from . import signals  # noqa: F401
        except Exception:
            # Avoid hard failures during certain management commands.
            pass
