import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getUser, updateProfile, followUser, unfollowUser, getFollowers, getFollowing, createPost, getPosts } from '../services/api';
import { toast } from 'react-toastify';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileEditForm from '../components/profile/ProfileEditForm';
import CreatePostForm from '../components/profile/CreatePostForm';
import ProfilePosts from '../components/profile/ProfilePosts';
import PrivateProfileMessage from '../components/profile/PrivateProfileMessage';

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

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      try {
        const id = userId || 'me';
        const [userResponse, postsResponse] = await Promise.all([
          getUser(id),
          getPosts(1, id),
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
      toast.success(`Followed ${profile.username}!`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    } catch (err) {
      setError('Follow failed.');
      toast.error('Failed to follow user.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    }
  };

  const handleUnfollow = async () => {
    try {
      await unfollowUser(userId);
      setFollowers(followers.filter((f) => f.id !== user.id));
      toast.success(`Unfollowed ${profile.username}.`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
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

  const isOwnProfile = user && (!userId || userId === 'me');
  const canViewContent = isOwnProfile || profile?.privacy === 'public' || (profile?.privacy === 'followers_only' && followers.some((f) => f.id === user?.id));

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
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          followers={followers}
          user={user}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          handleFollow={handleFollow}
          handleUnfollow={handleUnfollow}
        />

        {/* Edit Profile Form */}
        {isOwnProfile && isEditing && (
          <ProfileEditForm
            formData={formData}
            setFormData={setFormData}
            handleProfileUpdate={handleProfileUpdate}
            setIsEditing={setIsEditing}
          />
        )}

        {/* Content Area */}
        {canViewContent ? (
          <>
            {/* Create Post Form */}
            {isOwnProfile && (
              <CreatePostForm
                postData={postData}
                setPostData={setPostData}
                handlePostSubmit={handlePostSubmit}
              />
            )}

            {/* Posts Section */}
            <ProfilePosts
              posts={posts}
              isOwnProfile={isOwnProfile}
              handleDelete={handleDelete}
            />
          </>
        ) : (
          <PrivateProfileMessage />
        )}
      </div>
    </div>
  );
}

export default Profile;