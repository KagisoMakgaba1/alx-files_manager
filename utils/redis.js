import { createClient } from 'redis';

class RedisClient {
  constructor() {
    // Create a Redis client instance
    this.client = createClient();

    // Handle connection errors
    this.client.on('error', (error) => {
      console.log(`Redis client not connected to server: ${error}`);
    });

    // Connect to the Redis server
    this.client.connect().catch((error) =>
      console.error('Failed to connect to Redis server:', error)
    );
  }

  // Check if the Redis client is connected
  isAlive() {
    return this.client.isReady;
  }

  // Get the value of a key from Redis
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (error) {
      console.error(`Error getting value for key ${key}:`, error);
      return null;
    }
  }

  // Set a key-value pair in Redis with an expiration time in seconds
  async set(key, value, time) {
    try {
      await this.client.set(key, value, { EX: time });
    } catch (error) {
      console.error(`Error setting value for key ${key}:`, error);
    }
  }

  // Delete a key-value pair from Redis
  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Error deleting value for key ${key}:`, error);
    }
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
