import { NextResponse } from 'next/server';
import { eventBus } from '../../../../infrastructure/eventBus';
import { AceEvent } from '../../../../infrastructure/events';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // Determine connection state
    const signal = req.signal;

    // Create a new ReadableStream
    const stream = new ReadableStream({
        start(controller) {
            // Helper function to serialize and send events to the client
            const sendEvent = (event: string, data: any) => {
                const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
                if (!signal.aborted) {
                    controller.enqueue(new TextEncoder().encode(payload));
                }
            };

            // Setup listeners for all ACE events
            const listeners: { [key: string]: (payload: any) => void } = {};

            Object.values(AceEvent).forEach((eventName) => {
                const listener = (payload: any) => {
                    sendEvent(eventName, payload);
                };
                listeners[eventName] = listener;
                eventBus.safeOn(eventName as AceEvent, listener);
            });

            // Keep the connection alive with a heartbeat every 15s
            const heartbeat = setInterval(() => {
                sendEvent('ping', { time: Date.now() });
            }, 15000);

            // Cleanup when the client disconnects
            signal.addEventListener('abort', () => {
                clearInterval(heartbeat);
                Object.entries(listeners).forEach(([eventName, listener]) => {
                    eventBus.off(eventName, listener);
                });
                try {
                    controller.close();
                } catch (e) {
                    // stream might already be closed
                }
                console.log('[SSE] Client disconnected, listeners cleaned up.');
            });
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable buffering for NGINX/Vercel
        },
    });
}
