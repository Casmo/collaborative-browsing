const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84'
];

class CursorRenderer {
  constructor(options = {}) {
    this.options = options;
    this.cursors = new Map(); // peerId -> { element, color, currentX, currentY, targetX, targetY, currentPath }
    this.colors = options.colors || DEFAULT_COLORS;
    this.colorIndex = 0;
    this.cursorSize = options.cursorSize || 20;
    this.showLabels = options.labels !== false;
    this.currentPath = window.location.pathname;

    this.injectStyles();
    this.startAnimationLoop();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .collab-cursor {
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 999999;
        transition: opacity 0.3s ease;
        will-change: transform;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .collab-cursor-icon {
        fill: currentColor;
        display: block;
      }

      .collab-cursor-label {
        margin-top: 2px;
        margin-left: 4px;
        padding: 2px 6px;
        background: currentColor;
        color: white;
        border-radius: 4px;
        font-size: 11px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-weight: 500;
        white-space: nowrap;
        mix-blend-mode: normal;
        filter: brightness(0.85) contrast(1.2);
      }

      .collab-cursor.hidden { opacity: 0; }
      .collab-cursor.visible { opacity: 1; }
    `;
    document.head.appendChild(style);
  }

  getNextColor() {
    const color = this.colors[this.colorIndex % this.colors.length];
    this.colorIndex++;
    return color;
  }

  createCursorElement(color, label) {
    const size = this.cursorSize;
    const cursor = document.createElement('div');
    cursor.className = 'collab-cursor hidden';
    cursor.style.color = color;

    cursor.innerHTML = `
      <svg class="collab-cursor-icon" width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 3.5L18.5 10L11 11.5L9 18.5L5.5 3.5Z" stroke="white" stroke-width="1.5" fill="currentColor"/>
      </svg>
    `;

    if (this.showLabels && label) {
      const labelEl = document.createElement('span');
      labelEl.className = 'collab-cursor-label';
      labelEl.textContent = label;
      cursor.appendChild(labelEl);
    }

    document.body.appendChild(cursor);
    return cursor;
  }

  getColor(peerId) {
    const cursorData = this.cursors.get(peerId);
    return cursorData ? cursorData.color : null;
  }

  updateCursor(peerId, data) {
    let cursorData = this.cursors.get(peerId);

    const pixelX = data.mouseX * window.innerWidth;
    const pixelY = data.mouseY * window.innerHeight;

    if (!cursorData) {
      const color = this.getNextColor();
      const element = this.createCursorElement(color, data.label);
      cursorData = {
        element,
        color,
        currentX: pixelX,
        currentY: pixelY,
        targetX: pixelX,
        targetY: pixelY,
        currentPath: data.path
      };
      this.cursors.set(peerId, cursorData);
    }

    cursorData.targetX = pixelX;
    cursorData.targetY = pixelY;

    // Update label text if it changed
    if (this.showLabels && data.label) {
      const labelEl = cursorData.element.querySelector('.collab-cursor-label');
      if (labelEl && labelEl.textContent !== data.label) {
        labelEl.textContent = data.label;
      } else if (!labelEl) {
        const newLabel = document.createElement('span');
        newLabel.className = 'collab-cursor-label';
        newLabel.textContent = data.label;
        cursorData.element.appendChild(newLabel);
      }
    }

    // Show/hide based on whether peer is on the same page
    if (data.path !== this.currentPath) {
      cursorData.element.classList.remove('visible');
      cursorData.element.classList.add('hidden');
    } else {
      cursorData.element.classList.remove('hidden');
      cursorData.element.classList.add('visible');
    }

    cursorData.currentPath = data.path;
  }

  removeCursor(peerId) {
    const cursorData = this.cursors.get(peerId);
    if (cursorData) {
      cursorData.element.remove();
      this.cursors.delete(peerId);
    }
  }

  startAnimationLoop() {
    const animate = () => {
      this.cursors.forEach((cursorData) => {
        const lerpFactor = 0.2;
        cursorData.currentX += (cursorData.targetX - cursorData.currentX) * lerpFactor;
        cursorData.currentY += (cursorData.targetY - cursorData.currentY) * lerpFactor;
        cursorData.element.style.transform = `translate(${cursorData.currentX}px, ${cursorData.currentY}px)`;
      });
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}

export default CursorRenderer;
