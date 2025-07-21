class MonitoringClient {
  constructor(serverUrl = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }
  
  connect() {
    if (this.socket) return;
    
    this.socket = io(this.serverUrl);
    
    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Connected to monitoring server');
      this.emit('connected');
    });
    
    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Disconnected from monitoring server');
      this.emit('disconnected');
    });
    
    this.socket.on('agent-update', (data) => {
      this.emit('agent-update', data);
    });
    
    this.socket.on('workflow-update', (data) => {
      this.emit('workflow-update', data);
    });
    
    this.socket.on('initial-state', (data) => {
      this.emit('initial-state', data);
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  subscribe(channel) {
    if (this.socket) {
      this.socket.emit('subscribe', { channel });
    }
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MonitoringClient;
}