import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { likePost, unlikePost, getFollowing } from '../../services/api';
import { showToast } from '../../utils/toast';
import PostActions from './PostActions';
import PostEditForm from './PostEditForm';
import CommentSection from './CommentSection';
import DeleteModal from './DeleteModal';

function PostCard({ post, onDelete }) {
  const { user } = useContext(AuthContext);
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const checkFollowing = async () => {
      if (user && user.id !== post.author.id) {
        try {
          const response = await getFollowing('me');
          const followingIds = response.data.map((f) => f.id);
          setIsFollowing(followingIds.includes(post.author.id));
        } catch (error) {
          console.error('Failed to check following status:', error);
          showToast.error('Failed to check following status.');
        }
      }
    };
    checkFollowing();
  }, [user, post.author.id]);

  const handleLike = async () => {
    try {
      if (liked) {
        await unlikePost(post.id);
        setLikeCount(likeCount - 1);
        setLiked(false);
        showToast.success('Post unliked.');
      } else {
        await likePost(post.id);
        setLikeCount(likeCount + 1);
        setLiked(true);
        showToast.success('Post liked!');
      }
    } catch (error) {
      console.error('Like action failed:', error);
      showToast.error('Failed to like/unlike post.');
    }
  };

  const handleFollow = async () => {
    try {
      const { followUser } = await import('../../services/api');
      await followUser(post.author.id);
      setIsFollowing(true);
      showToast.success(`Followed ${post.author.username}!`);
    } catch (error) {
      console.error('Follow failed:', error);
      showToast.error('Failed to follow user.');
    }
  };

  const handleUnfollow = async () => {
    try {
      const { unfollowUser } = await import('../../services/api');
      await unfollowUser(post.author.id);
      setIsFollowing(false);
      showToast.success(`Unfollowed ${post.author.username}.`);
    } catch (error) {
      console.error('Unfollow failed:', error);
      showToast.error('Failed to unfollow user.');
    }
  };

  const handleEditComplete = () => {
    setIsEditing(false);
    onDelete(post.id); // Trigger reload in parent
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-900 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {post.author.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <Link 
              to={`/profile/${post.author.id}`} 
              className="font-semibold text-gray-900 hover:text-gray-700 transition-colors text-sm"
            >
              {post.author.username}
            </Link>
            <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        
        {user && user.id !== post.author.id && (
          <button
            onClick={isFollowing ? handleUnfollow : handleFollow}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
              isFollowing 
                ? 'bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <PostEditForm 
            post={post} 
            onEditComplete={handleEditComplete}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <div className="text-gray-900 leading-relaxed mb-4 text-sm">
              <p>{post.content}</p>
            </div>
            {post.image_url && (
              <div className="rounded-lg overflow-hidden mb-4">
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  className="w-full h-auto max-h-64 object-contain rounded-lg"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <PostActions 
        post={post}
        user={user}
        liked={liked}
        likeCount={likeCount}
        onLike={handleLike}
        onEdit={() => setIsEditing(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      {/* Comments Section */}
      <CommentSection post={post} user={user} />

      {/* Delete Confirmation Modal */}
      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDelete(post.id);
          setIsDeleteModalOpen(false);
        }}
        postId={post.id}
      />
    </div>
  );
}

export default PostCard;