// Generates the design artboards: Main.dc.html (variant A – letter garden, rejected)
// and Kitchen.dc.html (variant C – magic kitchen, chosen). Run: node build-artboards.mjs
// UI strings inside the artboards are Czech on purpose (they mirror the game's voice lines).
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const INK = '#3B2A1A';
const FONT = "Fredoka, 'Arial Rounded MT Bold', 'Helvetica Neue', Arial, sans-serif";

const shell = (body) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700">
  <style>
    body { margin: 0; background: #F4EFE6; }
    a { color: #B45309; } a:hover { color: #92400E; }
  </style>
</helmet>
${body}
</x-dc>
<script data-dc-script data-props='{"$preview":{"width":1024,"height":768}}'>
class Component extends DCLogic {}
</script>
</body>
</html>
`;

const svg = (x, y, w, h, vb, inner) =>
  `<svg viewBox="${vb}" width="${w}" height="${h}" style="position:absolute; left:${x}px; top:${y}px; overflow:visible;">${inner}</svg>`;

const S = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// ---------- shared pieces ----------
const speakerIcon = (size) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="flex:none;">
  <path d="M4 9.5v5h3.5l5 4v-13l-5 4z" fill="#FFC53D" ${S(2.2)}></path>
  <path d="M16 8.8a4.5 4.5 0 0 1 0 6.4" fill="none" ${S(2.2)}></path>
  <path d="M18.8 6a8.5 8.5 0 0 1 0 12" fill="none" ${S(2.2)}></path>
</svg>`;

const strawberry = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M20 4 V-2" fill="none" stroke="#3F8F3A" stroke-width="3" stroke-linecap="round"></path>
  <path d="M20 42 C9 37 2 27 2 17 C2 8 10 3 20 3 C30 3 38 8 38 17 C38 27 31 37 20 42 Z" fill="#E5484D" ${S(3)}></path>
  <circle cx="13" cy="17" r="1.8" fill="#FFE08A"></circle><circle cx="22" cy="13" r="1.8" fill="#FFE08A"></circle><circle cx="27" cy="22" r="1.8" fill="#FFE08A"></circle><circle cx="16" cy="27" r="1.8" fill="#FFE08A"></circle><circle cx="24" cy="32" r="1.8" fill="#FFE08A"></circle>
  <ellipse cx="13" cy="5" rx="8" ry="4" transform="rotate(-28 13 5)" fill="#4CAF50" ${S(2.5)}></ellipse>
  <ellipse cx="27" cy="5" rx="8" ry="4" transform="rotate(28 27 5)" fill="#4CAF50" ${S(2.5)}></ellipse>
</g>`;

// ======================================================================
// VARIANT A – letter garden
// ======================================================================

const scenery = svg(0, 0, 1024, 768, '0 0 1024 768', `
  <path d="M0 400 Q180 330 400 395 T760 380 T1024 400 L1024 768 L0 768 Z" fill="#9BD77A"></path>
  <path d="M0 520 Q200 480 460 518 T1024 505 L1024 768 L0 768 Z" fill="#6CC24A"></path>
  <path d="M0 655 Q128 640 256 655 T512 655 T768 655 T1024 655 L1024 768 L0 768 Z" fill="#8B5A2B"></path>
  <g fill="#4EA83A">
    <path d="M40 652 l7 -18 l7 18 z"></path><path d="M250 650 l7 -16 l7 16 z"></path><path d="M470 652 l7 -18 l7 18 z"></path>
    <path d="M540 650 l6 -14 l6 14 z"></path><path d="M760 652 l7 -18 l7 18 z"></path><path d="M990 650 l6 -14 l6 14 z"></path>
  </g>
  <g fill="#6F4421">
    <circle cx="60" cy="705" r="4"></circle><circle cx="180" cy="730" r="3"></circle><circle cx="330" cy="700" r="4"></circle>
    <circle cx="470" cy="740" r="3"></circle><circle cx="610" cy="712" r="4"></circle><circle cx="700" cy="745" r="3"></circle>
    <circle cx="1000" cy="720" r="4"></circle><circle cx="130" cy="755" r="3"></circle><circle cx="560" cy="690" r="3"></circle>
  </g>
`);

const sunRays = [
  [166,100,188,100],[157.2,133,176.2,144],[133,157.2,144,176.2],[100,166,100,188],
  [67,157.2,56,176.2],[42.8,133,23.8,144],[34,100,12,100],[42.8,67,23.8,56],
  [67,42.8,56,23.8],[100,34,100,12],[133,42.8,144,23.8],[157.2,67,176.2,56],
].map(([x1,y1,x2,y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`).join('');
const sun = svg(850, -40, 200, 200, '0 0 200 200', `
  <g stroke="#FFB703" stroke-width="8" stroke-linecap="round">${sunRays}</g>
  <circle cx="100" cy="100" r="52" fill="#FFD23F" ${S(4)}></circle>
`);

const cloud = (x, y, w) => svg(x, y, w, Math.round(w * 60 / 140), '0 0 140 60', `
  <g fill="#FFFFFF">
    <circle cx="35" cy="38" r="22"></circle><circle cx="66" cy="28" r="28"></circle><circle cx="102" cy="36" r="24"></circle>
    <rect x="35" y="36" width="67" height="24" rx="12"></rect>
  </g>
`);

const beeStripes = [
  'M44 54.7 A48 36 0 0 1 56 50.6 L56 119.4 A48 36 0 0 1 44 115.3 Z',
  'M66 49.1 A48 36 0 0 1 78 49.5 L78 120.5 A48 36 0 0 1 66 120.9 Z',
  'M88 51.6 A48 36 0 0 1 100 56.9 L100 113.1 A48 36 0 0 1 88 118.4 Z',
].map(d => `<path d="${d}" fill="${INK}"></path>`).join('');
const bee = svg(36, 64, 160, 140, '0 0 160 140', `
  <ellipse cx="60" cy="44" rx="27" ry="18" transform="rotate(-22 60 44)" fill="#FFFFFF" fill-opacity="0.85" ${S(3)}></ellipse>
  <ellipse cx="92" cy="40" rx="23" ry="15" transform="rotate(-12 92 40)" fill="#FFFFFF" fill-opacity="0.85" ${S(3)}></ellipse>
  <path d="M24 80 L6 86 L24 92 Z" fill="${INK}"></path>
  <ellipse cx="70" cy="85" rx="48" ry="36" fill="#FFD23F" ${S(5)}></ellipse>
  ${beeStripes}
  <ellipse cx="70" cy="85" rx="48" ry="36" fill="none" ${S(5)}></ellipse>
  <g fill="none" ${S(4)}><path d="M50 118 l-6 12"></path><path d="M70 121 v13"></path><path d="M90 118 l6 12"></path></g>
  <path d="M116 46 q-6 -18 -16 -22" fill="none" ${S(4)}></path><circle cx="100" cy="24" r="4.5" fill="${INK}"></circle>
  <path d="M132 44 q2 -20 12 -24" fill="none" ${S(4)}></path><circle cx="144" cy="20" r="4.5" fill="${INK}"></circle>
  <circle cx="126" cy="72" r="28" fill="#FFD23F" ${S(5)}></circle>
  <circle cx="116" cy="80" r="5" fill="#FF8FAB" fill-opacity="0.7"></circle><circle cx="144" cy="80" r="5" fill="#FF8FAB" fill-opacity="0.7"></circle>
  <circle cx="119" cy="66" r="5" fill="${INK}"></circle><circle cx="137" cy="66" r="5" fill="${INK}"></circle>
  <circle cx="121" cy="64" r="1.8" fill="#FFFFFF"></circle><circle cx="139" cy="64" r="1.8" fill="#FFFFFF"></circle>
  <path d="M120 84 q9 8 18 0" fill="none" ${S(3)}></path>
`);

const bubbleA = `<div style="position:absolute; left:200px; top:110px; width:440px; box-sizing:border-box; background:#FFFFFF; border:4px solid ${INK}; border-radius:28px; padding:18px 26px; display:flex; align-items:center; gap:14px; box-shadow:0 6px 0 rgba(59,42,26,0.16);">
  <svg viewBox="0 0 36 40" width="36" height="40" style="position:absolute; left:-28px; top:50%; margin-top:-20px;">
    <path d="M36 6 L4 20 L36 34 Z" fill="#FFFFFF"></path>
    <path d="M26 10 L4 20 L26 30" fill="none" ${S(4)}></path>
  </svg>
  ${speakerIcon(40)}
  <div style="font-size:28px; font-weight:600; color:${INK}; line-height:1.2;">Kde je <span style="color:#E5484D; font-size:38px; font-weight:700;">M</span> jako maminka?</div>
</div>`;

const flower = (x, y, petal, letter) => {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315]
    .map(a => `<ellipse cx="110" cy="52" rx="30" ry="48" transform="rotate(${a} 110 110)"></ellipse>`).join('');
  return `<div style="position:absolute; left:${x}px; top:${y}px; width:220px; height:330px;">
  ${svg(0, 0, 220, 330, '0 0 220 330', `
    <path d="M110 160 V322" fill="none" stroke="#3F8F3A" stroke-width="14" stroke-linecap="round"></path>
    <ellipse cx="80" cy="250" rx="36" ry="16" transform="rotate(-35 80 250)" fill="#4CAF50" ${S(4)}></ellipse>
    <ellipse cx="142" cy="280" rx="36" ry="16" transform="rotate(35 142 280)" fill="#4CAF50" ${S(4)}></ellipse>
    <g fill="${petal}" ${S(4)}>${petals}</g>
    <circle cx="110" cy="110" r="60" fill="#FFF3C4" ${S(4)}></circle>
  `)}
  <div style="position:absolute; left:0; top:0; width:220px; height:220px; display:flex; align-items:center; justify-content:center; font-size:100px; font-weight:600; color:${INK}; line-height:1;">${letter}</div>
</div>`;
};

