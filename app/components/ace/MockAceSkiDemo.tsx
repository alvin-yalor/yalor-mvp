'use client';

import React, { useState } from 'react';

type FunnelStage = 'Upper' | 'Lower';

type AceEvent = {
  id: string;
  label: string;
  funnelStage: FunnelStage;
  category: string;
  description: string;
  triggeredByTurn: number;
};

type ConversationTurn = {
  id: number;
  role: 'User' | 'Agent';
  text: string;
  newEvents?: AceEvent[];
};

// --- Hard-coded Ski Trip to Niigata script + ACE events ---

const conversationScript: ConversationTurn[] = [
  {
    id: 1,
    role: 'User',
    text: "Hey, I’m planning a ski trip to Niigata next February from Singapore. What’s the best way to get there?",
  },
  {
    id: 2,
    role: 'Agent',
    text:
      "Awesome, Niigata is a great choice for skiing. The typical route from Singapore is to fly into Tokyo " +
      "(either Haneda or Narita), then take the shinkansen (bullet train) up to Niigata or a nearby resort station " +
      "like Echigo-Yuzawa.\n\nI can recommend flight options from Singapore to Tokyo and then train connections.",
    newEvents: [
      {
        id: 'TRAVEL_FLIGHTS',
        label: 'Flights: Singapore → Tokyo',
        funnelStage: 'Lower',
        category: 'Transport / Flights',
        description:
          'User is actively planning a specific trip (Singapore → Tokyo) with dates in mind. High-intent, lower-funnel travel opportunity.',
        triggeredByTurn: 2,
      },
    ],
  },
  {
    id: 3,
    role: 'Agent',
    text:
      "Do you already have rough dates and a budget in mind? And do you prefer flying into Haneda or Narita, " +
      "or are you flexible?",
  },
  {
    id: 4,
    role: 'User',
    text:
      "Dates would be roughly 8–15 February, mid-range budget. I don’t really have a preference between Haneda and Narita.",
  },
  {
    id: 5,
    role: 'Agent',
    text:
      "Got it. For mid-range options on those dates, I’d look at full-service carriers like Singapore Airlines or ANA, " +
      "plus some competitive options from JAL. They typically fly into both Haneda and Narita.\n\n" +
      "From Tokyo, you’d take the Joetsu Shinkansen from Tokyo Station to Echigo-Yuzawa (about 80–90 minutes).",
  },
  {
    id: 6,
    role: 'Agent',
    text:
      "Once we’ve locked in the route, I can also recommend ski resorts and hotels in Niigata " +
      "that match your style and budget. Would you like me to suggest some places to stay and ski?",
    newEvents: [
      {
        id: 'ACCOM_SKIRESORT',
        label: 'Niigata Ski Resort + Hotel',
        funnelStage: 'Lower',
        category: 'Accommodation / Ski Resort',
        description:
          'User is open to receiving concrete hotel / ski resort suggestions in Niigata. Lower-funnel accommodation opportunity.',
        triggeredByTurn: 6,
      },
    ],
  },
  {
    id: 7,
    role: 'User',
    text: "Yes please, I’d love some hotel or ski resort suggestions near good slopes.",
  },
  {
    id: 8,
    role: 'Agent',
    text:
      "Nice. For Niigata, popular options include:\n" +
      "• Gala Yuzawa – easy access from the shinkansen, very convenient for day trips.\n" +
      "• Naeba / Kagura area – good for longer stays, with a variety of slopes.\n" +
      "• Myoko Kogen – slightly farther but great snow and more of a ‘resort town’ feel.\n\n" +
      "Do you have any preference: ski-in/ski-out convenience, nightlife, or quieter onsen-style stays?",
  },
  {
    id: 9,
    role: 'Agent',
    text:
      "By the way, since you’ll be skiing in February, you’ll need proper winter clothing and possibly ski gear." +
      " Do you already own warm outerwear, gloves, and goggles, or would you like suggestions for where to buy " +
      "or rent ski gear before your trip?",
    newEvents: [
      {
        id: 'WINTER_GEAR',
        label: 'Winter / Ski Gear',
        funnelStage: 'Upper',
        category: 'Winter Apparel & Gear',
        description:
          'From the planned ski trip, ACE infers an upstream need for winter clothing and ski gear. This is an upper-funnel commerce opportunity (gear purchase / rental).',
        triggeredByTurn: 9,
      },
    ],
  },
  {
    id: 10,
    role: 'User',
    text:
      "I don’t really own any proper winter gear yet, so I’ll need to buy or rent most of it.",
  },
  {
    id: 11,
    role: 'Agent',
    text:
      "Perfect, I can help with that too. Based on your budget and how often you plan to ski in the future, " +
      "I can suggest whether it makes more sense to buy core items (jacket, pants, base layers) or rent everything on-site, " +
      "and recommend some suitable brands and retailers.",
  },
];

