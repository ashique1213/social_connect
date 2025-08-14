from django.db import models
from accounts.models import User
from posts.models import Post

class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    notification_type = models.CharField(
        max_length=20,
        choices=[('follow', 'Follow'), ('like', 'Like'), ('comment', 'Comment')]
    )
    post = models.ForeignKey(Post, on_delete=models.SET_NULL, null=True, blank=True)
    message = models.CharField(max_length=200)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)