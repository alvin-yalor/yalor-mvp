import { UserProfile } from '../infrastructure/events';

/**
 * For the MVP, this is a simple in-memory store.
 * In Phase 2, this will hit Redis or a durable DB keyed on a persistent User ID.
 */
class SessionProfilerStore {
    private profiles: Map<string, UserProfile> = new Map();

    public getProfile(sessionId: string): UserProfile {
        if (!this.profiles.has(sessionId)) {
            this.profiles.set(sessionId, {
                id: sessionId,
                inferredData: { interests: [] },
                confidenceScores: {}
            });
        }
        return this.profiles.get(sessionId)!;
    }

    public updateProfile(sessionId: string, newInferredSignals: Partial<UserProfile['inferredData']>): void {
        const existing = this.getProfile(sessionId);

        // Deep merge arrays like interests, overwrite scalar values
        const mergedInterests = Array.from(new Set([
            ...(existing.inferredData.interests || []),
            ...(newInferredSignals.interests || [])
        ]));

        const mergedData = {
            ...existing.inferredData,
            ...newInferredSignals,
            interests: mergedInterests
        };

        this.profiles.set(sessionId, {
            ...existing,
            inferredData: mergedData
        });
    }

    // Pre-Qualification Gating Logic
    public calculateQualificationScore(opportunityFunnelStage: 'UPPER' | 'MID' | 'LOWER', profile: UserProfile): number {
        let score = 0;

        // Baseline points based on funnel intent
        if (opportunityFunnelStage === 'LOWER') score += 30;
        if (opportunityFunnelStage === 'MID') score += 15;
        if (opportunityFunnelStage === 'UPPER') score += 5;

        // Multipliers for profile richness
        if (profile.inferredData.location) score += 10;
        if (profile.inferredData.gender) score += 5;
        if (profile.inferredData.budgetThreshold === 'HIGH') score += 20;
        if (profile.inferredData.budgetThreshold === 'MEDIUM') score += 10;

        const interestCount = profile.inferredData.interests?.length || 0;
        if (interestCount > 0) {
            // Cap interest points at 15
            score += Math.min(interestCount * 5, 15);
        }

        return score;
    }
}

export const sessionProfiler = new SessionProfilerStore();
