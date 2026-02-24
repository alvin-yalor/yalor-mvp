# ACE Event-Driven Architecture MVP Plan

We are adopting an Event-Driven Architecture (EDA) to handle the asynchronous, multi-actor flow described in the Lucidchart diagram.

## Infrastructure Strategy

### Phase 1 (MVP)
*   **Logical Architecture**: Event-Driven (EDA)
*   **Physical Architecture**: "Majestic Monolith" inside the existing Next.js application.
*   **Event Bus**: In-memory `EventEmitter` (built into Node.js).
*   **Deployment**: Can be deployed as a standard Next.js app (Vercel, single EC2, AWS App Runner).
*   **Why**: Zero event latency, lowest infrastructure cost, maximum development speed.

### Phase 2 (Scale)
*   **Logical Architecture**: Event-Driven (Unchanged from Phase 1).
*   **Physical Architecture**: Microservices (Client, ACE Core, Media Network split).
*   **Event Bus**: Redis Pub/Sub, AWS EventBridge, or SQS.
*   **Deployment**: AWS ECS Fargate or Kubernetes.
*   **When**: When volume requires separate scaling of LLM evaluations from Web/Media integrations.

## Intelligence Components

### 1. "Analyze Intent" & "User Profiling" (Natural Language Understanding)
*   **Goal**: Simultaneously extract a commerce opportunity (Upper/Mid/Lower) *and* extract progressive user profile signals (Location, Gender, Budget, Interests) from conversational turns.
*   **Phase 1 (MVP)**: 
    *   **LLM API**: Fast, Managed LLMs via API (e.g., `gpt-4o-mini` or `Claude 3.5 Haiku`). Use strict JSON structured outputs for fast parsing.
    *   **Profiler Store**: An in-memory key-value map (`SessionID -> UserProfile`) within the Node process to accumulate profile signals over the course of a chat session.
*   **Phase 2 (Scale)**: 
    *   **LLM Inference**: Self-hosted Small Language Models (SLMs) (e.g., Llama-3 8B, fine-tuned BERT classifiers) running on dedicated Inference Endpoints.
    *   **Persistent Profiler**: A Redis or DynamoDB store mapping known `User IDs` or first-party data to persistent long-term behavioral profiles.

### 2. "Opportunity Pre-Qualification" (Scoring Gate)
Before ACE Core fans out an opportunity to the Media Network (which costs compute and bandwidth), it must qualify the value of the opportunity based on the richness of the User Profile.
*   **Phase 1/Phase 2 Logic**: Pure TypeScript synchronous scoring function.
    *   *Baseline*: Funnel stage (e.g., Lower Funnel = 30 points).
    *   *Profile Multipliers*: +10 points for known location, +15 points for high-value interests, +20 points for high budget.
    *   *Gate*: If `Total Score > THRESHOLD`, the event is dispatched to the Media Connectors. If not, the thread is silently killed.

### 3. "Assess Bid Requests" (AdTech Auction Logic)
*   **Goal**: Evaluate incoming DSP/SSP bids and select the most valuable opportunity in single-digit milliseconds.
*   **Phase 1 (MVP)**: Rule-Based Heuristics. Pure TypeScript synchronous logic running within the Node process. Configurable scoring algorithm based on bid price, partner trust, user profile alignment, and contextual relevance.
*   **Phase 2 (Scale)**: Machine Learning Models (e.g., XGBoost, LightGBM) trained on historical yield data to predict conversion probabilities and optimize auction outcomes.

## Potential Risks to Monitor (Deferred for Later Optimization)
1.  **Dangling Opportunities**: Handled later via strict Promise timeouts on Media Network queries.
2.  **Client Connection Loss**: Addressed later by persisting un-delivered media payloads to a Session ID queue.
3.  **Race Conditions**: Addressed later by ensuring context/turns are tightly coupled to bids so users don't see delayed ads for past topics.
4.  **Memory Management**: With an in-memory Event Bus, we need to ensure listeners are properly garbage collected and memory doesn't leak under high volume.

