// src/components/ProfileModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface AvatarResponse {
  id: string;
  nome: string;
  imagemUrl: string;
  corBorda: string;
}

interface Badge {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  desbloqueadoEm: string;
}

interface UserProfileData {
  membroDesde: string;
  xp: number;
  level: number;
  xpProximoLevel: number;
  avatares: AvatarResponse[];
  badges?: Badge[]; // Opcional, pois o backend ainda não envia
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: AvatarResponse | null;
  onSelectAvatar: (avatar: AvatarResponse) => void;
}

export function ProfileModal({ isOpen, onClose, currentAvatar, onSelectAvatar }: ProfileModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const fetchProfile = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('bolao_token');
          
          // 🚀 AGORA É DE VERDADE! Chamando o seu backend em C#
          const res = await fetch(`http://localhost:5000/api/v1/usuarios/perfil`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            
            // Garantindo que a lista de badges exista mesmo se o C# não mandar
            if (!data.badges) data.badges = [];
            
            setProfile(data);
          } else {
            console.error("Falha ao buscar perfil da API.");
          }
        } catch (error) {
          console.error("Erro na requisição do perfil:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchProfile();
      setIsSelectingAvatar(false);
    }
  }, [isOpen, user]);

  const handleUpdateAvatar = async (avatar: AvatarResponse) => {
    try {
      const token = localStorage.getItem('bolao_token');
      await fetch(`http://localhost:5000/api/v1/usuarios/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ figurinhaId: avatar.id })
      });
      
      onSelectAvatar(avatar);
      setIsSelectingAvatar(false);
    } catch (e) {
      alert('Erro ao salvar avatar.');
    }
  };

  if (!isOpen) return null;

  const xpPercentage = profile && profile.xpProximoLevel > 0 
    ? Math.min(100, Math.round((profile.xp / profile.xpProximoLevel) * 100)) 
    : 0;
  
  const formatDate = (isoString: string) => {
    if (!isoString) return '...';
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(isoString));
  };

  return createPortal(
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="modal-content" style={{
        background: 'var(--card)', borderRadius: '12px', width: '100%', maxWidth: '600px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)', border: '1px solid var(--border)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative'
      }}>
        
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)', 
          border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', transition: 'background 0.2s', zIndex: 10
        }}>✕</button>

        {isSelectingAvatar && profile ? (
          /* GALERIA DE AVATARES */
          <div style={{ padding: '30px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setIsSelectingAvatar(false)} 
              style={{ background: 'none', border: 'none', color: '#6B1F7C', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              ⬅ Voltar ao Perfil
            </button>

            <h3 style={{ fontSize: '1.2rem', color: '#6B1F7C', marginBottom: '5px' }}>Sua Galeria Privada</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '20px' }}>Escolha uma de suas cartas para ser sua identidade.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '15px' }}>
              {profile.avatares.map((avatar) => (
                <div 
                  key={avatar.id} onClick={() => handleUpdateAvatar(avatar)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{
                    width: '70px', height: '70px', borderRadius: '50%', background: '#fff',
                    border: `3px solid ${avatar.corBorda}`, padding: '3px', boxShadow: `0 4px 10px ${avatar.corBorda}40`
                  }}>
                    <img src={avatar.imagemUrl} alt={avatar.nome} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)', marginTop: '8px', textAlign: 'center', lineHeight: '1.1' }}>
                    {avatar.nome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* TELA PRINCIPAL DO PERFIL */
          <>
            <div style={{ background: 'linear-gradient(135deg, #6B1F7C 0%, #3e1147 100%)', padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              
              <div 
                onClick={() => setIsSelectingAvatar(true)}
                style={{ 
                  width: '100px', height: '100px', borderRadius: '50%', background: '#fff', 
                  padding: '4px', border: `4px solid ${currentAvatar?.corBorda || '#E05206'}`, 
                  marginBottom: '15px', position: 'relative', cursor: 'pointer',
                  boxShadow: `0 8px 20px ${currentAvatar?.corBorda || '#E05206'}60`
                }}
                title="Alterar Identidade Visual"
              >
                <img src={currentAvatar?.imagemUrl || 'https://via.placeholder.com/100'} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ 
                  position: 'absolute', bottom: '-5px', right: '-5px', background: '#E05206', 
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', color: '#fff', 
                  border: '3px solid #6B1F7C', fontSize: '0.85rem'
                }}>✏️</div>
              </div>

              <div style={{ color: '#fff' }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>
                  {user?.nome}
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {t('profile.memberSince', 'Colaborador desde')}: {profile ? formatDate(profile.membroDesde) : '...'}
                </p>
              </div>
            </div>

            <div style={{ padding: '24px', maxHeight: '55vh', overflowY: 'auto' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#6B1F7C', fontWeight: 'bold' }}>
                  ⏳ {t('profile.loading', 'Carregando credenciais...')}
                </div>
              ) : profile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* XP E LEVEL */}
                  <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Nível de Acesso</span>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#6B1F7C', lineHeight: '1' }}>LVL {profile.level}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 700 }}>Experiência</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#E05206' }}>{profile.xp.toLocaleString()} <span style={{fontSize: '0.8rem', color: 'var(--muted)'}}>XP</span></div>
                      </div>
                    </div>

                    <div style={{ width: '100%', height: '12px', background: 'rgba(107, 31, 124, 0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${xpPercentage}%`, background: '#E05206', borderRadius: '6px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
                      Faltam {(profile.xpProximoLevel - profile.xp).toLocaleString()} XP para o Próximo Nível
                    </div>
                  </div>

                  {/* INSÍGNIAS E CONQUISTAS */}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '12px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', fontWeight: 800 }}>
                      {t('profile.badgesTitle', 'Insígnias e Conquistas')}
                    </h3>
                    
                    {(!profile.badges || profile.badges.length === 0) ? (
                      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center', padding: '10px' }}>Nenhuma conquista desbloqueada ainda.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                        {profile.badges.map((badge) => (
                          <div key={badge.id} style={{ 
                            display: 'flex', gap: '12px', background: 'var(--surface)', 
                            padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' 
                          }}>
                            <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {badge.icone}
                            </div>
                            <div>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#6B1F7C', fontWeight: 800 }}>{badge.nome}</h4>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)', lineHeight: '1.3' }}>{badge.descricao}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}