// src/pages/Loja.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { PackItem } from '../components/PackItem';

interface LojaItem {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
  imagemUrl?: string;
  precoMoedas: number;
  estoqueGlobal?: number | null;
  limitePorUsuario?: number | null;
  jaCompradosPeloUsuario: number;
}

export function Loja() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [itens, setItens] = useState<LojaItem[]>([]);
  const [saldo, setSaldo] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchLoja = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('bolao_token');
        const res = await fetch(`http://localhost:5000/api/v1/loja`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setSaldo(data.saldo);
          setItens(data.itens);
        }
      } catch (error) {
        console.error("Erro ao carregar loja", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoja();
  }, []);

  const handleComprar = async (item: LojaItem) => {
    if (saldo < item.precoMoedas) {
      alert('Saldo insuficiente!');
      return;
    }
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('bolao_token');
      const res = await fetch(`http://localhost:5000/api/v1/loja/comprar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ itemId: item.id })
      });

      const data = await res.json();
      if (res.ok) {
        setSaldo(data.novoSaldo);
        // 🚀 AGORA DIMINUI O ESTOQUE GLOBAL E AUMENTA O LIMITE PESSOAL NA TELA!
        setItens(prev => prev.map(i => {
          if (i.id === item.id) {
            return { 
              ...i, 
              jaCompradosPeloUsuario: i.jaCompradosPeloUsuario + 1,
              estoqueGlobal: typeof i.estoqueGlobal === 'number' ? i.estoqueGlobal - 1 : i.estoqueGlobal 
            };
          }
          return i;
        }));
        alert(`🎉 Aquisição de [${item.nome}] concluída com sucesso!`);
      } else {
        alert(`Erro: ${data.mensagem || 'Falha na transação.'}`);
      }
    } catch (e) {
      alert('Erro de comunicação com o servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  const ofertaDiaria = itens.filter(i => i.tipo === 'OfertaDiaria');
  const pacotes = itens.filter(i => i.tipo === 'Pacote' || i.tipo === 'Figurinha');
  const fisicos = itens.filter(i => !['OfertaDiaria', 'Pacote', 'Figurinha'].includes(i.tipo));

  return (
    <div style={{ padding: '10px 0' }}>
      <style>{`
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(224, 82, 6, 0.2); }
          70% { box-shadow: 0 0 0 10px rgba(224, 82, 6, 0); }
          100% { box-shadow: 0 0 0 0 rgba(224, 82, 6, 0); }
        }
        .game-header {
          background: linear-gradient(135deg, #6B1F7C 0%, #3e1147 100%);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(107, 31, 124, 0.2);
          overflow: hidden;
        }
        .section-title {
          font-family: 'Inter', sans-serif;
          font-size: 1.4rem; color: #6B1F7C;
          text-transform: uppercase; letter-spacing: 1px;
          border-bottom: 3px solid #E05206;
          padding-bottom: 8px; margin-bottom: 24px;
          display: inline-block; font-weight: 900;
        }
        .cyber-card {
          background: var(--card, #ffffff);
          border: 1px solid rgba(107, 31, 124, 0.15);
          border-radius: 12px;
          transition: all 0.2s ease-in-out;
          overflow: hidden;
          display: flex; flexDirection: column;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          position: relative;
        }
        .cyber-card:hover {
          transform: translateY(-4px);
          border-color: #E05206;
          box-shadow: 0 12px 20px rgba(224, 82, 6, 0.15);
        }
        .cyber-card-img-wrapper {
          position: relative;
          height: 260px;
          background: radial-gradient(circle at center, rgba(107,31,124,0.05) 0%, transparent 70%);
          display: flex; align-items: center; justify-content: center;
          border-bottom: 1px solid rgba(107,31,124,0.05);
        }
        .game-btn {
          background: linear-gradient(to bottom, #E05206, #c2410c);
          border: none; border-bottom: 4px solid #9a3412;
          color: white; text-transform: uppercase; font-weight: 900;
          border-radius: 8px; padding: 12px; cursor: pointer;
          transition: all 0.1s; display: flex; justify-content: center; align-items: center; gap: 8px;
        }
        .game-btn:active:not(:disabled) {
          transform: translateY(4px); border-bottom-width: 0px; margin-bottom: 4px;
        }
        .game-btn:disabled {
          background: #e2e8f0; border-bottom-color: #cbd5e1; color: #94a3b8; cursor: not-allowed;
        }
        .daily-offer {
          border: 2px solid #E05206;
          background: linear-gradient(145deg, var(--card, #ffffff) 0%, rgba(224, 82, 6, 0.05) 100%);
          animation: pulse-border 2s infinite;
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* CABEÇALHO DA LOJA */}
        <div className="game-header" style={{ padding: '40px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', fontWeight: 900, letterSpacing: '0.5px' }}>
              Mercado Cyber
            </h2>
            <p style={{ margin: 0, color: '#e9d5ff', fontSize: '1rem', fontWeight: 600 }}>
              Adquira dados, expansões e vantagens exclusivas.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '15px 30px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(5px)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#e9d5ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Saldo Disponível</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFD700', textShadow: '0 2px 4px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🪙 {saldo.toLocaleString()}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#6B1F7C', fontSize: '1.2rem', fontWeight: 800 }}>
            ⏳ Sincronizando vitrine...
          </div>
        ) : itens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--muted)', fontSize: '1.1rem', fontWeight: 700 }}>
            A loja está vazia no momento.
          </div>
        ) : (
          <>
            {/* OFERTA DIÁRIA */}
            {ofertaDiaria.length > 0 && (
              <div>
                <h3 className="section-title">⏱️ Oferta do Dia</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                  {ofertaDiaria.map(item => {
                    // 🚀 AGORA ELE CALCULA O LIMITE NA OFERTA DIÁRIA!
                    const isEsgotado = (item.estoqueGlobal !== null && item.estoqueGlobal <= 0) || 
                                       (item.limitePorUsuario !== null && item.jaCompradosPeloUsuario >= item.limitePorUsuario);

                    return (
                      <div key={item.id} className="cyber-card daily-offer" style={{ flexDirection: 'row', alignItems: 'center', opacity: isEsgotado ? 0.6 : 1 }}>
                        <div className="cyber-card-img-wrapper" style={{ width: '30%', minWidth: '200px', height: 'auto', padding: '30px', borderBottom: 'none', borderRight: '1px solid rgba(107,31,124,0.1)' }}>
                           <img src={item.imagemUrl || 'https://api.dicebear.com/7.x/shapes/svg?seed=daily'} alt="Oferta Diária" style={{ width: '120px', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))' }} />
                        </div>
                        <div style={{ padding: '30px', flex: 1 }}>
                          {/* Muda a etiqueta se já comprou */}
                          <div style={{ display: 'inline-block', background: isEsgotado ? '#64748b' : '#E05206', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '10px' }}>
                            {isEsgotado ? 'COMPRADA HOJE' : 'EXPIRA À MEIA-NOITE'}
                          </div>
                          
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '1.6rem', color: '#6B1F7C', fontWeight: 900 }}>{item.nome}</h4>
                          <p style={{ margin: '0 0 20px 0', fontSize: '1rem', color: 'var(--text)', opacity: 0.8, lineHeight: '1.5' }}>{item.descricao}</p>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {/* 🚀 Passando o isEsgotado para o botão travar! */}
                            <BuyButton item={item} saldo={saldo} onBuy={handleComprar} isEsgotado={isEsgotado} isProcessing={isProcessing} width="220px" />
                            
                            {item.limitePorUsuario !== null && (
                              <span style={{ color: isEsgotado ? '#ef4444' : 'var(--muted)', fontSize: '0.85rem', fontWeight: 700 }}>
                                Limite: {item.jaCompradosPeloUsuario}/{item.limitePorUsuario}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PACOTES (COM SEU PACKITEM OFICIAL CLARO E VISÍVEL) */}
            {pacotes.length > 0 && (
              <div>
                <h3 className="section-title">📦 Data Packs</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '30px' }}>
                  {pacotes.map(item => (
                    <StoreCard key={item.id} item={item} saldo={saldo} onBuy={handleComprar} isProcessing={isProcessing} isPack={true} />
                  ))}
                </div>
              </div>
            )}

            {/* ITENS FÍSICOS */}
            {fisicos.length > 0 && (
              <div>
                <h3 className="section-title">🛍️ Produtos Físicos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '30px' }}>
                  {fisicos.map(item => (
                    <StoreCard key={item.id} item={item} saldo={saldo} onBuy={handleComprar} isProcessing={isProcessing} isPack={false} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ==============================================================
// STORE CARD UNIFICADO
// ==============================================================
function StoreCard({ item, saldo, onBuy, isProcessing, isPack }: any) {
  const isEsgotado = (item.estoqueGlobal !== null && item.estoqueGlobal <= 0) || 
                     (item.limitePorUsuario !== null && item.jaCompradosPeloUsuario >= item.limitePorUsuario);

  return (
    <div className="cyber-card" style={{ opacity: isEsgotado ? 0.6 : 1 }}>
      
      {item.estoqueGlobal !== null && !isEsgotado && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#dc2626', color: '#fff', fontSize: '0.75rem', fontWeight: 900, padding: '4px 8px', borderRadius: '4px', zIndex: 10 }}>
          RESTAM {item.estoqueGlobal}
        </div>
      )}
      
      {/* Fundo Claro para o Pacotinho não sumir */}
      <div className="cyber-card-img-wrapper" style={{ padding: '20px' }}>
        {isPack ? (
          /* 🚀 SCALE ALTERADO PARA 1 (Tamanho original sem cortar nas bordas) */
          <div style={{ position: 'relative', zIndex: 2, transform: 'scale(1)', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.15))' }}>
            <PackItem type={item.imagemUrl || 'base'} name={item.nome} amount={1} />
          </div>
        ) : (
          <img src={item.imagemUrl || 'https://via.placeholder.com/150'} alt={item.nome} style={{ position: 'relative', zIndex: 2, maxWidth: '80%', maxHeight: '200px', objectFit: 'contain', filter: 'drop-shadow(0 8px 8px rgba(0,0,0,0.1))' }} />
        )}
      </div>
      
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#6B1F7C', fontWeight: 900 }}>{item.nome}</h4>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--text)', opacity: 0.8, lineHeight: '1.5', flex: 1 }}>{item.descricao}</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', fontSize: '0.75rem', fontWeight: 700 }}>
          <span style={{ color: 'var(--muted)', textTransform: 'uppercase' }}>Seu Limite</span>
          <span style={{ color: item.limitePorUsuario !== null && item.jaCompradosPeloUsuario >= item.limitePorUsuario ? '#ef4444' : '#6B1F7C' }}>
            {item.limitePorUsuario !== null ? `${item.jaCompradosPeloUsuario} / ${item.limitePorUsuario}` : '∞ Ilimitado'}
          </span>
        </div>

        <BuyButton item={item} saldo={saldo} onBuy={onBuy} isEsgotado={isEsgotado} isProcessing={isProcessing} width="100%" />
      </div>
    </div>
  );
}

// ==============================================================
// BOTÃO 3D CLARO
// ==============================================================
function BuyButton({ item, saldo, onBuy, isEsgotado, isProcessing, width }: any) {
  const podeComprar = saldo >= item.precoMoedas;
  
  return (
    <button 
      className="game-btn"
      onClick={() => onBuy(item)}
      disabled={isEsgotado || !podeComprar || isProcessing}
      style={{ width: width }}
    >
      {isProcessing ? (
        'Processando...'
      ) : isEsgotado ? (
        'Esgotado'
      ) : (
        <>
          Comprar <span style={{ color: '#FFD700', textShadow: '0 1px 2px rgba(0,0,0,0.4)', marginLeft: '4px' }}>🪙 {item.precoMoedas}</span>
        </>
      )}
    </button>
  );
}