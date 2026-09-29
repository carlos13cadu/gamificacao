// src/components/Layout.tsx
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { ChatWidget } from './ChatWidget';
import { ProfileModal } from './ProfileModal';

// 🚀 Contrato atualizado batendo exatamente com o C#
interface AvatarResponse {
  id: string;
  nome: string;
  imagemUrl: string;
  corBorda: string;
}

export function Layout() {
  const [isDark, setIsDark] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); 

  // Estado inicial vazio
  const [currentAvatar, setCurrentAvatar] = useState<AvatarResponse | null>(null);

  // 🚀 BUSCA O AVATAR SALVO ASSIM QUE O SITE CARREGA
  useEffect(() => {
    if (user) {
      const loadAvatar = async () => {
        try {
          const token = localStorage.getItem('bolao_token');
          const res = await fetch(`http://localhost:5000/api/v1/usuarios/perfil`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // Procura na lista o avatar que o C# disse que é o ativo
            const active = data.avatares.find((a: AvatarResponse) => a.id === data.avatarAtivoId);
            setCurrentAvatar(active || data.avatares[0]); // Se não achar, usa o padrão (Recruta)
          }
        } catch (e) {
          console.error("Erro ao carregar avatar do cabeçalho");
        }
      };
      loadAvatar();
    }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('bolao_dark');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === '1' || (saved === null && prefersDark)) {
      document.body.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleDark = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.body.classList.toggle('dark', nextDark);
    localStorage.setItem('bolao_dark', nextDark ? '1' : '0');
  };

  return (
    <>
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        flexWrap: 'wrap', gap: '15px', padding: '15px 24px', 
        background: 'var(--card)', borderBottom: '3px solid #E05206' 
      }}>
        <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '40px', height: '40px', background: '#6B1F7C', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>A</div>
          <div>
            <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, letterSpacing: '-0.5px', margin: '0 0 2px 0', color: '#6B1F7C', fontSize: '1.6rem' }}>
              {t('header.title', 'Portal de Gamificação')}
            </h1>
            <p style={{ margin: 0, color: 'var(--text)', opacity: 0.7, fontWeight: 600, fontSize: '0.85rem' }}>{t('header.subtitle', 'Aperam')}</p>
          </div>
        </div>
        
        <div className="header-actions-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="custom-select-wrapper">
            <select className="header-lang" onChange={(e) => i18n.changeLanguage(e.target.value)} value={i18n.resolvedLanguage} style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
              <option value="pt">PT-BR</option>
              <option value="en">EN-US</option>
            </select>
          </div>

          <button className="icon-btn" onClick={toggleDark} title="Alternar Tema" style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex' }}>
            {isDark ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>

          {user && (
            <>
              {user.role === 'ADMIN' && (
                <button className="icon-btn" onClick={() => navigate('/admin')} title="Painel Admin" style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
              )}

              {/* 🚀 TAG IMG CORRIGIDA! */}
              <div className="header-avatar-btn" onClick={() => setIsProfileOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--surface)', padding: '4px 12px 4px 4px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <img 
                  src={currentAvatar?.imagemUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=cyber'} 
                  alt="Perfil" 
                  className="header-avatar-img" 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: `2px solid ${currentAvatar?.corBorda || '#94a3b8'}` }}
                />
                <span className="header-username" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>{user.nome}</span>
              </div>

              <button className="icon-btn" onClick={() => { logout(); navigate('/login'); }} title="Desconectar" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </>
          )}
        </div>
      </header>

      <nav style={{ display: 'flex', gap: '20px', padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--card)', overflowX: 'auto' }}>
        <NavLink to="/game" className={({ isActive }) => (isActive ? 'active' : '')} style={({isActive}) => ({ padding: '16px 5px', textDecoration: 'none', color: isActive ? '#6B1F7C' : 'var(--muted)', fontWeight: isActive ? 800 : 600, fontSize: '0.95rem', borderBottom: isActive ? '3px solid #6B1F7C' : '3px solid transparent' })}>{t('nav.game', 'Módulo Cyber')}</NavLink>
        <NavLink to="/ranking" className={({ isActive }) => (isActive ? 'active' : '')} style={({isActive}) => ({ padding: '16px 5px', textDecoration: 'none', color: isActive ? '#6B1F7C' : 'var(--muted)', fontWeight: isActive ? 800 : 600, fontSize: '0.95rem', borderBottom: isActive ? '3px solid #6B1F7C' : '3px solid transparent' })}>{t('nav.ranking', 'Classificação Global')}</NavLink>
        <NavLink to="/album" className={({ isActive }) => (isActive ? 'active' : '')} style={({isActive}) => ({ padding: '16px 5px', textDecoration: 'none', color: isActive ? '#6B1F7C' : 'var(--muted)', fontWeight: isActive ? 800 : 600, fontSize: '0.95rem', borderBottom: isActive ? '3px solid #6B1F7C' : '3px solid transparent' })}>{t('nav.album', 'Coleção (Álbum)')}</NavLink>
        <NavLink to="/loja" className={({ isActive }) => (isActive ? 'active' : '')} style={({isActive}) => ({ padding: '16px 5px', textDecoration: 'none', color: isActive ? '#6B1F7C' : 'var(--muted)', fontWeight: isActive ? 800 : 600, fontSize: '0.95rem', borderBottom: isActive ? '3px solid #6B1F7C' : '3px solid transparent' })}>{t('nav.loja', 'Loja')}</NavLink>
        <NavLink to="/regras" className={({ isActive }) => isActive ? 'active' : ''} style={({isActive}) => ({ padding: '16px 5px', textDecoration: 'none', color: isActive ? '#6B1F7C' : 'var(--muted)', fontWeight: isActive ? 800 : 600, fontSize: '0.95rem', borderBottom: isActive ? '3px solid #6B1F7C' : '3px solid transparent' })}>{t('nav.rules', 'Diretrizes')}</NavLink>
      </nav>

      <div className="page-wrapper" style={{ padding: '24px' }}>
        <Outlet />
      </div>
      <ChatWidget />
      
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        currentAvatar={currentAvatar}
        onSelectAvatar={(av) => setCurrentAvatar(av)}
      />
    </>
  );
}