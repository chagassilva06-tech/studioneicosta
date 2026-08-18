# Plano de Melhorias: Tradução Completa e Navegação de Categorias

Este plano detalha a tradução de 100% do sistema para Português (Brasil) e a adição de setas de rolagem para a navegação de categorias no cabeçalho.

## Alterações

### 1. Tradução Completa (Português Brasil)
Revisão e tradução de todos os textos, mensagens de erro, descrições e interfaces que ainda possam estar em inglês ou com termos técnicos.

- **Componentes de UI:** `Lightbox.tsx`, `CategoryManager.tsx`, `AllArtworksModal.tsx`, `StackedCarousel.tsx`.
- **Rotas:** `auth.tsx`, `galeria.$categoria.tsx`, `index.tsx`.
- **Mensagens:** Toasts, avisos de erro no login, descrições de categorias.

### 2. Navegação de Categorias com Setas
Adição de controles visuais (setas) na barra de categorias para facilitar a rolagem em dispositivos desktop e melhorar a indicação de conteúdo lateral.

- **Ficheiro:** `src/routes/index.tsx`.
- **Funcionalidade:** Adicionar botões flutuantes (setas) que aparecem quando há conteúdo para rolar.

---

## Detalhes Técnicos

### Tradução
- **Lightbox:** Traduzir títulos e labels de botões (Próxima, Anterior, Zoom).
- **CategoryManager:** Traduzir labels, placeholders e tooltips (Manage -> Gerenciar, Select -> Selecionar, etc).
- **Auth:** Refinar mensagens de erro para serem mais naturais em PT-BR.
- **Carousel:** Garantir que labels de acessibilidade e estados estejam em português.

### Setas de Rolagem
- Implementar um `useRef` para o container de categorias.
- Adicionar botões `ChevronLeft` e `ChevronRight` com posicionamento absoluto.
- Usar estados para esconder/mostrar as setas baseados na posição do scroll (`scrollLeft > 0` e `scrollLeft < maxScroll`).
- Aplicar animações suaves com Framer Motion ou Tailwind.
