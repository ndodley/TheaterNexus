from django.contrib import admin
from .models import Genre, Movie


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
	search_fields = ["name"]
	list_display = ["id", "name"]


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
	list_display = [
		"id",
		"title",
		"availability_status",
		"release_date",
		"duration_minutes",
		"rating_average",
	]
	list_filter = ["availability_status", "release_date", "genres"]
	search_fields = ["title", "plot_summary"]
	filter_horizontal = ["genres"]
