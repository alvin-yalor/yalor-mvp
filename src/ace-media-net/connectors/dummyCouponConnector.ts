import { logger } from '../../infrastructure/logger';
import { eventBus } from '../../infrastructure/eventBus';
import { AceEvent, OpportunityIdentifiedPayload, BidReceivedPayload, OpenRtbNativeAd } from '../../infrastructure/events';

/**
 * An adapter that formats an ACE Opportunity into an HTTP request,
 * sends it to the Dummy AdTech platform webhook, and translates the response back
 * into a standard BID_RECEIVED event for the BidAssessor.
 */
export class DummyCouponConnector {

    // Simulated endpoint for the MVP (this will hit next.js API routes later)
    private readonly WEBHOOK_URL = 'http://localhost:3000/api/ace-media-net/mock-partners/coupon-network';
    private readonly TIMEOUT_MS = 200; // Hard timeout for the DSP to reply

    public async requestBid(opportunity: OpportunityIdentifiedPayload): Promise<void> {
        try {
            logger.info(`[DummyCouponConnector] Sending Opp ${opportunity.opportunityId} to external webhook...`);

            // 1. We create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('DSP Timeout')), this.TIMEOUT_MS)
            );

            // 2. We mock the HTTP fetch to the dummy partner here. 
            // For immediate MVP architecture testing, we will simulate the fetch delay
            // and directly return a built payload. Once the Next.js API route is built,
            // we swap this to an actual `fetch(this.WEBHOOK_URL)`.
            const fetchPromise = this.mockFetchExternalPartner(opportunity);

            // 3. Race the fetch against the timeout
            const response = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (response && response.bidAmount > 0) {
                // 4. If we got a valid bid, format it and push it to the Event Bus
                // so the ACE Core (Assessor) can pick it up.

                const bidPayload: BidReceivedPayload = {
                    sessionId: opportunity.sessionId,
                    opportunityId: opportunity.opportunityId,
                    partnerId: 'Dummy-Coupon-Network',
                    bidAmount: response.bidAmount,
                    rawPayload: response.nativeAd
                };

                logger.info(`[DummyCouponConnector] Received valid bid $${bidPayload.bidAmount}. Emitting BID_RECEIVED.`);
                eventBus.safeEmit(AceEvent.BID_RECEIVED, bidPayload);
            } else {
                // If there's no bid amount, the partner passed on the request
                logger.info(`[DummyCouponConnector] No bid response for Opp ${opportunity.opportunityId}.`);
            }

        } catch (e) {
            console.warn({ err: e, sessionId: opportunity.sessionId }, `[DummyCouponConnector] Failed to get bid for Opp ${opportunity.opportunityId}`);
        }
    }

    /**
     * Simulation of an HTTP request to the external AdTech partner.
     * Hits the Next.js API route.
     */
    private async mockFetchExternalPartner(opportunity: OpportunityIdentifiedPayload) {
        try {
            const res = await fetch(this.WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    opportunityId: opportunity.opportunityId,
                    intentContext: opportunity.intentContext,
                    funnelStage: opportunity.funnelStage,
                    iabCategory: opportunity.iabCategory,
                    confidenceScore: opportunity.confidenceScore,
                    evidence: opportunity.evidenceQuotes,
                    userProfile: opportunity.userProfileSnapshot
                })
            });

            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            return await res.json();

        } catch (e) {
            logger.error({ err: e, sessionId: opportunity.sessionId }, `[DummyCouponConnector] HTTP request failed:`);
            return { bidAmount: 0 };
        }
    }
}

export const dummyCouponConnector = new DummyCouponConnector();
