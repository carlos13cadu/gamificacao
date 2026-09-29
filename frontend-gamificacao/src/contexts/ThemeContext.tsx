import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Contrato das cores
interface ThemeColors {
  primary: string;       
  background: string;    
  card: string;          
  text: string;          
}

interface ThemeContextData {
  theme: ThemeColors;
  updateTheme: (newTheme: Partial<ThemeColors>) => void;
}

// 🚀 IDENTIDADE VISUAL APERAM: Roxo Predominante e Laranja
const defaultTheme: ThemeColors = {
  primary: '#6B1F7C',    // Roxo Aperam (HEX: #6B1F7C)
  background: '#f4f4f5', // Fundo cinza clarinho super elegante
  card: '#ffffff',       // Branco puro para os cards
  text: '#1f2937',       // Cinza chumbo escuro para o texto (ótima leitura)
};

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeColors>(defaultTheme);

  useEffect(() => {
    const root = document.documentElement;
    
    // O sistema continuará usando os nomes antigos das variáveis, mas com as novas cores!
    root.style.setProperty('--green', theme.primary); 
    root.style.setProperty('--green-mid', '#8a2b9e'); // Um roxo um pouco mais claro para hovers
    root.style.setProperty('--surface', theme.background);
    root.style.setProperty('--card', theme.card);
    root.style.setProperty('--text', theme.text);
    
    // Cores de destaque:
    root.style.setProperty('--pitch', '#2d0d36'); // Roxo muito escuro para fundos de contraste
    root.style.setProperty('--gold', '#E05206');  // Laranja Aperam (HEX: #E05206) para botões de destaque, ineditas, etc.
  }, [theme]);

  const updateTheme = (newTheme: Partial<ThemeColors>) => {
    setTheme(prev => ({ ...prev, ...newTheme }));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  return context;
};