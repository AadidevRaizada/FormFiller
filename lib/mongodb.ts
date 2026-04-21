// Connection caching pattern for Vercel serverless
// MONGODB_URI will be provided as environment variable — see .env.local.example

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | undefined;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  // Mock mode — no database connection
  console.warn("MONGODB_URI not set — running in mock mode");
} else if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to preserve the connection
  // across hot reloads and avoid exhausting database connections.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client for each serverless invocation.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
