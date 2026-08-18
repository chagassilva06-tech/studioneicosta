# Plan to Update Gallery Categories and Search/Filters

This plan outlines the steps to update the artistic portfolio's categories while preserving existing images, improving search/filter integration, and refining the user interface.

## User Review Required

> [!IMPORTANT]
> The current category management is dynamic via the database. I will seed the new requested categories while keeping the old ones so that existing artworks are not orphaned. You can then manually delete the old categories from the "Gerenciar" (Manage) menu if they are no longer needed after moving images.

## Proposed Changes

### Database & Seed
- Add a new migration to seed the requested categories: `Abstrato`, `Paisagens`, `Retratos`, `Figurativo`, `Natureza`, `Natureza-Morta`, `Urbano`, `Contemporâneo`, `Expressionismo`, `Experimental / Técnica Mista`.
- Keep existing categories to avoid breaking links to currently uploaded artworks.

### Frontend - Search & Filtering
- **Integrated Search/Filters**: Update `AllArtworksModal` to allow combined filtering (e.g., Category "Abstrato" + Search "azul").
- **Clear Filters Button**: Add a "Limpar Busca/Filtros" button to the search bar and the "All Artworks" modal.
- **Dynamic Category Pills**: Ensure the category scroll bar in `src/routes/index.tsx` handles the increased number of categories without breaking the layout (maintaining smooth horizontal scroll within the pill area).

### UI/UX Refinement
- **All Artworks Modal**: Enhance the grid and filtering logic to support the new categories.
- **Responsiveness**: Verify that the fixed header, category pills, and search bar work perfectly on mobile, tablet, and desktop.
- **Admin Panel**: Verify that the upload and category assignment logic correctly reflects the new categories.

## Technical Details

### Backend
- Create migration `supabase/migrations/20260818000000_new_categories.sql`:
  ```sql
  INSERT INTO public.categories (name, icon, sort_order) VALUES
    ('Abstrato', 'Sparkles', 7),
    ('Figurativo', 'User', 8),
    ('Natureza', 'Trees', 9),
    ('Natureza-Morta', 'Flower', 10),
    ('Urbano', 'Mountain', 11),
    ('Contemporâneo', 'Zap', 12),
    ('Expressionismo', 'Flame', 13),
    ('Experimental / Técnica Mista', 'Ghost', 14)
  ON CONFLICT (name) DO NOTHING;
  ```
  *(Note: Paisagens and Retratos already exist in some form, I will ensure they match the list)*

### Components
- **`src/components/AllArtworksModal.tsx`**:
  - Add `searchQuery` state.
  - Update `filtered` logic: `items.filter(i => (filter === 'Todas' || i.categoria === filter) && (searchQuery === '' || i.name.includes(searchQuery)))`.
- **`src/routes/index.tsx`**:
  - Update header/nav to handle horizontal overflow of pills more elegantly.
  - Implement the "Search + Category" combined logic for the search bar.
- **`src/lib/category-icons.ts`**:
  - Add any missing icon mappings if needed.

## Constraints & Maintenance
- **Identity Preservation**: No changes to colors, fonts, or primary identity (Dark, Gold, Neon Blue).
- **Functionality**: Uploads, deletes, and admin RLS will remain untouched and fully operational.
