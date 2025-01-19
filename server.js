import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import Kafka from 'node-rdkafka';
import { WebSocketServer } from 'ws';
import connectDB from './config/connectdb.js';
import { kafkaConfig, kafkaConsumerConfig } from './config/kafka.config.js';
import subsModel from './models/subscriptionModel.js';
import blogModel from './models/blogmodal.js';
import Redis from 'ioredis'; // Importing ioredis

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
connectDB(process.env.DATABASE_URL);

// Redis connection
const serviceUri = process.env.REDIS_SERVICE_URL;
const redis = new Redis(serviceUri);

// Log Redis connection
redis.on('connect', () => {
  console.log('Redis connected successfully');
});

// WebSocket Server
const wss = new WebSocketServer({ noServer: true });
const clients = new Map();

// Handle WebSocket Connections
wss.on('connection', (ws, req) => {
  const userId = req.url.split('?userId=')[1]; // Extract userId from query string
  if (userId) clients.set(userId, ws);

  console.log(`WebSocket connected: ${userId}`);

  // ws.on('close', () => {
  //   console.log(clients.delete(userId))
  //   async function clearAll () {
  //     if(clients.size === 0) {
  //       clients.clear();
  //       console.log(`WebSocket disconnected: clearing all data`);
  //       try {
  //         // Clear the 'subscriptions' collection
  //         await subsModel.deleteMany({});
      
  //         await blogModel.deleteMany({});
  //         // await usersModel.deleteMany({});
      
  //         console.log({ status: 'All data cleared successfully.' });
  //       } catch (err) {
  //         console.error('Error clearing data:', err);
  //         res.status(500).send({ error: 'Failed to clear data.' });
  //       }
  //     }
  //   }

  //   clearAll()
  // });

  ws.on('error', (err) => console.error('WebSocket error:', err));

  ws.on('message', (message) => {
    console.log(`Received message from ${userId}: ${message}`);
  });
});

// Upgrade HTTP Server for WebSocket
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Kafka Producer
const producer = new Kafka.Producer(kafkaConfig);
producer.connect();

producer.on('ready', () => console.log('Kafka Producer connected'));
producer.on('event.error', (err) => console.error('Kafka Producer error:', err));

// Kafka Consumer
const consumer = new Kafka.KafkaConsumer(kafkaConsumerConfig, {});
consumer.connect();

consumer.on('ready', () => {
  console.log('Kafka Consumer connected');
  consumer.subscribe(['blog']);
  consumer.consume();
});

consumer.on('data', async (data) => {
  const message = JSON.parse(data.value.toString());
  const { userId, content } = message;

  try {
    const subscribers = await getSubscribersFromCache(userId);
    subscribers.forEach((subscriber) => {
      const ws = clients.get(subscriber);
      if (ws) {
        ws.send(JSON.stringify({ userId, content }));
      }
    });
  } catch (err) {
    console.error('Error processing message:', err);
  }
});

consumer.on('event.error', (err) => console.error('Kafka Consumer error:', err));

// Function to get subscribers from cache or DB
async function getSubscribersFromCache(userId) {
  return new Promise((resolve, reject) => {
    // First, try to get subscribers from Redis
    redis.get(userId, async (err, data) => {
      if (err) {
        reject(err);
      }
      if (data) {
        // If subscribers are found in Redis cache, return them
        resolve(JSON.parse(data));
      } else {
        // If not in Redis, fetch from MongoDB
        const subscription = await subsModel.findOne({ userId });
        const subscribers = subscription ? subscription.subscribers : [];

        // Cache the result in Redis for future requests
        redis.setex(userId, 3600, JSON.stringify(subscribers)); // Cache for 1 hour

        resolve(subscribers);
      }
    });
  });
}

// API for Publishing Blogs
app.post('/publish', async (req, res) => {
  const { userId, content } = req.body;
  const message = JSON.stringify({ userId, content });

  try {
    const newBlog = new blogModel({ userId, content, createdAt: new Date() });
    const saveBlog = newBlog.save(); // Save blog in MongoDB asynchronously
    const produceToKafka = producer.produce('blog', null, Buffer.from(message), userId); 

    await Promise.all([saveBlog, produceToKafka]);

    res.status(200).send({ status: 'Blog published successfully' });
  } catch (err) {
    console.error('Error publishing blog:', err);
    res.status(500).send({ error: 'Failed to publish blog' });
  }
});

// API for Subscribing to Blogs
app.post('/subscribe', async (req, res) => {
  const { subscriberId, userId } = req.body;

  if (subscriberId === userId) {
    return res.status(400).send({ error: 'You cannot subscribe to your own blog.' });
  }

  try {
    const result = await subsModel.findOneAndUpdate(
      { userId },
      { $addToSet: { subscribers: subscriberId } },
      { upsert: true, new: true }
    );

    // Invalidate cache for the userId after subscribing to fetch latest blog from db rather than cached in redis
    redis.del(userId);

    res.status(200).send({ status: `Subscribed to ${userId}'s blog successfully.` });
  } catch (err) {
    console.error('Error adding subscription:', err);
    res.status(500).send({ error: 'Failed to subscribe to the blog.' });
  }
});

// Fetch Blogs for Subscribed Users
app.get('/fetch-blogs', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).send({ error: 'userId is required.' });
  }

  try {
    // Step 1: Find the user's subscriptions
    const userSubscriptions = await subsModel.find({ subscribers: userId });

    const subscribedToUserIds = userSubscriptions.map((item) => {return item.userId});

    // Step 2: Fetch blogs for the subscribed users
    const blogs = await blogModel
      .find({ userId: { $in: subscribedToUserIds } })
      .sort({ createdAt: -1 });

    res.status(200).send({ blogs, subscribedToUserIds });
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).send({ error: 'Failed to fetch blogs' });
  }
});

// Endpoint to clear all data
app.get("/end-demo", async (req, res) => {
  try {
    // Clear the 'subscriptions' collection
    await subsModel.deleteMany({});
    await blogModel.deleteMany({});

    res.status(200).send({ status: 'All data cleared successfully.' });
  } catch (err) {
    console.error('Error clearing data:', err);
    res.status(500).send({ error: 'Failed to clear data.' });
  }
});
