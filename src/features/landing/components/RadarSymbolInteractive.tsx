import React, { useState } from 'react';

type LayerKey = 'all' | 'red' | 'blue' | 'yellow';

interface LayerInfo {
  title: string;
  subtitle: string;
  description: string;
  color: string;
  accentBg: string;
  borderCol: string;
}

const LAYERS: Record<LayerKey, LayerInfo> = {
  all: {
    title: 'El Símbolo raDAR',
    subtitle: 'Dos lecturas a la vez: señal que se propaga y abrazo que acoge',
    description: 'La abertura hacia la derecha acoge y no retiene: siempre hay una puerta por donde entrar y seguir. De adentro hacia afuera, cuenta cómo una emergencia se transforma en respuesta colectiva.',
    color: 'text-slate-900',
    accentBg: 'bg-slate-50',
    borderCol: 'border-slate-200',
  },
  red: {
    title: 'La Emergencia',
    subtitle: 'El punto exacto donde algo está pasando',
    description: 'Donde alguien necesita ayuda inmediata. Es lo primero que se detecta en el radar y lo primero que se ve. Representa la alerta viva que levanta la voz.',
    color: 'text-brand-red',
    accentBg: 'bg-brand-red/10',
    borderCol: 'border-brand-red/30',
  },
  blue: {
    title: 'El Apoyo Cercano',
    subtitle: 'El vecino, la cuadra, el voluntario en terreno',
    description: 'El primer arco abraza la emergencia porque llega de primero. Es la solidaridad inmediata que no espera órdenes: quien comparte su agua, su pala, su casa o su tiempo.',
    color: 'text-brand-blue',
    accentBg: 'bg-brand-blue/10',
    borderCol: 'border-brand-blue/30',
  },
  yellow: {
    title: 'El Respaldo Colectivo',
    subtitle: 'Las organizaciones, las donaciones y el país entero',
    description: 'El arco exterior más ancho y luminoso. Es la chispa de luz y la fuerza logística que sostiene el esfuerzo a escala para que la ayuda continúe llegando.',
    color: 'text-amber-700',
    accentBg: 'bg-brand-yellow/15',
    borderCol: 'border-brand-yellow/40',
  },
};

