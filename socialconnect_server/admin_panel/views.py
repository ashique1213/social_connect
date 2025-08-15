import logging
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from accounts.models import User
from accounts.serializers import UserSerializer
from posts.models import Post
from posts.serializers import PostSerializer
from django.utils import timezone

logger = logging.getLogger('users')

class AdminPagination(PageNumberPagination):
    page_size = 20

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    http_method_names = ['get', 'post']  # List, retrieve, deactivate, activate

    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            logger.info(f"Admin {request.user.username} (ID: {request.user.id}) retrieved user list")
            return response
        except Exception as e:
            logger.error(f"Admin {request.user.username} (ID: {request.user.id}) failed to retrieve user list: {str(e)}")
            raise

    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            user = self.get_object()
            logger.info(f"Admin {request.user.username} (ID: {request.user.id}) retrieved user: {user.username} (ID: {user.id})")
            return response
        except Exception as e:
            logger.error(f"Admin {request.user.username} (ID: {request.user.id}) failed to retrieve user ID {self.kwargs.get('pk')}: {str(e)}")
            raise

    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate(self, request, pk=None):
        try:
            user = self.get_object()
            if user.is_staff:
                logger.warning(f"Admin {request.user.username} (ID: {request.user.id}) attempted to deactivate admin user: {user.username} (ID: {user.id})")
                return Response({'detail': 'Cannot deactivate admin users.'}, status=400)
            user.is_active = False
            user.save()
            logger.info(f"Admin {request.user.username} (ID: {request.user.id}) deactivated user: {user.username} (ID: {user.id})")
            return Response({'detail': 'User deactivated.'})
        except Exception as e:
            logger.error(f"Admin {request.user.username} (ID: {request.user.id}) failed to deactivate user ID {pk}: {str(e)}")
            raise

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        try:
            user = self.get_object()
            if user.is_staff:
                logger.warning(f"Admin {request.user.username} (ID: {request.user.id}) attempted to activate admin user: {user.username} (ID: {user.id})")
                return Response({'detail': 'Admin users are already active.'}, status=400)
            user.is_active = True
            user.save()
            logger.info(f"Admin {request.user.username} (ID: {request.user.id}) activated user: {user.username} (ID: {user.id})")
            return Response({'detail': 'User activated.'})
        except Exception as e:
            logger.error(f"Admin {request.user.username} (ID: {request.user.id}) failed to activate user ID {pk}: {str(e)}")
            raise

class AdminPostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    http_method_names = ['get', 'delete']  # List, retrieve, delete

    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            logger.info(f"Admin {request.user.username} (ID: {request.user.id}) retrieved post list")
            return response
        except Exception as e:
            logger.error(f"Admin {request.user.username} (ID: {request.user.id}) failed to retrieve post list: {str(e)}")
            raise

    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            post = self.get_object()
            logger.info(f"Admin {request.user.username} (ID: {request.user.id}) retrieved post ID: {post.id} by user {post.user.username}")
            return response
        except Exception as e:
            logger.error(f"Admin {request.user.username} (ID: {request.user.id}) failed to retrieve post ID {self.kwargs.get('pk')}: {str(e)}")
            raise

    def destroy(self, request, *args, **kwargs):
        try:
            post = self.get_object()
            post_id = post.id
            # user_username = post.user.username
            response = super().destroy(request, *args, **kwargs)
            logger.info(f"Admin {request.user.username} (ID: {request.user.id}) deleted post ID: {post_id} by user {user_username}")
            return response
        except Exception as e:
            logger.error(f"Admin {request.user.username} (ID: {request.user.id}) failed to delete post ID {self.kwargs.get('pk')}: {str(e)}")
            raise

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            total_users = User.objects.count()
            total_posts = Post.objects.count()
            active_today = User.objects.filter(last_login__date=timezone.now().date()).count()
            logger.info(f"Admin {request.user.username} (ID: {request.user.id}) retrieved stats: total_users={total_users}, total_posts={total_posts}, active_today={active_today}")
            return Response({
                'total_users': total_users,
                'total_posts': total_posts,
                'active_today': active_today
            })
        except Exception as e:
            logger.error(f"Admin {request.user.username} (ID: {request.user.id}) failed to retrieve stats: {str(e)}")
            raise