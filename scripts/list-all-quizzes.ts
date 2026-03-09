import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

async function main() {
  try {
    const quizzes = await client.query("admin:getActiveQuizzes" as any);
    console.log(`Found ${quizzes.length} quizzes`);
    const quiz = quizzes.find((q: any) => q._id === "jh70hc6p4xzd2jfr864vm8cpp982h348");
    if (quiz) {
       console.log("Found quiz:", quiz);
    } else {
       console.log("Quiz not found in active list. Let's dump all quizzes.");
       fs.writeFileSync("quizzes-dump.json", JSON.stringify(quizzes, null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}
main();
