from __future__ import annotations

import os
import smtplib
import ssl

from django.conf import settings
from django.core.mail.backends.smtp import EmailBackend as DjangoEmailBackend


class EmailBackend(DjangoEmailBackend):
    """SMTP backend with optional TLS verification override for local dev.

    Why this exists:
    - Some Windows setups (often AV / corporate proxy TLS interception) can break TLS
      verification with errors like SSLCertVerificationError.

    Controls:
    - EMAIL_INSECURE_TLS=1 disables certificate verification (DEV ONLY).
    - EMAIL_CA_BUNDLE=/path/to/ca.pem lets you provide a custom CA bundle.

    NOTE: Disabling verification is unsafe for production.
    """

    def _build_tls_context(self) -> ssl.SSLContext:
        ctx = ssl.create_default_context()

        ca_bundle = getattr(settings, "EMAIL_CA_BUNDLE", "") or os.getenv("EMAIL_CA_BUNDLE", "")
        if ca_bundle:
            ctx.load_verify_locations(cafile=ca_bundle)

        insecure = bool(getattr(settings, "EMAIL_INSECURE_TLS", False)) or (os.getenv("EMAIL_INSECURE_TLS", "0") == "1")
        if insecure:
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

        return ctx

    def open(self):
        if self.connection is not None:
            return False

        try:
            tls_context = self._build_tls_context()

            if self.use_ssl:
                self.connection = smtplib.SMTP_SSL(
                    self.host,
                    self.port,
                    local_hostname=getattr(self, "local_hostname", None),
                    timeout=self.timeout,
                    context=tls_context,
                )
            else:
                self.connection = smtplib.SMTP(
                    self.host,
                    self.port,
                    local_hostname=getattr(self, "local_hostname", None),
                    timeout=self.timeout,
                )

            self.connection.ehlo()
            if self.use_tls and not self.use_ssl:
                self.connection.starttls(context=tls_context)
                self.connection.ehlo()

            if self.username and self.password:
                self.connection.login(self.username, self.password)

            return True
        except Exception:
            if not self.fail_silently:
                raise
            return False
