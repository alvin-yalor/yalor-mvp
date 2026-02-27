import { NextResponse } from 'next/server';
import { logger } from '../../../../infrastructure/logger';
import { generateText } from 'ai';
import { chatModel } from '../../../../infrastructure/llm/provider';

const SYSTEM_PROMPT = `
You are a highly capable, articulate, and proactive "Chief of Staff" and Personal Shopper AI for the user.
Your personality is crisp, polite, thoughtful, and highly organized. 

You can discuss general life topics, help with planning (travel, fitness, hobbies, events), and naturally transition into suggesting commerce/shopping ideas when it makes sense to help the user achieve their goals.

If the user mentions life changes (gaining weight, going on a trip, moving houses), lean into it by offering to help plan the logistics, which can include researching gear, booking accommodations, or finding services.

Keep your responses concise, conversational, and natural.
`;

/**
 * The Butler Chatbot API (AI Client Platform).
 * This represents the new generalist conversational agent capability.
 */
export async function POST(req: Request) {
    try {
        const { message, history = [] } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        logger.info(`[Butler-AI-Platform] Processing message via LLM: "${message}"`);

        // Generate the text response using the Vercel AI SDK
        const { text } = await generateText({
            model: chatModel,
            system: SYSTEM_PROMPT,
            messages: [
                ...history.map((msg: any) => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: message }
            ],
        });

        return NextResponse.json({
            role: 'assistant',
            content: text
        }, { status: 200 });

    } catch (e) {
        logger.error({ err: e }, `[Butler-AI-Platform] Error generating response:`);
        return NextResponse.json({ error: 'Server error generating LLM response' }, { status: 500 });
    }
}
