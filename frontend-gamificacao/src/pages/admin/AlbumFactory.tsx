// src/pages/admin/AlbumFactory.tsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import type { Album, Rarity, Pack, StickerDef } from '../../contexts/AlbumContext';

// 🚀 Traduz o DTO do C# para o formato do Frontend (Blindado contra Maiúsculas/Minúsculas)
const mapAlbumFromApi = (data: any): Album => ({
  id: data.id || data.Id,
  name: data.nome || data.name || data.Nome || data.Name || 'Álbum',
  desc: data.descricao || data.desc || data.Descricao || data.Desc || '',
  total: data.total || data.Total || 0,
  isPrincipal: data.isPrincipal !== undefined ? data.isPrincipal : (data.IsPrincipal || false),
  permiteGameplay: data.permiteGameplay !== undefined ? data.permiteGameplay : (data.PermiteGameplay !== undefined ? data.PermiteGameplay : true),
  isFinalized: data.isFinalized !== undefined ? data.isFinalized : (data.IsFinalized || false),
  // 🚀 Tenta pegar a variável de todo jeito possível
  subAlbumId: data.subAlbumId !== undefined ? data.subAlbumId : (data.SubAlbumId !== undefined ? data.SubAlbumId : null),
  rarities: (data.raridades || data.rarities || data.Raridades || []).map((r: any) => ({
    id: r.id || r.Id, name: r.nome || r.name || r.Nome, color: r.corHex || r.color || r.Color || '#cbd5e1', weight: r.peso || r.weight || r.Weight || 1
  })),
  stickers: (data.figurinhas || data.stickers || data.Figurinhas || []).map((f: any) => ({
    id: f.id || f.Id, name: f.nome || f.name || f.Nome, rarityId: f.raridadeId || f.rarityId || f.RaridadeId, image: f.imagemUrl || f.image || f.Image || '',
    isSecret: f.isSecreta || f.isSecret || f.IsSecreta || false, isTrophy: f.isTrofeu || f.isTrophy || f.IsTrofeu || false,
    passiveDesc: f.passivaDesc || f.passiveDesc || f.PassivaDesc, passiveRule: f.passiva || f.passiveRule || f.Passiva
  })),
  packs: data.pacotes || data.packs || data.Pacotes || [] 
});

