# Fluxo Municipal de Atendimento — Acará/PA

Fluxogramas da rede de proteção do Município de Acará/PA para o atendimento a crianças e adolescentes vítimas ou testemunhas de violência, em formato de site estático (HTML + CSS, sem dependências externas).

## Estrutura

```
index.html              Capa com os três fluxogramas
fluxograma-1.html       Fluxo Geral de Atendimento
fluxograma-2.html       Escuta Especializada × Depoimento Especial
fluxograma-3.html       Fluxo da Delegacia de Polícia
assets/css/fluxograma.css   Folha de estilo única (cores, componentes, responsivo, impressão)
assets/js/embed.js          Modo incorporado (iframe) e ajuste automático de altura
assets/fonts/               IBM Plex Sans (auto-hospedada)
REVISAO-LEGAL.md        Normas conferidas, correções e pactuações locais a confirmar
```

As citações normativas aparecem **somente dentro dos quadros** (linha "Base legal" ao pé de cada quadro). Cabeçalhos, capa e rodapés não trazem citações.

## Publicação

**Endereço público (GitHub Pages):** https://sebastiaoissa.github.io/Fluxograma-Acar-/

Para ativar (uma única vez): *Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `claude/magical-ride-k86aox`, pasta `/ (root)` → Save*. A cada novo push o site é republicado automaticamente em 1–2 minutos.

O site também funciona em qualquer outra hospedagem estática (Netlify, servidor da prefeitura etc.): basta copiar a pasta inteira. Os links são relativos.

## Inserir os fluxogramas em outro site

### Opção 1 — link direto
Aponte para `index.html` ou para cada `fluxograma-N.html`.

### Opção 2 — iframe (recomendado)
Dentro de um `<iframe>` a página oculta automaticamente a barra de navegação e informa sua altura ao site hospedeiro. Para o iframe se ajustar sozinho:

```html
<iframe id="fluxo-1" src="https://SEU-DOMINIO/fluxogramas/fluxograma-1.html"
        title="Fluxo Geral de Atendimento" style="width:100%;border:0" loading="lazy"></iframe>

<script>
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'fluxograma:height') return;
    document.querySelectorAll('iframe').forEach(function (f) {
      if (f.contentWindow === e.source) f.style.height = e.data.height + 'px';
    });
  });
</script>
```

- `?embed=1` força o modo incorporado mesmo fora de iframe.
- `?embed=0` mantém a barra de navegação dentro do iframe.

### Opção 3 — incorporar o HTML diretamente
Copie o conteúdo de `<article class="sheet">…</article>` para a página desejada e inclua `assets/css/fluxograma.css`. Todas as classes são prefixadas por componente (`step`, `branch`, `reqs`, `rights`, `deadlines`…), o que reduz conflitos com o CSS do site hospedeiro.
