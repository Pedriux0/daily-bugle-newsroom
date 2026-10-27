import React, { useEffect, useRef, useState } from 'react';
import useJamesonChat from '../../hooks/useJamesonChat';

interface JamesonChatProps {
  onClose: () => void;
}

const STARTERS = [
  'Is Spider-Man a hero?',
  'I have photos of Spider-Man',
  'Can I get a raise, Mr. Jameson?',
];

/** The Bugle tip line: a streamed, in-character conversation with Jameson */
const JamesonChat: React.FC<JamesonChatProps> = ({ onClose }) => {
  const { messages, isStreaming, error, send, hangUp } = useJamesonChat();
  const [draft, setDraft] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    send(draft);
    setDraft('');
  };

  const handleHangUp = () => {
    hangUp();
    onClose();
  };

  return (
    <div className="chat" role="dialog" aria-modal="false" aria-labelledby="chat-title">
      <div className="chat-head">
        <div>
          <h2 id="chat-title">Jameson, on the tip line</h2>
          <p>{isStreaming ? 'Jameson is shouting…' : 'Editor-in-chief, Daily Bugle'}</p>
        </div>
        <button type="button" className="np-button np-button--field" onClick={handleHangUp}>
          Hang up
        </button>
      </div>

      <div className="chat-log" ref={logRef} aria-live="polite">
        {messages.length === 0 && (
          <>
            <p className="chat-msg chat-msg--assistant">
              Daily Bugle, Jameson speaking! Make it quick, I've got a paper to run. What's the tip?
            </p>
            <div className="chat-starters">
              {STARTERS.map((starter) => (
                <button key={starter} type="button" className="chip" onClick={() => send(starter)}>
                  {starter}
                </button>
              ))}
            </div>
          </>
        )}
        {messages.map((message, i) => (
          <p key={i} className={`chat-msg chat-msg--${message.role}`}>
            {message.content}
            {isStreaming && i === messages.length - 1 && message.role === 'assistant' && (
              <span className="caret" aria-hidden="true" />
            )}
          </p>
        ))}
        {error && <p className="notice notice--error">The line went dead: {error}</p>}
      </div>

      <form className="chat-form" onSubmit={submit}>
        <label htmlFor="chat-input" className="visually-hidden">
          Your message to Jameson
        </label>
        <input
          id="chat-input"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tell Jameson what you saw…"
          maxLength={600}
          autoComplete="off"
        />
        <button type="submit" className="np-button" disabled={isStreaming || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default JamesonChat;
