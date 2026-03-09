import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

async function main() {
  try {
    const quizId = "jh70hc6p4xzd2jfr864vm8cpp982h348";
    
    // We can't fetch it directly without a query that exposes it
    // But we can check if it exists or use the existing queries
    console.log("Using Next.js env to check Convex URL:", process.env.NEXT_PUBLIC_CONVEX_URL);
    
  } catch (e) {
    console.error(e);
  }
}
main();
