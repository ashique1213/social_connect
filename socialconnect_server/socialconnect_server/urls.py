"""
URL configuration for socialconnect_server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView

from accounts.views import RegisterView, LoginView, PasswordResetView, PasswordResetConfirmView, ChangePasswordView, VerifyEmailView
from accounts.views import UserViewSet
from posts.views import PostViewSet,FeedView
from interactions.views import CommentViewSet
from notifications.views import NotificationViewSet
from admin_panel.views import AdminUserViewSet, AdminPostViewSet, AdminStatsView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'admin/users', AdminUserViewSet, basename='admin-user')
router.register(r'admin/posts', AdminPostViewSet, basename='admin-post')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout/', TokenBlacklistView.as_view(), name='logout'),
    path('api/auth/password-reset/', PasswordResetView.as_view(), name='password_reset'),
    path('api/auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/verify/<str:uidb64>/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('api/feed/', FeedView.as_view(), name='feed'),
    path('api/admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('api/', include(router.urls)),
]
