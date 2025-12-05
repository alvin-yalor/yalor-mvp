'use client';

import React, { useState } from 'react';

type FunnelStage = 'Upper' | 'Mid' | 'Lower';

type AceEvent = {
  id: string;
  label: string;
  funnelStage: FunnelStage;
  category: string;
  description: string;
  triggeredByTurn: number;
  isFuture?: boolean;
  recommendedWindow?: string;
  isCrossSell?: boolean;
};

type ConversationTurn = {
  id: number;
  role: 'User' | 'Agent';
  text: string;
  newEvents?: AceEvent[];
};

type BudgetLevel = 'Low' | 'Mid' | 'High' | 'Unknown';
type RiskTolerance = 'Cautious' | 'Balanced' | 'Adventurous' | 'Unknown';

type CommerceProfile = {
  anchorRegion?: string;      // abstract geo / market context
  sessionContext?: string;    // abstract “what this session is about”
  budgetLevel: BudgetLevel;
  riskTolerance: RiskTolerance;
  interestTags: string[];
  notes: string[];
};

// --- Script: Niigata Ski Trip + ACE events tied to USER turns ---

const conversationScript: ConversationTurn[] = [
  {
    id: 1,
    role: 'User',
    text: "Hey, I’m planning a ski trip to Niigata next February from Singapore. What’s the best way to get there?",
    newEvents: [
      {
        id: 'TRAVEL_FLIGHTS',
        label: 'Primary Transport Booking',
        funnelStage: 'Lower',
        category: 'Core / Transport',
        description:
          'User is planning a dated trip involving long-distance travel. Core lower-funnel opportunity around flight / main transport booking.',
        triggeredByTurn: 1,
      },
      {
        id: 'TRAVEL_INSURANCE',
        label: 'Trip Protection / Travel Cover',
        funnelStage: 'Mid',
        category: 'Cross-sell / Protection',
        description:
          'International trip intent detected. Mid-funnel cross-sell opportunity around travel protection (delays, medical, cancellations).',
        triggeredByTurn: 1,
        isCrossSell: true,
      },
    ],
  },
  {
    id: 2,
    role: 'Agent',
    text:
      "Awesome, Niigata is a great choice for skiing. The typical route from Singapore is to fly into Tokyo " +
      "(either Haneda or Narita), then take the shinkansen (bullet train) up to Niigata or a nearby resort station " +
      "like Echigo-Yuzawa.\n\nI can recommend flight options from Singapore to Tokyo and then train connections.",
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
    newEvents: [
      {
        id: 'ITINERARY_PLANNING',
        label: 'Itinerary Structuring',
        funnelStage: 'Mid',
        category: 'Planning / Structuring',
        description:
          'User provides concrete dates and budget. Mid-funnel opportunity to optimize route, timing and combinations (flights + rail).',
        triggeredByTurn: 4,
      },
    ],
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
  },
  {
    id: 7,
    role: 'User',
    text: "Yes please, I’d love some hotel or ski resort suggestions near good slopes.",
    newEvents: [
      {
        id: 'ACCOM_SKIRESORT',
        label: 'Stay & Activity Bundle',
        funnelStage: 'Lower',
        category: 'Core / Stay & Venue',
        description:
          'User requests concrete stay / venue suggestions around a specific activity. Lower-funnel opportunity for lodging + slope access.',
        triggeredByTurn: 7,
      },
      {
        id: 'SKI_INSURANCE',
        label: 'Activity / Sports Protection',
        funnelStage: 'Mid',
        category: 'Cross-sell / Protection',
        description:
          'High-risk activity intent (skiing) detected. Mid-funnel cross-sell for sports / activity protection products.',
        triggeredByTurn: 7,
        isCrossSell: true,
      },
      {
        id: 'FUTURE_SOUVENIRS',
        label: 'End-of-Trip Gift / Souvenir Moment',
        funnelStage: 'Upper',
        category: 'Future / Gifting & Mementos',
        description:
          'Multi-day trip with defined end window. Future upper-funnel opportunity to suggest gifts / souvenirs near the end of the trip.',
        triggeredByTurn: 7,
        isFuture: true,
        recommendedWindow: '1–2 days before return window (around 14–15 Feb)',
      },
    ],
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
  },
  {
    id: 10,
    role: 'User',
    text:
      "I don’t really own any proper winter gear yet, so I’ll need to buy or rent most of it.",
    newEvents: [
      {
        id: 'WINTER_GEAR',
        label: 'Cold-Weather Gear Stack',
        funnelStage: 'Upper',
        category: 'Apparel & Equipment',
        description:
          'User has low baseline inventory for cold-weather gear. Upper-funnel opportunity to seed a gear stack (jacket, pants, gloves, goggles).',
        triggeredByTurn: 10,
      },
    ],
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

// --- Styles ---

const badgeStyleBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
};

const stageColor: Record<FunnelStage, React.CSSProperties> = {
  Upper: { backgroundColor: 'rgba(52, 152, 219, 0.15)', color: '#60a5fa' },
  Mid: { backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#facc15' },
  Lower: { backgroundColor: 'rgba(46, 204, 113, 0.15)', color: '#4ade80' },
};

const roleBubbleColors: Record<'User' | 'Agent', React.CSSProperties> = {
  User: {
    backgroundColor: '#2c3e50',
    color: 'white',
  },
  Agent: {
    backgroundColor: '#ecf0f1',
    color: '#1f2933',
  },
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  padding: 16,
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  backgroundColor: '#0f172a',
  color: '#e5e7eb',
  height: '100vh',       // fixed viewport height
  boxSizing: 'border-box',
  overflow: 'hidden',     // prevent whole-page scroll
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
  overflow: 'hidden',     // internal scroll only
};

const headerStyle: React.CSSProperties = {
  marginBottom: 8,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const chatListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  paddingRight: 4,
  marginTop: 12,
};

const insightsScrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  paddingRight: 4,
  marginTop: 8,
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

const footerControlsStyle: React.CSSProperties = {
  marginTop: 12,
  paddingTop: 8,
  borderTop: '1px solid #1f2937',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
};

const cardStyle: React.CSSProperties = {
  borderRadius: 10,
  border: '1px solid #1f2937',
  backgroundColor: '#020617',
  padding: 10,
  marginBottom: 12,
};

const chipStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 11,
  border: '1px solid #1f2937',
  marginRight: 4,
  marginBottom: 4,
};

// --- Helpers ---

const initialProfile: CommerceProfile = {
  budgetLevel: 'Unknown',
  riskTolerance: 'Unknown',
  interestTags: [],
  notes: [],
};

const addUnique = (list: string[], value: string): string[] => {
  return list.includes(value) ? list : [...list, value];
};

// --- Main component ---

const MockAceSkiDemoV4: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [visibleTurns, setVisibleTurns] = useState<ConversationTurn[]>([]);
  const [events, setEvents] = useState<AceEvent[]>([]);
  const [profile, setProfile] = useState<CommerceProfile>(initialProfile);

  const canAdvance = currentIndex < conversationScript.length - 1;

  const handleNextTurn = () => {
    if (!canAdvance) return;

    const nextIndex = currentIndex + 1;
    const nextTurn = conversationScript[nextIndex];

    // 1) User / Agent text appears
    setCurrentIndex(nextIndex);
    setVisibleTurns((prev) => [...prev, nextTurn]);

    // 2) ACE evaluates this input and updates insights (events + profile)
    if (nextTurn.newEvents && nextTurn.newEvents.length > 0) {
      setEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const fresh = nextTurn.newEvents!.filter((e) => !existingIds.has(e.id));
        return [...prev, ...fresh];
      });
    }

    updateProfileForTurn(nextTurn.id);
  };

  const handleReset = () => {
    setCurrentIndex(-1);
    setVisibleTurns([]);
    setEvents([]);
    setProfile(initialProfile);
  };

  const updateProfileForTurn = (turnId: number) => {
    // Abstracted profile logic: think in terms of commerce patterns, not “travel”
    setProfile((prev) => {
      let next = { ...prev };

      switch (turnId) {
        case 1:
          next.anchorRegion = 'Singapore / APAC (inferred)';
          next.sessionContext =
            'Seasonal leisure planning with location change (snow activity)';
          next.interestTags = addUnique(next.interestTags, 'Long-distance Mobility');
          next.interestTags = addUnique(next.interestTags, 'Experience-led Purchase');
          next.notes = addUnique(
            next.notes,
            'User is planning a dated experience requiring significant logistics.'
          );
          break;
        case 4:
          next.budgetLevel = 'Mid';
          next.interestTags = addUnique(next.interestTags, 'Value-Conscious Buyer');
          next.notes = addUnique(
            next.notes,
            'Explicitly stated “mid-range budget”; indicates moderate spend propensity.'
          );
          break;
        case 7:
          next.interestTags = addUnique(next.interestTags, 'Stay & Venue Bundles');
          next.interestTags = addUnique(next.interestTags, 'Activity-Centric Planning');
          next.riskTolerance =
            next.riskTolerance === 'Unknown' ? 'Balanced' : next.riskTolerance;
          next.notes = addUnique(
            next.notes,
            'Comfortable combining stay + activity in one decision path.'
          );
          break;
        case 10:
          next.interestTags = addUnique(next.interestTags, 'Apparel & Gear Build-up');
          next.notes = addUnique(
            next.notes,
            'Low baseline inventory for specialized gear; high upside for initial basket creation.'
          );
          break;
      }

      return next;
    });
  };

  // Derived views for ACE Insights
  const funnelStages: FunnelStage[] = ['Upper', 'Mid', 'Lower'];

  const eventsByStage: Record<FunnelStage, AceEvent[]> = {
    Upper: events.filter((e) => e.funnelStage === 'Upper' && !e.isFuture),
    Mid: events.filter((e) => e.funnelStage === 'Mid' && !e.isFuture),
    Lower: events.filter((e) => e.funnelStage === 'Lower' && !e.isFuture),
  };

  const futureEvents = events.filter((e) => e.isFuture);
  const crossSellEvents = events.filter((e) => e.isCrossSell);

  // --- Render ---

  return (
    <div style={containerStyle}>
      {/* LEFT: Conversation (scrollable inside only) */}
      <div style={columnStyle}>
        <div style={headerStyle}>
          <div>
            <div style={smallLabel}>Mock ACE Agent</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              Session View — Conversation & Signals
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          User messages appear first. ACE then scores the input and the agent responds.
          The right-hand side shows how ACE “sees” the session.
        </div>

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

      {/* RIGHT: ACE Insights (own scroll area) */}
      <div style={columnStyle}>
        <div style={headerStyle}>
          <div>
            <div style={smallLabel}>ACE Insights</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              Funnel, Future & Profile
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

        <div style={insightsScrollStyle}>
          {/* Funnel buckets */}
          <div style={cardStyle}>
            <div style={{ ...smallLabel, marginBottom: 4 }}>Funnel Classification</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
              ACE maintains three buckets — upper, mid and lower — across any category of commerce.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 8,
              }}
            >
              {(['Upper', 'Mid', 'Lower'] as FunnelStage[]).map((stage) => {
                const list = eventsByStage[stage];
                const label =
                  stage === 'Upper'
                    ? 'Upper funnel'
                    : stage === 'Mid'
                    ? 'Mid funnel'
                    : 'Lower funnel';
                const hint =
                  stage === 'Upper'
                    ? 'implied / future intent'
                    : stage === 'Mid'
                    ? 'evaluation & structuring'
                    : 'ready-to-activate demand';

                return (
                  <div key={stage} style={{ fontSize: 12 }}>
                    <div style={{ marginBottom: 4 }}>
                      <span
                        style={{
                          ...badgeStyleBase,
                          ...stageColor[stage],
                        }}
                      >
                        {label}
                      </span>
                      <span style={{ marginLeft: 6, color: '#9ca3af' }}>
                        ({list.length})
                      </span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 4 }}>
                      {hint}
                    </div>
                    {list.length === 0 ? (
                      <div style={{ color: '#4b5563', fontSize: 11 }}>
                        No signals yet.
                      </div>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {list.map((e) => (
                          <li key={e.id} style={{ marginBottom: 4 }}>
                            <span style={{ fontWeight: 500 }}>{e.label}</span>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                              Turn #{e.triggeredByTurn}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Future opportunities */}
          <div style={cardStyle}>
            <div style={{ ...smallLabel, marginBottom: 4 }}>Future Opportunities</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
              ACE can schedule intent that should be re-surfaced later in the session lifecycle.
            </div>
            {futureEvents.length === 0 ? (
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                No future opportunities detected yet.
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeaderCell}>Opportunity</th>
                    <th style={tableHeaderCell}>Timing</th>
                  </tr>
                </thead>
                <tbody>
                  {futureEvents.map((e) => (
                    <tr key={e.id}>
                      <td style={tableCell}>
                        <div style={{ fontWeight: 600 }}>{e.label}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{e.category}</div>
                      </td>
                      <td style={tableCell}>
                        <div style={{ fontSize: 11 }}>
                          {e.recommendedWindow || 'Later in the session lifecycle'}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: '#9ca3af',
                            marginTop: 2,
                          }}
                        >
                          Detected at turn #{e.triggeredByTurn}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Commerce profile */}
          <div style={cardStyle}>
            <div style={{ ...smallLabel, marginBottom: 4 }}>User Commerce Profile</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
              A soft, session-level view of spend propensity and interest shape — independent of domain.
            </div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <strong>Anchor region / market:</strong>{' '}
              {profile.anchorRegion ? (
                profile.anchorRegion
              ) : (
                <span style={{ color: '#6b7280' }}>Not inferred yet</span>
              )}
            </div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <strong>Session context:</strong>{' '}
              {profile.sessionContext ? (
                profile.sessionContext
              ) : (
                <span style={{ color: '#6b7280' }}>Not inferred yet</span>
              )}
            </div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <strong>Budget level:</strong>{' '}
              {profile.budgetLevel === 'Unknown' ? (
                <span style={{ color: '#6b7280' }}>Not enough data</span>
              ) : (
                profile.budgetLevel
              )}
            </div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <strong>Risk tolerance:</strong>{' '}
              {profile.riskTolerance === 'Unknown' ? (
                <span style={{ color: '#6b7280' }}>Not enough data</span>
              ) : (
                profile.riskTolerance
              )}
            </div>

            <div style={{ fontSize: 12, marginTop: 6 }}>
              <strong>Interest tags:</strong>
            </div>
            <div style={{ marginTop: 4 }}>
              {profile.interestTags.length === 0 ? (
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  No tags inferred yet.
                </span>
              ) : (
                profile.interestTags.map((c) => (
                  <span key={c} style={chipStyle}>
                    {c}
                  </span>
                ))
              )}
            </div>

            {profile.notes.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>
                  Observations:
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#9ca3af' }}>
                  {profile.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Cross-sell */}
          <div style={cardStyle}>
            <div style={{ ...smallLabel, marginBottom: 4 }}>Cross-sell Opportunities</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
              Protective and ancillary products inferred from the core intent.
            </div>
            {crossSellEvents.length === 0 ? (
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                No cross-sell suggestions yet.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12 }}>
                {crossSellEvents.map((e) => (
                  <li
                    key={e.id}
                    style={{
                      marginBottom: 6,
                      padding: 6,
                      borderRadius: 8,
                      backgroundColor: '#020617',
                      border: '1px dashed #1f2937',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 600 }}>{e.label}</div>
                      <span
                        style={{
                          ...badgeStyleBase,
                          borderRadius: 999,
                          border: '1px solid #1f2937',
                          backgroundColor: 'rgba(251, 191, 36, 0.1)',
                          color: '#fbbf24',
                        }}
                      >
                        Cross-sell
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#9ca3af',
                        marginTop: 2,
                      }}
                    >
                      {e.description}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#6b7280',
                        marginTop: 2,
                      }}
                    >
                      Triggered at turn #{e.triggeredByTurn}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockAceSkiDemoV4;
