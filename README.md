# Decentralized Social Network

A peer-to-peer social network built with libp2p, IPFS, and React. No central servers, no censorship, just pure decentralized communication.

## 🌟 Features

- **Fully Decentralized**: No central servers or authorities
- **Peer-to-Peer Networking**: Direct communication between users using libp2p
- **Cryptographic Identity**: Each user has a unique cryptographic identity
- **Real-time Updates**: Live feed updates as posts propagate through the network
- **Modern UI**: Clean, responsive React interface
- **Privacy-First**: All data remains on the network, not stored centrally

## 🏗️ Architecture

### Backend (P2P Node)
- **Node.js/TypeScript** for the core networking logic
- **libp2p** for peer-to-peer networking and discovery
- **IPFS** for distributed content storage
- **OrbitDB** for distributed database functionality
- **Express** API server for frontend communication

### Frontend (Web Interface)
- **React** with TypeScript for a modern UI
- **Responsive design** that works on desktop and mobile
- **Real-time updates** via Server-Sent Events

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd decentralised-social-network
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend node**
   ```bash
   cd backend
   npm run dev [username] [p2p-port] [api-port]
   ```
   Example:
   ```bash
   npm run dev Alice 4001 3001
   ```

2. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm start
   ```

3. **Open your browser** to `http://localhost:3000`

### Running Multiple Nodes

To test the P2P functionality, run multiple nodes:

**Terminal 1 (Alice's node):**
```bash
cd backend
npm run dev Alice 4001 3001
```

**Terminal 2 (Bob's node):**
```bash
cd backend
npm run dev Bob 4002 3002
```

**Terminal 3 (Alice's frontend):**
```bash
cd frontend
npm start
```

**Terminal 4 (Bob's frontend):**
```bash
cd frontend
REACT_APP_API_PORT=3002 npm start
```

## 🔧 Configuration

### Backend Configuration
- **Username**: Identifies your node on the network
- **P2P Port**: Port for peer-to-peer communications (0 for random)
- **API Port**: Port for the HTTP API (default: 3001)

### Frontend Configuration
Set the `REACT_APP_API_PORT` environment variable to connect to a different backend port.

## 📡 How It Works

### 1. **Node Discovery**
- Nodes discover each other using mDNS (local network)
- Bootstrap nodes can be configured for wide-area discovery
- Pubsub-based peer discovery for finding nodes with similar interests

### 2. **Identity Management**
- Each user generates a cryptographic key pair
- Public key serves as the user's unique identifier
- Private key is used to sign posts and verify identity

### 3. **Content Distribution**
- Posts are broadcast using libp2p's GossipSub protocol
- Content is validated cryptographically before display
- Network automatically propagates posts to interested peers

### 4. **Data Storage**
- Local storage using LevelDB for node-specific data
- IPFS for distributed content storage
- OrbitDB for shared database functionality

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev:watch  # Auto-restart on changes
npm run build     # Build TypeScript
npm start         # Run built version
```

### Frontend Development
```bash
cd frontend
npm start         # Development server with hot reload
npm run build     # Build for production
npm test          # Run tests
```

## 🔒 Security Considerations

- **Cryptographic Signatures**: All posts are cryptographically signed
- **Identity Verification**: Public key cryptography ensures identity authenticity
- **No Central Authority**: No single point of failure or control
- **Privacy by Design**: No user data is stored centrally

## 🌐 Network Topology

```
    ┌─────────────┐     ┌─────────────┐
    │    Alice    │────▶│     Bob     │
    │   (Node A)  │     │   (Node B)  │
    └─────────────┘     └─────────────┘
           │                     │
           │                     │
           ▼                     ▼
    ┌─────────────┐     ┌─────────────┐
    │   Charlie   │◀────│    Diana    │
    │   (Node C)  │     │   (Node D)  │
    └─────────────┘     └─────────────┘
```

Each node can connect to multiple peers, creating a resilient mesh network.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] **Enhanced Cryptography**: Implement proper post signing and verification
- [ ] **Content Moderation**: Community-based content filtering
- [ ] **File Sharing**: Support for images, videos, and documents
- [ ] **Private Messaging**: Encrypted direct messages between users
- [ ] **Groups/Communities**: Create and join topic-based communities
- [ ] **Mobile App**: Native mobile applications
- [ ] **Federation**: Connect with other decentralized social networks

## 🔗 Related Projects

- [libp2p](https://libp2p.io/) - Modular peer-to-peer networking stack
- [IPFS](https://ipfs.io/) - Distributed file system
- [OrbitDB](https://orbitdb.org/) - Distributed database for peer-to-peer applications

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Join the community discussions

---

**Built with ❤️ for a decentralized future**
