import { NextResponse } from 'next/server';
import { logger } from '../../../infrastructure/logger';
import { eventBus } from '../../../infrastructure/eventBus';
import { AceEvent, UserInputPayload, AdCpPayload, BidAcceptedPayload } from '../../../infrastructure/events';

// FORCE INITIALIZATION OF ACE INTERNAL LISTENERS
import '../../../ace-core/analyzer';
import '../../../ace-core/assessor';
import '../../../ace-media-net/router';
import '../../../ace-media-net/connectors/dummyCouponConnector';

// In a real production system, this mapping requires a persistent store (Redis) 
// to wait for the auction to finish. For MVP, we use an in-memory Promise Map 
// keyed by Session ID to bridge the HTTP Request with the Event Emitter.
const pendingSessions = new Map<string, (payload: AdCpPayload) => void>();

// Attach a single listener to the Assessor to catch winning bids and route them
// to the waiting HTTP requests
eventBus.safeOn(AceEvent.BID_ACCEPTED, (acceptedBid: BidAcceptedPayload) => {
    // We need the Session ID here, but the Assessor only spits out the Opp ID directly.
    // In a clean architecture, we'd pass SessionId down the chain alongside OppId.
    // For the MVP, we assume a 1:1 map of Opportunity -> Session based on the global state,
    // or we add SessionId to BidAcceptedPayload.

    // We now have the Session ID directly from the accepted bid payload.
    const dynamicSessionId = acceptedBid.sessionId;

    logger.info(`[ACE-MCP] Received final accepted bid for Opp ${acceptedBid.opportunityId} (Session: ${dynamicSessionId}). Preparing AdCP payload for egress...`);

    const resolver = pendingSessions.get(dynamicSessionId);
    if (resolver) {
        // Construct the standard AdCP / ARTF payload
        const adcpPayload: AdCpPayload = {
            protocol: 'AdCP',
            session_id: dynamicSessionId,
            opportunity_id: acceptedBid.opportunityId,
            creative: {
                title: "ACE Sponsored Result",
                image_url: "https://valet-api-cdn.s3.amazonaws.com/placeholder.png", // Demo placeholder
                brand_name: "Premium Partner",
                description: "Click below to redeem.",
                click_url: "https://yalor.co"
            },
            conversational_directives: {
                tone: 'helpful',
                must_include: 'I found a great deal you might like.'
            },
            artf_tracking: {
                on_ad_rendered: `/track/render?opp=${acceptedBid.opportunityId}`,
                on_ad_clicked: `/track/click?opp=${acceptedBid.opportunityId}`,
                on_user_follow_up: `/track/inquiry?opp=${acceptedBid.opportunityId}`,
                on_ad_dismissed: `/track/dismiss?opp=${acceptedBid.opportunityId}`
            }
        };

        // Emit the final payload to the event bus for logging/SSE
        eventBus.safeEmit(AceEvent.MEDIA_PAYLOAD_READY, adcpPayload);

        // Resolve the HTTP request
        resolver(adcpPayload);
        pendingSessions.delete(dynamicSessionId);
    }
});

/**
 * The ACE MCP Ingress Webhook.
 * The Client Chatbot calls this endpoint simultaneously while calling its own LLM.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const sessionId = body.sessionId || 'global-demo-session';
        const message = body.message;

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        logger.info(`[ACE-MCP] Webhook called: session=${sessionId}, msg="${message}"`);

        // 1. We create a Promise that will resolve when the ACE Event Bus finishes
        // processing the intent, running the auction, and determining a winner.
        // If no auction happens, we resolve with `null` after a short timeout.

        const aceEgressPromise = new Promise<AdCpPayload | null>((resolve) => {
            // Set a 8000ms timeout to allow LLM intent extraction to finish.
            const timer = setTimeout(() => {
                pendingSessions.delete(sessionId);
                resolve(null);
            }, 8000);

            // Store the resolver in our Map
            pendingSessions.set(sessionId, (payload: AdCpPayload) => {
                clearTimeout(timer);
                resolve(payload);
            });
        });

        // 2. We emit the initial USER_INPUT_RECEIVED to kick off the entire ACE Core chain
        const payload: UserInputPayload = {
            sessionId,
            message,
            timestamp: Date.now()
        };

        eventBus.safeEmit(AceEvent.USER_INPUT_RECEIVED, payload);

        // 3. We await the resolution
        const adcpResult = await aceEgressPromise;

        if (adcpResult) {
            logger.info(`[ACE-MCP] Returning valid AdCP Payload to Client ID: ${sessionId}`);
            return NextResponse.json({ status: 'success', payload: adcpResult }, { status: 200 });
        } else {
            logger.info(`[ACE-MCP] Request timed out or no opp found. Returning empty to ${sessionId}`);
            return NextResponse.json({ status: 'no_opportunity' }, { status: 200 });
        }

    } catch (e) {
        logger.error({ err: e }, `[ACE-MCP] Error processing request:`);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
