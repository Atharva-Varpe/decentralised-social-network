import { P2PNode } from './core/p2p-node';
import { APIServer } from './api/server';

async function main() {
  const username = process.argv[2] || `User${Math.floor(Math.random() * 1000)}`;
  const p2pPort = parseInt(process.argv[3]) || 0;
  const apiPort = parseInt(process.argv[4]) || 3001;

  console.log('🚀 Starting Decentralized Social Network Node...');
  console.log(`👤 Username: ${username}`);
  console.log(`🔗 P2P Port: ${p2pPort === 0 ? 'random' : p2pPort}`);
  console.log(`🌐 API Port: ${apiPort}`);

  // Create and start P2P node
  const p2pNode = new P2PNode();
  
  try {
    await p2pNode.start(username, p2pPort);

    // Create and start API server
    const apiServer = new APIServer(p2pNode);
    await apiServer.start(apiPort);

    console.log('\n✅ Decentralized Social Network is running!');
    console.log(`📱 Open http://localhost:${apiPort} to access the web interface`);
    console.log('💬 Start creating posts and connecting with peers!');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await apiServer.stop();
      await p2pNode.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { P2PNode, APIServer };