## Integration Dummies (MVP Proxies)

To showcase ACE's usefulness in an end-to-end flow without waiting on real-world partnerships, we will build two dedicated "Dummy" applications. These will live in their own packages or clear boundary directories to ensure they don't pollute the core ACE logic.

### 1. Dummy AI Platform (The Grocery Chatbot)
*   **Purpose**: Simulates a consumer-facing AI agent on a retailer's website.
*   **Stack**: Next.js UI (React) + API Route for the Chatbot LLM (`gpt-4o-mini`).
*   **Flow**:
    *   User types "What's good for a BBQ?"
    *   The Dummy UI sends the message to the Dummy Chatbot API.
    *   *Simultaneously*, the Dummy UI (or API) forwards this event to the **ACE MCP**.
    *   The Chatbot API streams back a normal conversational response.
    *   The **ACE MCP** streams back the parsed media payload (the ad/coupon), which the UI intercepts and renders seamlessly into the chat stream.
*   **Separation of Concerns**: This will live strictly within the Next.js `app/page.tsx` and `app/api/chat` spaces. The ACE logic knows nothing about this bot; it only knows about the MCP contract.

### 2. Dummy AdTech Platform (The Coupon Network)
*   **Purpose**: Simulates an external media partner bidding on opportunities.
*   **Stack**: A standalone Node.js service (or dedicated Next.js API routes under `/api/mock-partners/coupon-network`).
*   **Data Models**:
    *   **Catalog**: A static JSON file or SQLite DB containing grocery items organized by standard taxonomies (e.g., IAB Tech Lab Content Taxonomy or Google Product Taxonomy). Example categories: `Food & Beverage > Meat & Seafood > Beef`.
    *   **Campaigns/Coupons**: A set of predefined "fake" active campaigns (e.g., "$2 off Premium Wagyu Burgers").
*   **Flow**:
    *   ACE Media Network sends an HTTP POST to the Dummy AdTech webhook: `{ intent: "BBQ", category: "Meat" }`.
    *   The Dummy AdTech logic queries its catalog and active campaigns.
    *   If a match is found, it formulates a bid (`{ price: $1.50, adUrl: "/mock-ads/wagyu.png" }`) and responds to the webhook.
*   **Standardization**: By forcing the dummy to use standard taxonomies, we prove that the ACE Core intent analyzer is generating industry-standard outputs compatible with real DSPs.

## Media Payload Structure (OpenRTB Ingestion & AdCP Egress)

To ensure ACE acts as a true bridge between standard AdTech and Conversational AI, we will implement a two-stage payload strategy:

### 1. Ingestion (Media Network -> ACE)
ACE Core will receive bids modeled on the **IAB OpenRTB Native Ad Specification** (`adm` object).
When the Dummy AdTech platform sends a bid, it will follow this standard format:

```json
{
  "native": {
    "assets": [
      { "id": 1, "title": { "text": "$2 off Premium Wagyu Burgers" } },
      { "id": 2, "img": { "url": "https://dummy-ad-network.com/images/wagyu.png", "w": 300, "h": 250 } },
      { "id": 3, "data": { "type": 1, "value": "Yalor Groceries" } },
      { "id": 4, "data": { "type": 2, "value": "Valid on all online orders over $50." } }
    ],
    "link": { "url": "https://grocery-store.com/checkout?coupon=WAGYU2" },
    "imptrackers": [ "https://dummy-ad-network.com/track/impression?id=123" ]
  }
}
```

### 2. Egress (ACE Application -> AI Platform)
The AI Client Platform (e.g., our Grocery Chatbot) doesn't natively speak OpenRTB. The **ACE MCP** will translate the OpenRTB payload into an **AdCP (AI-driven Commerce Protocol)** formatting that includes **ARTF (AI Response Tracking Framework)** structures.

The MCP will push this unified structure to the client UI:

