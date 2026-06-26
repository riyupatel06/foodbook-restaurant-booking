import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase, markDatabaseUnavailable } from "./config/database.js";

dotenv.config();

const port = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await connectDatabase();
  } catch (error) {
    markDatabaseUnavailable();
    console.error("MongoDB connection failed. Starting API with development fallback storage.");
    console.error(error.message);
  }

  app.listen(port, () => {
    console.log(`RestorantBooking API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
