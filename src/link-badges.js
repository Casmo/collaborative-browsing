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
        0% {
          transform: scale(0);
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);
  }

  update(pathCounts) {
    // Remove old badges
    this.clearBadges();

    // Find all links on the page
    const links = document.querySelectorAll('a[href]');

    links.forEach((link) => {
      try {
        const url = new URL(link.href, window.location.origin);

        // Only process internal links
        if (url.hostname === window.location.hostname) {
          const path = url.pathname;
          const count = pathCounts.get(path);

          if (count && count > 0) {
            this.addBadge(link, count);
          }
        }
      } catch (e) {
        // Invalid URL, skip
      }
    });
  }

  addBadge(link, count) {
    // Check if badge already exists
    if (this.badges.has(link)) {
      const badge = this.badges.get(link);
      badge.textContent = count;
      return;
    }

    // Create new badge
    const badge = document.createElement('span');
    badge.className = 'collab-link-badge';
    badge.textContent = count;
    badge.title = `${count} visitor${count > 1 ? 's' : ''} on this page`;

    // Insert badge after link
    if (link.nextSibling) {
      link.parentNode.insertBefore(badge, link.nextSibling);
    } else {
      link.parentNode.appendChild(badge);
    }

    this.badges.set(link, badge);
  }

  clearBadges() {
    this.badges.forEach((badge) => {
      badge.remove();
    });
    this.badges.clear();
  }
}

export default LinkBadges;
