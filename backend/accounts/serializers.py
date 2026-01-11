from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "avatar",
            "avatar_url",
            "date_of_birth",
            "role",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = ["id", "is_staff", "is_superuser"]

    def get_avatar_url(self, obj: User):
        request = self.context.get('request') if hasattr(self, 'context') else None
        try:
            if obj.avatar:
                url = obj.avatar.url
            else:
                from django.conf import settings
                media = getattr(settings, 'MEDIA_URL', '/media/')
                url = f"{media.rstrip('/')}/default_poster/default_avatar.jpg"
            return request.build_absolute_uri(url) if (request and url and url.startswith('/')) else url
        except Exception:
            return None


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone_number",
            "avatar",
            "date_of_birth",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        # Default username to email if not provided
        if not validated_data.get("username"):
            validated_data["username"] = validated_data["email"]
        # Force new registrations to be customers
        validated_data["role"] = User.Role.CUSTOMER
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token["role"] = getattr(user, "role", "customer")
        token["username"] = user.username
        return token

    def validate(self, attrs):
        # Support logging in with email even if USERNAME_FIELD is 'username'
        raw_username = attrs.get('username')
        if raw_username and '@' in raw_username:
            try:
                user_obj = User.objects.get(email=raw_username)
                # Replace provided username (email) with the actual username for auth backend
                attrs['username'] = user_obj.get_username()
            except User.DoesNotExist:
                # Fall back to default behavior
                pass

        data = super().validate(attrs)
        # Include basic user info in response
        data["user"] = UserSerializer(self.user).data
        return data
