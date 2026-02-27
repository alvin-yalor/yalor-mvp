import { OpportunityIdentifiedPayload } from '../infrastructure/events';
import { v4 as uuidv4 } from 'uuid';

export class OpenRtbMapper {
    /**
     * Translates ACE internal opportunity to an OpenRTB 2.6 BidRequest
     */
    public mapToBidRequest(opportunity: OpportunityIdentifiedPayload) {
        // Map Funnel to a Propensity Score (0.0 to 1.0)
        let propensityScore = 0.5;
        if (opportunity.funnelStage === 'UPPER') propensityScore = 0.3;
        else if (opportunity.funnelStage === 'MID') propensityScore = 0.6;
        else if (opportunity.funnelStage === 'LOWER') propensityScore = 0.9;

        // E.g. "IAB8-18 (Food & Drink)" -> we extract just the IAB code
        // For MVP, we'll try to extract the base code "IAB8-18"
        const iabMatch = opportunity.iabCategory.match(/IAB\d+(-\d+)?/);
        const iabCode = iabMatch ? iabMatch[0] : opportunity.iabCategory;

        // Base OpenRTB 2.6 structure
        return {
            id: `bid_${uuidv4()}`,
            imp: [
                {
                    id: '1',
                    native: {
                        // Native ad rendering requirements
                        request: JSON.stringify({
                            native: {
                                ver: "1.2",
                                context: 1, // Content-centric
                                plcmttype: 4, // Chat / Messaging
                                assets: [
                                    { id: 1, required: 1, title: { len: 140 } },
                                    { id: 2, required: 1, img: { type: 3, w: 1200, h: 627 } },
                                    { id: 3, required: 0, data: { type: 2 } } // Description
                                ]
                            }
                        })
                    }
                }
            ],
            site: {
                id: 'ace_chat_network',
                name: 'ACE AI Commerce',
                cat: [iabCode],
                cattax: 2, // IAB Tech Lab Ad Product Taxonomy 1.0 (describes what user is looking to buy)
                ext: {
                    data: {
                        ace_intent_summary: opportunity.intentContext,
                        ace_opportunity_score: opportunity.opportunityScore
                    }
                }
            },
            device: {
                ua: 'ACE-AI-Agent/1.0',
                ip: '192.168.1.1',
                devicetype: 1 // Mobile/Tablet
            },
            user: {
                id: 'user_anonymous', // In full implementation, grab from session context
                data: [
                    {
                        id: 'ace_intent_provider',
                        name: 'ACE Conversational Insights',
                        segment: [
                            { id: 'funnel', value: opportunity.funnelStage },
                            { id: 'propensity_score', value: propensityScore.toString() },
                            ...(opportunity.contextMap?.spendingPower ?
                                [{ id: 'spendingPower', value: opportunity.contextMap.spendingPower }] : [])
                        ]
                    }
                ],
                ext: {
                    ace: {
                        inferred_hobbies: opportunity.contextMap?.hobbies || [],
                        life_events: opportunity.contextMap?.lifeEvents || []
                    }
                }
            },
            tmax: 500, // 500ms auction timeout
            bcat: [], // Blocked list 
            wseat: [] // Allowed buyers list
        };
    }
}

export const openRtbMapper = new OpenRtbMapper();
