import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
    console.error('Redis error: ', err.message);
})

await redisClient.connect(); // Connect to Redis server

redisClient.on('connect', () => {
    console.log('Connected to Redis server');
})

export default redisClient;
