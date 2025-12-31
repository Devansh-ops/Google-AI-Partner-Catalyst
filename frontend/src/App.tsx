import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import styles from './index.css?inline';
import toastStyles from 'react-toastify/dist/ReactToastify.css?inline';
import { useThrottle } from './hooks/useThrottle';
import { useDomEvent } from './hooks/useDomEvent';

import type { SessionState, Hint, Settings } from './types';
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
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
    const defaults: Settings = {
      chatModeEnabled: true,
      throttleDuration: 60000, // 1 minute default
      elevenLabsTTSEnabled: false,
      tone: 'Supportive',
      experienceLevel: 'Beginner'
    };

    try {
      console.log('description: ', description);
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
  const latestCodeRef = useRef<string>("");
  const sessionIdRef = useRef<string | null>(null);

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

    if (detail.code !== undefined) {
      latestCodeRef.current = detail.code || "";
    }

    // Send to WebSocket if verified
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      let payload: any = {
        ...detail,
        tone: settings.tone || 'Supportive',
        experience_level: settings.experienceLevel || 'Beginner'
      };

      if (sessionIdRef.current) {
        payload.session_id = sessionIdRef.current;
      }

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
  useDomEvent<GenericLeetCodeEvent>('GIVE_UP', handleExtensionEvent, window);
  useDomEvent<GenericLeetCodeEvent>('PROBLEM_UPDATED', handleExtensionEvent, window);

  // Initial request for problem details
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('GET_PROBLEM_DETAILS'));
    window.dispatchEvent(new CustomEvent('GET_CODE'));
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
    sessionIdRef.current = sessionId;


    // Connect to WebSocket
    const ws = new WebSocket(`wss://leetcodementor.devanshsehgal.com/ws/${sessionId}`);

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
          setHints(prev => {
            // Only remove hint loading state
            const clean = prev.filter(h => !h.id.startsWith('loading-hint-'));
            return [...clean, {
              id: 'hint-' + Date.now(),
              text: data.hint,
              type: 'warning',
              timestamp: Date.now()
            }];
          });
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
    sessionIdRef.current = null;
    latestCodeRef.current = "";
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
        session_id: sessionIdRef.current,
        problem_title: question,
        problem_description: description,
        code: latestCodeRef.current,
        tone: settings.tone || 'Supportive',
        experience_level: settings.experienceLevel || 'Beginner'
      };

      console.log('Sending HINT_REQUEST to WS', payload);
      wsRef.current.send(JSON.stringify(payload));

      // Add loading state
      setHints(prev => [...prev, {
        id: 'loading-hint-' + Date.now(),
        text: "",
        type: 'loading',
        timestamp: Date.now()
      }]);
    } else {
      toast.error("Not connected to session");
    }
  };

  const { throttledCallback: throttledRequestHint, isThrottled: isHintThrottled } = useThrottle(handleRequestHint, settings.throttleDuration);


  const thread = useStream<{ messages: Message[] }>({
    // The URL where 'langgraph dev' is running
    apiUrl: "http://localhost:2024",
    // The key in your langgraph.json
    assistantId: "agent",
    // The state key where messages are stored
    messagesKey: "messages",
  });



  // Sync LangGraph messages to hints
  useEffect(() => {
    setHints(prev => {
      let next = [...prev];
      let changed = false;

      // Sync messages
      if (thread.messages) {
        for (const [index, msg] of thread.messages.entries()) {
          // Ensure ID - use index as fallback for stability during streaming
          const msgId = msg.id || `msg-idx-${index}`;

          let content = "";
          if (typeof msg.content === 'string') {
            content = msg.content;
          } else if (Array.isArray(msg.content)) {
            content = msg.content
              .map((c: any) => {
                if (typeof c === 'string') return c;
                if (c && c.type === 'text') return c.text || '';
                return '';
              })
              .filter(Boolean)
              .join('\n');
          } else {
            content = JSON.stringify(msg.content);
          }

          // Strip context if present
          const queryMarker = "User Query:";
          if (content.includes("Context Information:") && content.includes(queryMarker)) {
            const parts = content.split(queryMarker);
            if (parts.length > 1) {
              content = parts[parts.length - 1].trim();
            }
          }

          const existingIdx = next.findIndex(h => h.id === msgId);
          const type = msg.type === 'human' ? 'user' : 'info';

          if (existingIdx !== -1) {
            if (next[existingIdx].text !== content) {
              next[existingIdx] = { ...next[existingIdx], text: content };
              changed = true;
            }
          } else {
            // Deduplicate optimistic messages
            let handled = false;
            if (type === 'user') {
              // Check for optimistic message with same text
              const optimisticIdx = next.findIndex(h => h.type === 'user' && h.text === content && h.id.startsWith('user-msg-'));
              if (optimisticIdx !== -1) {
                next[optimisticIdx] = { ...next[optimisticIdx], id: msgId, text: content };
                changed = true;
                handled = true;
              }
            }

            if (!handled) {
              next.push({
                id: msgId,
                text: content,
                type: type,
                timestamp: Date.now()
              });
              changed = true;
            }
          }
        }
      }

      // Sync Loading
      const hasChatLoading = next.some(h => h.id === 'loading-state');

      if (thread.isLoading && !hasChatLoading) {
        next.push({ id: 'loading-state', text: '', type: 'loading', timestamp: Date.now() });
        changed = true;
      } else if (!thread.isLoading && hasChatLoading) {
        // Only remove the chat loading state
        next = next.filter(h => h.id !== 'loading-state');
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [thread.messages, thread.isLoading]);

  const handleSendMessage = (message: string) => {
    setHints(prev => [...prev, {
      id: 'user-msg-' + Date.now(),
      text: message,
      type: 'user',
      timestamp: Date.now()
    }]);

    // Prepare Context
    const currentCode = latestCodeRef.current;

    // Filter hints to provide useful context (exclude loading states)
    const historyText = hints
      .filter(h => h.type !== 'loading')
      .map(h => `[${h.type.toUpperCase()}] ${h.text}`)
      .join('\n');

    const fullContent = `
Context Information:
Problem: ${question}
Description: ${description}
Tone: ${settings.tone}
Experience Level: ${settings.experienceLevel}

Current Code:
${currentCode}

Session History (including previous hints):
${historyText}

User Query: ${message}
`;

    // Submit to the graph
    thread.submit({
      messages: [{ type: "human", content: fullContent }]
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
                      canEnterChat={settings.chatModeEnabled && hints.length >= 0}
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
