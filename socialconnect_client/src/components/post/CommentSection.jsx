import { useState } from 'react';
import { addComment, getComments,deleteComment } from '../../services/api';
import { showToast } from '../../utils/toast';

function CommentSection({ post, user }) {
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [showComments, setShowComments] = useState(false);

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

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      const response = await getComments(post.id);
      setComments(response.data);
      showToast.success('Comment deleted successfully!');
    } catch (error) {
      console.error('Delete comment failed:', error);
      showToast.error('Failed to delete comment.');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await getComments(post.id);
      setComments(response.data);
      setShowComments(true);
    } catch (error) {
      console.error('Fetch comments failed:', error);
      showToast.error('Failed to load comments.');
    }
  };

  return (
    <>
      {/* Comments Toggle Button */}
      <div className="px-4 py-3 border-t border-gray-100">
        <button 
          onClick={fetchComments} 
          className="flex items-center space-x-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Comments ({post.comment_count})</span>
        </button>
      </div>

      {/* Comments Display */}
      {showComments && comments.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-2">
                <div className="h-8 w-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-xs">
                    {comment.author.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm">
                      <span className="font-semibold text-gray-900">{comment.author.username}</span>
                      <span className="text-gray-700 ml-2">{comment.content}</span>
                    </p>
                    {user && user.id === comment.author.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="ml-2 text-gray-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 rounded-md"
                        title="Delete comment"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
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
    </>
  );
}

export default CommentSection;