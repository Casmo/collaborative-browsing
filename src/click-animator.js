class ClickAnimator {
  constructor() {
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .collab-click-ripple {
        position: fixed;
        pointer-events: none;
        z-index: 999998;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        transform: translate(-50%, -50%) scale(0);
        animation: collab-ripple 0.6s ease-out forwards;
      }

      @keyframes collab-ripple {
        0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  showClick(peerId, data) {
    const x = data.mouseX * document.documentElement.scrollWidth - window.scrollX;
    const y = data.mouseY * document.documentElement.scrollHeight - window.scrollY;
    const color = data.color || '#FF6B6B';

    const ripple = document.createElement('div');
    ripple.className = 'collab-click-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.border = `3px solid ${color}`;
    document.body.appendChild(ripple);

    setTimeout(() => ripple.remove(), 700);
  }
}

export default ClickAnimator;
