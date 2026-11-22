import React, { useEffect, useRef } from 'react';

// Project curved streamlines into a moving vanishing point. One canvas per jump.
export default function JumpTunnel() {
  const mount = useRef(null);
  useEffect(() => {
    const canvas = mount.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame;
    let last = -100;
    let start;
    function draw(now) {
      start ??= now;
      if (now - last >= 30) {
        last = now;
        const t = reduced ? 1 : (now - start) / 1000;
        const x = 500 + Math.sin(t * .8) * 65;
        const y = 216 + Math.cos(t * .75) * 35;
        const glow = ctx.createRadialGradient(x,y,2,x,y,620);
        glow.addColorStop(0,'#ffe4ae'); glow.addColorStop(.035,'#c7d5ff');
        glow.addColorStop(.13,'#6351bb'); glow.addColorStop(.43,'#1b1855'); glow.addColorStop(1,'#040614');
        ctx.fillStyle=glow; ctx.fillRect(0,0,960,540);
        for (let i=0; i<96; i++) {
          const depth = (i * .618 + t * .42) % 1;
          const radius = 12 + depth ** 2.6 * 680;
          const angle = i * 2.4 + depth * 1.1 + t * .14;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(angle)*radius,y + Math.sin(angle)*radius*.68);
          ctx.lineTo(x + Math.cos(angle+.055)*radius*1.19,y + Math.sin(angle+.055)*radius*.84);
          ctx.strokeStyle = i % 4 ? '#92cfff' : '#ffc584';
          ctx.globalAlpha = .18 + depth*.65; ctx.lineWidth = 1+depth*2; ctx.stroke();
        }
        ctx.globalAlpha=1;
      }
      if (!reduced) frame=requestAnimationFrame(draw);
    }
    frame=requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={mount} width="960" height="540" className="jump-tunnel" aria-hidden="true"/>;
}
