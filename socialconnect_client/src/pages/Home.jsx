import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">SocialConnect</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with friends, share your thoughts, and discover what's happening around the world.
          </p>
        </div>

        {user ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Welcome back, {user.username}!
            </h2>
            <p className="text-gray-600 mb-8">Ready to see what's happening in your network?</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/feed" 
                className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                View Feed
              </Link>
              <Link 
                to="/profile/me" 
                className="inline-flex items-center justify-center px-8 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Join the Conversation
            </h2>
            <p className="text-gray-600 mb-8">
              Create an account or sign in to start connecting with people around the world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                Get Started
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center px-8 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default Home;