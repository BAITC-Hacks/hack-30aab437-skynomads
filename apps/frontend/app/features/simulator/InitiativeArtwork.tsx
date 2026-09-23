import React, { useId } from 'react';

/* Original vector miniatures; no remote images or image-generation service. */
export const InitiativeArtwork = ({ measureId }: { measureId: string }) => {
  const id = useId().replace(/:/g, '');
  const night = measureId === 'M10';
  const tree = (x: number, y: number, size = 1) => (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path d="M0 0V-25" stroke="#70644a" strokeWidth="3" />
      <ellipse cx="0" cy="-27" rx="12" ry="17" fill="#325d40" />
      <ellipse cx="-4" cy="-31" rx="8" ry="12" fill="#649353" />
    </g>
  );
  const building = (x: number, y: number, w: number, h: number, color = '#ddd8c6') => (
    <g>
      <path d={`M${x} ${y}v-${h}h${w}v${h}Z`} fill={color} />
      <path d={`M${x + w} ${y}l10 -6v-${h}l-10 6Z`} fill="#7e9297" />
      <path d={`M${x} ${y - h}l10 -6h${w}l-10 6Z`} fill="#f1efdf" />
      {Array.from({ length: Math.max(1, Math.floor(h / 12)) }, (_, row) =>
        Array.from({ length: Math.max(1, Math.floor(w / 10)) }, (_, col) =>
          <rect key={`${row}-${col}`} x={x + 4 + col * 10} y={y - h + 5 + row * 12} width="5" height="7" fill="#406981" />))}
    </g>
  );
  const bus = (color: string, tram = false) => (
    <g transform="translate(5 0)">
      <ellipse cx="77" cy="116" rx="64" ry="8" fill="#203341" opacity=".4" />
      <path d="M16 70L98 58L134 77V108L49 123L16 104Z" fill={color} />
      <path d="M16 70L98 58L134 77L49 89Z" fill="#e8ecea" />
      <path d="M49 89L134 77V108L49 123Z" fill={color} />
      <path d="M53 92L130 81V98L53 111Z" fill="#244858" />
      <path d="M20 77L43 92V107L20 95Z" fill="#29424e" />
      {[68, 84, 101, 117].map((x) => <path key={x} d={`M${x} ${91 - (x - 53) * .14}v18`} stroke="#b7d6de" strokeWidth="2" />)}
      <path d="M55 115L130 103" stroke="#d7e5e7" strokeWidth="2" />
      <ellipse cx="66" cy="118" rx="6" ry="8" fill="#202c32" /><ellipse cx="117" cy="110" rx="6" ry="8" fill="#202c32" />
      <ellipse cx="66" cy="118" rx="2.5" ry="4" fill="#8a989f" /><ellipse cx="117" cy="110" rx="2.5" ry="4" fill="#8a989f" />
      <path d="M23 99l7 4M35 106l7 4" stroke="#fff3bf" strokeWidth="3" />
      {tram && <path d="M68 68l13 -17l14 11M50 132l106 -19M32 139l105 -19" fill="none" stroke="#8c9390" strokeWidth="3" />}
    </g>
  );
  let subject: React.ReactNode;
  switch (measureId) {
    case 'M1': subject = <>{tree(15, 92)}<path d="M0 106L160 79V160H0Z" fill="#57696d" /><path d="M0 145L160 117" stroke="#ece6b5" strokeWidth="4" strokeDasharray="18 10" />{bus('#e3e5d7')}</>; break;
    case 'M2': subject = <><path d="M0 112l160 -25v73H0Z" fill="#52636c" /><path d="M15 145l136 -25" stroke="#eee9d7" strokeWidth="5" strokeDasharray="12 8" /><path d="M106 135V42H52" fill="none" stroke="#647477" strokeWidth="6" /><rect x="39" y="43" width="26" height="61" rx="5" fill="#263640" />{['#a45147','#ab994a','#66dc84'].map((c,i) => <circle key={c} cx="52" cy={55+i*18} r="6" fill={c} />)}<path d="M98 31q13 -14 26 0M102 37q9 -9 18 0" fill="none" stroke="#90d7eb" strokeWidth="3" /></>; break;
    case 'M3': subject = <><path d="M0 109L160 84V160H0Z" fill="#b1b1a1" /><path d="M20 0V97M145 0V93M0 27L160 6" stroke="#77868a" strokeWidth="2" />{bus('#5d9cab', true)}</>; break;
    case 'M4': subject = <><path d="M0 81Q83 68 160 89V160H0Z" fill="#739853" /><path d="M53 160Q48 118 108 86" fill="none" stroke="#d9c99d" strokeWidth="17" />{tree(25,123,1.5)}{tree(127,108,1.3)}{tree(86,87,.7)}<path d="M90 134l39 -9M90 127l39 -9" stroke="#996548" strokeWidth="6" /><path d="M95 134v11M124 128v10" stroke="#364b49" strokeWidth="3" /></>; break;
    case 'M5': subject = <>{building(24,126,67,36,'#d5b389')}<path d="M17 90l40 -31l51 26l-17 5H24Z" fill="#956d50" /><path d="M90 72V49h10v28" fill="#dad1b6" /><rect x="113" y="83" width="25" height="53" rx="9" fill="#d9e9e2" /><path d="M114 97h23M125 84V73h-9" fill="none" stroke="#559990" strokeWidth="4" />{tree(16,129,.65)}</>; break;
    case 'M6': subject = <><path d="M0 81h160v79H0Z" fill="#769657" /><path d="M61 160L95 80" stroke="#c8b78e" strokeWidth="17" />{[0,1,2].map((n) => <g key={n}>{tree(38-n*9,94+n*25,.65+n*.3)}{tree(114+n*7,94+n*25,.65+n*.3)}</g>)}</>; break;
    case 'M7': subject = <>{building(16,120,94,54,'#e7c693')}{building(105,128,26,38,'#83b6b3')}<path d="M18 67h95" stroke="#bc7650" strokeWidth="5" /><rect x="55" y="96" width="20" height="24" fill="#4a7378" /><path d="M24 143h25M100 141h31" stroke="#e1b54b" strokeWidth="5" />{tree(142,133,.8)}</>; break;
    case 'M8': subject = <>{building(25,130,90,65,'#e9e7dc')}<rect x="47" y="56" width="40" height="31" fill="#eff6eb" /><path d="M67 62v19M58 71h18" stroke="#bc5551" strokeWidth="7" /><rect x="59" y="108" width="23" height="22" fill="#497c8d" /><path d="M51 130h40" stroke="#d8e3e1" strokeWidth="4" />{tree(17,143,.75)}</>; break;
    case 'M9': subject = <><path d="M13 91L119 75L151 133L37 154Z" fill="#658e75" stroke="#c5d5af" strokeWidth="3" /><path d="M80 82l18 63M20 110l120 -8" stroke="#d8e3ca" strokeWidth="2" /><ellipse cx="85" cy="112" rx="17" ry="10" fill="none" stroke="#eee4c8" strokeWidth="2" /><path d="M35 107V55h24" fill="none" stroke="#435e64" strokeWidth="4" /><rect x="47" y="49" width="19" height="15" fill="#e8e3d1" /><path d="M53 66h13" stroke="#bc6c45" strokeWidth="3" /></>; break;
    case 'M10': subject = <><path d="M0 113l160 -22v69H0Z" fill="#34454c" /><path d="M79 38L26 142H132Z" fill="#ffe7a4" opacity=".14" /><path d="M83 142V31q0 -10 -11 -10H53" fill="none" stroke="#b2bfc2" strokeWidth="5" /><path d="M50 24h23" stroke="#ffecad" strokeWidth="5" /><path d="M84 63h24" stroke="#acbac3" strokeWidth="4" /><path d="M100 53l26 5l-4 14l-25 -5Z" fill="#eef0dc" /><circle cx="119" cy="64" r="5" fill="#2c5668" /></>; break;
    case 'M11': subject = <><path d="M0 88h160v72H0Z" fill="#5e6b70" />{[20,41,62,83,104,125].map((x) => <path key={x} d={`M${x} 112l-9 32h13l10 -32Z`} fill="#f4edda" />)}<path d="M123 109V39" stroke="#8a9690" strokeWidth="4" /><rect x="105" y="34" width="36" height="36" rx="3" fill="#40819b" stroke="#e9e2c2" strokeWidth="3" /><path d="M123 41l-12 22h25Z" fill="#edf0de" />{tree(18,102,.8)}</>; break;
    case 'M12': subject = <><rect x="24" y="51" width="105" height="72" rx="6" fill="#ecede1" /><rect x="30" y="57" width="93" height="55" rx="2" fill="#376b84" /><path d="M62 124v12H43h68H94v-12" fill="#9eb2b7" /><rect x="43" y="69" width="64" height="9" rx="3" fill="#b7ded8" /><path d="M45 89l8 7l14 -15M76 88h30M76 98h20" fill="none" stroke="#93d6ac" strokeWidth="4" /><rect x="109" y="96" width="27" height="46" rx="5" fill="#dce7e3" /><rect x="114" y="102" width="17" height="30" fill="#427994" /></>; break;
    case 'M13': subject = <><path d="M0 102h160v58H0Z" fill="#9f876a" /><path d="M0 115h160v45H0Z" fill="#695345" /><path d="M10 137h76v-29h59" fill="none" stroke="#b0c6c7" strokeWidth="15" /><path d="M10 133h72v-29h63" fill="none" stroke="#dae0d1" strokeWidth="4" /><path d="M109 108V87" stroke="#bc6f42" strokeWidth="5" /><ellipse cx="109" cy="84" rx="13" ry="5" fill="none" stroke="#c34d3d" strokeWidth="4" />{building(14,101,34,39)}</>; break;
    default: subject = <><path d="M0 105l160 -10v65H0Z" fill="#59696c" />{bus('#d69744')}<rect x="68" y="65" width="15" height="5" rx="2" fill="#69c7ec" /><path d="M145 39l-22 39h37Z" fill="#efbc55" stroke="#e9e2b9" strokeWidth="3" /><path d="M145 49v16M145 70v2" stroke="#604a30" strokeWidth="4" /></>;
  }
  return (
    <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden="true" focusable="false">
      <defs><linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor={night ? '#20344e' : '#89adbf'} /><stop offset="1" stopColor={night ? '#67798c' : '#e3e5c9'} /></linearGradient><linearGradient id={`${id}-shade`} x2="1" y2="1"><stop stopColor="#fff3d2" stopOpacity=".15" /><stop offset="1" stopColor="#0c2737" stopOpacity=".25" /></linearGradient></defs>
      <rect width="160" height="160" fill={`url(#${id}-sky)`} />
      <circle cx="128" cy="23" r="12" fill={night ? '#e0e9dd' : '#fff2c5'} opacity=".8" />
      <g opacity=".6">{building(2,93,23,48,'#9aaeb0')}{building(39,91,27,64,'#a8b8b6')}{building(89,91,26,44,'#b3bbb2')}{building(132,96,26,61,'#859fa6')}</g>
      <path d="M0 95Q60 83 160 92V160H0Z" fill={night ? '#536c60' : '#8caa74'} />
      {subject}
      <rect width="160" height="160" fill={`url(#${id}-shade)`} />
    </svg>
  );
};
