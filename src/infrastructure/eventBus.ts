import { EventEmitter } from 'events';
import { AceEvent } from './events';

class AceEventBus extends EventEmitter {
    // We type-safe the emit and on methods to ensure payload correctness
    // For the MVP, we just use standard EventEmitter with `any`.
    // In a strict production system, you'd build a mapped type interface here.

    public safeEmit<T extends AceEvent>(event: T, payload: any): void {
        super.emit(event, payload);
    }

    public safeOn<T extends AceEvent>(event: T, listener: (payload: any) => void): this {
        return super.on(event, listener);
    }
}

declare global {
    var _eventBus: AceEventBus | undefined;
}

export const eventBus = global._eventBus || new AceEventBus();

if (process.env.NODE_ENV !== 'production') {
    global._eventBus = eventBus;
}
