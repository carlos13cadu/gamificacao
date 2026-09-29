// src/components/TradeModal.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import type { Sticker } from './StickerCard';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: number;
  albumTotal: number;
  isLegado: boolean;
  myInventory: Sticker[];
}

interface FlatSticker extends Sticker {
  uid: string;
  isLocked: boolean;
}

const normalizeSticker = (s: any): Sticker => ({
  ...s,
  id: s.id || s.Id,
  name: s.name || s.nome || s.Nome,
  image: s.image || s.imagemUrl || s.ImagemUrl,
  quantity: s.quantity ?? s.quantidade ?? s.Quantidade ?? 0,
  rarityId: s.rarityId ?? s.raridadeId ?? s.RaridadeId ?? 1,
  isSecreta: s.isSecreta ?? s.IsSecreta ?? false,
  isTrofeu: s.isTrofeu ?? s.IsTrofeu ?? false
});

const isTrocavel = (s: Sticker) => {
  if (s.isSecret || s.isTrophy) return false;
  if (['Coringa', 'Itália', 'Troféu Copa 26', 'Taça Jules Rimet', 'Álbum Legado', 'Argentina 70'].includes(s.name)) return false;
  return true;
};

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
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro na requisição');
  return data;
};

export function TradeModal({ isOpen, onClose, albumId, albumTotal, isLegado, myInventory }: TradeModalProps) {
  const { t } = useTranslation();
  
  const { user } = useAuth(); 
  const currentUserId = String(user?.id || '1');

  const checkIsSender = (deId: any) => {
    return String(deId) === currentUserId; 
  };

  const [tab, setTab] = useState<'nova' | 'lista'>('nova');
  const [detalhesTroca, setDetalhesTroca] = useState<any | null>(null);
  
  const [mapaUsuarios, setMapaUsuarios] = useState<any[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<number | ''>('');
  const [selectedFriendName, setSelectedFriendName] = useState<string>('');
  const [friendInventory, setFriendInventory] = useState<Sticker[]>([]);
  
  const [myOffer, setMyOffer] = useState<FlatSticker[]>([]);
  const [friendRequest, setFriendRequest] = useState<FlatSticker[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendentes, setPendentes] = useState<any[]>([]);

  const [filterGlobalUteis, setFilterGlobalUteis] = useState(false);
  const [filterGlobalRep, setFilterGlobalRep] = useState(false);
  const [filterMyRep, setFilterMyRep] = useState(false);
  const [filterUsefulForHim, setFilterUsefulForHim] = useState(false);
  const [filterHisRep, setFilterHisRep] = useState(false);
  const [filterUsefulForMe, setFilterUsefulForMe] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragPos = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      requestApi(`/api/v1/mercado-trocas/mapeamento/${albumId}`)
        .then(data => setMapaUsuarios(data.mapa || []))
        .catch(err => console.error(err));

      // Lógica da Aba Inteligente usando a nova função blindada!
      requestApi(`/api/v1/mercado-trocas/pendentes`)
        .then(data => {
          const trocas = data.trocas || [];
          setPendentes(trocas);
          
          // Se existir alguma troca onde eu NÃO SOU o remetente, significa que eu recebi!
          const temPropostaRecebida = trocas.some((t: any) => {
             const isSender = checkIsSender(t.deUsuarioId ?? t.DeUsuarioId, t.deUsuarioNome ?? t.DeUsuarioNome);
             return !isSender; 
          });
          
          if (temPropostaRecebida) {
            setTab('lista'); 
          } else {
            setTab('nova');
          }
        })
        .catch(err => console.error(err));

      setDetalhesTroca(null);
    }
  }, [isOpen, albumId]);

  useEffect(() => {
    if (selectedFriendId) {
      requestApi(`/api/v1/mercado-trocas/inventario-alvo/${albumId}/${selectedFriendId}`).then(data => {
        const inv = data.figurinhas || [];
        setFriendInventory(inv);
      }).catch(err => console.error("Erro ao carregar inventário do alvo:", err));
      
      setFriendRequest([]);
    } else {
      setFriendInventory([]);
    }
  }, [selectedFriendId, albumId]);

  const loadPendentes = () => {
    requestApi(`/api/v1/mercado-trocas/pendentes`)
      .then(data => setPendentes(data.trocas || []))
      .catch(err => console.error(err));
  };

  const normalizedMyInv = useMemo(() => myInventory.map(normalizeSticker), [myInventory]);
  const normalizedFriendInv = useMemo(() => friendInventory.map(normalizeSticker), [friendInventory]);

  const myUniqueCount = useMemo(() => normalizedMyInv.filter(s => s.quantity > 0 && isTrocavel(s)).length, [normalizedMyInv]);
  const friendUniqueCount = useMemo(() => normalizedFriendInv.filter(s => s.quantity > 0 && isTrocavel(s)).length, [normalizedFriendInv]);

  const limiteAlbum = isLegado ? 16 : 48;
  const myAlbumCompleto = myUniqueCount >= limiteAlbum;
  const friendAlbumCompleto = friendUniqueCount >= limiteAlbum;

  const buildFlatInventory = (inv: Sticker[], isCompleto: boolean) => {
    const flat: FlatSticker[] = [];
    inv.forEach(s => {
      if (!isTrocavel(s)) return;
      const bloqueadas = isLegado ? 1 : (isCompleto ? 1 : 0);
      for (let i = 0; i < s.quantity; i++) {
        flat.push({ ...s, uid: `${s.id}_${i}`, isLocked: i < bloqueadas });
      }
    });
    return flat.sort((a, b) => {
      const nameCmp = a.name.localeCompare(b.name, 'pt');
      if (nameCmp !== 0) return nameCmp;
      return (b.isLocked ? 1 : 0) - (a.isLocked ? 1 : 0);
    });
  };

  const myFlatInv = useMemo(() => buildFlatInventory(normalizedMyInv, myAlbumCompleto), [normalizedMyInv, myAlbumCompleto, isLegado]);
  const friendFlatInv = useMemo(() => buildFlatInventory(normalizedFriendInv, friendAlbumCompleto), [normalizedFriendInv, friendAlbumCompleto, isLegado]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLHeadingElement>) => {
    isDragging.current = true;
    (e.target as HTMLElement).style.cursor = 'grabbing';
    startPos.current = { x: e.clientX - dragPos.current.x, y: e.clientY - dragPos.current.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (modalRef.current) modalRef.current.classList.add('dragging');
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLHeadingElement>) => {
    if (!isDragging.current) return;
    dragPos.current = { x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y };
    if (modalRef.current) modalRef.current.style.transform = `translate(${dragPos.current.x}px, ${dragPos.current.y}px)`;
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLHeadingElement>) => {
    isDragging.current = false;
    (e.target as HTMLElement).style.cursor = 'grab';
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (modalRef.current) modalRef.current.classList.remove('dragging');
  };

  const handleOfferSticker = (sticker: FlatSticker) => {
    if (sticker.isLocked) return alert('🔒 Esta cópia está protegida no álbum e não pode ser negociada!');
    if (myOffer.length >= 8) return alert('Máximo de 8 figurinhas!');
    setMyOffer([...myOffer, sticker]);
  };
  const handleRemoveOffer = (uid: string) => setMyOffer(myOffer.filter(s => s.uid !== uid));

  const handleRequestSticker = (sticker: FlatSticker) => {
    if (sticker.isLocked) return alert('🔒 Esta cópia está protegida no álbum e não pode ser negociada!');
    if (friendRequest.length >= 8) return alert('Máximo de 8 figurinhas!');
    setFriendRequest([...friendRequest, sticker]);
  };
  const handleRemoveRequest = (uid: string) => setFriendRequest(friendRequest.filter(s => s.uid !== uid));

  const handleProposeTrade = async () => {
    if (!selectedFriendId || (myOffer.length === 0 && friendRequest.length === 0)) {
      return alert("Selecione um colega e adicione cartas à proposta!");
    }
    setIsSubmitting(true);
    try {
      await requestApi(`/api/v1/mercado-trocas/propor`, 'POST', {
        paraUsuarioId: selectedFriendId,
        albumId: albumId,
        ofereceIds: myOffer.map(s => String(s.id)),
        querIds: friendRequest.map(s => String(s.id))
      });
      alert('✅ Proposta enviada com sucesso!');
      setMyOffer([]); setFriendRequest([]); setTab('lista'); loadPendentes();
    } catch (e: any) {
      alert(e.message || 'Erro ao enviar proposta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResponder = async (trocaId: number, resposta: 'aceitar' | 'cancelar') => {
    try {
      await requestApi(`/api/v1/mercado-trocas/responder/${trocaId}`, 'POST', { resposta });
      alert(`Troca ${resposta === 'aceitar' ? 'concluída' : 'cancelada'}!`);
      loadPendentes();
      setDetalhesTroca(null);
      if (resposta === 'aceitar') window.location.reload(); 
    } catch (e: any) {
      alert(e.message || 'Erro ao processar troca.');
    }
  };

  const renderSteamGrid = (
    flatInv: FlatSticker[], offerArray: FlatSticker[], targetInv: Sticker[], 
    filterRep: boolean, filterUseful: boolean, isMyInv: boolean, 
    onClickAction: (s: FlatSticker) => void
  ) => {
    const available = flatInv.filter(s => !offerArray.some(off => off.uid === s.uid));
    const filtered = available.filter(sticker => {
      const totalOwned = flatInv.filter(s => s.id === sticker.id).length;
      if (filterRep && totalOwned <= 1) return false;
      if (filterUseful) {
        const targetHas = targetInv.find(s => s.id === sticker.id);
        if (isMyInv) {
          if (targetHas && targetHas.quantity > 0) return false; 
        } else {
          if (targetHas && targetHas.quantity > 0) return false; 
        }
      }
      return true;
    });

    if (filtered.length === 0) return <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Nenhuma figurinha disponível.</p>;

    return filtered.map((sticker) => (
      <div key={sticker.uid} className="steam-item" style={{ borderColor: sticker.rarityId > 1 ? 'var(--gold)' : '#cbd5e1', opacity: sticker.isLocked ? 0.5 : 1, cursor: sticker.isLocked ? 'not-allowed' : 'pointer', position: 'relative' }} onClick={() => onClickAction(sticker)}>
        <img src={sticker.image || `https://flagcdn.com/w160/${(sticker as any).code || sticker.id.toString().toLowerCase()}.png`} alt={sticker.name} title={sticker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {sticker.isLocked && <div style={{ position: 'absolute', top: 2, left: 2, fontSize: '0.65rem', background: 'rgba(0,0,0,0.75)', color: '#fff', borderRadius: 3, padding: '1px 3px' }}>🔒</div>}
      </div>
    ));
  };

  const renderMiniaturas = (ids: string[], isReceiving: boolean) => {
    if (!ids || ids.length === 0) return <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 8 }}>Nenhuma</p>;

    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        {ids.map((id, index) => {
          const figurinha = normalizedMyInv.find(s => String(s.id) === String(id));
          if (!figurinha) return null;

          const isInedita = isReceiving && figurinha.quantity === 0;
          const isUltimaCopia = !isReceiving && figurinha.quantity === 1;

          return (
            <div key={`${id}-${index}`} style={{ width: 65, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <div style={{ width: '100%', height: 90, border: isInedita ? '2px solid var(--gold)' : (isUltimaCopia ? '2px solid #ef4444' : '1px solid var(--border)'), borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <img src={figurinha.image || ''} alt={figurinha.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              
              {isInedita && <span style={{ position: 'absolute', top: -8, background: 'var(--gold)', color: '#000', fontSize: '0.55rem', fontWeight: 900, padding: '2px 6px', borderRadius: 8, whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>✨ INÉDITA</span>}
              {isUltimaCopia && <span style={{ position: 'absolute', top: -8, background: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: 900, padding: '2px 6px', borderRadius: 8, whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>⚠️ ÚLTIMA</span>}

              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: figurinha.quantity > 0 ? 'var(--green)' : 'var(--muted)', marginTop: 6, textAlign: 'center', lineHeight: '1' }}>
                {figurinha.quantity > 0 ? `Tem: ${figurinha.quantity}` : 'Falta'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return createPortal(
    <div className="modal-overlay open">
      <div className="modal-box" ref={modalRef} style={{ maxWidth: 840, padding: '20px 24px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>

        <h2 onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', color: 'var(--green)', textTransform: 'uppercase', marginBottom: 20, cursor: 'grab', userSelect: 'none' }}>
          🤝 Mercado de Trocas {isLegado ? 'Legado' : '2026'}
        </h2>

        <div className="admin-subtabs" style={{ marginBottom: 15 }}>
          <button className={`admin-subtab ${tab === 'nova' ? 'active' : ''}`} onClick={() => { setTab('nova'); setDetalhesTroca(null); }}>Nova Proposta</button>
          <button className={`admin-subtab ${tab === 'lista' ? 'active' : ''}`} onClick={() => setTab('lista')}>Minhas Propostas ({pendentes.length})</button>
        </div>

        {tab === 'nova' && (
          <div>
            <div style={{ marginBottom: 15 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>👤 Selecione um participante para negociar:</label>
              <select value={selectedFriendId} onChange={(e) => {
                  setSelectedFriendId(Number(e.target.value));
                  setSelectedFriendName(e.target.options[e.target.selectedIndex].text);
                }} 
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.95rem' }}>
                <option value="">-- Escolha um usuário --</option>
                {mapaUsuarios?.filter(u => {
                  const util = u.temUtilPraMim ?? u.TemUtilPraMim;
                  const rep = u.temRepetida ?? u.TemRepetida;
                  return (!filterGlobalUteis || util) && (!filterGlobalRep || rep);
                }).map(u => {
                  const id = u.usuarioId ?? u.UsuarioId;
                  const nome = u.nome ?? u.Nome;
                  const util = u.temUtilPraMim ?? u.TemUtilPraMim;
                  return (
                    <option key={id} value={id}>{nome} {util ? '⭐' : ''}</option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', marginBottom: 15, padding: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--green)', fontFamily: "'Barlow Condensed'", textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚙️ Filtro Global:</span>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}><input type="checkbox" checked={filterGlobalUteis} onChange={e => setFilterGlobalUteis(e.target.checked)} /> Têm figurinhas úteis p/ mim</label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}><input type="checkbox" checked={filterGlobalRep} onChange={e => setFilterGlobalRep(e.target.checked)} /> Têm Repetidas</label>
            </div>

            <div className="steam-container" style={{ display: 'flex', gap: 15 }}>
              
              <div className="steam-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="steam-box" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: 8, minHeight: 180 }}>
                  <div className="steam-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 5, marginBottom: 10, color: 'var(--green)', fontWeight: 'bold', fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <span>Seu Inventário</span>
                    <span style={{ color: 'var(--muted)' }}>{myUniqueCount}/{limiteAlbum}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem', marginBottom: 10, padding: 6, background: 'var(--surface)', borderRadius: 6 }}>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={filterMyRep} onChange={e => setFilterMyRep(e.target.checked)} /> Só Repetidas</label>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={filterUsefulForHim} onChange={e => setFilterUsefulForHim(e.target.checked)} /> Úteis p/ ele(a)</label>
                  </div>
                  <div className="steam-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 160, overflowY: 'auto' }}>
                    {renderSteamGrid(myFlatInv, myOffer, normalizedFriendInv, filterMyRep, filterUsefulForHim, true, handleOfferSticker)}
                  </div>
                </div>
                <div className="steam-box" style={{ background: 'var(--surface)', border: '1px dashed var(--green)', borderRadius: 6, padding: 8, minHeight: 100 }}>
                  <div className="steam-header" style={{ marginBottom: 5, fontSize: '0.85rem', fontWeight: 'bold' }}>Seus Itens (Oferecidos):</div>
                  <div className="steam-zone" style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {myOffer.map((sticker) => (
                      <div key={sticker.uid} className="steam-item" style={{ borderColor: sticker.rarityId > 1 ? 'var(--gold)' : '#cbd5e1', cursor: 'pointer' }} onClick={() => handleRemoveOffer(sticker.uid)}>
                        <img src={sticker.image || `https://flagcdn.com/w160/${(sticker as any).code || sticker.id.toString().toLowerCase()}.png`} alt={sticker.name} title={sticker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--green)', fontSize: '1.5rem', fontWeight: 'bold' }}>⇄</div>

              <div className="steam-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="steam-box" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: 8, minHeight: 180 }}>
                  <div className="steam-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 5, marginBottom: 10, color: 'var(--green)', fontWeight: 'bold', fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <span>Inventário de {selectedFriendName || 'Alvo'}</span>
                    <span style={{ color: 'var(--muted)' }}>{friendUniqueCount}/{limiteAlbum}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem', marginBottom: 10, padding: 6, background: 'var(--surface)', borderRadius: 6 }}>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={filterHisRep} onChange={e => setFilterHisRep(e.target.checked)} /> Só Repetidas</label>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={filterUsefulForMe} onChange={e => setFilterUsefulForMe(e.target.checked)} /> Úteis p/ mim</label>
                  </div>
                  <div className="steam-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 160, overflowY: 'auto' }}>
                    {!selectedFriendId ? <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Selecione um usuário.</p> : 
                      renderSteamGrid(friendFlatInv, friendRequest, normalizedMyInv, filterHisRep, filterUsefulForMe, false, handleRequestSticker)}
                  </div>
                </div>
                <div className="steam-box" style={{ background: 'var(--surface)', border: '1px dashed #3b82f6', borderRadius: 6, padding: 8, minHeight: 100 }}>
                  <div className="steam-header" style={{ marginBottom: 5, fontSize: '0.85rem', fontWeight: 'bold', color: '#3b82f6' }}>Itens Dele (Você Recebe):</div>
                  <div className="steam-zone" style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {friendRequest.map((sticker) => (
                      <div key={sticker.uid} className="steam-item" style={{ borderColor: sticker.rarityId > 1 ? 'var(--gold)' : '#cbd5e1', cursor: 'pointer' }} onClick={() => handleRemoveRequest(sticker.uid)}>
                        <img src={sticker.image || `https://flagcdn.com/w160/${(sticker as any).code || sticker.id.toString().toLowerCase()}.png`} alt={sticker.name} title={sticker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>Clique nos itens para movê-los (Máx. 8 de cada lado).</p>
            <button style={{ width: '100%', padding: 12, background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: "'Barlow Condensed'", fontSize: '1.2rem', textTransform: 'uppercase', cursor: 'pointer', marginTop: 10 }} onClick={handleProposeTrade} disabled={isSubmitting}>
              {isSubmitting ? '⏳ Processando...' : 'Realizar Proposta'}
            </button>
          </div>
        )}

        {/* 🚀 ABA DE PROPOSTAS COM A LUPA CORRIGIDA */}
        {tab === 'lista' && (
          <div style={{ padding: 10, background: 'var(--card)', borderRadius: 8, border: '1px solid var(--border)', minHeight: 300, maxHeight: 400, overflowY: 'auto', position: 'relative' }}>
            
            {detalhesTroca ? (
              <div style={{ padding: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <button onClick={() => setDetalhesTroca(null)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}>
                    ⬅ Voltar para a lista
                  </button>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* 🚀 A MÁGICA AQUI: O botão 'Aceitar' não aparece se você for o Remetente! */}
                    {!checkIsSender(detalhesTroca.deUsuarioId ?? detalhesTroca.DeUsuarioId, detalhesTroca.deUsuarioNome ?? detalhesTroca.DeUsuarioNome) && (
                      <button style={{ padding: '8px 16px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleResponder(detalhesTroca.id ?? detalhesTroca.Id, 'aceitar')}>
                        ✔ Aceitar Troca
                      </button>
                    )}
                    <button style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleResponder(detalhesTroca.id ?? detalhesTroca.Id, 'cancelar')}>
                      ✖ {checkIsSender(detalhesTroca.deUsuarioId ?? detalhesTroca.DeUsuarioId, detalhesTroca.deUsuarioNome ?? detalhesTroca.DeUsuarioNome) ? 'Cancelar' : 'Recusar'}
                    </button>
                  </div>
                </div>

                <div style={{ background: 'var(--surface)', padding: 15, borderRadius: 8, border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 15, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    De: <span style={{color: 'var(--green)'}}>{detalhesTroca.deUsuarioNome ?? detalhesTroca.DeUsuarioNome}</span> para <span style={{color: '#3b82f6'}}>{detalhesTroca.paraUsuarioNome ?? detalhesTroca.ParaUsuarioNome}</span>
                  </h3>
                  
                  <div style={{ display: 'flex', gap: 20 }}>
                    {/* TEXTO DINÂMICO BASEADO EM QUEM ABRIU A LUPA */}
                    <div style={{ flex: 1, padding: 15, background: 'rgba(22, 163, 74, 0.05)', borderRadius: 8, border: '1px dashed var(--green)' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--green)' }}>
                        {checkIsSender(detalhesTroca.deUsuarioId ?? detalhesTroca.DeUsuarioId, detalhesTroca.deUsuarioNome ?? detalhesTroca.DeUsuarioNome) ? 'EU OFEREÇO:' : 'ELE OFERECE:'}
                      </span>
                      {renderMiniaturas(
                        detalhesTroca.ofereceFigurinhasIds ?? detalhesTroca.OfereceFigurinhasIds ?? detalhesTroca.oferece ?? detalhesTroca.Oferece ?? [],
                        !checkIsSender(detalhesTroca.deUsuarioId ?? detalhesTroca.DeUsuarioId, detalhesTroca.deUsuarioNome ?? detalhesTroca.DeUsuarioNome)
                      )}
                    </div>
                    
                    <div style={{ flex: 1, padding: 15, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 8, border: '1px dashed #3b82f6' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        {checkIsSender(detalhesTroca.deUsuarioId ?? detalhesTroca.DeUsuarioId, detalhesTroca.deUsuarioNome ?? detalhesTroca.DeUsuarioNome) ? 'EU PEÇO EM TROCA:' : 'ELE PEDE EM TROCA:'}
                      </span>
                      {renderMiniaturas(
                        detalhesTroca.querFigurinhasIds ?? detalhesTroca.QuerFigurinhasIds ?? detalhesTroca.quer ?? detalhesTroca.Quer ?? [],
                        checkIsSender(detalhesTroca.deUsuarioId ?? detalhesTroca.DeUsuarioId, detalhesTroca.deUsuarioNome ?? detalhesTroca.DeUsuarioNome)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              pendentes.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 20 }}>Nenhuma proposta pendente.</p>
              ) : (
                pendentes.map((t: any) => {
                  const id = t.id ?? t.Id;
                  const deId = t.deUsuarioId ?? t.DeUsuarioId;
                  const deNome = t.deUsuarioNome ?? t.DeUsuarioNome;
                  const paraNome = t.paraUsuarioNome ?? t.ParaUsuarioNome;
                  
                  const arrayOferece = t.ofereceFigurinhasIds ?? t.OfereceFigurinhasIds ?? t.oferece ?? t.Oferece ?? [];
                  const arrayQuer = t.querFigurinhasIds ?? t.QuerFigurinhasIds ?? t.quer ?? t.Quer ?? [];
                  
                  const isSender = checkIsSender(deId, deNome);

                  return (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid var(--border)', background: 'var(--surface)', marginBottom: 8, borderRadius: 6 }}>
                      <div>
                        <b style={{ fontSize: '0.9rem' }}>De: {deNome} | Para: {paraNome}</b><br/>
                        <span style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 'bold' }}>Oferece: {arrayOferece.length} figurinhas</span><br/>
                        <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold' }}>Pede: {arrayQuer.length} figurinhas</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button style={{ padding: '6px 10px', background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: '1.1rem' }} title="Ver detalhes da troca" onClick={() => setDetalhesTroca(t)}>
                          🔍
                        </button>

                        {!isSender && (
                          <button style={{ padding: '6px 12px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleResponder(id, 'aceitar')}>✔ Aceitar</button>
                        )}
                        
                        <button style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleResponder(id, 'cancelar')}>
                          ✖ {isSender ? 'Cancelar' : 'Recusar'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}