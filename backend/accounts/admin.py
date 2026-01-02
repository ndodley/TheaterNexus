from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.admin.sites import NotRegistered

from .models import User

# Ensure our custom admin replaces any existing registration
try:
	admin.site.unregister(User)
except NotRegistered:
	pass


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	list_display = ("id", "username", "email", "first_name", "last_name", "phone_number", "date_of_birth", "role", "is_staff", "is_active")
	list_filter = ("role", "is_staff", "is_active")
	actions = ("make_admin", "make_employee", "make_customer")
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
