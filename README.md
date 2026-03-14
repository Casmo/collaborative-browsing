# Collaborative Browsing

A lightweight JavaScript library that shows other visitors browsing your website in real-time. See mouse cursors of other users, track which pages they're viewing, and add a fun collaborative element to your site.

## Features

- **Real-time mouse cursors**: See where other visitors are pointing on the page
- **User labels**: Each cursor shows a randomly assigned (or custom) name
- **Smooth animations**: Cursors move smoothly between positions
- **Color-coded users**: Each visitor gets a unique color
- **Page awareness**: Cursors fade out when users are on different pages
- **Link badges**: See how many visitors are on each linked page
- **Click animations**: Ripple effects appear when other users click
- **Scroll indicators**: See where on the page other visitors are scrolled to
- **Text highlighting**: See text other visitors have selected
- **Chat**: A floating chat panel for visitors to communicate
- **Sound effects**: Optional audio feedback for peer events
- **Peer-to-peer**: Uses WebRTC via PeerJS for direct browser connections
- **Fully configurable**: All features can be enabled/disabled individually
- **Lightweight**: Single JavaScript file, no dependencies to manage

## Installation

### Option 1: CDN (jsDelivr)

Include directly from jsDelivr — no download required:

```html
<script src="https://cdn.jsdelivr.net/gh/casmo/collaborative-browsing@master/dist/collaborative-browsing.js"></script>
```

### Option 2: Direct Script Include

Download `dist/collaborative-browsing.js` and include it in your HTML:

```html
<script src="path/to/collaborative-browsing.js"></script>
```

### Option 3: Build from Source

```bash
npm install
npm run build
```

The compiled file will be in `dist/collaborative-browsing.js`.

## Usage

Include the script and call `CollaborativeBrowsing.start()` with your desired options:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Welcome to my site!</h1>

  <script src="dist/collaborative-browsing.js"></script>
  <script>
    CollaborativeBrowsing.start();
  </script>
</body>
</html>
```

The library will automatically:
1. Connect to other visitors on the same domain
2. Share mouse positions, scroll depth, and page locations
3. Render cursors with name labels for other visitors
4. Show click ripples and text selection highlights
5. Add badges to links showing visitor counts
6. Provide a chat panel for real-time messaging

## Configuration

Pass an options object to `start()` to customize behavior:

```js
CollaborativeBrowsing.start({
  // Master switch — set to true to completely disable the library
  disabled: false,

  // Feature toggles
  cursors: true,           // Show remote mouse cursors
  labels: true,            // Show name labels on cursors
  linkBadges: true,        // Show visitor count badges on links
  chat: true,              // Floating chat panel
  clickAnimations: true,   // Ripple effect on remote clicks
  scrollIndicators: true,  // Scroll position pips on the right edge
  textHighlight: true,     // Highlight text selected by other visitors
  sounds: false,           // Audio feedback (off by default)

  // Identity
  hostId: 'my-app-room',   // Override the PeerJS host ID (defaults to sanitized domain name)
  userLabel: 'Alice',      // Your display name (random name if omitted)

  // Styling
  colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],  // Custom cursor color palette
  cursorSize: 20,                               // Cursor size in pixels
  theme: {
    badgeColor: '#FF6B6B'  // Background color of link badges
  }
});
```

### Disabling the script

Set `disabled: true` to load the script without activating anything — useful for staging environments or feature flags:

```js
CollaborativeBrowsing.start({ disabled: true });
```

Or conditionally based on environment:

```js
CollaborativeBrowsing.start({
  disabled: window.location.hostname === 'localhost'
});
```

## How It Works

1. **Host Discovery**: When loaded, the script tries to connect to a PeerJS host with an ID matching your domain name
2. **Fallback Host**: If no host exists, the first visitor becomes the host
3. **Peer Network**: All visitors connect to the host, which relays data between peers
4. **Host Migration**: If the host leaves, remaining clients automatically elect a new host with minimal disruption
5. **Data Sharing**: Each visitor broadcasts their mouse position, scroll depth, current page path, and optional label
6. **Visualization**: The library renders cursors, badges, scroll indicators, and highlights based on received data

### Host Migration Strategy

When the host disconnects, the library automatically handles failover:
- All clients detect the host disconnection
- Each client waits a random delay (0-500ms) to avoid collisions
- Clients race to claim the host ID
- The first client to successfully claim it becomes the new host
- Other clients automatically reconnect to the new host
- The network re-establishes with minimal interruption

## Technical Details

- **PeerJS**: Uses PeerJS for WebRTC connections
- **No Backend Required**: Everything runs client-side
- **Domain-Based Rooms**: Visitors are automatically grouped by domain
- **Throttled Updates**: Mouse positions are throttled to 50ms to reduce network traffic
- **SPA Support**: Detects URL changes in single-page applications
- **Web Audio API**: Sound effects are synthesized in-browser — no audio files needed

## Browser Support

Works in all modern browsers that support:
- WebRTC
- PeerJS
- ES6 JavaScript

## Privacy Considerations

This library shares:
- Mouse cursor positions
- Current page path (not query parameters)
- Scroll depth (as a 0–1 fraction)
- Text selections (document-relative bounding rects)
- Chat messages
- Peer connection data

It does NOT share:
- Personal information
- Form data
- Query parameters
- User actions beyond mouse movement and explicit chat messages

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Watch mode for development
npm run dev
```

## Project Structure

```
.
├── dist/                      # Compiled output
├── src/
│   ├── index.js               # Main entry point & orchestration
│   ├── peer-manager.js        # PeerJS connection handling
│   ├── mouse-tracker.js       # Mouse, scroll, click & selection tracking
│   ├── cursor-renderer.js     # Cursor + label visualization
│   ├── link-badges.js         # Link badge system
│   ├── chat.js                # Floating chat panel
│   ├── click-animator.js      # Click ripple animations
│   ├── scroll-indicator.js    # Per-peer scroll position pips
│   ├── text-highlighter.js    # Remote text selection highlights
│   └── sound-effects.js       # Web Audio API sound feedback
├── example.html               # Demo page
├── rollup.config.js           # Build configuration
└── package.json
```

## License

MIT

## Contributing

Contributions welcome! This is a fun easter egg feature that can be enhanced in many ways.
