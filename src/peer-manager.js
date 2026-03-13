import Peer from 'peerjs';

class PeerManager {
  constructor() {
    this.peer = null;
    this.connections = new Map(); // peerId -> connection
    this.isHost = false;
    this.hostId = this.getHostId();
    this.myId = this.generateClientId();
    this.hostConnectionId = null; // Track which connection is to the host
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.eventHandlers = {
      data: [],
      disconnect: []
    };
    this.peerConfig = this.getPeerConfig();
  }

  getPeerConfig() {
    // Use PeerJS cloud server with reliable STUN/TURN infrastructure
    return {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      debug: 0, // Set to 3 for verbose debugging
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: 'turn:0.peerjs.com:3478',
            username: 'peerjs',
            credential: 'peerjsp'
          }
        ]
      }
    };
  }

  getHostId() {
    // Use domain as host ID (sanitize for PeerJS)
    // PeerJS IDs must start with a letter or underscore
    let hostname = window.location.hostname || 'localhost';

    // Replace dots with dashes and remove other invalid characters
    let sanitized = hostname.replace(/\./g, '-').replace(/[^a-zA-Z0-9_-]/g, '');

    // Ensure it starts with a letter
    if (!sanitized || !/^[a-zA-Z]/.test(sanitized)) {
      sanitized = 'host-' + sanitized;
    }

    return sanitized;
  }

  generateClientId() {
    // Generate unique client ID: domain-timestamp-random
    // PeerJS IDs must start with a letter or underscore
    const random = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();
    return `client-${this.hostId}-${timestamp}-${random}`;
  }

  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  emit(event, ...args) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(...args));
    }
  }

  start() {
    // Create peer with our client ID
    this.peer = new Peer(this.myId, this.peerConfig);

    this.peer.on('open', () => {
      console.log('[CollaborativeBrowsing] My peer ID:', this.myId);
      this.tryConnectToHost();
    });

    this.peer.on('error', (err) => {
      console.log('[CollaborativeBrowsing] Peer error:', err);
      // If we can't connect to host, try to become the host
      if (err.type === 'peer-unavailable' || err.type === 'network') {
        this.becomeHost();
      }
    });

    // Listen for incoming connections (if we're the host or in a mesh)
    this.peer.on('connection', (conn) => {
      this.handleIncomingConnection(conn);
    });
  }

  tryConnectToHost() {
    // Don't connect if we're trying to be the host
    if (this.myId === this.hostId) {
      this.becomeHost();
      return;
    }

    console.log('[CollaborativeBrowsing] Trying to connect to host:', this.hostId);
    const conn = this.peer.connect(this.hostId, { reliable: true });

    conn.on('open', () => {
      console.log('[CollaborativeBrowsing] Connected to host');
      this.hostConnectionId = this.hostId;
      this.reconnectAttempts = 0; // Reset on successful connection
      this.addConnection(this.hostId, conn);
    });

    conn.on('error', (err) => {
      console.log('[CollaborativeBrowsing] Connection error:', err);
      this.becomeHost();
    });

    // If connection doesn't open in 5 seconds, become host
    setTimeout(() => {
      if (!conn.open) {
        console.log('[CollaborativeBrowsing] Connection timeout, becoming host');
        this.becomeHost();
      }
    }, 5000);
  }

  becomeHost() {
    if (this.isHost) return;

    console.log('[CollaborativeBrowsing] Attempting to become host');
    this.isHost = true;
    this.hostConnectionId = null; // We're the host now, no host connection

    // Try to recreate peer with host ID
    if (this.peer) {
      this.peer.destroy();
    }

    this.peer = new Peer(this.hostId, this.peerConfig);

    this.peer.on('open', () => {
      console.log('[CollaborativeBrowsing] Successfully became host:', this.hostId);
      this.reconnectAttempts = 0;
    });

    this.peer.on('connection', (conn) => {
      this.handleIncomingConnection(conn);
    });

    this.peer.on('error', (err) => {
      console.log('[CollaborativeBrowsing] Host peer error:', err);

      // If someone else already claimed the host ID, we failed to become host
      if (err.type === 'unavailable-id') {
        console.log('[CollaborativeBrowsing] Host ID taken, reconnecting as client');
        this.isHost = false;
        this.reconnectAsClient();
      }
    });
  }

  handleHostDisconnect() {
    // Clear host connection reference
    this.hostConnectionId = null;

    // Wait a random delay (0-500ms) before trying to become host
    // This helps avoid all clients trying simultaneously
    const delay = Math.random() * 500;

    setTimeout(() => {
      console.log('[CollaborativeBrowsing] Attempting host migration');
      this.becomeHost();
    }, delay);
  }

  reconnectAsClient() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[CollaborativeBrowsing] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;

    // Wait a bit before reconnecting to give the new host time to stabilize
    setTimeout(() => {
      console.log('[CollaborativeBrowsing] Reconnecting to new host (attempt', this.reconnectAttempts, ')');

      // Recreate peer with client ID
      if (this.peer) {
        this.peer.destroy();
      }

      this.myId = this.generateClientId();
      this.start();
    }, 1000 * this.reconnectAttempts); // Exponential backoff
  }

  handleIncomingConnection(conn) {
    console.log('[CollaborativeBrowsing] Incoming connection from:', conn.peer);

    conn.on('open', () => {
      this.addConnection(conn.peer, conn);
    });
  }

  addConnection(peerId, conn) {
    this.connections.set(peerId, conn);

    conn.on('data', (data) => {
      this.emit('data', peerId, data);

      // If we're the host, relay to all other peers
      if (this.isHost) {
        this.connections.forEach((otherConn, otherPeerId) => {
          if (otherPeerId !== peerId && otherConn.open) {
            otherConn.send({ ...data, peerId });
          }
        });
      }
    });

    conn.on('close', () => {
      console.log('[CollaborativeBrowsing] Connection closed:', peerId);
      this.connections.delete(peerId);
      this.emit('disconnect', peerId);

      // If this was the host connection, trigger host migration
      if (!this.isHost && peerId === this.hostConnectionId) {
        console.log('[CollaborativeBrowsing] Host disconnected, initiating migration');
        this.handleHostDisconnect();
      }
    });

    conn.on('error', (err) => {
      console.log('[CollaborativeBrowsing] Connection error:', peerId, err);
      this.connections.delete(peerId);
      this.emit('disconnect', peerId);

      // If this was the host connection, trigger host migration
      if (!this.isHost && peerId === this.hostConnectionId) {
        console.log('[CollaborativeBrowsing] Host connection error, initiating migration');
        this.handleHostDisconnect();
      }
    });
  }

  broadcast(data) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }
}

export default PeerManager;
