from django.contrib import admin, messages
from django.http import HttpResponse, HttpRequest
from django.shortcuts import redirect, render
from django.urls import path
from django.core.files.base import ContentFile
import csv
import io
from datetime import datetime
import os
from urllib.parse import urlparse
from urllib.request import urlopen

from .models import Genre, Movie
from backend.admin_utils import ExportCsvAdminMixin


@admin.register(Genre)
class GenreAdmin(ExportCsvAdminMixin, admin.ModelAdmin):
	search_fields = ["name"]
	list_display = ["id", "name"]
	change_list_template = "admin/csv_export_change_list.html"


@admin.register(Movie)
class MovieAdmin(ExportCsvAdminMixin, admin.ModelAdmin):
	csv_export_filename = "movies.csv"
	actions = ["mark_as_now_showing", "mark_as_coming_soon", "mark_as_ended"]
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

	@admin.action(description="Mark selected movies as Now Showing")
	def mark_as_now_showing(self, request, queryset):
		updated = queryset.update(availability_status=Movie.Availability.NOW_SHOWING)
		self.message_user(request, f"{updated} movie(s) marked as Now Showing.", level=messages.SUCCESS)

	@admin.action(description="Mark selected movies as Coming Soon")
	def mark_as_coming_soon(self, request, queryset):
		updated = queryset.update(availability_status=Movie.Availability.COMING_SOON)
		self.message_user(request, f"{updated} movie(s) marked as Coming Soon.", level=messages.SUCCESS)

	@admin.action(description="Mark selected movies as Ended")
	def mark_as_ended(self, request, queryset):
		updated = queryset.update(availability_status=Movie.Availability.ENDED)
		self.message_user(request, f"{updated} movie(s) marked as Ended.", level=messages.SUCCESS)

	# Use a custom changelist template to surface object-tools links
	change_list_template = "admin/movies/movie/change_list.html"

	def get_csv_export_field_names(self):
		# Match the movies bulk-upload template schema.
		return [
			"title",
			"duration_minutes",
			"plot_summary",
			"release_date",
			"availability_status",
			"rating_average",
			"genres",
			"image_url",
		]

	def get_csv_export_row(self, obj, field_names, request):
		genres = ""
		try:
			genres = ",".join(g.name for g in obj.genres.all().order_by('name'))
		except Exception:
			genres = ""

		release_date = ""
		try:
			release_date = obj.release_date.isoformat() if obj.release_date else ""
		except Exception:
			release_date = ""

		# image_url is intended for remote poster ingestion in bulk upload.
		# We leave it blank so exported files can be re-imported safely without
		# accidentally trying to fetch local /media/ URLs.
		return [
			(getattr(obj, 'title', '') or '').strip(),
			str(getattr(obj, 'duration_minutes', '') or ''),
			(getattr(obj, 'plot_summary', '') or ''),
			release_date,
			(getattr(obj, 'availability_status', '') or ''),
			str(getattr(obj, 'rating_average', '') or ''),
			genres,
			"",
		]

	def _parse_release_date(self, value: str):
		"""Parse a variety of date formats, returning date or raising ValueError."""
		value = (value or "").strip()
		if not value:
			return None
		formats = [
			"%Y-%m-%d",
			"%m/%d/%Y",
			"%d/%m/%Y",
			"%Y/%m/%d",
			"%m-%d-%Y",
			"%d-%m-%Y",
			"%m/%d/%y",
			"%d/%m/%y",
			"%Y.%m.%d",
		]
		for fmt in formats:
			try:
				return datetime.strptime(value, fmt).date()
			except Exception:
				pass
		raise ValueError("release_date must be YYYY-MM-DD or MM/DD/YYYY")

	def get_urls(self):
		urls = super().get_urls()
		custom = [
			path("bulk-upload/", self.admin_site.admin_view(self.bulk_upload_view), name="movies_movie_bulk_upload"),
			path("bulk-template/", self.admin_site.admin_view(self.bulk_template_view), name="movies_movie_bulk_template"),
		]
		return custom + urls

	def bulk_template_view(self, request: HttpRequest):
		# Provide a downloadable CSV template with headers
		headers = [
			"title",
			"duration_minutes",
			"plot_summary",
			"release_date",
			"availability_status",
			"rating_average",
			"genres",  # comma-separated genre names
			"image_url",  # optional remote image url
		]
		response = HttpResponse(content_type="text/csv")
		response["Content-Disposition"] = 'attachment; filename="movies_template.csv"'
		writer = csv.writer(response)
		writer.writerow(headers)
		# Example row
		writer.writerow([
			"Example Movie",
			"120",
			"A short plot summary...",
			"2026-01-01",
			Movie.Availability.NOW_SHOWING,
			"7.5",
			"Action,Adventure",
			"https://example.com/posters/example-movie.jpg",
		])
		return response

	def bulk_upload_view(self, request: HttpRequest):
		if request.method == "POST":
			# Confirm import step
			if request.POST.get("confirm") == "1":
				csv_text = request.session.get("movies_bulk_upload_csv")
				if not csv_text:
					self.message_user(request, "No CSV found in session. Please upload again.", level=messages.ERROR)
					return redirect(".")
				try:
					reader = csv.DictReader(io.StringIO(csv_text))
					created = 0
					updated = 0
					errors = []
					for idx, row in enumerate(reader, start=2):
						try:
							title = (row.get("title") or '').strip()
							duration = int((row.get("duration_minutes") or '0').strip())
							plot = (row.get("plot_summary") or '').strip()
							release_raw = (row.get("release_date") or '').strip()
							availability = (row.get("availability_status") or Movie.Availability.COMING_SOON).strip() or Movie.Availability.COMING_SOON
							rating_raw = (row.get("rating_average") or '0').strip()
							genres_raw = (row.get("genres") or '').strip()
							image_url = (row.get("image_url") or '').strip()

							if not title or duration <= 0:
								raise ValueError("title and positive duration_minutes are required")

							release_date = None
							if release_raw:
								release_date = self._parse_release_date(release_raw)

							try:
								rating = float(rating_raw)
							except Exception:
								rating = 0.0

							if availability not in dict(Movie.Availability.choices):
								raise ValueError(f"invalid availability_status: {availability}")

							movie, is_created = Movie.objects.get_or_create(
								title=title,
								defaults={
									"duration_minutes": duration,
									"plot_summary": plot,
									"release_date": release_date,
									"availability_status": availability,
									"rating_average": rating,
								},
							)
							if not is_created:
								movie.duration_minutes = duration
								movie.plot_summary = plot
								movie.release_date = release_date
								movie.availability_status = availability
								movie.rating_average = rating
								movie.save()
								updated += 1
							else:
								created += 1

							# Genres
							if genres_raw:
								names = [g.strip() for g in genres_raw.replace("|", ",").split(",") if g.strip()]
								genre_objs = []
								for name in names:
									genre_obj, _ = Genre.objects.get_or_create(name=name)
									genre_objs.append(genre_obj)
								movie.genres.set(genre_objs)

							# Image download
							if image_url:
								try:
									parsed = urlparse(image_url)
									basename = os.path.basename(parsed.path) or "poster.jpg"
									if basename in ("", "/"):
										basename = f"{movie.title.strip().replace(' ', '_').lower()}.jpg"
									with urlopen(image_url, timeout=10) as resp:
										data = resp.read()
									movie.image.save(basename, ContentFile(data), save=True)
								except Exception as img_err:
									errors.append(f"Row {idx}: image_url download failed: {img_err}")

						except Exception as e:
							errors.append(f"Row {idx}: {e}")

					if errors:
						for msg in errors[:10]:
							self.message_user(request, msg, level=messages.ERROR)
						self.message_user(request, f"Completed with errors. Created {created}, updated {updated}, errors {len(errors)}", level=messages.WARNING)
					else:
						self.message_user(request, f"Bulk upload complete. Created {created}, updated {updated}", level=messages.SUCCESS)
					# clear session csv
					request.session.pop("movies_bulk_upload_csv", None)
					return redirect("..")
				except Exception as e:
					self.message_user(request, f"Bulk upload failed: {e}", level=messages.ERROR)
					return redirect("..")

			# Preview step: parse and show grid
			if request.FILES.get("csv_file"):
				file = request.FILES["csv_file"]
				try:
					data = io.TextIOWrapper(file.file, encoding="utf-8-sig")
					csv_text = data.read()
					# store raw text in session for confirmation
					request.session["movies_bulk_upload_csv"] = csv_text
					reader = csv.DictReader(io.StringIO(csv_text))
					preview_rows = []
					will_create = 0
					will_update = 0
					error_count = 0
					for idx, row in enumerate(reader, start=2):
						row_errors = []
						title = (row.get("title") or '').strip()
						duration_raw = (row.get("duration_minutes") or '').strip()
						plot = (row.get("plot_summary") or '').strip()
						release_raw = (row.get("release_date") or '').strip()
						availability = (row.get("availability_status") or Movie.Availability.COMING_SOON).strip() or Movie.Availability.COMING_SOON
						rating_raw = (row.get("rating_average") or '').strip()
						genres_raw = (row.get("genres") or '').strip()
						image_url = (row.get("image_url") or '').strip()

						if not title:
							row_errors.append("title is required")
						try:
							duration = int(duration_raw)
							if duration <= 0:
								raise ValueError()
						except Exception:
							row_errors.append("duration_minutes must be a positive integer")

						release_date = None
						if release_raw:
							try:
								release_date = self._parse_release_date(release_raw)
							except Exception:
								row_errors.append("release_date must be YYYY-MM-DD or MM/DD/YYYY")

						try:
							rating = float(rating_raw) if rating_raw else 0.0
						except Exception:
							row_errors.append("rating_average must be a number")

						if availability not in dict(Movie.Availability.choices):
							row_errors.append(f"invalid availability_status: {availability}")

						exists = bool(title and Movie.objects.filter(title=title).exists())
						action = "update" if exists else "create"
						if action == "create":
							will_create += 1
						else:
							will_update += 1

						if row_errors:
							error_count += 1

						preview_rows.append({
							"row": idx,
							"title": title,
							"duration_minutes": duration_raw,
							"plot_summary": plot,
							"release_date": release_raw,
							"availability_status": availability,
							"rating_average": rating_raw,
							"genres": genres_raw,
							"image_url": image_url,
							"action": action,
							"errors": row_errors,
						})

					context = {
						"title": "Preview movies CSV",
						"opts": self.model._meta,
						"rows": preview_rows,
						"will_create": will_create,
						"will_update": will_update,
						"error_count": error_count,
					}
					return render(request, "admin/movies/movie/bulk_preview.html", context)
				except Exception as e:
					self.message_user(request, f"Failed to parse CSV: {e}", level=messages.ERROR)
					return redirect(".")
			# No file uploaded on POST
			self.message_user(request, "Please choose a CSV file.", level=messages.ERROR)
			return redirect(".")

		# GET: render upload form
		context = {
			"title": "Bulk upload movies",
			"opts": self.model._meta,
		}
		return render(request, "admin/movies/movie/bulk_upload.html", context)
