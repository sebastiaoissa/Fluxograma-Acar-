/*
 * Decisões da rede — registro com bloqueio após salvar.
 *
 * - As decisões ficam em data/decisoes.json, dentro do repositório do site.
 * - Qualquer visitante apenas LÊ as decisões.
 * - Gravar exige um token do GitHub com permissão de escrita no repositório
 *   (modo coordenador: abrir a página com ?editar=1).
 * - Ao salvar, o tema fica bloqueado ("bloqueado": true). Só volta a ser
 *   editável se o arquivo data/decisoes.json for alterado diretamente no GitHub.
 */
(function () {
  var CFG = {
    owner: 'sebastiaoissa',
    repo: 'Fluxograma-Acar-',
    branch: 'claude/magical-ride-k86aox',
    path: 'data/decisoes.json'
  };
  var API = 'https://api.github.com/repos/' + CFG.owner + '/' + CFG.repo + '/contents/' + CFG.path;
  var TOKEN_KEY = 'fluxo-acara:token';
  var DRAFT_KEY = 'fluxo-acara:rascunho:';

  var editMode = new URLSearchParams(location.search).get('editar') === '1';
  var data = null;
  var token = null;

  // ---------- armazenamento local (tolerante a falhas) ----------
  function store(kind) {
    try { return window[kind]; } catch (e) { return null; }
  }
  function getItem(key) {
    var s = store('localStorage'), t = store('sessionStorage');
    try { return (s && s.getItem(key)) || (t && t.getItem(key)) || null; } catch (e) { return null; }
  }
  function setItem(key, val, persistent) {
    var s = store(persistent ? 'localStorage' : 'sessionStorage');
    try { if (s) s.setItem(key, val); } catch (e) {}
  }
  function removeItem(key) {
    ['localStorage', 'sessionStorage'].forEach(function (k) {
      var s = store(k); try { if (s) s.removeItem(key); } catch (e) {}
    });
  }

  // ---------- utilitários ----------
  function b64decode(str) {
    var bin = atob(str.replace(/\n/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  function b64encode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // ---------- leitura ----------
  function fetchFromApi(withToken) {
    var headers = { Accept: 'application/vnd.github+json' };
    if (withToken && token) headers.Authorization = 'Bearer ' + token;
    return fetch(API + '?ref=' + encodeURIComponent(CFG.branch) + '&t=' + Date.now(), { headers: headers, cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) { var err = new Error('HTTP ' + r.status); err.status = r.status; throw err; }
        return r.json();
      })
      .then(function (j) { return { json: JSON.parse(b64decode(j.content)), sha: j.sha }; });
  }
  function fetchStatic() {
    return fetch(CFG.path + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { return { json: j, sha: null }; });
  }
  function load() {
    // A API do GitHub traz a versão mais recente, sem esperar a republicação do site;
    // se falhar (limite de consultas, rede), usa a cópia publicada junto com o site.
    return fetchFromApi(!!token).catch(fetchStatic).then(function (res) { data = res.json; return res; });
  }

  // ---------- gravação ----------
  function saveTopic(id, texto) {
    return fetchFromApi(true).then(function (res) {
      var fresh = res.json;
      var t = fresh.temas && fresh.temas[id];
      if (!t) throw new Error('Tema ' + id + ' não encontrado em ' + CFG.path + '.');
      if (t.bloqueado) {
        data = fresh;
        var e = new Error('Este tema já foi salvo e está bloqueado. Para alterá-lo, libere-o editando ' + CFG.path + ' no GitHub.');
        e.locked = true;
        throw e;
      }
      t.decisao = texto;
      t.bloqueado = true;
      t.salvo_em = new Date().toISOString();
      var body = {
        message: 'Registra decisão da rede — tema ' + id + ': ' + t.tema,
        content: b64encode(JSON.stringify(fresh, null, 2) + '\n'),
        sha: res.sha,
        branch: CFG.branch
      };
      return fetch(API, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (r.status === 409 || r.status === 422) throw new Error('O arquivo foi alterado ao mesmo tempo por outra pessoa. Recarregue a página e tente de novo.');
        if (r.status === 401 || r.status === 403 || r.status === 404) {
          var e = new Error('A chave de acesso não tem permissão para gravar neste repositório.'); e.auth = true; throw e;
        }
        if (!r.ok) throw new Error('Falha ao salvar (HTTP ' + r.status + ').');
        data = fresh;
      });
    });
  }

  // ---------- interface ----------
  function topicId(section) {
    var n = section.querySelector('.topic__num');
    return n ? n.textContent.trim() : null;
  }

  function renderTopic(section) {
    var id = topicId(section);
    var box = section.querySelector('.topic__decision');
    if (!id || !box) return;
    var t = (data && data.temas && data.temas[id]) || { decisao: '', bloqueado: false };

    box.textContent = '';
    box.classList.remove('is-locked', 'is-open', 'is-editing');
    var label = el('div', 'decision__label', 'Decisão da rede');
    box.appendChild(label);

    if (t.bloqueado) {
      box.classList.add('is-locked');
      label.appendChild(el('span', 'decision__badge', 'Registrada'));
      box.appendChild(el('div', 'decision__text', t.decisao || '(sem texto)'));
      if (t.salvo_em) box.appendChild(el('div', 'decision__meta', 'Salva em ' + fmtDate(t.salvo_em) + ' · bloqueada para alterações'));
      return;
    }

    if (!(editMode && token)) {
      box.classList.add('is-open');
      label.appendChild(el('span', 'decision__badge decision__badge--open', 'Aguardando definição'));
      box.appendChild(el('div', 'decision__blank'));
      return;
    }

    // Modo coordenador: tema ainda aberto
    box.classList.add('is-editing');
    var ta = el('textarea', 'decision__input');
    ta.rows = 4;
    ta.placeholder = 'Registre aqui a decisão da rede para este tema…';
    ta.value = getItem(DRAFT_KEY + id) || t.decisao || '';
    ta.addEventListener('input', function () { setItem(DRAFT_KEY + id, ta.value, true); });
    box.appendChild(ta);

    var bar = el('div', 'decision__actions');
    var btn = el('button', 'decision__save', 'Salvar e bloquear');
    btn.type = 'button';
    var msg = el('span', 'decision__msg');
    bar.appendChild(btn); bar.appendChild(msg);
    box.appendChild(bar);

    btn.addEventListener('click', function () {
      var texto = ta.value.trim();
      if (!texto) { msg.textContent = 'Escreva a decisão antes de salvar.'; return; }
      if (!confirm('Salvar a decisão do tema ' + id + '?\n\nDepois de salva, ela fica BLOQUEADA e só pode ser alterada editando o arquivo ' + CFG.path + ' no GitHub.')) return;
      btn.disabled = true; ta.disabled = true;
      msg.textContent = 'Salvando…';
      saveTopic(id, texto).then(function () {
        removeItem(DRAFT_KEY + id);
        renderTopic(section);
        updateSummary();
      }).catch(function (e) {
        if (e.locked) { renderTopic(section); updateSummary(); return; }
        btn.disabled = false; ta.disabled = false;
        msg.textContent = e.message || 'Não foi possível salvar.';
        if (e.auth) { forgetToken(); }
      });
    });
  }

  function updateSummary() {
    var s = document.querySelector('[data-decisoes-resumo]');
    if (!s || !data || !data.temas) return;
    var ids = Object.keys(data.temas);
    var done = ids.filter(function (k) { return data.temas[k].bloqueado; }).length;
    s.textContent = done + ' de ' + ids.length + ' temas com decisão registrada.';
  }

  function renderAll() {
    var topics = document.querySelectorAll('.topic');
    for (var i = 0; i < topics.length; i++) renderTopic(topics[i]);
    updateSummary();
  }

  function forgetToken() {
    token = null; removeItem(TOKEN_KEY);
    renderAdminBar(); renderAll();
  }

  function renderAdminBar() {
    if (!editMode) return;
    var bar = document.querySelector('.admin-bar');
    if (!bar) {
      bar = el('div', 'admin-bar');
      var body = document.querySelector('.sheet-body');
      body.insertBefore(bar, body.firstChild);
    }
    bar.textContent = '';
    bar.appendChild(el('div', 'admin-bar__title', 'Modo coordenador'));

    if (token) {
      bar.appendChild(el('p', 'admin-bar__text', 'Conectado. Escreva a decisão em cada tema e clique em "Salvar e bloquear". O texto digitado fica guardado neste navegador até ser salvo.'));
      var out = el('button', 'admin-bar__btn admin-bar__btn--ghost', 'Sair');
      out.type = 'button';
      out.addEventListener('click', forgetToken);
      bar.appendChild(out);
      return;
    }

    bar.appendChild(el('p', 'admin-bar__text', 'Informe a chave de acesso do GitHub (token com permissão de escrita neste repositório). Ela fica apenas neste navegador.'));
    var row = el('div', 'admin-bar__row');
    var input = el('input', 'admin-bar__input');
    input.type = 'password'; input.autocomplete = 'off'; input.placeholder = 'github_pat_…';
    var remember = el('label', 'admin-bar__check');
    var cb = el('input'); cb.type = 'checkbox';
    remember.appendChild(cb); remember.appendChild(document.createTextNode(' lembrar neste dispositivo'));
    var go = el('button', 'admin-bar__btn', 'Entrar');
    go.type = 'button';
    var msg = el('span', 'decision__msg');
    row.appendChild(input); row.appendChild(go);
    bar.appendChild(row); bar.appendChild(remember); bar.appendChild(msg);

    go.addEventListener('click', function () {
      var v = input.value.trim();
      if (!v) return;
      msg.textContent = 'Verificando…';
      token = v;
      fetch('https://api.github.com/repos/' + CFG.owner + '/' + CFG.repo, {
        headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + v }
      }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (repo) {
          if (!repo.permissions || !repo.permissions.push) throw 'sem-permissao';
          setItem(TOKEN_KEY, v, cb.checked);
          return load();
        })
        .then(function () { renderAdminBar(); renderAll(); })
        .catch(function () {
          token = null;
          msg.textContent = 'Chave inválida ou sem permissão de escrita neste repositório.';
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (editMode) token = getItem(TOKEN_KEY);
    renderAdminBar();
    renderAll(); // estado inicial ("carregando" = aguardando)
    load().then(renderAll).catch(function () {
      var s = document.querySelector('[data-decisoes-resumo]');
      if (s) s.textContent = 'Não foi possível carregar as decisões registradas.';
    });
  });
})();
