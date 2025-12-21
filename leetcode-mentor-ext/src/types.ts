export type SessionState = 'idle' | 'starting' | 'active';

export type Hint = {
    id: string;
    text: string;
    type: 'info' | 'warning' | 'success';
    timestamp: number;
};
