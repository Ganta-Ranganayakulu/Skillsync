import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const WELCOME = {
  role: 'assistant',
  content: "👋 Hi! I'm **SkillBot**, your AI career assistant!\n\nI can help you with:\n• Job search tips & strategies\n• Resume & cover letter advice\n• Interview preparation\n• Understanding your AI match scores\n• Navigating SkillSync features\n\nWhat can I help you with today?"
};

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n•/g, '<br/>•')
    .replace(/\n/g, '<br/>');
}

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setHasNew(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const { data } = await axios.post('/api/chatbot/message', {
        message: trimmed,
        history: history.slice(0, -1)
      });
      const assistantMsg = {
        role: 'assistant',
        content: data.reply,
        ai_powered: data.ai_powered
      };
      setMessages(prev => [...prev, assistantMsg]);
      if (!open) setHasNew(true);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment!"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const quickPrompts = [
    'How does AI matching work?',
    'Tips for my resume?',
    'How to prepare for interviews?',
    'How to improve my match score?'
  ];

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button className={`chatbot-fab ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} aria-label="Open SkillBot">
        {hasNew && !open && <span className="chatbot-badge">1</span>}
        <i className={`fas ${open ? 'fa-times' : 'fa-comment-dots'}`}></i>
      </button>

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-avatar"><i className="fas fa-robot"></i></div>
            <div className="chatbot-header-info">
              <span className="chatbot-name">SkillBot</span>
              <span className="chatbot-status"><span className="status-dot"></span> Online</span>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}><i className="fas fa-times"></i></button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role === 'user' ? 'user' : 'bot'}`}>
                {msg.role === 'assistant' && (
                  <div className="chat-avatar"><i className="fas fa-robot"></i></div>
                )}
                <div className="chat-bubble">
                  <span dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  {msg.ai_powered && (
                    <span className="ai-tag"><i className="fas fa-bolt"></i> AI</span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot">
                <div className="chat-avatar"><i className="fas fa-robot"></i></div>
                <div className="chat-bubble typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts (only shown at start) */}
          {messages.length <= 1 && (
            <div className="chatbot-quickprompts">
              {quickPrompts.map((p, i) => (
                <button key={i} className="quick-prompt-btn" onClick={() => sendMessage(p)}>{p}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask me anything about jobs..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              maxLength={300}
            />
            <button
              className="chatbot-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
