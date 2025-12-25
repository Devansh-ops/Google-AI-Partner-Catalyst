import { useEffect, useRef } from 'react';

export function useDomEvent<T extends Event = Event>(
    eventName: string,
    handler: (event: T) => void,
    element: HTMLElement | Window | Document | null = window
) {
    const savedHandler = useRef(handler);

    // Update ref.current value if handler changes.
    // This allows our effect below to always get latest handler ...
    // ... without us needing to pass it in effect deps array ...
    // ... and potentially cause effect to re-run every render.
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!element) return;

        // Create event listener that calls handler function stored in ref
        const eventListener = (event: Event) => savedHandler.current(event as T);

        element.addEventListener(eventName, eventListener);

        // Remove event listener on cleanup
        return () => {
            element.removeEventListener(eventName, eventListener);
        };
    }, [eventName, element]);
}
