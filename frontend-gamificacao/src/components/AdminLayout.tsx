// src/components/AdminLayout.tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Proteção extra: se não for ADMIN, manda de volta pro site normal
  if (user?.role !== 'ADMIN') {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Acesso Negado</h2>
        <p>Você não tem permissão para acessar esta área.</p>
        <button className="btn-save" style={{ width: 'auto' }} onClick={() => navigate('/')}>Voltar</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      
      {/* SIDEBAR (Menu Lateral) */}
      <aside style={{ width: '260px', background: '#1e293b', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', color: '#38bdf8', margin: 0, textTransform: 'uppercase' }}>
            ⚙️ Painel Admin
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '5px 0 0 0' }}>Gestão Global da Plataforma</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', padding: '15px 10px', gap: '8px', flex: 1 }}>
          <NavLink 
            to="/admin/temas" 
            style={({ isActive }) => ({
              padding: '10px 15px', borderRadius: '8px', textDecoration: 'none',
              color: isActive ? '#fff' : '#cbd5e1',
              background: isActive ? '#3b82f6' : 'transparent',
              fontWeight: isActive ? 'bold' : 'normal',
              transition: 'background 0.2s'
            })}
          >
            🎨 Temas e Cores
          </NavLink>
          
          <NavLink 
            to="/admin/loja" 
            style={({ isActive }) => ({
              padding: '10px 15px', borderRadius: '8px', textDecoration: 'none',
              color: isActive ? '#fff' : '#cbd5e1',
              background: isActive ? '#3b82f6' : 'transparent',
              fontWeight: isActive ? 'bold' : 'normal'
            })}
          >
            🛒 Gestão da Loja
          </NavLink>

          <NavLink 
            to="/admin/albuns" 
            style={({ isActive }) => ({
              padding: '10px 15px', borderRadius: '8px', textDecoration: 'none',
              color: isActive ? '#fff' : '#cbd5e1',
              background: isActive ? '#3b82f6' : 'transparent',
              fontWeight: isActive ? 'bold' : 'normal'
            })}
          >
            📚 Fábrica de Álbuns
          </NavLink>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #334155' }}>
          <button 
            onClick={() => navigate('/palpites')} 
            style={{ width: '100%', padding: '10px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px' }}
          >
            Voltar ao Site
          </button>
          <button 
            onClick={logout} 
            style={{ width: '100%', padding: '10px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {/* O <Outlet /> é onde as páginas do admin (como ThemeManager) vão aparecer */}
        <Outlet />
      </main>

    </div>
  );
}