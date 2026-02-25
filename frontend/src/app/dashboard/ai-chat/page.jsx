'use client';

import { useState, useRef, useEffect } from 'react';

const SUGGESTED_PROMPTS = [
  { label: 'Phân tích danh mục', prompt: 'Hãy phân tích danh mục đầu tư của tôi và đề xuất chiến lược tái cơ cấu.' },
  { label: 'Xu hướng thị trường', prompt: 'Xu hướng thị trường chứng khoán Việt Nam trong quý này là gì?' },
  { label: 'Cổ phiếu tiềm năng', prompt: 'Gợi ý 5 cổ phiếu tiềm năng trên HOSE cho nhà đầu tư dài hạn.' },
  { label: 'Phân tích rủi ro', prompt: 'Làm thế nào để đánh giá và quản lý rủi ro khi đầu tư chứng khoán?' },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function timeAgo(date) {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function AiChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { id: generateId(), role: 'user', content: trimmed, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const assistantId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date() },
    ]);

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error('API error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.delta?.text ?? parsed.choices?.[0]?.delta?.content ?? '';
              full += delta;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
              );
            } catch {
              // non-JSON line, skip
            }
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.' }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '24px 24px 16px',
        }}
      >
        {messages.length === 0 ? (
          /* Empty state — suggested prompts */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--gold-subtle)', border: '1px solid var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>
                🤖
              </div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Hỏi tôi về thị trường chứng khoán
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Phân tích cổ phiếu, xu hướng, chiến lược đầu tư...
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', width: '100%', maxWidth: '560px' }}>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.prompt)}
                  style={{
                    padding: '14px 16px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gold-dim)';
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--bg-border)';
                    e.currentTarget.style.background = 'var(--bg-surface)';
                  }}
                >
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', marginBottom: '4px' }}>
                    {p.label}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                    {p.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '10px',
                alignItems: 'flex-end',
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--gold-subtle)', border: '1px solid var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                  🤖
                </div>
              )}

              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? 'var(--gold-dim)' : 'var(--bg-elevated)',
                  border: `1px solid ${msg.role === 'user' ? 'var(--gold)' : 'var(--bg-border)'}`,
                }}
              >
                {msg.role === 'assistant' && msg.content === '' ? (
                  <div style={{ display: 'flex', gap: '5px', padding: '4px 0' }}>
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <span
                        key={i}
                        style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          background: 'var(--gold)', display: 'inline-block',
                          animation: `pulse-dot 1.2s ease-in-out ${delay}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--text-primary)' }}>
                    {msg.content}
                  </p>
                )}
                <span className="font-mono" style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {timeAgo(msg.createdAt)}
                </span>
              </div>

              {msg.role === 'user' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                  👤
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ flexShrink: 0, padding: '0 24px 16px', borderTop: '1px solid var(--bg-border)', paddingTop: '16px', background: 'var(--bg-base)' }}>
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '10px',
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi về cổ phiếu, thị trường, chiến lược đầu tư..."
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            lineHeight: 1.6,
            maxHeight: '160px',
            overflow: 'auto',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            border: 'none',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            background: input.trim() && !loading ? 'var(--gold)' : 'var(--bg-elevated)',
            color: input.trim() && !loading ? 'var(--bg-base)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          {loading ? '⟳' : '↑'}
        </button>
      </div>

      <p className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
        Enter để gửi · Shift+Enter xuống dòng
      </p>
      </div>

      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
