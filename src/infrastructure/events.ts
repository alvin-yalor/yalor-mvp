export enum AceEvent {
  // Input from Client (Dummy AI Platform) -> ACE Core
  USER_INPUT_RECEIVED = 'USER_INPUT_RECEIVED',

  // Core NLP -> Internal
  INTENT_ANALYZED = 'INTENT_ANALYZED',

  // Internal ACE Core -> ACE Media Network
  OPPORTUNITY_IDENTIFIED = 'OPPORTUNITY_IDENTIFIED',

  // ACE Media Network Router -> Internal
  OPPORTUNITY_FANNED_OUT = 'OPPORTUNITY_FANNED_OUT',

  // ACE Media Network -> ACE Core
  BID_RECEIVED = 'BID_RECEIVED',

  // ACE Core -> ACE Media Network
  BID_ACCEPTED = 'BID_ACCEPTED',

  // ACE Core -> ACE MCP -> Client
  MEDIA_PAYLOAD_READY = 'MEDIA_PAYLOAD_READY'
}

// ==========================================
// 1. Ingress Payloads
// ==========================================

export interface UserInputPayload {
  sessionId: string;
  userId?: string;
  message: string;
  timestamp: number;
}

export interface IntentAnalyzedPayload {
  sessionId: string;
  hasCommercialIntent: boolean;
  confidenceScore: number;
  iabCategory?: string;
  reasoning: string;
}

// ==========================================
// 2. Internal Architected Payloads
// ==========================================

export interface UserProfile {
  id: string; // Session ID or Auth ID
  inferredData: {
    location?: string;
    gender?: string;
    budgetThreshold?: 'LOW' | 'MEDIUM' | 'HIGH';
    interests: string[];
  };
  // How confident are we in these traits? (0.0 to 1.0)
  confidenceScores: Record<string, number>;
}

export interface OpportunityIdentifiedPayload {
  sessionId: string;
  opportunityId: string;
  intentContext: string; // e.g., "Looking for running shoes"
  funnelStage: 'UPPER' | 'MID' | 'LOWER';
  iabCategory: string; // e.g., "IAB8-18 (Food & Drink)"
  confidenceScore: number; // 0-100 rating from the Analyzer LLM
  evidenceQuotes: string[]; // Strict quotes from the user message justifying the classification
  userProfileSnapshot: UserProfile; // Passed to scoring gates
  qualificationScore: number;       // The pre-qualification score
}

export interface OpportunityFannedOutPayload {
  sessionId: string;
  opportunityId: string;
  connectorCount: number;
}

// The raw OpenRTB 'adm' payload received from a Partner
export interface OpenRtbNativeAd {
  native: {
    assets: Array<{
      id: number;
      title?: { text: string };
      img?: { url: string; w?: number; h?: number };
      data?: { type: number; value: string };
    }>;
    link: { url: string };
    imptrackers?: string[];
  };
}

export interface BidReceivedPayload {
  sessionId: string;
  opportunityId: string;
  partnerId: string; // e.g., 'Dummy-Coupon-Network'
  bidAmount: number; // e.g., 1.50
  rawPayload: OpenRtbNativeAd;
}

export interface BidAcceptedPayload {
  sessionId: string;
  opportunityId: string;
  winningPartnerId: string;
  winningBidAmount: number;
}

// ==========================================
// 3. Egress (AdCP/ARTF) Payload to Client
// ==========================================

export interface AdCpPayload {
  protocol: 'AdCP';
  session_id: string;
  opportunity_id: string;

  creative: {
    title: string;
    image_url?: string;
    brand_name?: string;
    description?: string;
    click_url: string;
  };

  conversational_directives: {
    tone: string;
    must_include?: string;
    do_not_exceed_length?: number;
  };

  artf_tracking: {
    on_ad_rendered: string;
    on_ad_clicked: string;
    on_user_follow_up: string;
    on_ad_dismissed: string;
  };
}
