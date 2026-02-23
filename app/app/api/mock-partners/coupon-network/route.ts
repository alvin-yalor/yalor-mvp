import { NextResponse } from 'next/server';

/**
 * The Dummy AdTech Platform (Coupon Network).
 * This acts as an external DSP/SSP that ACE Media Network will query via HTTP over the internet.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // The request format expected from ACE Media Network Connectors
        const { intentContext, funnelStage } = body;

        console.log(`[Dummy-Coupon-Network] Received Bid Request. Intent: "${intentContext}". Funnel: ${funnelStage}`);

        // Simulate DSP bid processing time (50ms - 150ms)
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Simple routing logic to return a bid based on intent
        const lowerIntent = intentContext?.toLowerCase() || '';

        if (lowerIntent.includes('bbq') || lowerIntent.includes('steak') || lowerIntent.includes('meat')) {
            console.log(`[Dummy-Coupon-Network] Found matching campaign for 'Meat'. Bidding $1.50...`);

            // Standardized OpenRTB 'adm' Native payload construction
            return NextResponse.json({
                bidAmount: 1.50,
                nativeAd: {
                    native: {
                        assets: [
                            { id: 1, title: { text: "$2 off Premium Wagyu Burgers" } },
                            { id: 2, img: { url: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=300&h=250" } },
                            { id: 3, data: { type: 1, value: "Yalor Groceries" } },
                            { id: 4, data: { type: 2, value: "Valid on all online meat orders." } }
                        ],
                        link: { url: "https://yalor.co/coupons/wagyu" },
                        imptrackers: ["https://dummy-ad-network.com/track/impression?id=123"]
                    }
                }
            }, { status: 200 });
        }

        // No matching campaign found, pass on bidding
        console.log(`[Dummy-Coupon-Network] No match found. Passing (Bid: $0).`);
        return NextResponse.json({ bidAmount: 0 }, { status: 200 });

    } catch (e) {
        console.error(`[Dummy-Coupon-Network] Error handling webhook:`, e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
