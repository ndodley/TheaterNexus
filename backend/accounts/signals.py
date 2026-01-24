from __future__ import annotations

from django.conf import settings
from django.db.models.signals import post_save
from django.db import transaction
from django.dispatch import receiver

from .emails import send_welcome_or_verification_email


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def send_confirmation_email_on_create(sender, instance, created: bool, **kwargs):
    if not created:
        return
    # Fire-and-forget confirmation email; skips dummy.com automatically.
    # Never break the request if email delivery fails.
    def _safe_send():
        try:
            send_welcome_or_verification_email(user=instance)
        except Exception:
            pass

    transaction.on_commit(_safe_send)