const sunflowerPetals = Array.from({ length: 12 }, (_, k) =>
  `<ellipse cx="120" cy="64" rx="14" ry="30" transform="rotate(${k * 30} 120 110)"></ellipse>`).join('');
const gardenCorner = svg(800, 280, 220, 340, '0 0 220 340', `
  <path d="M120 330 V150" fill="none" stroke="#3F8F3A" stroke-width="10" stroke-linecap="round"></path>
  <ellipse cx="96" cy="250" rx="30" ry="13" transform="rotate(-30 96 250)" fill="#4CAF50" ${S(3)}></ellipse>
  <ellipse cx="146" cy="212" rx="30" ry="13" transform="rotate(30 146 212)" fill="#4CAF50" ${S(3)}></ellipse>
  <g fill="#FFC53D" ${S(3)}>${sunflowerPetals}</g>
  <circle cx="120" cy="110" r="34" fill="#6B4423" ${S(3)}></circle>
  <text x="120" y="124" font-family="${FONT}" font-size="40" font-weight="700" fill="#FFE08A" text-anchor="middle">E</text>
  <ellipse cx="92" cy="242" rx="12" ry="9" fill="#E5484D" ${S(2.5)}></ellipse>
  <circle cx="81" cy="242" r="5" fill="${INK}"></circle>
  <path d="M92 233 V251" stroke="${INK}" stroke-width="2"></path>
  <circle cx="88" cy="239" r="2.2" fill="${INK}"></circle><circle cx="97" cy="245" r="2.2" fill="${INK}"></circle><circle cx="97" cy="238" r="2" fill="${INK}"></circle>
  <rect x="10" y="320" width="12" height="16" rx="5" fill="#FFF1DC" ${S(3)}></rect>
  <path d="M2 322 A14 12 0 0 1 30 322 Z" fill="#E5484D" ${S(3)}></path>
  <circle cx="16" cy="315" r="2.5" fill="#FFFFFF"></circle>
  <rect x="40" y="304" width="24" height="32" rx="9" fill="#FFF1DC" ${S(3)}></rect>
  <path d="M22 306 A30 24 0 0 1 82 306 Z" fill="#E5484D" ${S(3)}></path>
  <circle cx="40" cy="295" r="4" fill="#FFFFFF"></circle><circle cx="60" cy="290" r="3" fill="#FFFFFF"></circle><circle cx="70" cy="300" r="3" fill="#FFFFFF"></circle>
  <rect x="96" y="316" width="16" height="20" rx="6" fill="#FFF1DC" ${S(3)}></rect>
  <path d="M84 318 A20 16 0 0 1 124 318 Z" fill="#E5484D" ${S(3)}></path>
  <circle cx="96" cy="308" r="3" fill="#FFFFFF"></circle><circle cx="112" cy="310" r="2.5" fill="#FFFFFF"></circle>
  <rect x="148" y="298" width="8" height="38" fill="#B07A3F" ${S(3)}></rect>
  <rect x="128" y="268" width="50" height="36" rx="8" fill="#EFC77E" ${S(3)}></rect>
  <text x="153" y="295" font-family="${FONT}" font-size="28" font-weight="700" fill="${INK}" text-anchor="middle">3</text>
  <rect x="192" y="248" width="8" height="26" fill="#B07A3F" ${S(3)}></rect>
  <rect x="172" y="214" width="46" height="34" rx="8" fill="#EFC77E" ${S(3)}></rect>
  <text x="195" y="240" font-family="${FONT}" font-size="26" font-weight="700" fill="${INK}" text-anchor="middle">O</text>
  <path d="M200 336 V308" fill="none" stroke="#3F8F3A" stroke-width="6" stroke-linecap="round"></path>
  <ellipse cx="188" cy="308" rx="14" ry="7" transform="rotate(-40 188 308)" fill="#6CC24A" ${S(3)}></ellipse>
  <ellipse cx="212" cy="300" rx="14" ry="7" transform="rotate(40 212 300)" fill="#6CC24A" ${S(3)}></ellipse>
`);

