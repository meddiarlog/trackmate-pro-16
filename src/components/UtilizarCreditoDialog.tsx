import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, CreditCard, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type CreditRecord = {
  id: string;
  numero_nfe: string;
  cnpj_emitente: string;
  razao_social: string;
  credito: number;
  chave_acesso: string;
  formattedCredito?: string;
  sequentialId?: number;
};

interface UtilizarCreditoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRecords: CreditRecord[];
  onCreditSaved?: () => void;
}

export const UtilizarCreditoDialog = ({
  open,
  onOpenChange,
  selectedRecords,
  onCreditSaved,
}: UtilizarCreditoDialogProps) => {
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [creditName, setCreditName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCopyKey = async (id: string, chaveAcesso: string) => {
    try {
      await navigator.clipboard.writeText(chaveAcesso);
      setCopiedKeys((prev) => new Set(prev).add(id));
      toast({
        title: "Copiado!",
        description: "Chave de acesso copiada para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar chave",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCopiedKeys(new Set());
      setShowNameDialog(false);
      setCreditName("");
    }
    onOpenChange(newOpen);
  };

  const totalCredito = selectedRecords.reduce(
    (sum, record) => sum + record.credito,
    0
  );

  const handleSaveCredit = async () => {
    const trimmedName = creditName.trim();
    if (!trimmedName) {
      toast({
        title: "Erro",
        description: "Informe um nome para o crédito",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Check for duplicate name
      const { data: existing } = await supabase
        .from("saved_credits")
        .select("id")
        .eq("name", trimmedName)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Nome duplicado",
          description: "Já existe um crédito salvo com esse nome. Escolha outro.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // Insert saved_credit header
      const { data: savedCredit, error: headerError } = await supabase
        .from("saved_credits")
        .insert({
          name: trimmedName,
          total_credit: Math.round(totalCredito * 100) / 100,
        })
        .select("id")
        .single();

      if (headerError) throw headerError;

      // Insert items
      const items = selectedRecords.map((record) => ({
        saved_credit_id: savedCredit.id,
        credit_control_id: record.id,
        numero_nfe: record.numero_nfe,
        cnpj_emitente: record.cnpj_emitente,
        razao_social: record.razao_social,
        credito: record.credito,
        chave_acesso: record.chave_acesso,
      }));

      const { error: itemsError } = await supabase
        .from("saved_credit_items")
        .insert(items);

      if (itemsError) throw itemsError;

      toast({
        title: "Crédito salvo!",
        description: `"${trimmedName}" salvo com ${selectedRecords.length} notas.`,
      });

      setShowNameDialog(false);
      setCreditName("");
      handleOpenChange(false);
      onCreditSaved?.();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Utilizar Crédito
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">
              Créditos Selecionados: <strong>{selectedRecords.length}</strong>
            </span>
            <span className="text-sm font-semibold">
              Total: R${" "}
              {totalCredito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-3">
              {selectedRecords.map((record) => {
                const isCopied = copiedKeys.has(record.id);
                return (
                  <Card
                    key={record.id}
                    className={`transition-colors ${
                      isCopied ? "bg-green-50 border-green-200" : ""
                    }`}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {record.sequentialId && (
                              <span className="text-muted-foreground mr-2">ID: {record.sequentialId} |</span>
                            )}
                            NF-e: {record.numero_nfe}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.razao_social}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            CNPJ: {record.cnpj_emitente}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            R${" "}
                            {record.credito.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">crédito</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">
                            Chave de Acesso:
                          </p>
                          <p
                            className={`font-mono text-xs truncate transition-colors ${
                              isCopied ? "text-green-600" : ""
                            }`}
                            title={record.chave_acesso}
                          >
                            {record.chave_acesso}
                          </p>
                        </div>
                        <Button
                          variant={isCopied ? "outline" : "secondary"}
                          size="sm"
                          className={`shrink-0 transition-all ${
                            isCopied
                              ? "bg-green-100 border-green-300 text-green-700 hover:bg-green-200"
                              : ""
                          }`}
                          onClick={() =>
                            handleCopyKey(record.id, record.chave_acesso)
                          }
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copiar Chave
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button
              variant="default"
              onClick={() => setShowNameDialog(true)}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Crédito Utilizado
            </Button>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mini dialog for credit name */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar Crédito Utilizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="credit-name">Nome / Identificação</Label>
              <Input
                id="credit-name"
                value={creditName}
                onChange={(e) => setCreditName(e.target.value)}
                placeholder="Ex: Crédito Janeiro 2025"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveCredit();
                  }
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedRecords.length} nota(s) — Total: R${" "}
              {totalCredito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCredit} disabled={saving}>
              {saving ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
