import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}`;

dotenv.config();

class DBClient {
  constructor() {    
    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.db = this.client.db(database);
        console.log('Connected successfully to MongoDB server');
      })
      .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
      });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const usersCollection = this.db.collection('users');
    const userCount = await usersCollection.countDocuments();
    return userCount;
  }

  async nbFiles() {
    const filesCollection = this.db.collection('files');
    const fileCount = await filesCollection.countDocuments();
    return fileCount;
  }
}

const dbClient = new DBClient();
export default dbClient;
