from __future__ import annotations

from django.db.models import Avg
from django.db.models.signals import post_delete, post_save
from django.db import transaction
from django.dispatch import receiver

from .models import Review


def _recalculate_movie_rating(movie_id):
    """Recompute Movie.rating_average from the live Review average and
    persist it. Movie.rating_average is a plain stored field (also used
    for filtering/sorting on the Movies list and shown on ShowTime
    serializers) -- it was previously never written to after a review
    was created/edited/deleted, so it stayed at its default of 0 no
    matter how many reviews came in. This keeps it in sync going
    forward; see the recalculate_ratings management command for
    backfilling movies that already had reviews before this signal
    existed.
    """
    if movie_id is None:
        return
    # Imported here (not at module level) to avoid a reviews -> movies ->
    # reviews import cycle at app-loading time.
    from movies.models import Movie

    avg = Review.objects.filter(movie_id=movie_id).aggregate(avg=Avg('rating'))['avg'] or 0
    Movie.objects.filter(pk=movie_id).update(rating_average=round(avg, 1))


@receiver(post_save, sender=Review)
def update_movie_rating_on_save(sender, instance, **kwargs):
    transaction.on_commit(lambda: _recalculate_movie_rating(instance.movie_id))


@receiver(post_delete, sender=Review)
def update_movie_rating_on_delete(sender, instance, **kwargs):
    transaction.on_commit(lambda: _recalculate_movie_rating(instance.movie_id))
