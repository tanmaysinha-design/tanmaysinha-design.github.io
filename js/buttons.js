/* Button micro-interactions. Progressive enhancement: without JS buttons are plain labels. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var MAGNET_X = 8, MAGNET_Y = 6;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  }

  function build(btn) {
    if (btn.dataset.enhanced) return;
    btn.dataset.enhanced = '1';
    var arrow = btn.querySelector('.b-arrow');
    if (arrow) arrow.parentNode.removeChild(arrow);
    var label = btn.textContent.replace(/\s+/g, ' ').trim();
    btn.textContent = '';
    btn.appendChild(el('span', 'b-fill'));
    var text = el('span', 'b-text');
    text.appendChild(el('span', 'b-t1')).textContent = label;
    var dup = el('span', 'b-t2'); dup.setAttribute('aria-hidden', 'true'); dup.textContent = label;
    text.appendChild(dup);
    btn.appendChild(text);
    if (arrow) { btn.appendChild(arrow); btn.classList.add('has-arrow'); }
    if (btn.matches('button[type="submit"]')) {
      btn.appendChild(el('span', 'b-state b-spin')).setAttribute('aria-hidden', 'true');
      btn.appendChild(el('span', 'b-state b-check', '<svg viewBox="0 0 24 24"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"/></svg>')).setAttribute('aria-hidden', 'true');
    }
    if (!btn.dataset.state && btn.matches('button')) btn.dataset.state = 'idle';
    btn.style.setProperty('--d', Math.ceil(Math.hypot(btn.offsetWidth, btn.offsetHeight) * 2.15) + 'px');
  }

  function point(btn, e) {
    var r = btn.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  }

  function wire(btn) {
    if (reduce) return;
    btn.addEventListener('pointerenter', function (e) {
      var p = point(btn, e);
      btn.style.setProperty('--d', Math.ceil(Math.hypot(p.w, p.h) * 2.15) + 'px');
      btn.style.setProperty('--px', p.x + 'px'); btn.style.setProperty('--py', p.y + 'px');
    });
    btn.addEventListener('pointerleave', function (e) {
      var p = point(btn, e);
      btn.style.setProperty('--px', Math.max(0, Math.min(p.w, p.x)) + 'px');
      btn.style.setProperty('--py', Math.max(0, Math.min(p.h, p.y)) + 'px');
      btn.style.setProperty('--tx', '0px'); btn.style.setProperty('--ty', '0px');
    });
    if (fine) btn.addEventListener('pointermove', function (e) {
      var p = point(btn, e);
      var nx = (p.x / p.w - .5) * 2, ny = (p.y / p.h - .5) * 2;
      btn.style.setProperty('--tx', (nx * MAGNET_X).toFixed(2) + 'px');
      btn.style.setProperty('--ty', (ny * MAGNET_Y).toFixed(2) + 'px');
    });
    btn.addEventListener('pointerdown', function (e) {
      var p = point(btn, e), r = el('span', 'b-ripple');
      var d = Math.hypot(p.w, p.h) * 2.2;
      r.style.cssText = 'left:' + p.x + 'px;top:' + p.y + 'px;width:' + d + 'px;height:' + d + 'px';
      btn.appendChild(r);
      setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 800);
    });
  }

  function init(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('.btn'), function (b) { build(b); wire(b); });
  }

  /* public helpers used by forms.js */
  window.TrButton = {
    setState: function (btn, state) { btn.dataset.state = state; },
    shake: function (btn) { btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); setTimeout(function () { btn.classList.remove('shake'); }, 500); }
  };
  init();
})();
