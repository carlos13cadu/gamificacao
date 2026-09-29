// src/components/ChatWidget.tsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

interface ChatMessage {
  time: string;
  user: string;
  msg: string;
}

export function ChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // MOCK: Simulando o usuário logado
  const loggedUser = 'João Silva';

  // Busca as mensagens da API
  const fetchMessages = async () => {
    try {
      const res = await api.chat.getMessages();
      if (res.status === 'success') {
        setMessages(res.data);
      }
    } catch (e) {
      console.error("Erro ao carregar chat", e);
    }
  };

  // Liga o radar de 30 segundos apenas quando o chat estiver aberto
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen) {
      fetchMessages();
      interval = setInterval(fetchMessages, 30000);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  // Rola o scroll sempre para a mensagem mais recente
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !loggedUser) return;
    
    const msgText = inputValue.trim();
    setInputValue('');

    // Atualização Otimista: Joga a mensagem na tela antes mesmo da API responder para parecer instantâneo
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages(prev => [...prev, { time: timeStr, user: loggedUser, msg: msgText }]);

    try {
      await api.chat.sendMessage(msgText);
      fetchMessages(); // Sincroniza oficialmente com o servidor
    } catch (e) {
      alert("Erro ao enviar mensagem.");
    }
  };

  return (
    <>
      {/* Botão Flutuante (FAB) */}
      {!isOpen && (
        <div id="chat-fab" onClick={() => setIsOpen(true)}>💬</div>
      )}

      {/* Janela do Chat */}
      <div id="chat-widget" className={isOpen ? 'open' : ''}>
        <div className="chat-header" onClick={() => setIsOpen(false)}>
          <span>{t('chat.title')}</span>
          <span>✕</span>
        </div>
        
        <div className="chat-body" id="chat-box" ref={chatBodyRef}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.8rem', marginTop: '20px' }}>
              {t('chat.empty')}
            </div>
          ) : (
            messages.map((m, i) => (
              <div className="chat-msg" key={i}>
                <span className="time">{m.time}</span>
                <span className="user">{m.user}:</span>
                <span className="text">{m.msg}</span>
              </div>
            ))
          )}
        </div>
        
        <div className="chat-input-area">
          <input 
            type="text" 
            placeholder={t('chat.placeholder')} 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
        </div>
      </div>
    </>
  );
}