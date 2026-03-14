const ADJECTIVES = ['Red', 'Blue', 'Green', 'Purple', 'Orange', 'Pink', 'Teal', 'Gold'];
const NOUNS = ['Panda', 'Fox', 'Bear', 'Wolf', 'Eagle', 'Tiger', 'Hawk', 'Lynx'];

function randomLabel() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

class Chat {
  constructor(options = {}) {
    this.myLabel = options.userLabel || randomLabel();
    this.peerColors = new Map();
    this.peerLabels = new Map();
    this.eventHandlers = { message: [] };
    this.isOpen = false;
    this.unreadCount = 0;
    this.injectStyles();
    this.createUI();
  }

  on(event, handler) {
    if (this.eventHandlers[event]) this.eventHandlers[event].push(handler);
  }

  emit(event, ...args) {
    if (this.eventHandlers[event]) this.eventHandlers[event].forEach(h => h(...args));
  }

  getLabel() {
    return this.myLabel;
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .collab-chat {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 280px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        z-index: 999995;
        filter: drop-shadow(0 4px 16px rgba(0,0,0,0.25));
      }

      .collab-chat-panel {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px 8px 0 0;
        margin-bottom: 4px;
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      .collab-chat-panel.open {
        display: flex;
      }

      .collab-chat-messages {
        height: 200px;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .collab-chat-message {
        padding: 5px 9px;
        border-radius: 6px;
        max-width: 90%;
        word-break: break-word;
        line-height: 1.4;
      }

      .collab-chat-message.mine {
        align-self: flex-end;
        background: #333;
        color: white;
      }

      .collab-chat-message.theirs {
        align-self: flex-start;
        background: #f0f0f0;
        color: #333;
      }

      .collab-chat-sender {
        font-size: 10px;
        font-weight: bold;
        margin-bottom: 2px;
        opacity: 0.85;
      }

      .collab-chat-input-row {
        display: flex;
        border-top: 1px solid #e0e0e0;
      }

      .collab-chat-input {
        flex: 1;
        padding: 8px 10px;
        border: none;
        outline: none;
        font-size: 13px;
        font-family: inherit;
      }

      .collab-chat-send {
        padding: 8px 14px;
        background: #333;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
      }

      .collab-chat-send:hover {
        background: #555;
      }

      .collab-chat-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #333;
        color: white;
        padding: 9px 14px;
        border-radius: 8px;
        cursor: pointer;
        user-select: none;
        border: none;
        width: 100%;
        text-align: left;
        font-family: inherit;
        font-size: 13px;
      }

      .collab-chat-toggle:hover {
        background: #555;
      }

      .collab-chat-unread {
        background: #FF6B6B;
        color: white;
        border-radius: 10px;
        padding: 1px 7px;
        font-size: 11px;
        font-weight: bold;
        display: none;
      }

      .collab-chat-unread.visible {
        display: inline-block;
      }
    `;
    document.head.appendChild(style);
  }

  createUI() {
    this.element = document.createElement('div');
    this.element.className = 'collab-chat';

    this.panelEl = document.createElement('div');
    this.panelEl.className = 'collab-chat-panel';

    this.messagesEl = document.createElement('div');
    this.messagesEl.className = 'collab-chat-messages';

    const inputRow = document.createElement('div');
    inputRow.className = 'collab-chat-input-row';

    this.inputEl = document.createElement('input');
    this.inputEl.className = 'collab-chat-input';
    this.inputEl.placeholder = 'Type a message...';
    this.inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') this.sendMessage(); });

    const sendBtn = document.createElement('button');
    sendBtn.className = 'collab-chat-send';
    sendBtn.textContent = '›';
    sendBtn.addEventListener('click', () => this.sendMessage());

    inputRow.appendChild(this.inputEl);
    inputRow.appendChild(sendBtn);
    this.panelEl.appendChild(this.messagesEl);
    this.panelEl.appendChild(inputRow);

    const toggle = document.createElement('button');
    toggle.className = 'collab-chat-toggle';
    this.unreadEl = document.createElement('span');
    this.unreadEl.className = 'collab-chat-unread';
    toggle.appendChild(document.createTextNode('Chat'));
    toggle.appendChild(this.unreadEl);
    toggle.addEventListener('click', () => this.togglePanel());

    this.element.appendChild(this.panelEl);
    this.element.appendChild(toggle);
    document.body.appendChild(this.element);
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    this.panelEl.classList.toggle('open', this.isOpen);
    if (this.isOpen) {
      this.unreadCount = 0;
      this.unreadEl.classList.remove('visible');
      this.inputEl.focus();
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
  }

  sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.inputEl.value = '';
    this.appendMessage(null, this.myLabel, text, true);
    this.emit('message', { text, label: this.myLabel });
  }

  receiveMessage(peerId, data) {
    const color = this.peerColors.get(peerId);
    const label = data.label || this.peerLabels.get(peerId) || 'Visitor';
    this.appendMessage(color, label, data.text, false);

    if (!this.isOpen) {
      this.unreadCount++;
      this.unreadEl.textContent = this.unreadCount;
      this.unreadEl.classList.add('visible');
    }
  }

  appendMessage(color, label, text, isMe) {
    const msg = document.createElement('div');
    msg.className = `collab-chat-message ${isMe ? 'mine' : 'theirs'}`;

    if (!isMe) {
      const sender = document.createElement('div');
      sender.className = 'collab-chat-sender';
      sender.textContent = label;
      if (color) sender.style.color = color;
      msg.appendChild(sender);
    }

    const textEl = document.createTextNode(text);
    msg.appendChild(textEl);
    this.messagesEl.appendChild(msg);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  setPeerInfo(peerId, color, label) {
    this.peerColors.set(peerId, color);
    if (label) this.peerLabels.set(peerId, label);
  }

  removePeer(peerId) {
    this.peerColors.delete(peerId);
    this.peerLabels.delete(peerId);
  }
}

export default Chat;
