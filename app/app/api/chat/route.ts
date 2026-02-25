import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { chatModel } from '../../../src/infrastructure/llm/provider';

const SYSTEM_PROMPT = `
You are a helpful, polite, and knowledgeable virtual shopping assistant for "Yalor Groceries".
Your primary goal is to help users find groceries, plan meals (like a BBQ, dinner party, etc.), and answer questions about food.
Keep your responses concise, friendly, and natural.

If the user asks something completely unrelated to food, groceries, or cooking (e.g., "What is the capital of France?"), politely let them know that you are a grocery assistant and try to pivot the conversation back to food (e.g., "I'm not sure about that, but I can certainly help you find the best French cheeses!").
`;

/**
 * The Dummy Chatbot API (AI Client Platform).
 * This represents the actual conversational agent taking user input,
 * utilizing the Vercel AI SDK to talk to the configured LLM (e.g., gpt-4o-mini).
 */
export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        console.log(`[Dummy-AI-Platform] Processing message via LLM: "${message}"`);

        // Generate the text response using the Vercel AI SDK
        const { text } = await generateText({
            model: chatModel,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: message }],
        });

        return NextResponse.json({
            role: 'assistant',
            content: text
        }, { status: 200 });

    } catch (e) {
        console.error(`[Dummy-AI-Platform] Error generating response:`, e);
        return NextResponse.json({ error: 'Server error generating LLM response' }, { status: 500 });
    }
}
