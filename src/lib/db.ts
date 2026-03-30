import mongoose from "mongoose";
import { resolveMongoConnection } from "./mongodb-uri";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const { uri, user, pass } = resolveMongoConnection();

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15_000,
    };
    if (user !== undefined && pass !== undefined) {
      opts.user = user;
      opts.pass = pass;
    }

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log("✅ MongoDB connected successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("[MongoDB] Connection failed:", e);
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[MongoDB] Check: Atlas → Network Access (IP allowlist), Database user + password in MONGODB_URI (URL-encode special characters), cluster not paused, restart `npm run dev` after editing .env.local"
      );
    }
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
