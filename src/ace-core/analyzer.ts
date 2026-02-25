import { eventBus } from '../infrastructure/eventBus';
import { AceEvent, OpportunityIdentifiedPayload } from '../infrastructure/events';
import { sessionProfiler } from './profiler';
import { v4 as uuidv4 } from 'uuid';

/**
 * The core Natural Language Understanding module.
 * In Phase 1, it hits an external LLM (e.g., OpenAI gpt-4o-mini).
 */
export class IntentAnalyzer {

    constructor() {
        this.listenToUserEvents();
    }

    private listenToUserEvents() {
        eventBus.safeOn(AceEvent.USER_INPUT_RECEIVED, async (payload) => {
            console.log(`[IntentAnalyzer] Received message from Session ${payload.sessionId}: "${payload.message}"`);
            await this.processMessage(payload.sessionId, payload.message);
        });
    }

    private async processMessage(sessionId: string, message: string) {
        try {
            // 1. In a real environment, we'd hit the OpenAI/Anthropic API here with 'strict JSON'
            // 2. We'll mock the LLM response for the Phase 1 MVP to test the architecture
            const mockLlmResponse = this.simulateLlmInference(message);

            // 3. Update the Session Profiler
            sessionProfiler.updateProfile(sessionId, mockLlmResponse.extractedProfileSignals);
            const currentProfile = sessionProfiler.getProfile(sessionId);

            // 4. If the LLM found an opportunity, run the pre-qualification gate
            if (mockLlmResponse.hasCommerceOpportunity) {

                const score = sessionProfiler.calculateQualificationScore(mockLlmResponse.funnelStage!, currentProfile);
                const THRESHOLD = 30; // Configurable system threshold

                if (score >= THRESHOLD) {
                    const opportunityId = `opp_${uuidv4()}`;
                    console.log(`[IntentAnalyzer] Opportunity Qualified! Score: ${score}. Emitting OPPORTUNITY_IDENTIFIED.`);

                    const oppPayload: OpportunityIdentifiedPayload = {
                        sessionId,
                        opportunityId,
                        intentContext: mockLlmResponse.intentContext!,
                        funnelStage: mockLlmResponse.funnelStage!,
                        userProfileSnapshot: currentProfile,
                        qualificationScore: score
                    };

                    eventBus.safeEmit(AceEvent.OPPORTUNITY_IDENTIFIED, oppPayload);

                } else {
                    console.log(`[IntentAnalyzer] Opportunity found but FAILED qualification (Score: ${score} < ${THRESHOLD}). Killing thread.`);
                }
            }
        } catch (e) {
            console.error(`[IntentAnalyzer] Error processing message:`, e);
        }
    }

    /**
     * Mocking the LLM 'gpt-4o-mini' structured output behavior 
     * for the sake of testing Event Architecture locally without API keys.
     */
    private simulateLlmInference(userMessage: string) {
        const text = userMessage.toLowerCase();

        // Simulate finding a BBQ/Meat intent
        if (text.includes('bbq') || text.includes('meat') || text.includes('steak')) {
            return {
                hasCommerceOpportunity: true,
                intentContext: 'Looking for BBQ meats or steaks',
                funnelStage: 'LOWER' as const,
                extractedProfileSignals: {
                    budgetThreshold: 'HIGH' as const, // Buying steak implies budget
                    interests: ['grilling', 'bbq']
                }
            };
        }

        // Simulate finding a general Grocery intent
        if (text.includes('groceries') || text.includes('dinner')) {
            return {
                hasCommerceOpportunity: true,
                intentContext: 'Shopping for general dinner groceries',
                funnelStage: 'MID' as const,
                extractedProfileSignals: {
                    interests: ['cooking']
                }
            };
        }

        // No opportunity found
        return {
            hasCommerceOpportunity: false,
            extractedProfileSignals: {}
        };
    }
}

// Instantiate side-effects (listeners) at boot
export const intentAnalyzer = new IntentAnalyzer();
