const { createOpencodeClient } = require("@opencode-ai/sdk");

/**
 * Multi-router strategy for Shadow Stack Orchestrator.
 * Routes prompts based on task type to different providers/models.
 */
function pickModel(task) {
  const t = task.toLowerCase();
  
  if (t.includes("long context") || task.length > 5000) {
    // Heavy lifting / long context -> Local
    return { providerID: "local", modelID: "qwen:latest" };
  }
  
  if (t.includes("code") || t.includes("refactor") || t.includes("fix")) {
    // Coding tasks -> Groq (Llama-3 is fast and competent)
    return { providerID: "groq", modelID: "llama-3-8b" };
  }
  
  // Default / Universal -> OpenRouter
  return { providerID: "openrouter", modelID: "gpt-4.1-mini" };
}

async function runPrompt(userPrompt, sessionId = "default-session") {
  const client = createOpencodeClient({
    baseUrl: "http://localhost:4096", // Assuming opencode server is running
  });

  const model = pickModel(userPrompt);
  console.log(`[Router] Routing to ${model.providerID}/${model.modelID}`);

  try {
    const result = await client.session.prompt({
      path: { id: sessionId },
      body: {
        model,
        parts: [{ type: "text", text: userPrompt }],
        // Example of structured output if needed
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              routingDecision: { type: "string" },
              answer: { type: "string" }
            },
            required: ["routingDecision", "answer"]
          }
        }
      },
    });

    return result.data;
  } catch (error) {
    console.error("[Router] Error:", error.message);
    throw error;
  }
}

module.exports = { pickModel, runPrompt };
