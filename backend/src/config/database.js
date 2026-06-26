import mongoose from "mongoose";

let databaseReady = false;

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  mongoose.set("strictQuery", true);
  mongoose.set("bufferCommands", false);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    tls: true,
  });
  databaseReady = true;
  console.log("Connected to MongoDB Atlas");
}

export function markDatabaseUnavailable() {
  databaseReady = false;
}

export function isDatabaseReady() {
  return databaseReady && mongoose.connection.readyState === 1;
}
