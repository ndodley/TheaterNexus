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
		ordering = ['-updated_at']

	def __str__(self):
		return f"Review({self.movie_id}) by {self.user_id} ⭐{self.rating}"
