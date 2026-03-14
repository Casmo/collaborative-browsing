class MouseTracker {
  constructor(options = {}) {
    this.options = options;
    this.mouseX = 0;
    this.mouseY = 0;
    this.scrollY = 0;
    this.path = window.location.pathname;
    this.eventHandlers = { update: [], click: [], selection: [] };
    this.throttleDelay = 50;
    this.lastUpdate = 0;

    this.init();
  }

  on(event, handler) {
    if (this.eventHandlers[event]) this.eventHandlers[event].push(handler);
  }

  emit(event, ...args) {
    if (this.eventHandlers[event]) this.eventHandlers[event].forEach(h => h(...args));
  }

  init() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX / window.innerWidth;
      this.mouseY = e.clientY / window.innerHeight;
      this.throttledUpdate();
    });

    document.addEventListener('click', (e) => {
      this.emit('click', {
        mouseX: e.clientX / window.innerWidth,
        mouseY: e.clientY / window.innerHeight,
        timestamp: Date.now()
      });
    });

    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.scrollY = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      this.throttledUpdate();
    });

    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        this.emit('selection', { rects: [], path: this.path, timestamp: Date.now() });
        return;
      }
      const range = selection.getRangeAt(0);
      const rects = Array.from(range.getClientRects()).map(r => ({
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        width: r.width,
        height: r.height
      }));
      this.emit('selection', { rects, path: this.path, timestamp: Date.now() });
    });

    this.observeUrlChanges();
    this.sendUpdate();
  }

  observeUrlChanges() {
    window.addEventListener('popstate', () => this.handlePathChange());

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
      scrollY: this.scrollY,
      timestamp: Date.now()
    });
  }
}

export default MouseTracker;
