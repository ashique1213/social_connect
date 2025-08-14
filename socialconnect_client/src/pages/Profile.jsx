// src/pages/Profile.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getUser, updateProfile, followUser, unfollowUser, getFollowers, getFollowing, createPost, getPosts } from '../services/api';
import PostCard from '../components/PostCard';

function Profile() {
  const { userId } = useParams();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    bio: '',
    website: '',
    location: '',
    privacy: 'public',
    avatar: null,
  });
  const [postData, setPostData] = useState({ content: '', category: 'general', image: null });
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      try {
        const id = userId || 'me';
        const [userResponse, postsResponse] = await Promise.all([
          getUser(id),
          getPosts(1, id), // Modified to fetch user's posts
        ]);
        setProfile(userResponse.data);
        setFormData({
          bio: userResponse.data.bio || '',
          website: userResponse.data.website || '',
          location: userResponse.data.location || '',
          privacy: userResponse.data.privacy || 'public',
        });
        setPosts(Array.isArray(postsResponse.data.results) ? postsResponse.data.results : []);
        const followersResponse = await getFollowers(id);
        const followingResponse = await getFollowing(id);
        setFollowers(followersResponse.data);
        setFollowing(followingResponse.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load profile or posts.');
      }
    };
    fetchProfileAndPosts();
  }, [userId]);

  const handleFollow = async () => {
    try {
      await followUser(userId);
      setFollowers([...followers, user]);
    } catch (err) {
      setError('Follow failed.');
    }
  };

  const handleUnfollow = async () => {
    try {
      await unfollowUser(userId);
      setFollowers(followers.filter((f) => f.id !== user.id));
    } catch (err) {
      setError('Unfollow failed.');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...formData };
      if (formData.avatar) {
        updateData.avatar = formData.avatar;
      }
      await updateProfile(updateData);
      const response = await getUser('me');
      setProfile(response.data);
      setError('');
      setFormData({ ...formData, avatar: null });
      setIsEditing(false);
      document.querySelector('input[type="file"][accept="image/jpeg,image/png"]:not([name])').value = '';
    } catch (err) {
      const errorMsg = err.response?.data?.avatar || err.response?.data?.detail || 'Profile update failed.';
      setError(
        errorMsg.includes('Permission denied')
          ? 'Unable to upload avatar due to server permissions. Please try again later.'
          : errorMsg.includes('Duplicate')
          ? 'Avatar already exists. Try a different file.'
          : errorMsg
      );
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postData.content.trim()) {
      setError('Post content cannot be empty.');
      return;
    }
    if (postData.content.length > 280) {
      setError('Post content cannot exceed 280 characters.');
      return;
    }
    if (!['general', 'announcement', 'question'].includes(postData.category)) {
      setError('Invalid category selected.');
      return;
    }
    if (postData.image && postData.image.size > 2 * 1024 * 1024) {
      setError('Image size exceeds 2MB.');
      return;
    }
    if (postData.image && !['image/jpeg', 'image/png'].includes(postData.image.type)) {
      setError('Image must be a JPEG or PNG file.');
      return;
    }
    try {
      const postPayload = {
        content: postData.content.trim(),
        category: postData.category,
      };
      if (postData.image) {
        postPayload.image = postData.image;
      }
      await createPost(postPayload);
      setPostData({ content: '', category: 'general', image: null });
      document.querySelector('input[type="file"][name="post-image"]').value = '';
      const postsResponse = await getPosts(1, userId || 'me');
      setPosts(Array.isArray(postsResponse.data.results) ? postsResponse.data.results : []);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.image || err.response?.data?.content || err.response?.data?.category || err.response?.data?.detail || 'Post creation failed.';
      setError(
        errorMsg.includes('Permission denied')
          ? 'Unable to upload image due to server permissions. Please try again later.'
          : errorMsg.includes('Invalid image')
          ? 'Invalid image. Ensure it is a JPEG/PNG file under 2MB.'
          : errorMsg.includes('Content cannot be empty') || errorMsg.includes('This field is required')
          ? 'Post content cannot be empty.'
          : errorMsg.includes('Category must be one of')
          ? 'Invalid category selected.'
          : errorMsg
      );
    }
  };

  const handleDelete = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const isPostFormValid = postData.content.trim().length > 0 && ['general', 'announcement', 'question'].includes(postData.category);
  const isOwnProfile = user && (!userId || userId === 'me');

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-900 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 capitalize">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error State */}
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

        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-lg">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white text-2xl md:text-3xl font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profile.username}</h1>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profile.privacy === 'public' ? 'bg-green-100 text-green-800' : 
                      profile.privacy === 'private' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {profile.privacy === 'public' ? 'Public' : 
                       profile.privacy === 'private' ? 'Private' : 
                       'Followers Only'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-4 md:mt-0">
                  {isOwnProfile ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                      </button>
                      <Link
                        to="/change-password"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Change Password
                      </Link>
                    </div>
                  ) : (
                    <div>
                      {followers.some((f) => f.id === user?.id) ? (
                        <button
                          onClick={handleUnfollow}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
                          </svg>
                          Unfollow
                        </button>
                      ) : (
                        <button
                          onClick={handleFollow}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Follow
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio and Details */}
              <div className="mt-4 space-y-2">
                {profile.bio && (
                  <p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {profile.location && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-900 hover:underline">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex space-x-6 mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{profile.posts_count}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{profile.followers_count}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{profile.following_count}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isOwnProfile && isEditing && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  maxLength="160"
                  rows="3"
                />
                <p className="mt-1 text-xs text-gray-500">{formData.bio.length}/160 characters</p>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  placeholder="Your location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="privacy" className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy Setting
                </label>
                <select
                  id="privacy"
                  value={formData.privacy}
                  onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="followers_only">Followers Only</option>
                </select>
              </div>

              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.files[0] })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">JPEG or PNG, max 2MB</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content Area */}
        {isOwnProfile || profile.privacy === 'public' || (profile.privacy === 'followers_only' && followers.some((f) => f.id === user?.id)) ? (
          <>
            {/* Create Post Form */}
            {isOwnProfile && (
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
            )}

            {/* Posts Section */}
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
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile is Private</h3>
            <p className="text-gray-600">This profile is private or restricted to followers only.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;