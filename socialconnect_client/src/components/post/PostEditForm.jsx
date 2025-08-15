import { useState } from 'react';
import { updatePost } from '../../services/api';
import { showToast } from '../../utils/toast';

function PostEditForm({ post, onEditComplete, onCancel }) {
  const [editData, setEditData] = useState({
    content: post.content,
    category: post.category,
    image: null,
  });

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
      onEditComplete();
      showToast.success('Post updated successfully!');
    } catch (error) {
      console.error('Edit post failed:', error.response?.data || error.message);
      showToast.error('Failed to update post.');
    }
  };

  return (
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
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default PostEditForm;