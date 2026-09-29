const API_BASE_URL = 'http://localhost:5000/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('bolao_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // --- ÁLBUM E PACOTES (USUÁRIO) ---
  album: {
    // Busca a lista leve de álbuns
    getAlbums: async () => {
      return fetch(`${API_BASE_URL}/albuns`, { headers: getHeaders() }).then(res => res.json());
    },
    // Busca o álbum ativo/principal (com o sub-álbum aninhado)
    getPrincipal: async () => {
      return fetch(`${API_BASE_URL}/albuns/principal`, { headers: getHeaders() }).then(res => res.json());
    },
    // Busca as figurinhas e pacotes que o usuário logado possui num álbum específico
    getInventory: async (albumId: number) => {
      return fetch(`${API_BASE_URL}/albuns/${albumId}/inventario`, { headers: getHeaders() }).then(res => res.json());
    },
    // Resolve a abertura do pacote no backend
    openPack: async (packId: string) => {
      return fetch(`${API_BASE_URL}/pacotes/abrir`, { 
        method: 'POST', headers: getHeaders(), body: JSON.stringify({ packId }) 
      }).then(res => res.json());
    },
    // Envia requisição para forjar figurinhas (ajuste a rota se diferente no C#)
    synthesize: async (baseIds: string[], catalystId?: string) => {
       return fetch(`${API_BASE_URL}/albuns/forjar`, { 
         method: 'POST', headers: getHeaders(), body: JSON.stringify({ baseIds, catalystId }) 
       }).then(res => res.json());
    }
  },

  // --- ADMIN ---
  admin: {
    // Faz o upsert completo do álbum gerado na fábrica
    saveAlbum: async (albumId: number, payload: any) => {
      const response = await fetch(`${API_BASE_URL}/admin/albuns/${albumId}`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar o álbum');
      }
      return response.json(); // Depende se o seu PUT devolve 200 OK com o álbum ou 204 No Content
    }
  },

  // --- MERCADO DE TROCAS ---
  trade: {
    getUsers: async () => {
      // Mock: Lista de usuários disponíveis para troca
      return { status: 'success', users: ['Guilherme Linguiça', 'Caíque', 'Admin', 'Maria'] };
    },
    getFriendInventory: async (userName: string) => {
      // Mock: Simulando o inventário que o C# devolverá baseado no usuário selecionado
      const mockInv = [
        { id: 'comum_1', name: 'Espanha', code: 'es', image: 'https://flagcdn.com/w160/es.png', quantity: 2, isRare: false, color: '#cbd5e1' },
        { id: 'rara_1', name: 'Holanda', code: 'nl', image: 'https://flagcdn.com/w160/nl.png', quantity: 1, isRare: true, color: '#fbbf24' }
      ];
      return { status: 'success', inventory: mockInv };
    },
    propose: async (targetUser: string, offerIds: string[], requestIds: string[]) => {
      console.log(`Proposta para ${targetUser}: Oferece ${offerIds.length} cartas, Pede ${requestIds.length} cartas.`);
      return { status: 'success' };
    },
    getPending: async () => { return { status: 'success', pending: [] }; },
    respond: async (tradeId: string, action: 'accept' | 'decline') => { return { status: 'success' }; }
  },

  // --- PALPITES E FUTEBOL ---
  matches: {
    // 1. Busca a lista de jogos da fase selecionada
    getMatches: async (phase: string) => {
      // MOCK PROTÓTIPO: Lista de jogos que o C# devolverá
      const mockMatches = [
        { id: '1', round: 1, date: '13/06/2026', time: '16:00', group: 'Grupo A', home: '🇧🇷 Brasil', away: 'Marrocos', isLocked: false, phase: 'grupos' },
        { id: '2', round: 1, date: '14/06/2026', time: '17:00', group: 'Grupo A', home: 'Holanda', away: 'Japão', isLocked: false, phase: 'grupos' },
        { id: '3', round: 2, date: '18/06/2026', time: '16:00', group: 'Grupo B', home: 'Bélgica', away: 'Egito', isLocked: false, phase: 'grupos' },
        { id: '4', round: null, date: '28/06/2026', time: '16:00', group: 'Oitavas 1', home: 'Alemanha', away: 'México', isLocked: false, phase: 'oitavas' }
      ].filter(m => m.phase === phase);
      
      return { status: 'success', matches: mockMatches };
    },

    // 2. Busca os palpites que o usuário já fez no banco
    getUserGuesses: async (userId: string, phase: string) => {
      // MOCK PROTÓTIPO
      const mockGuesses = {
        '1': { h: 2, a: 0 },
        '4': { h: 1, a: 1, m: 'penaltis' }
      };
      return { status: 'success', guesses: mockGuesses };
    },

    // 3. Salva os novos palpites (O Payload exato que vai pro C#)
    saveGuesses: async (userId: string, guesses: any[]) => {
      console.log("Enviando para o Backend C#:", { userId, guesses });
      return { status: 'success' };
    },
    
    getLeaderboard: async (phase: string) => {
      // return fetch(`${API_BASE_URL}/matches/leaderboard?phase=${phase}`, { headers: getHeaders() }).then(res => res.json());

      // MOCK DE DADOS PARA PROTÓTIPO (Com Tendência e Prêmios)
      const mockData = [
        { name: 'Admin', pts: 65, pts10: 5, pts5: 3, pts3: 0, trend: 0, awards: [{ medal: '📦', label: 'Grupos' }] },
        { name: 'Guilherme Linguiça', pts: 58, pts10: 4, pts5: 3, pts3: 1, trend: 1, awards: [] },
        { name: 'Caíque', pts: 45, pts10: 2, pts5: 3, pts3: 3, trend: -1, awards: [{ medal: '🎟️', label: '16 Avos' }] },
        { name: 'Maria', pts: 42, pts10: 2, pts5: 2, pts3: 4, trend: 2, awards: [] },
        { name: 'João', pts: 35, pts10: 1, pts5: 5, pts3: 0, trend: -2, awards: [] }
      ];

      return { status: 'success', leaderboard: mockData };
    }
  },

  // --- CHAT WIDGET ---
  chat: {
    getMessages: async () => {
      // Mock inicial de como o backend C# devolverá os dados
      return {
        status: 'success',
        data: [
          { time: '14:30', user: 'Admin', msg: 'Bem-vindos ao bolão 2026!' },
          { time: '14:35', user: 'João Silva', msg: 'Vamos com tudo! 🇧🇷' }
        ]
      };
    },
    sendMessage: async (msg: string) => {
      console.log("Mensagem enviada para o C#:", msg);
      return { status: 'success' };
    }
  }
};