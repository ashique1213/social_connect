from rest_framework import serializers
from .models import Notification
from accounts.serializers import UserSerializer
from posts.serializers import PostSerializer

class NotificationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    post = PostSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'sender', 'notification_type', 'post', 'message', 'is_read', 'created_at']