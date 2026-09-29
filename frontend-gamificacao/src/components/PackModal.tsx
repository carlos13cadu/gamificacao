import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
// Se a interface Sticker estiver em outro arquivo, ajuste o import
// import type { Sticker } from './StickerCard'; 

// Adicionei isso aqui só como referência, use a sua interface original
export interface Sticker {
  id: string;
  name: string;
  image?: string;
  code?: string;
  isRare?: boolean;
}

interface PackModalProps {
  isOpen: boolean;
  onClose: () => void;
  revealedStickers: Sticker[];
}

export function PackModal({ isOpen, onClose, revealedStickers }: PackModalProps) {
  const [phase, setPhase] = useState<'idle' | 'tearing' | 'revealed'>('idle');

  useEffect(() => {
    if (isOpen) {
      setPhase('idle');
      
      const tearTimer = setTimeout(() => {
        setPhase('tearing');
      }, 900);

      const revealTimer = setTimeout(() => {
        setPhase('revealed');
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, zIndex: 10000 });
      }, 1600);

      return () => {
        clearTimeout(tearTimer);
        clearTimeout(revealTimer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-box">
        
        {phase !== 'revealed' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', position: 'relative', width: 140, height: 180, margin: '0 auto' }}>
              <svg viewBox="0 0 140 180" width="140" height="180" style={{ overflow: 'visible' }}>
                {/* Metade de Baixo */}
                <g className={phase === 'tearing' ? 'pack-bottom-tearing' : ''}>
                  <rect x="15" y="90" width="110" height="80" rx="8" fill="#1a6b2e" stroke="#fde047" strokeWidth="2.5"/>
                  <rect x="15" y="105" width="110" height="3" fill="#fde047" opacity="0.4"/>
                  <text x="70" y="140" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif" fontSize="13" fontWeight="700" fill="#fde047">FIGURINHAS</text>
                  <text x="70" y="158" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif" fontSize="10" fill="rgba(253,224,71,0.7)">COPA 2026</text>
                </g>
                
                {/* Metade de Cima */}
                <g className={phase === 'tearing' ? 'pack-top-tearing' : ''} style={{ transformOrigin: '70px 90px' }}>
                  <rect x="15" y="10" width="110" height="82" rx="8" fill="#15592a" stroke="#fde047" strokeWidth="2.5"/>
                  <rect x="15" y="10" width="110" height="30" rx="8" fill="#0d3d1c"/>
                  <rect x="15" y="28" width="110" height="12" fill="#0d3d1c"/>
                  <text x="70" y="30" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif" fontSize="11" fontWeight="700" fill="#fde047">⚽ ÁLBUM</text>
                  <polyline points="15,88 28,83 41,91 54,84 67,90 80,83 93,89 106,83 125,90" fill="none" stroke="#fde047" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6"/>
                </g>
                
                {/* Confetes do rasgo do papel */}
                <g opacity="0" className={phase === 'tearing' ? 'pack-sparkles-tearing' : ''}>
                  <circle cx="70" cy="90" r="3" fill="#fde047"/>
                  <circle cx="50" cy="80" r="2" fill="#fff"/>
                  <circle cx="90" cy="85" r="2" fill="#fde047"/>
                  <circle cx="35" cy="95" r="1.5" fill="#fff"/>
                  <circle cx="105" cy="92" r="1.5" fill="#fde047"/>
                </g>
              </svg>
            </div>
            <h2 style={{ color: 'white', fontFamily: "'Barlow Condensed'", fontSize: '1.5rem', marginTop: 16, letterSpacing: '0.05em' }}>
              Abrindo...
            </h2>
          </div>
        )}

        {phase === 'revealed' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--gold)', fontFamily: "'Barlow Condensed'", fontSize: '2rem', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Novas Figurinhas!
            </h2>
            
            <div className="cards-revealed">
              {revealedStickers.map((fig, index) => (
                <div 
                  key={index} 
                  className={`revealed-card ${fig.isRare ? 'rara' : ''}`}
                  style={{ animationDelay: `${index * 0.15}s` }} 
                >
                  {/* Removemos o estilo inline para que o seu CSS original controle o tamanho! */}
                  <img 
                    src={fig.image || `https://flagcdn.com/w160/${fig.code}.png`} 
                    alt={fig.name} 
                  />
                  <div className="name">{fig.name}</div>
                </div>
              ))}
            </div>
            
            <button 
              className="sintese-btn ready" 
              style={{ marginTop: 30 }} 
              onClick={onClose}
            >
              Continuar
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}