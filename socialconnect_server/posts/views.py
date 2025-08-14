from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q
from rest_framework.views import APIView
from .models import Post
from .serializers import PostSerializer
from interactions.serializers import CommentSerializer
from interactions.models import Like, Comment
from socialconnect_server.permissions import IsOwnerOrAdmin
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from accounts.models import User
from interactions.models import Follow

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        # Base queryset: active posts
        queryset = Post.objects.filter(is_active=True).order_by('-created_at')
        if user.is_authenticated:
            # Include posts from users the requester can view
            following_ids = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
            return queryset.filter(
                Q(author=user) |  # Own posts
                Q(author__privacy='public') |  # Public profiles
                Q(author__privacy='followers_only', author__in=following_ids)  # Followers-only for followed users
            )
        # Unauthenticated users see only public posts
        return queryset.filter(author__privacy='public')

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        _, created = Like.objects.get_or_create(user=request.user, post=post)
        if created:
            post.like_count += 1
            post.save()
        return Response({'detail': 'Liked.' if created else 'Already liked.'})

    @action(detail=True, methods=['delete'])
    def unlike(self, request, pk=None):
        post = self.get_object()
        like = Like.objects.filter(user=request.user, post=post).first()
        if like:
            like.delete()
            post.like_count -= 1
            post.save()
            return Response({'detail': 'Unliked.'})
        return Response({'detail': 'Not liked.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='like-status')
    def like_status(self, request, pk=None):
        post = self.get_object()
        liked = Like.objects.filter(user=request.user, post=post).exists()
        return Response({'liked': liked})

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        post = self.get_object()
        
        if request.method == 'GET':
            comments = post.comments.filter(is_active=True).order_by('-created_at')
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = CommentSerializer(data=request.data)
            if serializer.is_valid():
                comment = serializer.save(author=request.user, post=post)
                post.comment_count += 1
                post.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



