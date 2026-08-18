-- Conceder permissões para a tabela artworks
GRANT ALL ON public.artworks TO authenticated;
GRANT ALL ON public.artworks TO service_role;
GRANT SELECT ON public.artworks TO anon;

-- Conceder permissões para a tabela user_roles
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Conceder permissões para a tabela categories
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT SELECT ON public.categories TO anon;

-- Conceder permissão de execução na função has_role
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;
