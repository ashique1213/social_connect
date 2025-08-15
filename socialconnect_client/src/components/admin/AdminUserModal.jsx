
function AdminUserModal({ isModalOpen, selectedUser, closeModal }) {
  if (!isModalOpen || !selectedUser) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {selectedUser.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900">{selectedUser.username}</h4>
              <p className="text-gray-600">{selectedUser.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Bio</h5>
                <p className="mt-1 text-gray-900">{selectedUser.bio || 'Not provided'}</p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Location</h5>
                <p className="mt-1 text-gray-900">{selectedUser.location || 'Not provided'}</p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Website</h5>
                <p className="mt-1 text-gray-900">{selectedUser.website || 'Not provided'}</p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Privacy</h5>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedUser.privacy === 'public' ? 'bg-green-100 text-green-800' : 
                  selectedUser.privacy === 'private' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedUser.privacy || 'public'}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {/* <div>
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Join Date</h5>
                <p className="mt-1 text-gray-900">{new Date(selectedUser.date_joined).toLocaleDateString()}</p>
              </div> */}
              <div>
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Followers</h5>
                <p className="mt-1 text-gray-900">{selectedUser.followers_count || 0}</p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Following</h5>
                <p className="mt-1 text-gray-900">{selectedUser.following_count || 0}</p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Posts</h5>
                <p className="mt-1 text-gray-900">{selectedUser.posts_count || 0}</p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Status</h5>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={closeModal}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUserModal;