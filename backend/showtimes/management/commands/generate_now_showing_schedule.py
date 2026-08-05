from datetime import datetime, time, timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from movies.models import Movie
from showtimes.models import ShowTime
from theaters.models import Screen

DEFAULT_TIMES = "11:00,14:30,18:00,21:00"
DEFAULT_BASE_PRICE = 12.50


class Command(BaseCommand):
	"""
	Generates a showtime schedule for every "Now Showing" movie, across every
	active theater, over a date range (default: today through 30 days from
	today).

	This is the same "one screen per theater per day, skip on conflict/
	duplicate" algorithm as the ShowTime admin's "Generate schedule" action
	(showtimes/admin.py's GenerateScheduleActionForm/generate_schedule) --
	just looped over every Now Showing movie automatically instead of
	requiring one manual form submission per movie.

	Usage:
	  python manage.py generate_now_showing_schedule
	  python manage.py generate_now_showing_schedule --dry-run
	  python manage.py generate_now_showing_schedule --start 2026-08-04 --end 2026-09-03 --times "11:00,14:30,18:00,21:00" --base-price 12.50
	"""

	help = (
		"Generate showtimes for every Now Showing movie across all active theaters, "
		"from --start (default: today) through --end (default: 30 days later)."
	)

	def add_arguments(self, parser):
		parser.add_argument("--start", type=str, default=None, help="Start date YYYY-MM-DD (default: today)")
		parser.add_argument("--end", type=str, default=None, help="End date YYYY-MM-DD (default: 30 days after --start)")
		parser.add_argument(
			"--times", type=str, default=DEFAULT_TIMES,
			help=f"Comma-separated HH:MM start times generated every day (default: {DEFAULT_TIMES})",
		)
		parser.add_argument(
			"--base-price", type=float, default=DEFAULT_BASE_PRICE,
			help=f"Base ticket price for generated showtimes (default: {DEFAULT_BASE_PRICE})",
		)
		parser.add_argument(
			"--status", type=str, default=ShowTime.STATUS_ON_SALE,
			choices=[c[0] for c in ShowTime.STATUS_CHOICES],
			help="Status for generated showtimes (default: on_sale)",
		)
		parser.add_argument("--theater", type=int, default=None, help="Limit generation to one theater id (default: all active theaters)")
		parser.add_argument("--dry-run", action="store_true", help="Report what would be created without writing anything")

	def handle(self, *args, **options):
		today = timezone.localdate()
		start_date = self._parse_date(options["start"]) or today
		end_date = self._parse_date(options["end"]) or (start_date + timedelta(days=30))
		if end_date < start_date:
			raise CommandError("--end must be on or after --start")

		parsed_times = self._parse_times(options["times"])
		if not parsed_times:
			raise CommandError("No valid --times provided (expected comma-separated HH:MM, e.g. 11:00,14:30)")

		base_price = options["base_price"]
		status = options["status"]
		dry_run = options["dry_run"]

		movies = list(Movie.objects.filter(availability_status=Movie.Availability.NOW_SHOWING))
		if not movies:
			self.stdout.write(self.style.WARNING("No movies are marked Now Showing -- nothing to generate."))
			return

		all_screens = list(Screen.objects.filter(is_active=True).select_related("theater").order_by("theater_id", "id"))
		if options["theater"]:
			all_screens = [s for s in all_screens if s.theater_id == options["theater"]]
		if not all_screens:
			raise CommandError("No active screens found (check the --theater id, if given).")

		theater_ids = []
		seen = set()
		for scr in all_screens:
			if scr.theater_id not in seen:
				seen.add(scr.theater_id)
				theater_ids.append(scr.theater_id)

		tz = timezone.get_current_timezone()
		buffer_min = int(getattr(settings, "SHOWTIME_BUFFER_MINUTES", 15))

		def screen_fits(screen_obj, the_date, duration_min):
			for tt in parsed_times:
				start_dt = timezone.make_aware(datetime.combine(the_date, tt), tz)
				end_dt = start_dt + timedelta(minutes=duration_min + buffer_min)
				conflict = (
					ShowTime.objects.filter(screen=screen_obj)
					.exclude(status=ShowTime.STATUS_CANCELED)
					.filter(start_time__lt=end_dt, end_time__gt=start_dt)
					.exists()
				)
				if conflict:
					return False
			return True

		self.stdout.write(
			f"Generating for {len(movies)} Now Showing movie(s) across {len(theater_ids)} theater(s), "
			f"{start_date} through {end_date}, times={','.join(t.strftime('%H:%M') for t in parsed_times)}"
			f"{' (dry run)' if dry_run else ''}..."
		)

		total_created = 0
		total_skipped = 0
		for movie in movies:
			duration_min = int(getattr(movie, "duration_minutes", 0) or 0)
			created = 0
			skipped = 0
			current = start_date
			while current <= end_date:
				for tid in theater_ids:
					candidates = [scr for scr in all_screens if scr.theater_id == tid]
					chosen_screen = None
					for scr in candidates:
						if screen_fits(scr, current, duration_min):
							chosen_screen = scr
							break
					if not chosen_screen:
						# No single screen in this theater can host every requested
						# time slot that day without a conflict -- skip (mirrors the
						# admin action's overlap_skipped behavior).
						skipped += len(parsed_times)
						continue
					for tt in parsed_times:
						start_dt = timezone.make_aware(datetime.combine(current, tt), tz)
						if ShowTime.objects.filter(screen=chosen_screen, start_time=start_dt).exists():
							skipped += 1
							continue
						if dry_run:
							created += 1
							continue
						obj = ShowTime(movie=movie, screen=chosen_screen, start_time=start_dt, base_price=base_price, status=status)
						try:
							obj.full_clean()
							obj.save()
							created += 1
						except Exception:
							skipped += 1
				current += timedelta(days=1)
			total_created += created
			total_skipped += skipped
			self.stdout.write(f"  {movie.title}: {'would create' if dry_run else 'created'} {created}, skipped {skipped}")

		verb = "Would create" if dry_run else "Created"
		self.stdout.write(self.style.SUCCESS(
			f"{verb} {total_created} showtime(s) total ({total_skipped} skipped)."
		))

	@staticmethod
	def _parse_date(value):
		if not value:
			return None
		try:
			return datetime.strptime(value, "%Y-%m-%d").date()
		except ValueError:
			raise CommandError(f"Invalid date '{value}' -- expected YYYY-MM-DD")

	@staticmethod
	def _parse_times(times_str):
		parsed = []
		for part in times_str.split(","):
			part = part.strip()
			if not part:
				continue
			try:
				hh, mm = part.split(":")
				parsed.append(time(int(hh), int(mm)))
			except Exception:
				raise CommandError(f"Invalid time '{part}' -- expected HH:MM")
		return parsed
