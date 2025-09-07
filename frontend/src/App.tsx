import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, MessageCircle, Hash, Send, Heart, Share2, User } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Textarea } from './components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Input } from './components/ui/input';
import './index.css';

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
      
      if (data.type === 'post') {
        setPosts(prev => [data, ...prev]);
      } else if (data.type === 'profile') {
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <Hash size={32} />
            <h1 className="text-xl font-bold">DecentralNet</h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            {profile && (
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback>{profile.username[0]}</AvatarFallback>
                </Avatar>
                <span>{profile.username}</span>
                <span className="text-xs text-muted-foreground">({profile.id.slice(0, 8)}...)</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'feed' | 'peers')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feed">
              <MessageCircle size={18} className="mr-2" />
              Feed ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="peers">
              <Users size={18} className="mr-2" />
              Peers ({peers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-4">
            <Card>
              <CardContent className="space-y-4">
                <form onSubmit={handleCreatePost} className="space-y-2">
                  <Textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="What's on your mind? Share with the decentralized network..."
                    maxLength={280}
                    className="min-h-[80px]"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{newPost.length}/280</span>
                    <Button type="submit" disabled={!newPost.trim()}>
                      <Send size={16} className="mr-2" />
                      Post to Network
                    </Button>
                  </div>
                </form>

                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <Card className="text-center">
                      <CardContent className="p-8">
                        <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                        <CardTitle className="text-lg">No posts yet</CardTitle>
                        <CardDescription>Be the first to share something on the decentralized network!</CardDescription>
                      </CardContent>
                    </Card>
                  ) : (
                    posts.map(post => (
                      <Card key={post.id}>
                        <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                          <Avatar>
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <CardTitle className="text-sm font-medium">{post.author}</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">({post.id.slice(0, 8)}...)</CardDescription>
                          </div>
                          <div className="ml-auto text-xs text-muted-foreground">
                            {formatTime(post.timestamp)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p>{post.content}</p>
                        </CardContent>
                        <CardFooter className="flex space-x-4 border-t pt-2">
                          <Button variant="ghost" size="sm">
                            <Heart size={16} className="mr-2" />
                            Like
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 size={16} className="mr-2" />
                            Share
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="peers" className="mt-4">
            <Card>
              <CardContent className="space-y-4">
                {peers.length === 0 ? (
                  <Card className="text-center">
                    <CardContent className="p-8">
                      <Users size={48} className="mx-auto mb-2 opacity-50" />
                      <CardTitle className="text-lg">No peers connected</CardTitle>
                      <CardDescription>Waiting for other nodes to join the network...</CardDescription>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {peers.map(peer => (
                      <Card key={peer.id}>
                        <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                          <Avatar>
                            <AvatarFallback>{peer.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <CardTitle className="text-sm font-medium">{peer.username}</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">{peer.id.slice(0, 16)}...</CardDescription>
                            {peer.bio && <CardDescription className="text-sm">{peer.bio}</CardDescription>}
                          </div>
                        </CardHeader>
                        <CardFooter className="flex justify-end pt-2">
                          <Button onClick={() => handleFollow(peer.id)}>
                            Follow
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
