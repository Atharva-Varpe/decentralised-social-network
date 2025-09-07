import express from 'express';
import cors from 'cors';
import { P2PNode } from '../core/p2p-node';
import { sanitizeInput } from '../utils/sanitizer';
import type { SocialPost, UserProfile } from '../core/p2p-node';

export class APIServer {
  private app: express.Application;
  private server: any;
  private p2pNode: P2PNode;

  constructor(p2pNode: P2PNode) {
    this.app = express();
    this.p2pNode = p2pNode;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  private setupRoutes(): void {
    // Health check
  this.app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

    // Get current user profile
  this.app.get('/api/profile', (req, res) => {
    const profile = this.p2pNode.getProfile();
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  });

    // Get all posts
  this.app.get('/api/posts', (req, res) => {
    const posts = this.p2pNode.getPosts();
    res.json(posts);
  });

    // Get followed posts
  this.app.get('/api/posts/following', (req, res) => {
    const posts = this.p2pNode.getFollowedPosts();
    res.json(posts);
  });

    // Create a new post
  this.app.post('/api/posts', async (req, res) => {
    try {
      const { content } = req.body;
      
      const sanitizedContent = sanitizeInput(content);
      if (!sanitizedContent) {
        res.status(400).json({ error: 'Content is required and must be valid' });
        return;
      }

      if (sanitizedContent.length > 280) {
        res.status(400).json({ error: 'Post too long (max 280 characters)' });
        return;
      }

      const post = await this.p2pNode.createPost(sanitizedContent);
      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

    // Get all peers
  this.app.get('/api/peers', (req, res) => {
    const peers = this.p2pNode.getPeers();
    res.json(peers);
  });

    // Follow a user
  this.app.post('/api/follow', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      await this.p2pNode.followUser(userId);
      res.json({ success: true, message: 'User followed successfully' });
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ error: 'Failed to follow user' });
    }
  });

    // Unfollow a user
  this.app.post('/api/unfollow', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      await this.p2pNode.unfollowUser(userId);
      res.json({ success: true, message: 'User unfollowed successfully' });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ error: 'Failed to unfollow user' });
    }
  });

    // WebSocket-like endpoint for real-time updates
  this.app.get('/api/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial connection event
    sendEvent('connected', { timestamp: Date.now() });

    // Listen for new posts
    const onPost = (post: SocialPost) => {
      sendEvent('post', post);
    };

    // Listen for new profiles
    const onProfile = (profile: UserProfile) => {
      sendEvent('profile', profile);
    };

    this.p2pNode.on('post', onPost);
    this.p2pNode.on('profile', onProfile);

    // Clean up on disconnect
    req.on('close', () => {
      this.p2pNode.removeListener('post', onPost);
      this.p2pNode.removeListener('profile', onProfile);
    });
  });

  async start(port: number = 3001): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`🌐 API Server running on http://localhost:${port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      console.log('🛑 API Server stopped');
    }
  }
}
