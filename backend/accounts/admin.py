from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.admin.sites import NotRegistered
from django.http import HttpResponse, HttpRequest
from django.shortcuts import redirect, render
from django.urls import path
import csv
import io

from .models import User
from backend.admin_utils import ExportCsvAdminMixin

# Ensure our custom admin replaces any existing registration
try:
	admin.site.unregister(User)
except NotRegistered:
	pass


@admin.register(User)
class UserAdmin(ExportCsvAdminMixin, DjangoUserAdmin):
	list_display = ("id", "username", "email", "first_name", "last_name", "phone_number", "date_of_birth", "role", "is_staff", "is_active")
	list_filter = ("role", "is_staff", "is_active")
	actions = ("make_admin", "make_employee", "make_customer")
	change_list_template = "admin/accounts/user/change_list.html"
	csv_export_filename = "users.csv"
	fieldsets = (
		(None, {"fields": ("username", "password")}),
		("Personal info", {"fields": ("first_name", "last_name", "email", "phone_number", "date_of_birth", "avatar")}),
		("Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
		("Important dates", {"fields": ("last_login", "date_joined")}),
	)
	add_fieldsets = (
		(None, {
			"classes": ("wide",),
			"fields": ("username", "email", "password1", "password2", "role", "phone_number", "date_of_birth", "avatar", "is_staff", "is_active"),
		}),
	)

	def get_urls(self):
		urls = super().get_urls()
		custom = [
			path("bulk-upload/", self.admin_site.admin_view(self.bulk_upload_view), name="accounts_user_bulk_upload"),
			path("bulk-template/", self.admin_site.admin_view(self.bulk_template_view), name="accounts_user_bulk_template"),
		]
		return custom + urls

	def get_csv_export_field_names(self):
		# Matches the bulk template so exported CSV can be re-imported.
		# NOTE: password is always exported blank.
		return [
			"email",
			"first_name",
			"last_name",
			"role",
			"is_active",
			"is_staff",
			"email_verified",
			"phone_number",
			"date_of_birth",
			"password",
		]

	def get_csv_export_row(self, obj, field_names, request):
		dob = ""
		try:
			dob = obj.date_of_birth.isoformat() if obj.date_of_birth else ""
		except Exception:
			dob = ""
		return [
			(getattr(obj, "email", "") or ""),
			(getattr(obj, "first_name", "") or ""),
			(getattr(obj, "last_name", "") or ""),
			(getattr(obj, "role", "") or ""),
			"1" if getattr(obj, "is_active", False) else "0",
			"1" if getattr(obj, "is_staff", False) else "0",
			"1" if getattr(obj, "email_verified", False) else "0",
			(getattr(obj, "phone_number", "") or ""),
			dob,
			"",  # never export passwords
		]

	def _parse_bool(self, raw):
		v = (raw or "").strip().lower()
		if v in ("1", "true", "t", "yes", "y", "on"):
			return True
		if v in ("0", "false", "f", "no", "n", "off"):
			return False
		return None

	def bulk_template_view(self, request: HttpRequest):
		headers = self.get_csv_export_field_names()
		response = HttpResponse(content_type="text/csv")
		response["Content-Disposition"] = 'attachment; filename="users_template.csv"'
		writer = csv.writer(response)
		writer.writerow(headers)
		writer.writerow([
			"jane@example.com",
			"Jane",
			"Doe",
			User.Role.CUSTOMER,
			"1",
			"0",
			"0",
			"555-555-1234",
			"1999-01-01",
			"ChangeMe123!",
		])
		return response

	def bulk_upload_view(self, request: HttpRequest):
		SESSION_KEY = "accounts_users_bulk_upload_csv"

		if request.method == "POST":
			# Confirm import step
			if request.POST.get("confirm") == "1":
				csv_text = request.session.get(SESSION_KEY)
				if not csv_text:
					self.message_user(request, "No CSV found in session. Please upload again.")
					return redirect(".")

				reader = csv.DictReader(io.StringIO(csv_text))
				created = 0
				updated = 0
				errors = []
				for idx, row in enumerate(reader, start=2):
					try:
						email = (row.get("email") or "").strip().lower()
						if not email:
							raise ValueError("email is required")

						role = (row.get("role") or "").strip() or User.Role.CUSTOMER
						if role not in dict(User.Role.choices):
							raise ValueError(f"invalid role: {role}")

						is_active = self._parse_bool(row.get("is_active"))
						is_staff = self._parse_bool(row.get("is_staff"))
						email_verified = self._parse_bool(row.get("email_verified"))

						first_name = (row.get("first_name") or "").strip()
						last_name = (row.get("last_name") or "").strip()
						phone_number = (row.get("phone_number") or "").strip()
						dob_raw = (row.get("date_of_birth") or "").strip()
						password = (row.get("password") or "").strip()

						date_of_birth = None
						if dob_raw:
							from datetime import datetime
							try:
								date_of_birth = datetime.strptime(dob_raw, "%Y-%m-%d").date()
							except Exception:
								raise ValueError("date_of_birth must be YYYY-MM-DD")

						user, is_created = User.objects.get_or_create(
							email=email,
							defaults={
								"username": email,
								"first_name": first_name,
								"last_name": last_name,
								"role": role,
								"phone_number": phone_number,
								"date_of_birth": date_of_birth,
								"email_verified": bool(email_verified) if email_verified is not None else False,
							},
						)

						# Apply updates
						changed = False
						if is_created:
							created += 1
						else:
							updated += 1

						if first_name:
							user.first_name = first_name
							changed = True
						if last_name:
							user.last_name = last_name
							changed = True
						if phone_number:
							user.phone_number = phone_number
							changed = True
						if dob_raw:
							user.date_of_birth = date_of_birth
							changed = True
						if role:
							user.role = role
							changed = True
						if is_active is not None:
							user.is_active = is_active
							changed = True
						if is_staff is not None:
							user.is_staff = is_staff
							changed = True
						if email_verified is not None:
							user.email_verified = email_verified
							changed = True
						if password:
							user.set_password(password)
							changed = True
						elif is_created:
							user.set_unusable_password()
							changed = True

						if changed:
							# username mirrors email
							if not (user.username or "").strip():
								user.username = user.email
							user.save()

					except Exception as e:
						errors.append(f"Row {idx}: {e}")

				if errors:
					for msg in errors[:10]:
						self.message_user(request, msg)
					self.message_user(request, f"Completed with errors. Created {created}, updated {updated}, errors {len(errors)}")
				else:
					self.message_user(request, f"Bulk upload complete. Created {created}, updated {updated}")

				request.session.pop(SESSION_KEY, None)
				return redirect("..")

			# Preview step
			if request.FILES.get("csv_file"):
				file = request.FILES["csv_file"]
				data = io.TextIOWrapper(file.file, encoding="utf-8-sig")
				csv_text = data.read()
				request.session[SESSION_KEY] = csv_text
				reader = csv.DictReader(io.StringIO(csv_text))

				preview_rows = []
				will_create = 0
				will_update = 0
				error_count = 0
				valid_roles = set(dict(User.Role.choices).keys())
				headers = self.get_csv_export_field_names()

				for idx, row in enumerate(reader, start=2):
					row_errors = []
					email = (row.get("email") or "").strip().lower()
					role = (row.get("role") or "").strip() or User.Role.CUSTOMER
					is_active = (row.get("is_active") or "").strip()
					is_staff = (row.get("is_staff") or "").strip()
					# Build a display row matching the CSV headers
					values = []
					for h in headers:
						val = (row.get(h) or "").strip()
						if h == "password" and val:
							val = "••••••••"
						values.append(val)

					if not email:
						row_errors.append("email is required")
					if role and role not in valid_roles:
						row_errors.append(f"invalid role: {role}")
					if row.get("date_of_birth"):
						dob_raw = (row.get("date_of_birth") or "").strip()
						if dob_raw:
							from datetime import datetime
							try:
								datetime.strptime(dob_raw, "%Y-%m-%d")
							except Exception:
								row_errors.append("date_of_birth must be YYYY-MM-DD")

					exists = bool(email and User.objects.filter(email=email).exists())
					action = "update" if exists else "create"
					if action == "create":
						will_create += 1
					else:
						will_update += 1

					if row_errors:
						error_count += 1

					preview_rows.append({
						"row": idx,
						"email": email,
						"role": role,
						"is_active": is_active,
						"is_staff": is_staff,
						"action": action,
						"values": values,
						"errors": row_errors,
					})

				context = {
					"title": "Preview users CSV",
					"opts": self.model._meta,
					"rows": preview_rows,
					"headers": headers,
					"will_create": will_create,
					"will_update": will_update,
					"error_count": error_count,
				}
				return render(request, "admin/accounts/user/bulk_preview.html", context)

			self.message_user(request, "Please choose a CSV file.")
			return redirect(".")

		# GET: upload form
		context = {
			"title": "Bulk upload users",
			"opts": self.model._meta,
		}
		return render(request, "admin/accounts/user/bulk_upload.html", context)

	# Clarify that username mirrors email in the admin forms
	def get_form(self, request, obj=None, **kwargs):
		form = super().get_form(request, obj, **kwargs)
		if 'username' in form.base_fields:
			form.base_fields['username'].help_text = (
				"Username defaults to the email address. Treat it as the same value."
			)
		if 'email' in form.base_fields:
			form.base_fields['email'].help_text = (
				"Email is unique and is also used as the username."
			)
		return form

	@admin.action(description="Set role: Admin")
	def make_admin(self, request, queryset):
		updated = queryset.update(role=User.Role.ADMIN)
		self.message_user(request, f"Updated {updated} user(s) to Admin role.")

	@admin.action(description="Set role: Employee")
	def make_employee(self, request, queryset):
		updated = queryset.update(role=User.Role.EMPLOYEE)
		self.message_user(request, f"Updated {updated} user(s) to Employee role.")

	@admin.action(description="Set role: Customer")
	def make_customer(self, request, queryset):
		updated = queryset.update(role=User.Role.CUSTOMER)
		self.message_user(request, f"Updated {updated} user(s) to Customer role.")
