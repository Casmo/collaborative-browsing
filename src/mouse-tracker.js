class MouseTracker {
  constructor() {
    this.mouseX = 0;
    this.mouseY = 0;
    this.path = window.location.pathname;
    this.eventHandlers = {
      update: []
    };
    this.throttleDelay = 50; // ms
    this.lastUpdate = 0;

    this.init();
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

  init() {
    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX + window.scrollX;
      this.mouseY = e.clientY + window.scrollY;
      this.throttledUpdate();
    });

    // Track URL changes (for SPAs)
    this.observeUrlChanges();

    // Initial update
    this.sendUpdate();
  }

  observeUrlChanges() {
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.handlePathChange();
    });

    // Override pushState and replaceState to detect SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handlePathChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handlePathChange();
    };
  }

  handlePathChange() {
    const newPath = window.location.pathname;
    if (newPath !== this.path) {
      this.path = newPath;
      this.sendUpdate();
    }
  }

  throttledUpdate() {
    const now = Date.now();
    if (now - this.lastUpdate >= this.throttleDelay) {
      this.sendUpdate();
      this.lastUpdate = now;
    }
  }

  sendUpdate() {
    this.emit('update', {
      path: this.path,
      mouseX: this.mouseX,
      mouseY: this.mouseY,
      timestamp: Date.now()
    });
  }
}

export default MouseTracker;
