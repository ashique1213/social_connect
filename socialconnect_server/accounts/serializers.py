from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions
from .utils import send_verification_email
from .models import User
from supabase import create_client
from django.conf import settings

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'first_name', 'last_name']

    def validate_username(self, value):
        if not (3 <= len(value) <= 30 and (value.isalnum() or '_' in value)):
            raise serializers.ValidationError("Username must be 3-30 characters, alphanumeric or underscore.")
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except exceptions.ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.is_active = False
        user.save()
        # send_verification_email(user)
        send_verification_email(user, self.context.get('request'))
        return user

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.FileField(write_only=True, required=False)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'avatar_url', 'website', 'location', 'privacy', 'avatar', 'followers_count', 'following_count', 'posts_count','is_staff','is_active']
        read_only_fields = ['email', 'followers_count', 'following_count', 'posts_count','is_staff','is_active']

    def get_followers_count(self, obj):
        return obj.followers_set.count()

    def get_following_count(self, obj):
        return obj.following_set.count()

    def get_posts_count(self, obj):
        return obj.posts.count()

    def update(self, instance, validated_data):
        if 'avatar' in self.context.get('request').FILES:
            file = self.context['request'].FILES['avatar']
            if file.size > 2 * 1024 * 1024:
                raise serializers.ValidationError({'avatar': 'File size exceeds 2MB.'})
            if file.content_type not in ['image/jpeg', 'image/png']:
                raise serializers.ValidationError({'avatar': 'Invalid file format. Only JPEG/PNG allowed.'})
            try:
                supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                path = f"{instance.id}/{file.name}"
                print(f"Uploading to bucket 'avatars' at path: {path}")  # Debugging
                upload_response = supabase.storage.from_('avatars').upload(
                    path,
                    file.read(),
                    {'content-type': file.content_type, 'upsert': 'true'}
                )
                print(f"Upload response: {upload_response}")  # Debugging
                # Check if upload_response is a dictionary with an error
                if isinstance(upload_response, dict) and 'error' in upload_response:
                    error_msg = upload_response['error']
                    if upload_response.get('statusCode') == 403:
                        error_msg = 'Permission denied: Check Supabase bucket policies.'
                    raise serializers.ValidationError({'avatar': f'Upload failed: {error_msg}'})
                # If upload_response is an UploadResponse object, assume success
                public_url_response = supabase.storage.from_('avatars').get_public_url(path)
                validated_data['avatar_url'] = public_url_response if isinstance(public_url_response, str) else public_url_response.get('public_url', '')
                print(f"Public URL: {validated_data['avatar_url']}")  # Debugging
            except Exception as e:
                print(f"Supabase error: {str(e)}")  # Debugging
                raise serializers.ValidationError({'avatar': f'Failed to upload avatar: {str(e)}'})
        return super().update(instance, validated_data)