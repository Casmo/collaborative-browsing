import Peer from 'peerjs';

class PeerManager {
  constructor(options = {}) {
    this.peer = null;
    this.connections = new Map(); // peerId -> connection
    this.isHost = false;
    this.hostId = options.hostId ? this.sanitizeId(options.hostId) : this.getHostId();
    this.myId = this.generateClientId();
    this.peerConfig = {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun.fbsbx.com:3478' },
          { urls: 'stun:stun.cloudflare.com:3478' }
        ]
      }
    };
    this.hostConnectionId = null; // Track which connection is to the host
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.eventHandlers = {
      data: [],
      disconnect: []
    };
  }

  sanitizeId(id) {
    let sanitized = String(id).replace(/\./g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitized || !/^[a-zA-Z]/.test(sanitized)) {
      sanitized = 'host-' + sanitized;
    }
    return sanitized;
  }

  getHostId() {
    return this.sanitizeId(window.location.hostname || 'localhost');
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
    // Create peer with our client ID (using PeerJS defaults)
    this.peer = new Peer(this.myId, this.peerConfig);

    this.peer.on('open', () => {
      this.tryConnectToHost();
    });

    this.peer.on('error', (err) => {
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

    const conn = this.peer.connect(this.hostId, { reliable: true });

    conn.on('open', () => {
      this.hostConnectionId = this.hostId;
      this.reconnectAttempts = 0; // Reset on successful connection
      this.addConnection(this.hostId, conn);
    });

    conn.on('error', (err) => {
      this.becomeHost();
    });

    // If connection doesn't open in 5 seconds, become host
    setTimeout(() => {
      if (!conn.open) {
        this.becomeHost();
      }
    }, 5000);
  }

  becomeHost() {
    if (this.isHost) return;

    this.isHost = true;
    this.hostConnectionId = null; // We're the host now, no host connection

    // Try to recreate peer with host ID
    if (this.peer) {
      this.peer.destroy();
    }

    this.peer = new Peer(this.hostId, this.peerConfig);

    this.peer.on('open', () => {
      this.reconnectAttempts = 0;
    });

    this.peer.on('connection', (conn) => {
      this.handleIncomingConnection(conn);
    });

    this.peer.on('error', (err) => {

      // If someone else already claimed the host ID, we failed to become host
      if (err.type === 'unavailable-id') {
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
      this.becomeHost();
    }, delay);
  }

  reconnectAsClient() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;

    // Wait a bit before reconnecting to give the new host time to stabilize
    setTimeout(() => {

      // Recreate peer with client ID
      if (this.peer) {
        this.peer.destroy();
      }

      this.myId = this.generateClientId();
      this.start();
    }, 1000 * this.reconnectAttempts); // Exponential backoff
  }

  handleIncomingConnection(conn) {

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
      this.connections.delete(peerId);
      this.emit('disconnect', peerId);

      // If this was the host connection, trigger host migration
      if (!this.isHost && peerId === this.hostConnectionId) {
        this.handleHostDisconnect();
      }
    });

    conn.on('error', (err) => {
      this.connections.delete(peerId);
      this.emit('disconnect', peerId);

      // If this was the host connection, trigger host migration
      if (!this.isHost && peerId === this.hostConnectionId) {
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
