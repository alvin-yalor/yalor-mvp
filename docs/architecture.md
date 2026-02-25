# ACE Architecture & Domain Boundaries

The **AI Commerce Exchange (ACE)** MVP utilizes a majestic monolith design pattern built on top of Next.js and React. By leveraging an internal Node.js `EventEmitter` to create an **Event-Driven Architecture (EDA)**, we simulate complex, asynchronous multi-actor messaging with near-zero latency.

In preparation for eventual microservices abstraction, the codebase is strictly segregated into three distinct domains.

---

## 1. The Demo / Client Domain
**Location:** `src/app/api/demo/` and `src/components/`

This domain represents the "Partner AI Platform" (e.g., Perplexity, OpenAI, or a custom chatbot). Its only responsibility is engaging with the end-user and forwarding data to the ACE system.

### Components
- **Chatbot Backend (`/api/demo/chat`)**: Utilizes the Vercel AI SDK to stream conversational responses back to the React UI.
- **Developer Console (`/api/demo/sse`)**: A Server-Sent Events stream to power the right-hand visual pane, allowing developers to "peek behind the curtain" of the ACE network. 
- **React UI (`page.tsx`)**: Renders both the LLM text output and the structured `AdCP` payload injected by the ACE architecture.

---

## 2. The ACE Core Pipeline
**Location:** `src/ace-core/` and `src/app/api/mcp/`

This is the brain of the ecosystem. It receives synchronous, unstructured input from the Client Domain and turns it into asynchronous, monetized value.

### Components
- **The Message Control Protocol (`/api/mcp`)**: The single public API ingress for ACE. It receives chat webhooks and translates them into the asynchronous `AceEvent` system. It bridges the synchronous incoming HTTP request with the asynchronous bid resolution by tracking conversational `Session IDs` in an internal `pendingSessions` map, safely resolving the request once the auction finishes.
- **Intent Analyzer (`analyzer.ts`)**: Currently a mocked implementation. In production, this utilizes Structured Outputs to evaluate user chat text and extract High-Intent Commercial context (e.g., "Buying Steaks"). Emits `OPPORTUNITY_IDENTIFIED`.
- **Bid Assessor (`assessor.ts`)**: Evaluates incoming bids from the Media Network based on OpenRTB logic. Executes the timeout parameters and resolves the auction with `BID_ACCEPTED`.

---

## 3. The ACE Media Network
**Location:** `src/ace-media-net/` and `src/app/api/ace-media-net/`

This domain represents the exchange layer that integrates with external Demand Side Platforms (DSPs) and advertising networks.

### Components
- **Event Router (`router.ts`)**: Subscribes to the internal `OPPORTUNITY_IDENTIFIED` event. Its sole job is to fan-out (broadcast) the opportunity to every registered internal connector simultaneously via `OPPORTUNITY_FANNED_OUT`.
- **Connectors (e.g., `dummyCouponConnector.ts`)**: Adapters that map the internal ACE opportunity schema into standard HTTP requests sent over the internet to the DSP webhooks. This layer serves as the main gateway to the **AdTech Ecosystem**, capable of natively integrating with platforms like DV360, Criteo, CitrusAds, and TTD, utilizing industry standards like OpenRTB, specialized AdCP formats, and Native Banners.
- **Mock Partners (`/api/ace-media-net/mock-partners/`)**: Next.js API Routes pretending to be external advertising companies. They receive HTTP requests, evaluate the intent, and return a parsed JSON bid (e.g., a $1.50 coupon for Wagyu Beef).

---

## 4. Infrastructure Layer
**Location:** `src/infrastructure/`

This domain manages the global singletons that wire the ecosystem together.

### Components
- **Shared Event Bus (`eventBus.ts`)**: The internal NodeJS event emitter that drives the main architectural lifecycle.
- **Structured Logger (`logger.ts`)**: A centralized logging configuration utilizing `Pino`. It dynamically routes logs based on environment configurations, writing structured JSON to a persistent file (`logs/ace.log`) while simultaneously rendering a colorized, human-readable stdout stream during local development via `pino-pretty`.

---

## The Event Lifecycle

The architecture is driven by the internal singleton `eventBus.ts`. A standard interaction trace looks like this:

1. **`USER_INPUT_RECEIVED`**: Triggered by `/api/mcp`.
2. **`OPPORTUNITY_IDENTIFIED`**: Triggered by the `IntentAnalyzer`.
3. **`OPPORTUNITY_FANNED_OUT`**: Triggered by the `MediaNetworkRouter`.
4. **`BID_RECEIVED`**: Triggered by the Connector when a mock partner responds.
5. **`BID_ACCEPTED`**: Triggered by the `BidAssessor` when the auction closes.
6. **`MEDIA_PAYLOAD_READY`**: Triggered to resolve the pending `/api/mcp` API route, serializing the winning bid into `AdCP` format.
