from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
	list_display = ('movie', 'user', 'rating', 'title', 'created_at', 'updated_at')
	list_filter = ('rating', 'movie')
	search_fields = ('user__username', 'user__email', 'movie__title', 'title')
