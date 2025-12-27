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

	title = models.CharField(max_length=255)
	duration_minutes = models.PositiveSmallIntegerField()
	image = models.ImageField(upload_to="movie_posters/", blank=True, null=True)
	plot_summary = models.TextField(blank=True)
	release_date = models.DateField(blank=True, null=True)
	rating_average = models.DecimalField(max_digits=3, decimal_places=1, default=0)
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

# Create your models here.