const butterfly = svg(700, 236, 90, 70, '0 0 90 70', `
  <ellipse cx="30" cy="28" rx="22" ry="18" transform="rotate(-25 30 28)" fill="#C084FC" ${S(3)}></ellipse>
  <ellipse cx="60" cy="28" rx="22" ry="18" transform="rotate(25 60 28)" fill="#C084FC" ${S(3)}></ellipse>
  <ellipse cx="34" cy="50" rx="14" ry="11" transform="rotate(20 34 50)" fill="#F472B6" ${S(3)}></ellipse>
  <ellipse cx="56" cy="50" rx="14" ry="11" transform="rotate(-20 56 50)" fill="#F472B6" ${S(3)}></ellipse>
  <circle cx="28" cy="26" r="4" fill="#FFFFFF"></circle><circle cx="62" cy="26" r="4" fill="#FFFFFF"></circle>
  <ellipse cx="45" cy="40" rx="5" ry="22" fill="${INK}"></ellipse>
  <path d="M42 20 q-4 -10 -10 -14" fill="none" ${S(3)}></path><path d="M48 20 q4 -10 10 -14" fill="none" ${S(3)}></path>
`);

const drop = (filled) => `<svg viewBox="0 0 24 30" width="22" height="28" style="flex:none;">
  <path d="M12 2 C12 2 3 14 3 19 a9 9 0 0 0 18 0 C21 14 12 2 12 2 Z" fill="${filled ? '#4FA3E0' : '#FFFFFF'}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"${filled ? '' : ' opacity="0.4"'}></path>
</svg>`;
const wateringCan = `<svg viewBox="0 0 64 56" width="52" height="46" style="flex:none;">
  <path d="M26 20 a9 9 0 0 1 18 0" fill="none" ${S(3)}></path>
  <path d="M52 26 a8 8 0 0 1 0 16" fill="none" ${S(3)}></path>
  <path d="M18 26 L3 12 L9 7 L20 22 Z" fill="#5FA8D3" ${S(3)}></path>
  <circle cx="6" cy="9" r="6" fill="#4A8AB5" ${S(3)}></circle>
  <rect x="18" y="20" width="34" height="30" rx="7" fill="#5FA8D3" ${S(3)}></rect>
  <rect x="24" y="26" width="8" height="18" rx="3" fill="#8FC8EA"></rect>
</svg>`;
const progressPill = `<div style="position:absolute; left:776px; top:676px; height:68px; box-sizing:border-box; padding:0 16px 0 12px; background:#FFFFFF; border:4px solid ${INK}; border-radius:40px; display:flex; align-items:center; gap:8px; box-shadow:0 5px 0 rgba(59,42,26,0.18);">
  ${wateringCan}
  <div style="display:flex; gap:4px;">${drop(true)}${drop(true)}${drop(true)}${drop(false)}${drop(false)}</div>
</div>`;

