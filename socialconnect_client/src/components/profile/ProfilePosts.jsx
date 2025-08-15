import PostCard from '../post/PostCard';

function ProfilePosts({ posts, isOwnProfile, handleDelete }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Posts</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {posts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m0 0V6a2 2 0 012-2h10a2 2 0 012 2v2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">
              {isOwnProfile ? "Share your first post to get started!" : "This user hasn't posted anything yet."}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-6">
              <PostCard post={post} onDelete={handleDelete} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProfilePosts;