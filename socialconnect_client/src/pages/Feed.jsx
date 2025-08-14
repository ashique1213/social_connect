import { useState, useEffect } from 'react';
import { getFeed } from '../services/api';
import PostCard from '../components/PostCard';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getFeed(page);
        const results = Array.isArray(response.data.results) ? response.data.results : [];
        setPosts(results);
        const count = response.data.count || 0;
        setTotalPages(Math.ceil(count / 20));
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load feed.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [page]);

  const handleDelete = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  return (
    <div className="max-w-3xl mx-auto capitalize">
      <h2 className="text-2xl font-bold mb-4">Your Feed</h2>
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && posts.length === 0 && !error && (
        <p className="text-gray-500">No posts to show.</p>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={handleDelete} />
      ))}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1 || loading}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          Previous
        </button>
        <span className="self-center">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages || loading}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Feed;