const garden = `<div style="position:relative; width:1024px; height:768px; overflow:hidden; background:linear-gradient(180deg, #AEE2FF 0%, #E3F5FF 55%, #EAF8FF 100%); font-family:${FONT}; color:${INK};">
  ${scenery}
  ${sun}
  ${cloud(150, 14, 140)}
  ${cloud(280, 212, 120)}
  ${cloud(690, 62, 120)}
  ${gardenCorner}
  ${butterfly}
  ${bee}
  ${bubbleA}
  ${flower(90, 330, '#FF8FAB', 'M')}
  ${flower(340, 330, '#FFA94D', 'A')}
  ${flower(590, 330, '#B197FC', 'S')}
  ${progressPill}
</div>`;

// ======================================================================
// VARIANT C – magic kitchen
// ======================================================================

const wallShelves = svg(0, 0, 1024, 768, '0 0 1024 768', `
  <path d="M640 250 L640 276 L614 250 Z" fill="#B07A3F" ${S(3)}></path>
  <path d="M980 250 L980 276 L1006 250 Z" fill="#B07A3F" ${S(3)}></path>
  <rect x="610" y="232" width="400" height="16" rx="4" fill="#D9A066" ${S(4)}></rect>
  <path d="M640 410 L640 436 L614 410 Z" fill="#B07A3F" ${S(3)}></path>
  <path d="M980 410 L980 436 L1006 410 Z" fill="#B07A3F" ${S(3)}></path>
  <rect x="610" y="392" width="400" height="16" rx="4" fill="#D9A066" ${S(4)}></rect>
`);

