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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Check, Pencil, Trash2, UserPlus } from "lucide-react";
import { format, addMonths } from "date-fns";

interface AccountPayable {
  id: string;
  cash_box_id: string;
  supplier_id: string;
  document_number: string | null;
  installments: number;
  installment_number: number;
  due_date: string;
  payment_date: string | null;
  amount: number;
  discount: number;
  penalty_interest: number;
  total: number;
  payment_method: string;
  is_fixed_expense: boolean;
  observations: string | null;
  status: string;
  created_at: string;
}

interface CashBox {
  id: string;
  name: string;
  category_id: string;
}

interface Supplier {
  id: string;
  name: string;
  cnpj: string | null;
}

export default function AccountsPayable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountPayable | null>(null);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierCnpj, setNewSupplierCnpj] = useState("");
  
  const [form, setForm] = useState({
    cash_box_id: "",
    supplier_id: "",
    document_number: "",
    installments: "1",
    due_date: "",
    amount: "",
    discount: "0",
    penalty_interest: "0",
    payment_method: "boleto",
    is_fixed_expense: false,
    observations: "",
  });

  // Fetch data
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts_payable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts_payable")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as AccountPayable[];
    },
  });

  const { data: cashBoxes = [] } = useQuery({
    queryKey: ["cash_boxes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_boxes")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as CashBox[];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, cnpj")
        .order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });

  // Mutations
  const saveAccountMutation = useMutation({
    mutationFn: async (accountData: any) => {
      if (editingAccount) {
        const { error } = await supabase
          .from("accounts_payable")
          .update(accountData)
          .eq("id", editingAccount.id);
        if (error) throw error;
      } else {
        // Create installments
        const installments = parseInt(form.installments);
        const baseAmount = parseFloat(form.amount);
        const discount = parseFloat(form.discount) || 0;
        const penaltyInterest = parseFloat(form.penalty_interest) || 0;
        const installmentAmount = baseAmount / installments;
        const total = installmentAmount - discount + penaltyInterest;

        const accountsToInsert = [];
        const baseDate = new Date(form.due_date);

        for (let i = 0; i < installments; i++) {
          const dueDate = addMonths(baseDate, i);
          accountsToInsert.push({
            cash_box_id: form.cash_box_id,
            supplier_id: form.supplier_id,
            document_number: form.document_number || null,
            installments: installments,
            installment_number: i + 1,
            due_date: format(dueDate, "yyyy-MM-dd"),
            amount: installmentAmount,
            discount: discount,
            penalty_interest: penaltyInterest,
            total: total,
            payment_method: form.payment_method,
            is_fixed_expense: form.is_fixed_expense,
            observations: form.observations || null,
            status: "pendente",
          });
        }

        // If fixed expense, create for remaining months of the year
        if (form.is_fixed_expense) {
          const currentMonth = baseDate.getMonth();
          const remainingMonths = 11 - currentMonth;
          
          for (let i = installments; i <= remainingMonths + installments; i++) {
            const dueDate = addMonths(baseDate, i);
            if (dueDate.getFullYear() === baseDate.getFullYear()) {
              accountsToInsert.push({
                cash_box_id: form.cash_box_id,
                supplier_id: form.supplier_id,
                document_number: form.document_number || null,
                installments: 1,
                installment_number: 1,
                due_date: format(dueDate, "yyyy-MM-dd"),
                amount: baseAmount,
                discount: discount,
                penalty_interest: penaltyInterest,
                total: baseAmount - discount + penaltyInterest,
                payment_method: form.payment_method,
                is_fixed_expense: true,
                observations: form.observations || null,
                status: "pendente",
              });
            }
          }
        }

        const { error } = await supabase.from("accounts_payable").insert(accountsToInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts_payable"] });
      toast.success(editingAccount ? "Conta atualizada!" : "Conta(s) a pagar criada(s)!");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar conta a pagar"),
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounts_payable")
        .update({ 
          status: "pago", 
          payment_date: format(new Date(), "yyyy-MM-dd") 
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts_payable"] });
      toast.success("Conta marcada como paga!");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts_payable").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts_payable"] });
      toast.success("Conta excluída!");
    },
    onError: () => toast.error("Erro ao excluir conta"),
  });

  const createSupplierMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .insert([{ name: newSupplierName, cnpj: newSupplierCnpj || null }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setForm({ ...form, supplier_id: data.id });
      setSupplierDialogOpen(false);
      setNewSupplierName("");
      setNewSupplierCnpj("");
      toast.success("Fornecedor cadastrado!");
    },
    onError: () => toast.error("Erro ao cadastrar fornecedor"),
  });

  const resetForm = () => {
    setForm({
      cash_box_id: "",
      supplier_id: "",
      document_number: "",
      installments: "1",
      due_date: "",
      amount: "",
      discount: "0",
      penalty_interest: "0",
      payment_method: "boleto",
      is_fixed_expense: false,
      observations: "",
    });
    setEditingAccount(null);
  };

  const handleSave = () => {
    if (!form.cash_box_id || !form.supplier_id || !form.due_date || !form.amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    saveAccountMutation.mutate({});
  };

  const handleEdit = (account: AccountPayable) => {
    setEditingAccount(account);
    setForm({
      cash_box_id: account.cash_box_id,
      supplier_id: account.supplier_id,
      document_number: account.document_number || "",
      installments: account.installments.toString(),
      due_date: account.due_date,
      amount: account.amount.toString(),
      discount: account.discount.toString(),
      penalty_interest: account.penalty_interest.toString(),
      payment_method: account.payment_method,
      is_fixed_expense: account.is_fixed_expense,
      observations: account.observations || "",
    });
    setDialogOpen(true);
  };

  // Calculate total
  const calculateTotal = () => {
    const amount = parseFloat(form.amount) || 0;
    const discount = parseFloat(form.discount) || 0;
    const penaltyInterest = parseFloat(form.penalty_interest) || 0;
    return amount - discount + penaltyInterest;
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier?.name || "Fornecedor não encontrado";
  };

  const getCashBoxName = (cashBoxId: string) => {
    const cashBox = cashBoxes.find((c) => c.id === cashBoxId);
    return cashBox?.name || "Caixa não encontrado";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pendente: "secondary",
      pago: "default",
      vencido: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.toUpperCase()}</Badge>;
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = getSupplierName(account.supplier_id)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || account.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalPending = accounts
    .filter((a) => a.status === "pendente")
    .reduce((sum, a) => sum + Number(a.total), 0);

  const totalPaid = accounts
    .filter((a) => a.status === "pago")
    .reduce((sum, a) => sum + Number(a.total), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Contas a Pagar</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalPending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalPaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalPending + totalPaid).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lançamentos</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} disabled={cashBoxes.length === 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Conta a Pagar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingAccount ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Categoria de Caixa *</Label>
                    <Select
                      value={form.cash_box_id}
                      onValueChange={(value) => setForm({ ...form, cash_box_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o caixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {cashBoxes.map((cashBox) => (
                          <SelectItem key={cashBox.id} value={cashBox.id}>
                            {cashBox.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label>Fornecedor *</Label>
                        <Select
                          value={form.supplier_id}
                          onValueChange={(value) => setForm({ ...form, supplier_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o fornecedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="mt-6">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cadastrar Fornecedor</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Nome *</Label>
                              <Input
                                value={newSupplierName}
                                onChange={(e) => setNewSupplierName(e.target.value)}
                                placeholder="Nome do fornecedor"
                              />
                            </div>
                            <div>
                              <Label>CNPJ</Label>
                              <Input
                                value={newSupplierCnpj}
                                onChange={(e) => setNewSupplierCnpj(e.target.value)}
                                placeholder="00.000.000/0000-00"
                              />
                            </div>
                            <Button
                              onClick={() => createSupplierMutation.mutate()}
                              className="w-full"
                              disabled={!newSupplierName}
                            >
                              Cadastrar
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div>
                    <Label>Número do Documento</Label>
                    <Input
                      value={form.document_number}
                      onChange={(e) => setForm({ ...form, document_number: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>

                  <div>
                    <Label>Quantidade de Parcelas *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.installments}
                      onChange={(e) => setForm({ ...form, installments: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Vencimento *</Label>
                    <Input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Valor *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <Label>Desconto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <Label>Multa/Juros</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.penalty_interest}
                      onChange={(e) => setForm({ ...form, penalty_interest: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <Label>Total R$</Label>
                    <Input
                      type="text"
                      value={calculateTotal().toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div>
                    <Label>Forma de Pagamento *</Label>
                    <Select
                      value={form.payment_method}
                      onValueChange={(value) => setForm({ ...form, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 flex items-center space-x-2">
                    <Checkbox
                      id="is_fixed_expense"
                      checked={form.is_fixed_expense}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, is_fixed_expense: checked as boolean })
                      }
                    />
                    <Label htmlFor="is_fixed_expense">
                      Despesa Fixa (gerar automaticamente para todos os meses do ano)
                    </Label>
                  </div>

                  <div className="col-span-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={form.observations}
                      onChange={(e) => setForm({ ...form, observations: e.target.value })}
                      placeholder="Observações opcionais"
                    />
                  </div>

                  <div className="col-span-2">
                    <Button onClick={handleSave} className="w-full">
                      {editingAccount ? "Atualizar" : "Salvar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {cashBoxes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum caixa cadastrado.</p>
              <p className="text-sm">Cadastre um caixa no módulo Controle de Caixa primeiro.</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Caixa</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{getSupplierName(account.supplier_id)}</TableCell>
                      <TableCell>{getCashBoxName(account.cash_box_id)}</TableCell>
                      <TableCell>
                        {account.installment_number}/{account.installments}
                      </TableCell>
                      <TableCell>{format(new Date(account.due_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        {Number(account.amount).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>
                        {Number(account.total).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(account.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {account.status === "pendente" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsPaidMutation.mutate(account.id)}
                              title="Marcar como pago"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(account)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAccountMutation.mutate(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
