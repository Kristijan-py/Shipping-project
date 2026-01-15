import redisClient from "../config/redis.js";

export const getOrSetCache = async (key, fetch, TTL = 3600) => {
    const cachedData = await redisClient.get(key);
    // If we hit cache, return from Redis, not from Server
    if(cachedData) {
        console.log('Cache hit');
        return JSON.parse(cachedData);
    }
    // If no cache, make fetch from DB
    console.log('Cache miss');
    const freshData = await fetch();
    if (freshData) {
        // Store freshdata to Redis
        await redisClient.setEx(key, TTL, JSON.stringify(freshData)); // Cache for 1 hour
    }
    return freshData;
} 