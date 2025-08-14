import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { likePost, unlikePost, addComment, getComments, deletePost, updatePost, followUser, unfollowUser, getFollowing } from '../services/api';
import { showToast } from '../utils/toast';

function PostCard({ post, onDelete }) {
  const { user } = useContext(AuthContext);
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    content: post.content,
    category: post.category,
    image: null,
  });
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

  const handleComment = async (e) => {
    e.preventDefault();
    try {
      await addComment(post.id, { content: commentContent });
      setCommentContent('');
      const response = await getComments(post.id);
      setComments(response.data);
      showToast.success('Comment added!');
    } catch (error) {
      console.error('Comment failed:', error);
      showToast.error('Failed to add comment.');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      onDelete(post.id);
      setIsDeleteModalOpen(false);
      showToast.success('Post deleted successfully.');
    } catch (error) {
      console.error('Delete post failed:', error);
      showToast.error('Failed to delete post.');
    }
  };

  const handleFollow = async () => {
    try {
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
      await unfollowUser(post.author.id);
      setIsFollowing(false);
      showToast.success(`Unfollowed ${post.author.username}.`);
    } catch (error) {
      console.error('Unfollow failed:', error);
      showToast.error('Failed to unfollow user.');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editData.content.trim()) {
      console.error('Content cannot be empty.');
      showToast.error('Content cannot be empty.');
      return;
    }
    if (editData.content.length > 280) {
      console.error('Content cannot exceed 280 characters.');
      showToast.error('Content cannot exceed 280 characters.');
      return;
    }
    if (!['general', 'announcement', 'question'].includes(editData.category)) {
      console.error('Invalid category.');
      showToast.error('Invalid category selected.');
      return;
    }
    if (editData.image && editData.image.size > 2 * 1024 * 1024) {
      console.error('Image size exceeds 2MB.');
      showToast.error('Image size exceeds 2MB.');
      return;
    }
    if (editData.image && !['image/jpeg', 'image/png'].includes(editData.image.type)) {
      console.error('Image must be JPEG or PNG.');
      showToast.error('Image must be JPEG or PNG.');
      return;
    }
    
    try {
      const updatePayload = {
        content: editData.content.trim(),
        category: editData.category,
      };
      if (editData.image) {
        updatePayload.image = editData.image;
      }
      await updatePost(post.id, updatePayload);
      setIsEditing(false);
      onDelete(post.id); // Trigger reload in parent
      showToast.success('Post updated successfully!');
    } catch (error) {
      console.error('Edit post failed:', error.response?.data || error.message);
      showToast.error('Failed to update post.');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await getComments(post.id);
      setComments(response.data);
    } catch (error) {
      console.error('Fetch comments failed:', error);
      showToast.error('Failed to load comments.');
    }
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
          <form onSubmit={handleEdit} className="space-y-4">
            <textarea
              value={editData.content}
              onChange={(e) => setEditData({ ...editData, content: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-sm"
              maxLength="280"
              rows="4"
              placeholder="What's on your mind?"
            />
            
            <select
              value={editData.category}
              onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-sm"
            >
              <option value="general">General</option>
              <option value="announcement">Announcement</option>
              <option value="question">Question</option>
            </select>
            
            <div className="relative">
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => setEditData({ ...editData, image: e.target.files[0] })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-900 hover:file:bg-gray-200"
              />
            </div>
            
            <div className="flex space-x-3">
              <button 
                type="submit" 
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
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
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleLike} 
            className={`flex items-center space-x-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
              liked ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{liked ? 'Liked' : 'Like'} ({likeCount})</span>
          </button>
          
          <button 
            onClick={fetchComments} 
            className="flex items-center space-x-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comments ({post.comment_count})</span>
          </button>

          {user && user.id === post.author.id && (
            <>
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center space-x-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>
              
              <button 
                onClick={() => setIsDeleteModalOpen(true)} 
                className="flex items-center space-x-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-2">
                <div className="h-8 w-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-xs">
                    {comment.author.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">{comment.author.username}</span>
                    <span className="text-gray-700 ml-2">{comment.content}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment Form */}
      {user && (
        <div className="p-4 border-t border-gray-100">
          <form onSubmit={handleComment} className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-xs">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                maxLength="200"
              />
              <button 
                type="submit" 
                disabled={!commentContent.trim()}
                className="px-3 py-2 bg-gray-900 text-white rounded-lg font-medium text-xs hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete Post</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded-md"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">Are you sure you want to delete this post? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostCard;