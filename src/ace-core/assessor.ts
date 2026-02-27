import { logger } from '../infrastructure/logger';
import { eventBus } from '../infrastructure/eventBus';
import { AceEvent, BidReceivedPayload, BidAcceptedPayload, IntentDetectedPayload, OpportunityIdentifiedPayload, IntentItem } from '../infrastructure/events';
import { sessionProfiler } from './profiler';
import { v4 as uuidv4 } from 'uuid';

interface BidLedger {
    bids: BidReceivedPayload[];
    timer: NodeJS.Timeout | null;
}

/**
 * Evaluates incoming OpenRTB bids from the Media Network and selects the winner.
 * Phase 1 MVP: Rule-Based Heuristics (TypeScript). 
 */
export class BidAssessor {
    // A ledger to collect bids for a specific opportunity before closing the auction
    private auctions: Map<string, BidLedger> = new Map();
    private readonly AUCTION_WAIT_MS = 250; // Wait 250ms for all DSPs to reply

    constructor() {
        this.listenToMediaNetwork();
    }

    private listenToMediaNetwork() {
        eventBus.safeOn(AceEvent.BID_RECEIVED, (bidPayload: BidReceivedPayload) => {
            this.registerBid(bidPayload);
        });
    }

    private registerBid(bid: BidReceivedPayload) {
        if (!this.auctions.has(bid.opportunityId)) {
            // Start a new auction timer
            const timer = setTimeout(() => {
                this.closeAuction(bid.opportunityId);
            }, this.AUCTION_WAIT_MS);

            this.auctions.set(bid.opportunityId, { bids: [], timer });
        }

        // Add bid to ledger
        logger.info(`[BidAssessor] Registered bid from ${bid.partnerId} for Opp: ${bid.opportunityId}. Amount: $${bid.bidAmount}`);
        this.auctions.get(bid.opportunityId)!.bids.push(bid);
    }

    private closeAuction(opportunityId: string) {
        const ledger = this.auctions.get(opportunityId);
        if (!ledger || ledger.bids.length === 0) return;

        // Phase 1 MVP Logic: Just pick the highest bid price
        // In Phase 2, this is where XGBoost / ML inference runs to calculate "Expected Yield"
        logger.info(`[BidAssessor] Closing auction for Opp: ${opportunityId}. Evaluating ${ledger.bids.length} bids...`);

        const winningBid = ledger.bids.reduce((highest, current) => {
            return (current.bidAmount > highest.bidAmount) ? current : highest;
        });

        logger.info(`[BidAssessor] Winner Selected: ${winningBid.partnerId} at $${winningBid.bidAmount}. Emitting BID_ACCEPTED.`);

        const acceptPayload: BidAcceptedPayload = {
            sessionId: winningBid.sessionId,
            opportunityId: winningBid.opportunityId,
            winningPartnerId: winningBid.partnerId,
            winningBidAmount: winningBid.bidAmount
        };

        eventBus.safeEmit(AceEvent.BID_ACCEPTED, acceptPayload);

        // Clean up memory
        this.auctions.delete(opportunityId);
    }
}

/**
 * The Synthesizer: Merges conversational Intent with long-term Profile traits to create Opportunities.
 */
export class OpportunityAssessor {
    // Keep track of active opportunities per session to manage obsoletion
    private activeOpportunities: Map<string, OpportunityIdentifiedPayload[]> = new Map();

    constructor() {
        this.listenToAnalyzerEvents();
    }

    private listenToAnalyzerEvents() {
        eventBus.safeOn(AceEvent.INTENT_DETECTED, (payload: IntentDetectedPayload) => {
            logger.info(`[OpportunityAssessor] Received Intent for session ${payload.sessionId}. Synthesizing with latest profile...`);
            this.assessAndGenerate(payload);
        });
    }

    private assessAndGenerate(payload: IntentDetectedPayload) {
        const profile = sessionProfiler.getProfile(payload.sessionId);
        const THRESHOLD = 30;

        const opportunitiesToEmit: OpportunityIdentifiedPayload[] = [];

        payload.activeIntents.forEach((intent) => {
            // 1. Synthesize Score
            const score = this.calculateOpportunityScore(intent, payload.confidenceScore, profile);

            if (score < THRESHOLD) {
                logger.info(`[OpportunityAssessor] Intent failed qualification gate (Score: ${score}, Context: ${intent.topicContext}).`);
                return;
            }

            // 2. Synthesize Funnel Stage
            const funnelStage = this.determineFunnelStage(intent);

            // 3. Multi-Opportunity Generation (MVP heuristic approach)
            opportunitiesToEmit.push({
                sessionId: payload.sessionId,
                opportunityId: `opp_${uuidv4()}`,
                intentContext: intent.topicContext,
                funnelStage: funnelStage,
                iabCategory: this.mapToIab(intent.topicContext),
                opportunityScore: score,
                contextMap: {
                    ...profile.inferredData,
                    confidenceScores: profile.confidenceScores,
                    triggerReasoning: intent.reasoning
                }
            });
        });

        if (opportunitiesToEmit.length > 0) {
            // 4. Obsoletion Management
            this.handleObsoletion(payload.sessionId, opportunitiesToEmit);

            // 5. Emit new opportunities to Media Network
            opportunitiesToEmit.forEach(opp => {
                logger.info(`[OpportunityAssessor] Synthesized new Opportunity: ${opp.opportunityId} (${opp.intentContext})`);
                eventBus.safeEmit(AceEvent.OPPORTUNITY_IDENTIFIED, opp);
            });
        }
    }

    private handleObsoletion(sessionId: string, newOpportunities: OpportunityIdentifiedPayload[]) {
        const existingOpps = this.activeOpportunities.get(sessionId) || [];

        // Simple MVP heuristic: if we generate a new opportunity, obsolete the old ones in that session
        if (existingOpps.length > 0) {
            existingOpps.forEach(oldOpp => {
                logger.debug(`[OpportunityAssessor] Obsoleting old Opportunity: ${oldOpp.opportunityId}`);
                eventBus.safeEmit(AceEvent.OPPORTUNITY_OBSOLETED, {
                    sessionId,
                    opportunityId: oldOpp.opportunityId,
                    reason: 'Superseded by new conversational context'
                });
            });
        }

        this.activeOpportunities.set(sessionId, newOpportunities);
    }

    private calculateOpportunityScore(intent: IntentItem, confidenceScore: number, profile: any): number {
        let score = confidenceScore * 0.5; // Base score from NLP (up to 50)

        // Funnel Multiplier
        if (intent.timing === 'IMMEDIATE') score += 15;
        if (intent.intentType === 'DIRECT') score += 10;

        // Profile Richness Multipliers
        const inferred = profile.inferredData;
        if (inferred.location) score += 5;
        if (inferred.spendingPower === 'HIGH') score += 15;
        else if (inferred.spendingPower === 'MEDIUM') score += 5;

        // Interest overlap bonus
        if ((inferred.hobbies || []).length > 0) score += 5;

        return Math.min(Math.round(score), 100);
    }

    private determineFunnelStage(intent: IntentItem): 'UPPER' | 'MID' | 'LOWER' {
        if (intent.intentType === 'DIRECT' && intent.timing === 'IMMEDIATE') return 'LOWER';
        if (intent.intentType === 'LATENT' && intent.timing === 'DEFERRED') return 'UPPER';
        return 'MID';
    }

    private mapToIab(topic: string): string {
        // Simple heuristic map for MVP
        const t = topic.toLowerCase();
        if (t.includes('food') || t.includes('bbq') || t.includes('grocery')) return 'IAB8-18 (Food & Drink)';
        if (t.includes('trip') || t.includes('vacation') || t.includes('travel')) return 'IAB20 (Travel)';
        if (t.includes('health') || t.includes('fitness') || t.includes('diet') || t.includes('weight') || t.includes('workout')) return 'IAB7 (Health, Fitness & Nutrition)';
        if (t.includes('clothes') || t.includes('shoe') || t.includes('wear') || t.includes('apparel')) return 'IAB1-7 (Apparel)';

        return 'IAB9 (Hobbies & Interests)';
    }
}

export const bidAssessor = new BidAssessor();
export const opportunityAssessor = new OpportunityAssessor();
