class ApiClient {
  constructor(baseUrl = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Agent methods
  async getAgents() {
    return this.request('/agents');
  }
  
  async getAgent(id) {
    return this.request(`/agents/${id}`);
  }
  
  // Workflow methods
  async getWorkflows() {
    return this.request('/workflows');
  }
  
  async getWorkflow(id) {
    return this.request(`/workflows/${id}`);
  }
  
  // Health check
  async health() {
    return this.request('/health');
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}