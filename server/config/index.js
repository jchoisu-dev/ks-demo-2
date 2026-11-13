const connectDB = require('./database');
const connectRedis = require('./redis');
const env = require('./env');
const r2 = require('./r2');
module.exports = {
    connectDB,
    connectRedis,
    r2,
    env
}