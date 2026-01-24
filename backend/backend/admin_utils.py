from __future__ import annotations

import csv
from datetime import date, datetime
from typing import Any, Iterable, List, Optional, Sequence

from django.http import HttpRequest, HttpResponse
from django.urls import path
from django.utils.timezone import is_aware


class ExportCsvAdminMixin:
    """Adds an "Export CSV" button on the admin changelist.

    - Adds a /export-csv/ endpoint under the model changelist.
    - Exports *all* rows for the model (not just selected).
    - Includes concrete fields + local many-to-many fields.
    """

    csv_export_filename: Optional[str] = None

    def get_csv_export_filename(self, request: HttpRequest) -> str:
        if self.csv_export_filename:
            return self.csv_export_filename
        opts = self.model._meta
        return f"{opts.app_label}_{opts.model_name}.csv"

    def get_csv_export_queryset(self, request: HttpRequest):
        qs = self.get_queryset(request)
        m2m_fields = list(getattr(self.model._meta, "many_to_many", []))
        if m2m_fields:
            qs = qs.prefetch_related(*[f.name for f in m2m_fields])
        return qs

    def get_csv_export_field_names(self) -> List[str]:
        # Concrete fields (includes FK id via attname)
        names: List[str] = [f.attname for f in self.model._meta.fields]
        # Local M2M fields
        names.extend([f.name for f in getattr(self.model._meta, "many_to_many", [])])
        return names

    def _format_csv_value(self, value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, bool):
            return "1" if value else "0"
        if isinstance(value, datetime):
            if is_aware(value):
                value = value.astimezone()
            return value.isoformat(sep=" ")
        if isinstance(value, date):
            return value.isoformat()
        return str(value)

    def get_csv_export_row(self, obj: Any, field_names: Sequence[str], request: HttpRequest) -> List[str]:
        """Return a single CSV row for an object.

        Override in ModelAdmin subclasses when you need a custom export schema
        (e.g., to match a bulk-upload template).
        """
        m2m_field_names = {f.name for f in getattr(self.model._meta, "many_to_many", [])}
        row: List[str] = []
        for name in field_names:
            if name in m2m_field_names:
                try:
                    rel = getattr(obj, name)
                    row.append(", ".join(self._format_csv_value(x) for x in rel.all()))
                except Exception:
                    row.append("")
                continue

            try:
                row.append(self._format_csv_value(getattr(obj, name)))
            except Exception:
                row.append("")
        return row

    def export_csv_view(self, request: HttpRequest) -> HttpResponse:
        if not self.has_view_or_change_permission(request):
            return HttpResponse("Forbidden", status=403)

        qs = self.get_csv_export_queryset(request)
        field_names = self.get_csv_export_field_names()

        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{self.get_csv_export_filename(request)}"'

        # UTF-8 BOM helps Excel open UTF-8 CSV correctly.
        response.write("\ufeff")

        writer = csv.writer(response)
        writer.writerow(field_names)

        m2m_field_names = {f.name for f in getattr(self.model._meta, "many_to_many", [])}

        # If we prefetched M2M relations, Django requires either a chunk_size for iterator()
        # or normal iteration (which will use the prefetch cache).
        iterable: Iterable[Any]
        if m2m_field_names:
            iterable = qs
        else:
            iterable = qs.iterator(chunk_size=2000)

        for obj in iterable:
            writer.writerow(self.get_csv_export_row(obj, field_names, request))

        return response

    def get_urls(self):
        urls = super().get_urls()  # type: ignore[misc]
        custom = [
            path(
                "export-csv/",
                self.admin_site.admin_view(self.export_csv_view),
                name=f"{self.model._meta.app_label}_{self.model._meta.model_name}_export_csv",
            )
        ]
        return custom + urls
