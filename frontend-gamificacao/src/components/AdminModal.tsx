// src/components/AdminModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: number;
}

// Helper blindado contra erros de formatação
const requestApi = async (endpoint: string, method: string = 'GET', body?: any) => {
  const token = localStorage.getItem('bolao_token');
  const res = await fetch(`http://localhost:5000${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  // 🚀 FIX: Verifica se é JSON antes de quebrar o app
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`Erro na API (${res.status}): Rota não encontrada ou retorno inválido.`);
  }

  if (!res.ok) throw new Error(data.message || `Erro ${res.status} na requisição`);
  return data;
};

export function AdminModal({ isOpen, onClose, albumId }: AdminModalProps) {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [pacotes, setPacotes] = useState<any[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  // 🚀 Corrigido de <number | ''> para <string>
  const [selectedPacoteId, setSelectedPacoteId] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 1. Busca os usuários
      requestApi('/api/v1/admin/usuarios')
        .then(data => setUsuarios(data.usuarios || []))
        .catch(err => console.error(err));
        
      // 2. Busca os pacotes vinculados a este álbum
      requestApi(`/api/v1/admin/pacotes/${albumId}`)
        .then(data => {
            setPacotes(data.pacotes || []);
            // Já pré-seleciona o primeiro pacote da lista pra facilitar
            if (data.pacotes && data.pacotes.length > 0) setSelectedPacoteId(data.pacotes[0].id);
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, albumId]);

  if (!isOpen) return null;

  const handleDarPacotes = async () => {
    if (!selectedUserId || !selectedPacoteId || quantidade < 1) {
        return alert("Selecione um usuário, um pacote e uma quantidade válida.");
    }
    
    setIsSubmitting(true);
    try {
      const res = await requestApi('/api/v1/admin/dar-pacotes', 'POST', {
        usuarioId: selectedUserId,
        tipoPacoteId: selectedPacoteId, // 🚀 Mandando o pacote exato!
        quantidade: quantidade
      });
      alert(`✅ ${res.message}`);
      
      // Limpa só a quantidade e mantém o usuário selecionado pra mandar mais se quiser
      setQuantidade(1); 
    } catch (e: any) {
      alert(e.message || "Erro ao enviar pacotes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay open">
      <div className="modal-box" style={{ maxWidth: 450, padding: '24px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>

        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', color: '#dc2626', textTransform: 'uppercase', marginBottom: 20 }}>
          ⚙️ Painel de Administração
        </h2>

        <div style={{ marginBottom: 15 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>👤 Destinatário:</label>
          <select 
            value={selectedUserId} 
            onChange={(e) => setSelectedUserId(Number(e.target.value))} 
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.95rem' }}
          >
            <option value="">-- Selecione o usuário --</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>
        </div>

        {/* 🚀 NOVO DROPDOWN: ESCOLHER O TIPO DE PACOTE */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>🎁 Tipo de Pacote:</label>
          <select 
            value={selectedPacoteId} 
            onChange={(e) => setSelectedPacoteId(e.target.value)} // 🚀 Removido o Number()
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.95rem' }}
            disabled={pacotes.length === 0}
          >
            {pacotes.length === 0 && <option value="">Nenhum pacote cadastrado para este álbum</option>}
            {pacotes.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>📦 Quantidade de Pacotes:</label>
          <input 
            type="number" 
            min="1" 
            value={quantidade} 
            onChange={(e) => setQuantidade(Number(e.target.value))}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.95rem' }}
          />
        </div>

        <button 
          onClick={handleDarPacotes} 
          disabled={isSubmitting}
          style={{ width: '100%', padding: 12, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontFamily: "'Barlow Condensed'", fontSize: '1.2rem', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          {isSubmitting ? '⏳ Enviando...' : 'Dar Pacotes'}
        </button>
      </div>
    </div>,
    document.body
  );
}