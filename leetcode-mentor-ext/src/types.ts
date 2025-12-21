export type SessionState = 'idle' | 'starting' | 'active';

export type Hint = {
    id: string;
    text: string;
    type: 'info' | 'warning' | 'success' | 'user';
    timestamp: number;
};
export type Settings = {
    chatModeEnabled: boolean;
    throttleDuration: number;
};
