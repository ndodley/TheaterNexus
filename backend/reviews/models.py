from django.db import models
from django.conf import settings


class Review(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
	movie = models.ForeignKey('movies.Movie', on_delete=models.CASCADE, related_name='reviews')
	rating = models.PositiveSmallIntegerField()
	title = models.CharField(max_length=200, blank=True)
	content = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-created_at']
		constraints = [
			models.CheckConstraint(check=models.Q(rating__gte=1) & models.Q(rating__lte=5), name='rating_between_1_and_5'),
			models.UniqueConstraint(fields=['user', 'movie'], name='unique_review_per_user_movie'),
		]

	def __str__(self) -> str:
		return f"Review {self.id} — {self.movie_id} by {self.user_id} ({self.rating})"

# Create your models here.
