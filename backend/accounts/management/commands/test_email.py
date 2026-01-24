from __future__ import annotations

import traceback

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.emails import send_welcome_or_verification_email


class Command(BaseCommand):
    help = "Send a test verification/welcome email using current EMAIL_* settings."

    def add_arguments(self, parser):
        parser.add_argument("to", nargs="?", help="Email address to send to")

    def handle(self, *args, **options):
        to = (options.get("to") or "").strip()
        if not to:
            self.stdout.write(self.style.ERROR("Usage: manage.py test_email you@example.com"))
            return

        self.stdout.write(f"EMAIL_BACKEND={getattr(settings, 'EMAIL_BACKEND', '')}")
        self.stdout.write(f"EMAIL_HOST={getattr(settings, 'EMAIL_HOST', '')}")
        self.stdout.write(f"EMAIL_PORT={getattr(settings, 'EMAIL_PORT', '')}")
        self.stdout.write(f"EMAIL_USE_TLS={getattr(settings, 'EMAIL_USE_TLS', '')}")
        self.stdout.write(f"DEFAULT_FROM_EMAIL={getattr(settings, 'DEFAULT_FROM_EMAIL', '')}")

        User = get_user_model()
        user, _ = User.objects.get_or_create(
            email=to,
            defaults={"username": to, "first_name": "Test", "last_name": "User"},
        )

        try:
            attempted = send_welcome_or_verification_email(user=user)
            if not attempted:
                self.stdout.write(self.style.WARNING("Skipped (empty or dummy.com email)."))
                return
            self.stdout.write(self.style.SUCCESS("Email send attempted. Check inbox/spam and backend output."))
        except Exception:
            self.stdout.write(self.style.ERROR("Email send raised an exception:"))
            self.stdout.write(traceback.format_exc())
