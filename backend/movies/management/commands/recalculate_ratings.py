from decimal import Decimal, ROUND_HALF_UP

from django.core.management.base import BaseCommand
from django.db.models import Avg, Count

from movies.models import Movie
from reviews.models import Review


class Command(BaseCommand):
    help = (
        "Recompute Movie.rating_average for every movie (or one movie) from its "
        "actual Review rows. rating_average is a stored field -- reviews/signals.py "
        "now keeps it in sync going forward whenever a review is created, edited, "
        "or deleted, but that signal can't retroactively fix movies that already "
        "had reviews before it existed. Run this once to backfill those."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--movie",
            type=int,
            default=None,
            help="Only recalculate this one movie's id (default: every movie).",
        )

    def handle(self, *args, **options):
        movie_id = options.get("movie")
        movies = Movie.objects.all()
        if movie_id is not None:
            movies = movies.filter(pk=movie_id)
            if not movies.exists():
                self.stderr.write(self.style.ERROR(f"No movie with id={movie_id}."))
                return

        updated = 0
        unchanged = 0
        for movie in movies.only("id", "title", "rating_average"):
            agg = Review.objects.filter(movie_id=movie.id).aggregate(avg=Avg("rating"), count=Count("id"))
            count = agg["count"] or 0
            new_avg = Decimal("0.0")
            if count:
                new_avg = Decimal(str(agg["avg"])).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)

            if movie.rating_average != new_avg:
                old_avg = movie.rating_average
                Movie.objects.filter(pk=movie.id).update(rating_average=new_avg)
                updated += 1
                self.stdout.write(
                    f"  {movie.title} (id={movie.id}): {old_avg} -> {new_avg}  ({count} review{'s' if count != 1 else ''})"
                )
            else:
                unchanged += 1

        self.stdout.write(self.style.SUCCESS(f"Done. Updated {updated} movie(s), {unchanged} already correct."))
