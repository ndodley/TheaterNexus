from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.conf import settings


class ShowTime(models.Model):
	STATUS_PLANNED = 'planned'
	STATUS_ON_SALE = 'on_sale'
	STATUS_CANCELED = 'canceled'
	STATUS_ENDED = 'ended'

	STATUS_CHOICES = [
		(STATUS_PLANNED, 'Planned'),
		(STATUS_ON_SALE, 'On Sale'),
		(STATUS_CANCELED, 'Canceled'),
		(STATUS_ENDED, 'Ended'),
	]

	movie = models.ForeignKey('movies.Movie', on_delete=models.CASCADE, related_name='showtimes')
	screen = models.ForeignKey('theaters.Screen', on_delete=models.CASCADE, related_name='showtimes')

	start_time = models.DateTimeField()
	end_time = models.DateTimeField(null=True, blank=True)

	base_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
	status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PLANNED)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['start_time']
		indexes = [
			models.Index(fields=['screen', 'start_time']),
			models.Index(fields=['movie', 'start_time']),
		]
		constraints = [
			# Prevent identical start times on the same screen (soft guard; overlap check handled in clean())
			models.UniqueConstraint(fields=['screen', 'start_time'], name='uniq_screen_start_time'),
		]

	def __str__(self):
		return f"{self.movie} @ {self.screen} on {timezone.localtime(self.start_time).strftime('%Y-%m-%d %H:%M')}"

	def clean(self):
		# Ensure start < end (compute inline if needed for validation)
		from datetime import timedelta
		end_time = self.end_time
		if self.start_time and end_time is None and self.movie_id:
			buffer_min = getattr(settings, 'SHOWTIME_BUFFER_MINUTES', 15)
			duration = int(getattr(self.movie, 'duration_minutes', 0) or 0)
			end_time = self.start_time + timedelta(minutes=duration + buffer_min)
		if end_time and self.start_time and end_time <= self.start_time:
			raise ValidationError({'end_time': 'End time must be after start time.'})

		# Overlap guard: no overlapping showtimes on the same screen (excluding canceled)
		# Use computed end_time if field is not yet set
		if self.screen_id and self.start_time and (end_time or self.end_time):
			qs = ShowTime.objects.filter(screen_id=self.screen_id).exclude(status=self.STATUS_CANCELED)
			if self.pk:
				qs = qs.exclude(pk=self.pk)
			check_end = end_time or self.end_time
			overlapping = qs.filter(start_time__lt=check_end, end_time__gt=self.start_time).exists()
			if overlapping:
				raise ValidationError('This showtime overlaps another on the same screen.')

		# Business rule: a movie should play in only one room per theater per day
		# Prevent mixing screens within the same theater for the same movie on the same date
		if self.screen_id and self.movie_id and self.start_time:
			from datetime import datetime, time as dtime, timedelta
			# Determine local date boundaries
			local_dt = timezone.localtime(self.start_time)
			day_start = timezone.make_aware(datetime.combine(local_dt.date(), dtime(0, 0)), local_dt.tzinfo)
			day_end = day_start + timedelta(days=1)
			# Find existing showtimes for this movie in the same theater on the same day
			theater_id = getattr(self.screen, 'theater_id', None)
			if theater_id:
				conflicts = ShowTime.objects.filter(
					movie_id=self.movie_id,
					screen__theater_id=theater_id,
					start_time__gte=day_start,
					start_time__lt=day_end,
				).exclude(status=self.STATUS_CANCELED)
				if self.pk:
					conflicts = conflicts.exclude(pk=self.pk)
				# If any conflicting showtime uses a different screen, block it
				if conflicts.exclude(screen_id=self.screen_id).exists():
					raise ValidationError({'screen': 'This movie is already scheduled in a different room in this theater for the selected day.'})

	@property
	def seat_count(self):
		# Seats are defined on the Screen; count them here for convenience
		return self.screen.seats.count() if hasattr(self.screen, 'seats') else self.screen.seat_set.count()

	def save(self, *args, **kwargs):
		# Auto-compute end_time if not set, using movie duration + buffer
		from datetime import timedelta
		if self.start_time and self.end_time is None and self.movie_id:
			buffer_min = getattr(settings, 'SHOWTIME_BUFFER_MINUTES', 15)
			duration = int(getattr(self.movie, 'duration_minutes', 0) or 0)
			self.end_time = self.start_time + timedelta(minutes=duration + buffer_min)
		self.full_clean()
		return super().save(*args, **kwargs)

