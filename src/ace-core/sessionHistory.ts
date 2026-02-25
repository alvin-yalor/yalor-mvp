/**
 * SessionHistoryStore
 * 
 * Maintains a sliding context window of recent conversational turns.
 * This prevents the Intent Analyzer from sending an infinitely growing
 * chat history to the LLM, preserving strict latency budgets and token limits 
 * while maintaining temporal relevance.
 */

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export class SessionHistoryStore {
    // Map of SessionId -> Array of messages
    private store: Map<string, ChatMessage[]> = new Map();

    // The maximum number of historical turns to send to the Analyzer for context.
    private readonly MAX_HISTORY_TURNS = 4;

    /**
     * Appends a new message to the session's sliding window.
     * @param sessionId The unique session identifier.
     * @param role Who generated the message.
     * @param content The raw, unscrubbed message content.
     */
    public addMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
        const history = this.store.get(sessionId) || [];

        history.push({
            role,
            content,
            timestamp: Date.now()
        });

        // Trim to keep only the most recent N messages
        if (history.length > this.MAX_HISTORY_TURNS) {
            history.shift();
        }

        this.store.set(sessionId, history);
    }

    /**
     * Retrieves the rolling history for a session.
     * Useful for building the LLM context string.
     * @param sessionId The unique session identifier.
     * @returns Array of the most recent ChatMessages
     */
    public getHistory(sessionId: string): ChatMessage[] {
        return this.store.get(sessionId) || [];
    }

    /**
     * Formats the recent history into a single string digest.
     * E.g., "User: Hello\nAssistant: Hi, how can I help?\nUser: I need steaks"
     */
    public getHistoryDigest(sessionId: string): string {
        const history = this.getHistory(sessionId);
        return history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');
    }
}

// Global Singleton for the Phase 1 MVP
export const sessionHistoryStore = new SessionHistoryStore();
