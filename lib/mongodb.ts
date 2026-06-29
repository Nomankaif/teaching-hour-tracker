import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB || "tuition_tracker";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getDb() {
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  if (!global.mongoClientPromise) {
    const client = new MongoClient(uri);
    global.mongoClientPromise = client.connect();
  }

  cachedClient = await global.mongoClientPromise;
  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}
