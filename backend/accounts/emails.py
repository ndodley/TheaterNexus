from __future__ import annotations

from urllib.parse import quote

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from .email_verification import make_email_verification_token


def _is_fake_email(email: str) -> bool:
    if not email:
        return True
    email = email.strip().lower()
    if "@" not in email:
        return True
    domain = email.split("@", 1)[1]
    return domain == "dummy.com"


def build_frontend_verify_email_url(token: str) -> str:
    base = getattr(settings, "FRONTEND_BASE_URL", "").strip() or "http://localhost:5173"
    base = base.rstrip("/")
    return f"{base}/verify-email?token={quote(token)}"


def send_welcome_or_verification_email(*, user) -> bool:
    """Send a confirmation email for newly-created users.

    - Skips @dummy.com addresses.
    - Uses the configured EMAIL_BACKEND.

    Returns True if we attempted to send, False if skipped.
    """

    email = (getattr(user, "email", "") or "").strip()
    if not email or _is_fake_email(email):
        return False

    token = make_email_verification_token(user_id=user.pk, email=email)
    verify_url = build_frontend_verify_email_url(token)

    # Console backend prints MIME-encoded bodies which can wrap long URLs.
    # For local dev, also print a clean link line to make testing painless.
    if bool(getattr(settings, "DEBUG", False)):
        try:
            print(f"[EmailLink] {email} -> {verify_url}")
        except Exception:
            pass

    context = {
        "user": user,
        "verify_url": verify_url,
        "product_name": getattr(settings, "PRODUCT_NAME", "Theater Nexus"),
        "support_email": getattr(settings, "SUPPORT_EMAIL", getattr(settings, "DEFAULT_FROM_EMAIL", "")),
    }

    # If the user is already verified (e.g. Google), we still send a modern "Welcome" email
    # with the verify link as a no-harm fallback.
    already_verified = bool(getattr(user, "email_verified", False))

    subject = (
        f"Welcome to {context['product_name']}"
        if already_verified
        else f"Confirm your email for {context['product_name']}"
    )

    text_template = "emails/welcome.txt" if already_verified else "emails/verify_email.txt"
    html_template = "emails/welcome.html" if already_verified else "emails/verify_email.html"

    text_body = render_to_string(text_template, context)
    html_body = render_to_string(html_template, context)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=[email],
    )
    msg.attach_alternative(html_body, "text/html")
    # Never break user flows due to email problems, but DO print why it failed.
    try:
        msg.send(fail_silently=False)
    except Exception as exc:
        try:
            backend = getattr(settings, "EMAIL_BACKEND", "")
            host = getattr(settings, "EMAIL_HOST", "")
            port = getattr(settings, "EMAIL_PORT", "")
            use_tls = getattr(settings, "EMAIL_USE_TLS", "")
            print(f"[EmailError] backend={backend} host={host} port={port} tls={use_tls} to={email} err={exc!r}")
        except Exception:
            pass
    return True
