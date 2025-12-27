from django.contrib import admin
from django import forms
from django.forms import widgets
from .models import Theater, Screen, Seat


class SeatInline(admin.TabularInline):
	model = Seat
	extra = 0
	fields = ("row", "number", "seat_type", "status")


class CustomLayoutActionForm(forms.Form):
	# Required fields expected by Django admin action handling
	action = forms.ChoiceField(label="Action", required=False)
	select_across = forms.BooleanField(widget=widgets.HiddenInput, initial=0, required=False)
	index = forms.IntegerField(widget=widgets.HiddenInput, initial=0, required=False)

	# Custom parameters for our layout generation
	rows = forms.IntegerField(min_value=1, max_value=26, required=False, help_text="Number of rows (default 8)")
	seats_per_row = forms.IntegerField(min_value=1, max_value=50, required=False, help_text="Seats per row (default 12)")
	start_row = forms.CharField(max_length=1, required=False, help_text="Starting row letter (default A)")

@admin.register(Screen)
class ScreenAdmin(admin.ModelAdmin):
	list_display = ("name", "theater", "seat_count", "is_active")
	list_filter = ("theater", "is_active")
	search_fields = ("name", "theater__name")
	inlines = [SeatInline]
	actions = ["generate_standard_layout", "generate_custom_layout"]
	# Use the custom action form so the changelist can render safely
	action_form = CustomLayoutActionForm

	def generate_standard_layout(self, request, queryset):
		from django.db import transaction
		created_total = 0
		for screen in queryset:
			existing = {(s["row"], s["number"]) for s in screen.seats.values("row", "number")}
			rows = [chr(ord('A') + i) for i in range(8)]
			to_create = []
			for row in rows:
				for num in range(1, 13):
					if (row, num) in existing:
						continue
					to_create.append(Seat(screen=screen, row=row, number=num))
			with transaction.atomic():
				Seat.objects.bulk_create(to_create, ignore_conflicts=True)
			created_total += len(to_create)
		self.message_user(request, f"Created {created_total} seats across {queryset.count()} screen(s)")
	generate_standard_layout.short_description = "Generate 8x12 standard layout"

	def generate_custom_layout(self, request, queryset):
		from django.db import transaction
		# Read parameters from the action form POST; fallback to defaults
		try:
			rows = int(request.POST.get('rows') or 8)
		except ValueError:
			rows = 8
		try:
			seats_per_row = int(request.POST.get('seats_per_row') or 12)
		except ValueError:
			seats_per_row = 12
		start_row = (request.POST.get('start_row') or 'A').strip().upper()[:1] or 'A'
		if not ('A' <= start_row <= 'Z'):
			start_row = 'A'

		start_ord = ord(start_row)
		row_labels = [chr(start_ord + i) for i in range(rows)]

		created_total = 0
		for screen in queryset:
			existing = {(s["row"], s["number"]) for s in screen.seats.values("row", "number")}
			to_create = []
			for row in row_labels:
				for num in range(1, seats_per_row + 1):
					if (row, num) in existing:
						continue
					to_create.append(Seat(screen=screen, row=row, number=num))
			with transaction.atomic():
				Seat.objects.bulk_create(to_create, ignore_conflicts=True)
			created_total += len(to_create)

		self.message_user(
			request,
			f"Created {created_total} seats across {queryset.count()} screen(s) using {rows}x{seats_per_row} starting at {start_row}"
		)
	generate_custom_layout.short_description = "Generate custom layout (rows, seats per row, start)"

# (No bottom-level binding needed; form is set on the class above)


@admin.register(Theater)
class TheaterAdmin(admin.ModelAdmin):
	list_display = ("name", "is_active")
	list_filter = ("is_active",)
	search_fields = ("name",)


@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
	list_display = ("screen", "row", "number", "seat_type", "status")
	list_filter = ("seat_type", "status", "screen__theater")
	search_fields = ("screen__name", "row")
