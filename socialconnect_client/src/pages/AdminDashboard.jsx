import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAdminUsers, deactivateUser, activateUser, getAdminPosts, deleteAdminPost, getAdminStats, getAdminUser } from '../services/api';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminPosts from '../components/admin/AdminPosts';
import AdminUserModal from '../components/admin/AdminUserModal';

function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [postPage, setPostPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [postTotalPages, setPostTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user?.is_staff) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersResponse, postsResponse, statsResponse] = await Promise.all([
          getAdminUsers(userPage),
          getAdminPosts(postPage),
          getAdminStats(),
        ]);
        const userData = usersResponse.data.results ? usersResponse.data.results : Array.isArray(usersResponse.data) ? usersResponse.data : [];
        const postData = postsResponse.data.results ? postsResponse.data.results : Array.isArray(postsResponse.data) ? postsResponse.data : [];
        setUsers(userData);
        setPosts(postData);
        setStats(statsResponse.data);
        setUserTotalPages(Math.ceil((usersResponse.data.count || userData.length) / 20));
        setPostTotalPages(Math.ceil((postsResponse.data.count || postData.length) / 20));
        setError('');
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load admin data.');
        setUsers([]);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, userPage, postPage]);

  const handleToggleActive = async (userId, isActive) => {
    try {
      if (isActive) {
        await deactivateUser(userId);
        setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: false } : u)));
      } else {
        await activateUser(userId);
        setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: true } : u)));
      }
      setError('');
    } catch (err) {
      setError(`Failed to ${isActive ? 'deactivate' : 'activate'} user.`);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteAdminPost(postId);
      setPosts(posts.filter((post) => post.id !== postId));
      setError('');
    } catch (err) {
      setError('Failed to delete post.');
    }
  };

  const handleUserClick = async (userId) => {
    try {
      const response = await getAdminUser(userId);
      setSelectedUser(response.data);
      setIsModalOpen(true);
      setError('');
    } catch (err) {
      setError('Failed to load user details.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  if (!user?.is_staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center max-w-md">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You need administrator privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-900 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview'},
    { id: 'users', name: 'Users'},
    { id: 'posts', name: 'Posts'},
  ];

  return (
    <div className="min-h-screen bg-gray-50 capitalize">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, posts, and monitor platform activity</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Render Active Tab Component */}
        {activeTab === 'overview' && (
          <AdminOverview stats={stats} />
        )}

        {activeTab === 'users' && (
          <AdminUsers
            users={users}
            userPage={userPage}
            userTotalPages={userTotalPages}
            setUserPage={setUserPage}
            handleToggleActive={handleToggleActive}
            handleUserClick={handleUserClick}
          />
        )}

        {activeTab === 'posts' && (
          <AdminPosts
            posts={posts}
            postPage={postPage}
            postTotalPages={postTotalPages}
            setPostPage={setPostPage}
            handleDeletePost={handleDeletePost}
          />
        )}

        {/* User Details Modal */}
        <AdminUserModal
          isModalOpen={isModalOpen}
          selectedUser={selectedUser}
          closeModal={closeModal}
        />
      </div>
    </div>
  );
}

export default AdminDashboard;