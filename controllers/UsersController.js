import dbClient from '../utils/db.js';
import crypto from 'crypto';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check for missing email and password
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if the email already exists
    const existingUser = await dbClient.db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exists' });
    }

    // Hash the password using SHA1
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // Create the new user
    const newUser = { email, password: hashedPassword };
    const result = await dbClient.db.collection('users').insertOne(newUser);

    // Return the newly created user with only email and id
    res.status(201).json({ id: result.insertedId, email });
  }
}

export default UsersController;
