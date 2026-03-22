/**
 * AI Service for Express backend using Vercel AI SDK.
 * Bridging CJS/ESM via dynamic imports for generateText.
 */
async function generateGenericText(prompt) {
  const { generateText } = await import('ai');
  const { createOpenAI } = await import('@ai-sdk/openai');

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: prompt,
  });

  return text;
}

module.exports = { generateGenericText };