// --- Helper UI styles ---

const badgeStyleBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
};

const stageColor: Record<FunnelStage, React.CSSProperties> = {
  Lower: { backgroundColor: 'rgba(46, 204, 113, 0.15)', color: '#27ae60' },
  Upper: { backgroundColor: 'rgba(52, 152, 219, 0.15)', color: '#2980b9' },
};

const roleBubbleColors: Record<'User' | 'Agent', React.CSSProperties> = {
  User: {
    backgroundColor: '#2c3e50',
    color: 'white',
  },
  Agent: {
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
  },
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  padding: 16,
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  backgroundColor: '#0f172a',
  color: '#e5e7eb',
  minHeight: '100vh',
  boxSizing: 'border-box',
};

const columnStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#020617',
  borderRadius: 12,
  padding: 16,
  border: '1px solid #1e293b',
  boxShadow: '0 10px 25px rgba(15,23,42,0.6)',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  marginBottom: 8,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const footerControlsStyle: React.CSSProperties = {
  marginTop: 12,
  paddingTop: 8,
  borderTop: '1px solid #1f2937',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
};

const chatListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  paddingRight: 4,
  marginTop: 12,
};

const chatBubbleRow: React.CSSProperties = {
  marginBottom: 12,
  display: 'flex',
};

const chatBubbleBase: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  maxWidth: '80%',
  whiteSpace: 'pre-wrap',
  fontSize: 14,
};

const timelineDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  backgroundColor: '#6366f1',
};

const smallLabel: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  color: '#9ca3af',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

const tableHeaderCell: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 4px',
  borderBottom: '1px solid #1f2933',
  color: '#9ca3af',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.7,
};

const tableCell: React.CSSProperties = {
  padding: '8px 4px',
  borderBottom: '1px solid #111827',
  verticalAlign: 'top',
};

// --- Main component ---

