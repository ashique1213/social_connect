import logging
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger('users')

def send_verification_email(user, request=None):
    try:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # Determine the domain dynamically
        if request:
            domain = request.build_absolute_uri('/')[:-1] 
        else:
            domain = getattr(settings, 'BASE_URL', 'http://localhost:8000')
        
        verification_url = f"{domain}/api/verify/{uid}/{token}/"  
        
        send_mail(
            subject='Verify Your Email',
            message=(
                f'Hi {user.username},\n\n'
                f'Please verify your email by clicking the link below:\n'
                f'{verification_url}\n\n'
                f'If you did not sign up for SocialConnect, ignore this email.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Verification email sent to user: {user.username} (ID: {user.id}, Email: {user.email})")
    except Exception as e:
        logger.error(f"Failed to send verification email to user: {user.username} (ID: {user.id}, Email: {user.email}). Error: {str(e)}")
        raise

def send_password_reset_email(user, request=None):
    try:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # Use frontend URL for reset link
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_url = f"{frontend_url}/reset/{uid}/{token}"
        
        send_mail(
            subject='Password Reset Request',
            message=(
                f'Hi {user.username},\n\n'
                f'You requested a password reset for your SocialConnect account.\n'
                f'Click the link below to reset your password:\n'
                f'{reset_url}\n\n'
                f'If you did not request this, please ignore this email.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Password reset email sent to user: {user.username} (ID: {user.id}, Email: {user.email})")
    except Exception as e:
        logger.error(f"Failed to send password reset email to user: {user.username} (ID: {user.id}, Email: {user.email}). Error: {str(e)}")
        raise