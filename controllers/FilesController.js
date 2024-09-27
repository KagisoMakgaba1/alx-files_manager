import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

class FilesController {
  static async postUpload(req, res) {
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

    const { name, type, parentId, isPublic, data } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Validate parentId if provided
    if (parentId) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: parentId });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Prepare file document
    const fileDoc = {
      userId,
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || 0,
    };

    // Handle folder type
    if (type === 'folder') {
      const newFolder = await dbClient.db.collection('files').insertOne(fileDoc);
      return res.status(201).json({ id: newFolder.insertedId, ...fileDoc });
    }

    // Handle file/image type
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const absolutePath = path.resolve(folderPath);

    // Create folder if it doesn't exist
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
    }

    const fileId = uuidv4();
    const localFilePath = path.join(absolutePath, fileId);

    // Decode base64 and write to file
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(localFilePath, buffer);

    // Save file document in the database
    const newFile = {
      ...fileDoc,
      localPath: localFilePath,
    };

    const result = await dbClient.db.collection('files').insertOne(newFile);
    return res.status(201).json({ id: result.insertedId, ...newFile });

static async getShow(req, res) {
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

    const { id } = req.params;

    // Retrieve the file document
    const file = await dbClient.db.collection('files').findOne({ _id: id, userId });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
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

    const { parentId = 0, page = 0 } = req.query;
    const limit = 20; // Items per page
    const skip = page * limit;

    // Retrieve files for the specific user and parentId with pagination
    const files = await dbClient.db.collection('files')
      .find({ userId, parentId: Number(parentId) })
      .skip(skip)
      .limit(limit)
      .toArray();

    return res.status(200).json(files);
  }
}

export default FilesController;
