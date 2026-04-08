/**
 * confetti.js  
 * Pure canvas confetti — no npm packages, zero cost.
 * Call triggerConfetti() for perfect score celebrations.
 */

export function triggerConfetti({ duration = 3000, particleCount = 120 } = {}) {
  const canvas  = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);

  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#00e5ff','#a78bfa','#ffb830','#34d399','#f87171','#fbbf24','#60a5fa'];

  const particles = Array.from({ length: particleCount }, () => ({
    x:      Math.random() * canvas.width,
    y:      Math.random() * canvas.height - canvas.height,
    w:      Math.random() * 10 + 5,
    h:      Math.random() * 5 + 3,
    color:  COLORS[Math.floor(Math.random() * COLORS.length)],
    rot:    Math.random() * 360,
    vx:     Math.random() * 4 - 2,
    vy:     Math.random() * 3 + 2,
    vr:     Math.random() * 6 - 3,
    opacity: 1,
  }));

  let start = null;

  function draw(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.rot += p.vr;
      p.vy += 0.05; // gravity
      if (elapsed > duration * 0.6) p.opacity = Math.max(0, p.opacity - 0.02);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle   = p.color;
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (elapsed < duration + 500) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(draw);
}
