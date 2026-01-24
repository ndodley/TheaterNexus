from django.contrib import admin
from django.contrib import messages
from django import forms
from django.utils import timezone
from django.shortcuts import redirect
from .models import ShowTime
from movies.models import Movie
from theaters.models import Theater, Screen
from django.contrib.admin.helpers import ActionForm
from backend.admin_utils import ExportCsvAdminMixin


class GenerateScheduleActionForm(ActionForm):
	# Extra fields for bulk generation; keep admin-required fields via ActionForm
	select_across = forms.BooleanField(required=False, initial=False, widget=forms.HiddenInput, label="")
	index = forms.IntegerField(required=False, widget=forms.HiddenInput, label="")

	movie = forms.ModelChoiceField(queryset=Movie.objects.all(), required=False, label="Movie")
	theater = forms.ModelChoiceField(queryset=Theater.objects.all(), required=False, label="Theater")
	start_date = forms.DateField(required=False, label="Start date")
	end_date = forms.DateField(required=False, label="End date")
	times = forms.CharField(required=False, label="Times")
	base_price = forms.DecimalField(max_digits=8, decimal_places=2, required=False, initial=0, label="Base price")
	status = forms.ChoiceField(choices=ShowTime.STATUS_CHOICES, required=False, initial=ShowTime.STATUS_ON_SALE, label="Status")

	# Order fields for nicer layout in the admin action bar
	field_order = ['action', 'movie', 'theater', 'start_date', 'end_date', 'times', 'base_price', 'status']

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		# Improve widgets and placeholders to reduce clutter
		# Only require fields when the chosen action is 'generate_schedule'
		action = (self.data or {}).get('action')
		is_generate = action == 'generate_schedule'
		for name in ['movie', 'start_date', 'end_date', 'times']:
			self.fields[name].required = bool(is_generate)
		self.fields['movie'].empty_label = 'Select movie'
		self.fields['movie'].widget.attrs.update({'style': 'min-width:180px'})
		self.fields['theater'].empty_label = 'All theaters'
		self.fields['theater'].widget.attrs.update({'style': 'min-width:180px'})
		self.fields['start_date'].widget = forms.DateInput(attrs={'type': 'date'})
		self.fields['end_date'].widget = forms.DateInput(attrs={'type': 'date'})
		self.fields['times'].widget = forms.TextInput(attrs={'placeholder': 'HH:MM,HH:MM…', 'style': 'min-width:220px'})
		self.fields['base_price'].widget = forms.NumberInput(attrs={'step': '0.01', 'min': '0', 'style': 'width:100px'})
		self.fields['status'].widget.attrs.update({'style': 'min-width:140px'})


