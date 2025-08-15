import logging
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

logger = logging.getLogger('users')

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

    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            logger.info(f"User {request.user.username if request.user.is_authenticated else 'anonymous'} "
                        f"(ID: {request.user.id if request.user.is_authenticated else 'N/A'}) retrieved post list")
            return response
        except Exception as e:
            logger.error(f"User {request.user.username if request.user.is_authenticated else 'anonymous'} "
                         f"(ID: {request.user.id if request.user.is_authenticated else 'N/A'}) failed to retrieve post list: {str(e)}")
            raise

    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            post = self.get_object()
            logger.info(f"User {request.user.username if request.user.is_authenticated else 'anonymous'} "
                        f"(ID: {request.user.id if request.user.is_authenticated else 'N/A'}) retrieved post ID: {post.id} by {post.author.username}")
            return response
        except Exception as e:
            logger.error(f"User {request.user.username if request.user.is_authenticated else 'anonymous'} "
                         f"(ID: {request.user.id if request.user.is_authenticated else 'N/A'}) failed to retrieve post ID {self.kwargs.get('pk')}: {str(e)}")
            raise

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        try:
            post = serializer.save(author=self.request.user)
            logger.info(f"User {self.request.user.username} (ID: {self.request.user.id}) created post ID: {post.id}")
        except Exception as e:
            logger.error(f"User {self.request.user.username} (ID: {self.request.user.id}) failed to create post: {str(e)}")
            raise

    def perform_update(self, serializer):
        try:
            post = serializer.save()
            logger.info(f"User {self.request.user.username} (ID: {self.request.user.id}) updated post ID: {post.id}")
        except Exception as e:
            logger.error(f"User {self.request.user.username} (ID: {self.request.user.id}) failed to update post ID {self.get_object().id}: {str(e)}")
            raise

    def perform_destroy(self, instance):
        try:
            post_id = instance.id
            author_username = instance.author.username
            instance.delete()
            logger.info(f"User {self.request.user.username} (ID: {self.request.user.id}) deleted post ID: {post_id} by {author_username}")
        except Exception as e:
            logger.error(f"User {self.request.user.username} (ID: {self.request.user.id}) failed to delete post ID {instance.id}: {str(e)}")
            raise

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        try:
            post = self.get_object()
            _, created = Like.objects.get_or_create(user=request.user, post=post)
            if created:
                post.like_count += 1
                post.save()
                logger.info(f"User {request.user.username} (ID: {request.user.id}) liked post ID: {post.id} by {post.author.username}")
                return Response({'detail': 'Liked.'})
            logger.warning(f"User {request.user.username} (ID: {request.user.id}) already liked post ID: {post.id}")
            return Response({'detail': 'Already liked.'})
        except Exception as e:
            logger.error(f"User {request.user.username} (ID: {self.request.user.id}) failed to like post ID {pk}: {str(e)}")
            raise

    @action(detail=True, methods=['delete'])
    def unlike(self, request, pk=None):
        try:
            post = self.get_object()
            like = Like.objects.filter(user=request.user, post=post).first()
            if like:
                like.delete()
                post.like_count -= 1
                post.save()
                logger.info(f"User {request.user.username} (ID: {request.user.id}) unliked post ID: {post.id} by {post.author.username}")
                return Response({'detail': 'Unliked.'})
            logger.warning(f"User {request.user.username} (ID: {request.user.id}) attempted to unlike unliked post ID: {post.id}")
            return Response({'detail': 'Not liked.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"User {request.user.username} (ID: {self.request.user.id}) failed to unlike post ID {pk}: {str(e)}")
            raise

    @action(detail=True, methods=['get'], url_path='like-status')
    def like_status(self, request, pk=None):
        try:
            post = self.get_object()
            liked = Like.objects.filter(user=request.user, post=post).exists()
            logger.info(f"User {request.user.username} (ID: {request.user.id}) checked like status for post ID: {post.id} (liked: {liked})")
            return Response({'liked': liked})
        except Exception as e:
            logger.error(f"User {request.user.username} (ID: {self.request.user.id}) failed to check like status for post ID {pk}: {str(e)}")
            raise

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        try:
            post = self.get_object()
            if request.method == 'GET':
                comments = post.comments.filter(is_active=True).order_by('-created_at')
                serializer = CommentSerializer(comments, many=True)
                logger.info(f"User {request.user.username if request.user.is_authenticated else 'anonymous'} "
                            f"(ID: {request.user.id if request.user.is_authenticated else 'N/A'}) retrieved comments for post ID: {post.id}")
                return Response(serializer.data)
            elif request.method == 'POST':
                serializer = CommentSerializer(data=request.data)
                if serializer.is_valid():
                    comment = serializer.save(author=request.user, post=post)
                    post.comment_count += 1
                    post.save()
                    logger.info(f"User {request.user.username} (ID: {request.user.id}) created comment ID: {comment.id} on post ID: {post.id}")
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                logger.warning(f"User {request.user.username} (ID: {request.user.id}) failed to create comment on post ID: {post.id}: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"User {request.user.username if request.user.is_authenticated else 'anonymous'} "
                         f"(ID: {request.user.id if request.user.is_authenticated else 'N/A'}) failed to process comments for post ID {pk}: {str(e)}")
            raise

class FeedView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get(self, request):
        try:
            user = request.user
            # Filter posts based on author privacy
            following_ids = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
            posts = Post.objects.filter(
                Q(is_active=True) &
                (Q(author=user) |  # Own posts
                 Q(author__privacy='public') |  # Public profiles
                 Q(author__privacy='followers_only', author__in=following_ids))  # Followers-only for followed users
            ).order_by('-created_at')
            paginator = self.pagination_class()
            paginator.page_size = 20
            page = paginator.paginate_queryset(posts, request)
            serializer = PostSerializer(page, many=True, context={'request': request})
            logger.info(f"User {user.username} (ID: {user.id}) retrieved feed with {len(page)} posts")
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            logger.error(f"User {user.username} (ID: {user.id}) failed to retrieve feed: {str(e)}")
            raise