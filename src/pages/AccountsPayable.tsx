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
import { Plus, Search, Check, Pencil, Trash2, UserPlus, ChevronLeft, ChevronRight, X, Eye, Upload, Download } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AccountPayable {
  id: string;
  cash_box_id: string | null;
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
  boleto_file_name: string | null;
  boleto_file_url: string | null;
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
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountPayable | null>(null);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierCnpj, setNewSupplierCnpj] = useState("");
  
  const [form, setForm] = useState({
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
  const [boletoFile, setBoletoFile] = useState<File | null>(null);
  const [existingBoletoUrl, setExistingBoletoUrl] = useState<string | null>(null);
  const [existingBoletoName, setExistingBoletoName] = useState<string | null>(null);
  const [uploadingBoleto, setUploadingBoleto] = useState(false);

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
        const installmentAmount = Math.round((baseAmount / installments) * 100) / 100;
        const total = Math.round((installmentAmount - discount + penaltyInterest) * 100) / 100;

        const accountsToInsert = [];
        const baseDate = new Date(form.due_date);

        for (let i = 0; i < installments; i++) {
          const dueDate = addMonths(baseDate, i);
          accountsToInsert.push({
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
              const fixedTotal = Math.round((baseAmount - discount + penaltyInterest) * 100) / 100;
              accountsToInsert.push({
                supplier_id: form.supplier_id,
                document_number: form.document_number || null,
                installments: 1,
                installment_number: 1,
                due_date: format(dueDate, "yyyy-MM-dd"),
                amount: baseAmount,
                discount: discount,
                penalty_interest: penaltyInterest,
                total: fixedTotal,
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
    setBoletoFile(null);
    setExistingBoletoUrl(null);
    setExistingBoletoName(null);
  };

  const handleBoletoUpload = async (file: File): Promise<{ url: string; name: string } | null> => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use PDF, JPG ou PNG.");
      return null;
    }

    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `boletos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('boletos')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error("Erro ao fazer upload do boleto");
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('boletos')
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, name: file.name };
  };

  const handleSave = async () => {
    if (!form.supplier_id || !form.due_date || !form.amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    const amount = Math.round((parseFloat(form.amount) || 0) * 100) / 100;
    const discount = Math.round((parseFloat(form.discount) || 0) * 100) / 100;
    const penaltyInterest = Math.round((parseFloat(form.penalty_interest) || 0) * 100) / 100;
    const total = Math.round((amount - discount + penaltyInterest) * 100) / 100;

    let boletoUrl = existingBoletoUrl;
    let boletoName = existingBoletoName;

    // Upload new boleto if selected
    if (boletoFile) {
      setUploadingBoleto(true);
      const uploadResult = await handleBoletoUpload(boletoFile);
      setUploadingBoleto(false);
      if (uploadResult) {
        boletoUrl = uploadResult.url;
        boletoName = uploadResult.name;
      }
    }

    saveAccountMutation.mutate({
      supplier_id: form.supplier_id,
      document_number: form.document_number || null,
      due_date: form.due_date,
      amount,
      discount,
      penalty_interest: penaltyInterest,
      total,
      payment_method: form.payment_method,
      is_fixed_expense: form.is_fixed_expense,
      observations: form.observations || null,
      boleto_file_url: boletoUrl,
      boleto_file_name: boletoName,
    });
  };

  const handleEdit = (account: AccountPayable) => {
    setEditingAccount(account);
    setForm({
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
    setExistingBoletoUrl(account.boleto_file_url);
    setExistingBoletoName(account.boleto_file_name);
    setBoletoFile(null);
    setDialogOpen(true);
  };

  // Calculate total with rounding fix
  const calculateTotal = () => {
    const amount = parseFloat(form.amount) || 0;
    const discount = parseFloat(form.discount) || 0;
    const penaltyInterest = parseFloat(form.penalty_interest) || 0;
    return Math.round((amount - discount + penaltyInterest) * 100) / 100;
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier?.name || "Fornecedor não encontrado";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pendente: "secondary",
      pago: "default",
      vencido: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.toUpperCase()}</Badge>;
  };

  // Month navigation
  const goToPreviousMonth = () => {
    setSelectedMonth(prev => addMonths(prev, -1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setSelectedMonth(new Date());
  };

  const hasActiveFilters = searchTerm || filterStatus !== "all" || 
    (selectedMonth.getMonth() !== new Date().getMonth() || selectedMonth.getFullYear() !== new Date().getFullYear());

  // Filter accounts by month
  const filteredAccounts = accounts.filter((account) => {
    const accountDate = new Date(account.due_date + 'T12:00:00');
    const matchesMonth = 
      accountDate.getMonth() === selectedMonth.getMonth() &&
      accountDate.getFullYear() === selectedMonth.getFullYear();
    const matchesSearch = getSupplierName(account.supplier_id)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || account.status === filterStatus;
    return matchesMonth && matchesSearch && matchesStatus;
  });

  // Calculate totals (only for filtered accounts)
  const totalPending = filteredAccounts
    .filter((a) => a.status === "pendente")
    .reduce((sum, a) => sum + Number(a.total), 0);

  const totalPaid = filteredAccounts
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
                <Button onClick={resetForm}>
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
                      disabled={!!editingAccount}
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
                      value={calculateTotal().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
                        <SelectItem value="pix">Pix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 flex items-center space-x-2">
                    <Checkbox
                      id="is_fixed_expense"
                      checked={form.is_fixed_expense}
                      onCheckedChange={(checked) => setForm({ ...form, is_fixed_expense: !!checked })}
                      disabled={!!editingAccount}
                    />
                    <Label htmlFor="is_fixed_expense" className="cursor-pointer">
                      Despesa Fixa (gerar para todos os meses do ano)
                    </Label>
                  </div>

                  <div className="col-span-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={form.observations}
                      onChange={(e) => setForm({ ...form, observations: e.target.value })}
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>

                  {/* Boleto Upload */}
                  <div className="col-span-2">
                    <Label>Anexar Boleto (PDF, JPG, PNG - máx 5MB)</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBoletoFile(file);
                          }
                        }}
                        className="flex-1"
                      />
                      {(existingBoletoUrl || boletoFile) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (boletoFile) {
                              const url = URL.createObjectURL(boletoFile);
                              window.open(url, '_blank');
                            } else if (existingBoletoUrl) {
                              window.open(existingBoletoUrl, '_blank');
                            }
                          }}
                          title="Visualizar boleto"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {boletoFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Novo arquivo: {boletoFile.name}
                      </p>
                    )}
                    {!boletoFile && existingBoletoName && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Arquivo atual: {existingBoletoName}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Button onClick={handleSave} className="w-full" disabled={uploadingBoleto}>
                      {uploadingBoleto ? "Enviando boleto..." : editingAccount ? "Atualizar" : "Salvar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Month Filter */}
            <div className="flex items-center gap-2 border rounded-md px-2 py-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center font-medium capitalize">
                {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Table */}
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma conta a pagar encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Boleto</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{getSupplierName(account.supplier_id)}</TableCell>
                    <TableCell>
                      {account.installment_number}/{account.installments}
                    </TableCell>
                    <TableCell>
                      {new Date(account.due_date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {Number(account.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell>
                      {Number(account.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell>{getStatusBadge(account.status)}</TableCell>
                    <TableCell>
                      {account.boleto_file_url ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(account.boleto_file_url!, '_blank')}
                            title="Visualizar boleto"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              try {
                                const response = await fetch(account.boleto_file_url!);
                                const blob = await response.blob();
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = blobUrl;
                                link.download = account.boleto_file_name || 'boleto';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(blobUrl);
                                toast.success("Download iniciado!");
                              } catch (error) {
                                console.error('Download error:', error);
                                toast.error("Erro ao baixar boleto");
                              }
                            }}
                            title="Download boleto"
                          >
                            <Download className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
