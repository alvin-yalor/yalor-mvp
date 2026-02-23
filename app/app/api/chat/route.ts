import { NextResponse } from 'next/server';

/**
 * The Dummy Chatbot API (AI Client Platform).
 * This represents the actual conversational agent taking user input.
 * In a real app, this calls OpenAI/Anthropic to generate a chat response.
 */
export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        console.log(`[Dummy-AI-Platform] Processing message: "${message}"`);

        // Simulate LLM processing time (500ms - 1s)
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Simple mocked conversational outputs based on input
        let textResponse = "I'm not sure how to help with that. Is there anything else you need?";

        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('bbq') || lowerMessage.includes('steak') || lowerMessage.includes('meat')) {
            textResponse = "A BBQ sounds fantastic! I can certainly help you find the best meats for grilling. Yalor Groceries has some excellent cuts available right now.";
        } else if (lowerMessage.includes('grocery') || lowerMessage.includes('dinner')) {
            textResponse = "I can help you plan your dinner and find the right groceries. What are you in the mood for tonight?";
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            textResponse = "Hello! I am your virtual grocery assistant. How can I help you shop today?";
        }

        return NextResponse.json({
            role: 'assistant',
            content: textResponse
        }, { status: 200 });

    } catch (e) {
        console.error(`[Dummy-AI-Platform] Error:`, e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
