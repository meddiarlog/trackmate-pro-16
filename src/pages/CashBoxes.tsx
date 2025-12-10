import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Wallet, TrendingUp, TrendingDown, ArrowUpDown, Settings } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CashBox {
  id: string;
  name: string;
  category_id: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

interface CashCategory {
  id: string;
  name: string;
}

interface Cobranca {
  id: string;
  amount: number | null;
  status: string;
  due_date: string;
  customer?: {
    name: string;
  };
}

interface AccountsReceivable {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  payment_date: string | null;
  customer?: {
    name: string;
  };
}

interface AccountsPayable {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  payment_date: string | null;
  supplier?: {
    name: string;
  };
}

export default function CashBoxes() {
  const queryClient = useQueryClient();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [initialBalanceInput, setInitialBalanceInput] = useState("");

  // Fetch default category
  const { data: defaultCategory } = useQuery({
    queryKey: ["default_cash_category"],
    queryFn: async () => {
      // Check if default category exists
      let { data: category, error } = await supabase
        .from("cash_categories")
        .select("*")
        .eq("name", "Principal")
        .maybeSingle();

      if (!category) {
        // Create default category
        const { data: newCategory, error: insertError } = await supabase
          .from("cash_categories")
          .insert([{ name: "Principal", description: "Categoria principal do caixa" }])
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newCategory as CashCategory;
      }

      return category as CashCategory;
    },
  });

  // Fetch single cash box
  const { data: cashBox, isLoading: loadingCashBox } = useQuery({
    queryKey: ["single_cash_box", defaultCategory?.id],
    queryFn: async () => {
      if (!defaultCategory?.id) return null;

      const { data, error } = await supabase
        .from("cash_boxes")
        .select("*")
        .eq("category_id", defaultCategory.id)
        .maybeSingle();

      if (error) throw error;
      return data as CashBox | null;
    },
    enabled: !!defaultCategory?.id,
  });

  // Fetch paid cobranças (boletos) - includes both "Quitado" and "Recebido" status
  const { data: paidCobrancas = [] } = useQuery({
    queryKey: ["paid_cobrancas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boletos")
        .select(`*, customer:customers(name)`)
        .in("status", ["Quitado", "Recebido"])
        .order("due_date", { ascending: false });

      if (error) throw error;
      return data as Cobranca[];
    },
  });

  // Fetch paid accounts receivable
  const { data: paidReceivables = [] } = useQuery({
    queryKey: ["paid_receivables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .select(`*, customer:customers(name)`)
        .eq("status", "pago")
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data as AccountsReceivable[];
    },
  });

  // Fetch paid accounts payable
  const { data: paidPayables = [] } = useQuery({
    queryKey: ["paid_payables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts_payable")
        .select(`*, supplier:suppliers(name)`)
        .eq("status", "pago")
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data as AccountsPayable[];
    },
  });

  // Calculate totals
  const totalCobrancas = paidCobrancas.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalReceivables = paidReceivables.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalPayables = paidPayables.reduce((sum, p) => sum + Number(p.amount), 0);
  
  const totalEntradas = totalCobrancas + totalReceivables;
  const totalSaidas = totalPayables;
  const initialBalance = cashBox?.initial_balance || 0;
  const saldoAtual = initialBalance + totalEntradas - totalSaidas;

  // Create cash box mutation
  const createCashBoxMutation = useMutation({
    mutationFn: async (initialBalance: number) => {
      if (!defaultCategory?.id) throw new Error("Categoria não encontrada");

      const { error } = await supabase.from("cash_boxes").insert([{
        name: "Caixa Principal",
        category_id: defaultCategory.id,
        initial_balance: initialBalance,
        current_balance: initialBalance,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["single_cash_box"] });
      toast.success("Caixa configurado com sucesso!");
      setConfigDialogOpen(false);
      setInitialBalanceInput("");
    },
    onError: () => toast.error("Erro ao configurar caixa"),
  });

  // Update initial balance mutation
  const updateInitialBalanceMutation = useMutation({
    mutationFn: async (newBalance: number) => {
      if (!cashBox?.id) throw new Error("Caixa não encontrado");

      const { error } = await supabase
        .from("cash_boxes")
        .update({ initial_balance: newBalance })
        .eq("id", cashBox.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["single_cash_box"] });
      toast.success("Saldo inicial atualizado!");
      setConfigDialogOpen(false);
      setInitialBalanceInput("");
    },
    onError: () => toast.error("Erro ao atualizar saldo"),
  });

  const handleConfigSave = () => {
    const balance = parseFloat(initialBalanceInput) || 0;
    if (cashBox) {
      updateInitialBalanceMutation.mutate(balance);
    } else {
      createCashBoxMutation.mutate(balance);
    }
  };

  const openConfigDialog = () => {
    setInitialBalanceInput(cashBox?.initial_balance?.toString() || "0");
    setConfigDialogOpen(true);
  };

  // Combine all movements for display
  const allMovements = [
    ...paidCobrancas.map(c => ({
      type: 'entrada' as const,
      description: `Cobrança quitada - ${c.customer?.name || 'Cliente'}`,
      amount: c.amount || 0,
      date: c.due_date,
      source: 'cobranca',
    })),
    ...paidReceivables.map(r => ({
      type: 'entrada' as const,
      description: `Conta recebida - ${r.customer?.name || 'Cliente'}`,
      amount: Number(r.amount),
      date: r.payment_date || r.due_date,
      source: 'receivable',
    })),
    ...paidPayables.map(p => ({
      type: 'saida' as const,
      description: `Conta paga - ${p.supplier?.name || 'Fornecedor'}`,
      amount: Number(p.amount),
      date: p.payment_date || p.due_date,
      source: 'payable',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loadingCashBox) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Controle de Caixa</h1>
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={openConfigDialog}>
              <Settings className="mr-2 h-4 w-4" />
              {cashBox ? "Configurar Saldo Inicial" : "Configurar Caixa"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{cashBox ? "Alterar Saldo Inicial" : "Configurar Caixa"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Saldo Inicial</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={initialBalanceInput}
                  onChange={(e) => setInitialBalanceInput(e.target.value)}
                  placeholder="0,00"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  O saldo atual será calculado automaticamente baseado nas movimentações.
                </p>
              </div>
              <Button onClick={handleConfigSave} className="w-full">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Inicial</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {initialBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">
              Cobranças + Contas a Receber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalSaidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">
              Contas a Pagar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {saldoAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {allMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma movimentação registrada.</p>
              <p className="text-sm">As cobranças quitadas e contas pagas aparecerão aqui.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMovements.map((movement, index) => (
                  <TableRow key={`${movement.source}-${index}`}>
                    <TableCell>
                      {format(new Date(movement.date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{movement.description}</TableCell>
                    <TableCell>
                      {movement.type === 'entrada' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" /> Entrada
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <TrendingDown className="h-4 w-4" /> Saída
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${movement.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.type === 'entrada' ? '+' : '-'} {movement.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
