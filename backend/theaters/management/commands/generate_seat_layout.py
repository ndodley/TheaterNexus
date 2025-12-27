from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from theaters.models import Screen, Seat

class Command(BaseCommand):
    help = "Generate a standard seat layout for a screen (rows A.. and seats per row)."

    def add_arguments(self, parser):
        parser.add_argument("screen_id", type=int, help="ID of the screen to populate")
        parser.add_argument("--rows", type=int, default=8, help="Number of rows (default: 8)")
        parser.add_argument("--seats-per-row", type=int, default=12, help="Seats per row (default: 12)")
        parser.add_argument("--start-row", type=str, default="A", help="Starting row label (default: A)")
        parser.add_argument("--dry-run", action="store_true", help="Show what would be created without writing")

    def handle(self, *args, **options):
        screen_id = options["screen_id"]
        rows = options["rows"]
        seats_per_row = options["seats_per_row"]
        start_row = options["start_row"].strip() or "A"
        dry_run = options["dry_run"]

        try:
            screen = Screen.objects.get(pk=screen_id)
        except Screen.DoesNotExist:
            raise CommandError(f"Screen {screen_id} does not exist")

        start_ord = ord(start_row.upper())
        row_labels = [chr(start_ord + i) for i in range(rows)]

        existing = {(s["row"], s["number"]) for s in screen.seats.values("row", "number")}
        to_create = []
        for row in row_labels:
            for num in range(1, seats_per_row + 1):
                key = (row, num)
                if key in existing:
                    continue
                to_create.append(Seat(screen=screen, row=row, number=num))

        created_count = 0
        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"Dry run: would create {len(to_create)} seats for Screen '{screen.name}'"
            ))
            return

        with transaction.atomic():
            Seat.objects.bulk_create(to_create, ignore_conflicts=True)
            created_count = len(to_create)

        self.stdout.write(self.style.SUCCESS(
            f"Created {created_count} seats for Screen '{screen.name}'"
        ))
