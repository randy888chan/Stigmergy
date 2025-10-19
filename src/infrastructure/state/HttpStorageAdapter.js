
export class HttpStorageAdapter {
  constructor(serverUrl) {
    this.serverUrl = serverUrl || 'http://localhost:3012'; // Default for the team server
    console.log(`HttpStorageAdapter initialized for server: ${this.serverUrl}`);
  }

  async getState() {
    try {
      const response = await fetch(`${this.serverUrl}/api/state`);
      if (!response.ok) {
        throw new Error(`Failed to fetch state: ${response.statusText}`);
      }
      const state = await response.json();
      console.log('HttpStorageAdapter: State fetched successfully from the server.');
      return state;
    } catch (error) {
      console.error('HttpStorageAdapter: Error getting state from the server:', error.message);
      return null;
    }
  }

  async updateState(state) {
    try {
      const response = await fetch(`${this.serverUrl}/api/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state),
      });
      if (!response.ok) {
        throw new Error(`Failed to update state: ${response.statusText}`);
      }
      console.log('HttpStorageAdapter: State updated successfully on the server.');
    } catch (error) {
      console.error('HttpStorageAdapter: Error updating state on the server:', error.message);
    }
  }
}
