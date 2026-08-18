# Plano de Correção: Upload de Imagens com Caracteres Especiais

Corrigir a falha no envio de imagens para a categoria "Contemporâneo" e outras que contenham acentos ou espaços, garantindo que o caminho no armazenamento (Supabase Storage) seja robusto e compatível.

## Alterações

### Frontend

- **Sanitização de Caminhos:** Modificar `src/routes/galeria.$categoria.tsx` para remover acentos e caracteres especiais do nome da categoria antes de criar o caminho no Storage. Isso evita erros de codificação de URL na API do Supabase.
- **Normalização de Dados:** Garantir que o nome da categoria enviado para a tabela `artworks` no banco de dados corresponda exatamente ao nome cadastrado, mantendo os acentos para exibição, enquanto o arquivo físico usa um nome "limpo".
- **Feedback de Erro:** Melhorar o log de erro no console para identificar se a falha ocorre no Storage ou no Banco de Dados.

### Banco de Dados (Via Migration)

- **Garantir Permissões:** Verificar e reforçar as políticas de RLS para o bucket `artworks` e a tabela `artworks`.

## Detalhes Técnicos

- Implementar uma função `slugify` no frontend para transformar "Contemporâneo" em "contemporaneo" apenas para o caminho do arquivo no Storage.
- Exemplo: `Contemporâneo/slot-0...` torna se `contemporaneo/slot-0...`.
- Manter o registro no banco com `categoria: "Contemporâneo"` para consistência com a tabela de categorias.

## Verificação

- Tentar o upload em uma categoria com acento ("Contemporâneo").
- Verificar se o arquivo foi criado no bucket e o registro inserido no banco.
- Testar a substituição de imagem existente nessas categorias.
