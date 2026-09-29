// src/components/MatchCard.tsx
import { useTranslation } from 'react-i18next';

export interface MatchInfo {
  id: string | number;
  date: string;
  time: string;
  group: string;
  home: string;
  away: string;
  isLocked: boolean;
  phase?: string;
  round?: number | null;
}

interface MatchCardProps {
  match: MatchInfo;
  guessHome: string;
  guessAway: string;
  guessMethod?: string;
  showMethodDropdown?: boolean;
  onChangeGuess: (matchId: string | number, type: 'home' | 'away' | 'method', value: string) => void;
}

export function MatchCard({ match, guessHome, guessAway, guessMethod, showMethodDropdown, onChangeGuess }: MatchCardProps) {
  const { t } = useTranslation();

  const chip = match.isLocked 
    ? <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 9px', borderRadius: 12, fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase' }}>Fechado</span>
    : <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 9px', borderRadius: 12, fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase' }}>Aberto</span>;

  return (
    <div className={`match-card ${match.isLocked ? 'match-urgency' : ''}`} style={match.isLocked ? { borderColor: '#f97316' } : {}}>
      <div className="match-header" style={match.isLocked ? { background: '#9a3412' } : {}}>
        <span>{match.date} · {match.time} · {match.group}</span>
        {chip}
      </div>
      
      <div className="match-body">
        {/* Coluna 1: Time Casa */}
        <div className="team-name">{match.home}</div>
        
        {/* Coluna 2: Caixas de Gols */}
        <div className="score-inputs">
          <input 
            type="number" 
            min="0" max="20" 
            placeholder="–" 
            value={guessHome}
            onChange={(e) => onChangeGuess(match.id, 'home', e.target.value)}
            disabled={match.isLocked}
          />
          <span className="score-vs">✕</span>
          <input 
            type="number" 
            min="0" max="20" 
            placeholder="–" 
            value={guessAway}
            onChange={(e) => onChangeGuess(match.id, 'away', e.target.value)}
            disabled={match.isLocked}
          />
        </div>

        {/* Coluna 3: Time Fora */}
        <div className="team-name">{match.away}</div>
        
        {/* Coluna 4: O Display de Pontos */}
        <div className="pts-display" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {match.isLocked ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Real:<br/><b>0–0</b>
            </span>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>-- pts</span>
          )}
        </div>
      </div>

      {/* LINHA DO MÉTODO DE DECISÃO (Exibida apenas no Mata-Mata a partir das Quartas) */}
      {showMethodDropdown && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: '8px', borderTop: '1px dashed var(--border)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 'bold', margin: 0, whiteSpace: 'nowrap' }}>
              {t('palpites.methodLabel', '⚽ Método de Decisão (+ Pontos):')}
            </label>
            <select 
              value={guessMethod || ''} 
              onChange={(e) => onChangeGuess(match.id, 'method', e.target.value)}
              disabled={match.isLocked}
              style={{ fontSize: '0.75rem', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', cursor: match.isLocked ? 'not-allowed' : 'pointer', width: 'auto' }}
            >
              <option value="">-- Ignorar --</option>
              <option value="normal">{t('palpites.methodNormal', 'Tempo Normal (90m)')}</option>
              <option value="prorrogacao">{t('palpites.methodExtra', 'Prorrogação (120m)')}</option>
              <option value="penaltis">{t('palpites.methodPenalties', 'Disputa de Pênaltis')}</option>
            </select>
          </div>
          
          <div style={{ flex: 1 }}></div>
          
          <div style={{ minWidth: '58px', textAlign: 'center' }}>
            {/* Espaço reservado para o "Gabarito Oficial" que o backend enviará depois */}
          </div>
        </div>
      )}
    </div>
  );
}