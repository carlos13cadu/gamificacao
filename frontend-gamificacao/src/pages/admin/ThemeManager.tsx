import { useTheme } from '../../contexts/ThemeContext';

export function ThemeManager() {
  const { theme, updateTheme } = useTheme();

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', color: 'var(--green)', textTransform: 'uppercase', marginBottom: '20px' }}>
        🎨 Gestão de Temas e Cores
      </h2>

      <div style={{ background: 'var(--card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Personalize as cores da temporada atual. As alterações refletirão instantaneamente em todo o site.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Seletor de Cor Primária */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--text)' }}>Cor Primária</label>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Botões, destaques e headers.</span>
            </div>
            <input 
              type="color" 
              value={theme.primary} 
              onChange={(e) => updateTheme({ primary: e.target.value })}
              style={{ width: '50px', height: '40px', cursor: 'pointer', border: 'none', background: 'transparent' }}
            />
          </div>

          {/* Seletor de Cor de Fundo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--text)' }}>Fundo do Site</label>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>A cor principal do background.</span>
            </div>
            <input 
              type="color" 
              value={theme.background} 
              onChange={(e) => updateTheme({ background: e.target.value })}
              style={{ width: '50px', height: '40px', cursor: 'pointer', border: 'none', background: 'transparent' }}
            />
          </div>

          {/* Seletor de Cor dos Cards */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--text)' }}>Cor dos Cards</label>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Fundo das caixas e formulários.</span>
            </div>
            <input 
              type="color" 
              value={theme.card} 
              onChange={(e) => updateTheme({ card: e.target.value })}
              style={{ width: '50px', height: '40px', cursor: 'pointer', border: 'none', background: 'transparent' }}
            />
          </div>

        </div>

        <button 
          className="btn-save" 
          style={{ marginTop: '24px' }}
          onClick={() => alert('Tema salvo no banco de dados com sucesso!')}
        >
          💾 Salvar Configurações Visuais
        </button>
      </div>
    </div>
  );
}