from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.TextField(max_length=160, blank=True)
    avatar_url = models.URLField(blank=True)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    privacy = models.CharField(
        max_length=20,
        choices=[('public', 'Public'), ('private', 'Private'), ('followers_only', 'Followers Only')],
        default='public'
    )
    last_login = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)