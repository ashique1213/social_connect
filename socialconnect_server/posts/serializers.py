from rest_framework import serializers
from .models import Post
from accounts.serializers import UserSerializer
from django.conf import settings
from supabase import create_client

class PostSerializer(serializers.ModelSerializer):
    image = serializers.FileField(write_only=True, required=False)
    author = UserSerializer(read_only=True)
    liked = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'content', 'author', 'created_at', 'updated_at', 'image_url', 'category', 'like_count', 'comment_count', 'image', 'liked']

    def get_liked(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return obj.like_set.filter(user=user).exists()
        return False

    def create(self, validated_data):
        image = validated_data.pop('image', None)
        # Ensure author is set
        validated_data['author'] = self.context['request'].user
        post = Post(**validated_data)
        post.save()
        if image:
            if image.size > 2 * 1024 * 1024:
                raise serializers.ValidationError({'image': 'Image size exceeds 2MB.'})
            if image.content_type not in ['image/jpeg', 'image/png']:
                raise serializers.ValidationError({'image': 'Invalid image format. Only JPEG/PNG allowed.'})
            try:
                supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                path = f"{post.id}/{image.name}"
                print(f"Uploading to bucket 'posts' at path: {path}")  # Debugging
                upload_response = supabase.storage.from_('posts').upload(
                    path,
                    image.read(),
                    {'content-type': image.content_type, 'upsert': 'true'}
                )
                print(f"Upload response: {upload_response}")  # Debugging
                if isinstance(upload_response, dict) and 'error' in upload_response:
                    error_msg = upload_response['error']
                    if upload_response.get('statusCode') == 403:
                        error_msg = 'Permission denied: Check Supabase bucket policies.'
                    elif upload_response.get('statusCode') == 409:
                        error_msg = 'Image already exists.'
                    raise serializers.ValidationError({'image': f'Upload failed: {error_msg}'})
                public_url_response = supabase.storage.from_('posts').get_public_url(path)
                post.image_url = public_url_response if isinstance(public_url_response, str) else public_url_response.get('public_url', '')
                if not post.image_url:
                    raise serializers.ValidationError({'image': 'Failed to generate public URL.'})
                print(f"Public URL: {post.image_url}")  # Debugging
                post.save()
            except Exception as e:
                print(f"Supabase error: {str(e)}")  # Debugging
                raise serializers.ValidationError({'image': f'Failed to upload image: {str(e)}'})
        return post

    def update(self, instance, validated_data):
        image = validated_data.pop('image', None)
        instance = super().update(instance, validated_data)
        if image:
            if image.size > 2 * 1024 * 1024:
                raise serializers.ValidationError({'image': 'Image size exceeds 2MB.'})
            if image.content_type not in ['image/jpeg', 'image/png']:
                raise serializers.ValidationError({'image': 'Invalid image format. Only JPEG/PNG allowed.'})
            try:
                supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                path = f"{instance.id}/{image.name}"
                print(f"Uploading to bucket 'posts' at path: {path}")  # Debugging
                upload_response = supabase.storage.from_('posts').upload(
                    path,
                    image.read(),
                    {'content-type': image.content_type, 'upsert': 'true'}
                )
                print(f"Upload response: {upload_response}")  # Debugging
                if isinstance(upload_response, dict) and 'error' in upload_response:
                    error_msg = upload_response['error']
                    if upload_response.get('statusCode') == 403:
                        error_msg = 'Permission denied: Check Supabase bucket policies.'
                    elif upload_response.get('statusCode') == 409:
                        error_msg = 'Image already exists.'
                    raise serializers.ValidationError({'image': f'Upload failed: {error_msg}'})
                public_url_response = supabase.storage.from_('posts').get_public_url(path)
                instance.image_url = public_url_response if isinstance(public_url_response, str) else public_url_response.get('public_url', '')
                if not instance.image_url:
                    raise serializers.ValidationError({'image': 'Failed to generate public URL.'})
                print(f"Public URL: {instance.image_url}")  # Debugging
                instance.save()
            except Exception as e:
                print(f"Supabase error: {str(e)}")  # Debugging
                raise serializers.ValidationError({'image': f'Failed to upload image: {str(e)}'})
        return instance