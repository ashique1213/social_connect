
function CreatePostForm({ postData, setPostData, handlePostSubmit }) {
  const isPostFormValid = postData.content.trim().length > 0 && ['general', 'announcement', 'question'].includes(postData.category);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Post</h2>
      <form onSubmit={handlePostSubmit} className="space-y-4">
        <div>
          <textarea
            placeholder="What's on your mind?"
            value={postData.content}
            onChange={(e) => setPostData({ ...postData, content: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
            className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            maxLength="280"
            rows="4"
          />
          <p className="mt-1 text-xs text-gray-500">{postData.content.length}/280 characters</p>
        </div>

        <div className="flex space-x-4">
          <div className="flex-1">
            <select
              value={postData.category}
              onChange={(e) => setPostData({ ...postData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="general">General</option>
              <option value="announcement">Announcement</option>
              <option value="question">Question</option>
            </select>
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/jpeg,image/png"
              name="post-image"
              onChange={(e) => setPostData({ ...postData, image: e.target.files[0] })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-3 px-4 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isPostFormValid 
              ? 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!isPostFormValid}
        >
          {isPostFormValid ? 'Share Post' : 'Enter content to post'}
        </button>
      </form>
    </div>
  );
}

export default CreatePostForm;