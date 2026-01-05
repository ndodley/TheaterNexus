from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
	list_display = ('id', 'movie', 'user', 'rating', 'created_at')
	list_filter = ('rating', 'created_at', 'movie')
	search_fields = ('movie__title', 'user__email', 'user__username', 'title', 'content')

# Register your models here.
