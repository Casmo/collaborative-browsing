// Normalize pathnames so trailing slashes don't cause mismatches (/archive/ === /archive)
function normalizePath(p) {
  return p.replace(/\/$/, '') || '/';
}

class LinkBadges {
  constructor() {
    this.badges = new Map(); // link element -> badge element
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .collab-link-badge {
        display: inline-block;
        margin-left: 4px;
        padding: 2px 6px;
        background: #FF6B6B;
        color: white;
        border-radius: 10px;
        font-size: 11px;
        font-weight: bold;
        line-height: 1;
        vertical-align: middle;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        pointer-events: none;
        animation: collab-badge-pop 0.3s ease;
      }

      @keyframes collab-badge-pop {
        0%   { transform: scale(0); }
        50%  { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  update(pathCounts) {
    // Normalize the incoming path keys once
    const normalizedCounts = new Map();
    pathCounts.forEach((count, path) => {
      normalizedCounts.set(normalizePath(path), count);
    });

    const links = document.querySelectorAll('a[href]');
    const active = new Set();

    links.forEach((link) => {
      try {
        const url = new URL(link.href, window.location.origin);
        if (url.hostname !== window.location.hostname) return;

        const path = normalizePath(url.pathname);
        const count = normalizedCounts.get(path);

        if (count && count > 0) {
          this.addOrUpdateBadge(link, count);
          active.add(link);
        }
      } catch (e) {
        // Invalid URL, skip
      }
    });

    // Remove badges for links that no longer have visitors
    // (only remove stale ones — don't clear everything, which would retrigger the animation)
    this.badges.forEach((badge, link) => {
      if (!active.has(link)) {
        badge.remove();
        this.badges.delete(link);
      }
    });
  }

  addOrUpdateBadge(link, count) {
    if (this.badges.has(link)) {
      // Update in-place — no DOM removal so the animation doesn't replay
      const badge = this.badges.get(link);
      badge.textContent = count;
      badge.title = `${count} visitor${count > 1 ? 's' : ''} on this page`;
      return;
    }

    const badge = document.createElement('span');
    badge.className = 'collab-link-badge';
    badge.textContent = count;
    badge.title = `${count} visitor${count > 1 ? 's' : ''} on this page`;

    if (link.nextSibling) {
      link.parentNode.insertBefore(badge, link.nextSibling);
    } else {
      link.parentNode.appendChild(badge);
    }

    this.badges.set(link, badge);
  }
}

export default LinkBadges;
