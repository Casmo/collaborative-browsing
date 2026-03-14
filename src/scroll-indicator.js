class ScrollIndicator {
  constructor() {
    this.peers = new Map(); // peerId -> element
    this.container = null;
    this.injectStyles();
    this.createContainer();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .collab-scroll-container {
        position: fixed;
        right: 4px;
        top: 0;
        bottom: 0;
        width: 6px;
        pointer-events: none;
        z-index: 999997;
      }

      .collab-scroll-pip {
        position: absolute;
        right: 0;
        width: 6px;
        height: 36px;
        border-radius: 3px;
        opacity: 0.65;
        transition: top 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'collab-scroll-container';
    document.body.appendChild(this.container);
  }

  updatePeer(peerId, data, color) {
    if (data.path !== window.location.pathname) {
      this.removePeer(peerId);
      return;
    }

    let pip = this.peers.get(peerId);
    if (!pip) {
      pip = document.createElement('div');
      pip.className = 'collab-scroll-pip';
      pip.style.backgroundColor = color;
      this.container.appendChild(pip);
      this.peers.set(peerId, pip);
    }

    // scrollY is 0–1 fraction of page scroll depth
    const topPct = (data.scrollY || 0) * 100;
    pip.style.top = `calc(${topPct}% - 18px)`;
  }

  removePeer(peerId) {
    const pip = this.peers.get(peerId);
    if (pip) {
      pip.remove();
      this.peers.delete(peerId);
    }
  }
}

export default ScrollIndicator;
