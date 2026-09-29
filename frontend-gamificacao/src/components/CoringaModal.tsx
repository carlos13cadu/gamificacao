// src/components/CoringaModal.tsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Sticker } from './StickerCard';

interface CoringaModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableStickers: Sticker[];
  onConfirm: (targetId: string) => void;
  isExchanging: boolean;
}

export function CoringaModal({ isOpen, onClose, availableStickers, onConfirm, isExchanging }: CoringaModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Garante que a lista esteja sempre em ordem alfabética
  const sortedStickers = [...availableStickers].sort((a, b) => a.name.localeCompare(b.name, 'pt'));
  const selectedSticker = sortedStickers.find(s => s.id === selectedId);

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="modal-box" style={{ background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '28px 24px 24px', maxWidth: 650, width: '100%', position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.22)' }}>
        
        {/* Botão X forçado no canto superior direito */}
        <button 
          className="modal-close" 
          onClick={handleClose} 
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1, padding: '4px' }}
        >
          ✕
        </button>
        
        {/* Título idêntico ao legado */}
        <div className="modal-title" style={{ color: '#a855f7', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🃏</span> USAR CORINGA
        </div>
        
        <p style={{ fontSize: '.9rem', color: 'var(--muted)', marginBottom: 15, marginTop: 0 }}>
          Escolha qualquer figurinha para trocar pelo seu Coringa.
        </p>
        
        <div className="album-grid" style={{ maxHeight: 350, overflowY: 'auto', padding: 10, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
          {sortedStickers.map(sticker => (
            <div 
              key={sticker.id} 
              className={`sticker-card ${sticker.isRare ? 'rara' : ''}`}
              onClick={() => setSelectedId(sticker.id)}
              style={{
                cursor: 'pointer',
                borderColor: selectedId === sticker.id ? '#a855f7' : '',
                boxShadow: selectedId === sticker.id ? '0 0 15px rgba(168, 85, 247, 0.8)' : '',
                transform: selectedId === sticker.id ? 'translateY(-3px)' : '',
                transition: 'all 0.2s'
              }}
            >
              <img src={sticker.image || `https://flagcdn.com/w160/${sticker.code}.png`} alt={sticker.name} className="sticker-img" style={{ objectFit: 'cover' }} />
              <div className="sticker-name">{sticker.name}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
            Figurinha Selecionada: <b style={{ color: '#a855f7', textTransform: 'uppercase' }}>{selectedSticker ? selectedSticker.name : 'Nenhuma'}</b>
          </div>
          
          {/* Botão de confirmar com texto branco */}
          <button 
            className="sintese-btn ready" 
            style={{ 
              background: '#8b5cf6', 
              color: '#ffffff', // Letra branca garantida
              margin: 0, 
              padding: '10px 24px',
              borderRadius: '8px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1.1rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              border: 'none',
              cursor: selectedId && !isExchanging ? 'pointer' : 'not-allowed',
              opacity: selectedId && !isExchanging ? 1 : 0.5 
            }} 
            onClick={() => selectedId && !isExchanging && onConfirm(selectedId)}
            disabled={!selectedId || isExchanging}
          >
            {isExchanging ? 'Trocando...' : 'Efetuar Troca'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}