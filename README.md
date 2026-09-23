# Fluxo Municipal de Atendimento — Acará/PA

Fluxogramas da rede de proteção do Município de Acará/PA para o atendimento a crianças e adolescentes vítimas ou testemunhas de violência, em formato de site estático (HTML + CSS, sem dependências externas).

## Estrutura

```
index.html              Capa: apresentação do fluxo e acesso às páginas
fluxograma-1.html       Fluxo Geral de Atendimento
fluxograma-2.html       Escuta Especializada × Depoimento Especial
fluxograma-3.html       Fluxo da Delegacia de Polícia
pontos-para-definicao.html  Pauta de decisões locais para a reunião da rede (imprimível)
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

## Registro das decisões da rede (página "Pontos para definição")

As decisões tomadas na reunião ficam salvas em **`data/decisoes.json`**, dentro deste repositório. Visitantes do site apenas leem. Só grava quem tem uma chave de acesso com permissão de escrita no repositório.

### 1. Criar a chave de acesso (uma única vez)
1. No GitHub: foto do perfil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Repository access:** *Only select repositories* → `Fluxograma-Acar-`.
3. **Permissions → Repository permissions → Contents:** *Read and write*.
4. Escolha uma validade (por exemplo, até o fim das reuniões) e gere a chave. Guarde-a: ela começa com `github_pat_`.

### 2. Registrar decisões na reunião
1. Abra `https://sebastiaoissa.github.io/Fluxograma-Acar-/pontos-para-definicao.html?editar=1`.
2. Cole a chave em **Modo coordenador → Entrar**. Marque "lembrar neste dispositivo" só em computador pessoal.
3. Escreva a decisão em cada tema. O texto fica guardado no navegador até ser salvo.
4. Clique em **Salvar e bloquear**. A decisão é gravada no repositório (commit automático) e o tema fica **bloqueado**: ninguém consegue alterá-lo pelo site, nem mesmo o coordenador.

### 3. Liberar um tema para nova edição
Somente editando o arquivo no GitHub:
1. Abra `data/decisoes.json` no repositório → ícone de lápis (*Edit*).
2. No tema desejado, troque `"bloqueado": true` por `"bloqueado": false` e confirme o commit.
3. Na próxima vez que a página for aberta em modo coordenador, o tema volta a ser editável.

O histórico de commits do arquivo registra cada decisão salva e cada liberação, com data e autor.
