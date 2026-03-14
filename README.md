# Collaborative Browsing

A lightweight JavaScript library that shows other visitors browsing your website in real-time. See mouse cursors of other users, track which pages they're viewing, and add a fun collaborative element to your site.

## Features

- **Real-time mouse cursors**: See where other visitors are pointing on the page
- **Smooth animations**: Cursors move smoothly between positions
- **Color-coded users**: Each visitor gets a unique color
- **Page awareness**: Cursors fade out when users are on different pages
- **Link badges**: See how many visitors are on each linked page
- **Peer-to-peer**: Uses WebRTC via PeerJS for direct browser connections
- **Zero configuration**: Just include the script and it works
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

Simply include the script on any page where you want the collaborative browsing feature:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Welcome to my site!</h1>

  <!-- Your content here -->

  <!-- Add this script at the end of body -->
  <script src="dist/collaborative-browsing.js"></script>
</body>
</html>
```

That's it! The library will automatically:
1. Connect to other visitors on the same domain
2. Share mouse positions and page locations
3. Render cursors for other visitors
4. Add badges to links showing visitor counts

## How It Works

1. **Host Discovery**: When loaded, the script tries to connect to a PeerJS host with an ID matching your domain name
2. **Fallback Host**: If no host exists, the first visitor becomes the host
3. **Peer Network**: All visitors connect to the host, which relays data between peers
4. **Host Migration**: If the host leaves, remaining clients automatically elect a new host with minimal disruption
5. **Data Sharing**: Each visitor broadcasts their mouse position and current page path
6. **Visualization**: The library renders cursors and badges based on received data

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

## Browser Support

Works in all modern browsers that support:
- WebRTC
- PeerJS
- ES6 JavaScript

## Privacy Considerations

This library shares:
- Mouse cursor positions
- Current page path (not query parameters)
- Peer connection data

It does NOT share:
- Personal information
- Form data
- Query parameters
- User actions beyond mouse movement

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
├── dist/                  # Compiled output
├── src/
│   ├── index.js          # Main entry point
│   ├── peer-manager.js   # PeerJS connection handling
│   ├── mouse-tracker.js  # Mouse position and URL tracking
│   ├── cursor-renderer.js # Cursor visualization
│   └── link-badges.js    # Link badge system
├── example.html          # Demo page
├── rollup.config.js      # Build configuration
└── package.json
```

## License

MIT

## Contributing

Contributions welcome! This is a fun easter egg feature that can be enhanced in many ways.

## Ideas for Enhancement

- Add user names or labels
- Implement click animations
- Add chat functionality
- Show scrolling indicators
- Highlight selected text
- Add sound effects
- Configuration options for styling
