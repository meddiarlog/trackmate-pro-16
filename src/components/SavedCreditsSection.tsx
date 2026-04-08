import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Eye, Pencil, Trash2, Bookmark, Copy, Check, Plus, X } from "lucide-react";

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
};

type CreditControlRecord = {
  id: string;
  numero_nfe: string;
  cnpj_emitente: string;
  razao_social: string;
  credito: number;
  chave_acesso: string;
};

interface SavedCreditsSectionProps {
  refreshKey: number;
  onChanged?: () => void;
}

export const SavedCreditsSection = ({ refreshKey, onChanged }: SavedCreditsSectionProps) => {
  const [credits, setCredits] = useState<SavedCredit[]>([]);
  const [loading, setLoading] = useState(true);

  // Manage dialog (view + add/remove)
  const [manageCredit, setManageCredit] = useState<SavedCredit | null>(null);
  const [manageItems, setManageItems] = useState<SavedCreditItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());

  // Add notes sub-dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [availableRecords, setAvailableRecords] = useState<CreditControlRecord[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [addSearch, setAddSearch] = useState("");

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

  const handleManage = async (credit: SavedCredit) => {
    setManageCredit(credit);
    setLoadingItems(true);
    setCopiedKeys(new Set());
    const { data } = await supabase
      .from("saved_credit_items")
      .select("*")
      .eq("saved_credit_id", credit.id);
    setManageItems(data || []);
    setLoadingItems(false);
  };

  const handleRemoveItem = async (item: SavedCreditItem) => {
    if (!manageCredit) return;
    const { error } = await supabase
      .from("saved_credit_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    const newItems = manageItems.filter((i) => i.id !== item.id);
    setManageItems(newItems);

    // Update total
    const newTotal = newItems.reduce((sum, i) => sum + (i.credito ?? 0), 0);
    await supabase
      .from("saved_credits")
      .update({ total_credit: Math.round(newTotal * 100) / 100 })
      .eq("id", manageCredit.id);

    setManageCredit({ ...manageCredit, total_credit: newTotal });
    fetchCredits();
    onChanged?.();
    toast({ title: "Removido", description: "Nota removida do crédito." });
  };

  const handleOpenAddDialog = async () => {
    if (!manageCredit) return;
    setShowAddDialog(true);
    setLoadingAvailable(true);
    setSelectedToAdd(new Set());
    setAddSearch("");

    // Get IDs already in this saved credit
    const existingIds = new Set(manageItems.map((i) => i.credit_control_id).filter(Boolean));

    const { data } = await supabase
      .from("credit_control")
      .select("id, numero_nfe, cnpj_emitente, razao_social, credito, chave_acesso")
      .order("data_emissao", { ascending: false });

    const available = (data || []).filter((r) => !existingIds.has(r.id));
    setAvailableRecords(available);
    setLoadingAvailable(false);
  };

  const handleAddSelected = async () => {
    if (!manageCredit || selectedToAdd.size === 0) return;

    const recordsToAdd = availableRecords.filter((r) => selectedToAdd.has(r.id));
    const items = recordsToAdd.map((r) => ({
      saved_credit_id: manageCredit.id,
      credit_control_id: r.id,
      numero_nfe: r.numero_nfe,
      cnpj_emitente: r.cnpj_emitente,
      razao_social: r.razao_social,
      credito: r.credito,
      chave_acesso: r.chave_acesso,
    }));

    const { data: inserted, error } = await supabase
      .from("saved_credit_items")
      .insert(items)
      .select("*");

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    const newItems = [...manageItems, ...(inserted || [])];
    setManageItems(newItems);

    const newTotal = newItems.reduce((sum, i) => sum + (i.credito ?? 0), 0);
    await supabase
      .from("saved_credits")
      .update({ total_credit: Math.round(newTotal * 100) / 100 })
      .eq("id", manageCredit.id);

    setManageCredit({ ...manageCredit, total_credit: newTotal });
    setShowAddDialog(false);
    fetchCredits();
    onChanged?.();
    toast({ title: "Adicionado!", description: `${recordsToAdd.length} nota(s) adicionada(s).` });
  };

  const filteredAvailable = availableRecords.filter((r) => {
    if (!addSearch) return true;
    const s = addSearch.toLowerCase();
    return (
      r.numero_nfe.toLowerCase().includes(s) ||
      r.razao_social.toLowerCase().includes(s) ||
      r.cnpj_emitente.toLowerCase().includes(s) ||
      r.chave_acesso.toLowerCase().includes(s)
    );
  });

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
      onChanged?.();
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
      onChanged?.();
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
              <Card
                key={credit.id}
                className="border cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleManage(credit)}
              >
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
                  <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => handleManage(credit)} title="Visualizar">
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

      {/* Manage dialog (view + add/remove) */}
      <Dialog open={!!manageCredit} onOpenChange={(o) => { if (!o) { setManageCredit(null); setCopiedKeys(new Set()); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{manageCredit?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">
              Notas: <strong>{manageItems.length}</strong>
            </span>
            <span className="text-sm font-semibold">
              Total: R$ {manageCredit?.total_credit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <ScrollArea className="max-h-[50vh] pr-4">
            {loadingItems ? (
              <p className="text-center text-muted-foreground py-4">Carregando...</p>
            ) : manageItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma nota vinculada.</p>
            ) : (
              <div className="space-y-3">
                {manageItems.map((item) => {
                  const isCopied = copiedKeys.has(item.id);
                  return (
                    <Card key={item.id} className={`transition-colors ${isCopied ? "bg-accent/50" : ""}`}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="font-medium">NF-e: {item.numero_nfe}</p>
                            <p className="text-sm text-muted-foreground">{item.razao_social}</p>
                            <p className="text-xs text-muted-foreground">CNPJ: {item.cnpj_emitente}</p>
                          </div>
                          <div className="flex items-start gap-2 ml-2">
                            <p className="text-lg font-bold text-primary whitespace-nowrap">
                              R$ {(item.credito ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveItem(item)}
                              title="Remover nota"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {item.chave_acesso && (
                          <div className="flex items-center justify-between gap-2 pt-2 border-t">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-1">Chave de Acesso:</p>
                              <p className={`font-mono text-xs truncate ${isCopied ? "text-primary" : ""}`} title={item.chave_acesso}>
                                {item.chave_acesso}
                              </p>
                            </div>
                            <Button
                              variant={isCopied ? "outline" : "secondary"}
                              size="sm"
                              className="shrink-0"
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
          <DialogFooter className="gap-2">
            <Button variant="default" onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Notas
            </Button>
            <Button variant="outline" onClick={() => setManageCredit(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add notes dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Adicionar Notas ao Crédito</DialogTitle>
          </DialogHeader>
          <div>
            <Input
              placeholder="Buscar por NF-e, razão social, CNPJ..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredAvailable.length} nota(s) disponível(is)</span>
            <span>{selectedToAdd.size} selecionada(s)</span>
          </div>
          <ScrollArea className="max-h-[45vh] pr-4">
            {loadingAvailable ? (
              <p className="text-center text-muted-foreground py-4">Carregando...</p>
            ) : filteredAvailable.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma nota disponível para adicionar.</p>
            ) : (
              <div className="space-y-2">
                {filteredAvailable.map((record) => (
                  <Card
                    key={record.id}
                    className={`cursor-pointer transition-colors ${selectedToAdd.has(record.id) ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}
                    onClick={() => {
                      setSelectedToAdd((prev) => {
                        const next = new Set(prev);
                        if (next.has(record.id)) next.delete(record.id);
                        else next.add(record.id);
                        return next;
                      });
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Checkbox
                        checked={selectedToAdd.has(record.id)}
                        onCheckedChange={() => {}}
                        className="pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">NF-e: {record.numero_nfe}</p>
                        <p className="text-xs text-muted-foreground truncate">{record.razao_social} — {record.cnpj_emitente}</p>
                      </div>
                      <p className="text-sm font-bold text-primary whitespace-nowrap">
                        R$ {record.credito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddSelected} disabled={selectedToAdd.size === 0}>
              Adicionar {selectedToAdd.size > 0 ? `(${selectedToAdd.size})` : ""}
            </Button>
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
