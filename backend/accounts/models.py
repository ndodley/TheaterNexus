from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as DjangoUserManager


class UserManager(DjangoUserManager):
	def create_user(self, username, email=None, password=None, **extra_fields):
		if not email:
			raise ValueError("The email address must be set")
		email = self.normalize_email(email)
		# If username not provided or blank, default to email
		if not username:
			username = email
		return super().create_user(username, email, password, **extra_fields)

	def create_superuser(self, username, email=None, password=None, **extra_fields):
		extra_fields.setdefault('is_staff', True)
		extra_fields.setdefault('is_superuser', True)
		# Ensure superusers get the admin role
		extra_fields['role'] = User.Role.ADMIN
		email = self.normalize_email(email) if email else email
		if not username:
			username = email
		return super().create_superuser(username, email, password, **extra_fields)


class User(AbstractUser):
	# Make email unique and the canonical identifier we mirror in username
	email = models.EmailField(unique=True)
	class Role(models.TextChoices):
		ADMIN = 'admin', 'Admin'
		EMPLOYEE = 'employee', 'Employee'
		CUSTOMER = 'customer', 'Customer'

	role = models.CharField(
		max_length=16,
		choices=Role.choices,
		default=Role.CUSTOMER,
	)

	phone_number = models.CharField(max_length=20, blank=True)
	avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
	date_of_birth = models.DateField(null=True, blank=True)

	# Use custom manager so CLI createsuperuser sets role=admin
	objects = UserManager()

	def __str__(self) -> str:
		return f"{self.username} ({self.role})"