const MockAceSkiDemo: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [visibleTurns, setVisibleTurns] = useState<ConversationTurn[]>([]);
  const [events, setEvents] = useState<AceEvent[]>([]);

  const canAdvance = currentIndex < conversationScript.length - 1;

  const handleNextTurn = () => {
    if (!canAdvance) return;
    const nextIndex = currentIndex + 1;
    const nextTurn = conversationScript[nextIndex];

    setCurrentIndex(nextIndex);
    setVisibleTurns((prev) => [...prev, nextTurn]);

    if (nextTurn.newEvents && nextTurn.newEvents.length > 0) {
      setEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const fresh = nextTurn.newEvents!.filter((e) => !existingIds.has(e.id));
        return [...prev, ...fresh];
      });
    }
  };

  const handleReset = () => {
    setCurrentIndex(-1);
    setVisibleTurns([]);
    setEvents([]);
  };

  return (
    <div style={containerStyle}>
      {/* LEFT: Conversation */}
        <div style={columnStyle}>
        {/* Header (title only) */}
        <div style={headerStyle}>
            <div>
            <div style={smallLabel}>Mock ACE Agent</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>
                Ski Trip to Niigata (User ↔ Agent)
            </div>
            </div>
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Step through a scripted conversation between the user and the ACE-powered travel agent.
        </div>

        {/* Scrollable chat area */}
        <div style={chatListStyle}>
            {visibleTurns.map((turn) => {
            const isUser = turn.role === 'User';
            return (
                <div
                key={turn.id}
                style={{
                    ...chatBubbleRow,
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}
                >
                {!isUser && (
                    <div
                    style={{
                        marginRight: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                    >
                    <div
                        style={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        backgroundColor: '#1f2937',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        }}
                    >
                        A
                    </div>
                    </div>
                )}
                <div
                    style={{
                    ...chatBubbleBase,
                    ...roleBubbleColors[turn.role],
                    borderBottomRightRadius: isUser ? 2 : 12,
                    borderBottomLeftRadius: isUser ? 12 : 2,
                    }}
                >
                    <div style={{ fontSize: 11, marginBottom: 4, opacity: 0.7 }}>
                    {turn.role === 'User' ? 'User' : 'ACE Agent'}
                    </div>
                    {turn.text}
                </div>
                {isUser && (
                    <div
                    style={{
                        marginLeft: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                    >
                    <div
                        style={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        backgroundColor: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        border: '1px solid #1f2937',
                        }}
                    >
                        U
                    </div>
                    </div>
                )}
                </div>
            );
            })}
            {visibleTurns.length === 0 && (
            <div style={{ marginTop: 24, fontSize: 13, color: '#6b7280' }}>
                Click <strong>Next turn</strong> to start the conversation.
            </div>
            )}
        </div>

        {/* Footer controls (fixed at bottom, outside scroll) */}
        <div style={footerControlsStyle}>
            <button
            onClick={handleReset}
            style={{
                fontSize: 12,
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid #374151',
                background: '#020617',
                color: '#e5e7eb',
                cursor: 'pointer',
            }}
            >
            Reset
            </button>
            <button
            onClick={handleNextTurn}
            disabled={!canAdvance}
            style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 999,
                border: 'none',
                background: canAdvance ? '#4f46e5' : '#374151',
                color: 'white',
                cursor: canAdvance ? 'pointer' : 'default',
            }}
            >
            {canAdvance ? 'Next turn' : 'End of script'}
            </button>
        </div>
        </div>

      {/* RIGHT: ACE Insights */}
      <div style={columnStyle}>
        <div style={headerStyle}>
          <div>
            <div style={smallLabel}>ACE Insights</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              Detected Opportunities
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: '#9ca3af',
            }}
          >
            <div style={timelineDot} />
            <span>{events.length} opportunities</span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          As the conversation progresses, ACE tags lower-funnel and upper-funnel commerce opportunities.
        </div>

        {events.length === 0 ? (
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 16 }}>
            No opportunities yet. Step through the conversation to see ACE detections.
          </div>
        ) : (
          <div style={{ overflowY: 'auto', marginTop: 4 }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderCell}>Stage</th>
                  <th style={tableHeaderCell}>Opportunity</th>
                  <th style={tableHeaderCell}>Category</th>
                  <th style={tableHeaderCell}>Turn</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td style={tableCell}>
                      <span
                        style={{
                          ...badgeStyleBase,
                          ...stageColor[e.funnelStage],
                        }}
                      >
                        {e.funnelStage} funnel
                      </span>
                    </td>
                    <td style={tableCell}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{e.label}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{e.description}</div>
                    </td>
                    <td style={tableCell}>{e.category}</td>
                    <td style={tableCell}>
                      <span
                        style={{
                          fontSize: 12,
                          padding: '2px 6px',
                          borderRadius: 999,
                          border: '1px solid #1f2937',
                          color: '#9ca3af',
                        }}
                      >
                        #{e.triggeredByTurn}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockAceSkiDemo;
