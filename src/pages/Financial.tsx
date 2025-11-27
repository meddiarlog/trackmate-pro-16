import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TrendingDown, Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PaymentMethod = "pix" | "boleto" | "transferencia";
type PaymentStatus = "pendente" | "pago" | "vencido";
type CashMovementType = "sangria" | "suprimento";

interface Payment {
  id: string;
  customer_id: string;
  amount: number;
  due_date: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  paid_date: string | null;
  created_at: string;
}

interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  date: string;
  reason: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

const Financial = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [activeTab, setActiveTab] = useState<"payments" | "cash">("payments");
  
  // Payment form state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    customer_id: "",
    amount: "",
    due_date: "",
    payment_method: "pix" as PaymentMethod,
  });

  // Cash movement form state
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [cashForm, setCashForm] = useState({
    type: "suprimento" as CashMovementType,
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    reason: "",
  });

  // Fetch data
  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Customer[];
    },
  });

  const { data: cashMovements = [] } = useQuery({
    queryKey: ["cash_movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_movements")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as CashMovement[];
    },
  });

  // Mutations
  const savePaymentMutation = useMutation({
    mutationFn: async (payment: any) => {
      if (editingPayment) {
        const { error } = await supabase
          .from("payments")
          .update(payment)
          .eq("id", editingPayment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payments").insert([payment]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success(editingPayment ? "Pagamento atualizado!" : "Pagamento lançado!");
      setPaymentDialogOpen(false);
      resetPaymentForm();
    },
    onError: () => toast.error("Erro ao salvar pagamento"),
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status, paid_date }: { id: string; status: PaymentStatus; paid_date: string | null }) => {
      const { error } = await supabase
        .from("payments")
        .update({ status, paid_date })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const saveCashMovementMutation = useMutation({
    mutationFn: async (movement: any) => {
      const { error } = await supabase.from("cash_movements").insert([movement]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_movements"] });
      toast.success("Movimentação registrada!");
      setCashDialogOpen(false);
      resetCashForm();
    },
    onError: () => toast.error("Erro ao registrar movimentação"),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Pagamento excluído!");
    },
    onError: () => toast.error("Erro ao excluir pagamento"),
  });

  // Handlers
  const resetPaymentForm = () => {
    setPaymentForm({
      customer_id: "",
      amount: "",
      due_date: "",
      payment_method: "pix",
    });
    setEditingPayment(null);
  };

  const resetCashForm = () => {
    setCashForm({
      type: "suprimento",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      reason: "",
    });
  };

  const handleSavePayment = () => {
    if (!paymentForm.customer_id || !paymentForm.amount || !paymentForm.due_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    savePaymentMutation.mutate({
      ...paymentForm,
      amount: parseFloat(paymentForm.amount),
      status: editingPayment?.status || "pendente",
    });
  };

  const handleSaveCashMovement = () => {
    if (!cashForm.amount || !cashForm.reason) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    saveCashMovementMutation.mutate({
      ...cashForm,
      amount: parseFloat(cashForm.amount),
    });
  };

  const togglePaymentStatus = (payment: Payment) => {
    const newStatus: PaymentStatus = payment.status === "pago" ? "pendente" : "pago";
    const paid_date = newStatus === "pago" ? format(new Date(), "yyyy-MM-dd") : null;
    updatePaymentStatusMutation.mutate({ id: payment.id, status: newStatus, paid_date });
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setPaymentForm({
      customer_id: payment.customer_id,
      amount: payment.amount.toString(),
      due_date: payment.due_date,
      payment_method: payment.payment_method,
    });
    setPaymentDialogOpen(true);
  };

  // Calculations
  const totalReceivable = payments
    .filter((p) => p.status === "pendente")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalReceived = payments
    .filter((p) => p.status === "pago")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalCashIn = cashMovements
    .filter((m) => m.type === "suprimento")
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const totalCashOut = cashMovements
    .filter((m) => m.type === "sangria")
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const cashBalance = totalCashIn - totalCashOut;

  // Get customer name
  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || "Cliente não encontrado";
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, "default" | "secondary" | "destructive"> = {
      pendente: "secondary",
      pago: "default",
      vencido: "destructive",
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getMethodLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      pix: "PIX",
      boleto: "Boleto",
      transferencia: "Transferência",
    };
    return labels[method];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Módulo Financeiro</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalReceivable.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalReceived.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cashBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalReceivable + totalReceived + cashBalance).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "payments" ? "default" : "ghost"}
          onClick={() => setActiveTab("payments")}
        >
          Pagamentos
        </Button>
        <Button
          variant={activeTab === "cash" ? "default" : "ghost"}
          onClick={() => setActiveTab("cash")}
        >
          Movimentações de Caixa
        </Button>
      </div>

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pagamentos</CardTitle>
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetPaymentForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Pagamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingPayment ? "Editar Pagamento" : "Novo Pagamento"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Cliente *</Label>
                      <Select
                        value={paymentForm.customer_id}
                        onValueChange={(value) => setPaymentForm({ ...paymentForm, customer_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valor *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Data de Vencimento *</Label>
                      <Input
                        type="date"
                        value={paymentForm.due_date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Forma de Pagamento *</Label>
                      <Select
                        value={paymentForm.payment_method}
                        onValueChange={(value: PaymentMethod) =>
                          setPaymentForm({ ...paymentForm, payment_method: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSavePayment} className="w-full">
                      {editingPayment ? "Atualizar" : "Salvar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar pagamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = format(new Date(2024, i), "MMMM", { locale: ptBR });
                      return (
                        <SelectItem key={i} value={String(i + 1)}>
                          {month}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{getCustomerName(payment.customer_id)}</TableCell>
                      <TableCell>
                        {Number(payment.amount).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>{format(new Date(payment.due_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{getMethodLabel(payment.payment_method)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => togglePaymentStatus(payment)}>
                            {payment.status === "pago" ? "Desquitar" : "Quitar"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditPayment(payment)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePaymentMutation.mutate(payment.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Movements Tab */}
      {activeTab === "cash" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Movimentações de Caixa</CardTitle>
              <Dialog open={cashDialogOpen} onOpenChange={setCashDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetCashForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Movimentação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nova Movimentação de Caixa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Tipo *</Label>
                      <Select
                        value={cashForm.type}
                        onValueChange={(value: CashMovementType) => setCashForm({ ...cashForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="suprimento">Suprimento (Entrada)</SelectItem>
                          <SelectItem value="sangria">Sangria (Saída)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valor *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={cashForm.amount}
                        onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Data *</Label>
                      <Input
                        type="date"
                        value={cashForm.date}
                        onChange={(e) => setCashForm({ ...cashForm, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Motivo *</Label>
                      <Input
                        value={cashForm.reason}
                        onChange={(e) => setCashForm({ ...cashForm, reason: e.target.value })}
                        placeholder="Descreva o motivo da movimentação"
                      />
                    </div>
                    <Button onClick={handleSaveCashMovement} className="w-full">
                      Registrar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <Badge variant={movement.type === "suprimento" ? "default" : "destructive"}>
                        {movement.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {Number(movement.amount).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell>{format(new Date(movement.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{movement.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Financial;
