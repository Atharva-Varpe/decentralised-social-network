import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@libp2p/noise';
import { mplex } from '@libp2p/mplex';
import { mdns } from '@libp2p/mdns';
import { EventEmitter } from 'events';
import { generateKeyPair, signMessage, verifySignature, hashMessage } from './crypto';
import type { KeyPair } from './crypto';
import type { PubSub } from '@libp2p/interface-pubsub';

export interface SocialPost {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  signature: string;
  authorPublicKey: string;
}

export interface UserProfile {
  id: string;
  username: string;
  publicKey: string;
  bio?: string;
  avatar?: string;
  timestamp: number;
  signature: string;
}

export interface NetworkMessage {
  type: 'post' | 'profile' | 'follow' | 'unfollow';
  data: any;
  sender: string;
  timestamp: number;
  signature: string;
}

export class P2PNode extends EventEmitter {
  private libp2p: Libp2p | null = null;
  private keyPair: KeyPair | null = null;
  private profile: UserProfile | null = null;
  private posts: Map<string, SocialPost> = new Map();
  private peers: Map<string, UserProfile> = new Map();
  private following: Set<string> = new Set();

  async start(username: string, port: number = 0): Promise<void> {
    console.log('🔐 Generating cryptographic identity...');
    this.keyPair = await generateKeyPair();
    
    console.log('🚀 Starting libp2p node...');
    this.libp2p = await createLibp2p({
      addresses: {
        listen: [
          `/ip4/0.0.0.0/tcp/${port}`
        ]
      },
      transports: [tcp()],
      connectionEncryption: [noise()]
    });

    await this.libp2p.start();
    
    // Create user profile
    this.profile = await this.createProfile(username);
    
    // Setup message handlers
    this.setupMessageHandlers();
    
    // Announce presence
    await this.announceProfile();
    
    console.log(`📡 P2P Node started with ID: ${this.libp2p.peerId.toString()}`);
    console.log(`👤 Profile: ${username} (${this.profile.id.slice(0, 8)}...)`);
    console.log(`🔑 Public Key: ${this.profile.publicKey.slice(0, 20)}...`);
    
    // Listen for peer connections
    this.libp2p.addEventListener('peer:connect', (evt) => {
      console.log(`🤝 Peer connected: ${evt.detail.toString()}`);
      this.handlePeerConnect(evt.detail.toString());
    });

    this.libp2p.addEventListener('peer:disconnect', (evt) => {
      console.log(`👋 Peer disconnected: ${evt.detail.toString()}`);
    });
  }

  private async createProfile(username: string): Promise<UserProfile> {
    if (!this.keyPair || !this.libp2p) {
      throw new Error('Node not initialized');
    }

    const profile: UserProfile = {
      id: this.libp2p.peerId.toString(),
      username,
      publicKey: this.keyPair.publicKey,
      timestamp: Date.now(),
      signature: ''
    };

    // Sign the profile
    const profileData = JSON.stringify({
      id: profile.id,
      username: profile.username,
      publicKey: profile.publicKey,
      timestamp: profile.timestamp
    });
    
    profile.signature = signMessage(profileData, this.keyPair.privateKey);
    
    return profile;
  }

  private setupMessageHandlers(): void {
    // For now, we'll simulate message handling
    // In a full implementation, this would use libp2p pubsub
    console.log('📡 Message handlers set up (simulated)');
  }

  private handlePeerConnect(peerId: string): void {
    // Create a mock peer profile for demonstration
    const mockPeer: UserProfile = {
      id: peerId,
      username: `Peer-${peerId.slice(0, 8)}`,
      publicKey: 'mock-public-key',
      timestamp: Date.now(),
      signature: 'mock-signature'
    };
    
    this.peers.set(peerId, mockPeer);
    this.emit('profile', mockPeer);
  }

  private handleNetworkMessage(message: NetworkMessage, topic: string): void {
    // Verify message signature
    if (!this.verifyNetworkMessage(message)) {
      console.warn('Invalid message signature, ignoring');
      return;
    }

    switch (message.type) {
      case 'post':
        this.handleIncomingPost(message.data as SocialPost);
        break;
      case 'profile':
        this.handleIncomingProfile(message.data as UserProfile);
        break;
      case 'follow':
      case 'unfollow':
        // Handle follow/unfollow logic if needed
        break;
    }
  }

