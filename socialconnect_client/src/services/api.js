// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (err) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const register = (data) => api.post('/api/auth/register/', data);
export const login = (data) => api.post('/api/auth/login/', data);
export const logout = (data) => api.post('/api/auth/logout/', data);
export const verifyEmail = (data) => api.post('/api/auth/verify/', data);

// // src/services/api.js (relevant excerpts)
// export const resetPassword = (data) => api.post('/api/auth/password-reset/', data);
// export const resetPasswordConfirm = (data) => api.post('/api/auth/password-reset-confirm/', data);
// export const changePassword = (data) => api.post('/api/auth/change-password/', data);

export const resetPassword = (data) => api.post('/api/auth/password-reset/', data);
export const resetPasswordConfirm = (data) => api.post('/api/auth/password-reset-confirm/', data);
export const changePassword = (data) => api.post('/api/auth/change-password/', data);

export const getProfile = () => api.get('/api/users/me/');
export const updateProfile = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => formData.append(key, data[key]));
  return api.patch('/api/users/me/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getUser = (userId) => api.get(`/api/users/${userId}/`);
export const followUser = (userId) => api.post(`/api/users/${userId}/follow/`);
export const unfollowUser = (userId) => api.delete(`/api/users/${userId}/unfollow/`);
export const getFollowers = (userId) => api.get(`/api/users/${userId}/followers/`);
export const getFollowing = (userId) => api.get(`/api/users/${userId}/following/`);

export const createPost = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => formData.append(key, data[key]));
  return api.post('/api/posts/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getPost = (postId) => api.get(`/api/posts/${postId}/`);
export const updatePost = (postId, data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => formData.append(key, data[key]));
  return api.patch(`/api/posts/${postId}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deletePost = (postId) => api.delete(`/api/posts/${postId}/`);

export const getPosts = (page = 1) => api.get(`/api/posts/?page=${page}`);

export const likePost = (postId) => api.post(`/api/posts/${postId}/like/`);
export const unlikePost = (postId) => api.delete(`/api/posts/${postId}/unlike/`);
export const getLikeStatus = (postId) => api.get(`/api/posts/${postId}/like-status/`);
export const addComment = (postId, data) => api.post(`/api/posts/${postId}/comments/`, data);
export const getComments = (postId) => api.get(`/api/posts/${postId}/comments/`);
export const deleteComment = (commentId) => api.delete(`/api/comments/${commentId}/`);

export const getFeed = (page = 1) => api.get(`/api/feed/?page=${page}`);

export const getNotifications = () => api.get('/api/notifications/');
export const markNotificationRead = (notificationId) => api.post(`/api/notifications/${notificationId}/read/`);
export const markAllNotificationsRead = () => api.post('/api/notifications/mark-all-read/');

export const getAdminUsers = () => api.get('/api/admin/users/');
export const getAdminUser = (userId) => api.get(`/api/admin/users/${userId}/`);
export const deactivateUser = (userId) => api.post(`/api/admin/users/${userId}/deactivate/`);
export const activateUser = (userId) => api.post(`/api/admin/users/${userId}/activate/`);
export const getAdminPosts = () => api.get('/api/admin/posts/');
export const deleteAdminPost = (postId) => api.delete(`/api/admin/posts/${postId}/`);
export const getAdminStats = () => api.get('/api/admin/stats/');



export default api;