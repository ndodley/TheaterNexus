from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import get_user_model

from .serializers import RegisterSerializer, UserSerializer, MyTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


User = get_user_model()


class RegisterView(APIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		serializer = RegisterSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(RetrieveAPIView):
	serializer_class = UserSerializer
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

