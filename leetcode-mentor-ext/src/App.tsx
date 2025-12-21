import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import styles from './index.css?inline';
import toastStyles from 'react-toastify/dist/ReactToastify.css?inline';

import type { SessionState, Hint } from './types';
import { Header } from './components/Header';
import { IdleView } from './components/IdleView';
import { StartingView } from './components/StartingView';
import { ActiveView } from './components/ActiveView';
import { ActiveFooter } from './components/ActiveFooter';
import { FloatingTrigger } from './components/FloatingTrigger';
import { LiveToast } from './components/LiveToast';

// Custom Event type
interface ProblemEvent extends CustomEvent {
  detail: { title: string; url: string; description: string };
}

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [hints, setHints] = useState<Hint[]>([]);
  const lastHintIdRef = useRef<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for problem updates from content script
  useEffect(() => {
    const handleProblemUpdate = (e: Event) => {
      const detail = (e as ProblemEvent).detail;
      if (detail) {
        if (detail.title) setQuestion(detail.title);
        if (detail.description) setDescription(detail.description);
      }
    };

    window.addEventListener('PROBLEM_UPDATED', handleProblemUpdate);

    // Initial request for problem details
    window.dispatchEvent(new CustomEvent('GET_PROBLEM_DETAILS'));

    return () => {
      window.removeEventListener('PROBLEM_UPDATED', handleProblemUpdate);
    };
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
                <LiveToast hint={latest} onClose={closeToast} />
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

    // Simulate API call / Kafka Topic Creation
    setTimeout(() => {
      setSessionState('active');
      // Add initial system message
      const initId = 'init-' + Date.now();
      setHints([
        {
          id: initId,
          text: `Session started for: "${question}". Monitoring your code changes...`,
          type: 'info',
          timestamp: Date.now()
        }
      ]);
      lastHintIdRef.current = initId; // Mark as seen so it doesn't toast

      // Simulate an incoming AI hint after a delay
      setTimeout(() => {
        setHints(prev => [...prev, {
          id: 'hint-' + Date.now(),
          text: description
            ? `I see you're working on "${question}". The problem asks to: ${description.substring(0, 100)}... Based on this, consider edge cases.`
            : "Based on the problem description, using a standard sorting algorithm might exceed the time limit. Have you considered optimized approaches?",
          type: 'warning',
          timestamp: Date.now()
        }]);
      }, 5000);
    }, 1500);
  };

  const endSession = () => {
    setSessionState('idle');
    setHints([]);
    // We keep the question populated
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !event.composedPath().includes(containerRef.current)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRequestHint = () => {
    // Determine the type of hint based entirely on simulation for now
    // In a real app, this would query the LLM with the current code state
    setHints(prev => [...prev, {
      id: 'manual-hint-' + Date.now(),
      text: "You requested a hint! Here's a tip: Check if your loop condition covers the last element correctly. Off-by-one errors are common here.",
      type: 'warning',
      timestamp: Date.now()
    }]);
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
              <Header sessionState={sessionState} onClose={() => setIsOpen(false)} />

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
              {sessionState === 'active' && (
                <ActiveFooter onEndSession={endSession} onRequestHint={handleRequestHint} />
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
