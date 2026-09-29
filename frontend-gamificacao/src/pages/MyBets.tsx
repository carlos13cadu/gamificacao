// src/pages/MyBets.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Simulando o modelo de dados que o Backend C# vai retornar
interface BetResult {
  matchId: number | string;
  home: string;
  away: string;
  date: string;
  group: string;
  guessHome: number | null;
  guessAway: number | null;
  guessMethod?: string;
  realHome: number | null;
  realAway: number | null;
  realMethod?: string;
  pointsEarned: number;
  pointsType: 10 | 5 | 3 | 0 | 'method_only' | 'pending';
}

export function MyBets() {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState('João Silva');
  const [selectedPhase, setSelectedPhase] = useState('grupos');
  const [bets, setBets] = useState<BetResult[]>([]);

  // MOCK: Usuários falsos para testar o dropdown
  const mockUsers = ['João Silva', 'Maria Souza', 'Carlos Admin'];

  // MOCK: Simulando a busca na API baseada no usuário e fase selecionados
  useEffect(() => {
    // Isso será substituído por: const data = await api.matches.getUserBets(selectedUser, selectedPhase);
    const mockData: BetResult[] = [
      {
        matchId: 1, home: 'Brasil 🇧🇷', away: 'Sérvia', date: '13/06/2026', group: 'Grupo C',
        guessHome: 2, guessAway: 0, realHome: 2, realAway: 0, pointsEarned: 10, pointsType: 10
      },
      {
        matchId: 2, home: 'França', away: 'Senegal', date: '16/06/2026', group: 'Grupo I',
        guessHome: 3, guessAway: 1, realHome: 2, realAway: 0, pointsEarned: 5, pointsType: 5
      },
      {
        matchId: 3, home: 'Espanha', away: 'Uruguai', date: '21/06/2026', group: 'Grupo H',
        guessHome: 2, guessAway: 1, realHome: 1, realAway: 0, pointsEarned: 3, pointsType: 3
      },
      {
        matchId: '16A_1', home: 'Alemanha', away: 'México', date: '28/06/2026', group: '16 Avos',
        guessHome: 1, guessAway: 1, guessMethod: 'penaltis', realHome: null, realAway: null, pointsEarned: 0, pointsType: 'pending'
      }
    ];

    // Simula que a Maria não palpitou nada
    if (selectedUser === 'Maria Souza') setBets([]);
    else setBets(mockData);

  }, [selectedUser, selectedPhase]);

  // Calcula o total de pontos apenas dessa etapa
  const totalPoints = bets.reduce((acc, bet) => acc + (bet.pointsEarned || 0), 0);

  // Renderiza as cores e o fundo das Badges baseado no tipo de acerto do legado
  const getBadgeStyle = (type: BetResult['pointsType']) => {
    switch (type) {
      case 10: return { color: 'var(--pts10)', bg: 'rgba(22, 163, 74, 0.15)' }; // Verde
      case 5: return { color: 'var(--pts5)', bg: 'rgba(37, 99, 235, 0.15)' }; // Azul
      case 3: return { color: 'var(--pts3)', bg: 'rgba(217, 119, 6, 0.15)' }; // Laranja
      case 'method_only': return { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' }; // Roxo
      default: return { color: 'var(--muted)', bg: 'transparent' };
    }
  };

  return (
    <div className="section active">
      <div className="sec-title">{t('myBets.title')}</div>
      
      <div className="card">
        {/* --- CABEÇALHO COM FILTROS --- */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div className="user-select-wrap" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <label>{t('myBets.viewUser')}</label>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              <option value="">{t('myBets.selectUser')}</option>
              {mockUsers.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          
          <div className="user-select-wrap" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
            <label>{t('myBets.filterPhase')}</label>
            <select value={selectedPhase} onChange={e => setSelectedPhase(e.target.value)}>
              {Object.keys(t('myBets.phases', { returnObjects: true }) as any).map(key => (
                <option key={key} value={key}>{t(`myBets.phases.${key}`)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- BANNER DE TOTAL DE PONTOS --- */}
        {bets.length > 0 && (
          <div style={{ background: 'var(--pitch)', color: 'var(--gold)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 900, padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', textAlign: 'center' }}>
            {t('myBets.totalPoints', { total: totalPoints })}
          </div>
        )}

        {/* --- LISTA DE PALPITES --- */}
        <div id="my-palpites-list">
          {bets.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '10px' }}>
              {t('myBets.noBets')}
            </p>
          ) : (
            bets.map((bet, idx) => {
              const hasP = bet.guessHome !== null;
              const hasR = bet.realHome !== null;
              const style = getBadgeStyle(bet.pointsType);
              
              // Se tiver método (Pênaltis, Prorrogação), mostra a tag azul
              const methodHtml = bet.guessMethod ? (
                <span style={{ fontSize: '0.7rem', background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>
                  {t(`myBets.methods.${bet.guessMethod}`)}
                </span>
              ) : null;

              return (
                <div className="my-result" key={idx}>
                  <div className="match-info">
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {bet.home} × {bet.away} {methodHtml}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {bet.date} · {bet.group}
                    </div>
                  </div>
                  
                  <div className="my-guess">
                    {hasP ? `${bet.guessHome}–${bet.guessAway}` : '—'}
                  </div>
                  
                  {hasR && (
                    <div className="real-score" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {t('myBets.realScore')} {bet.realHome}–{bet.realAway}
                    </div>
                  )}
                  
                  {bet.pointsType !== 'pending' && hasR && (
                    <span className="pts-badge" style={{ background: style.bg, color: style.color }}>
                      {bet.pointsEarned > 0 ? `+${bet.pointsEarned}pts` : '0 pts'}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}