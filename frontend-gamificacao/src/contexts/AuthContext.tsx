import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: number;
  nome: string;
  role: 'USER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (nome: string, pass: string) => Promise<void>;
  register: (nome: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api/v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bolao_user');
    try {
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler usuário do cache:', e);
    }
    return null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('bolao_token');
    return saved && saved !== 'undefined' ? saved : null;
  });

  const handleAuthResponse = (data: any) => {

    // Mapeia o token blindando contra maiúsculas
    const receivedToken = data.token || data.Token;
    
    // Converte o papel do C#
    const rawRole = data.papel || data.Papel || 'USER';
    const roleUpper = String(rawRole).toUpperCase();
    const role: 'USER' | 'ADMIN' = roleUpper.includes('ADMIN') ? 'ADMIN' : 'USER';

    const receivedUser: User = {
      id: data.id ?? data.Id ?? data.usuarioId ?? data.UsuarioId,
      
      nome: data.nome || data.Nome,
      role: role
    };

    setToken(receivedToken);
    setUser(receivedUser);

    localStorage.setItem('bolao_token', receivedToken);
    localStorage.setItem('bolao_user', JSON.stringify(receivedUser));
  };

  const login = async (nome: string, pass: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, senha: pass })
    });

    if (!response.ok) {
      throw new Error('Credenciais inválidas ou erro no servidor');
    }

    const data = await response.json();
    handleAuthResponse(data);
  };

  const register = async (nome: string, email: string, pass: string) => {
    const payload: any = { nome, senha: pass };
    if (email && email.trim() !== "") payload.email = email;

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Erro ao realizar o cadastro');
    }

    const data = await response.json();
    handleAuthResponse(data);
  };

  const loginWithGoogle = async () => {
    console.warn('A autenticação via Google está desabilitada no momento.');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bolao_token');
    localStorage.removeItem('bolao_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      loginWithGoogle, 
      logout, 
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}