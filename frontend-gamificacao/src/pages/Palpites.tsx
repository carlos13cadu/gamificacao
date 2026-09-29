// src/pages/Palpites.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MatchCard } from '../components/MatchCard';
import type { MatchInfo } from '../components/MatchCard';
import { api } from '../services/api';

export function Palpites() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState('grupos');
  const [round, setRound] = useState(1);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // MOCK: Usuário logado
  const loggedUser = 'João Silva';

  // Busca os jogos e os palpites do usuário ao carregar a tela ou mudar a fase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [matchesRes, guessesRes] = await Promise.all([
          api.matches.getMatches(phase),
          api.matches.getUserGuesses(loggedUser, phase)
        ]);

        if (matchesRes.status === 'success') {
          setMatches(matchesRes.matches);
        }

        if (guessesRes.status === 'success') {
          // Converte o formato do backend { '1': { h: 2, a: 0, m: 'normal' } } para o formato de estado da UI
          const formattedGuesses: Record<string, string> = {};
          Object.entries(guessesRes.guesses).forEach(([matchId, guess]: [string, any]) => {
            if (guess.h !== undefined) formattedGuesses[`${matchId}-home`] = String(guess.h);
            if (guess.a !== undefined) formattedGuesses[`${matchId}-away`] = String(guess.a);
            if (guess.m !== undefined) formattedGuesses[`${matchId}-method`] = guess.m;
          });
          setGuesses(formattedGuesses);
        }
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      }
    };

    loadData();
  }, [phase]);

  const handleGuessChange = (matchId: string | number, type: 'home' | 'away' | 'method', value: string) => {
    setGuesses(prev => ({ ...prev, [`${matchId}-${type}`]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Prepara o payload aninhado para o C#
    const payload: any[] = [];
    
    matches.forEach(m => {
      const h = guesses[`${m.id}-home`];
      const a = guesses[`${m.id}-away`];
      const method = guesses[`${m.id}-method`];
      
      if (h !== undefined && h !== '' && a !== undefined && a !== '') {
        payload.push({ id: m.id, h: parseInt(h, 10), a: parseInt(a, 10), m: method || "" });
      }
    });

    if (payload.length === 0) {
      alert("Nenhum palpite preenchido.");
      setIsSaving(false);
      return;
    }

    try {
      const res = await api.matches.saveGuesses(loggedUser, payload);
      if (res.status === 'success') alert("✅ Palpites salvos no servidor!");
      else alert("❌ Erro ao salvar.");
    } catch (e) {
      alert("❌ Erro de rede.");
    } finally {
      setIsSaving(false);
    }
  };

  // Lógica de Filtros e Agrupamentos
  const filteredMatches = matches.filter(m => phase === 'grupos' ? m.round === round : true);
  
  const groupedMatches = filteredMatches.reduce((groups, match) => {
    const groupName = match.group || 'Fase Final';
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(match);
    return groups;
  }, {} as Record<string, MatchInfo[]>);

  const totalMatches = matches.length;
  const matchesGuessed = matches.filter(m => guesses[`${m.id}-home`] !== undefined && guesses[`${m.id}-away`] !== undefined).length;

  return (
    <div className="section active">
      <div className="sec-title">{t('palpites.title')}</div>

      <div className="score-legend">
        <span className="badge badge-10">{t('palpites.legend10')}</span>
        <span className="badge badge-5">{t('palpites.legend5')}</span>
        <span className="badge badge-3">{t('palpites.legend3')}</span>
      </div>
      
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center', marginBottom: 15, fontWeight: 'bold' }}>
        {t('palpites.bonus')}
      </div>

      <div style={{ background: 'var(--card)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
        
        {/* --- CONTROLES DE ETAPA E ASSIDUIDADE --- */}
        <div className="etapa-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div className="user-select-wrap" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
            <label>{t('palpites.selectPhase')}</label>
            <select value={phase} onChange={(e) => setPhase(e.target.value)}>
              <option value="grupos">{t('palpites.phaseGroups')}</option>
              <option value="16avos">{t('palpites.phase16')}</option>
              <option value="oitavas">{t('palpites.phase8')}</option>
              <option value="quartas">{t('palpites.phase4')}</option>
              <option value="semi_final">{t('palpites.phaseSemi')}</option>
            </select>
          </div>

          {phase === 'grupos' && (
            <div className="user-select-wrap" style={{ flex: 1, minWidth: '120px', marginBottom: 0 }}>
              <label>{t('palpites.roundFilter')}</label>
              <select value={round} onChange={(e) => setRound(parseInt(e.target.value, 10))}>
                <option value={1}>{t('palpites.round1')}</option>
                <option value={2}>{t('palpites.round2')}</option>
                <option value={3}>{t('palpites.round3')}</option>
              </select>
            </div>
          )}
          
          <div style={{ textAlign: 'center', flex: 1, minWidth: '150px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              {t('palpites.perfectAttendance')}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: '1.2rem', fontWeight: 900, color: matchesGuessed === totalMatches && totalMatches > 0 ? '#eab308' : 'var(--green)' }}>
              {matchesGuessed}/{totalMatches} {t('palpites.games')}
            </div>
          </div>
          
          <button className="btn-save-top" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '⏳ Salvando...' : t('palpites.btnSave')}
          </button>
        </div>

        {/* --- LISTA DE JOGOS (AGRUPADA) --- */}
        <div>
          {Object.entries(groupedMatches).map(([groupName, groupMatches]) => (
            <div key={groupName} className="group-container" style={{ background: '#f9fbf9', border: '1px dashed var(--green-mid)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div className="group-title-banner" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 900, color: 'white', background: 'var(--pitch)', display: 'inline-block', padding: '4px 16px', borderRadius: '6px', textTransform: 'uppercase', marginBottom: '14px' }}>
                {groupName}
              </div>
              
              {groupMatches.map(match => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  guessHome={guesses[`${match.id}-home`] || ''}
                  guessAway={guesses[`${match.id}-away`] || ''}
                  guessMethod={guesses[`${match.id}-method`] || ''}
                  onChangeGuess={handleGuessChange}
                  showMethodDropdown={phase !== 'grupos' && phase !== '16avos' && phase !== 'oitavas'} // Exibe dropdown só das quartas em diante
                />
              ))}
            </div>
          ))}

          {filteredMatches.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>Nenhum jogo encontrado para esta seleção.</p>
          )}
        </div>

        <button className="btn-save" onClick={handleSave} disabled={isSaving} style={{ width: '100%', marginTop: '10px' }}>
          {isSaving ? '⏳ Salvando...' : t('palpites.btnSaveFull')}
        </button>
      </div>
    </div>
  );
}