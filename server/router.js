import { createOpencodeClient } from "@opencode-ai/sdk";

/**
 * Multi-router strategy (ESM)
 */
export function pickModel(task) {
  const t = task.toLowerCase();
  
  if (t.includes("long context") || task.length > 5000) {
    return { providerID: "local", modelID: "qwen:latest" };
  }
  
  if (t.includes("code") || t.includes("refactor") || t.includes("fix")) {
    return { providerID: "groq", modelID: "llama-3-8b" };
  }
  
  return { providerID: "openrouter", modelID: "gpt-4.1-mini" };
}

export async function runPrompt(userPrompt, sessionId = "default-session") {
  const client = createOpencodeClient({
    baseUrl: "http://localhost:4096",
  });

  const model = pickModel(userPrompt);
  console.log(`[Router] Routing to ${model.providerID}/${model.modelID}`);

  try {
    const result = await client.session.prompt({
      path: { id: sessionId },
      body: {
        model,
        parts: [{ type: "text", text: userPrompt }],
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
