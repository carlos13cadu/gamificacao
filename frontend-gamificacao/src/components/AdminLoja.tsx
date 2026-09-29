// src/components/AdminLoja.tsx
import { useState, useEffect } from 'react';

export function AdminLoja() {
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Campos do Formulário
  const [tipoPacoteId, setTipoPacoteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState(100);
  const [estoqueGlobal, setEstoqueGlobal] = useState<number | ''>('');
  const [limiteUsuario, setLimiteUsuario] = useState<number | ''>('');

  useEffect(() => {
    const fetchPacotes = async () => {
      try {
        const token = localStorage.getItem('bolao_token');
        const res = await fetch(`http://localhost:5000/api/v1/loja/admin/pacotes-disponiveis`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPacotes(data);
          if (data.length > 0) setTipoPacoteId(data[0].id);
        }
      } catch (e) {
        console.error("Erro ao buscar pacotes", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPacotes();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('bolao_token');
      const res = await fetch(`http://localhost:5000/api/v1/loja/admin/adicionar-pacote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          tipoPacoteId,
          descricao,
          precoMoedas: Number(preco),
          estoqueGlobal: estoqueGlobal === '' ? null : Number(estoqueGlobal),
          limitePorUsuario: limiteUsuario === '' ? null : Number(limiteUsuario)
          // 🚀 TemplateVisual removido! O C# vai puxar automático.
        })
      });

      const result = await res.json();
      if (res.ok) {
        alert(result.mensagem);
        setDescricao(''); setPreco(100); setEstoqueGlobal(''); setLimiteUsuario('');
      } else {
        alert(`Erro: ${result.mensagem || 'Falha ao salvar'}`);
      }
    } catch (e) {
      alert("Erro de comunicação com a API.");
    }
  };

  if (isLoading) return <div>Carregando opções da loja...</div>;

  return (
    <div style={{ background: 'var(--card)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: '#6B1F7C', margin: '0 0 20px 0', fontFamily: "'Inter', sans-serif", fontWeight: 900 }}>
        ⚙️ Adicionar Pacote na Loja
      </h2>

      <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Selecione o Pacote do Álbum:</label>
          <select 
            value={tipoPacoteId} onChange={e => setTipoPacoteId(e.target.value)} required
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            {pacotes.map(p => (
              <option key={p.id} value={p.id}>{p.albumNome} - {p.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Descrição de Venda:</label>
          <textarea 
            value={descricao} onChange={e => setDescricao(e.target.value)} required placeholder="Ex: Pacote especial com alta chance de cartas raras!"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', minHeight: '80px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Preço (Moedas):</label>
            <input 
              type="number" min="0" value={preco} onChange={e => setPreco(Number(e.target.value))} required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Estoque Global (Vazio = ∞):</label>
            <input 
              type="number" min="1" value={estoqueGlobal} onChange={e => setEstoqueGlobal(e.target.value ? Number(e.target.value) : '')} placeholder="Ex: 50"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Limite (Vazio = ∞):</label>
            <input 
              type="number" min="1" value={limiteUsuario} onChange={e => setLimiteUsuario(e.target.value ? Number(e.target.value) : '')} placeholder="Ex: 3"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          style={{ background: '#E05206', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase' }}
        >
          ➕ Adicionar à Vitrine
        </button>
      </form>
    </div>
  );
}