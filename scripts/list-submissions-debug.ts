import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import fetch from "node-fetch";

if (!globalThis.fetch) {
  globalThis.fetch = fetch as any;
}

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

async function main() {
  try {
    const quizId = "jh78vjngme250pa7b9bbwae33182htj3";
    console.log(`Checking submissions for quiz: ${quizId}`);
    
    // Call the debug query
    const submissions = await client.query("admin:getSubmissionsDebug" as any, { quizId });
    console.log("Submissions found:", JSON.stringify(submissions, null, 2));
    
    if (submissions.length === 0) {
      console.log("No submissions found. Checking to see if this is an actual valid quiz.");
      const activeQuizzes = await client.query("admin:getActiveQuizzes" as any);
      const isOurQuiz = activeQuizzes.find((q: any) => q._id === quizId);
      console.log("Is it an active quiz:", !!isOurQuiz);
      if (isOurQuiz) {
        console.log("Quiz details:", JSON.stringify(isOurQuiz, null, 2));
      }
    }
  } catch (e) {
    console.error(e);
  }
}
main();