@admin.register(ShowTime)
class ShowTimeAdmin(ExportCsvAdminMixin, admin.ModelAdmin):
	list_display = ('movie', 'get_theater', 'screen', 'start_time', 'end_time', 'status', 'base_price')
	list_filter = ('status', 'screen__theater', 'movie')
	search_fields = ('movie__title', 'screen__name', 'screen__theater__name')
	date_hierarchy = 'start_time'
	ordering = ('start_time',)
	readonly_fields = ('end_time',)
	# Always show a lightweight generate form via a custom change list template
	change_list_template = 'admin/showtimes/showtime/change_list.html'

	# Add a small form to the actions bar for bulk generation
	# Removed: action_form to avoid duplicate controls in action bar.

	actions = ['cancel_selected', 'shift_start_times', 'shift_by_1_day', 'shift_by_2_days', 'generate_schedule']

	def get_theater(self, obj):
		return obj.screen.theater
	get_theater.short_description = 'Theater'

	def cancel_selected(self, request, queryset):
		updated = queryset.update(status=ShowTime.STATUS_CANCELED)
		self.message_user(request, f"Canceled {updated} showtime(s).")
	cancel_selected.short_description = 'Cancel selected showtimes'

	def shift_start_times(self, request, queryset):
		# Shift selected showtimes forward by 15 minutes (simple helper)
		from datetime import timedelta
		shifted = 0
		for st in queryset:
			st.start_time = st.start_time + timedelta(minutes=15)
			st.end_time = st.end_time + timedelta(minutes=15)
			st.full_clean()
			st.save(update_fields=['start_time', 'end_time'])
			shifted += 1
		self.message_user(request, f"Shifted {shifted} showtime(s) by 15 minutes.")
	shift_start_times.short_description = 'Shift selected +15 minutes'

	def _shift_days(self, queryset, days):
		from datetime import timedelta
		shifted = 0
		for st in queryset:
			st.start_time = st.start_time + timedelta(days=days)
			if st.end_time:
				st.end_time = st.end_time + timedelta(days=days)
			st.full_clean()
			st.save(update_fields=['start_time', 'end_time'])
			shifted += 1
		return shifted

	def shift_by_1_day(self, request, queryset):
		shifted = self._shift_days(queryset, 1)
		self.message_user(request, f"Shifted {shifted} showtime(s) by 1 day.")
	shift_by_1_day.short_description = 'Shift selected +1 day'

	def shift_by_2_days(self, request, queryset):
		shifted = self._shift_days(queryset, 2)
		self.message_user(request, f"Shifted {shifted} showtime(s) by 2 days.")
	shift_by_2_days.short_description = 'Shift selected +2 days'

	def generate_schedule(self, request, queryset):
		# Generate showtimes for a movie across screens and dates
		# Use our custom form rendered in the change_list template; no action_form duplication.
		form = GenerateScheduleActionForm(request.POST)
		# Ensure action field has proper choices even when no rows are selected
		if 'action' in form.fields:
			form.fields['action'].choices = self.get_action_choices(request)
		if not form.is_valid():
			self.message_user(request, "Invalid input for bulk generation.", level=messages.ERROR)
			return

		movie = form.cleaned_data['movie']
		theater = form.cleaned_data.get('theater')
		start_date = form.cleaned_data['start_date']
		end_date = form.cleaned_data['end_date']
		times_str = form.cleaned_data['times']
		base_price = form.cleaned_data.get('base_price') or 0
		status = form.cleaned_data.get('status') or ShowTime.STATUS_ON_SALE

		# Determine theaters to use; we'll choose an available screen per theater per day
		all_screens = Screen.objects.filter(is_active=True).select_related('theater').order_by('theater_id', 'id')
		if theater:
			theater_ids = [theater.id]
		else:
			# Unique theater IDs from active screens
			seen = set()
			theater_ids = []
			for scr in all_screens:
				if scr.theater_id not in seen:
					seen.add(scr.theater_id)
					theater_ids.append(scr.theater_id)

		# Parse times (24-hour HH:MM strings)
		time_parts = [t.strip() for t in times_str.split(',') if t.strip()]
		parsed_times = []
		from datetime import datetime, date, time, timedelta
		for t in time_parts:
			try:
				hh, mm = t.split(':')
				parsed_times.append(time(int(hh), int(mm)))
			except Exception:
				continue
		if not parsed_times:
			self.message_user(request, "No valid times provided.", level=messages.ERROR)
			return

		# Iterate dates inclusive
		created = 0
		skipped = 0
		overlap_skipped = 0
		duplicate_skipped = 0
		current = start_date
		tz = timezone.get_current_timezone()
		# Helper: can a given screen host all selected times on a date without conflicts?
		from django.conf import settings as dj_settings
		buffer_min = int(getattr(dj_settings, 'SHOWTIME_BUFFER_MINUTES', 15))
		duration_min = int(getattr(movie, 'duration_minutes', 0) or 0)
		def screen_fits(screen_obj, the_date):
			for tt in parsed_times:
				start_dt_naive = datetime.combine(the_date, tt)
				start_dt = timezone.make_aware(start_dt_naive, tz)
				end_dt = start_dt + timedelta(minutes=duration_min + buffer_min)
				conflict = ShowTime.objects.filter(screen=screen_obj).exclude(status=ShowTime.STATUS_CANCELED).filter(start_time__lt=end_dt, end_time__gt=start_dt).exists()
				if conflict:
					return False
			return True
		while current <= end_date:
			for tid in theater_ids:
				# Candidate screens in this theater
				candidates = [scr for scr in all_screens if scr.theater_id == tid]
				chosen_screen = None
				for scr in candidates:
					if screen_fits(scr, current):
						chosen_screen = scr
						break
				if not chosen_screen:
					# No available screen to host all selected times; skip this theater/date
					overlap_skipped += len(parsed_times)
					continue
				# Create showtimes on the chosen screen
				for tt in parsed_times:
					start_dt_naive = datetime.combine(current, tt)
					start_dt = timezone.make_aware(start_dt_naive, tz)
					if ShowTime.objects.filter(screen=chosen_screen, start_time=start_dt).exists():
						skipped += 1
						duplicate_skipped += 1
						continue
					obj = ShowTime(movie=movie, screen=chosen_screen, start_time=start_dt, base_price=base_price, status=status)
					try:
						obj.full_clean()
						obj.save()
						created += 1
					except Exception as e:
						# Overlap or validation error; skip
						skipped += 1
						from django.core.exceptions import ValidationError
						if isinstance(e, ValidationError):
							msg = str(e)
							if 'overlaps' in msg or 'room' in msg:
								overlap_skipped += 1
			current = current + timedelta(days=1)

		theater_msg = f" for {theater.name}" if theater else ""
		messages_detail = []
		if skipped:
			messages_detail.append(f"skipped {skipped}")
		if overlap_skipped:
			messages_detail.append(f"{overlap_skipped} due to overlap/room rule")
		if duplicate_skipped:
			messages_detail.append(f"{duplicate_skipped} duplicates")
		detail = f"; {', '.join(messages_detail)}" if messages_detail else ''
		self.message_user(request, f"Generated {created} showtime(s){theater_msg}{detail}.")
	generate_schedule.short_description = 'Generate schedule (movie, dates, times)'

	# Allow running 'generate_schedule' without selecting rows
	def changelist_view(self, request, extra_context=None):
		if request.method == 'POST' and request.POST.get('action') == 'generate_schedule':
			# Run the action with an empty queryset; selection not required
			self.generate_schedule(request, self.model.objects.none())
			return redirect(request.path)
		# Provide the generator form to the custom template so fields render
		ctx = extra_context or {}
		ctx['generate_form'] = GenerateScheduleActionForm()
		return super().changelist_view(request, ctx)


