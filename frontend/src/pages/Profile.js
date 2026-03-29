import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// ── Gem tier config ───────────────────────────────────────────────────────────
const MILESTONES = [
  { minutes: 30,    label: '30m',   name: 'Spark',    color: '#a0c4ff' },
  { minutes: 60,    label: '1h',    name: 'Quartz',   color: '#caffbf' },
  { minutes: 300,   label: '5h',    name: 'Topaz',    color: '#fdffb6' },
  { minutes: 600,   label: '10h',   name: 'Citrine',  color: '#ffd166' },
  { minutes: 1500,  label: '25h',   name: 'Amber',    color: '#ef8c3a' },
  { minutes: 3000,  label: '50h',   name: 'Ruby',     color: '#ef233c' },
  { minutes: 4500,  label: '75h',   name: 'Amethyst', color: '#c77dff' },
  { minutes: 6000,  label: '100h',  name: 'Sapphire', color: '#4895ef' },
  { minutes: 12000, label: '200h',  name: 'Emerald',  color: '#52b788' },
  { minutes: 18000, label: '300h',  name: 'Diamond',  color: '#e0f4ff' },
];

// ── Draw a gem onto a canvas context ─────────────────────────────────────────
const drawGemOnCanvas = (ctx, cx, cy, size, color, gemName, earned) => {
  const alpha = earned ? 1 : 0.2;
  ctx.save();
  ctx.globalAlpha = alpha;

  const s = size / 28;

  const fill = (path2d, fillAlpha) => {
    ctx.globalAlpha = alpha * fillAlpha;
    ctx.fillStyle = color;
    ctx.fill(path2d);
    ctx.globalAlpha = alpha;
  };

  const stroke = (path2d, strokeAlpha = 1, width = 1.8) => {
    ctx.globalAlpha = alpha * strokeAlpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * s;
    ctx.stroke(path2d);
    ctx.globalAlpha = alpha;
  };

  const line = (x1, y1, x2, y2, a = 0.4, w = 1) => {
    ctx.globalAlpha = alpha * a;
    ctx.strokeStyle = color;
    ctx.lineWidth = w * s;
    ctx.beginPath();
    ctx.moveTo(cx + (x1 - 28) * s, cy + (y1 - 32) * s);
    ctx.lineTo(cx + (x2 - 28) * s, cy + (y2 - 32) * s);
    ctx.stroke();
    ctx.globalAlpha = alpha;
  };

  const tx = x => cx + (x - 28) * s;
  const ty = y => cy + (y - 32) * s;

  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';

  switch (gemName) {
    case 'Spark': {
      const p = new Path2D();
      p.moveTo(tx(28), ty(8));
      p.lineTo(tx(40), ty(34));
      p.quadraticCurveTo(tx(40), ty(54), tx(28), ty(56));
      p.quadraticCurveTo(tx(16), ty(54), tx(16), ty(34));
      p.closePath();
      fill(p, 0.22); stroke(p, 1);
      const p2 = new Path2D();
      p2.moveTo(tx(28), ty(8)); p2.lineTo(tx(40), ty(34));
      p2.lineTo(tx(28), ty(44)); p2.lineTo(tx(16), ty(34)); p2.closePath();
      fill(p2, 0.45);
      line(16, 34, 40, 34, 0.4);
      break;
    }
    case 'Quartz': {
      const p = new Path2D();
      p.moveTo(tx(28), ty(6)); p.lineTo(tx(46), ty(28));
      p.lineTo(tx(28), ty(58)); p.lineTo(tx(10), ty(28)); p.closePath();
      fill(p, 0.22); stroke(p, 1);
      line(10, 28, 46, 28, 0.45);
      const p2 = new Path2D();
      p2.moveTo(tx(28), ty(6)); p2.lineTo(tx(46), ty(28));
      p2.lineTo(tx(28), ty(34)); p2.lineTo(tx(10), ty(28)); p2.closePath();
      fill(p2, 0.45);
      break;
    }
    case 'Topaz': {
      const p = new Path2D();
      p.moveTo(tx(28), ty(6)); p.lineTo(tx(46), ty(28));
      p.lineTo(tx(28), ty(58)); p.lineTo(tx(10), ty(28)); p.closePath();
      fill(p, 0.22); stroke(p, 1);
      line(10, 28, 46, 28, 0.4);
      line(28, 6, 16, 18, 0.4); line(28, 6, 40, 18, 0.4);
      line(16, 18, 40, 18, 0.3);
      const p2 = new Path2D();
      p2.moveTo(tx(28), ty(6)); p2.lineTo(tx(40), ty(18));
      p2.lineTo(tx(28), ty(28)); p2.lineTo(tx(16), ty(18)); p2.closePath();
      fill(p2, 0.45);
      break;
    }
    case 'Citrine': {
      const p = new Path2D();
      p.moveTo(tx(28), ty(5)); p.lineTo(tx(48), ty(22));
      p.lineTo(tx(40), ty(54)); p.lineTo(tx(16), ty(54));
      p.lineTo(tx(8), ty(22)); p.closePath();
      fill(p, 0.22); stroke(p, 1);
      line(8, 22, 48, 22, 0.4);
      line(28, 5, 8, 22, 0.3, 0.8); line(28, 5, 48, 22, 0.3, 0.8);
      const p2 = new Path2D();
      p2.moveTo(tx(28), ty(5)); p2.lineTo(tx(48), ty(22));
      p2.lineTo(tx(28), ty(32)); p2.lineTo(tx(8), ty(22)); p2.closePath();
      fill(p2, 0.45);
      break;
    }
    case 'Amber': {
      const p = new Path2D();
      p.moveTo(tx(28), ty(5)); p.lineTo(tx(48), ty(22));
      p.lineTo(tx(40), ty(54)); p.lineTo(tx(16), ty(54));
      p.lineTo(tx(8), ty(22)); p.closePath();
      fill(p, 0.22); stroke(p, 1);
      line(8, 22, 48, 22, 0.4);
      line(28, 5, 8, 22, 0.3, 0.8); line(28, 5, 48, 22, 0.3, 0.8);
      line(16, 54, 28, 32, 0.3, 0.8); line(40, 54, 28, 32, 0.3, 0.8);
      const p2 = new Path2D();
      p2.moveTo(tx(28), ty(5)); p2.lineTo(tx(48), ty(22));
      p2.lineTo(tx(28), ty(32)); p2.lineTo(tx(8), ty(22)); p2.closePath();
      fill(p2, 0.45);
      break;
    }
    case 'Ruby': {
      const p = new Path2D();
      p.moveTo(tx(28), ty(5)); p.lineTo(tx(48), ty(18));
      p.lineTo(tx(48), ty(42)); p.lineTo(tx(28), ty(58));
      p.lineTo(tx(8),  ty(42)); p.lineTo(tx(8),  ty(18)); p.closePath();
      fill(p, 0.22); stroke(p, 1);
      line(8, 18, 48, 18, 0.4);
      const p2 = new Path2D();
      p2.moveTo(tx(28), ty(5)); p2.lineTo(tx(48), ty(18));
      p2.lineTo(tx(28), ty(28)); p2.lineTo(tx(8),  ty(18)); p2.closePath();
      fill(p2, 0.45);
      line(28, 28, 8,  42, 0.3, 0.8);
      line(28, 28, 48, 42, 0.3, 0.8);
      line(28, 28, 28, 58, 0.3, 0.8);
      break;
    }
    case 'Amethyst': {
      const p = new Path2D();
      p.moveTo(tx(28), ty(5)); p.lineTo(tx(48), ty(18));
      p.lineTo(tx(48), ty(42)); p.lineTo(tx(28), ty(58));
      p.lineTo(tx(8),  ty(42)); p.lineTo(tx(8),  ty(18)); p.closePath();
      fill(p, 0.22); stroke(p, 1);
      const p2 = new Path2D();
      p2.moveTo(tx(28), ty(14)); p2.lineTo(tx(40), ty(22));
      p2.lineTo(tx(40), ty(38)); p2.lineTo(tx(28), ty(46));
      p2.lineTo(tx(16), ty(38)); p2.lineTo(tx(16), ty(22)); p2.closePath();
      fill(p2, 0.45); stroke(p2, 1, 1);
      line(8, 18, 48, 18, 0.3, 0.8); line(8, 42, 48, 42, 0.3, 0.8);
      break;
    }
    case 'Sapphire': {
      const p = new Path2D();
      p.moveTo(tx(18), ty(6)); p.lineTo(tx(38), ty(6));
      p.lineTo(tx(50), ty(18)); p.lineTo(tx(50), ty(38));
      p.lineTo(tx(38), ty(54)); p.lineTo(tx(18), ty(54));
      p.lineTo(tx(6),  ty(38)); p.lineTo(tx(6),  ty(18)); p.closePath();
      fill(p, 0.22); stroke(p, 1);
      line(6, 18, 50, 18, 0.4); line(6, 38, 50, 38, 0.3, 0.8);
      const p2 = new Path2D();
      p2.moveTo(tx(18), ty(6)); p2.lineTo(tx(50), ty(18));
      p2.lineTo(tx(38), ty(28)); p2.lineTo(tx(18), ty(28));
      p2.lineTo(tx(6),  ty(18)); p2.closePath();
      fill(p2, 0.45);
      line(28, 6, 28, 54, 0.2, 0.6); line(6, 28, 50, 28, 0.2, 0.6);
      break;
    }
    case 'Emerald': {
      const p = new Path2D();
      p.moveTo(tx(18), ty(6)); p.lineTo(tx(38), ty(6));
      p.lineTo(tx(50), ty(18)); p.lineTo(tx(50), ty(38));
      p.lineTo(tx(38), ty(54)); p.lineTo(tx(18), ty(54));
      p.lineTo(tx(6),  ty(38)); p.lineTo(tx(6),  ty(18)); p.closePath();
      fill(p, 0.22); stroke(p, 1);
      const p2 = new Path2D();
      p2.moveTo(tx(22), ty(14)); p2.lineTo(tx(34), ty(14));
      p2.lineTo(tx(42), ty(22)); p2.lineTo(tx(42), ty(38));
      p2.lineTo(tx(34), ty(46)); p2.lineTo(tx(22), ty(46));
      p2.lineTo(tx(14), ty(38)); p2.lineTo(tx(14), ty(22)); p2.closePath();
      fill(p2, 0.45); stroke(p2, 1, 1);
      line(6, 18, 50, 18, 0.3, 0.8); line(6, 38, 50, 38, 0.3, 0.8);
      line(18, 6, 22, 14, 0.3, 0.8); line(38, 6, 34, 14, 0.3, 0.8);
      line(50, 18, 42, 22, 0.3, 0.8); line(50, 38, 42, 38, 0.3, 0.8);
      line(38, 54, 34, 46, 0.3, 0.8); line(18, 54, 22, 46, 0.3, 0.8);
      break;
    }
    case 'Diamond': {
      const p = new Path2D();
      p.moveTo(tx(18), ty(6)); p.lineTo(tx(38), ty(6));
      p.lineTo(tx(50), ty(18)); p.lineTo(tx(50), ty(38));
      p.lineTo(tx(38), ty(54)); p.lineTo(tx(18), ty(54));
      p.lineTo(tx(6),  ty(38)); p.lineTo(tx(6),  ty(18)); p.closePath();
      fill(p, 0.22); stroke(p, 1, 2);
      const p2 = new Path2D();
      p2.moveTo(tx(28), ty(10)); p2.lineTo(tx(44), ty(28));
      p2.lineTo(tx(28), ty(50)); p2.lineTo(tx(12), ty(28)); p2.closePath();
      fill(p2, 0.45); stroke(p2, 1, 1);
      line(6, 18, 50, 18, 0.25, 0.7); line(6, 38, 50, 38, 0.25, 0.7);
      line(18, 6, 38, 54, 0.2, 0.7); line(38, 6, 18, 54, 0.2, 0.7);
      line(12, 28, 44, 28, 0.25, 0.7);
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(tx(28), ty(28), 4 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: break;
  }

  ctx.restore();
};

// ── Canvas round-rect helper ──────────────────────────────────────────────────
const rrPath = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

// ── Generate and download the shareable card ──────────────────────────────────
const downloadAchievementCard = (username, earnedMilestones, totalMinutes) => {
  const W = 540, H = 960; // 9:16 — perfect for Instagram story
  const canvas = document.createElement('canvas');
  canvas.width  = W * 2; // retina
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = '#0b0b0d';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = '#111114';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 36) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 36) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Spectrum top bar
  const specGrad = ctx.createLinearGradient(0, 0, W, 0);
  specGrad.addColorStop(0,   '#a0c4ff');
  specGrad.addColorStop(0.2, '#caffbf');
  specGrad.addColorStop(0.4, '#ffd166');
  specGrad.addColorStop(0.6, '#ef233c');
  specGrad.addColorStop(0.8, '#c77dff');
  specGrad.addColorStop(1,   '#e0f4ff');
  ctx.fillStyle = specGrad;
  ctx.fillRect(0, 0, W, 3);

  // ── Header ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('StudyChat', 36, 52);

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  ctx.fillStyle = '#444444';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(monthName, 36, 70);

  // Gem count pill (top right)
  const earnedCount = earnedMilestones.length;
  const pillText = `${earnedCount} / ${MILESTONES.length} gems`;
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
  const pw = ctx.measureText(pillText).width + 22;
  ctx.fillStyle = '#161618';
  rrPath(ctx, W - 36 - pw, 40, pw, 22, 11); ctx.fill();
  ctx.strokeStyle = '#222225'; ctx.lineWidth = 1;
  rrPath(ctx, W - 36 - pw, 40, pw, 22, 11); ctx.stroke();
  ctx.fillStyle = '#888888';
  ctx.fillText(pillText, W - 36 - pw + 11, 55);

  // ── Big stat ────────────────────────────────────────────────────────────────
  const hours = totalMinutes / 60;
  const hoursStr = hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 96px -apple-system, BlinkMacSystemFont, sans-serif';
  const numW = ctx.measureText(hoursStr).width;
  ctx.fillText(hoursStr, 36, 210);

  ctx.fillStyle = '#333333';
  ctx.font = '500 22px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(' hrs studied this month', 36 + numW + 2, 210);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`@${username}`, 36, 248);

  // Divider
  ctx.strokeStyle = '#1a1a1e';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(36, 278); ctx.lineTo(W - 36, 278); ctx.stroke();

  // ── Progress bar ─────────────────────────────────────────────────────────────
  const pct = earnedCount / MILESTONES.length;
  ctx.fillStyle = '#111114';
  rrPath(ctx, 36, 294, W - 72, 3, 2); ctx.fill();
  if (pct > 0) {
    const pg = ctx.createLinearGradient(36, 0, 36 + (W - 72) * pct, 0);
    pg.addColorStop(0, '#a0c4ff');
    pg.addColorStop(1, '#c77dff');
    ctx.fillStyle = pg;
    rrPath(ctx, 36, 294, (W - 72) * pct, 3, 2); ctx.fill();
  }

  ctx.fillStyle = '#333333';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${earnedCount} of ${MILESTONES.length} gems unlocked`, 36, 316);

  // ── Gems grid (2 rows × 5) ───────────────────────────────────────────────────
  const cols    = 5;
  const pad     = 36;
  const gapX    = 10, gapY = 12;
  const cw      = (W - pad * 2 - gapX * (cols - 1)) / cols;
  const ch      = 148;
  const gridTop = 332;

  MILESTONES.forEach((m, i) => {
    const col    = i % cols;
    const row    = Math.floor(i / cols);
    const bx     = pad + col * (cw + gapX);
    const by     = gridTop + row * (ch + gapY);
    const earned = earnedMilestones.includes(m.minutes);

    // Card bg
    ctx.fillStyle = '#0e0e11';
    rrPath(ctx, bx, by, cw, ch, 10); ctx.fill();

    // Subtle glow behind earned gems
    if (earned) {
      ctx.save();
      const glowGrad = ctx.createRadialGradient(bx + cw / 2, by + ch, 0, bx + cw / 2, by + ch / 2, cw * 0.8);
      glowGrad.addColorStop(0, m.color + '18');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      rrPath(ctx, bx, by, cw, ch, 10); ctx.fill();
      ctx.restore();
    }

    // Border
    ctx.strokeStyle = earned ? m.color + '35' : '#1a1a1e';
    ctx.lineWidth = 1;
    rrPath(ctx, bx, by, cw, ch, 10); ctx.stroke();

    // Gem
    drawGemOnCanvas(ctx, bx + cw / 2, by + ch / 2 - 12, 34, m.color, m.name, earned);

    // Name
    ctx.textAlign = 'center';
    ctx.font = `${earned ? 'bold' : 'normal'} 11px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = earned ? m.color : '#2a2a2e';
    ctx.fillText(m.name, bx + cw / 2, by + ch - 26);

    // Hours label
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#2a2a2e';
    ctx.fillText(m.label, bx + cw / 2, by + ch - 12);

    ctx.textAlign = 'left';
  });

  // ── Footer ───────────────────────────────────────────────────────────────────
  const fy = H - 36;
  ctx.strokeStyle = '#111114'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(36, fy - 20); ctx.lineTo(W - 36, fy - 20); ctx.stroke();

  ctx.fillStyle = '#2a2a2e';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('studychat.app', 36, fy);
  ctx.textAlign = 'right';
  ctx.fillText('Keep studying', W - 36, fy);
  ctx.textAlign = 'left';

  // ── Download ─────────────────────────────────────────────────────────────────
  const link = document.createElement('a');
  link.download = `studychat-${monthName.replace(' ', '-').toLowerCase()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

// ── GemSVG component ──────────────────────────────────────────────────────────
const GemSVG = ({ tier, earned }) => {
  const c   = tier.color;
  const op  = earned ? '1'    : '0.28';
  const fi  = earned ? '0.22' : '0.06';
  const ii  = earned ? '0.45' : '0.10';
  const gid = `gem_${tier.name}`;

  const glowFilter = earned ? `<defs>
    <filter id="${gid}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>` : '';
  const gf = earned ? `filter="url(#${gid})"` : '';

  const shapes = {
    Spark: `
      <path d="M28 8 L40 34 Q40 54 28 56 Q16 54 16 34 Z"
        fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/>
      <path d="M28 8 L40 34 L28 44 L16 34 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>
      <line x1="16" y1="34" x2="40" y2="34" stroke="${c}" stroke-width="1" opacity="${earned ? '0.4' : '0.1'}"/>`,
    Quartz: `
      <path d="M28 6 L46 28 L28 58 L10 28 Z"
        fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/>
      <line x1="10" y1="28" x2="46" y2="28" stroke="${c}" stroke-width="1" opacity="${earned ? '0.45' : '0.1'}"/>
      <path d="M28 6 L46 28 L28 34 L10 28 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>`,
    Topaz: `
      <path d="M28 6 L46 28 L28 58 L10 28 Z"
        fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/>
      <line x1="10" y1="28" x2="46" y2="28" stroke="${c}" stroke-width="1" opacity="${earned ? '0.4' : '0.1'}"/>
      <line x1="28" y1="6" x2="16" y2="18" stroke="${c}" stroke-width="1" opacity="${earned ? '0.4' : '0.1'}"/>
      <line x1="28" y1="6" x2="40" y2="18" stroke="${c}" stroke-width="1" opacity="${earned ? '0.4' : '0.1'}"/>
      <line x1="16" y1="18" x2="40" y2="18" stroke="${c}" stroke-width="1" opacity="${earned ? '0.3' : '0.08'}"/>
      <path d="M28 6 L40 18 L28 28 L16 18 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>`,
    Citrine: `
      <path d="M28 5 L48 22 L40 54 L16 54 L8 22 Z"
        fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/>
      <line x1="8" y1="22" x2="48" y2="22" stroke="${c}" stroke-width="1" opacity="${earned ? '0.4' : '0.1'}"/>
      <line x1="28" y1="5" x2="8" y2="22" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="28" y1="5" x2="48" y2="22" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <path d="M28 5 L48 22 L28 32 L8 22 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>`,
    Amber: `
      <path d="M28 5 L48 22 L40 54 L16 54 L8 22 Z"
        fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/>
      <line x1="8" y1="22" x2="48" y2="22" stroke="${c}" stroke-width="1" opacity="${earned ? '0.4' : '0.1'}"/>
      <line x1="28" y1="5" x2="8" y2="22" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="28" y1="5" x2="48" y2="22" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="16" y1="54" x2="28" y2="32" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="40" y1="54" x2="28" y2="32" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <path d="M28 5 L48 22 L28 32 L8 22 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>`,
    Ruby: `
      <path d="M28 5 L48 18 L48 42 L28 58 L8 42 L8 18 Z"
        fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/>
      <line x1="8" y1="18" x2="48" y2="18" stroke="${c}" stroke-width="1" opacity="${earned ? '0.4' : '0.1'}"/>
      <path d="M28 5 L48 18 L28 28 L8 18 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>
      <line x1="28" y1="28" x2="8"  y2="42" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="28" y1="28" x2="48" y2="42" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="28" y1="28" x2="28" y2="58" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>`,
    Amethyst: `
      <path d="M28 5 L48 18 L48 42 L28 58 L8 42 L8 18 Z"
        fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/>
      <path d="M28 14 L40 22 L40 38 L28 46 L16 38 L16 22 Z"
        fill="${c}" fill-opacity="${ii}" stroke="${c}" stroke-width="1" opacity="${op}"/>
      <line x1="8"  y1="18" x2="48" y2="18" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="8"  y1="42" x2="48" y2="42" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>`,
    Sapphire: `
      <path d="M18 6 L38 6 L50 18 L50 38 L38 54 L18 54 L6 38 L6 18 Z"
        fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/>
      <line x1="6"  y1="18" x2="50" y2="18" stroke="${c}" stroke-width="1" opacity="${earned ? '0.4' : '0.1'}"/>
      <line x1="6"  y1="38" x2="50" y2="38" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <path d="M18 6 L50 18 L38 28 L18 28 L6 18 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>
      <line x1="28" y1="6"  x2="28" y2="54" stroke="${c}" stroke-width="0.6" opacity="${earned ? '0.2' : '0.05'}"/>
      <line x1="6"  y1="28" x2="50" y2="28" stroke="${c}" stroke-width="0.6" opacity="${earned ? '0.2' : '0.05'}"/>`,
    Emerald: `
      <path d="M18 6 L38 6 L50 18 L50 38 L38 54 L18 54 L6 38 L6 18 Z"
        fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/>
      <path d="M22 14 L34 14 L42 22 L42 38 L34 46 L22 46 L14 38 L14 22 Z"
        fill="${c}" fill-opacity="${ii}" stroke="${c}" stroke-width="1" opacity="${op}"/>
      <line x1="6"  y1="18" x2="50" y2="18" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="6"  y1="38" x2="50" y2="38" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="18" y1="6"  x2="22" y2="14" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="38" y1="6"  x2="34" y2="14" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="50" y1="18" x2="42" y2="22" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="50" y1="38" x2="42" y2="38" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="38" y1="54" x2="34" y2="46" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="18" y1="54" x2="22" y2="46" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="6"  y1="38" x2="14" y2="38" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>
      <line x1="6"  y1="18" x2="14" y2="22" stroke="${c}" stroke-width="0.8" opacity="${earned ? '0.3' : '0.08'}"/>`,
    Diamond: `
      <path d="M18 6 L38 6 L50 18 L50 38 L38 54 L18 54 L6 38 L6 18 Z"
        fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="2" stroke-linejoin="round" opacity="${op}" ${gf}/>
      <path d="M28 10 L44 28 L28 50 L12 28 Z"
        fill="${c}" fill-opacity="${ii}" stroke="${c}" stroke-width="1" opacity="${op}"/>
      <line x1="6"  y1="18" x2="50" y2="18" stroke="${c}" stroke-width="0.7" opacity="${earned ? '0.25' : '0.06'}"/>
      <line x1="6"  y1="38" x2="50" y2="38" stroke="${c}" stroke-width="0.7" opacity="${earned ? '0.25' : '0.06'}"/>
      <line x1="18" y1="6"  x2="38" y2="54" stroke="${c}" stroke-width="0.7" opacity="${earned ? '0.2' : '0.05'}"/>
      <line x1="38" y1="6"  x2="18" y2="54" stroke="${c}" stroke-width="0.7" opacity="${earned ? '0.2' : '0.05'}"/>
      <line x1="12" y1="28" x2="44" y2="28" stroke="${c}" stroke-width="0.7" opacity="${earned ? '0.25' : '0.06'}"/>
      <circle cx="28" cy="28" r="4" fill="${c}" opacity="${earned ? '0.85' : '0.15'}"/>`,
  };

  return (
    <svg
      width="56" height="64" viewBox="0 0 56 64"
      dangerouslySetInnerHTML={{ __html: glowFilter + (shapes[tier.name] || '') }}
    />
  );
};

