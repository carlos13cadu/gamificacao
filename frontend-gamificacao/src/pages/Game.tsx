// src/pages/Game.tsx
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext'; // Reutilizando nosso hook elegante!

export function Game() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const handlePlayGame = () => {
    // Aqui você define para onde o botão vai mandar o usuário
    // Se o jogo for externo: window.location.href = "https://link-do-seu-jogo.com";
    // Se for na mesma pasta: window.location.href = "/cybergame/index.html";
    alert("Redirecionando para o Minigame de Cibersegurança...");
  };

  return (
    <div className="section active" style={{ 
      background: 'var(--background)', // Assumindo que seu tema tem variaveis globais
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      
      {/* HEADER TECH */}
      <div style={{ 
        background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)', 
        borderLeft: '4px solid #3b82f6',
        padding: '30px', 
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '2rem', 
              color: '#f8fafc', 
              margin: '0 0 8px 0',
              fontWeight: 800,
              letterSpacing: '-0.5px'
            }}>
              {t('game.title')}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
              {t('game.subtitle')}
            </p>
          </div>
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid #10b981', 
            color: '#10b981', 
            padding: '6px 12px', 
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}>
            {t('game.statusOnline')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* PAINEL ESQUERDO: AÇÃO */}
        <div style={{ 
          flex: '2', 
          minWidth: '300px', 
          background: 'var(--card)', 
          border: '1px solid var(--border)', 
          borderRadius: '8px', 
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '12px' }}>
            {t('game.authTitle')}: <span style={{ color: '#3b82f6' }}>{user?.nome?.toUpperCase()}</span>
          </h2>
          
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', maxWidth: '400px', marginBottom: '30px', lineHeight: '1.5' }}>
            {t('game.description')}
          </p>
          
          <button 
            onClick={handlePlayGame}
            style={{ 
              background: '#3b82f6', 
              color: '#ffffff', 
              border: 'none', 
              padding: '16px 40px', 
              borderRadius: '4px', 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            {t('game.playButton')}
          </button>
        </div>

        {/* PAINEL DIREITO: RANKING PLACEHOLDER */}
        <div style={{ 
          flex: '1', 
          minWidth: '250px', 
          background: 'var(--card)', 
          border: '1px solid var(--border)', 
          borderRadius: '8px', 
          padding: '24px'
        }}>
          <h3 style={{ 
            fontSize: '1rem', 
            color: 'var(--text)', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '12px',
            marginBottom: '16px'
          }}>
            {t('game.rankingTitle')}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Os dados de classificação estarão disponíveis após a primeira simulação.</p>
             {/* Aqui entrará o mapa de .map() dos top jogadores que buscaremos da sua API futuramente */}
          </div>
        </div>

      </div>
    </div>
  );
}