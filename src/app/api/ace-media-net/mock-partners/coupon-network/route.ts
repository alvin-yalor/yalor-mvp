import { NextResponse } from 'next/server';
import { logger } from '../../../../../infrastructure/logger';

/**
 * The Dummy AdTech Platform (Coupon Network).
 * This acts as an external DSP/SSP that ACE Media Network will query via HTTP over the internet.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // The request format expected from ACE Media Network Connectors (OpenRTB 2.6)
        const intentContext = body.site?.ext?.data?.ace_intent_summary;
        // Find the user data segment that holds the funnel stage from the ACE Intent Provider
        const funnelStage = body.user?.data?.find((d: any) => d.id === 'ace_intent_provider')
            ?.segment?.find((s: any) => s.id === 'funnel')?.value;

        logger.info(`[Dummy-Coupon-Network] Received Bid Request. Intent: "${intentContext}". Funnel: ${funnelStage}`);

        // Simulate DSP bid processing time (50ms - 150ms)
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Simple routing logic to return a bid based on intent
        const lowerIntent = intentContext?.toLowerCase() || '';

        if (lowerIntent.includes('bbq') || lowerIntent.includes('steak') || lowerIntent.includes('meat')) {
            logger.info(`[Dummy-Coupon-Network] Found matching campaign for 'Meat'. Bidding $1.50...`);

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
        } else if (lowerIntent.includes('ski') || lowerIntent.includes('snow') || lowerIntent.includes('travel') || lowerIntent.includes('niseko')) {
            logger.info(`[Dummy-Coupon-Network] Found matching campaign for 'Ski Resort'. Bidding $5.50...`);

            return NextResponse.json({
                bidAmount: 5.50,
                nativeAd: {
                    native: {
                        assets: [
                            { id: 1, title: { text: "15% off Niseko Lift Passes" } },
                            { id: 2, img: { url: "https://images.unsplash.com/photo-1605540436563-5bca919ae766?auto=format&fit=crop&w=300&h=250" } },
                            { id: 3, data: { type: 1, value: "Niseko United" } },
                            { id: 4, data: { type: 2, value: "Book early for the best pow." } }
                        ],
                        link: { url: "https://niseko.ne.jp" },
                        imptrackers: ["https://dummy-ad-network.com/track/impression?id=456"]
                    }
                }
            }, { status: 200 });
        }

        // No matching campaign found, pass on bidding
        logger.info(`[Dummy-Coupon-Network] No match found. Passing (Bid: $0).`);
        return NextResponse.json({ bidAmount: 0 }, { status: 200 });

    } catch (e) {
        logger.error({ err: e }, `[Dummy-Coupon-Network] Error handling webhook:`);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
