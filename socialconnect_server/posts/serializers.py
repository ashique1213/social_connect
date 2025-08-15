import logging
from rest_framework import serializers
from .models import Post
from accounts.serializers import UserSerializer
from django.conf import settings
from supabase import create_client  # type: ignore

logger = logging.getLogger('users')

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
            liked = obj.like_set.filter(user=user).exists()
            logger.debug(f"Checked like status for post ID {obj.id} by user {user.username} (ID: {user.id}): {liked}")
            return liked
        logger.debug(f"Checked like status for post ID {obj.id} by anonymous user: False")
        return False

    def create(self, validated_data):
        try:
            image = validated_data.pop('image', None)
            # Ensure author is set
            validated_data['author'] = self.context['request'].user
            post = Post(**validated_data)
            post.save()
            logger.info(f"User {self.context['request'].user.username} (ID: {self.context['request'].user.id}) created post ID: {post.id}")
            
            if image:
                if image.size > 2 * 1024 * 1024:
                    logger.warning(f"Image upload failed for post ID {post.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id}): Image size exceeds 2MB")
                    raise serializers.ValidationError({'image': 'Image size exceeds 2MB.'})
                if image.content_type not in ['image/jpeg', 'image/png']:
                    logger.warning(f"Image upload failed for post ID {post.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id}): Invalid image format ({image.content_type})")
                    raise serializers.ValidationError({'image': 'Invalid image format. Only JPEG/PNG allowed.'})
                try:
                    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                    path = f"{post.id}/{image.name}"
                    logger.debug(f"Uploading image to Supabase bucket 'posts' at path: {path} for post ID {post.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id})")
                    upload_response = supabase.storage.from_('posts').upload(
                        path,
                        image.read(),
                        {'content-type': image.content_type, 'upsert': 'true'}
                    )
                    logger.debug(f"Supabase upload response for post ID {post.id}: {upload_response}")
                    if isinstance(upload_response, dict) and 'error' in upload_response:
                        error_msg = upload_response['error']
                        if upload_response.get('statusCode') == 403:
                            error_msg = 'Permission denied: Check Supabase bucket policies.'
                        elif upload_response.get('statusCode') == 409:
                            error_msg = 'Image already exists.'
                        logger.error(f"Image upload failed for post ID {post.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id}): {error_msg}")
                        raise serializers.ValidationError({'image': f'Upload failed: {error_msg}'})
                    public_url_response = supabase.storage.from_('posts').get_public_url(path)
                    post.image_url = public_url_response if isinstance(public_url_response, str) else public_url_response.get('public_url', '')
                    if not post.image_url:
                        logger.error(f"Failed to generate public URL for post ID {post.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id})")
                        raise serializers.ValidationError({'image': 'Failed to generate public URL.'})
                    logger.info(f"Image uploaded successfully for post ID {post.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id}). Public URL: {post.image_url}")
                    post.save()
                except Exception as e:
                    logger.error(f"Supabase error during image upload for post ID {post.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id}): {str(e)}")
                    raise serializers.ValidationError({'image': f'Failed to upload image: {str(e)}'})
            return post
        except Exception as e:
            logger.error(f"User {self.context['request'].user.username} (ID: {self.context['request'].user.id}) failed to create post: {str(e)}")
            raise

    def update(self, instance, validated_data):
        try:
            image = validated_data.pop('image', None)
            instance = super().update(instance, validated_data)
            logger.info(f"User {self.context['request'].user.username} (ID: {self.context['request'].user.id}) updated post ID: {instance.id}")
            
            if image:
                if image.size > 2 * 1024 * 1024:
                    logger.warning(f"Image upload failed for post ID {instance.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id}): Image size exceeds 2MB")
                    raise serializers.ValidationError({'image': 'Image size exceeds 2MB.'})
                if image.content_type not in ['image/jpeg', 'image/png']:
                    logger.warning(f"Image upload failed for post ID {instance.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id}): Invalid image format ({image.content_type})")
                    raise serializers.ValidationError({'image': 'Invalid image format. Only JPEG/PNG allowed.'})
                try:
                    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                    path = f"{instance.id}/{image.name}"
                    logger.debug(f"Uploading image to Supabase bucket 'posts' at path: {path} for post ID {instance.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id})")
                    upload_response = supabase.storage.from_('posts').upload(
                        path,
                        image.read(),
                        {'content-type': image.content_type, 'upsert': 'true'}
                    )
                    logger.debug(f"Supabase upload response for post ID {instance.id}: {upload_response}")
                    if isinstance(upload_response, dict) and 'error' in upload_response:
                        error_msg = upload_response['error']
                        if upload_response.get('statusCode') == 403:
                            error_msg = 'Permission denied: Check Supabase bucket policies.'
                        elif upload_response.get('statusCode') == 409:
                            error_msg = 'Image already exists.'
                        logger.error(f"Image upload failed for post ID {instance.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id}): {error_msg}")
                        raise serializers.ValidationError({'image': f'Upload failed: {error_msg}'})
                    public_url_response = supabase.storage.from_('posts').get_public_url(path)
                    instance.image_url = public_url_response if isinstance(public_url_response, str) else public_url_response.get('public_url', '')
                    if not instance.image_url:
                        logger.error(f"Failed to generate public URL for post ID {instance.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id})")
                        raise serializers.ValidationError({'image': 'Failed to generate public URL.'})
                    logger.info(f"Image uploaded successfully for post ID {instance.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id}). Public URL: {instance.image_url}")
                    instance.save()
                except Exception as e:
                    logger.error(f"Supabase error during image upload for post ID {instance.id} by user {self.context['request'].user.username} (ID: {self.context['request'].user.id}): {str(e)}")
                    raise serializers.ValidationError({'image': f'Failed to upload image: {str(e)}'})
            return instance
        except Exception as e:
            logger.error(f"User {self.context['request'].user.username} (ID: {self.context['request'].user.id}) failed to update post ID {instance.id}: {str(e)}")
            raise