# Yalor MVP: ACE (AI Commerce Exchange) Architecture

This Next.js application implements the Phase 1 (MVP) architecture for the **AI Commerce Exchange (ACE)**. It features an event-driven "Majestic Monolith" design using an internal Node.js `EventEmitter` to handle the asynchronous, multi-actor flow with incredibly low latency.

## 🚀 Features

- **Vercel AI SDK Integration**: Real-time conversational AI utilizing OpenAI's models (`gpt-4o-mini`).
- **ACE Insights Panel (Developer Console)**: A dual-pane UI layout that visualizes the ACE event lifecycle in real-time via Server-Sent Events (SSE).
- **Generative UI Interactive Cards**: Dynamic injection of OpenRTB-compliant payload creatives directly into the LLM chat stream.
- **Event-Driven Architecture (EDA)**: Fully decoupled Message Control Protocol (MCP) bridging AI platforms with standard AdTech networks.
- **Domain-Isolated Micro-components**: Clear structural boundaries between the "Demo" visual layers, the "ACE Core", and the simulated "Media Network".

---

## 📦 Project Structure

We follow standard Next.js 14 App Router conventions, with domain boundaries clearly enforced inside the `src/` directory.

```
yalor-mvp/
│
├── src/
│ ├── app/                  # Next.js Application Core
│ │   ├── api/
│ │   │   ├── demo/           # Vercel AI Chat Backend & SSE Streams
│ │   │   ├── mcp/            # The ACE Message Control Protocol (Core Ingress)
│ │   │   └── ace-media-net/  # Simulated External DSP/SSP Webhooks
│ │   └── page.tsx          # Dual-Pane Client UI
│ │
│ ├── components/           # React Components (ChatInput, DeveloperPanel, etc.)
│ │
│ ├── ace-core/             # Handlers representing the AI Intent analysis and Bid assessment
│ ├── ace-media-net/        # Routers to fan-out opportunities to external ad networks
│ └── infrastructure/       # Global singletons (EventBus, LLM Provider, Zod Event Schemas)
│
├── .env.local
├── package.json
└── README.md
```

*(For a deep-dive into the architectural boundaries and the event lifecycle, please see [Architecture Documentation](./docs/architecture.md)).*

---

## 🛠️ Local Development

### 1. Prerequisites
Ensure you have an OpenAI API key.
```bash
# Create a local environment file
cp .env.example .env.local

# Add your key
OPENAI_API_KEY="your_secret_key_here"
```

### 2. Install and Run
```bash
npm install
npm run dev
```

The application is now available at:
👉 [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing the Flow

To visually verify the end-to-end integration of conversational AI with the programmatic media network:

1. Open [http://localhost:3000](http://localhost:3000).
2. Type `"I need to buy some steaks for a BBQ tonight."` into the left Chat panel.
3. Observe the concurrent processing:
   - The **Developer Console** (right panel) instantly springs into action, streaming the `AceEvent` lifecycle over SSE as the backend processes the `OPPORTUNITY_IDENTIFIED` intent, fans it out, and completes the internal auction.
   - The LLM streams back a natural, text-based response.
   - The **Sponsored Suggestion card** (e.g., Wagyu Steaks) is natively injected into the chat stream via the final accepted bid.

4. **Automated ARTF Tracking**: Scrolling the card into view silently fires the `on_ad_rendered` webhook, validating viewability logic.

---

## 📘 Future Roadmap (Phase 2)
When volume requires scaling, the Event-Driven "Majestic Monolith" is designed to transition smoothly to:
- **Physical Microservices**: Decoupling the Client Demo, ACE Core, and the Media Network into isolated AWS ECS Fargate tasks or Lambda functions.
- **Event Bus Migration**: Migrating from an in-memory Node `EventEmitter` to AWS EventBridge or Apache Kafka.
- **Custom Model Inference**: Shifting from managed LLMs (Vercel) to self-hosted Small Language Models (SLMs) specifically fine-tuned for Commerce Intent extraction.
