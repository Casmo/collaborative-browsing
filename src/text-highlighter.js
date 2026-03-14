class TextHighlighter {
  constructor() {
    this.highlights = new Map(); // peerId -> [elements]
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .collab-text-highlight {
        position: absolute;
        pointer-events: none;
        z-index: 999996;
        opacity: 0.3;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  updateSelection(peerId, data, color) {
    this.clearHighlights(peerId);

    if (!data.rects || data.rects.length === 0) return;
    if (data.path !== window.location.pathname) return;

    const elements = data.rects.map(rect => {
      const el = document.createElement('div');
      el.className = 'collab-text-highlight';
      el.style.backgroundColor = color;
      // Rects use absolute document coordinates
      el.style.left = `${rect.x}px`;
      el.style.top = `${rect.y}px`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      document.body.appendChild(el);
      return el;
    });

    this.highlights.set(peerId, elements);
  }

  clearHighlights(peerId) {
    const elements = this.highlights.get(peerId);
    if (elements) {
      elements.forEach(el => el.remove());
      this.highlights.delete(peerId);
    }
  }

  removePeer(peerId) {
    this.clearHighlights(peerId);
  }
}

export default TextHighlighter;
