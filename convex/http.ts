import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/",
  method: "GET",
  handler: httpAction(async (_, args) => {
    return new Response(
      "QuickQuiz API is running. Please use the Convex dashboard or client SDK to interact with the backend.",
      {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      },
    );
  }),
});

export default http;