const bowl = (x, y, color, fruits) => svg(x, y, 120, 89, '0 0 130 96', `
  ${fruits}
  <path d="M4 44 Q12 92 65 92 Q118 92 126 44 Z" fill="${color}" ${S(4)}></path>
  <path d="M4 44 A61 13 0 0 0 126 44" fill="none" ${S(4)}></path>
`);
const bowlStrawberries = bowl(622, 143, '#8FD3E8', `
  ${strawberry(10, 8, 0.9)}${strawberry(44, 2, 0.9)}${strawberry(78, 8, 0.9)}
  ${strawberry(27, 18, 0.9)}${strawberry(61, 18, 0.9)}
`);
const bowlBlueberries = bowl(764, 143, '#F7B7C8', `
  <g fill="#4F6FD8" ${S(3)}>
    <circle cx="26" cy="34" r="12"></circle><circle cx="50" cy="26" r="12"></circle><circle cx="76" cy="28" r="12"></circle>
    <circle cx="100" cy="36" r="12"></circle><circle cx="40" cy="46" r="12"></circle><circle cx="64" cy="44" r="12"></circle><circle cx="88" cy="48" r="12"></circle>
  </g>
  <g fill="#FFFFFF" fill-opacity="0.8"><circle cx="22" cy="30" r="2.5"></circle><circle cx="46" cy="22" r="2.5"></circle><circle cx="72" cy="24" r="2.5"></circle><circle cx="96" cy="32" r="2.5"></circle></g>
`);
const bowlCherries = bowl(896, 143, '#C7E9A3', `
  <g fill="none" stroke="#3F8F3A" stroke-width="3" stroke-linecap="round">
    <path d="M36 26 Q40 8 64 6"></path><path d="M64 22 Q62 12 64 6"></path><path d="M92 26 Q88 8 64 6"></path>
  </g>
  <ellipse cx="70" cy="7" rx="9" ry="4" transform="rotate(-20 70 7)" fill="#4CAF50" ${S(2.5)}></ellipse>
  <g fill="#E5484D" ${S(3)}>
    <circle cx="36" cy="38" r="13"></circle><circle cx="64" cy="34" r="13"></circle><circle cx="92" cy="38" r="13"></circle>
  </g>
  <g fill="#FFFFFF" fill-opacity="0.8"><circle cx="31" cy="33" r="3"></circle><circle cx="59" cy="29" r="3"></circle><circle cx="87" cy="33" r="3"></circle></g>
`);

