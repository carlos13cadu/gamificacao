// 🚀 Adicionamos isTrophy e isSecret na interface para o TypeScript não reclamar
export interface Sticker { 
  id: string | number; 
  name: string; 
  code: string; 
  quantity: number; 
  isRare: boolean; 
  image?: string; 
  color?: string; 
  isTrophy?: boolean; 
  isSecret?: boolean; 
}

interface StickerCardProps { 
  sticker: Sticker; 
  availableQuantity: number; 
  onClick: () => void; 
}

export function StickerCard({ sticker, availableQuantity, onClick }: StickerCardProps) {
  const isEmpty = availableQuantity <= 0 && sticker.quantity === 0;
  let cardClass = isEmpty ? 'zero' : '';
  
  let customStyle: React.CSSProperties = {};
  let imgStyle: React.CSSProperties = {};
  let nameStyle: React.CSSProperties = {};
  let qtdStyle: React.CSSProperties = {};

  if (!isEmpty) {
    if (sticker.name === 'Itália') {
      cardClass = 'italia-card efeito-nevoa-italia';
    } else {
      // Borda e Brilho customizados injetados dinamicamente via HEX Color do Admin!
      customStyle = {
        borderColor: sticker.color,
        boxShadow: sticker.isRare ? `0 0 10px ${sticker.color}80` : 'none',
        background: sticker.name === 'Coringa' ? 'linear-gradient(135deg, #111, #4c1d95, #111)' : undefined
      };
      
      qtdStyle = { background: sticker.color, color: sticker.name === 'Coringa' ? 'white' : 'black' };
      nameStyle = { background: sticker.isRare ? `${sticker.color}30` : 'var(--surface)', color: sticker.isRare ? sticker.color : 'var(--text)' };
      imgStyle = { borderBottomColor: sticker.color };
    }

    // 🚀 A CORREÇÃO: Agora vale para QUALQUER troféu, não importando o nome!
    if (sticker.isTrophy) {
      customStyle = { ...customStyle, flex: '0 0 95px', height: '135px', margin: 0 };
      imgStyle = { objectFit: 'contain', padding: '10px', background: '#fffbea' };
      nameStyle = { background: sticker.color, color: 'black', fontSize: '0.75rem' };
    }
  }

  return (
    <div className={`sticker-card ${cardClass} ${sticker.isRare ? 'rara' : ''}`} onClick={onClick} style={customStyle}>
      <div className={`sticker-qtd ${availableQuantity > 0 ? '' : 'zero'}`} style={qtdStyle}>{isEmpty ? '' : availableQuantity}</div>
      {sticker.name === 'Coringa' && !isEmpty ? (
        <div style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'white' }}>🃏</div>
      ) : (
        <img src={sticker.image || `https://flagcdn.com/w160/${sticker.code}.png`} alt={sticker.name} className="sticker-img" style={imgStyle} />
      )}
      <div className="sticker-name" style={nameStyle}>{sticker.name}</div>
    </div>
  );
}