// src/components/PackItem.tsx

interface PackItemProps {
  type: string;
  onClick?: () => void;
  name?: string;
  amount?: number;
}

export function PackItem({ type, onClick, name, amount = 5 }: PackItemProps) {
  // Garante que a classe CSS do legado sempre funcione, mesmo se o prefixo vier cortado
  const cssClass = type.startsWith('pack-') ? type : `pack-${type}`;

  // Se o nome não for passado pelo banco (ex: testes manuais), usamos um fallback
  const getTitle = () => {
    if (name) return name;
    if (cssClass === 'pack-3pts') return 'Comum';
    if (cssClass === 'pack-5pts') return 'Dourado';
    if (cssClass === 'pack-10pts') return 'Brilhante';
    if (cssClass === 'pack-br') return 'Brasil';
    if (cssClass === 'pack-pseudo') return 'Pseudo';
    if (cssClass === 'pack-pseudo-rara') return 'Pseudo Raro';
    if (cssClass === 'pack-mitico') return 'Mítico';
    if (cssClass === 'pack-cyber') return 'Cyber';
    return 'Pacote';
  };

  // Streams de dados binários para o pacote Cyber
  const matrixStreams = [
    { left: '10%', delay: '0s', duration: '1.8s', text: '0100110' },
    { left: '30%', delay: '0.5s', duration: '2.1s', text: '1011001' },
    { left: '50%', delay: '0.2s', duration: '1.5s', text: '0010110' },
    { left: '70%', delay: '0.8s', duration: '2.3s', text: '1100101' },
    { left: '90%', delay: '0.1s', duration: '1.7s', text: '0101010' },
  ];

  return (
    <div className={`pack-item ${cssClass}`} onClick={onClick}>
      <div className="pack-shine"></div>
      
      {/* --- EFEITO: CONSTELAÇÃO DE LEÃO (Exclusivo Mítico) --- */}
      {cssClass === 'pack-mitico' && (
        <div className="constellation-leo">
          <div className="star regulus" title="Cor Leonis (Regulus)"></div>
          <div className="star algieba"></div>
          <div className="star adhafera"></div>
          <div className="star rasalas"></div>
          <div className="star algenubi"></div>
          <div className="star zosma"></div>
          <div className="star denebola"></div>
        </div>
      )}

      {/* --- EFEITO: MATRIX RAIN (Exclusivo Cyber) --- */}
      {cssClass === 'pack-cyber' && (
        <div className="matrix-rain">
          {matrixStreams.map((stream, idx) => (
            <div 
              key={idx} 
              className="matrix-drop" 
              style={{ left: stream.left, animationDelay: stream.delay, animationDuration: stream.duration }}
            >
              {stream.text}
            </div>
          ))}
        </div>
      )}

      {/* O efeito especial da interrogação flutuante para pacotes pseudo */}
      {cssClass.includes('pseudo') && <div className="pack-pseudo-q">? ? ?</div>}
      
      <div className="pack-content">
        <div className="pack-title" style={{ fontSize: '1.2rem' }}>{getTitle()}</div>
        <div className="pack-badge">
          {cssClass.includes('pseudo') ? '❓ Escolha 1' : `${amount} Cartas`}
        </div>
      </div>
    </div>
  );
}