const cookie = (x, letter) => `<div style="position:absolute; left:${x}px; top:308px; width:84px; height:84px; box-sizing:border-box; border-radius:50%; background:#C98A4B; border:4px solid ${INK}; box-shadow:inset 0 0 0 5px #E0AC74; display:flex; align-items:center; justify-content:center; font-size:48px; font-weight:700; color:#FFFFFF; text-shadow:0 2px 0 rgba(59,42,26,0.35);">${letter}</div>`;
const cookies = cookie(626, 'K') + cookie(724, 'A') + cookie(822, 'M') + cookie(920, 'O');

const bear = svg(70, 210, 260, 300, '0 0 260 300', `
  <circle cx="62" cy="62" r="30" fill="#A0643A" ${S(5)}></circle>
  <circle cx="198" cy="62" r="30" fill="#A0643A" ${S(5)}></circle>
  <circle cx="62" cy="62" r="14" fill="#E8A98A"></circle>
  <circle cx="198" cy="62" r="14" fill="#E8A98A"></circle>
  <ellipse cx="130" cy="262" rx="98" ry="84" fill="#A0643A" ${S(5)}></ellipse>
  <ellipse cx="130" cy="272" rx="58" ry="56" fill="#E9C9A3"></ellipse>
  <path d="M72 196 Q130 228 188 196 L194 216 Q130 250 66 216 Z" fill="#E5484D" ${S(4)}></path>
  <circle cx="130" cy="112" r="86" fill="#A0643A" ${S(5)}></circle>
  <ellipse cx="130" cy="146" rx="42" ry="30" fill="#E9C9A3"></ellipse>
  <ellipse cx="130" cy="132" rx="15" ry="11" fill="${INK}"></ellipse>
  <path d="M116 154 Q130 168 144 154" fill="none" ${S(4)}></path>
  <circle cx="78" cy="132" r="10" fill="#F48FB1" fill-opacity="0.55"></circle>
  <circle cx="182" cy="132" r="10" fill="#F48FB1" fill-opacity="0.55"></circle>
  <circle cx="96" cy="100" r="9" fill="${INK}"></circle><circle cx="164" cy="100" r="9" fill="${INK}"></circle>
  <circle cx="99" cy="97" r="3" fill="#FFFFFF"></circle><circle cx="167" cy="97" r="3" fill="#FFFFFF"></circle>
`);

