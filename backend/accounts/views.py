import os

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import get_user_model

from .serializers import RegisterSerializer, UserSerializer, MeSerializer, MyTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .email_verification import parse_email_verification_token, make_email_verification_token
from .emails import build_frontend_verify_email_url
from .emails import send_welcome_or_verification_email


User = get_user_model()


class RegisterView(APIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		serializer = RegisterSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
	permission_classes = [permissions.AllowAny]

	def get(self, request):
		return self._verify(request)

	def post(self, request):
		return self._verify(request)

	def _verify(self, request):
		token = None
		try:
			token = request.data.get('token')
		except Exception:
			token = None
		if not token:
			token = request.query_params.get('token')
		if not token:
			return Response({"detail": "Missing token"}, status=status.HTTP_400_BAD_REQUEST)

		payload = parse_email_verification_token(str(token))
		if not payload:
			return Response({"detail": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

		uid = payload.get('uid')
		email = payload.get('email')
		try:
			user = User.objects.get(pk=uid, email=email)
		except User.DoesNotExist:
			return Response({"detail": "User not found"}, status=status.HTTP_400_BAD_REQUEST)

		if not getattr(user, 'email_verified', False):
			user.email_verified = True
			user.save(update_fields=['email_verified'])

		return Response({"detail": "Email verified", "email_verified": True}, status=status.HTTP_200_OK)


class ResendVerificationEmailView(APIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		email = (request.data.get('email') or '').strip()
		# Always return 200 to avoid account enumeration.
		if not email:
			return Response({"detail": "If that email exists, a message has been sent."}, status=status.HTTP_200_OK)
		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			return Response({"detail": "If that email exists, a message has been sent."}, status=status.HTTP_200_OK)

		# Send either verify or welcome (depending on current state).
		try:
			send_welcome_or_verification_email(user=user)
		except Exception:
			# Keep response generic.
			pass
		return Response({"detail": "If that email exists, a message has been sent."}, status=status.HTTP_200_OK)


class VerificationLinkView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request):
		user = request.user
		email = (getattr(user, 'email', '') or '').strip()
		if not email:
			return Response({"detail": "User has no email"}, status=status.HTTP_400_BAD_REQUEST)
		token = make_email_verification_token(user_id=user.pk, email=email)
		return Response(
			{
				"token": token,
				"verify_url": build_frontend_verify_email_url(token),
				"email_verified": bool(getattr(user, 'email_verified', False)),
			},
			status=status.HTTP_200_OK,
		)


class MeView(RetrieveUpdateAPIView):
	serializer_class = MeSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_object(self):
		return self.request.user


class MyTokenObtainPairView(TokenObtainPairView):
	serializer_class = MyTokenObtainPairSerializer


class LogoutView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		# Expect a refresh token to blacklist
		refresh_token = request.data.get("refresh")
		if not refresh_token:
			return Response({"detail": "Missing refresh token"}, status=status.HTTP_400_BAD_REQUEST)
		try:
			token = RefreshToken(refresh_token)
			token.blacklist()
		except Exception:
			return Response({"detail": "Invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST)
		return Response({"detail": "Logged out"}, status=status.HTTP_205_RESET_CONTENT)


class AvatarView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		return self.put(request)

	def put(self, request):
		user = request.user
		file = request.FILES.get('avatar')
		if not file:
			return Response({"detail": "Missing avatar file"}, status=status.HTTP_400_BAD_REQUEST)
		# Delete previous file if exists and different
		prev_name = None
		try:
			prev_name = user.avatar.name if user.avatar else None
		except Exception:
			prev_name = None
		user.avatar = file
		user.save()
		try:
			if prev_name and prev_name != (user.avatar.name if user.avatar else None):
				user.avatar.storage.delete(prev_name)
		except Exception:
			pass
		return Response(UserSerializer(user, context={'request': request}).data)


class GoogleLoginView(APIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		"""Login/signup with a Google ID token (credential).

		Frontend obtains the `credential` via Google Identity Services.
		"""
		credential = request.data.get('credential')
		if not credential:
			return Response({"detail": "Missing Google credential"}, status=status.HTTP_400_BAD_REQUEST)

		google_client_id = os.environ.get('GOOGLE_OAUTH_CLIENT_ID')
		if not google_client_id:
			return Response(
				{"detail": "Google OAuth is not configured (missing GOOGLE_OAUTH_CLIENT_ID)."},
				status=status.HTTP_501_NOT_IMPLEMENTED,
			)

		try:
			from google.oauth2 import id_token
			from google.auth.transport import requests as google_requests
			idinfo = id_token.verify_oauth2_token(credential, google_requests.Request(), google_client_id)
		except ImportError:
			return Response(
				{"detail": "google-auth is not installed on the backend."},
				status=status.HTTP_501_NOT_IMPLEMENTED,
			)
		except Exception:
			return Response({"detail": "Invalid Google credential"}, status=status.HTTP_400_BAD_REQUEST)

		email = idinfo.get('email')
		email_verified = idinfo.get('email_verified', False)
		if not email or not email_verified:
			return Response({"detail": "Google account email is not verified"}, status=status.HTTP_400_BAD_REQUEST)

		first_name = idinfo.get('given_name') or ''
		last_name = idinfo.get('family_name') or ''

		user, created = User.objects.get_or_create(
			email=email,
			defaults={
				"username": email,
				"first_name": first_name,
				"last_name": last_name,
				"email_verified": True,
				"role": User.Role.CUSTOMER,
			},
		)
		if created:
			user.set_unusable_password()
			user.save()
		else:
			# Fill missing names if available.
			updates = False
			if first_name and not (user.first_name or '').strip():
				user.first_name = first_name
				updates = True
			if last_name and not (user.last_name or '').strip():
				user.last_name = last_name
				updates = True
			if updates:
				user.save()

		refresh = RefreshToken.for_user(user)
		return Response(
			{
				"refresh": str(refresh),
				"access": str(refresh.access_token),
				"user": UserSerializer(user, context={"request": request}).data,
				"created": created,
			},
			status=status.HTTP_200_OK,
		)

	def delete(self, request):
		user = request.user
		prev_name = None
		try:
			prev_name = user.avatar.name if user.avatar else None
		except Exception:
			prev_name = None
		user.avatar = None
		user.save()
		try:
			if prev_name:
				user.avatar.storage.delete(prev_name)
		except Exception:
			pass
		return Response(UserSerializer(user, context={'request': request}).data)

