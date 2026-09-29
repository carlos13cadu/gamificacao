// src/components/SynthesisMachine.tsx
import { useTranslation } from 'react-i18next';
import type { Sticker } from './StickerCard';

interface SynthesisMachineProps {
  slotsBase: (Sticker | null)[];
  slotCatalyst: Sticker | null;
  probabilities: { success: number; same: number; jump: number; base: number; buff: number; extraCard: number; targetName: string | null; sameName: string } | null;
  onRemoveBase: (index: number) => void;
  onRemoveCatalyst: () => void;
  onSynthesize: () => void;
}

export function SynthesisMachine({ slotsBase, slotCatalyst, probabilities, onRemoveBase, onRemoveCatalyst, onSynthesize }: SynthesisMachineProps) {
  const { t } = useTranslation();
  const isReady = slotsBase.every((slot) => slot !== null);

  return (
    <div className="sintese-box">
      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', letterSpacing: '0.05em', marginBottom: 5 }}>
        {t('album.synthesisTitle', '🧬 Máquina de Síntese 2026')}
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
        {t('album.synthesisDesc', 'Destrua 3 figurinhas repetidas. 1 Cópia é intocável e sempre fica salva no álbum!')}
      </p>

      <div className="sintese-layout">
        <div></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--border)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Base Normal</div>
          <div className="sintese-slots" style={{ margin: 0 }}>
            {slotsBase.map((slot, index) => (
              slot ? (
                <div key={index} className="sintese-slot filled" style={{ borderColor: slot.color || '#9ca3af', boxShadow: slot.color ? `0 0 10px ${slot.color}80` : 'none' }} onClick={() => onRemoveBase(index)}>
                  <img src={slot.image || `https://flagcdn.com/w160/${slot.code}.png`} alt={slot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div key={index} className="sintese-slot" title={t('album.synthesisEmptyTip', 'Clique em uma figurinha repetida')}>+</div>
              )
            ))}
          </div>
        </div>

        <div className="cat-container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, textShadow: '0 0 5px rgba(6,182,212,0.4)' }}>Catalisador</div>
            <div className="sintese-slots" style={{ margin: 0 }}>
              {slotCatalyst ? (
                 <div className="sintese-slot filled" style={{ borderColor: '#06b6d4', boxShadow: '0 0 12px rgba(6,182,212,0.6)' }} onClick={onRemoveCatalyst}>
                   <img src={slotCatalyst.image || `https://flagcdn.com/w160/${slotCatalyst.code}.png`} alt={slotCatalyst.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 </div>
              ) : (
                 <div className="sintese-slot" style={{ borderColor: '#06b6d4', color: '#06b6d4', borderStyle: 'dashed', cursor: 'pointer' }}>+</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', textAlign: 'center', background: 'rgba(0,0,0,0.25)', padding: 15, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
        {isReady && probabilities ? (
          <div style={{ textAlign: 'left' }}>
            <h4 style={{ color: 'var(--gold)', marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', textTransform: 'uppercase', textAlign: 'center', marginTop: 0 }}>
              📊 Previsão da Síntese
            </h4>

            {probabilities.success > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 4 }}>
                <span>{probabilities.success >= 100 ? 'Evolução Garantida' : 'Chance de Evolução'} ({probabilities.targetName}):</span>
                <b style={{ color: 'var(--gold)' }}>{probabilities.success >= 100 ? '100%' : `${probabilities.success}%`}</b>
              </div>
            )}

            {probabilities.same > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 4 }}>
                <span>{probabilities.same >= 100 ? 'Figurinha Garantida' : 'Chance de'} {probabilities.sameName}:</span>
                <b style={{ color: 'rgba(255,255,255,0.7)' }}>{probabilities.same}%</b>
              </div>
            )}

            {probabilities.extraCard > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 4 }}>
                <span>Chance de +1 Bônus:</span>
                <b style={{ color: '#10b981' }}>{probabilities.extraCard}%</b>
              </div>
            )}

            {probabilities.jump > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: 6, paddingTop: 6, borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                <span style={{ color: '#c084fc' }}>Drop Místico (Secreta):</span>
                <b style={{ color: '#c084fc', textShadow: '0 0 5px #c084fc' }}>{probabilities.jump}%</b>
              </div>
            )}

            {probabilities.buff > 0 && (
              <div style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid #4ade80', color: '#4ade80', fontSize: '0.8rem', padding: 6, borderRadius: 4, marginTop: 8, fontWeight: 'bold', textAlign: 'center' }}>
                ✨ Buff do Catalisador Ativo! (+{probabilities.buff}%)
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>
            Insira as 3 figurinhas base para visualizar as probabilidades...
          </p>
        )}
      </div>

      <button className={`sintese-btn ${isReady ? 'ready' : ''}`} style={{ marginTop: 20 }} onClick={onSynthesize} disabled={!isReady}>
        {t('album.synthesisBtn', 'Fundir Figurinhas')}
      </button>
    </div>
  );
}