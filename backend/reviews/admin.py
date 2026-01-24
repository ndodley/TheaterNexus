from django.contrib import admin
from .models import Review
from backend.admin_utils import ExportCsvAdminMixin


@admin.register(Review)
class ReviewAdmin(ExportCsvAdminMixin, admin.ModelAdmin):
	list_display = ('movie', 'user', 'rating', 'title', 'created_at', 'updated_at')
	list_filter = ('rating', 'movie')
	search_fields = ('user__username', 'user__email', 'movie__title', 'title')
	change_list_template = "admin/csv_export_change_list.html"
