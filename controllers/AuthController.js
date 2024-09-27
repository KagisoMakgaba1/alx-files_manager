import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

class AuthController {
  static async getConnect(req, res) {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Decode Base64 string
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    // Hash the password using SHA1
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // Find the user
    const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a new token
    const token = uuidv4();
    const redisKey = `auth_${token}`;

    // Store the user ID in Redis for 24 hours
    await redisClient.set(redisKey, user._id.toString(), 86400); // 86400 seconds = 24 hours

    // Return the token
    res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    // Check if the token exists in Redis
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const redisKey = `auth_${token}`;
    const userId = await redisClient.get(redisKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete the token in Redis
    await redisClient.del(redisKey);
    res.status(204).send();
  }
}

export default AuthController;
