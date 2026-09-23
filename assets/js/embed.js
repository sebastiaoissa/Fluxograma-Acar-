/*
 * Modo incorporado dos fluxogramas.
 * - Dentro de um <iframe> (ou com ?embed=1 na URL) a barra de navegação é ocultada.
 * - A página informa sua altura ao site hospedeiro via postMessage, permitindo
 *   que o iframe se ajuste automaticamente (ver README.md).
 */
(function () {
  var params = new URLSearchParams(window.location.search);
  var inFrame;
  try { inFrame = window.self !== window.top; } catch (e) { inFrame = true; }
  var embedded = params.get('embed') === '1' || (inFrame && params.get('embed') !== '0');

  if (!embedded) return;
  document.documentElement.classList.add('is-embedded');

  // Links internos passam a manter o modo incorporado
  document.addEventListener('DOMContentLoaded', function () {
    var links = document.querySelectorAll('a[href$=".html"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href.indexOf('://') === -1) links[i].setAttribute('href', href + '?embed=1');
    }
  });

  if (!inFrame || !window.parent) return;
  var last = 0;
  function report() {
    var h = document.documentElement.scrollHeight;
    if (h === last) return;
    last = h;
    window.parent.postMessage({ type: 'fluxograma:height', height: h, page: location.pathname }, '*');
  }
  window.addEventListener('load', report);
  window.addEventListener('resize', report);
  if ('ResizeObserver' in window) new ResizeObserver(report).observe(document.documentElement);
})();
