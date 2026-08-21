/* =========================================================================
   FIT CASINO — Symbol glyph library
   Every symbol is an original hand-authored SVG path (no emoji, no
   third-party artwork). Each "role" (low1..scatter) has one glyph shape;
   themes recolor + relabel the same shape system for visual identity.
========================================================================= */

const ROLE_GLYPHS = {
  low1: `<path d="M50 8 L86 50 L50 92 L14 50 Z" fill="url(#g)"/><path d="M50 8 L86 50 L50 50 Z" fill="#fff" opacity=".18"/>`,
  low2: `<circle cx="50" cy="50" r="38" fill="url(#g)"/><circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3"/><circle cx="50" cy="50" r="22" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>`,
  low3: `<path d="M50 10 C68 34 78 50 78 64 A28 28 0 0 1 22 64 C22 50 32 34 50 10 Z" fill="url(#g)"/><ellipse cx="41" cy="60" rx="7" ry="11" fill="#fff" opacity=".22"/>`,
  low4: `<path d="M50 6 L88 27 L88 73 L50 94 L12 73 L12 27 Z" fill="url(#g)"/><path d="M50 6 L88 27 L50 48 L12 27 Z" fill="#fff" opacity=".15"/>`,
  mid1: `<path d="M50 6 L84 20 V46 C84 70 70 86 50 94 C30 86 16 70 16 46 V20 Z" fill="url(#g)"/><path d="M50 20 L50 78 M32 40 L68 40" stroke="#fff" stroke-opacity=".3" stroke-width="4" stroke-linecap="round"/>`,
  mid2: `<path d="M62 8 A34 34 0 1 0 62 92 A28 28 0 1 1 62 8 Z" fill="url(#g)"/><circle cx="72" cy="30" r="4" fill="#fff" opacity=".5"/>`,
  mid3: `<path d="M50 6 C30 26 22 42 22 58 A28 28 0 0 0 78 58 C78 42 70 26 50 6 Z M50 34 C58 46 62 54 62 62 A12 12 0 0 1 38 62 C38 54 42 46 50 34 Z" fill="url(#g)" fill-rule="evenodd"/>`,
  high: `<path d="M50 4 L61 36 L94 36 L67 56 L78 90 L50 70 L22 90 L33 56 L6 36 L39 36 Z" fill="url(#g)"/><path d="M50 4 L61 36 L94 36 L67 56 L78 90 L50 70 Z" fill="#fff" opacity=".12"/>`,
  wild: `<path d="M12 40 L28 62 L50 22 L72 62 L88 40 L82 78 L18 78 Z" fill="url(#g)"/><circle cx="50" cy="16" r="7" fill="url(#g)"/><circle cx="14" cy="36" r="6" fill="url(#g)"/><circle cx="86" cy="36" r="6" fill="url(#g)"/>`,
  scat: `<path d="M16 40 H84 V78 A6 6 0 0 1 78 84 H22 A6 6 0 0 1 16 78 Z" fill="url(#g)"/><path d="M12 30 A8 8 0 0 1 20 22 H80 A8 8 0 0 1 88 30 V42 H12 Z" fill="url(#g2)"/><circle cx="50" cy="42" r="7" fill="#1a1330"/><path d="M50 6 C40 6 34 14 34 22 H66 C66 14 60 6 50 6Z" fill="none" stroke="url(#g)" stroke-width="4"/>`
};

const ROLE_LABELS_FALLBACK = {
  low1:'Кристалл', low2:'Монета', low3:'Капля', low4:'Талисман',
  mid1:'Щит', mid2:'Полумесяц', mid3:'Пламя', high:'Звезда',
  wild:'Корона (Wild)', scat:'Сундук (Scatter)'
};

// theme -> gradient colour stops used inside each symbol
const THEME_PALETTES = {
  pharaoh:  { a:'#ffe9a8', b:'#e8b84b', c:'#a9781f' },
  thunder:  { a:'#d9c7ff', b:'#8b5cf6', c:'#4c2f9e' },
  candy:    { a:'#ffd6ec', b:'#ff6fa8', c:'#c23d78' },
  frontier: { a:'#ffd9ad', b:'#d97a3a', c:'#7a4118' },
  dragon:   { a:'#ffb3ad', b:'#e2432f', c:'#8c1f14' },
  pirate:   { a:'#bfe8ff', b:'#2fa6c9', c:'#125670' },
  fruit:    { a:'#d4ffb0', b:'#4caf50', c:'#245c27' },
};

let uidCounter = 0;
function renderSymbolSVG(role, themeKey, extraClass){
  const pal = THEME_PALETTES[themeKey] || THEME_PALETTES.pharaoh;
  const uid = 'sg' + (uidCounter++);
  const glyph = ROLE_GLYPHS[role] || ROLE_GLYPHS.low1;
  return `<svg viewBox="0 0 100 100" class="${extraClass||''}" data-role="${role}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${pal.a}"/>
        <stop offset=".55" stop-color="${pal.b}"/>
        <stop offset="1" stop-color="${pal.c}"/>
      </linearGradient>
      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${pal.b}"/>
        <stop offset="1" stop-color="${pal.c}"/>
      </linearGradient>
    </defs>
    ${glyph}
  </svg>`.replace(/id="g"/g, `id="${uid}g"`).replace(/id="g2"/g, `id="${uid}g2"`)
         .replace(/url\(#g\)/g, `url(#${uid}g)`).replace(/url\(#g2\)/g, `url(#${uid}g2)`);
}