export function AlbumFactory() {
  const { t } = useTranslation();
  
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'rarities' | 'packs' | 'stickers' | 'preview'>('info');
  const [stickerSearch, setStickerSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        // 🚀 AGORA BATE NA ROTA DE ADMIN QUE NÃO TEM FILTROS
        const token = localStorage.getItem('bolao_token');
        const res = await fetch(`http://localhost:5000/api/v1/albuns/todos-admin`, {
          headers: { 
            'Content-Type': 'application/json', 
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}) 
          }
        });
        
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const mappedList = data.map(mapAlbumFromApi);
          setAlbums(mappedList);
          await loadFullAlbum(mappedList[0].id);
        }
      } catch (error) {
        console.error("Erro ao carregar álbuns para a fábrica:", error);
      }
    }
    fetchAlbums();
  }, []);

  const loadFullAlbum = async (id: number) => {
    if (id > 1000000000) {
      const local = albums.find(a => a.id === id);
      if (local) setSelectedAlbum(local);
      return;
    }
    try {
      const token = localStorage.getItem('bolao_token');
      const res = await fetch(`http://localhost:5000/api/v1/albuns/${id}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const fullData = await res.json();
      const mappedAlbum = mapAlbumFromApi(fullData.data || fullData);
      
      setSelectedAlbum(mappedAlbum);

      // 🚀 A MÁGICA DE ESTADO ACONTECE AQUI: Atualiza a lista geral com o vínculo recém-carregado
      setAlbums(prev => prev.map(a => a.id === mappedAlbum.id ? { ...a, subAlbumId: mappedAlbum.subAlbumId } : a));
    } catch (e) {
      console.error("Erro ao buscar detalhes do álbum:", e);
    }
  };

  const updateAlbum = (updates: Partial<Album>) => {
    if (!selectedAlbum) return;
    let updatedList = [...albums];

    if (updates.isPrincipal === true) {
      updatedList = updatedList.map(a => ({ ...a, isPrincipal: false }));
    }

    const updatedAlbum = { ...selectedAlbum, ...updates };
    updatedList = updatedList.map(a => a.id === updatedAlbum.id ? updatedAlbum : a);
    
    setSelectedAlbum(updatedAlbum);
    setAlbums(updatedList);
  };

  const safeStickers = selectedAlbum?.stickers || [];
  const safeRarities = selectedAlbum?.rarities || [];
  const safePacks = selectedAlbum?.packs || [];

  const normalStickersCount = safeStickers.filter(s => !s.isSecret).length;
  const secretStickersCount = safeStickers.filter(s => s.isSecret).length;
  const isLimitReached = normalStickersCount >= (selectedAlbum?.total || 100);

  const safeRemoveAlbum = async (albumId: number) => {
    const target = albums.find(a => a.id === albumId);
    if (target?.isFinalized) {
      alert(t('adminAlbums.cannotDeleteFinalized'));
      return;
    }
    if (window.confirm("Deseja realmente deletar este álbum?")) {
      try {
        if (albumId < 1000000000) {
          const token = localStorage.getItem('bolao_token');
          const res = await fetch(`http://localhost:5000/api/v1/admin/albuns/${albumId}`, {
            method: 'DELETE',
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
          });
          if (!res.ok) throw new Error("Erro na API ao tentar deletar o álbum.");
        }

        const remaining = albums.filter(a => a.id !== albumId);
        setAlbums(remaining);
        if (selectedAlbum?.id === albumId && remaining.length > 0) {
          loadFullAlbum(remaining[0].id);
        } else if (remaining.length === 0) {
          setSelectedAlbum(null);
        }
      } catch (e: any) {
        alert(`❌ ${e.message}`);
      }
    }
  };

  const safeRemoveRarity = (id: string) => {
    if (!selectedAlbum) return;
    if (safeStickers.some(s => s.rarityId === id)) {
      alert("⚠️ Não é possível excluir esta raridade pois existem figurinhas vinculadas a ela.");
      return;
    }
    if (window.confirm(t('adminAlbums.confirmDelete'))) {
      updateAlbum({ rarities: safeRarities.filter(r => r.id !== id) });
    }
  };

  const safeRemovePack = (packId: string) => {
    if (!selectedAlbum) return;
    if (window.confirm(t('adminAlbums.confirmDelete'))) {
      updateAlbum({ packs: safePacks.filter(p => p.id !== packId) });
    }
  };
  
  const safeRemoveSticker = (stickerId: string) => {
    if (!selectedAlbum) return;
    if (window.confirm(t('adminAlbums.confirmDelete'))) {
      updateAlbum({ stickers: safeStickers.filter(s => s.id !== stickerId) });
    }
  };

  const handleCreateAlbum = () => {
    const defaultRarityId = `r_${Date.now()}`;
    const trophyRarityId = `r_trophy_${Date.now()}`;
    const newAlbum: Album = { 
      id: Date.now(), name: 'Novo Álbum', desc: '', total: 100, 
      isPrincipal: false, permiteGameplay: true, 
      isFinalized: false, subAlbumId: null,
      rarities: [
        { id: defaultRarityId, name: 'Comum', color: '#cbd5e1', weight: 1 },
        { id: trophyRarityId, name: 'Troféu', color: '#fbbf24', weight: 999 }
      ], 
      packs: [], 
      stickers: [
        { id: `s_trophy_${Date.now()}`, name: 'Troféu Principal', rarityId: trophyRarityId, image: '', isSecret: true, isTrophy: true }
      ] 
    };
    setAlbums([...albums, newAlbum]);
    setSelectedAlbum(newAlbum);
    setActiveTab('info');
  };

  const handleAddRarity = () => {
    if (!selectedAlbum) return;
    updateAlbum({ rarities: [...safeRarities, { id: `r_${Date.now()}`, name: 'Nova Raridade', color: '#888888', weight: 1 }] });
  };

  const handleAddPack = () => {
    if (!selectedAlbum) return;
    updateAlbum({ packs: [...safePacks, { id: `p_${Date.now()}`, name: 'Novo Pacote', template: 'pack-3pts', amount: 5, behavior: 'standard', drops: {} }] });
  };

  const handleAddSticker = () => {
    if (!selectedAlbum || isLimitReached) return;
    const firstRarity = safeRarities[0]?.id || '';
    updateAlbum({ stickers: [{ id: `s_${Date.now()}`, name: 'Nova Figurinha', rarityId: firstRarity, image: '', isSecret: false }, ...safeStickers] });
    setStickerSearch('');
  };

  const handleUpdateRarity = (id: string, field: keyof Rarity, value: any) => {
    if (!selectedAlbum) return;
    updateAlbum({ rarities: safeRarities.map(r => r.id === id ? { ...r, [field]: value } : r) });
  };

  const handleUpdatePack = (id: string, field: keyof Pack, value: any) => {
    if (!selectedAlbum) return;
    updateAlbum({ packs: safePacks.map(p => p.id === id ? { ...p, [field]: value } : p) });
  };

  const handleUpdatePackDrop = (packId: string, rarityId: string, value: number) => {
    if (!selectedAlbum) return;
    updateAlbum({ packs: safePacks.map(p => p.id === packId ? { ...p, drops: { ...p.drops, [rarityId]: value } } : p) });
  };

  const handleUpdateSticker = (id: string, field: keyof StickerDef, value: any) => {
    if (!selectedAlbum) return;
    updateAlbum({ stickers: safeStickers.map(s => s.id === id ? { ...s, [field]: value } : s) });
  };

  const triggerImageUpload = (stickerId: string) => { 
    setUploadTargetId(stickerId); 
    fileInputRef.current?.click(); 
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTargetId) {
      const reader = new FileReader();
      reader.onloadend = () => handleUpdateSticker(uploadTargetId, 'image', reader.result as string);
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveToDatabase = async () => {
    if (!selectedAlbum) return;
    try {
      alert('Salvando e sincronizando com o banco de dados...');
      
      const isNew = selectedAlbum.id > 1000000000;
      const targetId = isNew ? 0 : selectedAlbum.id;
      
      const payloadToSave = { ...selectedAlbum, id: targetId };

      await api.admin.saveAlbum(targetId, payloadToSave);
      
      alert('✅ Álbum salvo com sucesso no banco de dados!');
      window.location.reload(); 
    } catch (error: any) {
      alert(`❌ Falha ao salvar álbum: ${error.message}`);
    }
  };

  const filteredStickers = safeStickers.filter(s => s.name.toLowerCase().includes(stickerSearch.toLowerCase()));

  const handleMigrateMock = async () => {
    const FLAG_MAP: Record<string, string> = {
      "México":"mx", "África do Sul":"za", "Coreia do Sul":"kr", "Rep. Tcheca":"cz", "Canadá":"ca", "Bósnia e Herzegovina":"ba", "Catar":"qa", "Suíça":"ch", "Marrocos":"ma", "Haiti":"ht", "Escócia":"gb-sct", "Estados Unidos":"us", "Paraguai":"py", "Austrália":"au", "Turquia":"tr", "Curaçau":"cw", "Costa do Marfim":"ci", "Equador":"ec", "Japão":"jp", "Suécia":"se", "Tunísia":"tn", "Cabo Verde":"cv", "Arábia Saudita":"sa", "Egito":"eg", "Irã":"ir", "Nova Zelândia":"nz", "Senegal":"sn", "Iraque":"iq", "Noruega":"no", "Argélia":"dz", "Áustria":"at", "Jordânia":"jo", "RD do Congo":"cd", "Croácia":"hr", "Gana":"gh", "Panamá":"pa", "Uzbequistão":"uz", "Colômbia":"co", "🇧🇷 Brasil":"br", "Argentina":"ar", "França":"fr", "Inglaterra":"gb-eng", "Espanha":"es", "Alemanha":"de", "Portugal":"pt", "Holanda":"nl", "Bélgica":"be", "Uruguai":"uy"
    };

    const rarities: Rarity[] = [
      { id: 'r_base', name: 'Comum', color: '#cbd5e1', weight: 1 },
      { id: 'r_rara', name: 'Rara', color: '#fbbf24', weight: 5 },
      { id: 'r_tradicao', name: 'Tradição', color: '#555555', weight: 10 },
      { id: 'r_coringa', name: 'Coringa', color: '#a855f7', weight: 50 },
      { id: 'r_trofeu', name: 'Troféu', color: '#FFD700', weight: 999 }
    ];

    const packs: Pack[] = [
      { id: 'p_comum', name: 'Pacote Normal', template: 'pack-3pts', amount: 1, behavior: 'standard', drops: { r_base: 95.45, r_rara: 4, r_coringa: 0.4, r_tradicao: 0.15, r_trofeu: 0 } },
      { id: 'p_dourado', name: 'Pacote Dourado', template: 'pack-5pts', amount: 1, bonusTiers: [{ chance: 60, amount: 1 }], behavior: 'standard', drops: { r_base: 92.05, r_rara: 7, r_coringa: 0.7, r_tradicao: 0.25, r_trofeu: 0 } }
    ];

    const stickers: StickerDef[] = [];
    const raras = ["🇧🇷 Brasil", "Argentina", "França", "Inglaterra", "Espanha", "Alemanha", "Portugal", "Holanda", "Bélgica", "Uruguai"];
    raras.forEach((nome, i) => stickers.push({ id: `rara_${i}`, name: nome, rarityId: 'r_rara', image: `https://flagcdn.com/w160/${FLAG_MAP[nome]}.png`, isSecret: false }));

    const comuns = ["México", "África do Sul", "Coreia do Sul", "Rep. Tcheca", "Canadá", "Bósnia e Herzegovina", "Catar", "Suíça", "Marrocos", "Haiti", "Escócia", "Estados Unidos", "Paraguai", "Austrália", "Turquia", "Curaçau", "Costa do Marfim", "Equador", "Japão", "Suécia", "Tunísia", "Cabo Verde", "Arábia Saudita", "Egito", "Irã", "Nova Zelândia", "Senegal", "Iraque", "Noruega", "Argélia", "Áustria", "Jordânia", "RD do Congo", "Croácia", "Gana", "Panamá", "Uzbequistão", "Colômbia"];
    comuns.forEach((nome, i) => stickers.push({ id: `comum_${i}`, name: nome, rarityId: 'r_base', image: `https://flagcdn.com/w160/${FLAG_MAP[nome]}.png`, isSecret: false }));

    stickers.push({ id: 'sp_coringa', name: 'Coringa', rarityId: 'r_coringa', isSecret: true, image: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Joker.png', passiveDesc: 'Troca Universal', passiveRule: '{"action":"wildcard_exchange"}' });
    stickers.push({ id: 'sp_italia', name: 'Itália', rarityId: 'r_tradicao', isSecret: true, image: 'https://flagcdn.com/w160/it.png', passiveDesc: '+1% Drop Raro', passiveRule: '{"action":"buff_global_drop", "amount": 0.01}' });
    stickers.push({ id: 'sp_trofeu', name: 'Troféu Copa 26', rarityId: 'r_trofeu', isSecret: true, image: 'https://img.icons8.com/color/512/world-cup.png', passiveDesc: '+10% Figurinha Extra', passiveRule: '{"action":"buff_extra_drop", "chance": 0.10}', isTrophy: true });

    const mockAlbum: Album = { id: 1, name: 'Copa do Mundo 2026', desc: 'Edição Completa', total: 48, isPrincipal: true, permiteGameplay: true, isFinalized: false, rarities, packs, stickers };

    try {
      alert('Enviando dados da Copa 2026 para o C#...');
      await api.admin.saveAlbum(mockAlbum.id, mockAlbum);
      alert('✅ Banco populado com sucesso! Recarregando...');
      window.location.reload();
    } catch (error: any) {
      alert(`❌ Erro da API: ${error.message}`);
    }
  };

  const handleGenerateLegacyAlbum = async () => {
    const rarities = [
      { id: "r_leg_comum", name: "Comum Legada", color: "#d4c4a8", weight: 10 },
      { id: "r_leg_rara", name: "Rara Legada", color: "#FFD700", weight: 20 },
      { id: "r_leg_lendaria", name: "Lendária Legada", color: "#00e5ff", weight: 30 },
      { id: "r_leg_tradicao", name: "Tradição Legada", color: "#f5c842", weight: 150 },
      { id: "r_leg_trofeu", name: "Troféu Legado", color: "#b5860a", weight: 250 }
    ];

    const stickers = [
      { id: "f_leg_be", name: "Bélgica 70", rarityId: "r_leg_comum", image: "https://flagcdn.com/w160/be.png", isSecret: false, isTrophy: false },
      { id: "f_leg_bg", name: "Bulgária 70", rarityId: "r_leg_comum", image: "https://flagcdn.com/w160/bg.png", isSecret: false, isTrophy: false },
      { id: "f_leg_cz", name: "Tchecoslováquia 70", rarityId: "r_leg_comum", image: "https://flagcdn.com/w160/cz.png", isSecret: false, isTrophy: false },
      { id: "f_leg_sv", name: "El Salvador 70", rarityId: "r_leg_comum", image: "https://flagcdn.com/w160/sv.png", isSecret: false, isTrophy: false },
      { id: "f_leg_il", name: "Israel 70", rarityId: "r_leg_comum", image: "https://flagcdn.com/w160/il.png", isSecret: false, isTrophy: false },
      { id: "f_leg_ma", name: "Marrocos 70", rarityId: "r_leg_comum", image: "https://flagcdn.com/w160/ma.png", isSecret: false, isTrophy: false },
      { id: "f_leg_ro", name: "Romênia 70", rarityId: "r_leg_comum", image: "https://flagcdn.com/w160/ro.png", isSecret: false, isTrophy: false },
      { id: "f_leg_se", name: "Suécia 70", rarityId: "r_leg_comum", image: "https://flagcdn.com/w160/se.png", isSecret: false, isTrophy: false },

      { id: "f_leg_it", name: "Itália 70", rarityId: "r_leg_rara", image: "https://flagcdn.com/w160/it.png", isSecret: false, isTrophy: false },
      { id: "f_leg_uy", name: "Uruguai 70", rarityId: "r_leg_rara", image: "https://flagcdn.com/w160/uy.png", isSecret: false, isTrophy: false },
      { id: "f_leg_de", name: "Alemanha Oc. 70", rarityId: "r_leg_rara", image: "https://flagcdn.com/w160/de.png", isSecret: false, isTrophy: false },
      { id: "f_leg_gb", name: "Inglaterra 70", rarityId: "r_leg_rara", image: "https://flagcdn.com/w160/gb-eng.png", isSecret: false, isTrophy: false },
      { id: "f_leg_pe", name: "Peru 70", rarityId: "r_leg_rara", image: "https://flagcdn.com/w160/pe.png", isSecret: false, isTrophy: false },
      { id: "f_leg_mx", name: "México 70", rarityId: "r_leg_rara", image: "https://flagcdn.com/w160/mx.png", isSecret: false, isTrophy: false },
      { id: "f_leg_ru", name: "URSS 70", rarityId: "r_leg_rara", image: "https://flagcdn.com/w160/ru.png", isSecret: false, isTrophy: false },

      { id: "f_leg_br", name: "Brasil 70", rarityId: "r_leg_lendaria", image: "https://flagcdn.com/w160/br.png", isSecret: false, isTrophy: false },

      { id: "f_leg_ar", name: "Argentina 70", rarityId: "r_leg_tradicao", image: "https://flagcdn.com/w160/ar.png", isSecret: true, isTrophy: false, passiveDesc: "+5% de chance de Legada Rara", passiveRule: '{"action":"buff_legacy_rare", "amount": 0.05}' },
      { id: "f_leg_taca", name: "Taça Jules Rimet", rarityId: "r_leg_trofeu", image: "julesrimet.png", isSecret: true, isTrophy: true, passiveDesc: "+10% de figurinha extra", passiveRule: '{"action":"buff_extra_drop", "chance": 0.10}' }
    ];

    const packs = [
      {
        id: "p_leg_1970",
        name: "Pacote Relíquia 1970",
        template: "legado",
        amount: 3,
        behavior: "standard",
        drops: { 
          "r_leg_comum": 80.0, 
          "r_leg_rara": 18.0, 
          "r_leg_lendaria": 2.0 
        },
        bonusTiers: [
          { chance: 5.0, amount: 1 }
        ]
      }
    ];

    const mockLegacyAlbum = { 
      id: 2, 
      name: 'Copa 1970 (Legado)', 
      desc: 'A última Copa da Taça Jules Rimet · México 1970', 
      total: 16, 
      isPrincipal: false, 
      permiteGameplay: true, 
      isFinalized: false, 
      rarities, 
      packs, 
      stickers 
    };

    try {
      alert('Enviando dados do Álbum Legado 1970 para o C#...');
      await api.admin.saveAlbum(mockLegacyAlbum.id, mockLegacyAlbum);
      alert('🏛️ Álbum Legado gerado com sucesso no banco de dados! Recarregando...');
      window.location.reload();
    } catch (error: any) {
      alert(`❌ Erro ao gerar Legado: ${error.message}`);
    }
  };

  if (!selectedAlbum) {
    return (
      <div style={{ maxWidth: '800px', margin: '50px auto', textAlign: 'center', background: 'var(--card)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', color: 'var(--text)' }}>Banco de Dados Vazio</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>Nenhum álbum foi encontrado no backend. Você pode iniciar do zero ou popular o banco com o mock antigo.</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button onClick={handleCreateAlbum} style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
            + Criar Álbum Vazio
          </button>
          <button onClick={handleMigrateMock} style={{ padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
            🚀 Injetar Mock da Copa 2026
          </button>
          <button 
            onClick={handleGenerateLegacyAlbum}
            style={{ 
              background: 'linear-gradient(135deg, #9c7331, #f5c842)', 
              color: '#111', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              fontFamily: "'Barlow Condensed', sans-serif", 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            🏛️ INJETAR ÁLBUM LEGADO (1970)
          </button>
        </div>
      </div>
    );
  }

  // --- REGRAS DE VÍNCULO DE ÁLBUNS ---
  const isChildOfAnother = selectedAlbum ? albums.some(a => a.subAlbumId === selectedAlbum.id) : false;
  
  const availableSubAlbums = selectedAlbum ? albums.filter(option => {
    if (option.id === selectedAlbum.id) return false;
    if (option.id === selectedAlbum.subAlbumId) return true; 
    
    const isClaimed = albums.some(a => a.id !== selectedAlbum.id && a.subAlbumId === option.id);
    if (isClaimed) return false;
    
    if (option.subAlbumId != null) return false;
    
    return true;
  }) : [];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <input type="file" accept="image/png, image/jpeg, image/gif" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', color: '#3b82f6', textTransform: 'uppercase', margin: '0 0 5px 0' }}>{t('adminAlbums.title')}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>{t('adminAlbums.desc')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* BARRA LATERAL - ÁLBUNS */}
        <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '15px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <button onClick={handleCreateAlbum} style={{ width: '100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t('adminAlbums.createNew')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}>
            {albums.map(album => (
              <div key={album.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px', background: selectedAlbum.id === album.id ? '#eff6ff' : 'transparent', border: `1.5px solid ${selectedAlbum.id === album.id ? '#3b82f6' : 'transparent'}` }}>
                <div onClick={() => loadFullAlbum(album.id)} style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: selectedAlbum.id === album.id ? '#1e3a8a' : 'var(--text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {album.name} {album.isFinalized && <span style={{ fontSize: '0.7rem' }}>🔒</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {album.isPrincipal ? '🌟 Principal' : album.permiteGameplay ? '🎮 Ativo' : '🏛️ Histórico'}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); safeRemoveAlbum(album.id); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}>🗑️</button>
              </div>
            ))}
          </div>
        </div>

        {/* EDITOR PRINCIPAL */}
        <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '650px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)', borderRadius: '12px 12px 0 0', overflowX: 'auto', flexShrink: 0 }}>
            {['info', 'rarities', 'packs', 'stickers', 'preview'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} style={{ flex: 1, minWidth: '100px', padding: '14px', background: 'none', border: 'none', borderBottom: `3px solid ${activeTab === tab ? '#3b82f6' : 'transparent'}`, color: activeTab === tab ? '#3b82f6' : 'var(--muted)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                {t(`adminAlbums.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
              </button>
            ))}
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            
            {activeTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
                <div className="user-select-wrap" style={{ marginBottom: 0 }}>
                  <label>{t('adminAlbums.formName')}</label>
                  <input type="text" value={selectedAlbum.name} onChange={e => updateAlbum({ name: e.target.value })} disabled={selectedAlbum.isFinalized} />
                </div>
                <div className="user-select-wrap" style={{ marginBottom: 0 }}>
                  <label>{t('adminAlbums.formDesc')}</label>
                  <input type="text" value={selectedAlbum.desc} onChange={e => updateAlbum({ desc: e.target.value })} disabled={selectedAlbum.isFinalized} />
                </div>
                <div className="user-select-wrap" style={{ marginBottom: 0 }}>
                  <label>{t('adminAlbums.formTotalStickers')}</label>
                  <input type="number" value={selectedAlbum.total} onChange={e => updateAlbum({ total: Number(e.target.value) })} disabled={selectedAlbum.isFinalized} />
                </div>

                {/* 🚀 O CAMPO PROTEGIDO COM A LÓGICA DE TRAVAS */}
                <div className="user-select-wrap" style={{ marginBottom: 0 }}>
                  <label>Vincular Álbum Legado (Opcional)</label>
                  {isChildOfAnother ? (
                    <div style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid #fca5a5' }}>
                      ⚠️ Este álbum já está vinculado como sub-álbum de outra coleção. Sub-álbuns não podem ter seus próprios sub-álbuns.
                    </div>
                  ) : (
                    <select 
                      value={selectedAlbum.subAlbumId || ''} 
                      onChange={e => updateAlbum({ subAlbumId: e.target.value ? Number(e.target.value) : null })} 
                      disabled={selectedAlbum.isFinalized} 
                      style={{ width: '100%', padding: '8px', borderRadius: '6px' }}
                    >
                      <option value="">-- Nenhum --</option>
                      {availableSubAlbums.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div style={{ marginTop: '10px', padding: '15px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input type="checkbox" checked={selectedAlbum.isPrincipal} onChange={e => updateAlbum({ isPrincipal: e.target.checked })} disabled={selectedAlbum.isFinalized} style={{ width: '18px', height: '18px' }} />
                    🌟 Álbum Principal (Destaque na tela inicial)
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '5px 0 15px 0' }}>Apenas um álbum pode ser o principal por vez.</p>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input type="checkbox" checked={selectedAlbum.permiteGameplay} onChange={e => updateAlbum({ permiteGameplay: e.target.checked })} disabled={selectedAlbum.isFinalized} style={{ width: '18px', height: '18px' }} />
                    🎮 Permite Gameplay (Economia Ativa)
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '5px 0 0 0' }}>Se desmarcado, vira "Coleção Histórica" (bloqueia forja e novos pacotes).</p>
                </div>

                <div style={{ marginTop: '20px', padding: '15px', background: selectedAlbum.isFinalized ? '#d1fae5' : '#fef3c7', borderRadius: '8px', border: `1px solid ${selectedAlbum.isFinalized ? '#10b981' : '#f59e0b'}` }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: selectedAlbum.isFinalized ? '#047857' : '#b45309' }}>
                    <input type="checkbox" checked={selectedAlbum.isFinalized} onChange={e => updateAlbum({ isFinalized: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                    {selectedAlbum.isFinalized ? t('adminAlbums.editionFinalized') : t('adminAlbums.finalizeEdition')}
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '5px 0 0 0' }}>Ao marcar como finalizado, este álbum não poderá mais ser deletado do sistema.</p>
                </div>
              </div>
            )}

            {activeTab === 'rarities' && (
              <div>
                {!selectedAlbum.isFinalized && (
                  <button onClick={handleAddRarity} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px' }}>{t('adminAlbums.addRarity')}</button>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {safeRarities.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhuma raridade cadastrada.</p>}
                  {safeRarities.map(rarity => {
                    const isTrophyRarity = safeStickers.some(s => s.isTrophy && s.rarityId === rarity.id);
                    return (
                      <div key={rarity.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'var(--surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                        <div className="user-select-wrap" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
                          <label>{t('adminAlbums.rarityName')}</label>
                          <input 
                            type="text" 
                            value={rarity.name} 
                            onChange={e => handleUpdateRarity(rarity.id, 'name', e.target.value)} 
                            disabled={selectedAlbum.isFinalized || isTrophyRarity} 
                            style={{ opacity: isTrophyRarity ? 0.7 : 1 }}
                          />
                        </div>
                        <div className="user-select-wrap" style={{ width: '120px', marginBottom: 0 }}>
                          <label>{t('adminAlbums.rarityColor')}</label>
                          <input type="color" value={rarity.color} onChange={e => handleUpdateRarity(rarity.id, 'color', e.target.value)} disabled={selectedAlbum.isFinalized} style={{ width: '100%', height: '38px', padding: 0, border: 'none', cursor: 'pointer' }} />
                        </div>
                        <div className="user-select-wrap" style={{ width: '80px', marginBottom: 0 }}>
                          <label>Peso</label>
                          <input type="number" value={rarity.weight || 1} onChange={e => handleUpdateRarity(rarity.id, 'weight', Number(e.target.value))} disabled={selectedAlbum.isFinalized} title="Ex: 1 = Comum, 10 = Épica" />
                        </div>
                        {!selectedAlbum.isFinalized && !isTrophyRarity && (
                          <button onClick={() => safeRemoveRarity(rarity.id)} style={{ marginTop: '20px', background: '#fee2e2', color: '#dc2626', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>🗑️</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'packs' && (
              <div>
                {!selectedAlbum.isFinalized && (
                  <button onClick={handleAddPack} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px' }}>{t('adminAlbums.addPack')}</button>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
                  {safePacks.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhum pacote cadastrado.</p>}
                  {safePacks.map(pack => (
                    <div key={pack.id} style={{ background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative' }}>
                      {!selectedAlbum.isFinalized && (
                        <button onClick={() => safeRemovePack(pack.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                      )}
                      
                      <div className="user-select-wrap" style={{ paddingRight: '20px' }}>
                        <label>{t('adminAlbums.packName')}</label>
                        <input type="text" value={pack.name} onChange={e => handleUpdatePack(pack.id, 'name', e.target.value)} disabled={selectedAlbum.isFinalized} />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        <div className="user-select-wrap" style={{ flex: 1, minWidth: '130px', marginBottom: 0 }}>
                          <label>Template Visual</label>
                          <select value={pack.template} onChange={e => handleUpdatePack(pack.id, 'template', e.target.value)} disabled={selectedAlbum.isFinalized} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                            <option value="pack-3pts">Cinza Padrão</option>
                            <option value="pack-5pts">Dourado</option>
                            <option value="pack-10pts">Brilhante Épico</option>
                            <option value="pack-br">Edição Brasil</option>
                            <option value="pack-pseudo">Pseudo-Randômico</option>
                            <option value="pack-pseudo-rara">Pseudo-Raro</option>
                            <option value="pack-mitico">Mítico</option>
                            <option value="pack-cyber">Cyber (Matrix)</option>
                          </select>
                        </div>
                        <div className="user-select-wrap" style={{ width: '80px', marginBottom: 0 }}>
                          <label>Base</label>
                          <input type="number" value={pack.amount} onChange={e => handleUpdatePack(pack.id, 'amount', Number(e.target.value))} disabled={selectedAlbum.isFinalized} title="Cartas Garantidas" />
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <label style={{ color: '#0369a1', fontWeight: 'bold', fontSize: '0.85rem' }}>🎁 Regras de Bônus (Cartas Extras)</label>
                          <button 
                            disabled={selectedAlbum.isFinalized}
                            onClick={() => {
                              const newTiers = [...(pack.bonusTiers || []), { chance: 0, amount: 1 }];
                              handleUpdatePack(pack.id, 'bonusTiers', newTiers as any);
                            }}
                            style={{ background: '#0284c7', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                          >+ Adicionar Regra</button>
                        </div>

                        {(pack.bonusTiers || []).map((tier, index) => (
                          <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                            <div className="user-select-wrap" style={{ flex: 1, marginBottom: 0 }}>
                              <input type="number" step="0.1" value={tier.chance} disabled={selectedAlbum.isFinalized} placeholder="% Chance"
                                onChange={e => {
                                  const newTiers = [...(pack.bonusTiers || [])];
                                  newTiers[index].chance = Number(e.target.value);
                                  handleUpdatePack(pack.id, 'bonusTiers', newTiers as any);
                                }} 
                              />
                            </div>
                            <span style={{ color: '#0369a1', fontSize: '0.8rem' }}>% de vir +</span>
                            <div className="user-select-wrap" style={{ width: '60px', marginBottom: 0 }}>
                              <input type="number" value={tier.amount} disabled={selectedAlbum.isFinalized}
                                onChange={e => {
                                  const newTiers = [...(pack.bonusTiers || [])];
                                  newTiers[index].amount = Number(e.target.value);
                                  handleUpdatePack(pack.id, 'bonusTiers', newTiers as any);
                                }} 
                              />
                            </div>
                            {!selectedAlbum.isFinalized && (
                              <button onClick={() => {
                                const newTiers = pack.bonusTiers!.filter((_, i) => i !== index);
                                handleUpdatePack(pack.id, 'bonusTiers', newTiers as any);
                              }} style={{ background: 'transparent', color: '#dc2626', border: 'none', cursor: 'pointer' }}>✕</button>
                            )}
                          </div>
                        ))}
                        {!(pack.bonusTiers?.length) && <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>Nenhuma regra de carta extra.</p>}
                      </div>
                      
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Taxas de Drop (Use Decimais Ex: 0.35)</label>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {safeRarities
                            .filter(rarity => !safeStickers.some(s => s.isTrophy && s.rarityId === rarity.id))
                            .map(rarity => (
                              <div key={rarity.id} style={{ flex: 1, minWidth: '60px', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: rarity.color, fontWeight: 'bold', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{rarity.name}</span>
                                <input type="number" step="0.001" value={pack.drops[rarity.id] || 0} onChange={e => handleUpdatePackDrop(pack.id, rarity.id, Number(e.target.value))} disabled={selectedAlbum.isFinalized} style={{ width: '100%', textAlign: 'center', padding: '4px' }} />
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'stickers' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'var(--surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {!selectedAlbum.isFinalized && (
                      <button onClick={handleAddSticker} disabled={isLimitReached} style={{ padding: '8px 16px', background: isLimitReached ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isLimitReached ? 'not-allowed' : 'pointer' }}>{t('adminAlbums.addSticker')}</button>
                    )}
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      Normais: <b style={{ color: isLimitReached ? '#dc2626' : 'var(--text)' }}>{normalStickersCount}</b> / {selectedAlbum.total} 
                      <br/>Secretas/Troféus: <b>{secretStickersCount}</b>
                    </span>
                  </div>
                  <input type="text" placeholder={t('adminAlbums.searchSticker')} value={stickerSearch} onChange={e => setStickerSearch(e.target.value)} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid var(--border)', outline: 'none', minWidth: '250px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
                  {filteredStickers.map(sticker => (
                    <div key={sticker.id} style={{ display: 'flex', gap: '12px', background: 'var(--surface)', padding: '12px', borderRadius: '8px', border: `1px solid ${sticker.isSecret ? '#fbbf24' : 'var(--border)'}`, position: 'relative' }}>
                      <div style={{ width: '70px', height: '90px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sticker.image ? <img src={sticker.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Sem img</span>}
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="text" placeholder={t('adminAlbums.stickerName')} value={sticker.name} onChange={e => handleUpdateSticker(sticker.id, 'name', e.target.value)} disabled={selectedAlbum.isFinalized} style={{ flex: 1, padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                          {!selectedAlbum.isFinalized && !sticker.isTrophy && (
                            <button onClick={() => safeRemoveSticker(sticker.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', padding: '0 8px', cursor: 'pointer' }}>✕</button>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select 
                            value={sticker.rarityId} 
                            onChange={e => handleUpdateSticker(sticker.id, 'rarityId', e.target.value)} 
                            disabled={selectedAlbum.isFinalized || sticker.isTrophy} 
                            style={{ flex: 1, padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border)', opacity: sticker.isTrophy ? 0.7 : 1 }}
                          >
                            <option value="">-- {t('adminAlbums.stickerRarity')} --</option>
                            {safeRarities.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: sticker.isSecret ? '#b45309' : 'var(--muted)', cursor: sticker.isTrophy ? 'not-allowed' : 'pointer', opacity: sticker.isTrophy ? 0.7 : 1 }}>
                            <input 
                              type="checkbox" 
                              checked={sticker.isSecret} 
                              onChange={e => handleUpdateSticker(sticker.id, 'isSecret', e.target.checked)} 
                              disabled={selectedAlbum.isFinalized || sticker.isTrophy} 
                            /> 
                            {t('adminAlbums.secretSticker')}
                          </label>
                        </div>

                        <input type="text" placeholder={t('adminAlbums.passiveDescPlaceholder')} value={sticker.passiveDesc || ''} onChange={e => handleUpdateSticker(sticker.id, 'passiveDesc', e.target.value)} disabled={selectedAlbum.isFinalized} style={{ padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #d8b4fe', background: '#faf5ff' }} />
                        <input type="text" placeholder={t('adminAlbums.passiveRulePlaceholder')} value={sticker.passiveRule || ''} onChange={e => handleUpdateSticker(sticker.id, 'passiveRule', e.target.value)} disabled={selectedAlbum.isFinalized} style={{ padding: '6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'monospace' }} />

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input type="text" placeholder={t('adminAlbums.imageOrUrl')} value={sticker.image.startsWith('data:') ? 'Upload Local (Base64)' : sticker.image} onChange={e => handleUpdateSticker(sticker.id, 'image', e.target.value)} disabled={sticker.image.startsWith('data:') || selectedAlbum.isFinalized} style={{ flex: 1, padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                          {!selectedAlbum.isFinalized && (
                            <button onClick={() => triggerImageUpload(sticker.id)} style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{t('adminAlbums.uploadImage')}</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                 <div>
                   <h4 style={{ color: 'var(--green)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>{t('adminAlbums.previewPacksTitle')}</h4>
                   <div className="pack-container" style={{ justifyContent: 'flex-start', transform: 'scale(0.85)', transformOrigin: 'top left', marginBottom: '-20px' }}>
                     {safePacks.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhum pacote criado.</p>}
                     {safePacks.map(pack => (
                       <div key={pack.id} className={`pack-item ${pack.template}`} style={{ cursor: 'default' }}>
                         <div className="pack-shine"></div>
                         {pack.template.includes('pseudo') && <div className="pack-pseudo-q">? ? ?</div>}
                         <div className="pack-content">
                           <div className="pack-title" style={{ fontSize: '1.2rem' }}>{pack.name}</div>
                           <div className="pack-badge">{pack.template.includes('pseudo') ? '❓ Escolha' : `${pack.amount} Cartas`}</div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 <div>
                   <h4 style={{ color: 'var(--green)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>{t('adminAlbums.previewStickersTitle')}</h4>
                   <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                     {safeRarities.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhuma raridade criada.</p>}
                     {safeRarities.map((rarity) => (
                       <div key={rarity.id} className="revealed-card rara" style={{ animation: 'none', opacity: 1, transform: 'scale(1)', borderColor: rarity.color, boxShadow: `0 0 15px ${rarity.color}80`, background: `${rarity.color}15` }}>
                         <div style={{ width: '100%', height: '105px', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', borderRadius: '4px' }}>❓</div>
                         <div className="name" style={{ color: rarity.color, textShadow: 'none' }}>{rarity.name}</div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            )}
          </div>
          
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)', borderRadius: '0 0 12px 12px', textAlign: 'right', flexShrink: 0 }}>
             <button className="btn-save" style={{ width: 'auto', background: '#10b981' }} onClick={handleSaveToDatabase}>
                {t('adminAlbums.btnSave')}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}