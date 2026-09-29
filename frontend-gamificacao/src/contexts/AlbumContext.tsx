// src/contexts/AlbumContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

export interface Rarity { id: string; name: string; color: string; weight: number; }
export interface Pack { id: string; name: string; template: string; amount: number; behavior: string; bonusTiers?: { chance: number; amount: number }[]; drops: Record<string, number>; }
export interface StickerDef { id: string; name: string; rarityId: string; image: string; isSecret: boolean; passiveDesc?: string; passiveRule?: string; isTrophy?: boolean; }
export interface Album { id: number; name: string; desc: string; total: number; isPrincipal: boolean; permiteGameplay: boolean; isFinalized: boolean; subAlbumId?: number | null; subAlbum?: Album | null; rarities: Rarity[]; packs: Pack[]; stickers: StickerDef[]; }

interface AlbumContextData { 
  albumList: any[]; 
  activeAlbum: Album | null; 
  isLoadingAlbum: boolean;
  switchAlbum: (id: number) => Promise<void>;
}

const AlbumContext = createContext<AlbumContextData | undefined>(undefined);

const mapAlbumFromApi = (data: any): Album => ({
  id: data.id || data.Id,
  name: data.nome || data.name || data.Nome || 'Álbum',
  desc: data.descricao || data.desc || data.Descricao || '',
  total: data.total || data.Total || 0,
  isPrincipal: data.isPrincipal !== undefined ? data.isPrincipal : (data.IsPrincipal || false),
  permiteGameplay: data.permiteGameplay !== undefined ? data.permiteGameplay : true,
  isFinalized: data.isFinalized !== undefined ? data.isFinalized : false,
  subAlbumId: data.subAlbumId !== undefined ? data.subAlbumId : null,
  rarities: (data.raridades || data.rarities || []).map((r: any) => ({
    id: r.id || r.Id, name: r.nome || r.name, color: r.corHex || r.color || '#cbd5e1', weight: r.peso || r.weight || 1
  })),
  stickers: (data.figurinhas || data.stickers || []).map((f: any) => ({
    id: f.id || f.Id, name: f.nome || f.name, rarityId: f.raridadeId || f.rarityId, image: f.imagemUrl || f.image || '',
    isSecret: f.isSecreta || f.isSecret || false, isTrophy: f.isTrofeu || f.isTrophy || false,
    passiveDesc: f.passivaDesc || f.passiveDesc, passiveRule: f.passiva || f.passiveRule
  })),
  packs: data.pacotes || data.packs || [],
  subAlbum: data.subAlbum ? mapAlbumFromApi(data.subAlbum) : null
});

export function AlbumProvider({ children }: { children: ReactNode }) {
  const [albumList, setAlbumList] = useState<any[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const listRes = await api.album.getAlbums();
        const list = listRes.data || listRes;
        
        // 🚀 A MÁGICA: Filtra a lista, removendo qualquer álbum que seja sub-álbum de outro
        const mainAlbums = list.filter((a: any) => !list.some((parent: any) => parent.subAlbumId === (a.id || a.Id)));
        
        // Ordena para o principal ficar no topo
        const sortedList = mainAlbums.sort((a: any, b: any) => (b.isPrincipal ? 1 : 0) - (a.isPrincipal ? 1 : 0));
        setAlbumList(sortedList);

        // Carrega o álbum de destaque inicial
        const principalSummary = sortedList.find((a: any) => a.isPrincipal || a.IsPrincipal) || sortedList[0];
        if (principalSummary) {
          await switchAlbum(principalSummary.id || principalSummary.Id);
        }
      } catch (error) {
        console.warn("Erro ao inicializar contexto de álbuns.", error);
      }
    }
    init();
  }, []);

  const switchAlbum = async (id: number) => {
    setIsLoadingAlbum(true);
    try {
      const token = localStorage.getItem('bolao_token');
      const res = await fetch(`http://localhost:5000/api/v1/albuns/${id}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      setActiveAlbum(mapAlbumFromApi(data.data || data));
    } catch (e) {
      console.error("Erro ao trocar de álbum:", e);
    }
    setIsLoadingAlbum(false);
  };

  return (
    <AlbumContext.Provider value={{ albumList, activeAlbum, isLoadingAlbum, switchAlbum }}>
      {children}
    </AlbumContext.Provider>
  );
}

export const useAlbums = () => {
  const context = useContext(AlbumContext);
  if (!context) throw new Error('useAlbums deve ser usado dentro de um AlbumProvider');
  return context;
};