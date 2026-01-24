from django.db import models


class Theater(models.Model):
	name = models.CharField(max_length=255, unique=True)
	# Single address field (optional) for display and filtering
	address = models.TextField(blank=True, default="")
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["name"]

	def __str__(self) -> str:
		return self.name


class Screen(models.Model):
	theater = models.ForeignKey(Theater, on_delete=models.CASCADE, related_name="screens")
	name = models.CharField(max_length=100)
	number = models.PositiveSmallIntegerField(null=True, blank=True)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["theater__name", "name"]
		constraints = [
			models.UniqueConstraint(fields=["theater", "name"], name="uniq_screen_name_per_theater"),
		]

	def __str__(self) -> str:
		return f"{self.theater.name} — {self.name}"

	@property
	def seat_count(self) -> int:
		return self.seats.count()


class Seat(models.Model):
	class SeatType(models.TextChoices):
		STANDARD = "STANDARD", "Standard"
		PREMIUM = "PREMIUM", "Premium"
		ACCESSIBLE = "ACCESSIBLE", "Accessible"

	class SeatStatus(models.TextChoices):
		AVAILABLE = "AVAILABLE", "Available"
		BLOCKED = "BLOCKED", "Blocked"

	screen = models.ForeignKey(Screen, on_delete=models.CASCADE, related_name="seats")
	row = models.CharField(max_length=4)  # e.g., A, B, C or 1, 2
	number = models.PositiveSmallIntegerField()
	seat_type = models.CharField(max_length=12, choices=SeatType.choices, default=SeatType.STANDARD)
	status = models.CharField(max_length=12, choices=SeatStatus.choices, default=SeatStatus.AVAILABLE)

	class Meta:
		ordering = ["row", "number"]
		constraints = [
			models.UniqueConstraint(fields=["screen", "row", "number"], name="uniq_seat_per_screen_row_number"),
		]

	def __str__(self) -> str:
		return f"{self.screen.name} {self.row}{self.number}"
