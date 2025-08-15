from rest_framework import viewsets
from socialconnect_server.permissions import IsOwnerOrAdmin
from .models import Comment
from .serializers import CommentSerializer

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.filter(is_active=True)
    serializer_class = CommentSerializer
    http_method_names = ['delete']  # Only delete for this viewset (create/get via post actions)

    def get_permissions(self):
        return [IsOwnerOrAdmin()]

    def perform_destroy(self, instance):
        instance.post.comment_count -= 1
        instance.post.save()
        instance.delete()