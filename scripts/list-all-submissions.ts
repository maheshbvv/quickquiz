import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

async function main() {
  try {
    const quizId = "jh78vjngme250pa7b9bbwae33182htj3";
    console.log(`Checking submissions globally using debug query`);
    
    // We already have a getSubmissionsDebug query, let's use it
    const submissions = await client.query("admin:getAllSubmissionsDebug" as any);
    console.log(`Total submissions in DB:`, submissions.length);
    
    // Check if any belong to jh78vjngme250pa7b9bbwae33182htj3
    const ourSubmissions = submissions.filter((s:any) => s.quizId === quizId);
    console.log(`Submissions for ${quizId}:`, ourSubmissions.length);
    
    if (ourSubmissions.length > 0) {
      console.log(JSON.stringify(ourSubmissions, null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}
main();
