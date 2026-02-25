import { logger } from '../infrastructure/logger';
import { eventBus } from '../infrastructure/eventBus';
import { AceEvent, OpportunityIdentifiedPayload } from '../infrastructure/events';
import { dummyCouponConnector } from './connectors/dummyCouponConnector';

/**
 * Listens for qualified opportunities and fans them out to available Media Partners (DSPs/SSPs).
 */
export class MediaNetworkRouter {

    constructor() {
        this.listenToAceCore();
    }

    private listenToAceCore() {
        eventBus.safeOn(AceEvent.OPPORTUNITY_IDENTIFIED, async (opportunity: OpportunityIdentifiedPayload) => {
            logger.info(`[MediaNetworkRouter] Received qualified Opp: ${opportunity.opportunityId} (Intent: ${opportunity.intentContext})`);
            await this.fanOutToConnectors(opportunity);
        });
    }

    private async fanOutToConnectors(opportunity: OpportunityIdentifiedPayload) {
        // 1. In Phase 2, this Router would determine *which* connectors to call
        // based on vertical relevance (e.g., don't send car intent to a grocery DSP).
        // 2. We use Promise.allSettled so one slow DSP doesn't block the rest.

        // For MVP, we route to our single dummy connector
        const connectors = [
            dummyCouponConnector.requestBid(opportunity)
            // add more connectors here later
        ];

        logger.info(`[MediaNetworkRouter] Fanning out to ${connectors.length} connectors...`);

        eventBus.safeEmit(AceEvent.OPPORTUNITY_FANNED_OUT, {
            sessionId: opportunity.sessionId,
            opportunityId: opportunity.opportunityId,
            connectorCount: connectors.length
        });

        // Wait for all to resolve or reject, but enforce a hard timeout in the connectors
        await Promise.allSettled(connectors);
    }
}

// Instantiate side-effects at boot
export const mediaRouter = new MediaNetworkRouter();
