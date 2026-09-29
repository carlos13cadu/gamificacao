// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'register' | 'forgot';

export function Login() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [userOrEmail, setUserOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleAction = async () => {
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!userOrEmail || !password) throw new Error('Preencha os campos.');
        await login(userOrEmail, password);
        navigate('/palpites');
      } 
      else if (mode === 'register') {
        if (!userOrEmail || !password) throw new Error('Preencha os campos.');
        if (password.length < 4) throw new Error('Senha deve ter mín. 4 dígitos.');
        if (password !== confirmPassword) throw new Error('Senhas não coincidem.');
        await register(userOrEmail, userOrEmail, password);
        navigate('/palpites');
      }
      else if (mode === 'forgot') {
        if (!userOrEmail) throw new Error('Informe o usuário ou e-mail.');
        // Simulação do envio de e-mail de recuperação
        await new Promise(r => setTimeout(r, 800));
        alert('Se o usuário existir, um código foi enviado!');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await loginWithGoogle();
      navigate('/palpites');
    } catch (err) {
      setError('Erro na autenticação com Google.');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', textAlign: 'center' }}>
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', padding: '30px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', color: 'var(--green)', textTransform: 'uppercase', marginBottom: 20 }}>
          {/* TRADUZINDO OS TÍTULOS */}
          {mode === 'login' ? t('login.titleLogin') : mode === 'register' ? t('login.titleRegister') : t('login.titleForgot')}
        </h2>

        {mode !== 'forgot' && (
          <div style={{ marginBottom: 20 }}>
            <button className="btn-save btn-google" onClick={handleGoogleAuth}>
              <img src="https://img.icons8.com/color/48/google-logo.png" alt="Google" style={{ width: 20, height: 20 }} />
              {t('login.googleBtn')}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
              <span style={{ padding: '0 10px', fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 'bold' }}>{t('login.or')}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
            </div>
          </div>
        )}

        <div className="user-select-wrap">
          <label>👤 {mode === 'register' ? t('login.nameEmailLabel') : t('login.userEmailLabel')}</label>
          <input type="text" value={userOrEmail} onChange={e => setUserOrEmail(e.target.value)} />
        </div>

        {mode !== 'forgot' && (
          <div className="user-select-wrap">
            <label>🔑 Senha</label>
            <input 
              type="password" 
              placeholder="Mínimo 4 dígitos" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAction()}
            />
          </div>
        )}

        {mode === 'register' && (
          <div className="user-select-wrap">
            <label>🔑 Confirmar Senha</label>
            <input 
              type="password" 
              placeholder="Repita a senha" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAction()}
            />
          </div>
        )}

        {error && <div style={{ color: '#e11d48', fontSize: '0.85rem', fontWeight: 600, marginBottom: 15 }}>{error}</div>}

        <button className="btn-save" onClick={handleAction} disabled={loading}>
          {loading ? t('login.wait') : mode === 'login' ? t('login.btnEnter') : mode === 'register' ? t('login.btnRegister') : t('login.btnSendCode')}
        </button>

        {/* Controles de Rodapé */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'login' ? (
            <>
              <span className="auth-link" onClick={() => setMode('forgot')}>{t('login.forgotLink')}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {t('login.noAccount')} <span className="auth-link" onClick={() => setMode('register')}>{t('login.registerLink')}</span>
              </span>
            </>
          ) : (
            <span className="auth-link" onClick={() => setMode('login')}>{t('login.backLogin')}</span>
          )}
        </div>
      </div>
    </div>
  );
}