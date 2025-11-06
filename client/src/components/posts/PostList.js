import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('/api/posts');
        setPosts(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };

    checkAuth();
    window.addEventListener('authChange', checkAuth);
    
    return () => {
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero section removed comments earlier */}
      <div className="container mt-4 mb-5">
        <h2 className="mb-4">Latest Blog Posts</h2>
        {posts.length === 0 ? (
          <div className="text-center py-5">
            <h3>No posts yet</h3>
            <p className="text-muted">Be the first to share your knowledge!</p>
            {isAuthenticated && (
              <Link to="/create" className="btn btn-primary mt-3">
                Create Post
              </Link>
            )}
          </div>
        ) : (
          <div className="row">
            {posts.map(post => (
              <div className="col-md-6 col-lg-4 mb-4 fade-in" key={post._id}>
                <div className="card h-100">
                  {post.imageUrl && (
                    <img
                      src={`${process.env.REACT_APP_API_URL || ''}${post.imageUrl}`}
                      className="card-img-top"
                      alt={post.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  {!post.imageUrl && (
                    <div 
                      className="card-img-top d-flex align-items-center justify-content-center"
                      style={{ 
                        height: '200px', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontSize: '3rem'
                      }}
                    >
                      📄
                    </div>
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{post.title}</h5>
                    {post.subtitle && (
                      <h6 className="card-subtitle mb-2 text-muted">{post.subtitle}</h6>
                    )}
                    <p className="card-text flex-grow-1">
                      {post.content.length > 150 
                        ? `${post.content.substring(0, 150)}...` 
                        : post.content}
                    </p>
                    <Link to={`/posts/${post._id}`} className="btn btn-primary mt-auto">
                      Read More →
                    </Link>
                  </div>
                  <div className="card-footer text-muted bg-white">
                    <small>
                      By <strong>{post.author ? post.author.username : 'Unknown'}</strong>
                      {' • '}
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default PostList;

