import logging
from rest_framework import viewsets
from socialconnect_server.permissions import IsOwnerOrAdmin
from .models import Comment
from .serializers import CommentSerializer

logger = logging.getLogger('users')

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.filter(is_active=True)
    serializer_class = CommentSerializer
    http_method_names = ['delete']  # Only delete for this viewset (create/get via post actions)

    def get_permissions(self):
        return [IsOwnerOrAdmin()]

    def perform_destroy(self, instance):
        try:
            post_id = instance.post.id
            comment_id = instance.id
            user_username = instance.user.username
            instance.post.comment_count -= 1
            instance.post.save()
            instance.delete()
            logger.info(f"Comment ID {comment_id} on post ID {post_id} deleted by user {self.request.user.username})")
        except Exception as e:
            logger.error(f"Failed to delete comment ID {comment_id} on post ID {post_id} by user {self.request.user.username}: {str(e)}")
            raise