import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.warn(
    "NEXT_PUBLIC_CONVEX_URL is not set. Please create a Convex project and set the environment variable."
  );
}

const convex = new ConvexHttpClient(convexUrl || "http://localhost:3001");

export default convex;