const floorTiles = [0, 1].map(row => Array.from({ length: 16 }, (_, i) =>
  `<rect x="${i * 64}" y="${696 + row * 36}" width="64" height="36" fill="${(i + row) % 2 === 0 ? '#FBEBD6' : '#F1D4B4'}"></rect>`).join('')).join('');
const counter = svg(0, 0, 1024, 768, '0 0 1024 768', `
  <rect x="0" y="560" width="1024" height="132" fill="#BFE6D6"></rect>
  <rect x="24" y="574" width="300" height="104" rx="12" fill="#D6F1E6" ${S(4)}></rect>
  <rect x="348" y="574" width="300" height="104" rx="12" fill="#D6F1E6" ${S(4)}></rect>
  <rect x="672" y="574" width="300" height="104" rx="12" fill="#D6F1E6" ${S(4)}></rect>
  <circle cx="300" cy="626" r="8" fill="#D9A066" ${S(3)}></circle>
  <circle cx="624" cy="626" r="8" fill="#D9A066" ${S(3)}></circle>
  <circle cx="948" cy="626" r="8" fill="#D9A066" ${S(3)}></circle>
  <rect x="0" y="692" width="1024" height="76" fill="#F1D4B4"></rect>
  ${floorTiles}
  <path d="M0 694 H1024" ${S(4)}></path>
  <rect x="0" y="548" width="1024" height="12" fill="#B07A3F"></rect>
  <rect x="0" y="500" width="1024" height="46" fill="#D9A066"></rect>
  <rect x="0" y="508" width="1024" height="8" fill="#EBC08A"></rect>
  <path d="M0 502 H1024" ${S(4)}></path>
  <path d="M0 546 H1024" ${S(4)}></path>
`);

const paws = svg(0, 0, 1024, 768, '0 0 1024 768', `
  <ellipse cx="128" cy="508" rx="30" ry="17" fill="#A0643A" ${S(4)}></ellipse>
  <ellipse cx="272" cy="508" rx="30" ry="17" fill="#A0643A" ${S(4)}></ellipse>
  <g fill="none" ${S(3)}><path d="M118 514 v-9"></path><path d="M130 515 v-10"></path><path d="M142 513 v-8"></path><path d="M262 514 v-9"></path><path d="M274 515 v-10"></path><path d="M286 513 v-8"></path></g>
`);

const cake = svg(390, 300, 260, 230, '0 0 260 230', `
  <ellipse cx="130" cy="200" rx="122" ry="24" fill="#FFFFFF" ${S(4)}></ellipse>
  <ellipse cx="130" cy="200" rx="96" ry="15" fill="none" stroke="#DCD3C8" stroke-width="3"></ellipse>
  <rect x="36" y="122" width="188" height="72" rx="16" fill="#F7B7C8" ${S(4)}></rect>
  <ellipse cx="130" cy="124" rx="94" ry="22" fill="#FBD1DC" ${S(4)}></ellipse>
  <rect x="62" y="62" width="136" height="62" rx="14" fill="#FDE6B5" ${S(4)}></rect>
  <path d="M62 76 C70 96 80 96 88 76 C96 96 106 96 114 76 C122 96 132 96 140 76 C148 96 158 96 166 76 C174 96 184 96 192 76 L198 76 L198 62 L62 62 Z" fill="#F7B7C8"></path>
  <ellipse cx="130" cy="64" rx="68" ry="17" fill="#FFF3D6" ${S(4)}></ellipse>
  ${strawberry(70, 28, 0.95)}
  ${strawberry(152, 28, 0.95)}
  <circle cx="130" cy="50" r="22" fill="#FFFFFF" fill-opacity="0.6" stroke="${INK}" stroke-width="3" stroke-dasharray="7 6" opacity="0.6"></circle>
`);

