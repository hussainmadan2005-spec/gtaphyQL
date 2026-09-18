
import { formatKB } from "./utils.js";

// Design tokens
const C = {
  cyan:    '#00d4ff',
  violet:  '#8b5cf6',
  green:   '#00e5a0',
  rose:    '#ff4d6d',
  amber:   '#fbbf24',
  bg:      '#050810',
  border:  'rgba(80,120,220,0.12)',
  text:    '#f0f4ff',
  dim:     '#8896b0',
  muted:   '#3d4a63',
};

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function noData(id, msg = 'No data available') {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<text x="20" y="40" fill="${C.muted}" font-size="13" font-family="'DM Mono',monospace">${esc(msg)}</text>`;
}

// ══════════════════════════════════════════════════════
// 1. AUDIT RATIO — Donut / ring chart
// ══════════════════════════════════════════════════════
export function drawAuditChart(up, down) {
  const svg = document.getElementById('auditChart');
  if (!svg) return;

  if (up === 0 && down === 0) { noData('auditChart', 'No audit data yet'); return; }

  const W = 560, H = 400;
  const cx = 190, cy = H / 2;
  const R = 120, sw = 24;
  const circ = 2 * Math.PI * R;
  const total = up + down || 1;
  const upRatio = up / total;
  const ratio = down > 0 ? up / down : up;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `
    <defs>
      <linearGradient id="gGiven" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${C.green}"/>
        <stop offset="100%" stop-color="#00ffc0"/>
      </linearGradient>
      <linearGradient id="gRecv" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${C.cyan}"/>
        <stop offset="100%" stop-color="#007fff"/>
      </linearGradient>
      <filter id="glow1">
        <feGaussianBlur stdDeviation="8" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- Outer glow ring -->
    <circle cx="${cx}" cy="${cy}" r="${R+16}" fill="none"
      stroke="rgba(0,212,255,0.08)" stroke-width="${sw+12}"/>

    <!-- Base ring -->
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none"
      stroke="rgba(255,255,255,0.05)" stroke-width="${sw}"/>

    <!-- Given arc (green) -->
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none"
      stroke="url(#gGiven)" stroke-width="${sw}"
      stroke-dasharray="${circ*upRatio} ${circ*(1-upRatio)}"
      transform="rotate(-90 ${cx} ${cy})"
      stroke-linecap="round" filter="url(#glow1)"/>

    <!-- Received arc (cyan) -->
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none"
      stroke="url(#gRecv)" stroke-width="${sw}"
      stroke-dasharray="${circ*(1-upRatio)} ${circ*upRatio}"
      stroke-dashoffset="${-circ*upRatio}"
      transform="rotate(-90 ${cx} ${cy})"
      stroke-linecap="round"/>

    <!-- Center labels -->
    <text x="${cx}" y="${cy-8}" text-anchor="middle"
      fill="${C.cyan}" font-size="56" font-weight="800"
      font-family="'DM Mono',monospace" letter-spacing="-2">
      ${Number(ratio.toFixed(1))}
    </text>
    <text x="${cx}" y="${cy+28}" text-anchor="middle"
      fill="${C.muted}" font-size="13" font-family="'DM Mono',monospace"
      letter-spacing="3" text-transform="uppercase">
      RATIO
    </text>

    <!-- Legend - Given -->
    <circle cx="${cx+R+40}" cy="${cy-50}" r="7" fill="${C.green}"/>
    <text x="${cx+R+54}" y="${cy-44}" fill="${C.text}" font-size="15"
      font-family="'DM Mono',monospace" font-weight="500">Given</text>
    <text x="${cx+R+54}" y="${cy-24}" fill="${C.green}" font-size="17"
      font-weight="600" font-family="'DM Mono',monospace">${formatKB(up)}</text>

    <!-- Legend - Received -->
    <circle cx="${cx+R+40}" cy="${cy+30}" r="7" fill="${C.cyan}"/>
    <text x="${cx+R+54}" y="${cy+36}" fill="${C.text}" font-size="15"
      font-family="'DM Mono',monospace" font-weight="500">Received</text>
    <text x="${cx+R+54}" y="${cy+56}" fill="${C.cyan}" font-size="17"
      font-weight="600" font-family="'DM Mono',monospace">${formatKB(down)}</text>
  `;
}

// ══════════════════════════════════════════════════════
// 2. PASS / FAIL — Split horizontal bar
// ══════════════════════════════════════════════════════
export function drawPassFailChart(pass, fail) {
  const svg = document.getElementById('passFailChart');
  if (!svg) return;

  const total = pass + fail || 1;
  const W = 320, H = 260;
  const bX = 24, bY = 100, bW = 272, bH = 28, bR = 14;

  const passW = Math.max(pass > 0 ? 14 : 0, (pass / total) * bW);
  const failX = bX + passW;
  const failW = bW - passW;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `
    <defs>
      <linearGradient id="gPass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${C.green}"/>
        <stop offset="100%" stop-color="#00ffc0"/>
      </linearGradient>
      <linearGradient id="gFail" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ff4d6d"/>
        <stop offset="100%" stop-color="#ff0040"/>
      </linearGradient>
      <filter id="glow2" x="-30%" y="-80%" width="160%" height="260%">
        <feGaussianBlur stdDeviation="5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- counts -->
    <text x="${bX}" y="60" fill="${C.green}" font-size="40" font-weight="800"
      font-family="'DM Mono',monospace">${pass}</text>
    <text x="${bX + bW}" y="60" text-anchor="end" fill="${C.rose}" font-size="40"
      font-weight="800" font-family="'DM Mono',monospace">${fail}</text>
    <text x="${bX}" y="80" fill="${C.muted}" font-size="10"
      font-family="'DM Mono',monospace" letter-spacing="1.5">PASSED</text>
    <text x="${bX + bW}" y="80" text-anchor="end" fill="${C.muted}" font-size="10"
      font-family="'DM Mono',monospace" letter-spacing="1.5">FAILED</text>

    <!-- track -->
    <rect x="${bX}" y="${bY}" width="${bW}" height="${bH}" rx="${bR}"
      fill="rgba(255,255,255,0.04)"/>

    <!-- pass fill -->
    ${pass > 0 ? `<path d="M ${bX+bR} ${bY} H ${bX+passW} V ${bY+bH} H ${bX+bR}
      Q ${bX} ${bY+bH} ${bX} ${bY+bH-bR} V ${bY+bR} Q ${bX} ${bY} ${bX+bR} ${bY} Z"
      fill="url(#gPass)" filter="url(#glow2)"/>` : ''}

    <!-- fail fill -->
    ${fail > 0 ? `<path d="M ${failX} ${bY} H ${bX+bW-bR}
      Q ${bX+bW} ${bY} ${bX+bW} ${bY+bR} V ${bY+bH-bR}
      Q ${bX+bW} ${bY+bH} ${bX+bW-bR} ${bY+bH} H ${failX} Z"
      fill="url(#gFail)"/>` : ''}

    <!-- percent pills -->
    ${pass > 0 ? `
    <rect x="${bX}" y="${bY+bH+10}" rx="8" width="50" height="22"
      fill="rgba(0,229,160,0.1)"/>
    <text x="${bX+25}" y="${bY+bH+25}" text-anchor="middle"
      fill="${C.green}" font-size="11" font-weight="600"
      font-family="'DM Mono',monospace">${Math.round(pass/total*100)}%</text>` : ''}

    ${fail > 0 ? `
    <rect x="${bX+bW-50}" y="${bY+bH+10}" rx="8" width="50" height="22"
      fill="rgba(255,77,109,0.10)"/>
    <text x="${bX+bW-25}" y="${bY+bH+25}" text-anchor="middle"
      fill="${C.rose}" font-size="11" font-weight="600"
      font-family="'DM Mono',monospace">${Math.round(fail/total*100)}%</text>` : ''}

    <!-- total -->
    <text x="${W/2}" y="${H-12}" text-anchor="middle"
      fill="${C.muted}" font-size="11" font-family="'DM Mono',monospace">
      ${total} projects total
    </text>
  `;
}

// ══════════════════════════════════════════════════════
// 3. XP TIMELINE — Line chart
// ══════════════════════════════════════════════════════
export function drawXPTimeline(timeline) {
  const svg = document.getElementById('xpTimelineChart');
  if (!svg) return;

  if (!timeline || timeline.length < 2) {
    noData('xpTimelineChart', 'Not enough XP data to draw a chart');
    return;
  }

  const W = 900, H = 260;
  const PAD = { top: 24, right: 30, bottom: 44, left: 68 };
  const pW = W - PAD.left - PAD.right;
  const pH = H - PAD.top  - PAD.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const dates  = timeline.map(p => new Date(p.date).getTime());
  const xpVals = timeline.map(p => p.xp);
  const minD = Math.min(...dates), maxD = Math.max(...dates);
  const maxXP = Math.max(...xpVals) || 1;

  const sx = d => PAD.left + ((d - minD) / (maxD - minD || 1)) * pW;
  const sy = v => PAD.top  + pH - (v / maxXP) * pH;

  // Y grid
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const v = (maxXP / 4) * i;
    const y = sy(v);
    grid += `
      <line x1="${PAD.left}" y1="${y}" x2="${PAD.left+pW}" y2="${y}"
        stroke="rgba(80,120,220,0.08)" stroke-width="1"/>
      <text x="${PAD.left-8}" y="${y}" text-anchor="end" dominant-baseline="middle"
        fill="${C.muted}" font-size="10" font-family="'DM Mono',monospace">
        ${formatKB(v)}
      </text>`;
  }

  // X labels - show only unique months
  let xLabels = '';
  const seenMonths = new Set();
  const labelIndices = [];
  
  // Find indices where month changes
  for (let i = 0; i < timeline.length; i++) {
    const d = new Date(timeline[i].date);
    const monthYear = `${d.getMonth()}-${d.getFullYear()}`;
    if (!seenMonths.has(monthYear)) {
      seenMonths.add(monthYear);
      labelIndices.push(i);
    }
  }
  
  // Draw labels for unique months, but limit to avoid crowding
  const maxLabels = 8;
  const labelStep = Math.max(1, Math.floor(labelIndices.length / maxLabels));
  
  for (let idx = 0; idx < labelIndices.length; idx += labelStep) {
    const i = labelIndices[idx];
    const x = sx(new Date(timeline[i].date).getTime());
    const d = new Date(timeline[i].date);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.toLocaleDateString('en-US', { year: '2-digit' });
    xLabels += `
      <line x1="${x}" y1="${PAD.top+pH}" x2="${x}" y2="${PAD.top+pH+4}"
        stroke="rgba(80,120,220,0.2)" stroke-width="1"/>
      <text x="${x}" y="${H-PAD.bottom+14}" text-anchor="middle"
        fill="${C.muted}" font-size="10" font-family="'DM Mono',monospace">
        ${month}
      </text>
      <text x="${x}" y="${H-PAD.bottom+26}" text-anchor="middle"
        fill="${C.muted}" font-size="9" font-family="'DM Mono',monospace" opacity="0.6">
        ${year}
      </text>`;
  }

  // Points
  const pts = timeline.map(p => [sx(new Date(p.date).getTime()), sy(p.xp)]);
  const poly = pts.map(([x,y]) => `${x},${y}`).join(' ');
  const fill = [`${PAD.left},${PAD.top+pH}`, ...pts.map(([x,y])=>`${x},${y}`), `${PAD.left+pW},${PAD.top+pH}`].join(' ');

  const last = pts[pts.length - 1];
  const lastXP = timeline[timeline.length - 1].xp;

  svg.innerHTML = `
    <defs>
      <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="${C.cyan}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${C.cyan}" stop-opacity="0"/>
      </linearGradient>
    </defs>

    ${grid}
    ${xLabels}

    <polygon points="${fill}" fill="url(#timeGrad)"/>
    <polyline points="${poly}" fill="none" stroke="${C.cyan}" stroke-width="2.5"
      stroke-linejoin="round" stroke-linecap="round"/>

    <!-- axes -->
    <line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${PAD.top+pH}"
      stroke="rgba(80,120,220,0.15)" stroke-width="1"/>
    <line x1="${PAD.left}" y1="${PAD.top+pH}" x2="${PAD.left+pW}" y2="${PAD.top+pH}"
      stroke="rgba(80,120,220,0.15)" stroke-width="1"/>

    <!-- end dot -->
    <circle cx="${last[0]}" cy="${last[1]}" r="5"
      fill="${C.cyan}" stroke="${C.bg}" stroke-width="2"/>
    <text x="${last[0]}" y="${last[1]-12}" text-anchor="middle"
      fill="${C.cyan}" font-size="11" font-weight="500"
      font-family="'DM Mono',monospace">${formatKB(lastXP)}</text>
  `;
}

// ══════════════════════════════════════════════════════
// 4. XP PER PROJECT — Horizontal bars
// ══════════════════════════════════════════════════════
export function drawXPPerProject(data) {
  const svg = document.getElementById('xpProjectChart');
  if (!svg) return;

  if (!data || data.length === 0) { noData('xpProjectChart', 'No project XP data'); return; }

  const items    = data.slice(0, 12);
  const barH     = 15;
  const gap      = 6;
  const labelW   = 130;
  const barMaxW  = 240;
  const W        = labelW + barMaxW + 60;
  const H        = items.length * (barH + gap) + 42;
  const maxXP    = items[0]?.xp || 1;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  let bars = '';
  items.forEach((d, i) => {
    const y    = 34 + i * (barH + gap);
    const name = d.name.length > 18 ? d.name.slice(0, 17) + '…' : d.name;
    const barW = Math.max(4, (d.xp / maxXP) * barMaxW);

    bars += `
      <text x="${labelW-8}" y="${y+barH/2+1}" text-anchor="end"
        dominant-baseline="middle" fill="${C.dim}"
        font-size="9" font-family="'DM Mono',monospace">${esc(name)}</text>
      <rect x="${labelW}" y="${y}" width="${barMaxW}" height="${barH}" rx="4"
        fill="rgba(255,255,255,0.03)"/>
      <rect x="${labelW}" y="${y}" width="${barW}" height="${barH}" rx="4"
        fill="url(#barGrad)"
        class="xpBar" data-name="${esc(d.name)}" data-xp="${d.xp}"/>
      <text x="${labelW+barW+8}" y="${y+barH/2+1}"
        dominant-baseline="middle" fill="${C.muted}"
        font-size="8" font-family="'DM Mono',monospace">${formatKB(d.xp)}</text>`;
  });

  svg.innerHTML = `
    <defs>
      <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="${C.violet}"/>
        <stop offset="100%" stop-color="${C.cyan}"/>
      </linearGradient>
      <filter id="barGlow">
        <feGaussianBlur stdDeviation="4" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <text x="${labelW}" y="22" fill="${C.dim}" font-size="11"
      font-family="'DM Mono',monospace" letter-spacing="1.5" text-transform="uppercase">
      PROJECT
    </text>
    <text x="${labelW+barMaxW}" y="22" text-anchor="end" fill="${C.muted}" font-size="11"
      font-family="'DM Mono',monospace">${items.length} shown</text>

    ${bars}
  `;

  // No hover tooltips - removed for cleaner look
}

// ══════════════════════════════════════════════════════
// 5. SKILL RADAR — Polygon radar chart
// ══════════════════════════════════════════════════════
export function drawSkillRadar(skills) {
  const svg = document.getElementById('skillRadarChart');
  if (!svg) return;

  if (!skills || skills.length < 3) {
    noData('skillRadarChart', 'Need at least 3 skills for radar chart');
    return;
  }

  const items = skills.slice(0, 8);
  const n     = items.length;
  const W = 340, H = 320;
  const cx = W / 2, cy = H / 2 + 10;
  const maxR   = 110;
  const maxVal = items[0].amount || 1;
  const levels = 4;

  // Angle for each skill axis (start from top, -90deg)
  const angle = i => (i / n) * 2 * Math.PI - Math.PI / 2;
  const pt    = (i, r) => [
    cx + r * Math.cos(angle(i)),
    cy + r * Math.sin(angle(i)),
  ];

  // Grid rings
  let rings = '';
  for (let l = 1; l <= levels; l++) {
    const r = (maxR / levels) * l;
    const pts = Array.from({length: n}, (_, i) => pt(i, r).join(',')).join(' ');
    rings += `<polygon points="${pts}" fill="none"
      stroke="rgba(80,120,220,0.15)" stroke-width="1"/>`;
  }

  // Axis spokes and labels
  let axes = '', labels = '';
  items.forEach((s, i) => {
    const [x2, y2] = pt(i, maxR + 2);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}"
      stroke="rgba(80,120,220,0.18)" stroke-width="1"/>`;

    const [lx, ly] = pt(i, maxR + 22);
    const name = s.name.length > 10 ? s.name.slice(0, 9) + '…' : s.name;
    const anchor = lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle';
    labels += `<text x="${lx}" y="${ly}" text-anchor="${anchor}"
      dominant-baseline="middle" fill="${C.dim}" font-size="11"
      font-family="'DM Mono',monospace" font-weight="500">
      ${esc(name.toUpperCase())}
    </text>`;
  });

  // Data polygon
  const dataPts = items.map((s, i) => {
    const r = (s.amount / maxVal) * maxR;
    return pt(i, r).join(',');
  }).join(' ');

  // Individual dots
  const dots = items.map((s, i) => {
    const r = (s.amount / maxVal) * maxR;
    const [x, y] = pt(i, r);
    return `<circle cx="${x}" cy="${y}" r="4"
      fill="${C.violet}" stroke="${C.bg}" stroke-width="2"/>`;
  }).join('');

  // Skills count badge
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `
    <defs>
      <radialGradient id="radarGrad" cx="50%" cy="50%">
        <stop offset="0%"   stop-color="${C.violet}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${C.violet}" stop-opacity="0.05"/>
      </radialGradient>
      <filter id="radarGlow">
        <feGaussianBlur stdDeviation="4" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- Grid rings -->
    ${rings}

    <!-- Axis spokes -->
    ${axes}

    <!-- Data polygon fill -->
    <polygon points="${dataPts}" fill="url(#radarGrad)"
      stroke="${C.violet}" stroke-width="2"
      stroke-linejoin="round" filter="url(#radarGlow)"/>

    <!-- Dots on vertices -->
    ${dots}

    <!-- Labels -->
    ${labels}

    <!-- Badge -->
    <rect x="${W-70}" y="8" rx="8" width="60" height="22"
      fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.2)"/>
    <text x="${W-40}" y="22" text-anchor="middle"
      fill="${C.violet}" font-size="10" font-family="'DM Mono',monospace">
      ${n} skills
    </text>
  `;
}

// ══════════════════════════════════════════════════════
// 6. SKILL BARS — Horizontal bar list (for sidebar)
// ══════════════════════════════════════════════════════
export function renderSkillList(skills, containerId = 'skillList') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!skills || skills.length === 0) {
    container.innerHTML = '<p class="loading-text">No skill data found.</p>';
    return;
  }

  const maxAmt = skills[0].amount || 1;
  container.innerHTML = skills.map(s => {
    const pct  = Math.round((s.amount / maxAmt) * 100);
    const name = s.name.toUpperCase();
    return `
      <div class="skill-bar-item">
        <span class="skill-bar-name" title="${esc(s.name)}">${esc(name)}</span>
        <span class="skill-bar-track">
          <span class="skill-bar-fill" style="width:0%" data-pct="${pct}"></span>
        </span>
        <span class="skill-bar-value">${s.amount}</span>
      </div>`;
  }).join('');

  // Animate bars after paint
  requestAnimationFrame(() => {
    container.querySelectorAll('.skill-bar-fill').forEach(el => {
      el.style.width = el.dataset.pct + '%';
    });
  });
}