import PeerManager from './peer-manager.js';
import MouseTracker from './mouse-tracker.js';
import CursorRenderer from './cursor-renderer.js';
import LinkBadges from './link-badges.js';

class CollaborativeBrowsing {
  constructor() {
    this.peerManager = null;
    this.mouseTracker = null;
    this.cursorRenderer = null;
    this.linkBadges = null;
    this.peers = new Map(); // Store peer data: { path, mouseX, mouseY }
  }

  init() {
    // Initialize peer connection
    this.peerManager = new PeerManager();
    this.peerManager.on('data', (peerId, data) => this.handlePeerData(peerId, data));
    this.peerManager.on('disconnect', (peerId) => this.handlePeerDisconnect(peerId));

    // Initialize mouse tracker
    this.mouseTracker = new MouseTracker();
    this.mouseTracker.on('update', (data) => this.broadcastMyData(data));

    // Initialize cursor renderer
    this.cursorRenderer = new CursorRenderer();

    // Initialize link badges
    this.linkBadges = new LinkBadges();

    // Start the peer manager
    this.peerManager.start();
  }

  handlePeerData(peerId, data) {
    // Store peer data
    this.peers.set(peerId, data);

    // Update cursor position
    this.cursorRenderer.updateCursor(peerId, data);

    // Update link badges
    this.updateLinkBadges();
  }

  handlePeerDisconnect(peerId) {
    this.peers.delete(peerId);
    this.cursorRenderer.removeCursor(peerId);
    this.updateLinkBadges();
  }

  broadcastMyData(data) {
    this.peerManager.broadcast(data);
  }

  updateLinkBadges() {
    // Count peers on each path
    const pathCounts = new Map();
    this.peers.forEach((data) => {
      const count = pathCounts.get(data.path) || 0;
      pathCounts.set(data.path, count + 1);
    });

    this.linkBadges.update(pathCounts);
  }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const app = new CollaborativeBrowsing();
    app.init();
  });
}

export default CollaborativeBrowsing;
