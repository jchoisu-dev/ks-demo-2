const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = require('./env');
const Redis = require("ioredis");
const globalAny = global;

if (!globalAny.__redis) {
  globalAny.__redis = null;
}

let redis;

const createRedisClient = () => {
  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    throw new Error("Missing Redis environment variables");
  }

  return new Redis({
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null,

    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
};

const connectRedis = async() => {
  if (globalAny.__redis) {
    return globalAny.__redis;
  }

  redis = createRedisClient();

  redis.on("ready", () => {
    console.log("Redis connected and ready");
  });

  redis.on("error", (err) => {
    console.error("Redis error:", err.message);
  });

  redis.on("end", () => {
    console.warn("Redis connection closed");
  });

  globalAny.__redis = redis;

  return redis;
};

module.exports = connectRedis;