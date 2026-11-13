const { MONGO_URI } = require('./env');
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const globalAny = global;
globalAny.__mongoose = globalAny.__mongoose || {
  conn: null,
  promise: null,
};
const connectDB = async () => {
  const cached = globalAny.__mongoose;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGO_URI, opts)
      .then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
    console.log(`MongoDB Connected: ${cached.conn.connection.host}`);
  } catch (err) {
    cached.promise = null;
    console.error(`MongoDB Connection Failed: ${err.message}`);
    process.exit(1);
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;