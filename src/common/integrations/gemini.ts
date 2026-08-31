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

function getClient(): GoogleGenerativeAI {
  if (!env.GEMINI_API_KEY) throw AppError.internal('Gemini is not configured');
  client ??= new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return client;
}

export async function generateAiChatReply(history: AiChatTurn[]): Promise<string> {
  const model = getClient().getGenerativeModel({
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
