require('dotenv').config({ path: '.env.local' });
const { ConvexHttpClient } = require('convex/browser');

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function checkQuiz() {
  try {
    // You can't just query the DB directly from a script without defining a query
    // But we can check what getActiveQuizzes returns to see createdBy
    console.log("Checking active quizzes to find the one with the problem...");
    const quizzes = await client.query("admin:getActiveQuizzes");
    console.log(`Found ${quizzes.length} quizzes`);
    
    const ourQuiz = quizzes.find(q => q._id === "jh70hc6p4xzd2jfr864vm8cpp982h348");
    if (ourQuiz) {
      console.log(`Quiz found! createdBy:`, ourQuiz.createdBy);
    } else {
      console.log("Quiz not locally active or not found in getActiveQuizzes output");
      console.log("All quizzes:", quizzes.map(q => ({ id: q._id, createdBy: q.createdBy })));
      
      // Let's try the participant quiz endpoint as it gets by ID
      try {
        const pQuiz = await client.query("participant:getQuiz", { quizId: "jh70hc6p4xzd2jfr864vm8cpp982h348" });
        console.log("Got from participant route:", { id: pQuiz._id, createdBy: pQuiz.createdBy });
      } catch (e2) {
        console.error("participant route failed too", e2.message);
      }
    }
  } catch (error) {
    console.error("Error connecting to Convex:", error);
  }
}

checkQuiz();
