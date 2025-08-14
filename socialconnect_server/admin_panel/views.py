# admin_panel/views.py
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

class AdminPagination(PageNumberPagination):
    page_size = 20

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    http_method_names = ['get', 'post']  # List, retrieve, deactivate, activate

    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user.is_staff:
            return Response({'detail': 'Cannot deactivate admin users.'}, status=400)
        user.is_active = False
        user.save()
        return Response({'detail': 'User deactivated.'})

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        user = self.get_object()
        if user.is_staff:
            return Response({'detail': 'Admin users are already active.'}, status=400)
        user.is_active = True
        user.save()
        return Response({'detail': 'User activated.'})

class AdminPostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    http_method_names = ['get', 'delete']  # List, retrieve, delete

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        total_posts = Post.objects.count()
        active_today = User.objects.filter(last_login__date=timezone.now().date()).count()
        return Response({
            'total_users': total_users,
            'total_posts': total_posts,
            'active_today': active_today
        })