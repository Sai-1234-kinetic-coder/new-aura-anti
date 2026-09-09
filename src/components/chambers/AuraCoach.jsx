import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  ShieldAlert, 
  RotateCcw, 
  Flame, 
  Dumbbell, 
  Apple, 
  HeartPulse, 
  Brain, 
  Volume2, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { COACH_MODES, getContextSnapshot, generateCoachResponse } from '../../lib/geminiCoach';
import { audioSynth } from '../../lib/audioSynth';

export default function AuraCoach({ userProfile }) {
  const [selectedMode, setSelectedMode] = useState('fitness');
  const activeModeConfig = COACH_MODES.find(m => m.id === selectedMode) || COACH_MODES[0];

  // Conversation history
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'aura_coach',
      text: `Hello Athlete! I am **AuraCoach**, your context-aware sports scientist and performance mentor.\n\nI have loaded your active biometric profile (BMI, Caloric Targets, Water Intake, and Chess Rating). How can I assist your athletic journey today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState(getContextSnapshot());
  const chatBottomRef = useRef(null);

  // Refresh biometric context on mount
  useEffect(() => {
    setContext(getContextSnapshot());
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend = inputMessage) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    audioSynth.playBeep(true);

    const botMsgId = `b_${Date.now()}`;
    // Add initial placeholder bot message
    setMessages(prev => [
      ...prev,
      {
        id: botMsgId,
        sender: 'aura_coach',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    try {
      await generateCoachResponse(
        userMsg.text,
        selectedMode,
        context,
        (streamedText) => {
          setMessages(prev =>
            prev.map(msg => msg.id === botMsgId ? { ...msg, text: streamedText } : msg)
          );
        }
      );
      audioSynth.playHydrationChime();
    } catch (err) {
      setMessages(prev =>
        prev.map(msg => msg.id === botMsgId ? { ...msg, text: "I encountered a processing issue. Please ask again." } : msg)
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `m_${Date.now()}`,
        sender: 'aura_coach',
        text: `Chat reset. I am ready to guide your training in **${activeModeConfig.label}** mode!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        borderLeft: '4px solid #a855f7',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(168, 85, 247, 0.08))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 18px rgba(168, 85, 247, 0.4)'
          }}>
            <Bot size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                AuraCoach Conversational Assistant
              </h1>
              <span className="badge badge-dept" style={{ fontSize: '10px' }}>Chamber 3</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Context-aware LLM intelligence calibrated to your biometrics, diet protocols, and training goals.
            </p>
          </div>
        </div>

        {/* Live Context Telemetry Pill */}
        <div style={{
          background: '#0b0f19',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <span>BMI: <strong style={{ color: '#10b981' }}>{context.metabolic.bmi || 23.5}</strong></span>
          <span>•</span>
          <span>Target: <strong style={{ color: '#f59e0b' }}>{context.metabolic.targetCalories || 2150} kcal</strong></span>
          <span>•</span>
          <span>Chess: <strong style={{ color: '#38bdf8' }}>{context.chess.elo || 1200}</strong></span>
        </div>
      </div>

      {/* Mode Selector Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
        {COACH_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className="btn"
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-secondary)',
                border: `1px solid ${isSelected ? mode.color : 'var(--border-color)'}`,
                color: isSelected ? mode.color : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {mode.id === 'fitness' && <Dumbbell size={16} />}
              {mode.id === 'nutrition' && <Apple size={16} />}
              {mode.id === 'mindset' && <HeartPulse size={16} />}
              {mode.id === 'chess' && <Brain size={16} />}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: '700' }}>{mode.label}</div>
                <div style={{ fontSize: '10px', opacity: 0.7 }}>{mode.badge}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Chat Window */}
      <div className="glass-card" style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: '520px'
      }}>
        
        {/* Messages Scroll Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingRight: '8px',
          marginBottom: '16px'
        }}>
          {messages.map((msg) => {
            const isBot = msg.sender === 'aura_coach';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  justifyContent: isBot ? 'flex-start' : 'flex-end'
                }}
              >
                {isBot && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}>
                    <Bot size={18} />
                  </div>
                )}

                <div style={{
                  maxWidth: '80%',
                  background: isBot ? '#0b0f19' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: isBot ? 'var(--text-primary)' : '#061c14',
                  padding: '14px 18px',
                  borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  border: isBot ? '1px solid var(--border-color)' : 'none',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text || (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      AuraCoach is synthesizing response...
                    </span>
                  )}
                  <div style={{
                    fontSize: '10px',
                    color: isBot ? 'var(--text-muted)' : 'rgba(6, 28, 20, 0.7)',
                    marginTop: '6px',
                    textAlign: 'right'
                  }}>
                    {msg.timestamp}
                  </div>
                </div>

                {!isBot && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f8fafc',
                    flexShrink: 0
                  }}>
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Starter Prompt Chips */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '10px'
        }}>
          {activeModeConfig.starterPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isTyping}
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                borderRadius: 'var(--radius-full)',
                flexShrink: 0
              }}
            >
              <Sparkles size={12} color="#a855f7" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask AuraCoach about ${activeModeConfig.label.toLowerCase()}...`}
            disabled={isTyping}
            className="form-input"
            style={{ flex: 1, padding: '12px 16px', fontSize: '13px' }}
          />

          <button
            type="submit"
            disabled={isTyping || !inputMessage.trim()}
            className="btn btn-primary"
            style={{ padding: '12px 20px', borderRadius: 'var(--radius-sm)' }}
          >
            <Send size={16} />
            <span>Send</span>
          </button>

          <button
            type="button"
            onClick={handleClearChat}
            className="btn btn-secondary"
            style={{ padding: '12px 14px' }}
            title="Reset conversation"
          >
            <RotateCcw size={16} />
          </button>
        </form>

        {/* Non-Medical Disclaimer Footer */}
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10px',
          color: 'var(--text-muted)'
        }}>
          <ShieldAlert size={12} color="#f59e0b" />
          <span>
            AuraCoach provides educational sports science & wellness insights. It does not provide clinical diagnoses or replace medical professionals.
          </span>
        </div>

      </div>

    </div>
  );
}
