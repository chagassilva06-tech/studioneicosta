# Plano de Responsividade Total - StudioNei

Garantir que todas as páginas, componentes e fluxos do StudioNei sejam 100% responsivos, fluidos e adaptáveis a qualquer tamanho de tela (Mobile, Tablet, Desktop, Ultrawide), eliminando quebras de layout e overflow horizontal.

## Análise e Diagnóstico
- Revisão de `src/styles.css` para identificar estilos globais que possam causar overflow.
- Inspeção de componentes críticos: `StackedCarousel`, `Lightbox`, `AllArtworksModal`, `CategoryScroll`, `CategoryManager`.
- Verificação de rotas: `/` (Home), `/galeria/$categoria`, `/auth`.

## Ajustes Estruturais e Globais
- **CSS Global:** Reforçar `overflow-x: hidden` no `html` e `body`. Garantir que `max-width: 100%` esteja aplicado corretamente a containers.
- **Tipografia:** Ajustar tamanhos de fonte do Hero e do logotipo "StudioNei" em telas pequenas para evitar quebras ou sobreposições.
- **Espaçamento:** Revisar paddings e gaps em containers principais (`max-w-7xl`).

## Ajustes em Componentes
### Header e Navegação
- Ajustar a barra de assinatura editorial para não sumir ou quebrar em telas muito estreitas.
- Garantir que o logotipo centralizado não empurre botões de ação para fora da tela.
- Otimizar o `CategoryScroll` para melhor navegação touch e visibilidade das setas.

### StackedCarousel (Destaques)
- Ajustar a escala e o `translateZ` para evitar que os cards saiam da viewport em celulares pequenos.
- Melhorar os controles (setas e indicadores) para não sobrepor o conteúdo em mobile.

### AllArtworksModal e Galeria
- Ajustar o grid de imagens (`grid-cols-2` para mobile) e garantir que o modal ocupe toda a tela no celular.
- Otimizar a barra de busca e filtros no modal para layouts verticais.

### Lightbox
- Garantir que a imagem e os controles (zoom, fechar, setas) sejam facilmente utilizáveis com o polegar no mobile.
- Ajustar o zoom para não causar overflow incontrolável.

### O Artista (Seção Sobre)
- Garantir que a foto e o texto se alinhem verticalmente em telas menores com espaçamentos harmoniosos.

## Validação Técnica
- Testar via Playwright/Emulação de dispositivos os breakpoints: 320px, 480px, 768px, 1024px, 1440px.
- Verificar console logs em busca de erros de renderização responsiva.
