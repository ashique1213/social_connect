from rest_framework import serializers
from .models import Comment
from accounts.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'post', 'created_at']
        read_only_fields = ['post', 'created_at']