```json
{
  "protocol": "AdCP",
  "session_id": "sess-12345",
  "opportunity_id": "opp-987",
  
  "creative": {
    "title": "$2 off Premium Wagyu Burgers",
    "image_url": "https://dummy-ad-network.com/images/wagyu.png",
    "brand_name": "Yalor Groceries",
    "description": "Valid on all online orders over $50.",
    "click_url": "https://grocery-store.com/checkout?coupon=WAGYU2"
  },
  
  "conversational_directives": {
    "tone": "helpful",
    "must_include": "Make sure to mention it's valid for online orders.",
    "do_not_exceed_length": 50
  },
  
  "artf_tracking": {
    "on_ad_rendered": "https://ace-core.domain/track/render?id=opp-987",
    "on_ad_clicked": "https://ace-core.domain/track/click?id=opp-987",
    "on_user_follow_up": "https://ace-core.domain/track/engaged?id=opp-987",
    "on_ad_dismissed": "https://ace-core.domain/track/dismissed?id=opp-987"
  }
}
```

*   **UI Rendering**: The Client Chatbot framework consumes this payload. It uses the `creative` node to render the visual UI element (the coupon). The underlying client LLM consumes the `conversational_directives` to color its semantic response seamlessly. Finally, the client UI fires the `artf_tracking` webhooks based on the user's journey.

## Proposed Directory Structure

We will embed this cleanly within the Next.js `app` or a sibling `src` directory to keep domains separated.

```text
yalor-mvp/
├── app/                      # Next.js App Router (Existing)
│   ├── page.tsx              # Dummy AI Platform UI (Grocery Chatbot View)
│   ├── api/chat/             # Dummy AI Platform API (LLM Conversational Backend)
│   ├── api/mcp/              # The ACE MCP: Endpoints/SSE connecting UI to Event Bus
│   ├── api/mock-partners/    # Dummy AdTech Platform Endpoints
│   │   └── coupon-network/   # Dummy webhook for receiving bids and catalog data
│   └── ...
├── src/
│   ├── infrastructure/       # The "Glue"
│   │   ├── eventBus.ts       # The singleton Node EventEmitter instance
│   │   └── events.ts         # EXACT schemas/types for every allowed event
│   ├── ace-core/             # The Brain
│   │   ├── analyzer.ts       # LLM intent evaluation (Upper/Mid/Lower funnel)
│   │   └── assessor.ts       # Evaluates incoming bids from Media Net
│   └── ace-media-net/        # The Integrator
│       ├── router.ts         # Decides which DSPs/SSPs to query
│       └── connectors/       # Adapters for third parties (e.g., points to coupon-network)
```

## The Event Schema (`events.ts`)

To avoid "event spaghetti", we will strictly type the events. An example of the flow:

```typescript
// Define exact event names
export enum AceEvent {
  USER_INPUT_RECEIVED = 'USER_INPUT_RECEIVED',
  OPPORTUNITY_IDENTIFIED = 'OPPORTUNITY_IDENTIFIED',
  BID_RECEIVED = 'BID_RECEIVED',
  BID_ACCEPTED = 'BID_ACCEPTED',
  MEDIA_PAYLOAD_READY = 'MEDIA_PAYLOAD_READY'
}

// Define specific payloads for type safety
export interface OpportunityIdentifiedPayload {
  sessionId: string;
  opportunityId: string;
  intentContext: string; // e.g., "Looking for running shoes"
  funnelStage: 'UPPER' | 'MID' | 'LOWER';
}

export interface BidReceivedPayload {
  sessionId: string;
  opportunityId: string;
  partnerId: string; // e.g., 'DSP_A'
  bidAmount: number;
  creativeUrl?: string;
}

// The Event Bus interface
export interface AceEventBus {
  emit<T extends AceEvent>(event: T, payload: any): void; // Specific types applied later
  on<T extends AceEvent>(event: T, listener: (payload: any) => void): void;
}
```
