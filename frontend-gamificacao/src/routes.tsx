// src/routes.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Importações do Site Principal
import { Layout } from './components/Layout';
import { Game } from './pages/Game'; // 🚀 O novo coração do sistema!
import { Album } from './pages/Album';
import { Ranking } from './pages/Ranking';
import { Login } from './pages/Login';
import { Rules } from './pages/Rules';
import { Loja } from './pages/Loja';
import { AdminLoja } from './components/AdminLoja';

// import { Palpites } from './pages/Palpites';
// import { MyBets } from './pages/MyBets';

// Importações do Admin
import { AdminLayout } from './components/AdminLayout';
import { ThemeManager } from './pages/admin/ThemeManager';
import { AlbumFactory } from './pages/admin/AlbumFactory';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* ROTAS DO SITE PRINCIPAL (Usa o Layout normal com Header) */}
        <Route element={<Layout />}>
          {/* 🚀 O Minigame de Cibersegurança entra em cena! */}
          <Route path="/game" element={<PrivateRoute><Game /></PrivateRoute>} />
          
          {/* Rotas ocultas por enquanto...
          <Route path="/palpites" element={<PrivateRoute><Palpites /></PrivateRoute>} />
          <Route path="/meus-palpites" element={<PrivateRoute><MyBets /></PrivateRoute>} /> 
          */}
          
          <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
          <Route path="/album" element={<PrivateRoute><Album /></PrivateRoute>} />
          <Route path="/loja" element={<PrivateRoute><Loja /></PrivateRoute>} />
          <Route path="/regras" element={<PrivateRoute><Rules /></PrivateRoute>} />
        </Route>

        {/* ROTAS DO ADMIN (Usa o AdminLayout com Sidebar Lateral) */}
        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="temas" replace />} />
          <Route path="temas" element={<ThemeManager />} />
          <Route path="loja" element={<AdminLoja />} />
          <Route path="albuns" element={<AlbumFactory />} /> 
        </Route>

        {/* 🚀 Qualquer rota inválida (ou o "/") agora joga o usuário direto pro Game! */}
        <Route path="*" element={<Navigate to="/game" replace />} />
      </Routes>
    </BrowserRouter>
  );
}