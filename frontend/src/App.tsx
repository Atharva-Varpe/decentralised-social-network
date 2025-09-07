import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, MessageCircle, Hash, Send, Heart, Share2, User } from 'lucide-react';
import './App.css';

interface SocialPost {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  signature: string;
}

interface UserProfile {
  id: string;
  username: string;
  publicKey: string;
  bio?: string;
  avatar?: string;
}

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [peers, setPeers] = useState<UserProfile[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'peers'>('feed');

  useEffect(() => {
    loadData();
    setupEventSource();
  }, []);

  const loadData = async () => {
    try {
      const [postsRes, peersRes, profileRes] = await Promise.all([
        axios.get(`${API_BASE}/posts`),
        axios.get(`${API_BASE}/peers`),
        axios.get(`${API_BASE}/profile`).catch(() => ({ data: null }))
      ]);

      setPosts((postsRes.data as SocialPost[]) || []);
      setPeers((peersRes.data as UserProfile[]) || []);
      if (profileRes.data) {
        setProfile(profileRes.data as UserProfile);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupEventSource = () => {
    const eventSource = new EventSource(`${API_BASE}/events`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (event.type === 'post') {
        setPosts(prev => [data, ...prev]);
      } else if (event.type === 'profile') {
        setPeers(prev => {
          const exists = prev.find(p => p.id === data.id);
          if (exists) return prev;
          return [...prev, data];
        });
      }
    };

    return () => eventSource.close();
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      await axios.post(`${API_BASE}/posts`, { content: newPost });
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await axios.post(`${API_BASE}/follow`, { userId });
      alert('User followed successfully!');
    } catch (error) {
      console.error('Error following user:', error);
      alert('Failed to follow user');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Connecting to the decentralized network...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Hash size={32} />
            <h1>DecentralNet</h1>
          </div>
          <div className="user-info">
            {profile && (
              <div className="profile-badge">
                <User size={20} />
                <span>{profile.username}</span>
                <span className="user-id">({profile.id.slice(0, 8)}...)</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="nav-tabs">
        <button 
          className={`tab ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <MessageCircle size={18} />
          Feed ({posts.length})
        </button>
        <button 
          className={`tab ${activeTab === 'peers' ? 'active' : ''}`}
          onClick={() => setActiveTab('peers')}
        >
          <Users size={18} />
          Peers ({peers.length})
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'feed' && (
          <div className="feed">
            <form className="post-form" onSubmit={handleCreatePost}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind? Share with the decentralized network..."
                maxLength={280}
                rows={3}
              />
              <div className="post-form-footer">
                <span className="char-count">{newPost.length}/280</span>
                <button type="submit" disabled={!newPost.trim()}>
                  <Send size={16} />
                  Post to Network
                </button>
              </div>
            </form>

            <div className="posts">
              {posts.length === 0 ? (
                <div className="empty-state">
                  <MessageCircle size={48} />
                  <h3>No posts yet</h3>
                  <p>Be the first to share something on the decentralized network!</p>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="post">
                    <div className="post-header">
                      <div className="post-author">
                        <User size={20} />
                        <span className="username">{post.author}</span>
                        <span className="user-id">({post.id.slice(0, 8)}...)</span>
                      </div>
                      <span className="post-time">{formatTime(post.timestamp)}</span>
                    </div>
                    <div className="post-content">
                      {post.content}
                    </div>
                    <div className="post-actions">
                      <button className="action-btn">
                        <Heart size={16} />
                        Like
                      </button>
                      <button className="action-btn">
                        <Share2 size={16} />
                        Share
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'peers' && (
          <div className="peers">
            {peers.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <h3>No peers connected</h3>
                <p>Waiting for other nodes to join the network...</p>
              </div>
            ) : (
              <div className="peer-list">
                {peers.map(peer => (
                  <div key={peer.id} className="peer-card">
                    <div className="peer-info">
                      <User size={24} />
                      <div>
                        <h4>{peer.username}</h4>
                        <p className="peer-id">{peer.id.slice(0, 16)}...</p>
                        {peer.bio && <p className="peer-bio">{peer.bio}</p>}
                      </div>
                    </div>
                    <button 
                      className="follow-btn"
                      onClick={() => handleFollow(peer.id)}
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