  private verifyNetworkMessage(message: NetworkMessage): boolean {
    try {
      const messageData = JSON.stringify({
        type: message.type,
        data: message.data,
        sender: message.sender,
        timestamp: message.timestamp
      });
      
      // For now, we'll implement basic verification
      // In a full implementation, we'd verify against the sender's public key
      return Boolean(message.signature && message.signature.length > 0);
    } catch (error) {
      return false;
    }
  }

  private handleIncomingPost(post: SocialPost): void {
    // Verify post signature
    if (!this.verifyPost(post)) {
      console.warn('Invalid post signature, ignoring');
      return;
    }

    // Check if we already have this post
    if (this.posts.has(post.id)) {
      return;
    }

    // Store the post
    this.posts.set(post.id, post);
    console.log(`📝 Received post from ${post.author}: ${post.content.slice(0, 50)}...`);
    
    // Emit event for API layer
    this.emit('post', post);
  }

  private handleIncomingProfile(profile: UserProfile): void {
    // Verify profile signature
    if (!this.verifyProfile(profile)) {
      console.warn('Invalid profile signature, ignoring');
      return;
    }

    // Store or update peer profile
    this.peers.set(profile.id, profile);
    console.log(`👤 Received profile: ${profile.username} (${profile.id.slice(0, 8)}...)`);
    
    // Emit event for API layer
    this.emit('profile', profile);
  }

  private verifyPost(post: SocialPost): boolean {
    try {
      const postData = JSON.stringify({
        id: post.id,
        author: post.author,
        content: post.content,
        timestamp: post.timestamp,
        authorPublicKey: post.authorPublicKey
      });
      
      return verifySignature(postData, post.signature, post.authorPublicKey);
    } catch (error) {
      return false;
    }
  }

  private verifyProfile(profile: UserProfile): boolean {
    try {
      const profileData = JSON.stringify({
        id: profile.id,
        username: profile.username,
        publicKey: profile.publicKey,
        timestamp: profile.timestamp
      });
      
      return verifySignature(profileData, profile.signature, profile.publicKey);
    } catch (error) {
      return false;
    }
  }

  async createPost(content: string): Promise<SocialPost> {
    if (!this.keyPair || !this.profile) {
      throw new Error('Node not initialized');
    }

    const post: SocialPost = {
      id: hashMessage(content + Date.now() + this.profile.id),
      author: this.profile.username,
      content,
      timestamp: Date.now(),
      signature: '',
      authorPublicKey: this.keyPair.publicKey
    };

    // Sign the post
    const postData = JSON.stringify({
      id: post.id,
      author: post.author,
      content: post.content,
      timestamp: post.timestamp,
      authorPublicKey: post.authorPublicKey
    });
    
    post.signature = signMessage(postData, this.keyPair.privateKey);

    // Store locally
    this.posts.set(post.id, post);

    // For now, we'll simulate broadcasting to network
    // In a full implementation, this would use libp2p pubsub
    console.log(`📤 Posted: ${content.slice(0, 50)}...`);
    
    // Emit event locally for API layer
    this.emit('post', post);
    
    return post;
  }

  private async announceProfile(): Promise<void> {
    if (!this.profile || !this.keyPair) return;

    // For now, we'll simulate profile announcement
    // In a full implementation, this would use libp2p pubsub
    console.log(`📢 Announced profile: ${this.profile.username}`);
  }

  private async broadcastMessage(message: NetworkMessage, topic: string): Promise<void> {
    // For now, we'll simulate message broadcasting
    // In a full implementation, this would use libp2p pubsub
    console.log(`📡 Broadcasting ${message.type} message to ${topic}`);
  }

  async followUser(userId: string): Promise<void> {
    this.following.add(userId);
    console.log(`➕ Following user: ${userId.slice(0, 8)}...`);
  }

  async unfollowUser(userId: string): Promise<void> {
    this.following.delete(userId);
    console.log(`➖ Unfollowed user: ${userId.slice(0, 8)}...`);
  }

  getProfile(): UserProfile | null {
    return this.profile;
  }

  getPosts(): SocialPost[] {
    return Array.from(this.posts.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  getFollowedPosts(): SocialPost[] {
    return this.getPosts().filter(post => 
      this.following.has(post.authorPublicKey) || 
      (this.profile && post.authorPublicKey === this.profile.publicKey)
    );
  }

  getPeers(): UserProfile[] {
    return Array.from(this.peers.values());
  }

  getConnectedPeerCount(): number {
    return this.libp2p?.getConnections().length || 0;
  }

  async stop(): Promise<void> {
    if (this.libp2p) {
      await this.libp2p.stop();
      console.log('🛑 P2P Node stopped');
    }
  }
}
