/* Motor de cuestionarios · arnulfo.com.co
   Uso: definir window.CUESTIONARIOS = { materia:'pa', items:{ e1:{titulo, sub, preguntas:[{p, o:[...], c:índice, x:'explicación'}]} } }
   y un <div id="quiz"></div> y <nav id="qtabs"></nav>. El progreso se guarda en este navegador (localStorage). */
(function () {
  var D = window.CUESTIONARIOS;
  if (!D) return;
  var KEYS = Object.keys(D.items);
  var LET = 'ABCDEFG';

  function store(k, v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null');
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return null; }
  }
  function key(id) { return 'quiz:' + D.materia + ':' + id; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  var tabs = document.getElementById('qtabs');
  var box = document.getElementById('quiz');

  function drawTabs(cur) {
    tabs.innerHTML = '';
    KEYS.forEach(function (id) {
      var q = D.items[id], s = store(key(id));
      var a = el('a', null, q.corto + (s ? ' <span class="b">' + s.best + '/' + s.total + '</span>' : ''));
      a.href = '#' + id;
      if (id === cur) a.setAttribute('aria-current', 'page');
      tabs.appendChild(a);
    });
  }

  function start(id) {
    var q = D.items[id];
    drawTabs(id);
    var order = shuffle(q.preguntas.map(function (_, i) { return i; }));
    var st = { i: 0, ok: 0, miss: [] };
    document.title = q.titulo + ' · Cuestionarios';

    box.innerHTML = '';
    var head = el('div', 'qh');
    head.innerHTML = '<div class="eyebrow" style="color:var(--c)">' + q.sub + '</div><h2>' + q.titulo + '</h2>' +
      '<div class="qbar"><i></i></div><div class="meta"><span class="cnt"></span><span class="sco"></span></div>';
    var body = el('div', 'qb');
    box.appendChild(head); box.appendChild(body);
    var bar = head.querySelector('.qbar i'), cnt = head.querySelector('.cnt'), sco = head.querySelector('.sco');

    function meta() {
      bar.style.width = (100 * st.i / order.length) + '%';
      cnt.textContent = st.i < order.length ? 'Pregunta ' + (st.i + 1) + ' de ' + order.length : 'Terminado';
      sco.textContent = st.ok + ' correctas';
    }

    function ask() {
      meta();
      if (st.i >= order.length) return finish();
      var P = q.preguntas[order[st.i]];
      var opts = shuffle(P.o.map(function (t, k) { return { t: t, ok: k === P.c }; }));
      body.innerHTML = '';
      body.appendChild(el('p', 'prompt', P.p));
      var list = el('div', 'opts');
      var btns = opts.map(function (o, k) {
        var b = el('button', 'opt', '<span class="k">' + LET[k] + '</span><span>' + o.t + '</span>');
        b.type = 'button';
        b.addEventListener('click', function () { answer(k); });
        list.appendChild(b);
        return b;
      });
      body.appendChild(list);
      var exp = el('div', 'exp'); exp.hidden = true; body.appendChild(exp);
      var foot = el('div', 'qfoot');
      var next = el('button', 'qbtn', st.i + 1 < order.length ? 'Siguiente →' : 'Ver resultado');
      next.type = 'button'; next.disabled = true;
      next.addEventListener('click', function () { st.i++; ask(); window.scrollTo({ top: box.offsetTop - 12, behavior: 'smooth' }); });
      foot.appendChild(next); body.appendChild(foot);

      function answer(k) {
        var good = opts[k].ok;
        btns.forEach(function (b, j) {
          b.disabled = true;
          if (opts[j].ok) b.classList.add('ok');
          else if (j === k) b.classList.add('bad');
          else b.classList.add('dim');
        });
        if (good) st.ok++;
        else st.miss.push(P);
        exp.innerHTML = (good ? '<b class="v">Correcto.</b> ' : '<b class="x">No es esa.</b> ') + P.x;
        exp.hidden = false;
        next.disabled = false;
        next.focus();
        meta();
      }
    }

    function finish() {
      var total = order.length, prev = store(key(id));
      var best = Math.max(st.ok, prev ? prev.best : 0);
      store(key(id), { best: best, last: st.ok, total: total, fecha: (function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); })(new Date()) });
      drawTabs(id);
      var pct = Math.round(100 * st.ok / total);
      var msg = pct === 100 ? 'Perfecto. Este escenario está dominado.' :
        pct >= 80 ? 'Muy bien. Repase las que falló y vuelva a intentarlo.' :
        pct >= 60 ? 'Va por buen camino. Conviene releer el resumen del escenario.' :
        'Vale la pena volver al resumen antes de repetir.';
      body.innerHTML = '<div class="res"><div class="big">' + st.ok + '/' + total + '</div><p>' + msg + '</p>' +
        (prev ? '<p style="font-size:14px;color:var(--tx3)">Mejor resultado guardado en este navegador: ' + best + '/' + total + '</p>' : '') + '</div>';
      if (st.miss.length) {
        var m = el('div', 'miss', '<h3>Para repasar</h3>');
        var ul = el('ul');
        st.miss.forEach(function (P) { ul.appendChild(el('li', null, '<b>' + P.p + '</b><br>Respuesta: ' + P.o[P.c] + '. ' + P.x)); });
        m.appendChild(ul); body.appendChild(m);
      }
      var foot = el('div', 'qfoot');
      var again = el('button', 'qbtn sec', 'Repetir'); again.type = 'button';
      again.addEventListener('click', function () { start(id); });
      foot.appendChild(again);
      var ix = KEYS.indexOf(id);
      if (ix + 1 < KEYS.length) {
        var nx = el('a', 'qbtn', 'Siguiente cuestionario →'); nx.href = '#' + KEYS[ix + 1]; nx.style.textDecoration = 'none';
        foot.appendChild(nx);
      }
      if (q.repaso) {
        var rp = el('a', 'qbtn sec', 'Ir al resumen'); rp.href = q.repaso; rp.style.textDecoration = 'none';
        foot.insertBefore(rp, foot.firstChild);
      }
      body.appendChild(foot);
      bar.style.width = '100%';
    }

    ask();
  }

  function route() {
    var h = (location.hash || '').replace('#', '');
    start(KEYS.indexOf(h) >= 0 ? h : (D.inicio || KEYS[0]));
  }
  window.addEventListener('hashchange', route);
  route();
})();
