import logging
from rest_framework import viewsets, status
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.conf import settings
from django.http import HttpResponseRedirect
from .models import User
from .serializers import RegisterSerializer, UserSerializer
from interactions.models import Follow
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework import permissions
from .utils import send_password_reset_email

logger = logging.getLogger('users')

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info(f"User registered successfully: {user.username} (ID: {user.id})")
            return Response({'message': 'User created. Check email for verification.'}, status=status.HTTP_201_CREATED)
        logger.error(f"User registration failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(TokenObtainPairView):
    class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
        def validate(self, attrs):
            identifier = attrs.get('username')
            password = attrs.get('password')
            user = None
            if '@' in identifier:
                user = User.objects.filter(email=identifier).first()
            else:
                user = User.objects.filter(username=identifier).first()
            if not user or not user.check_password(password):
                logger.warning(f"Failed login attempt for identifier: {identifier}")
                raise serializers.ValidationError('Invalid credentials.')
            if not user.is_active:
                logger.warning(f"Login attempt with unverified account: {user.username} (ID: {user.id})")
                raise serializers.ValidationError('Account not verified.')
            data = super().validate(attrs)
            user.last_login = timezone.now()
            user.save()
            logger.info(f"User logged in: {user.username} (ID: {user.id})")
            data['user'] = UserSerializer(user).data
            return data

    serializer_class = CustomTokenObtainPairSerializer

class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        if user:
            send_password_reset_email(user, request)
            logger.info(f"Password reset email sent for user: {user.username} (ID: {user.id})")
        else:
            logger.warning(f"Password reset requested for non-existent email: {email}")
        return Response({'message': 'If email exists, reset instructions sent.'}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
            if default_token_generator.check_token(user, token):
                user.set_password(password)
                user.save()
                logger.info(f"Password reset successful for user: {user.username} (ID: {user.id})")
                return Response({'message': 'Password reset successful.'})
            else:
                logger.warning(f"Invalid password reset token for user ID: {uid}")
        except Exception as e:
            logger.error(f"Password reset failed: {str(e)}")
        return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not request.user.check_password(old_password):
            logger.warning(f"Invalid old password attempt for user: {request.user.username} (ID: {request.user.id})")
            return Response({'error': 'Invalid old password.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save()
        logger.info(f"Password changed for user: {request.user.username} (ID: {request.user.id})")
        return Response({'message': 'Password changed.'})

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            logger.error(f"Invalid email verification attempt: uid={uidb64}, token={token}")
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            if not user.is_active:
                user.is_active = True
                user.save()
                logger.info(f"Email verified for user: {user.username} (ID: {user.id})")
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
                return HttpResponseRedirect(f"{frontend_url}/login?verified=true")
            logger.info(f"Email already verified for user: {user.username} (ID: {user.id})")
            return Response({'detail': 'Email already verified.'}, status=status.HTTP_200_OK)
        logger.warning(f"Invalid email verification link: uid={uidb64}, token={token}")
        return Response({'detail': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'followers', 'following']:
            return [IsAuthenticatedOrReadOnly()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(is_active=True)

    def get_object(self):
        pk = self.kwargs['pk']
        if pk == 'me':
            return self.request.user
        return super().get_object()

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        if user.privacy == 'private' and user != request.user:
            logger.warning(f"Unauthorized access to private profile: {user.username} by {request.user.username}")
            return Response({'detail': 'Private profile.'}, status=status.HTTP_403_FORBIDDEN)
        if user.privacy == 'followers_only' and not Follow.objects.filter(follower=request.user, following=user).exists() and user != request.user:
            logger.warning(f"Unauthorized access to followers-only profile: {user.username} by {request.user.username}")
            return Response({'detail': 'Followers only.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(user)
        logger.info(f"Profile retrieved: {user.username} (ID: {user.id}) by {request.user.username}")
        return Response(serializer.data)

    def perform_update(self, serializer):
        if self.get_object() != self.request.user and not self.request.user.is_staff:
            logger.warning(f"Unauthorized profile update attempt by {self.request.user.username} on user ID: {self.get_object().id}")
            raise permissions.PermissionDenied('Cannot edit this profile.')
        serializer.save()
        logger.info(f"Profile updated: {self.request.user.username} (ID: {self.request.user.id})")

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        target_user = self.get_object()
        if target_user == request.user:
            logger.warning(f"User {request.user.username} attempted to follow themselves")
            return Response({'detail': 'Cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        _, created = Follow.objects.get_or_create(follower=request.user, following=target_user)
        if not created:
            logger.info(f"User {request.user.username} already following {target_user.username}")
            return Response({'detail': 'Already following.'}, status=status.HTTP_400_BAD_REQUEST)
        logger.info(f"User {request.user.username} followed {target_user.username} (ID: {target_user.id})")
        return Response({'detail': 'Followed.'})

    @action(detail=True, methods=['delete'])
    def unfollow(self, request, pk=None):
        target_user = self.get_object()
        follow = Follow.objects.filter(follower=request.user, following=target_user).first()
        if not follow:
            logger.info(f"User {request.user.username} not following {target_user.username}")
            return Response({'detail': 'Not following.'}, status=status.HTTP_400_BAD_REQUEST)
        follow.delete()
        logger.info(f"User {request.user.username} unfollowed {target_user.username} (ID: {target_user.id})")
        return Response({'detail': 'Unfollowed.'})

    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        user = self.get_object()
        followers = [f.follower for f in user.followers_set.all()]
        serializer = UserSerializer(followers, many=True)
        logger.info(f"Followers retrieved for user: {user.username} (ID: {user.id}) by {request.user.username}")
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        user = self.get_object()
        following = [f.following for f in user.following_set.all()]
        serializer = UserSerializer(following, many=True)
        logger.info(f"Following list retrieved for user: {user.username} (ID: {user.id}) by {request.user.username}")
        return Response(serializer.data)