export const RadarSymbolInteractive: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<LayerKey>('all');

  const handleSelectLayer = (key: LayerKey) => {
    setActiveLayer(key);
  };

  const current = LAYERS[activeLayer];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-8 lg:p-10 transition-all">
      {/* Encabezado limpio con márgenes reducidos en móvil */}
      <div className="mb-3 sm:mb-6">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-brand-text tracking-tight font-sans">
          La anatomía de una red de ayuda
        </h3>
      </div>

      {/* Mismo flow, timing y curva de desaceleración que el radar grande (11s cubic-bezier) */}
      <style>{`
        @keyframes radarFlowRippleOneByOne {
          0% {
            transform: scale(1);
            opacity: 0;
          }
          2% {
            opacity: 0.92;
          }
          9% {
            opacity: 0.75;
          }
          18% {
            opacity: 0.45;
          }
          26% {
            opacity: 0.12;
          }
          29%, 100% {
            opacity: 0;
          }
          100% {
            transform: scale(5.5);
            opacity: 0;
          }
        }

        @keyframes radarFlowRippleSolo {
          0% {
            transform: scale(1);
            opacity: 0;
          }
          5% {
            opacity: 0.92;
          }
          25% {
            opacity: 0.75;
          }
          55% {
            opacity: 0.45;
          }
          80% {
            opacity: 0.12;
          }
          92%, 100% {
            transform: scale(4.5);
            opacity: 0;
          }
        }

        .animate-flow-ripple-1 {
          opacity: 0;
          animation: radarFlowRippleOneByOne 11s cubic-bezier(0.15, 0.7, 0.3, 1) infinite;
        }
        .animate-flow-ripple-2 {
          opacity: 0;
          animation: radarFlowRippleOneByOne 11s cubic-bezier(0.15, 0.7, 0.3, 1) infinite 3.66s;
        }
        .animate-flow-ripple-3 {
          opacity: 0;
          animation: radarFlowRippleOneByOne 11s cubic-bezier(0.15, 0.7, 0.3, 1) infinite 7.33s;
        }
        .animate-flow-solo {
          opacity: 0;
          animation: radarFlowRippleSolo 3.66s cubic-bezier(0.15, 0.7, 0.3, 1) infinite;
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 lg:gap-8 items-center">
        {/* Visualizador del Símbolo SVG: 100% quieto y firme, con emisión concéntrica tricolor UNA POR UNA */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative p-3 sm:p-8 bg-radial from-slate-50 to-slate-100/60 rounded-2xl border border-slate-100 overflow-hidden min-h-[200px] sm:min-h-[300px]">
          {/* SVG del Símbolo: ESTÁTICO, centrado ópticamente (viewBox 40 0 980 1024) y emitiendo 3 colores en riguroso turno */}
          <svg
            viewBox="40 0 980 1024"
            className="w-36 h-36 xs:w-44 xs:h-44 sm:w-60 sm:h-60 drop-shadow-md my-0.5 overflow-visible select-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ondas concéntricas tricolor: flow y timing idénticos al radar grande, una por una */}
            <g className="pointer-events-none">
              {/* 1. Onda Roja - Emergencia */}
              <circle
                cx="612.823"
                cy="515.77"
                r="80.658"
                fill="none"
                stroke="#CE3B3B"
                strokeWidth="3.5"
                className={
                  activeLayer === 'all'
                    ? 'animate-flow-ripple-1'
                    : activeLayer === 'red'
                    ? 'animate-flow-solo'
                    : 'opacity-0'
                }
                style={{ transformOrigin: '612.823px 515.77px' }}
              />
              {/* 2. Onda Azul - Apoyo Cercano */}
              <circle
                cx="612.823"
                cy="515.77"
                r="80.658"
                fill="none"
                stroke="#1B3A93"
                strokeWidth="3"
                className={
                  activeLayer === 'all'
                    ? 'animate-flow-ripple-2'
                    : activeLayer === 'blue'
                    ? 'animate-flow-solo'
                    : 'opacity-0'
                }
                style={{ transformOrigin: '612.823px 515.77px' }}
              />
              {/* 3. Onda Amarilla - Red Colectiva */}
              <circle
                cx="612.823"
                cy="515.77"
                r="80.658"
                fill="none"
                stroke="#F2C33D"
                strokeWidth="2.5"
                className={
                  activeLayer === 'all'
                    ? 'animate-flow-ripple-3'
                    : activeLayer === 'yellow'
                    ? 'animate-flow-solo'
                    : 'opacity-0'
                }
                style={{ transformOrigin: '612.823px 515.77px' }}
              />
            </g>
            <g clipPath="url(#clip0_interactive_radar)">
              {/* Capa Amarilla - Arco Exterior */}
              <path
                d="M885.638 788.252L844.479 790.031L815.418 801.301L787.306 811.621L759.55 820.518L731.794 827.517L704.038 832.499L676.401 835.583L649.001 836.651L621.838 835.583L595.031 832.499L568.817 827.517L543.314 820.518L518.524 811.621L494.682 800.945L472.027 788.371L450.439 774.254L430.155 758.596L411.177 741.395L393.859 722.889L377.965 703.079L363.849 682.201L351.395 660.255L340.838 637.479L332.06 613.992L325.181 590.029L320.199 565.474L317.234 540.681L316.285 515.77L317.234 490.859L320.199 466.066L325.181 441.511L332.06 417.549L340.838 394.061L351.395 371.285L363.849 349.339L377.965 328.461L393.859 308.651L411.177 290.145L430.155 272.945L450.439 257.286L472.027 243.17L494.682 230.596L518.524 219.92L543.314 211.023L568.817 204.024L595.031 199.042L621.838 195.957L649.001 194.89L676.401 195.957L704.038 199.042L731.794 204.024L759.55 211.023L787.306 219.92L815.418 230.24L844.479 241.509L885.638 243.289C886.816 244.107 888.251 244.471 889.677 244.313C891.102 244.155 892.422 243.485 893.392 242.428C894.362 241.372 894.916 239.999 894.951 238.565C894.987 237.131 894.502 235.733 893.586 234.629L886.35 191.924L863.339 162.742L836.057 137.357L805.81 115.055L773.072 96.075L738.318 80.1793L701.903 67.7236L664.302 58.5895L625.752 53.0141L586.728 50.8789L547.347 52.3024L508.204 57.166L469.417 65.707L431.342 77.5695L394.334 92.8722L358.749 111.378L324.825 132.967L292.799 157.641L262.908 184.925L235.626 214.937L210.836 247.203L189.01 281.486L170.269 317.666L154.73 355.389L142.394 394.417L133.617 434.393L128.279 474.845L126.5 515.77L128.279 556.696L133.617 597.147L142.394 637.124L154.73 676.151L170.269 713.874L189.01 750.055L210.836 784.337L235.626 816.603L262.908 846.615L292.799 873.899L324.825 898.573L358.749 920.163L394.334 938.668L431.342 953.971L469.417 965.834L508.204 974.375L547.347 979.238L586.728 980.662L625.752 978.526L664.302 972.951L701.903 963.817L738.318 951.361L773.072 935.465L805.81 916.485L836.057 894.184L863.339 868.798L886.35 839.617L893.586 796.911C894.502 795.808 894.987 794.409 894.951 792.975C894.916 791.541 894.362 790.169 893.392 789.112C892.422 788.055 891.102 787.386 889.677 787.228C888.251 787.069 886.816 787.433 885.638 788.252Z"
                fill="#F2C33D"
                className="cursor-pointer transition-all duration-300 pointer-events-auto"
                style={{
                  opacity: activeLayer === 'all' || activeLayer === 'yellow' ? 1 : 0.2,
                  filter: activeLayer === 'yellow' ? 'drop-shadow(0 0 16px rgba(242,195,61,0.75))' : 'none',
                }}
                onClick={() => handleSelectLayer('yellow')}
                onMouseEnter={() => handleSelectLayer('yellow')}
              />

              {/* Capa Azul - Arco Interior */}
              <path
                d="M481.871 385.044L503.697 384.688L519.117 379.706L533.944 375.198L548.415 371.64L562.649 369.03L576.882 367.488L590.879 367.013L604.638 367.606L618.042 369.267L631.208 371.877L643.9 375.554L656.117 380.181L667.86 385.756L679.01 392.28L689.448 399.517L699.293 407.583L708.308 416.361L716.611 425.851L724.084 435.934L730.608 446.492L736.301 457.643L741.046 469.149L744.723 481.012L747.57 493.112L749.349 505.449L750.179 517.904L749.824 530.479L748.637 543.053L746.265 555.508L742.944 567.845L738.555 579.945L733.099 591.808L726.694 603.196L719.339 614.228L711.036 624.667L701.784 634.513L691.583 643.884L680.552 652.544L668.691 660.373L656.117 667.609L642.714 674.133L628.48 680.183L613.535 686.352L596.454 700.112C595.196 700.065 593.97 700.52 593.047 701.376C592.124 702.233 591.579 703.421 591.531 704.679C591.484 705.938 591.939 707.163 592.795 708.087C593.652 709.01 594.84 709.555 596.098 709.602L613.653 724.786L633.225 729.175L653.271 730.362L673.554 728.938L693.837 725.142L713.646 719.211L732.862 711.026L751.366 700.824L768.802 688.724L785.171 674.964L799.998 659.424L813.401 642.461L825.144 624.192L835.108 604.738L843.174 584.453L849.223 563.219L853.138 541.629L855.035 519.565L854.798 497.501L852.426 475.437L847.919 453.728L841.276 432.613L832.736 412.091L822.298 392.636L809.962 374.249L795.846 357.167L780.308 341.509L763.346 327.393L745.198 315.174L725.863 304.735L705.817 296.194L685.06 289.788L663.946 285.399L642.477 283.027L621.126 282.908L600.012 284.925L579.255 288.958L559.327 295.127L540.23 303.312L522.319 313.395L505.832 325.376L491.242 339.136L479.143 355.151L475.466 378.045C474.569 378.903 474.044 380.077 474.003 381.317C473.961 382.557 474.407 383.764 475.245 384.679C476.082 385.594 477.245 386.145 478.484 386.213C479.722 386.282 480.938 385.862 481.871 385.044Z"
                fill="#1B3A93"
                className="cursor-pointer transition-all duration-300 pointer-events-auto"
                style={{
                  opacity: activeLayer === 'all' || activeLayer === 'blue' ? 1 : 0.2,
                  filter: activeLayer === 'blue' ? 'drop-shadow(0 0 16px rgba(27,58,147,0.75))' : 'none',
                }}
                onClick={() => handleSelectLayer('blue')}
                onMouseEnter={() => handleSelectLayer('blue')}
              />

              {/* Capa Roja - Centro Emergencia */}
              <path
                d="M612.823 596.435C657.369 596.435 693.481 560.321 693.481 515.77C693.481 471.22 657.369 435.105 612.823 435.105C568.277 435.105 532.165 471.22 532.165 515.77C532.165 560.321 568.277 596.435 612.823 596.435Z"
                fill="#CE3B3B"
                className="cursor-pointer transition-all duration-300 pointer-events-auto"
                style={{
                  opacity: activeLayer === 'all' || activeLayer === 'red' ? 1 : 0.2,
                  filter: activeLayer === 'red' ? 'drop-shadow(0 0 16px rgba(206,59,59,0.85))' : 'none',
                }}
                onClick={() => handleSelectLayer('red')}
                onMouseEnter={() => handleSelectLayer('red')}
              />
            </g>
            <defs>
              <clipPath id="clip0_interactive_radar">
                <rect width="771" height="949" fill="white" transform="translate(126.5 41.2695)" />
              </clipPath>
            </defs>
          </svg>
        </div>

        {/* Columna derecha: Micro-selector de capas encima de la tarjeta de descripción */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-2.5 sm:space-y-3">
          {/* Micro-selector horizontal de capas: compacto, limpio y encima de la tarjeta */}
          <div className="inline-flex self-start items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-2xs font-sans">
            <button
              type="button"
              onClick={() => handleSelectLayer('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                activeLayer === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              raDAR
            </button>
            <button
              type="button"
              onClick={() => handleSelectLayer('red')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                activeLayer === 'red'
                  ? 'bg-brand-red text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-brand-red'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" />
              <span>Emergencia</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectLayer('blue')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                activeLayer === 'blue'
                  ? 'bg-brand-blue text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-brand-blue'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue shrink-0" />
              <span>Apoyo</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectLayer('yellow')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                activeLayer === 'yellow'
                  ? 'bg-amber-400 text-slate-950 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>Red</span>
            </button>
          </div>

          {/* Tarjeta explicativa de la capa activa: altura estandarizada para eliminar brincos */}
          <div className={`p-4 sm:p-7 rounded-2xl border ${current.borderCol} ${current.accentBg} transition-all duration-300 shadow-xs min-h-[200px] sm:min-h-[210px] flex flex-col justify-start`}>
            <h4 className={`text-xl sm:text-2xl font-extrabold font-sans tracking-tight mb-1 min-h-[28px] sm:min-h-[32px] flex items-center ${current.color}`}>
              {current.title}
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 font-sans min-h-[34px] sm:min-h-[22px] flex items-center">
              {current.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body min-h-[80px] sm:min-h-[70px]">
              {current.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
