from rest_framework import viewsets, status
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect
from .models import User
from .serializers import RegisterSerializer, UserSerializer
from interactions.models import Follow
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework import permissions
from .utils import send_password_reset_email


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User created. Check email for verification.'}, status=status.HTTP_201_CREATED)
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
                raise serializers.ValidationError('Invalid credentials.')
            if not user.is_active:
                raise serializers.ValidationError('Account not verified.')
            data = super().validate(attrs)
            user.last_login = timezone.now()
            user.save()
            data['user'] = UserSerializer(user).data
            return data

    serializer_class = CustomTokenObtainPairSerializer


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            if not user.is_active:
                user.is_active = True
                user.save()
                # Redirect to frontend login page with success message
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
                return HttpResponseRedirect(f"{frontend_url}/login?verified=true")
            return Response({'detail': 'Email already verified.'}, status=status.HTTP_200_OK)
        return Response({'detail': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)
    
