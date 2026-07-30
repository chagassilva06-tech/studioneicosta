import { useEffect, useState } from "react";
import { X, Plus, Pencil, Trash2, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { iconNames, getIcon, type IconName } from "@/lib/category-icons";

export type Category = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
};

export function CategoryManager({ open, onClose, onChanged }: Props) {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftIcon, setDraftIcon] = useState<IconName>("Palette");
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState<IconName>("Palette");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("id, name, icon, sort_order")
      .order("sort_order", { ascending: true });
    setItems((data as Category[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !confirmId && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, confirmId]);

  if (!open) return null;

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setDraftName(c.name);
    setDraftIcon((c.icon as IconName) || "Palette");
  };

  const saveEdit = async () => {
    if (!editingId || !draftName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("categories")
      .update({ name: draftName.trim(), icon: draftIcon })
      .eq("id", editingId);
    setSaving(false);
    if (error) {
      alert("Falha ao salvar: " + error.message);
      return;
    }
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
    const { error } = await supabase.from("categories").delete().eq("id", confirmId);
    setConfirmId(null);
    setConfirmName("");
    if (error) {
      alert("Falha ao excluir: " + error.message);
      return;
    }
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
      sort_order: nextOrder,
    });
    setSaving(false);
    if (error) {
      alert("Falha ao criar: " + error.message);
      return;
    }
    setNewName("");
    setNewIcon("Palette");
    await load();
    onChanged();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-sky-400/40 bg-background/95 shadow-[0_0_60px_-10px_rgba(56,155,255,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-sky-400/20 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="min-w-0 truncate font-display text-xl sm:text-2xl">
            Gerenciar <span className="italic text-[#d8bf85]">Categorias</span>
          </h2>
          <button
            onClick={onClose}
            className="h-9 w-9 shrink-0 rounded-full inline-flex items-center justify-center text-sky-200 hover:bg-sky-400/15 border border-sky-400/40"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Create — fixo, sem rolagem */}
        <div className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-5">
          <div className="rounded-xl border border-sky-400/30 bg-sky-400/[0.04] p-3 sm:p-4">
            <p className="label-luxe mb-3">Nova categoria</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome da categoria"
                className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-background/70 border border-sky-400/40 text-sm outline-none focus:border-sky-300"
              />
              <IconPicker value={newIcon} onChange={setNewIcon} />
              <button
                onClick={create}
                disabled={saving || !newName.trim()}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-sky-400 text-slate-950 font-medium text-sm hover:bg-sky-300 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Criar
              </button>
            </div>
          </div>
        </div>

        {/* List — única área com rolagem */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="label-luxe mb-3">Existentes</p>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sky-300/70">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((c) => {
                  const Icon = getIcon(c.icon);
                  const editing = editingId === c.id;
                  return (
                    <li
                      key={c.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-2"
                    >
                      {editing ? (
                        <>
                          <input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className="min-w-0 flex-1 px-2 py-1.5 rounded bg-background/70 border border-sky-400/40 text-sm outline-none focus:border-sky-300"
                          />
                          <IconPicker value={draftIcon} onChange={setDraftIcon} />
                          <div className="flex gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-sky-400 text-slate-950 text-xs font-medium hover:bg-sky-300 disabled:opacity-60"
                            >
                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded border border-border/60 text-xs hover:bg-muted/40"
                            >
                              Cancelar
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Icon className="h-4 w-4 text-sky-300" />
                          <span className="flex-1 text-sm font-medium">{c.name}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(c)}
                              className="h-8 w-8 rounded-full inline-flex items-center justify-center text-sky-200 hover:bg-sky-400/15 border border-sky-400/30"
                              aria-label="Editar"
                              title="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => askRemove(c.id, c.name)}
                              className="h-8 w-8 rounded-full inline-flex items-center justify-center text-rose-300 hover:bg-rose-400/15 border border-rose-400/30"
                              aria-label="Excluir"
                              title="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
                {items.length === 0 && (
                  <li className="text-sm text-muted-foreground py-4 text-center">
                    Nenhuma categoria cadastrada.
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Confirmação de exclusão */}
        {confirmId && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-rose-400/40 bg-background/95 p-6 shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)] text-center">
              <p className="text-sm text-muted-foreground mb-1">Excluir categoria?</p>
              <p className="text-lg font-medium mb-5">"{confirmName}"</p>
              <p className="text-xs text-muted-foreground mb-6">
                As obras existentes desta categoria permanecerão no banco.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={cancelRemove}
                  className="px-5 py-2 rounded-lg border border-sky-400/40 text-sm font-medium hover:bg-sky-400/15 transition-colors"
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
}

function IconPicker({ value, onChange }: { value: IconName; onChange: (v: IconName) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as IconName)}
      className="px-3 py-2 rounded-lg bg-background/70 border border-sky-400/40 text-sm outline-none focus:border-sky-300"
    >
      {iconNames.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}
