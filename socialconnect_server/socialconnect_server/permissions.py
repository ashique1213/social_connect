from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # For Post/Comment: obj.author, for others adjust
        if hasattr(obj, 'author'):
            return obj.author == request.user or request.user.is_staff
        return obj == request.user or request.user.is_staff