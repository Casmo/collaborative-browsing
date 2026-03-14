import PeerManager from './peer-manager.js';
import MouseTracker from './mouse-tracker.js';
import CursorRenderer from './cursor-renderer.js';
import LinkBadges from './link-badges.js';
import Chat from './chat.js';
import ClickAnimator from './click-animator.js';
import ScrollIndicator from './scroll-indicator.js';
import TextHighlighter from './text-highlighter.js';
import SoundEffects from './sound-effects.js';

const DEFAULTS = {
  disabled: false,
  cursors: true,
  labels: true,
  linkBadges: true,
  chat: true,
  clickAnimations: true,
  scrollIndicators: true,
  textHighlight: true,
  sounds: false,
  userLabel: null,   // auto-generated random name if null
  colors: null,      // array of hex colors for cursors; uses built-in palette if null
  cursorSize: 20,
  theme: {
    badgeColor: '#FF6B6B'
  }
};

class CollaborativeBrowsing {
  constructor() {
    this.peerManager = null;
    this.mouseTracker = null;
    this.cursorRenderer = null;
    this.linkBadges = null;
    this.chat = null;
    this.clickAnimator = null;
    this.scrollIndicator = null;
    this.textHighlighter = null;
    this.soundEffects = null;
    this.peers = new Map();
    this.options = null;
    this.myLabel = null;
  }

  start(options = {}) {
    this.options = { ...DEFAULTS, ...options, theme: { ...DEFAULTS.theme, ...(options.theme || {}) } };

    if (this.options.disabled) return;

    // Chat auto-generates a label; use that as our label even when chat is off
    this.myLabel = this.options.userLabel || this._randomLabel();

    if (this.options.cursors) {
      this.cursorRenderer = new CursorRenderer(this.options);
    }

    if (this.options.linkBadges) {
      this.linkBadges = new LinkBadges(this.options);
    }

    if (this.options.chat) {
      this.chat = new Chat({ ...this.options, userLabel: this.myLabel });
      this.chat.on('message', (data) => this._broadcast({ type: 'chat', ...data }));
      // Override myLabel in case chat generated it
      this.myLabel = this.chat.getLabel();
    }

    if (this.options.clickAnimations) {
      this.clickAnimator = new ClickAnimator();
    }

    if (this.options.scrollIndicators) {
      this.scrollIndicator = new ScrollIndicator();
    }

    if (this.options.textHighlight) {
      this.textHighlighter = new TextHighlighter();
    }

    if (this.options.sounds) {
      this.soundEffects = new SoundEffects();
    }

    this.peerManager = new PeerManager();
    this.peerManager.on('data', (connPeerId, data) => this._handleData(connPeerId, data));
    this.peerManager.on('disconnect', (connPeerId) => this._handleDisconnect(connPeerId));

    this.mouseTracker = new MouseTracker(this.options);
    this.mouseTracker.on('update', (data) => {
      this._broadcast({ type: 'state', ...data, label: this.myLabel });
    });
    this.mouseTracker.on('click', (data) => {
      if (this.options.clickAnimations) this._broadcast({ type: 'click', ...data });
    });
    this.mouseTracker.on('selection', (data) => {
      if (this.options.textHighlight) this._broadcast({ type: 'selection', ...data });
    });

    this.peerManager.start();
  }

  // When the host relays a message it adds `peerId` to the data payload.
  // We use data.peerId (original sender) when available, falling back to the
  // connection's peerId (direct connections / host receiving from clients).
  _handleData(connPeerId, data) {
    const peerId = data.peerId || connPeerId;
    const { peerId: _removed, ...payload } = data;

    switch (payload.type) {
      case 'state':
        this._handleState(peerId, payload);
        break;
      case 'click':
        this._handleClick(peerId, payload);
        break;
      case 'chat':
        if (this.chat) this.chat.receiveMessage(peerId, payload);
        if (this.soundEffects) this.soundEffects.play('chat');
        break;
      case 'selection':
        if (this.textHighlighter) {
          const color = this.cursorRenderer ? this.cursorRenderer.getColor(peerId) : '#FF6B6B';
          this.textHighlighter.updateSelection(peerId, payload, color);
        }
        break;
    }
  }

  _handleState(peerId, data) {
    const isNew = !this.peers.has(peerId);
    this.peers.set(peerId, data);

    if (this.cursorRenderer) this.cursorRenderer.updateCursor(peerId, data);

    const color = this.cursorRenderer ? this.cursorRenderer.getColor(peerId) : '#FF6B6B';

    if (this.scrollIndicator) this.scrollIndicator.updatePeer(peerId, data, color);
    if (this.chat) this.chat.setPeerInfo(peerId, color, data.label);

    this._updateLinkBadges();

    if (isNew && this.soundEffects) this.soundEffects.play('join');
  }

  _handleClick(peerId, data) {
    if (!this.clickAnimator) return;
    const color = this.cursorRenderer ? this.cursorRenderer.getColor(peerId) : '#FF6B6B';
    this.clickAnimator.showClick(peerId, { ...data, color });
    if (this.soundEffects) this.soundEffects.play('click');
  }

  _handleDisconnect(connPeerId) {
    // When a client disconnects, the host emits the connection's peerId.
    // Find matching peer (may be stored under data.peerId from relay).
    const peerId = connPeerId;
    this.peers.delete(peerId);

    if (this.cursorRenderer) this.cursorRenderer.removeCursor(peerId);
    if (this.scrollIndicator) this.scrollIndicator.removePeer(peerId);
    if (this.textHighlighter) this.textHighlighter.removePeer(peerId);
    if (this.chat) this.chat.removePeer(peerId);

    this._updateLinkBadges();

    if (this.soundEffects) this.soundEffects.play('leave');
  }

  _broadcast(data) {
    if (this.peerManager) this.peerManager.broadcast(data);
  }

  _updateLinkBadges() {
    if (!this.linkBadges) return;
    const pathCounts = new Map();
    this.peers.forEach((data) => {
      const count = pathCounts.get(data.path) || 0;
      pathCounts.set(data.path, count + 1);
    });
    this.linkBadges.update(pathCounts);
  }

  _randomLabel() {
    const adjs = ['Red', 'Blue', 'Green', 'Purple', 'Orange', 'Pink', 'Teal', 'Gold'];
    const nouns = ['Panda', 'Fox', 'Bear', 'Wolf', 'Eagle', 'Tiger', 'Hawk', 'Lynx'];
    return `${adjs[Math.floor(Math.random() * adjs.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
  }
}

// Expose a single instance with a start() method — no auto-initialization.
// Usage: CollaborativeBrowsing.start({ ...options })
const instance = new CollaborativeBrowsing();
export default instance;
