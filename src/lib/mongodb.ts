import mongoose from 'mongoose';

const MONGODB_URI: string = process.env.MONGODB_URI || (() => {
  throw new Error('MONGODB_URI is not defined');
})();

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global.mongooseCache ||
  (global.mongooseCache = {
    conn: null,
    promise: null,
  });

export default async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      dbName: process.env.MONGODB_DB || 'fco_billing',
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

