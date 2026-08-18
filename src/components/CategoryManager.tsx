import { memo, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { X, Plus, Pencil, Trash2, Loader2, Save, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { iconNames, getIcon, iconMap, type IconName } from "@/lib/category-icons";
import { toast } from "sonner";

export type Category = {
  id: string;
  name: string;
  icon: string;
  description: string;
  sort_order: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
};



export const CategoryManager = memo(function CategoryManager({ open, onClose, onChanged }: Props) {
  const [items, setItems] = useState<Category[]>([]);
  const [unregistered, setUnregistered] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftIcon, setDraftIcon] = useState<IconName>("Palette");
  const [draftDesc, setDraftDesc] = useState("");
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState<IconName>("Palette");
  const [newDesc, setNewDesc] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string>("");
  const [purgeName, setPurgeName] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    // 1. Fetch registered categories
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name, icon, description, sort_order")
      .order("sort_order", { ascending: true });
    
    const registeredItems = (cats as Category[]) ?? [];
    setItems(registeredItems);

    // 2. Fetch distinct categories from artworks to find unregistered ones
    const { data: arts } = await supabase.from("artworks").select("categoria");
    if (arts) {
      const distinct = Array.from(new Set(arts.map(a => a.categoria)));
      const registeredNames = new Set(registeredItems.map(c => c.name));
      const missing = distinct.filter(name => !registeredNames.has(name)).sort();
      setUnregistered(missing);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !confirmId && !purgeName && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, confirmId, purgeName]);

  if (!open) return null;

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setDraftName(c.name);
    setDraftIcon((c.icon as IconName) || "Palette");
    setDraftDesc(c.description ?? "");
  };

  const saveEdit = async () => {
    if (!editingId || !draftName.trim()) return;
    const current = items.find((c) => c.id === editingId);
    setSaving(true);
    const nextName = draftName.trim();
    const { error } = await supabase
      .from("categories")
      .update({ name: nextName, icon: draftIcon, description: draftDesc.trim() })
      .eq("id", editingId);

    // Keep artworks linked when the category is renamed
    if (!error && current && current.name !== nextName) {
      await supabase.from("artworks").update({ categoria: nextName }).eq("categoria", current.name);
    }
    setSaving(false);
    if (error) {
      toast.error("Falha ao salvar: " + error.message);
      return;
    }
    toast.success("Categoria atualizada com sucesso");
    setEditingId(null);
    await load();
    onChanged();
  };

  const askRemove = (id: string, name: string) => {
    setConfirmId(id);
    setConfirmName(name);
  };

  const confirmRemove = async () => {
    if (!confirmId) return;
    
    // First, delete all artworks associated with this category from the DB
    const { error: artworksError } = await supabase
      .from("artworks")
      .delete()
      .eq("categoria", confirmName);

    if (artworksError) {
      toast.error("Falha ao excluir obras da categoria: " + artworksError.message);
      return;
    }

    // Note: Orphaned storage files are not cleaned up here to keep the DB deletion fast, 
    // but in a production app, we'd ideally trigger a background job to delete files from Storage.

    const { error: categoryError } = await supabase.from("categories").delete().eq("id", confirmId);
    setConfirmId(null);
    setConfirmName("");
    if (categoryError) {
      toast.error("Falha ao excluir categoria: " + categoryError.message);
      return;
    }
    toast.success("Categoria e fotos vinculadas excluídas");
    await load();
    onChanged();
  };

  const cancelRemove = () => {
    setConfirmId(null);
    setConfirmName("");
  };


  const create = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const nextOrder = (items[items.length - 1]?.sort_order ?? 0) + 1;
    const { error } = await supabase.from("categories").insert({
      name: newName.trim(),
      icon: newIcon,
      description: newDesc.trim(),
      sort_order: nextOrder,
    });
    setSaving(false);
    if (error) {
      toast.error("Falha ao criar: " + error.message);
      return;
    }
    toast.success("Categoria criada!");
    setNewName("");
    setNewIcon("Palette");
    setNewDesc("");
    await load();
    onChanged();
  };

  const registerCategory = async (name: string) => {
    setSaving(true);
    const nextOrder = (items[items.length - 1]?.sort_order ?? 0) + 1;
    const { error } = await supabase.from("categories").insert({
      name: name,
      icon: "Palette",
      description: "Categoria importada de obras existentes",
      sort_order: nextOrder,
    });
    setSaving(false);
    if (error) {
      toast.error("Falha ao registrar: " + error.message);
      return;
    }
    toast.success(`Categoria "${name}" registrada!`);
    await load();
    onChanged();
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        className="relative flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-3xl border border-[#d8bf85]/20 bg-[#050912]/95 shadow-[0_40px_100px_-20px_rgba(0,0,0,1),0_0_80px_-10px_rgba(216,191,133,0.15)] backdrop-blur-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/5 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[#d8bf85] shadow-[0_0_10px_rgba(216,191,133,0.6)]" />
            <h2 className="min-w-0 truncate font-display text-2xl sm:text-3xl font-light">
              Gerenciar <span className="italic text-[#d8bf85]">Categorias</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 shrink-0 rounded-full inline-flex items-center justify-center text-[#d8bf85] hover:bg-[#d8bf85]/10 border border-[#d8bf85]/20 transition-colors"
            aria-label="Fechar"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Create — fixo, sem rolagem */}
        <div className="shrink-0 px-6 pt-6 sm:px-8 sm:pt-8">
          <div className="rounded-2xl border border-[#d8bf85]/15 bg-[#d8bf85]/[0.03] p-5 sm:p-6 shadow-inner">
            <p className="label-luxe mb-4 flex items-center gap-2">
              <Plus className="h-3 w-3" />
              Nova categoria
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="new-category-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome da categoria"
                className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-background/70 border border-white/10 text-sm outline-none focus:border-[#d8bf85]/50 focus:bg-background transition-all"
              />
              <IconPicker value={newIcon} onChange={setNewIcon} label="Selecionar" />
              <button
                onClick={create}
                disabled={saving || !newName.trim()}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#d8bf85] text-slate-950 font-medium text-sm hover:bg-[#f5e6b8] disabled:opacity-60 transition-colors shadow-[0_0_15px_rgba(216,191,133,0.3)]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Criar
              </button>
            </div>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Descreva aqui sobre a categoria (opcional)"
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-background/70 px-3 py-2 text-sm outline-none focus:border-[#d8bf85]/50 focus:bg-background transition-all"
            />
          </div>
        </div>

        {/* List — única área com rolagem */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="label-luxe">Selecione uma categoria existente abaixo para editar/alterar</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-[#d8bf85]/70">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((c) => {
                  const Icon = getIcon(c.icon);
                  const editing = editingId === c.id;
                  const menuOpen = menuOpenId === c.id;
                  
                  return (
                    <li
                      key={c.id}
                      className="group relative rounded-lg border border-white/5 px-3 py-3 transition-all hover:border-white/20 hover:shadow-[0_0_15px_-5px_var(--btn-glow)]"
                      style={{
                        background: `linear-gradient(135deg, var(--btn-grad-from) 0%, var(--btn-grad-to) 100%)`,
                        "--btn-grad-from": [
                          "rgba(14,165,233,0.06)", // Sky
                          "rgba(59,130,246,0.06)", // Blue
                          "rgba(139,92,246,0.06)", // Violet
                          "rgba(216,191,133,0.06)", // Gold
                          "rgba(16,185,129,0.06)", // Emerald
                          "rgba(244,63,94,0.06)",  // Rose
                        ][items.indexOf(c) % 6],
                        "--btn-grad-to": "rgba(255,255,255,0.01)",
                        "--btn-glow": [
                          "rgba(14,165,233,0.2)",
                          "rgba(59,130,246,0.2)",
                          "rgba(139,92,246,0.2)",
                          "rgba(216,191,133,0.2)",
                          "rgba(16,185,129,0.2)",
                          "rgba(244,63,94,0.2)",
                        ][items.indexOf(c) % 6],
                        "--btn-glow-solid": [
                          "#0ea5e9", "#3b82f6", "#8b5cf6", "#d8bf85", "#10b981", "#f43f5e"
                        ][items.indexOf(c) % 6]
                      } as any}
                    >
                      {editing ? (
                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <p className="text-xs font-medium text-[#fde047] mb-1">
                            Editar categoria: "{draftName}"
                          </p>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              value={draftName}
                              onChange={(e) => setDraftName(e.target.value)}
                              placeholder="Nome"
                              className="min-w-0 flex-1 px-2 py-1.5 rounded bg-background/70 border border-[#fde047]/40 text-sm outline-none focus:border-[#fde047]"
                            />
                            <IconPicker value={draftIcon} onChange={setDraftIcon} label="Selecionar" />
                          </div>
                          <textarea
                            value={draftDesc}
                            onChange={(e) => setDraftDesc(e.target.value)}
                            placeholder="Descreva aqui sobre a categoria (opcional)"
                            rows={3}
                            className="w-full resize-none rounded border border-[#fde047]/40 bg-background/70 px-2 py-1.5 text-sm outline-none focus:border-[#fde047]"
                          />
                          <div className="flex gap-1 pt-1">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#fde047] text-slate-950 text-xs font-medium hover:bg-[#fefce8] disabled:opacity-60 transition-colors"
                            >
                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded border border-border/60 text-xs hover:bg-muted/40 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] border border-white/10 group-hover:border-[var(--btn-glow)] transition-colors">
                            <Icon className="h-5 w-5" style={{ color: "var(--btn-glow-solid)" }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">{c.name}</span>
                            {c.description ? (
                              <p className="line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
                            ) : (
                              <p className="text-[10px] italic text-muted-foreground/50">Sem descrição</p>
                            )}
                          </div>
                          
                          <div className="relative shrink-0">
                            <button
                              onClick={() => setMenuOpenId(menuOpen ? null : c.id)}
                              className="h-9 w-9 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-[#d8bf85] hover:bg-[#d8bf85]/10 transition-colors"
                              aria-label="Menu de ações"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            {menuOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setMenuOpenId(null)} 
                                />
                                <div className="absolute right-0 top-full z-20 mt-1 w-48 origin-top-right overflow-hidden rounded-xl border border-white/10 bg-[#050912]/95 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                                  <button
                                    onClick={() => {
                                      startEdit(c);
                                      setMenuOpenId(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-white/[0.05] transition-colors"
                                  >
                                    <Pencil className="h-4 w-4 text-[#d8bf85]" />
                                    Editar categoria
                                  </button>
                                  <Link
                                    to="/galeria/$categoria"
                                    params={{ categoria: c.name }}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-white/[0.05] transition-colors"
                                  >
                                    <Plus className="h-4 w-4 text-[#d8bf85]" />
                                    Adicionar imagem
                                  </Link>
                                  <button
                                    onClick={() => {
                                      askRemove(c.id, c.name);
                                      setMenuOpenId(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-rose-400 hover:bg-rose-400/10 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir categoria
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
                {items.length === 0 && unregistered.length === 0 && (
                  <li className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border/50 rounded-lg">
                    Nenhuma categoria cadastrada.
                  </li>
                )}
              </ul>
            )}

            {unregistered.length > 0 && (
              <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="label-luxe mb-3 text-[#fde047]/80">Categorias encontradas em obras (não cadastradas)</p>
                <ul className="space-y-3">
                  {unregistered.map((name) => (
                    <li
                      key={name}
                      className="group flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-3 transition-all hover:border-yellow-500/40 hover:bg-yellow-500/10"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] border border-white/10 text-yellow-500/70">
                        <Plus className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{name}</span>
                        <p className="text-[10px] text-yellow-500/60 uppercase tracking-tighter font-bold">Pendente de registro</p>
                      </div>
                      <button
                        onClick={() => registerCategory(name)}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider hover:bg-yellow-400 transition-all shadow-[0_5px_15px_-5px_rgba(250,204,21,0.4)] active:scale-95 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Registrar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Confirmação de exclusão */}
        {confirmId && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-rose-400/40 bg-background/95 p-6 shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)] text-center">
              <p className="text-sm text-muted-foreground mb-1">Excluir categoria</p>
              <p className="text-lg font-medium mb-5">"{confirmName}"</p>
              <p className="text-xs text-muted-foreground mb-6">
                A categoria e TODAS as fotos vinculadas a ela serão apagadas permanentemente.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={cancelRemove}
                  className="px-5 py-2 rounded-lg border border-[#d8bf85]/40 text-sm font-medium hover:bg-[#d8bf85]/15 transition-colors"
                >
                  Não
                </button>
                <button
                  onClick={confirmRemove}
                  className="px-5 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-400 shadow-[0_0_20px_-4px_rgba(244,63,94,0.6)] transition-colors"
                >
                  Sim
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
});


const IconPicker = memo(function IconPicker({ value, onChange, label }: { value: IconName; onChange: (v: IconName) => void; label?: string }) {
  return (
    <div className="flex flex-col gap-1 w-full sm:w-40">
      {label && <label className="text-[10px] uppercase tracking-wider text-[#d8bf85]/60 ml-1">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as IconName)}
        className="w-full px-3 py-2 rounded-lg bg-background/70 border border-white/10 text-sm outline-none focus:border-[#d8bf85]/50 focus:bg-background transition-all"
      >
        {iconNames.map((n) => (
          <option key={n} value={n}>
            {iconMap[n].label}
          </option>
        ))}
      </select>
    </div>
  );
});