// ── Profile page ──────────────────────────────────────────────────────────────
const Profile = () => {
  const [email, setEmail]                       = useState('');
  const [profilePicture, setProfilePicture]     = useState('');
  const [selectedFile, setSelectedFile]         = useState(null);
  const [preview, setPreview]                   = useState('');
  const [loading, setLoading]                   = useState(false);
  const [message, setMessage]                   = useState('');
  const [messageType, setMessageType]           = useState('success');
  const [earnedMilestones, setEarnedMilestones] = useState([]);
  const [totalMinutes, setTotalMinutes]         = useState(0);
  const [downloading, setDownloading]           = useState(false);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => { loadProfile(); loadAchievements(); }, []);

  const loadProfile = async () => {
    try {
      const res = await axios.get('https://chatv2-i91j.onrender.com/api/profile');
      setEmail(res.data.email);
      setProfilePicture(res.data.profilePicture);
    } catch (e) { console.error(e); }
  };

  const loadAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://chatv2-i91j.onrender.com/api/achievements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEarnedMilestones(res.data.earned || []);
      setTotalMinutes(res.data.totalMinutes || 0);
    } catch (e) { console.error(e); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) { showMessage('Please select a file first', 'error'); return; }
    setLoading(true);
    const formData = new FormData();
    formData.append('profilePicture', selectedFile);
    try {
      const res = await axios.post('https://chatv2-i91j.onrender.com/api/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfilePicture(res.data.profilePicture);
      setSelectedFile(null); setPreview('');
      showMessage('Profile picture updated successfully!', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      showMessage(e.response?.data?.error || 'Error uploading picture', 'error');
    } finally { setLoading(false); }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.put('https://chatv2-i91j.onrender.com/api/profile', { email });
      showMessage('Email updated successfully!', 'success');
    } catch (e) {
      showMessage(e.response?.data?.error || 'Error updating email', 'error');
    } finally { setLoading(false); }
  };

  const showMessage = (msg, type) => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRemovePreview = () => { setSelectedFile(null); setPreview(''); };

  const handleDownloadCard = () => {
    setDownloading(true);
    setTimeout(() => {
      downloadAchievementCard(user?.username || 'user', earnedMilestones, totalMinutes);
      setDownloading(false);
    }, 100);
  };

  const earnedCount    = earnedMilestones.length;
  const totalCount     = MILESTONES.length;
  const monthName      = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const nextMilestone  = MILESTONES.find(m => !earnedMilestones.includes(m.minutes));
  const hoursThisMonth = (totalMinutes / 60).toFixed(1);

  const BackIcon     = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>);
  const UploadIcon   = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
  const SaveIcon     = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>);
  const TrashIcon    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
  const DownloadIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);

  return (
    <div style={s.container}>
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}><h2 style={s.sidebarTitle}>User Settings</h2></div>
        <div style={s.sidebarMenu}>
          <div style={{ ...s.menuItem, ...s.menuItemActive }}>My Account</div>
          <div style={s.menuItem}>Privacy & Safety</div>
          <div style={s.menuItem}>Notifications</div>
        </div>
        <div style={s.sidebarFooter}>
          <button onClick={() => navigate('/chat')} style={s.backButton}>
            <BackIcon /><span>Back to Chat</span>
          </button>
        </div>
      </div>

      <div style={s.mainContent}>
        <div style={s.contentHeader}><h1 style={s.contentTitle}>My Account</h1></div>

        {message && (
          <div style={{
            ...s.message,
            backgroundColor: messageType === 'success' ? '#0a3a1a' : '#3a0a0a',
            borderColor:      messageType === 'success' ? '#22c55e' : '#ef4444',
            color:            messageType === 'success' ? '#86efac' : '#fca5a5'
          }}>{message}</div>
        )}

        <div style={s.contentBody}>

          {/* Profile Picture */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>Profile Picture</h3>
              <p style={s.sectionDesc}>Upload a custom avatar or use the default one</p>
            </div>
            <div style={s.picContainer}>
              <div style={s.currentPic}>
                {profilePicture
                  ? <img src={profilePicture} alt="Profile" style={s.profileImg} />
                  : <div style={s.profilePlaceholder}>{user?.username?.[0]?.toUpperCase() || '?'}</div>
                }
              </div>
              <div style={s.uploadSection}>
                <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} id="fileInput" />
                <label htmlFor="fileInput" style={s.uploadButton}><UploadIcon /><span>Choose Image</span></label>
                {selectedFile && (
                  <div style={s.selectedFileInfo}>
                    <span style={s.fileName}>{selectedFile.name}</span>
                    <div style={s.fileActions}>
                      <button onClick={handleUploadPicture} disabled={loading} style={s.saveFileButton}>
                        <SaveIcon />{loading ? 'Uploading...' : 'Upload'}
                      </button>
                      <button onClick={handleRemovePreview} style={s.removeFileButton}><TrashIcon /></button>
                    </div>
                  </div>
                )}
                {preview && (
                  <div style={s.previewContainer}>
                    <p style={s.previewLabel}>Preview</p>
                    <img src={preview} alt="Preview" style={s.previewImage} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={s.divider} />

          {/* Monthly Achievements */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={s.sectionTitle}>Monthly Achievements</h3>
                  <p style={s.sectionDesc}>{monthName} · {hoursThisMonth} hrs studied · resets each month</p>
                </div>
                <div style={s.progressPill}>
                  <span style={s.progressPillText}>{earnedCount} / {totalCount}</span>
                </div>
              </div>
              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width: `${(earnedCount / totalCount) * 100}%` }} />
              </div>
            </div>

            <div style={s.badgeGrid}>
              {MILESTONES.map(milestone => {
                const earned = earnedMilestones.includes(milestone.minutes);
                return (
                  <div key={milestone.minutes} style={{
                    ...s.badgeCard,
                    borderColor: earned ? milestone.color + '55' : '#1a1a1a',
                    boxShadow:   earned ? `0 0 14px -4px ${milestone.color}44` : 'none',
                  }}>
                    <GemSVG tier={milestone} earned={earned} />
                    <span style={{ ...s.gemName, color: earned ? milestone.color : '#333333' }}>
                      {milestone.name}
                    </span>
                    <span style={s.gemLabel}>{milestone.label}</span>
                    {!earned && (
                      <div style={s.lockIcon}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {nextMilestone && earnedCount < totalCount && (
              <div style={s.nextHint}>
                <span style={{ color: '#666666', fontSize: '13px' }}>
                  Next: study <strong style={{ color: '#ffffff' }}>{nextMilestone.label}</strong> this month to unlock{' '}
                  <strong style={{ color: nextMilestone.color }}>{nextMilestone.name}</strong>
                </span>
              </div>
            )}

            {earnedCount === totalCount && (
              <div style={s.allEarned}>🌟 All gems unlocked this month — incredible!</div>
            )}

            <div style={s.shareRow}>
              <div style={s.shareInfo}>
                <p style={s.shareInfoTitle}>Share your progress</p>
                <p style={s.shareInfoDesc}>Download a 9:16 card for Instagram stories</p>
              </div>
              <button
                onClick={handleDownloadCard}
                disabled={downloading || earnedCount === 0}
                style={{
                  ...s.downloadBtn,
                  opacity: earnedCount === 0 ? 0.4 : 1,
                  cursor:  earnedCount === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {downloading ? <>Generating...</> : <><DownloadIcon /> Download Card</>}
              </button>
            </div>
          </div>

          <div style={s.divider} />

          {/* Account Info */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={s.sectionTitle}>Account Information</h3>
              <p style={s.sectionDesc}>Manage your account details</p>
            </div>
            <div style={s.infoGrid}>
              <div style={s.infoItem}>
                <label style={s.infoLabel}>Username</label>
                <div style={s.infoValue}>
                  <span>@{user?.username}</span>
                  <span style={s.infoBadge}>Cannot be changed</span>
                </div>
              </div>
              <form onSubmit={handleUpdateEmail} style={s.infoItem}>
                <label style={s.infoLabel}>Email Address</label>
                <div style={s.infoInputGroup}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={s.infoInput} required />
                  <button type="submit" disabled={loading} style={s.infoButton}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div style={s.divider} />

          {/* Danger Zone */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h3 style={{ ...s.sectionTitle, color: '#ef4444' }}>Danger Zone</h3>
              <p style={s.sectionDesc}>Irreversible actions</p>
            </div>
            <div style={s.dangerZone}>
              <div style={s.dangerItem}>
                <div>
                  <div style={s.dangerTitle}>Logout</div>
                  <div style={s.dangerDesc}>Sign out from this device</div>
                </div>
                <button onClick={logout} style={s.dangerButton}>Logout</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const s = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#000000', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#ffffff' },
  sidebar: { width: '280px', backgroundColor: '#0a0a0a', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { padding: '24px 20px', borderBottom: '1px solid #1a1a1a' },
  sidebarTitle: { fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' },
  sidebarMenu: { flex: 1, padding: '16px 12px' },
  menuItem: { padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', color: '#999999', marginBottom: '4px' },
  menuItemActive: { backgroundColor: '#1a1a1a', color: '#ffffff' },
  sidebarFooter: { padding: '20px', borderTop: '1px solid #1a1a1a' },
  backButton: { width: '100%', padding: '12px 16px', backgroundColor: 'transparent', color: '#ffffff', border: '1px solid #1a1a1a', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  mainContent: { flex: 1, overflowY: 'auto', backgroundColor: '#000000' },
  contentHeader: { padding: '40px 48px 24px', borderBottom: '1px solid #1a1a1a' },
  contentTitle: { fontSize: '32px', fontWeight: '700', color: '#ffffff', margin: 0 },
  message: { margin: '24px 48px', padding: '16px 20px', borderRadius: '8px', border: '1px solid', fontSize: '14px', fontWeight: '500' },
  contentBody: { padding: '32px 48px' },
  section: { marginBottom: '48px' },
  sectionHeader: { marginBottom: '24px' },
  sectionTitle: { fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' },
  sectionDesc: { fontSize: '14px', color: '#666666', margin: 0 },
  divider: { height: '1px', backgroundColor: '#1a1a1a', margin: '48px 0' },
  progressPill: { padding: '6px 14px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '20px', flexShrink: 0 },
  progressPillText: { fontSize: '13px', fontWeight: '600', color: '#ffffff' },
  progressTrack: { height: '3px', backgroundColor: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: '2px', transition: 'width 0.6s ease' },
  badgeGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' },
  badgeCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '18px 8px 14px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', position: 'relative', transition: 'border-color 0.2s, box-shadow 0.2s' },
  gemName: { fontSize: '12px', fontWeight: '600', textAlign: 'center', transition: 'color 0.2s' },
  gemLabel: { fontSize: '11px', color: '#444444', textAlign: 'center' },
  lockIcon: { position: 'absolute', top: '8px', right: '8px', opacity: 0.6 },
  nextHint: { padding: '12px 16px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '10px', marginBottom: '16px' },
  allEarned: { padding: '14px 20px', backgroundColor: '#0d1a0d', border: '1px solid #22c55e44', borderRadius: '10px', fontSize: '14px', fontWeight: '600', color: '#86efac', textAlign: 'center', marginBottom: '16px' },
  shareRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', marginTop: '8px' },
  shareInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  shareInfoTitle: { fontSize: '14px', fontWeight: '600', color: '#ffffff', margin: 0 },
  shareInfoDesc: { fontSize: '12px', color: '#555555', margin: 0 },
  downloadBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', transition: 'opacity 0.2s', flexShrink: 0 },
  picContainer: { display: 'flex', gap: '32px', alignItems: 'flex-start' },
  currentPic: { width: '120px', height: '120px', flexShrink: 0 },
  profileImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid #1a1a1a' },
  profilePlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: '700', border: '4px solid #1a1a1a' },
  uploadSection: { flex: 1 },
  uploadButton: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  selectedFileInfo: { marginTop: '16px', padding: '16px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  fileName: { fontSize: '14px', color: '#ffffff' },
  fileActions: { display: 'flex', gap: '8px' },
  saveFileButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#22c55e', color: '#000000', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  removeFileButton: { display: 'flex', alignItems: 'center', padding: '8px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #1a1a1a', borderRadius: '6px', cursor: 'pointer' },
  previewContainer: { marginTop: '16px' },
  previewLabel: { fontSize: '12px', color: '#666666', marginBottom: '8px' },
  previewImage: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1a1a1a' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '24px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '12px' },
  infoLabel: { fontSize: '14px', fontWeight: '600', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { padding: '16px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', fontSize: '15px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoBadge: { fontSize: '12px', color: '#666666', backgroundColor: '#1a1a1a', padding: '4px 12px', borderRadius: '12px' },
  infoInputGroup: { display: 'flex', gap: '12px' },
  infoInput: { flex: 1, padding: '14px 16px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#ffffff', fontSize: '15px', outline: 'none' },
  infoButton: { padding: '14px 24px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  dangerZone: { border: '1px solid #3a0a0a', borderRadius: '8px', backgroundColor: '#1a0000' },
  dangerItem: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dangerTitle: { fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' },
  dangerDesc: { fontSize: '14px', color: '#999999' },
  dangerButton: { padding: '10px 20px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};

export default Profile;
