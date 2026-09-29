// src/pages/Ranking.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface RankingEntry {
  id: string | number;
  nome: string;
  regiao: string;
  pontuacao: number;
  avatarUrl?: string;
}

export function Ranking() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isLoading, setIsLoading] = useState(true);

  const regions = [
    { id: 'ALL', label: t('ranking.regions.all', 'Todas as Regiões') },
    { id: 'BR', label: t('ranking.regions.br', 'Brasil') },
    { id: 'EU', label: t('ranking.regions.eu', 'Europa') },
    { id: 'ASIA', label: t('ranking.regions.asia', 'Ásia') }
  ];

  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true);
      try {
        // 🚀 FUTURA INTEGRAÇÃO COM A API:
        // const token = localStorage.getItem('bolao_token');
        // A API real provavelmente receberá a busca e a região por Query Params
        // const res = await fetch(`http://localhost:5000/api/v1/ranking?regiao=${regionFilter}&busca=${searchTerm}`, ...);
        
        // 🛠️ MOCK DE DADOS
        const mockData: RankingEntry[] = [
          { id: 'admin', nome: 'Admin System', regiao: 'BR', pontuacao: 12500 },
          { id: 2, nome: 'Carlos Eduardo', regiao: 'BR', pontuacao: 9850 },
          { id: 3, nome: 'Marie Dubois', regiao: 'EU', pontuacao: 8400 },
          { id: 4, nome: 'Chen Wei', regiao: 'ASIA', pontuacao: 7100 },
          { id: 5, nome: 'João Silva', regiao: 'BR', pontuacao: 6500 },
          { id: 1, nome: 'teste', regiao: 'BR', pontuacao: 5400 },
        ];

        // 🚀 Filtro duplo: Verifica a Região E o Nome digitado
        const filtered = mockData.filter(e => {
          const passRegion = regionFilter === 'ALL' || e.regiao === regionFilter;
          const passName = e.nome.toLowerCase().includes(searchTerm.toLowerCase());
          return passRegion && passName;
        });
          
        setEntries(filtered.sort((a, b) => b.pontuacao - a.pontuacao));
      } catch (error) {
        console.error("Erro ao buscar ranking:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 300); 
      }
    };

    // Note que adicionamos o searchTerm nas dependências para refiltrar ao digitar!
    fetchRanking();
  }, [regionFilter, searchTerm]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* CABEÇALHO DO RANKING */}
      <div style={{ 
        background: '#6B1F7C', // Roxo Aperam
        borderRadius: '8px', 
        padding: '30px', 
        color: '#fff',
        boxShadow: '0 4px 15px rgba(107, 31, 124, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 5px 0', fontSize: '1.8rem', fontWeight: 800 }}>
            {t('ranking.title', 'Classificação Global')}
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
            {t('ranking.subtitle', 'Desempenho no Simulador de Cibersegurança')}
          </p>
        </div>

        {/* 🚀 BARRA DE FERRAMENTAS (Pesquisa + Filtro) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          
          {/* BARRA DE PESQUISA */}
          <div style={{ 
            flex: '1', 
            minWidth: '220px', 
            display: 'flex', 
            alignItems: 'center', 
            background: '#fff', 
            borderRadius: '6px', 
            padding: '0 12px',
            border: '2px solid transparent',
            transition: 'border 0.2s',
            // Um truque de CSS inline para simular o foco (outline)
            outline: 'none'
          }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6B1F7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder={t('ranking.searchPlaceholder', 'Buscar colaborador...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                border: 'none', 
                padding: '10px 10px', 
                width: '100%', 
                outline: 'none', 
                color: '#1f2937', 
                background: 'transparent',
                fontSize: '0.95rem',
                fontWeight: 600
              }}
            />
          </div>

          {/* FILTRO DE REGIÃO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('ranking.filterLabel', 'Região:')}</label>
            <select 
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '9px 16px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                fontSize: '0.95rem'
              }}
            >
              {regions.map(r => (
                <option key={r.id} value={r.id} style={{ color: '#6B1F7C' }}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* LISTA DO RANKING */}
      <div style={{ background: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)', padding: '20px', minHeight: '400px' }}>
        
        {/* Cabeçalho das Colunas */}
        <div style={{ display: 'flex', padding: '0 16px 12px 16px', borderBottom: '2px solid var(--border)', marginBottom: '12px', color: 'var(--muted)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>
          <div style={{ width: '60px', textAlign: 'center' }}>{t('ranking.columns.position', 'Pos')}</div>
          <div style={{ flex: 1 }}>{t('ranking.columns.player', 'Colaborador')}</div>
          <div style={{ width: '120px', textAlign: 'center' }}>{t('ranking.columns.region', 'Região')}</div>
          <div style={{ width: '100px', textAlign: 'right' }}>{t('ranking.columns.score', 'Score')}</div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#6B1F7C', fontWeight: 'bold' }}>
            ⏳ Sincronizando dados...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--muted)' }}>
            {t('ranking.empty', 'Nenhum registro encontrado.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {entries.map((entry, index) => {
              const isCurrentUser = String(entry.id) === String(user?.id);
              const isTop3 = index < 3;
              
              let positionColor = 'var(--muted)';
              if (index === 0) positionColor = '#E05206'; 
              else if (index === 1) positionColor = '#94a3b8'; 
              else if (index === 2) positionColor = '#b45309'; 

              return (
                <div key={entry.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: isCurrentUser ? 'rgba(224, 82, 6, 0.08)' : 'transparent',
                  border: isCurrentUser ? '1px solid #E05206' : '1px solid var(--border)',
                  borderRadius: '6px',
                  transition: 'background 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {isTop3 && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: positionColor }} />
                  )}

                  <div style={{ width: '60px', textAlign: 'center', fontWeight: 900, fontSize: '1.1rem', color: positionColor }}>
                    #{index + 1}
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6B1F7C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {entry.nome.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: isCurrentUser ? 800 : 600, color: isCurrentUser ? '#E05206' : 'var(--text)' }}>
                      {entry.nome} {isCurrentUser && '(Você)'}
                    </span>
                  </div>

                  <div style={{ width: '120px', textAlign: 'center' }}>
                    <span style={{ background: 'var(--surface)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>
                      {regions.find(r => r.id === entry.regiao)?.label || entry.regiao}
                    </span>
                  </div>

                  <div style={{ width: '100px', textAlign: 'right', fontWeight: 800, color: '#6B1F7C', fontFamily: "'Inter', monospace" }}>
                    {entry.pontuacao.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}