const countPill = (n, done) => `<div style="width:44px; height:44px; box-sizing:border-box; border-radius:50%; background:${done ? '#FF8FAB' : '#FFFFFF'}; border:4px solid ${INK}; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700; color:${done ? '#FFFFFF' : '#B9A697'};">${n}</div>`;
const countPills = `<div style="position:absolute; left:442px; top:246px; display:flex; gap:12px;">${countPill(1, true)}${countPill(2, true)}${countPill(3, false)}</div>`;

const miniStrawberry = `<svg viewBox="0 0 40 46" width="34" height="39" style="flex:none;">${strawberry(0, 3, 1)}</svg>`;
const miniCake = `<svg viewBox="0 0 72 64" width="72" height="64" style="flex:none;">
  <ellipse cx="36" cy="56" rx="33" ry="6" fill="#FFFFFF" ${S(3)}></ellipse>
  <rect x="8" y="34" width="56" height="22" rx="7" fill="#F7B7C8" ${S(3)}></rect>
  <rect x="14" y="10" width="44" height="26" rx="6" fill="#FDE6B5" ${S(3)}></rect>
  <text x="36" y="30" font-family="${FONT}" font-size="22" font-weight="700" fill="${INK}" text-anchor="middle">K</text>
</svg>`;
const bubbleC = `<div style="position:absolute; left:60px; top:40px; width:500px; box-sizing:border-box; background:#FFFFFF; border:4px solid ${INK}; border-radius:28px; padding:16px 22px; display:flex; flex-direction:column; gap:8px; box-shadow:0 6px 0 rgba(59,42,26,0.16);">
  <svg viewBox="0 0 40 36" width="40" height="36" style="position:absolute; left:110px; top:100%; margin-top:-8px;">
    <path d="M4 0 L20 34 L36 0 Z" fill="#FFFFFF"></path>
    <path d="M9 10 L20 34 L31 10" fill="none" ${S(4)}></path>
  </svg>
  <div style="display:flex; align-items:center; gap:10px;">
    ${speakerIcon(36)}
    <div style="display:flex; align-items:center; gap:4px;">${miniStrawberry}${miniStrawberry}${miniStrawberry}</div>
    <div style="font-size:34px; font-weight:700; line-height:1; padding:0 4px;">+</div>
    ${miniCake}
  </div>
  <div style="font-size:22px; font-weight:500; color:#8A6F5A; line-height:1.25;">Tři jahody a dortík s písmenkem K!</div>
</div>`;

const starsPill = `<div style="position:absolute; left:826px; top:28px; height:64px; box-sizing:border-box; padding:0 22px 0 16px; background:#FFFFFF; border:4px solid ${INK}; border-radius:40px; display:flex; align-items:center; gap:10px; box-shadow:0 5px 0 rgba(59,42,26,0.16);">
  <svg viewBox="0 0 24 24" width="40" height="40" style="flex:none;">
    <path d="M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.2 6.6L12 17.3l-5.9 3.3 1.2-6.6L2.4 9.4l6.7-.8z" fill="#FFC53D" ${S(2)}></path>
  </svg>
  <div style="font-size:36px; font-weight:700; line-height:1;">7</div>
</div>`;

const kitchen = `<div style="position:relative; width:1024px; height:768px; overflow:hidden; background-color:#FFE9D1; background-image:radial-gradient(#F7D6B3 3px, transparent 3.5px); background-size:48px 48px; font-family:${FONT}; color:${INK};">
  ${wallShelves}
  ${bowlStrawberries}
  ${bowlBlueberries}
  ${bowlCherries}
  ${cookies}
  ${bear}
  ${counter}
  ${paws}
  ${cake}
  ${countPills}
  ${bubbleC}
  ${starsPill}
</div>`;

writeFileSync(join(here, 'Main.dc.html'), shell(garden));
writeFileSync(join(here, 'Kitchen.dc.html'), shell(kitchen));
console.log('ok: Main.dc.html, Kitchen.dc.html');
