from django.db import models


class Genre(models.Model):
	name = models.CharField(max_length=100, unique=True)

	class Meta:
		ordering = ["name"]

	def __str__(self) -> str:
		return self.name


class Movie(models.Model):
	class Availability(models.TextChoices):
		COMING_SOON = "COMING_SOON", "Coming Soon"
		NOW_SHOWING = "NOW_SHOWING", "Now Showing"
		ENDED = "ENDED", "Ended"

	class MpaRating(models.TextChoices):
		G = "G", "G (General Audiences)"
		PG = "PG", "PG (Parental Guidance Suggested)"
		PG_13 = "PG-13", "PG-13 (Parents Strongly Cautioned)"
		R = "R", "R (Restricted)"
		NC_17 = "NC-17", "NC-17 (Adults Only)"

	title = models.CharField(max_length=255)
	duration_minutes = models.PositiveSmallIntegerField()
	image = models.ImageField(upload_to="movie_posters/", blank=True, null=True)
	plot_summary = models.TextField(blank=True)
	release_date = models.DateField(blank=True, null=True)
	rating_average = models.DecimalField(max_digits=3, decimal_places=1, default=0)
	mpa_rating = models.CharField(
		max_length=6,
		choices=MpaRating.choices,
		blank=True,
		null=True,
		help_text="MPA rating (e.g., G, PG, PG-13, R, NC-17)",
	)
	availability_status = models.CharField(
		max_length=20,
		choices=Availability.choices,
		default=Availability.COMING_SOON,
	)
	genres = models.ManyToManyField(Genre, related_name="movies", blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-release_date", "title"]

	def __str__(self) -> str:
		return self.title

	def save(self, *args, **kwargs):
		# If updating an existing record, remember the previous image name
		old_name = None
		if self.pk:
			try:
				old = Movie.objects.get(pk=self.pk)
				old_name = old.image.name if old.image else None
			except Movie.DoesNotExist:
				old_name = None

		# If no image provided, use a shared default poster in MEDIA_ROOT.
		# Expects a file named 'default_movie.jpg' to exist under MEDIA_ROOT/default_poster/.
		if not self.image:
			# Setting the name tells ImageField to reference an existing file; no copy occurs.
			self.image.name = "default_poster/default_movie.jpg"

		super().save(*args, **kwargs)

		# If the image was replaced, delete the old file to avoid orphaned media
		try:
			if old_name and old_name != (self.image.name if self.image else None):
				if old_name and "default_poster/default_movie.jpg" not in old_name:
					self.image.storage.delete(old_name)
		except Exception:
			# Silently ignore storage errors; do not break save
			pass

	def delete(self, *args, **kwargs):
		# On delete, remove the image file from storage unless it's the shared default
		img_name = None
		try:
			img_name = self.image.name if self.image else None
		except Exception:
			img_name = None

		super().delete(*args, **kwargs)

		try:
			if img_name and "default_poster/default_movie.jpg" not in img_name:
				self.image.storage.delete(img_name)
		except Exception:
			# Silently ignore storage errors; deletion of DB record should not fail
			pass

# Create your models here.
