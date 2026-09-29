// src/pages/Album.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAlbums } from '../contexts/AlbumContext';
import { api } from '../services/api';

import { StickerCard } from '../components/StickerCard';
import type { Sticker } from '../components/StickerCard';
import { SynthesisMachine } from '../components/SynthesisMachine';
import { PackModal } from '../components/PackModal';
import { PackItem } from '../components/PackItem';
import { TradeModal } from '../components/TradeModal';
import { CoringaModal } from '../components/CoringaModal';
import { AdminModal } from '../components/AdminModal';
import { useAuth } from '../contexts/AuthContext';

export function Album() {
  const { t } = useTranslation();
  const { albumList, activeAlbum, isLoadingAlbum, switchAlbum } = useAlbums();

  const [isLegacyView, setIsLegacyView] = useState(false);

  useEffect(() => {
    setIsLegacyView(false);
  }, [activeAlbum?.id]);

  const displayedAlbum = (isLegacyView && activeAlbum?.subAlbum) 
    ? activeAlbum.subAlbum 
    : activeAlbum;

  const [inventory, setInventory] = useState<Sticker[]>([]);
  const [globalTrophies, setGlobalTrophies] = useState<Sticker[]>([]); // 🚀 NOVO ESTADO: Troféus Globais
  const [ownedPacks, setOwnedPacks] = useState<Record<string, number>>({});
  
  const [mainAlbumStats, setMainAlbumStats] = useState({ owned: 0, total: 1 });

  const [slotsBase, setSlotsBase] = useState<(Sticker | null)[]>([null, null, null]);
  const [slotCatalyst, setSlotCatalyst] = useState<Sticker | null>(null);
  const [forgeProbabilities, setForgeProbabilities] = useState<{success: number, same: number, jump: number, base: number, buff: number, extraCard: number, targetName: string | null, sameName: string} | null>(null);

  const [notificacoesTroca, setNotificacoesTroca] = useState(0);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [revealedStickers, setRevealedStickers] = useState<Sticker[]>([]);
  const [isOpening, setIsOpening] = useState(false);

  const [isCoringaModalOpen, setIsCoringaModalOpen] = useState(false);
  const [isExchangingCoringa, setIsExchangingCoringa] = useState(false);

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const currentUserId = String(user?.id || '1');

  const loadInventory = async () => {
    if (!displayedAlbum) return;
    try {
      // 1. Carrega o Inventário do Álbum Atual (Para a Coleção)
      const invResponse = await api.album.getInventory(displayedAlbum.id);
      const data = invResponse.data || invResponse;
      
      const rawFigurinhas = data.figurinhas || data.stickers || [];
      const qtdMap = rawFigurinhas.reduce((acc: any, item: any) => {
        const id = item.figurinhaId || item.FigurinhaId || item.stickerId || item.StickerId || item.id;
        const qtd = item.quantidade || item.Quantidade || item.quantity || item.Quantity || 0;
        if (id) acc[id] = qtd;
        return acc;
      }, {});

      const userInventory: Sticker[] = displayedAlbum.stickers.map((def) => {
        const rarity = displayedAlbum.rarities.find(r => r.id === def.rarityId);
        return {
          id: def.id, name: def.name, code: 'br', image: def.image,
          quantity: qtdMap[def.id] || 0, 
          isRare: def.rarityId !== 'r_base' && def.rarityId !== 'r_leg_comum', 
          color: rarity ? rarity.color : '#cbd5e1',
          isTrophy: def.isTrophy,
          isSecret: def.isSecret
        };
      });
      setInventory(userInventory);

      if (!isLegacyView && activeAlbum) {
        const normalStickers = userInventory.filter(s => !s.isSecret && !s.isTrophy && s.name !== 'Coringa' && s.name !== 'Itália' && !s.name.includes('Troféu') && !s.name.includes('Taça'));
        const ownedCount = normalStickers.filter(s => s.quantity > 0).length;
        setMainAlbumStats({ owned: ownedCount, total: normalStickers.length || 1 });
      }

      const rawPacotes = data.pacotes || data.packs || [];
      const packMap = rawPacotes.reduce((acc: any, item: any) => {
        const pId = item.tipoPacoteId || item.TipoPacoteId || item.packId || item.PackId || item.id;
        const pQtd = item.quantidade || item.Quantidade || item.quantity || item.Quantity || 0;
        if (pId) acc[pId] = pQtd;
        return acc;
      }, {});
      setOwnedPacks(packMap);

      // 🚀 2. BUSCA GLOBAL DE TROFÉUS (Para a Sala de Troféus unificada)
      let earnedTrophies: Sticker[] = [];
      const processTrophies = (albumDef: any, invData: any) => {
        if (!albumDef || !invData) return;
        const rawInv = invData.figurinhas || invData.stickers || [];
        const qMap = rawInv.reduce((acc: any, item: any) => {
          acc[item.figurinhaId || item.stickerId || item.id] = item.quantidade || item.quantity || 0;
          return acc;
        }, {});

        albumDef.stickers.filter((s: any) => s.isTrophy).forEach((s: any) => {
          if (qMap[s.id] > 0) { // 🔥 Regra Mestra: Só entra na sala se já tiver conquistado
            const rarity = albumDef.rarities.find((r: any) => r.id === s.rarityId);
            earnedTrophies.push({
              id: s.id, name: s.name, code: 'br', image: s.image,
              quantity: qMap[s.id], isRare: true, color: rarity ? rarity.color : '#FFD700',
              isTrophy: true, isSecret: s.isSecret
            });
          }
        });
      };

      // Vasculha o álbum principal
      const mainRes = await api.album.getInventory(activeAlbum.id);
      processTrophies(activeAlbum, mainRes.data || mainRes);

      // Vasculha o álbum legado (se existir)
      if (activeAlbum.subAlbum) {
        const legRes = await api.album.getInventory(activeAlbum.subAlbum.id);
        processTrophies(activeAlbum.subAlbum, legRes.data || legRes);
      }

      setGlobalTrophies(earnedTrophies);

    } catch (error) {
      console.error("Erro ao carregar inventário:", error);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [displayedAlbum, isLegacyView]);

  useEffect(() => {
    const token = localStorage.getItem('bolao_token'); // ou a forma que você pega seu token
    if (token) {
      fetch('http://localhost:5000/api/v1/mercado-trocas/pendentes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.trocas) {
          // OPCIONAL: Filtre para notificar apenas as trocas em que o usuário tem que responder (se tiver como validar).
          // Se quiser apenas mostrar o total geral, use: setNotificacoesTroca(data.trocas.length);
          setNotificacoesTroca(data.trocas.length);
        }
      })
      .catch(err => console.error("Erro ao buscar notificações do mercado:", err));
    }
  }, []);

  useEffect(() => {
    if (!displayedAlbum || inventory.length === 0) return;

    const checkAndClaimTrophy = async () => {
      const normalStickers = inventory.filter(s => !s.isSecret && !s.isTrophy);
      const uniqueOwned = normalStickers.filter(s => s.quantity > 0).length;
      const totalNormal = normalStickers.length;

      if (totalNormal > 0 && uniqueOwned === totalNormal) {
        const trophySticker = inventory.find(s => s.isTrophy);
        if (trophySticker && trophySticker.quantity === 0) {
          try {
            const token = localStorage.getItem('bolao_token');
            const res = await fetch(`http://localhost:5000/api/v1/albuns/${displayedAlbum.id}/completar`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });

            if (res.ok) {
              alert(`🏆 Parabéns! Você completou a coleção e recebeu o prêmio: ${trophySticker.name}!`);
              loadInventory(); 
            }
          } catch (e) {
            console.error("Erro ao resgatar troféu automático", e);
          }
        }
      }
    };

    checkAndClaimTrophy();
  }, [inventory, displayedAlbum]);

  useEffect(() => {
    const simulateForge = async () => {
      const isReady = slotsBase.every(s => s !== null);
      
      // A Forja de Risco OBRIGA a ter o catalisador preenchido para simular
      if (!isReady || (isLegacyView && !slotCatalyst)) {
        setForgeProbabilities(null);
        return;
      }

      try {
        const baseIds = slotsBase.map(s => s!.id as string);
        const catalystId = slotCatalyst ? (slotCatalyst.id as string) : null;
        const token = localStorage.getItem('bolao_token');
        
        // Se estiver no legado, chama a API da forja. Se não, chama a da síntese normal
        const endpoint = isLegacyView ? 'forja/simular' : 'sintese/simular';

        const res = await fetch(`http://localhost:5000/api/v1/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ stickerIds: baseIds, catalystId: catalystId })
        });

        if (res.ok) {
          const data = await res.json();
          setForgeProbabilities({
            success: Math.round(data.successChance * 100),
            same: Math.round(data.sameChance * 100),
            jump: Math.round(data.jumpChance * 100),
            base: Math.round((data.baseSuccessChance || data.baseSuccess || 0) * 100),
            buff: Math.round((data.catalystBonus || data.forgeBonus || 0) * 100),
            extraCard: Math.round((data.bonusCardChance || 0) * 100),
            targetName: data.targetRarityName || null,
            sameName: data.sameRarityName || data.baseRarityName || "Mesma Raridade",
            // Propriedade exclusiva da Forja de Risco:
            explosion: data.explosionChance !== undefined ? Math.round(data.explosionChance * 100) : 0 
          });
        } else {
          setForgeProbabilities(null);
        }
      } catch (err) {
        console.error("Erro ao simular", err);
        setForgeProbabilities(null);
      }
    };

    simulateForge();
  }, [slotsBase, slotCatalyst, isLegacyView]);

  if (!activeAlbum || !displayedAlbum) {
    return (
      <div className="section active" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Nenhum álbum ativo no momento.</h2>
      </div>
    );
  }

  const handleStickerClick = (sticker: Sticker) => {
    if (sticker.name === 'Coringa' || sticker.name.toLowerCase().includes('coringa')) {
        if (sticker.quantity > 0) setIsCoringaModalOpen(true);
        else alert('Você não possui nenhum Coringa disponível.');
        return;
    }

    if (sticker.isTrophy || sticker.isSecret) {
      alert('⚠️ Figurinhas Especiais e Troféus não podem ser sintetizadas!');
      return;
    }

    const inBase = slotsBase.filter(s => s?.id === sticker.id).length;
    const inCatalyst = slotCatalyst?.id === sticker.id ? 1 : 0;
    const usedInMachine = inBase + inCatalyst;
    const availableToUse = sticker.quantity - 1 - usedInMachine;

    if (availableToUse <= 0) {
      alert(sticker.quantity === 0 ? 'Você não tem essa figurinha.' : '🔒 Cópia original protegida no álbum!');
      return;
    }

    const emptyBaseIndex = slotsBase.indexOf(null);
    if (emptyBaseIndex !== -1) {
      const newSlots = [...slotsBase];
      newSlots[emptyBaseIndex] = sticker;
      setSlotsBase(newSlots);
      return;
    }

    if (!slotCatalyst) {
      // 🚀 A MÁGICA: Se for o álbum moderno, bloqueia carta rara. Se for o Legado (Risco), permite tudo!
      if (!isLegacyView && sticker.isRare) {
        alert('⚠️ O Catalisador aceita APENAS figurinhas Comuns.');
      } else {
        setSlotCatalyst(sticker);
      }
      return;
    }

    alert('⚠️ A máquina já está cheia!');
  };

  const handleForjaRisco = async () => {
    if (slotsBase.includes(null) || !slotCatalyst) { 
      alert("⚠️ Preencha os 3 slots base E o slot de risco para apostar!"); 
      return; 
    }
    if (isOpening) return;
    setIsOpening(true);

    try {
      const baseIds = slotsBase.map(s => s!.id as string);
      const riskId = slotCatalyst.id as string;
      const token = localStorage.getItem('bolao_token');
      
      // Chamando a rota correta da Forja de Risco
      const res = await fetch(`http://localhost:5000/api/v1/forja/executar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ stickerIds: baseIds, catalystId: riskId }) 
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao executar forja de risco.');

      // Limpa a máquina independentemente do resultado
      setSlotsBase([null, null, null]);
      setSlotCatalyst(null);

      // Verifica o status de explosão mapeado pelo C#
      if (data.status === 'explosion') {
        alert("💥 KABOOM!!! A máquina sobrecarregou e desintegrou suas figurinhas! Você perdeu tudo.");
        loadInventory();
      } else if (data.results && data.results.length > 0) {
        const mappedStickers = data.results.map((s: any) => ({
          id: s.stickerId || s.id, name: s.name, image: s.image, isRare: s.rarityId !== 'r_base'
        }));
        setRevealedStickers(mappedStickers);
        setIsPackModalOpen(true);
      } else {
        alert("Forja concluída com sucesso! (Nenhuma carta retornada no visual)");
        loadInventory(); 
      }
    } catch (error: any) { 
      alert(`❌ Erro na Forja: ${error.message}`); 
    } finally {
      setIsOpening(false);
    }
  };

  const handleOpenPack = async (packId: string) => {
    if (isOpening) return;
    setIsOpening(true);

    try {
      const response = await api.album.openPack(packId);
      const result = response.data || response; 

      if (!result.stickers || result.stickers.length === 0) throw new Error("O pacote veio vazio!");

      const mappedStickers = result.stickers.map((s: any) => ({
        id: s.stickerId, name: s.name, image: s.image, isRare: s.rarityId !== 'r_base' && s.rarityId !== 'r_leg_comum'
      }));

      setRevealedStickers(mappedStickers);
      setIsPackModalOpen(true);
    } catch (error: any) {
      alert(`❌ Erro ao abrir pacote: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsOpening(false);
    }
  };

  const handleOpenAllPacks = async () => {
    if (isOpening || userPacksToRender.length === 0) return;
    setIsOpening(true);

    try {
      let allDrawnStickers: any[] = [];
      for (const pack of userPacksToRender) {
        const response = await api.album.openPack(pack.id);
        const result = response.data || response;
        if (result.stickers) allDrawnStickers = [...allDrawnStickers, ...result.stickers];
      }

      if (allDrawnStickers.length === 0) throw new Error("Os pacotes vieram vazios!");

      const mappedStickers = allDrawnStickers.map((s: any) => ({
        id: s.stickerId, name: s.name, image: s.image, isRare: s.rarityId !== 'r_base' && s.rarityId !== 'r_leg_comum'
      }));

      setRevealedStickers(mappedStickers);
      setIsPackModalOpen(true);
    } catch (error: any) {
      alert(`❌ Erro ao abrir pacotes: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsOpening(false);
    }
  };

  const handleUseCoringa = async (targetStickerId: string) => {
    setIsExchangingCoringa(true);
    try {
      const token = localStorage.getItem('bolao_token');
      const res = await fetch(`http://localhost:5000/api/v1/inventario/coringa/usar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ targetStickerId: targetStickerId })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Falha ao trocar a figurinha.');
      }

      const data = await res.json();
      setIsCoringaModalOpen(false);

      const mappedStickers = data.results ? data.results.map((s: any) => ({
        id: s.stickerId, name: s.name, image: s.image, isRare: s.rarityId !== 'r_base'
      })) : [displayedAlbum.stickers.find(s => s.id === targetStickerId)];

      setRevealedStickers(mappedStickers);
      setIsPackModalOpen(true); 
    } catch (error: any) {
      alert(`❌ Erro ao usar Coringa: ${error.message}`);
    } finally {
      setIsExchangingCoringa(false);
    }
  };

  const handleClosePackModal = () => {
    setIsPackModalOpen(false);
    setRevealedStickers([]);
    loadInventory(); 
  };

  const handleGrantPack = async (packId: string, packName: string) => {
    try {
      const token = localStorage.getItem('bolao_token');
      const res = await fetch(`http://localhost:5000/api/v1/albuns/pacotes/conceder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: Number(currentUserId), packId: packId, quantity: 1, origin: "Painel Admin" })
      });
      if (!res.ok) throw new Error('Falha ao conceder');
      loadInventory(); 
    } catch (error: any) {
      alert(`❌ Erro: ${error.message}`);
    }
  };

  const handleSynthesize = async () => {
    if (slotsBase.includes(null)) { alert("⚠️ Preencha os 3 slots base para forjar!"); return; }
    if (isOpening) return;
    setIsOpening(true);

    try {
      const baseIds = slotsBase.map(s => s!.id as string);
      const catalystId = slotCatalyst ? (slotCatalyst.id as string) : null;
      const token = localStorage.getItem('bolao_token');
      
      const res = await fetch(`http://localhost:5000/api/v1/sintese/executar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ stickerIds: baseIds, catalystId: catalystId })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Falha ao executar síntese no servidor.');
      }

      const data = await res.json();
      setSlotsBase([null, null, null]);
      setSlotCatalyst(null);

      if (data.results && data.results.length > 0) {
        const mappedStickers = data.results.map((s: any) => ({
          id: s.stickerId, name: s.name, image: s.image, isRare: s.rarityId !== 'r_base'
        }));
        setRevealedStickers(mappedStickers);
        setIsPackModalOpen(true);
      } else {
        alert("Forja concluída com sucesso! (Nenhuma carta retornada no visual)");
        loadInventory(); 
      }
    } catch (error: any) { 
      alert(`❌ Erro na Síntese: ${error.message}`); 
    } finally {
      setIsOpening(false);
    }
  };

  const handleRemoveBase = (index: number) => {
    const newSlots = [...slotsBase];
    newSlots[index] = null;
    setSlotsBase(newSlots);
  };
  
  const handleRemoveCatalyst = () => setSlotCatalyst(null);

  const collectionCount = inventory.filter(item => item.quantity > 0 && !item.isSecret && !item.isTrophy).length;
  const normalStickersTotal = displayedAlbum.stickers.filter(s => !s.isSecret && !s.isTrophy).length;
  const isMainAlbumComplete = mainAlbumStats.owned >= mainAlbumStats.total;

  const userPacksToRender: any[] = [];
  displayedAlbum.packs.forEach(packDef => {
    const qty = ownedPacks[packDef.id] || 0;
    for (let i = 0; i < qty; i++) {
      userPacksToRender.push({ ...packDef, uniqueInstanceId: `${packDef.id}-${i}` });
    }
  });

  const themeAccent = isLegacyView ? '#d4c4a8' : 'var(--gold)';
  const themeBg = isLegacyView ? 'linear-gradient(135deg, #1f1606, #0a0802)' : 'var(--card)';
  const themeBorder = isLegacyView ? '#9c7331' : 'var(--border)';

  return (
    <div className="section active">
      
      {/* 1. SELETOR DE ÁLBUNS PRINCIPAIS */}
      <div style={{ marginBottom: activeAlbum.subAlbum ? '16px' : '24px' }}>
        <select 
          value={activeAlbum.id} 
          onChange={(e) => switchAlbum(Number(e.target.value))}
          style={{ 
            width: '100%', padding: '12px 15px', borderRadius: '12px', 
            background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', 
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', fontWeight: 700, 
            textTransform: 'uppercase', cursor: 'pointer', outline: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}
        >
          {albumList.map((a) => (
            <option key={a.id || a.Id} value={a.id || a.Id}>
              {(a.isPrincipal || a.IsPrincipal) ? '🌟' : '📁'} {a.name || a.Nome}
            </option>
          ))}
        </select>
      </div>

      {/* 2. BOTÕES CLÁSSICOS DE ALTERNÂNCIA (Exatamente igual antes, embaixo do menu) */}
      {activeAlbum.subAlbum && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--card)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setIsLegacyView(false)} 
            style={{ flex: 1, padding: '12px', background: !isLegacyView ? 'var(--pitch)' : 'transparent', color: !isLegacyView ? 'var(--gold)' : 'var(--muted)', border: 'none', borderRadius: '8px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', transition: '0.2s' }}
          >
            📖 {activeAlbum.name}
          </button>
          <button 
            onClick={() => {
                if (!isMainAlbumComplete) alert(`🔒 Complete o ${activeAlbum.name} primeiro!`);
                else setIsLegacyView(true);
            }} 
            style={{ flex: 1, padding: '12px', background: isLegacyView ? 'linear-gradient(135deg, #2d1f05, #1a1408)' : 'transparent', color: isLegacyView ? '#d4c4a8' : 'var(--muted)', border: 'none', borderRadius: '8px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', cursor: isMainAlbumComplete ? 'pointer' : 'not-allowed', opacity: isMainAlbumComplete ? 1 : 0.6, transition: '0.2s' }}
          >
            🏛️ {activeAlbum.subAlbum.name} {!isMainAlbumComplete && '🔒'}
          </button>
        </div>
      )}

      {isAdmin && (
        <button 
          onClick={() => setIsAdminModalOpen(true)}
          style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', width: '100%', marginBottom: '20px' }}
        >
          ⚙️ Painel Admin
        </button>
      )}

      {isLoadingAlbum && (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--green)', fontWeight: 'bold', background: 'var(--surface)', borderRadius: '12px', marginBottom: '20px' }}>
          ⏳ Carregando os dados da coleção...
        </div>
      )}

      {/* 🚀 TELA DE BLOQUEIO DO LEGADO */}
      {isLegacyView && !isMainAlbumComplete && (
        <div style={{ background: 'linear-gradient(135deg, #1a1408, #2d1f05)', border: '1px solid #d4c4a8', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', color: '#d4c4a8', fontFamily: "'Barlow Condensed', sans-serif" }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>🏛️🔒</div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Álbum Legado Bloqueado</h3>
          <p style={{ fontSize: '1rem', color: 'rgba(200,169,110,0.7)', marginBottom: '25px', fontFamily: "'Inter', sans-serif" }}>Complete o Álbum da Copa 2026 para desbloquear esta relíquia histórica.<br/>Cada figurinha conquistada te aproxima da era Jules Rimet!</p>
          <div style={{ maxWidth: '350px', margin: '0 auto', background: 'rgba(200,169,110,0.15)', height: '10px', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${(mainAlbumStats.owned / mainAlbumStats.total) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #d4c4a8, #9c7331)', transition: 'width 0.6s' }}></div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'rgba(200,169,110,0.6)', fontFamily: "'Inter', sans-serif" }}>
            {mainAlbumStats.owned} / {mainAlbumStats.total} figurinhas
          </div>
        </div>
      )}

      {/* 🚀 CONTEÚDO DO ÁLBUM LIBERADO */}
      {(!isLegacyView || (isLegacyView && isMainAlbumComplete)) && (
        <>
          {/* BANNER DINÂMICO PARA SUB-ÁLBUNS */}
          {isLegacyView && (
            <div style={{ background: 'linear-gradient(135deg, #2d1f05, #120c02)', padding: '25px', borderRadius: '12px', border: '1px solid #4a381c', marginBottom: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'repeating-linear-gradient(45deg, #000, #000 15px, transparent 15px, transparent 30px)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.2rem', color: '#9c7331', textTransform: 'uppercase', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  🏛️ {displayedAlbum.name}
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'rgba(212,196,168,0.7)', margin: '0 0 15px 0' }}>{displayedAlbum.description || (displayedAlbum as any).desc}</p>
                <div style={{ fontSize: '1.1rem', color: '#d4c4a8', fontWeight: 'bold', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
                  Coleção: <span style={{ color: '#f5c842' }}>{collectionCount}/{normalStickersTotal}</span>
                </div>
              </div>
            </div>
          )}

          {/* SESSÃO DE PACOTES (Apenas no Álbum Principal) */}
          {!isLegacyView && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', color: 'var(--green)', textTransform: 'uppercase', margin: 0 }}>
                  {t('album.availablePacks')} ({userPacksToRender.length})
                </h3>
                {userPacksToRender.length > 1 && (
                  <button onClick={handleOpenAllPacks} disabled={isOpening} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: isOpening ? 'not-allowed' : 'pointer', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {isOpening ? 'Abrindo...' : '🚀 Abrir Todos'}
                  </button>
                )}
              </div>

              <div className="pack-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {userPacksToRender.map((pack) => (
                  <div key={pack.uniqueInstanceId} onClick={() => handleOpenPack(pack.id)} style={{ cursor: 'pointer' }}>
                    <PackItem type={pack.template} name={pack.name} amount={pack.amount} />
                  </div>
                ))}
                {userPacksToRender.length === 0 && (
                  <p style={{ color: 'var(--muted)', width: '100%', textAlign: 'center', margin: '20px 0' }}>Você não possui pacotinhos fechados no momento.</p>
                )}
              </div>
            </div>
          )}

          {/* 🚀 MÁQUINAS DE FORJA */}
          {!isLegacyView ? (
            <SynthesisMachine slotsBase={slotsBase} slotCatalyst={slotCatalyst} probabilities={forgeProbabilities} onRemoveBase={handleRemoveBase} onRemoveCatalyst={handleRemoveCatalyst} onSynthesize={handleSynthesize} />
          ) : (
            <div className="sintese-box" style={{ backgroundColor: '#fdf6e3', borderColor: '#d4c4a8', marginBottom: '20px', padding: '30px 20px', borderRadius: 12 }}>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.6rem', color: '#b4863c', marginBottom: '8px', textTransform: 'uppercase', textAlign: 'center' }}>⚡ Forja de Sobrecarga</h3>
              <p style={{ fontSize: '0.9rem', color: '#786445', marginBottom: '25px', textAlign: 'center', maxWidth: '80%', margin: '0 auto 25px auto' }}>
                Funda 3 figurinhas. <b>Aposta de Risco (Opcional):</b> Preencha o 4º slot para tentar ganhar DUAS figurinhas buffadas, mas cuidado... a máquina pode explodir!
              </p>
              
              <div className="sintese-layout" style={{ display: 'flex', justifyContent: 'center', gap: '50px', flexWrap: 'wrap', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#b4863c', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Base</div>
                  <div className="sintese-slots" style={{ margin: 0, display: 'flex', gap: '12px' }}>
                    {slotsBase.map((slot, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleRemoveBase(i)}
                        style={{ borderColor: '#d4c4a8', color: '#b4863c', width: '65px', height: '85px', borderStyle: slot ? 'solid' : 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', cursor: slot ? 'pointer' : 'default', background: slot ? '#fff' : 'rgba(212,196,168,0.2)', overflow: 'hidden' }}
                      >
                        {slot ? <img src={slot.image} alt={slot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '+'}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Slot de Risco</div>
                  <div 
                    onClick={handleRemoveCatalyst}
                    style={{ borderColor: '#ef4444', color: '#ef4444', background: slotCatalyst ? '#fff' : 'rgba(239,68,68,0.1)', width: '65px', height: '85px', borderStyle: slotCatalyst ? 'solid' : 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', cursor: slotCatalyst ? 'pointer' : 'default', overflow: 'hidden' }}
                  >
                    {slotCatalyst ? <img src={slotCatalyst.image} alt={slotCatalyst.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '+'}
                  </div>
                </div>
              </div>

              {/* 🚀 EXIBIÇÃO DINÂMICA DAS CHANCES DA FORJA */}
              {forgeProbabilities ? (
                <div style={{ width: '100%', maxWidth: 450, margin: '0 auto 20px auto', background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid #ef4444' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem' }}>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>💥 Risco de Explosão:</span>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{forgeProbabilities.explosion}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✨ Evoluir para {forgeProbabilities.targetName}:</span>
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{forgeProbabilities.success}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#786445' }}>
                    <span>Garantido: 2 Cartas {forgeProbabilities.sameName}</span>
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', maxWidth: 450, margin: '0 auto 20px auto', textAlign: 'center', background: 'rgba(120,100,69,0.1)', padding: '15px', borderRadius: '8px', color: '#786445', fontSize: '0.95rem' }}>
                  Insira as 4 figurinhas para visualizar as probabilidades de sucesso e risco...
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <button 
                  onClick={handleForjaRisco}
                  disabled={isOpening || slotsBase.includes(null)}
                  style={{ background: slotsBase.includes(null) ? '#786445' : (slotCatalyst ? '#b91c1c' : '#16a34a'), color: '#ffffff', padding: '14px 30px', borderRadius: '8px', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', cursor: (slotsBase.includes(null) || isOpening) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)' }}
                >
                  {isOpening ? '⏳ Processando...' : (slotsBase.includes(null) ? 'Insira 3 Bases' : (slotCatalyst ? '⚠️ Puxar Alavanca de Risco' : '⚡ Forja Segura (Sem Risco)'))}
                </button>
              </div>
            </div>
          )}

          {/* 🚀 BOTÃO DO MERCADO DE TROCAS */}
          <button 
            onClick={() => setIsTradeModalOpen(true)}
            style={{ background: '#0369a1', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', width: '100%', marginBottom: '20px', position: 'relative' }}
          >
            {t('album.btnTrade')}
            
            {/* 🚀 A MÁGICA: Só renderiza o span se o número de notificações for maior que zero */}
            {notificacoesTroca > 0 && (
              <span style={{ background: '#e11d48', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: '0.85rem', position: 'absolute', top: -8, right: -8, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {notificacoesTroca}
              </span>
            )}
          </button>

          {/* 🚀 SALA DE TROFÉUS GLOBAL (Alinhamento Simétrico Flexbox) */}
          {globalTrophies.length > 0 && (
            <div className="trophy-hall" style={{ 
              padding: '20px', 
              marginBottom: '20px', 
              background: isLegacyView ? 'linear-gradient(145deg, rgba(212, 196, 168, 0.1) 0%, rgba(156, 115, 49, 0.2) 100%)' : 'linear-gradient(145deg, rgba(255,215,0,0.05) 0%, rgba(255,215,0,0.15) 100%)', 
              border: `1px solid ${isLegacyView ? '#9c7331' : 'var(--gold)'}`, 
              borderRadius: '12px' 
            }}>
              
              {/* O Flexbox perfeito: Centraliza o conteúdo e dá o mesmo peso para os dois lados */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'flex-start', // Alinha pelo topo para que a base não fique torta
                gap: '20px',
                margin: '0 auto'
              }}>
                {globalTrophies.map(item => (
                  <div 
                    key={item.id} 
                    className="album-grid" 
                    style={{ 
                      display: 'grid',
                      gridTemplateColumns: '140px', /* Trava a largura da coluna de cada um */
                      margin: 0,
                      padding: 0
                    }}
                  >
                    <StickerCard 
                      sticker={item} 
                      availableQuantity={item.quantity} 
                      onClick={() => alert('🏆 Passiva Ativa!')} 
                    />
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* 🚀 COLEÇÃO E GRID */}
          <div style={{ background: themeBg, borderRadius: 12, border: `1px solid ${themeBorder}`, padding: 20 }}>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', color: themeAccent, textTransform: 'uppercase', marginBottom: '8px' }}>
              📜 Sua Coleção ({collectionCount}/{normalStickersTotal})
            </h3>

            {/* LEGENDA DE RARIDADES */}
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', flexWrap: 'wrap', marginBottom: '20px' }}>
              {displayedAlbum.rarities.filter((r: any) => !r.name.toLowerCase().includes('troféu')).map((r: any, idx: number, arr: any[]) => (
                <span key={r.id} style={{ color: r.color || '#cbd5e1', fontWeight: 'bold' }}>
                  {r.name} {idx < arr.length - 1 && <span style={{ color: 'var(--muted)', marginLeft: '8px' }}>·</span>}
                </span>
              ))}
            </div>

            <div className="album-grid">
              {[...inventory]
                .filter(item => {
                   if (item.isTrophy) return false;
                   if (item.isSecret && item.quantity === 0) return false;
                   return true;
                })
                .sort((a, b) => {
                  if (a.name.includes('Coringa')) return -1;
                  if (b.name.includes('Coringa')) return 1;
                  if (a.name === 'Itália') return 1;
                  if (b.name === 'Itália') return -1;
                  return a.name.localeCompare(b.name);
                })
                .map((item) => {
                  const inBase = slotsBase.filter(s => s?.id === item.id).length;
                  const inCatalyst = slotCatalyst?.id === item.id ? 1 : 0;
                  const availableVisual = item.quantity - (inBase + inCatalyst);

                  return (
                    <StickerCard
                      key={item.id}
                      sticker={item}
                      availableQuantity={availableVisual}
                      onClick={() => handleStickerClick(item)}
                    />
                  );
              })}
            </div>
          </div>
        </>
      )}

      {/* MODAIS */}
      <PackModal isOpen={isPackModalOpen} onClose={handleClosePackModal} revealedStickers={revealedStickers} />
      <TradeModal
        isOpen={isTradeModalOpen} // (Ou o nome do seu state de abrir/fechar)
        onClose={() => setIsTradeModalOpen(false)}
        myInventory={inventory} 
        albumId={displayedAlbum.id} 
        albumTotal={displayedAlbum.total} 
        isLegado={!displayedAlbum.isPrincipal}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        albumId={displayedAlbum.id}
      />
      
      <CoringaModal 
        isOpen={isCoringaModalOpen} 
        onClose={() => setIsCoringaModalOpen(false)} 
        availableStickers={inventory.filter(s => !s.isTrophy && !s.name.toLowerCase().includes('coringa') && !s.name.includes('Itália') && !s.name.includes('Taça'))}
        onConfirm={handleUseCoringa}
        isExchanging={isExchangingCoringa}
      />
    </div>
  );
}