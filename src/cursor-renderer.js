class CursorRenderer {
  constructor() {
    this.cursors = new Map(); // peerId -> { element, color, currentPath, targetX, targetY }
    this.colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84'
    ];
    this.colorIndex = 0;
    this.currentPath = window.location.pathname;

    this.injectStyles();
    this.startAnimationLoop();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .collab-cursor {
        position: absolute;
        pointer-events: none;
        z-index: 999999;
        transition: opacity 0.3s ease;
        will-change: transform;
      }

      .collab-cursor-icon {
        width: 20px;
        height: 20px;
        fill: currentColor;
      }

      .collab-cursor.hidden {
        opacity: 0;
      }

      .collab-cursor.visible {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  getNextColor() {
    const color = this.colors[this.colorIndex % this.colors.length];
    this.colorIndex++;
    return color;
  }

  createCursorElement(color) {
    const cursor = document.createElement('div');
    cursor.className = 'collab-cursor hidden';
    cursor.style.color = color;
    cursor.innerHTML = `
      <svg class="collab-cursor-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 3.5L18.5 10L11 11.5L9 18.5L5.5 3.5Z" stroke="white" stroke-width="1.5" fill="currentColor"/>
      </svg>
    `;
    document.body.appendChild(cursor);
    return cursor;
  }

  updateCursor(peerId, data) {
    let cursorData = this.cursors.get(peerId);

    if (!cursorData) {
      // Create new cursor
      const color = this.getNextColor();
      const element = this.createCursorElement(color);
      cursorData = {
        element,
        color,
        currentX: data.mouseX,
        currentY: data.mouseY,
        targetX: data.mouseX,
        targetY: data.mouseY,
        currentPath: data.path
      };
      this.cursors.set(peerId, cursorData);
    }

    // Update target position
    cursorData.targetX = data.mouseX;
    cursorData.targetY = data.mouseY;

    // Handle path changes
    if (data.path !== this.currentPath) {
      // Peer is on different page - fade out
      cursorData.element.classList.remove('visible');
      cursorData.element.classList.add('hidden');
    } else {
      // Peer is on same page - fade in
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
        // Smooth interpolation (lerp)
        const lerpFactor = 0.2;
        cursorData.currentX += (cursorData.targetX - cursorData.currentX) * lerpFactor;
        cursorData.currentY += (cursorData.targetY - cursorData.currentY) * lerpFactor;

        // Update element position
        cursorData.element.style.transform = `translate(${cursorData.currentX}px, ${cursorData.currentY}px)`;
      });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

export default CursorRenderer;
