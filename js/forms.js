/* Demo-request form: validation, button states, submission.
   Set data-endpoint on the <form> (HubSpot / Formspree / Slate inquiry URL) to send for real.
   With no endpoint the submission is simulated and logged to the console. */
(function () {
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var RULES = {
    name:        function (v) { return v.trim().length < 2 ? 'Enter your full name.' : ''; },
    email:       function (v) { return !EMAIL.test(v.trim()) ? 'Enter a valid email address.' : ''; },
    institution: function (v) { return v.trim().length < 2 ? 'Enter your university.' : ''; },
    volume:      function (v) { return !v ? 'Select your annual volume.' : ''; }
  };

  function setErr(form, field, msg) {
    var input = form.elements[field], out = form.querySelector('.err[data-for="' + field + '"]');
    if (!input || !out) return;
    if (msg) { input.setAttribute('aria-invalid', 'true'); if (!out.id) out.id = 'err-' + (form.__n || 0) + '-' + field; input.setAttribute('aria-describedby', out.id); out.textContent = msg; out.classList.add('show'); }
    else { input.removeAttribute('aria-invalid'); out.classList.remove('show'); }
  }
  function check(form, field) { var m = RULES[field](form.elements[field].value); setErr(form, field, m); return !m; }

  var formCount = 0;
  function init(form) {
    form.__n = ++formCount;
    var btn = form.querySelector('button[type="submit"]');
    var done = form.querySelector('.form-done');
    // carry the entry intent (?intent=sample|security|api) with the submission
    var intent = new URLSearchParams(location.search).get('intent');
    var hidden = document.createElement('input'); hidden.type = 'hidden'; hidden.name = 'intent'; hidden.value = intent || '';
    form.appendChild(hidden);

    Object.keys(RULES).forEach(function (f) {
      var inp = form.elements[f];
      inp.addEventListener('blur', function () { if (inp.value || inp.getAttribute('aria-invalid')) check(form, f); });
      inp.addEventListener('input', function () { if (inp.getAttribute('aria-invalid')) check(form, f); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = Object.keys(RULES).filter(function (f) { return !check(form, f); });
      var old = form.querySelector('.form-alert'); if (old) old.remove();
      if (bad.length) { form.elements[bad[0]].focus(); window.TrButton && TrButton.shake(btn); return; }

      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.page = location.pathname; data.submittedAt = new Date().toISOString();
      TrButton.setState(btn, 'loading');
      var started = Date.now();
      var endpoint = form.getAttribute('data-endpoint');
      var send = endpoint
        ? fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
        : new Promise(function (res) { console.info('[TruEnroll form] no data-endpoint set; submission simulated.', data); res(); });

      send.then(function () {
        var wait = Math.max(0, 900 - (Date.now() - started));
        setTimeout(function () {
          TrButton.setState(btn, 'success');
          setTimeout(function () {
            form.classList.add('is-done'); done.hidden = false; done.focus();
            if (window.dataLayer) window.dataLayer.push({ event: 'demo_request_submitted', intent: data.intent });
          }, 650);
        }, wait);
      }).catch(function () {
        TrButton.setState(btn, 'idle'); TrButton.shake(btn);
        var a = document.createElement('p'); a.className = 'form-alert'; a.setAttribute('role', 'alert');
        a.textContent = 'Unable to send your request. Check your connection and try again.';
        btn.parentNode.insertBefore(a, btn.nextSibling);
      });
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('form[data-form]'), init);
})();
