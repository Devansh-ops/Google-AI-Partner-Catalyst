import { useCallback, useRef, useState, useEffect } from 'react';

export function useThrottle(callback: (...args: any[]) => void, delay: number) {
    const [isThrottled, setIsThrottled] = useState(false);
    const lastRan = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const throttledCallback = useCallback((...args: any[]) => {
        const now = Date.now();

        if (lastRan.current === null || now - lastRan.current >= delay) {
            callback(...args);
            lastRan.current = now;
            setIsThrottled(true);

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                setIsThrottled(false);
            }, delay);
        }
    }, [callback, delay]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return { throttledCallback, isThrottled };
}
