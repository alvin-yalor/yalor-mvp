import { AceEvent, ExtractedProfileTraitsPayload, UserProfile } from '../infrastructure/events';
import { eventBus } from '../infrastructure/eventBus';
import { logger } from '../infrastructure/logger';

/**
 * For the MVP, this is a simple in-memory store.
 * In Phase 2, this will hit Redis or a durable DB keyed on a persistent User ID.
 */
class SessionProfilerStore {
    private profiles: Map<string, UserProfile> = new Map();

    constructor() {
        this.listenToAnalyzerEvents();
    }

    private listenToAnalyzerEvents() {
        eventBus.safeOn(AceEvent.EXTRACTED_PROFILE_TRAITS, (payload: ExtractedProfileTraitsPayload) => {
            logger.info(`[Profiler] Updating traits for session ${payload.sessionId}: ${Object.keys(payload.profileDelta).join(', ')}`);
            this.updateProfile(payload.sessionId, payload.profileDelta, payload.confidenceScores);
        });
    }

    public getProfile(sessionId: string): UserProfile {
        if (!this.profiles.has(sessionId)) {
            this.profiles.set(sessionId, {
                id: sessionId,
                inferredData: { interests: [], hobbies: [], householdContext: [], lifeEvents: [] },
                confidenceScores: {}
            });
        }
        return this.profiles.get(sessionId)!;
    }

    public updateProfile(sessionId: string, newInferredSignals: Partial<UserProfile['inferredData']>, confidenceScores: Record<string, number>): void {
        const existing = this.getProfile(sessionId);

        // Deep merge arrays like interests, overwrite scalar values
        const mergedInterests = Array.from(new Set([
            ...(existing.inferredData.interests || []),
            ...(newInferredSignals.interests || [])
        ]));

        const mergedHobbies = Array.from(new Set([
            ...(existing.inferredData.hobbies || []),
            ...(newInferredSignals.hobbies || [])
        ]));

        const mergedLifeEvents = Array.from(new Set([
            ...(existing.inferredData.lifeEvents || []),
            ...(newInferredSignals.lifeEvents || [])
        ]));

        const mergedHousehold = Array.from(new Set([
            ...(existing.inferredData.householdContext || []),
            ...(newInferredSignals.householdContext || [])
        ]));

        const mergedData = {
            ...existing.inferredData,
            ...newInferredSignals,
            interests: mergedInterests,
            hobbies: mergedHobbies,
            lifeEvents: mergedLifeEvents,
            householdContext: mergedHousehold
        };

        this.profiles.set(sessionId, {
            ...existing,
            inferredData: mergedData,
            confidenceScores: { ...existing.confidenceScores, ...confidenceScores }
        });
    }
}

export const sessionProfiler = new SessionProfilerStore();
