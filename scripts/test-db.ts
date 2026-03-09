import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

async function main() {
  try {
    const quizId = "jh78vjngme250pa7b9bbwae33182htj3";
    console.log(`Doing a full table scan of submissions...`);
    
    const submissions = await client.query("admin:getAllSubmissionsDebug" as any);
    console.log(`Total submissions in DB globally:`, submissions.length);
    
    // Check if any belong to jh78vjngme250pa7b9bbwae33182htj3
    const ourSubmissions = submissions.filter((s:any) => s.quizId === quizId);
    console.log(`Submissions for ${quizId} using manual filter:`, ourSubmissions.length);
    
    // What if we check the exact submission IDs from the screenshot?
    const target1 = "jn70xcbway4nry1a4...";
    const target2 = "jn70na2tz7jfd1gh9...";
    const found1 = submissions.find((s:any) => s._id.startsWith("jn70xcb"));
    const found2 = submissions.find((s:any) => s._id.startsWith("jn70na2tz"));
    
    if (found1) console.log("Found screenshot submission 1:", found1._id, "with quizId:", found1.quizId);
    if (found2) console.log("Found screenshot submission 2:", found2._id, "with quizId:", found2.quizId);
    
  } catch (e) {
    console.error(e);
  }
}
main();
