import logging
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import Notification
from .serializers import NotificationSerializer

logger = logging.getLogger('users')

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notifications.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        try:
            response = super().list(request, *args, **kwargs)
            logger.info(f"User {request.user.username} (ID: {request.user.id}) retrieved notification list")
            return response
        except Exception as e:
            logger.error(f"User {request.user.username} (ID: {request.user.id}) failed to retrieve notification list: {str(e)}")
            raise

    def retrieve(self, request, *args, **kwargs):
        try:
            response = super().retrieve(request, *args, **kwargs)
            notification = self.get_object()
            logger.info(f"User {request.user.username} (ID: {request.user.id}) retrieved notification ID: {notification.id}")
            return response
        except Exception as e:
            logger.error(f"User {request.user.username} (ID: {request.user.id}) failed to retrieve notification ID {self.kwargs.get('pk')}: {str(e)}")
            raise

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        try:
            notification = self.get_object()
            if notification.is_read:
                logger.warning(f"User {request.user.username} (ID: {request.user.id}) attempted to mark already-read notification ID: {notification.id}")
            notification.is_read = True
            notification.save()
            logger.info(f"User {request.user.username} (ID: {request.user.id}) marked notification ID: {notification.id} as read")
            return Response({'detail': 'Marked as read.'})
        except Exception as e:
            logger.error(f"User {request.user.username} (ID: {request.user.id}) failed to mark notification ID {pk} as read: {str(e)}")
            raise

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        try:
            updated_count = request.user.notifications.filter(is_read=False).update(is_read=True)
            logger.info(f"User {request.user.username} (ID: {request.user.id}) marked {updated_count} notifications as read")
            return Response({'detail': 'All marked as read.'})
        except Exception as e:
            logger.error(f"User {request.user.username} (ID: {request.user.id}) failed to mark all notifications as read: {str(e)}")
            raise