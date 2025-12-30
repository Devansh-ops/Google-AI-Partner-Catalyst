import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import styles from './index.css?inline';
import toastStyles from 'react-toastify/dist/ReactToastify.css?inline';
import { useThrottle } from './hooks/useThrottle';
import { useDomEvent } from './hooks/useDomEvent';
import { useWebSocket } from './hooks/useWebSocket';


import type { SessionState, Hint, Settings } from './types';
import { Header } from './components/Header';
import { IdleView } from './components/IdleView';
import { StartingView } from './components/StartingView';
import { ActiveView } from './components/ActiveView';
import { ActiveFooter } from './components/ActiveFooter';
import { ChatFooter } from './components/ChatFooter';
import { FloatingTrigger } from './components/FloatingTrigger';
import { LiveToast } from './components/LiveToast';
import { SettingsView } from './components/SettingsView';

// Custom Event type
interface ProblemEvent extends CustomEvent {
  detail: { title: string; url: string; description: string };
}

interface GenericLeetCodeEvent extends CustomEvent {
  detail: {
    event_type: string;
    [key: string]: any;
  };
}

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [hints, setHints] = useState<Hint[]>([]);
  const [isChatMode, setIsChatMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => {
    const defaults = {
      chatModeEnabled: true,
      throttleDuration: 60000, // 1 minute default
      elevenLabsTTSEnabled: false
    };

    try {
      const saved = localStorage.getItem('leetcode-mentor-settings');
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to parse settings", e);
    }
    return defaults;
  });

  // Persist settings changes
  useEffect(() => {
    localStorage.setItem('leetcode-mentor-settings', JSON.stringify(settings));
  }, [settings]);
  const lastHintIdRef = useRef<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket Connection
  // TODO: Replace with dynamic session ID generation or retrieval
  const sessionId = useRef(`session-${Date.now()}`).current;
  const { isConnected, sendMessage, lastMessage } = useWebSocket('ws://localhost:8000/ws', sessionId);

  // Handle incoming WS messages
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'hint') {
      // ... existing hint handling logic adaptation ...
      // For now, we reuse the existing simulated hint structure, but real hints come here
      setHints((prev: Hint[]) => [...prev, {
        id: `hint-${Date.now()}`,
        text: lastMessage.hint,
        type: 'info', // Default to info for now
        timestamp: Date.now()
      }]);
    } else if (lastMessage.type === 'chat_response') {
      setHints((prev: Hint[]) => [...prev, {
        id: `ai-${Date.now()}`,
        text: lastMessage.message,
        type: 'info',
        timestamp: Date.now()
      }]);
    }
  }, [lastMessage]);


  // Listen for problem updates from content script
  useDomEvent<ProblemEvent>('PROBLEM_UPDATED', (e) => {
    const detail = e.detail;
    if (detail) {
      // If we are in a session and the problem changes (title is different), we should end the session.
      if (detail.title && detail.title !== question && sessionState !== 'idle') {
        setSessionState('idle');
        setHints([]);
        setIsChatMode(false);
        toast(
          ({ closeToast }) => (
            <div onClick={() => setIsOpen(true)}>
              <LiveToast
                title="Session Update"
                message="New problem detected. Session reset."
                type="info"
                onClose={closeToast}
              />
            </div>
          ),
          {
            autoClose: 3000,
            className: "!bg-transparent !p-0 !border-0 !shadow-none !mb-4",
            icon: false,
            closeButton: false,
          }
        );
      }

      if (detail.title) setQuestion(detail.title);
      if (detail.description) setDescription(detail.description);
    }
  }, window);

  const handleExtensionEvent = (e: GenericLeetCodeEvent) => {
    const detail = e.detail;
    if (!detail) return;



    // Send to WebSocket if verified
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      let payload = { ...detail };

      // Map event types to backend schema (backend/shared/models/event_schemas.py)
      // Valid types: 'CODE_CHANGE', 'TAB_SWITCH', 'HINT_REQUEST', 'TEST_RUN', 'GIVE_UP'

      if (payload.event_type === 'CODE_EXECUTION_RESULT') {
        // Map execution results to TEST_RUN with status
        payload.event_type = 'TEST_RUN';
        // payload already has test_status, error_message, code, etc. from inject.js
      }

      // Ensure exact keys required by schema
      const validTypes = ['CODE_CHANGE', 'TAB_SWITCH', 'HINT_REQUEST', 'TEST_RUN', 'GIVE_UP'];

      if (validTypes.includes(payload.event_type)) {
        console.log('Sending to WS:', payload);
        wsRef.current.send(JSON.stringify(payload));
      } else {
        console.warn(`Skipping sending unknown event type: ${payload.event_type}`);
      }
    }
  };

  // Generic Event Listeners
  useDomEvent<GenericLeetCodeEvent>('CODE_RESPONSE', handleExtensionEvent, window);
  useDomEvent<GenericLeetCodeEvent>('TAB_SWITCH', handleExtensionEvent, window);
  //useDomEvent<GenericLeetCodeEvent>('TEST_RUN', handleExtensionEvent, window); // inject.js handles this internally and emits CODE_EXECUTION_RESULT later
  //useDomEvent<GenericLeetCodeEvent>('SUBMIT_CODE', handleExtensionEvent, window);
  useDomEvent<GenericLeetCodeEvent>('CODE_EXECUTION_RESULT', handleExtensionEvent, window);
  useDomEvent<GenericLeetCodeEvent>('PROBLEM_UPDATED', handleExtensionEvent, window);

  // Initial request for problem details
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('GET_PROBLEM_DETAILS'));
  }, []);

  // Handle Toast Notifications
  useEffect(() => {
    if (hints.length > 0) {
      const latest = hints[hints.length - 1];
      if (latest.id !== lastHintIdRef.current) {
        lastHintIdRef.current = latest.id;
        if (!isOpen) {
          // Trigger custom toast
          toast(
            ({ closeToast }) => (
              <div onClick={() => setIsOpen(true)}>
                <LiveToast
                  title="New Insight"
                  message={latest.text}
                  type="insight"
                  onClose={closeToast}
                />
              </div>
            ),
            {
              onClick: () => setIsOpen(true),
              autoClose: 8000,
              pauseOnHover: true,
              closeButton: false,
              className: "!p-0 !bg-transparent !shadow-none !mb-4",
              icon: false,
            }
          );
        }
      }
    }
  }, [hints, isOpen]);

  // Close toast when opening chat
  useEffect(() => {
    if (isOpen) toast.dismiss();
  }, [isOpen]);

  const startSession = () => {
    if (!question.trim()) return;
    setSessionState('starting');

    const sessionId = self.crypto.randomUUID();

    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/${sessionId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setSessionState('active');

      // Add initial system message
      const initId = 'init-' + Date.now();
      setHints([
        {
          id: initId,
          text: `Session started for: "${question}" (Session ID: ${sessionId}). Monitoring your code changes...`,
          type: 'info',
          timestamp: Date.now()
        }
      ]);
      lastHintIdRef.current = initId;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'hint') {
          setHints(prev => [...prev, {
            id: 'hint-' + Date.now(),
            text: data.hint,
            type: 'warning',
            timestamp: Date.now()
          }]);
        }
      } catch (e) {
        console.error("Error parsing WS message", e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error("Failed to connect to session server");
      setSessionState('idle');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;
  };

  const endSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setSessionState('idle');
    setHints([]);
    setIsChatMode(false);
    // We keep the question populated
  };

  // Close popup when clicking outside
  useDomEvent<MouseEvent>('mousedown', (event) => {
    if (
      isOpen &&
      containerRef.current &&
      !event.composedPath().includes(containerRef.current)
    ) {
      setIsOpen(false);
    }
  }, document);

  const handleRequestHint = () => {
    // Send HINT_REQUEST to backend
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        event_type: 'HINT_REQUEST',
        timestamp: new Date().toISOString(),
        // We can include other details if available in a ref, but schema says optional or handled by backend knowing session context
        // Ideally we should send current code too if possible, but for now just the event type is key
        // The pattern-processor or hint-generator likely needs code.
        // Let's try to grab it if we have it? 
        // We don't have code in App state. The inject.js sends it via events.
        // Ideally HINT_REQUEST should be sent via inject.js if we want to capture code at that moment?
        // But the button is in React side.
        // We can trigger an event that inject.js listens to?
        // Or simpler: Just send HINT_REQUEST here. The backend relies on previous code history?
        // Actually, schema definition: "Pattern-processor sends last 5 iterations". So it uses stored history. 
        // So just sending HINT_REQUEST is fine.
      };

      console.log('Sending HINT_REQUEST to WS');
      wsRef.current.send(JSON.stringify(payload));

      // Add "Requesting hint..." msg locally
      setHints(prev => [...prev, {
        id: 'req-hint-' + Date.now(),
        text: "Requesting hint...",
        type: 'info',
        timestamp: Date.now()
      }]);
    } else {
      toast.error("Not connected to session");
    }
  };

  const { throttledCallback: throttledRequestHint, isThrottled: isHintThrottled } = useThrottle(handleRequestHint, settings.throttleDuration);

  const handleSendMessage = (message: string) => {
    setHints(prev => [...prev, {
      id: 'user-msg-' + Date.now(),
      text: message,
      type: 'user',
      timestamp: Date.now()
    }]);

    // Send to Backend via WS
    sendMessage(message, {
      problem_context: {
        title: question,
        description: description,
        url: window.location.href, // Approximate
        difficulty: 'Unknown'
      },
      current_code: 'def solution(): pass', // Placeholder - would need code extraction logic
      previous_hints: hints.map((h: Hint) => h.text)
    });
  };

  return (
    <>
      <style>{styles}</style>
      <style>{toastStyles}</style>
      <div ref={containerRef} className="fixed bottom-6 right-6 z-[9999] font-sans flex flex-col items-end gap-3 pointer-events-auto">
        <ToastContainer
          position="bottom-center"
          hideProgressBar={true}
          newestOnTop
          closeOnClick={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          className="!bottom-10 !left-1/2 !-translate-x-1/2 !w-auto !p-0"
          toastClassName="!bg-transparent !shadow-none !p-0 !min-h-0 !mb-0 !rounded-none !border-0"
        />

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, y: 10, filter: "blur(10px)" }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="w-[400px] h-[600px] origin-bottom-right bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col mb-2"
            >
              {isSettingsOpen ? (
                <SettingsView
                  settings={settings}
                  onSave={setSettings}
                  onBack={() => setIsSettingsOpen(false)}
                  readOnly={sessionState !== 'idle'}
                />
              ) : (
                <>
                  <Header
                    sessionState={sessionState}
                    onClose={() => setIsOpen(false)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                  />

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto p-5 scroll-smooth custom-scrollbar relative">
                    {sessionState === 'idle' && (
                      <IdleView question={question} onStartSession={startSession} />
                    )}

                    {sessionState === 'starting' && (
                      <StartingView />
                    )}

                    {sessionState === 'active' && (
                      <ActiveView question={question} hints={hints} />
                    )}
                  </div>

                  {/* Footer */}
                  {sessionState === 'active' && !isChatMode && (
                    <ActiveFooter
                      onEndSession={endSession}
                      onRequestHint={throttledRequestHint}
                      canEnterChat={settings.chatModeEnabled && hints.length >= 6}
                      onEnterChat={() => setIsChatMode(true)}
                      isHintThrottled={isHintThrottled}
                      throttleDuration={settings.throttleDuration}
                    />
                  )}

                  {sessionState === 'active' && isChatMode && (
                    <ChatFooter
                      onSendMessage={handleSendMessage}
                      onBack={() => setIsChatMode(false)}
                    />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <FloatingTrigger isOpen={isOpen} toggleOpen={() => setIsOpen(!isOpen)} />
      </div>
    </>
  );
}

export default App;
