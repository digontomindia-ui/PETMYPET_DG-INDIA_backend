import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

const SYSTEM_PROMPT = `You are the Patmypets AI assistant, embedded in a pet-care marketplace app
(booking groomers, vets, boarding, walkers, trainers, pet sitters, and a pet-products store).
Answer pet-care questions and help the user navigate the app. Keep replies short and friendly.
You cannot see or modify the user's bookings, payments, or account — if asked to do so, tell them
to use the app screens or contact support instead. If a question needs a vet's medical judgement,
say so and recommend booking a vet consultation in the app.`;

export interface AiChatTurn {
  role: 'USER' | 'ASSISTANT';
  text: string;
}

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (!env.GEMINI_API_KEY) return null;
  client ??= new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return client;
}

const DUMMY_REPLIES = [
  "That's a great question! Generally, regular vet checkups and a balanced diet go a long way for your pet's health.",
  "I'd recommend booking a vet consultation in the app if you want a proper diagnosis for that.",
  "Most pets do well with a consistent routine — feeding, walks, and playtime at the same time each day.",
  "You can check the Services tab to book grooming, boarding, or a pet sitter near you.",
];

// ponytail: dummy fallback when GEMINI_API_KEY isn't set, so the AI chat UI works without a real key. Remove once Gemini is always configured.
async function dummyReply(history: AiChatTurn[]): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return DUMMY_REPLIES[history.length % DUMMY_REPLIES.length]!;
}

export async function generateAiChatReply(history: AiChatTurn[]): Promise<string> {
  const genClient = getClient();
  if (!genClient) return dummyReply(history);

  const model = genClient.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent({
    contents: history.map((turn) => ({
      role: turn.role === 'ASSISTANT' ? 'model' : 'user',
      parts: [{ text: turn.text }],
    })),
  });

  const text = result.response.text().trim();
  if (!text) throw AppError.internal('Gemini returned an empty reply');
  return text;
}
