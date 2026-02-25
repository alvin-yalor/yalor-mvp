import { logger } from '../infrastructure/logger';
import { eventBus } from '../infrastructure/eventBus';
import { AceEvent, BidReceivedPayload, BidAcceptedPayload } from '../infrastructure/events';

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

export const bidAssessor = new BidAssessor();
