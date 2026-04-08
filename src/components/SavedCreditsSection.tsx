import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Eye, Pencil, Trash2, Bookmark, Copy, Check } from "lucide-react";

type SavedCreditItem = {
  id: string;
  credit_control_id: string | null;
  numero_nfe: string | null;
  cnpj_emitente: string | null;
  razao_social: string | null;
  credito: number | null;
  chave_acesso: string | null;
};

type SavedCredit = {
  id: string;
  name: string;
  total_credit: number;
  created_at: string;
  updated_at: string;
  items?: SavedCreditItem[];
};

interface SavedCreditsSectionProps {
  refreshKey: number;
}

export const SavedCreditsSection = ({ refreshKey }: SavedCreditsSectionProps) => {
  const [credits, setCredits] = useState<SavedCredit[]>([]);
  const [loading, setLoading] = useState(true);

  // View dialog
  const [viewCredit, setViewCredit] = useState<SavedCredit | null>(null);
  const [viewItems, setViewItems] = useState<SavedCreditItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());

  // Edit dialog
  const [editCredit, setEditCredit] = useState<SavedCredit | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete dialog
  const [deleteCredit, setDeleteCredit] = useState<SavedCredit | null>(null);

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_credits")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCredits(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits, refreshKey]);

  const handleView = async (credit: SavedCredit) => {
    setViewCredit(credit);
    setLoadingItems(true);
    setCopiedKeys(new Set());
    const { data } = await supabase
      .from("saved_credit_items")
      .select("*")
      .eq("saved_credit_id", credit.id);
    setViewItems(data || []);
    setLoadingItems(false);
  };

  const handleCopyKey = async (id: string, chave: string) => {
    try {
      await navigator.clipboard.writeText(chave);
      setCopiedKeys((prev) => new Set(prev).add(id));
      toast({ title: "Copiado!", description: "Chave copiada." });
    } catch {
      toast({ title: "Erro", description: "Erro ao copiar.", variant: "destructive" });
    }
  };

  const handleEdit = (credit: SavedCredit) => {
    setEditCredit(credit);
    setEditName(credit.name);
  };

  const handleSaveEdit = async () => {
    if (!editCredit) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      toast({ title: "Erro", description: "Informe um nome.", variant: "destructive" });
      return;
    }

    setSavingEdit(true);
    // Check duplicate
    const { data: existing } = await supabase
      .from("saved_credits")
      .select("id")
      .eq("name", trimmed)
      .neq("id", editCredit.id)
      .maybeSingle();

    if (existing) {
      toast({ title: "Nome duplicado", description: "Já existe outro crédito com esse nome.", variant: "destructive" });
      setSavingEdit(false);
      return;
    }

    const { error } = await supabase
      .from("saved_credits")
      .update({ name: trimmed })
      .eq("id", editCredit.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Atualizado!", description: "Nome alterado com sucesso." });
      setEditCredit(null);
      fetchCredits();
    }
    setSavingEdit(false);
  };

  const handleDelete = async () => {
    if (!deleteCredit) return;
    const { error } = await supabase
      .from("saved_credits")
      .delete()
      .eq("id", deleteCredit.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Excluído!", description: `"${deleteCredit.name}" removido.` });
      fetchCredits();
    }
    setDeleteCredit(null);
  };

  if (loading) return null;
  if (credits.length === 0) return null;

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Créditos Salvos ({credits.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {credits.map((credit) => (
              <Card key={credit.id} className="border">
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate" title={credit.name}>
                        {credit.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(credit.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary whitespace-nowrap ml-2">
                      R$ {credit.total_credit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleView(credit)} title="Visualizar">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(credit)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteCredit(credit)} title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View dialog */}
      <Dialog open={!!viewCredit} onOpenChange={(o) => { if (!o) { setViewCredit(null); setCopiedKeys(new Set()); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{viewCredit?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">
              Notas: <strong>{viewItems.length}</strong>
            </span>
            <span className="text-sm font-semibold">
              Total: R$ {viewCredit?.total_credit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <ScrollArea className="max-h-[50vh] pr-4">
            {loadingItems ? (
              <p className="text-center text-muted-foreground py-4">Carregando...</p>
            ) : (
              <div className="space-y-3">
                {viewItems.map((item) => {
                  const isCopied = copiedKeys.has(item.id);
                  return (
                    <Card key={item.id} className={`transition-colors ${isCopied ? "bg-green-50 border-green-200" : ""}`}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium">NF-e: {item.numero_nfe}</p>
                            <p className="text-sm text-muted-foreground">{item.razao_social}</p>
                            <p className="text-xs text-muted-foreground">CNPJ: {item.cnpj_emitente}</p>
                          </div>
                          <p className="text-lg font-bold text-primary">
                            R$ {(item.credito ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        {item.chave_acesso && (
                          <div className="flex items-center justify-between gap-2 pt-2 border-t">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-1">Chave de Acesso:</p>
                              <p className={`font-mono text-xs truncate ${isCopied ? "text-green-600" : ""}`} title={item.chave_acesso}>
                                {item.chave_acesso}
                              </p>
                            </div>
                            <Button
                              variant={isCopied ? "outline" : "secondary"}
                              size="sm"
                              className={`shrink-0 ${isCopied ? "bg-green-100 border-green-300 text-green-700" : ""}`}
                              onClick={() => handleCopyKey(item.id, item.chave_acesso!)}
                            >
                              {isCopied ? <><Check className="h-4 w-4 mr-1" />Copiado</> : <><Copy className="h-4 w-4 mr-1" />Copiar</>}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCredit(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editCredit} onOpenChange={(o) => { if (!o) setEditCredit(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Crédito Salvo</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="edit-credit-name">Nome</Label>
            <Input
              id="edit-credit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveEdit(); } }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCredit(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteCredit} onOpenChange={(o) => { if (!o) setDeleteCredit(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Crédito Salvo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteCredit?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
