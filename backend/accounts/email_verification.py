from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from django.conf import settings
from django.core import signing
from django.utils import timezone


DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24  # 24 hours


@dataclass(frozen=True)
class EmailVerificationConfig:
    salt: str
    max_age_seconds: int


def get_email_verification_config() -> EmailVerificationConfig:
    salt = getattr(settings, "EMAIL_VERIFICATION_SALT", "accounts.email_verification")
    max_age = int(getattr(settings, "EMAIL_VERIFICATION_MAX_AGE_SECONDS", DEFAULT_MAX_AGE_SECONDS))
    return EmailVerificationConfig(salt=salt, max_age_seconds=max_age)


def make_email_verification_token(*, user_id: int, email: str) -> str:
    cfg = get_email_verification_config()
    payload = {
        "uid": int(user_id),
        "email": str(email),
        "ts": int(timezone.now().timestamp()),
    }
    return signing.dumps(payload, salt=cfg.salt)


def parse_email_verification_token(token: str) -> Optional[dict]:
    cfg = get_email_verification_config()
    try:
        data = signing.loads(token, salt=cfg.salt, max_age=cfg.max_age_seconds)
        if not isinstance(data, dict):
            return None
        if "uid" not in data or "email" not in data:
            return None
        return data
    except Exception:
        return None
