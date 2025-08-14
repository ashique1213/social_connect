from django.db import models
from accounts.models import User

class Post(models.Model):
    content = models.TextField(max_length=280)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    image_url = models.URLField(blank=True)
    category = models.CharField(
        max_length=20,
        choices=[('general', 'General'), ('announcement', 'Announcement'), ('question', 'Question')],
        default='general'
    )
    is_active = models.BooleanField(default=True)
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)