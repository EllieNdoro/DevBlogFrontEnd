import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PostDetail = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isAuthor, setIsAuthor] = useState(false);

  const checkAuthorization = (postData) => {
    const token = localStorage.getItem('token');
    if (token && postData && postData.author) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setIsAuthor(decoded.id === postData.author._id);
      } catch (err) {
        console.error('Error decoding token:', err);
        setIsAuthor(false);
      }
    } else {
      setIsAuthor(false);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`/api/posts/${id}`);
        setPost(res.data);
        checkAuthorization(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load post');
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    const handleAuthChange = () => {
      if (post) {
        checkAuthorization(post);
      }
    };

    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [post]);

  const deletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/posts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        navigate('/');
      } catch (err) {
        setError('Failed to delete post');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/" className="btn btn-secondary">Back to Home</Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info">Post not found</div>
        <Link to="/" className="btn btn-secondary">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <article className="card border-0 shadow-sm">
            {post.imageUrl && (
              <img 
                src={post.imageUrl} 
                className="post-detail-image" 
                alt={post.title}
              />
            )}
            <div className="card-body p-4 p-md-5">
              <h1 className="display-4 mb-3">{post.title}</h1>
              {post.subtitle && (
                <h2 className="h4 text-muted mb-4">{post.subtitle}</h2>
              )}
              
              <div className="post-meta mb-4 pb-3 border-bottom">
                <span className="me-3">
                  <strong>Author:</strong> {post.author ? post.author.username : 'Unknown'}
                </span>
                <span>
                  <strong>Published:</strong> {new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                {post.updatedAt !== post.createdAt && (
                  <span className="ms-3 text-muted">
                    (Updated: {new Date(post.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })})
                  </span>
                )}
              </div>
              
              <div className="post-content" style={{ whiteSpace: 'pre-line' }}>
                {post.content}
              </div>
              
              <hr className="my-4" />
              
              <div className="d-flex flex-wrap gap-2">
                <Link to="/" className="btn btn-secondary">
                  ← Back to Posts
                </Link>
                {isAuthor && (
                  <>
                    <Link to={`/edit/${post._id}`} className="btn btn-primary">
                      ✏️ Edit Post
                    </Link>
                    <button onClick={deletePost} className="btn btn-danger">
                      🗑️ Delete Post
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;

