import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Search, Download, Eye, Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format, addDays, isWeekend, nextMonday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

type Cobranca = {
  id: string;
  customer_id: string;
  issue_date: string;
  due_date: string;
  file_url: string;
  file_name: string;
  status: string;
  type: string;
  amount: number | null;
  created_at: string;
  customer?: {
    name: string;
    prazo_dias?: number;
  };
};

type Customer = {
  id: string;
  name: string;
  prazo_dias: number | null;
};

const Cobrancas = () => {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingCobranca, setEditingCobranca] = useState<Cobranca | null>(null);
  const [viewingCobranca, setViewingCobranca] = useState<Cobranca | null>(null);
  const [viewBlobUrl, setViewBlobUrl] = useState<string | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [extractingValue, setExtractingValue] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    customer_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date().toISOString().split("T")[0],
    type: "boleto",
    amount: "",
    file: null as File | null,
  });

  useEffect(() => {
    fetchCobrancas();
    fetchCustomers();
  }, []);

  const fetchCobrancas = async () => {
    try {
      const { data, error } = await supabase
        .from("boletos")
        .select(`
          *,
          customer:customers(name, prazo_dias)
        `)
        .order("due_date", { ascending: false });

      if (error) throw error;
      setCobrancas(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar cobranças",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, prazo_dias")
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const calculateDueDate = (issueDate: string, prazoDias: number): string => {
    const baseDate = new Date(issueDate + "T12:00:00");
    let dueDate = addDays(baseDate, prazoDias);
    
    if (isWeekend(dueDate)) {
      dueDate = nextMonday(dueDate);
    }
    
    return format(dueDate, "yyyy-MM-dd");
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    const prazoDias = customer?.prazo_dias || 30;
    const newDueDate = calculateDueDate(formData.issue_date, prazoDias);
    
    setFormData({
      ...formData,
      customer_id: customerId,
      due_date: newDueDate,
    });
  };

  const handleIssueDateChange = (issueDate: string) => {
    const customer = customers.find(c => c.id === formData.customer_id);
    const prazoDias = customer?.prazo_dias || 30;
    const newDueDate = formData.customer_id ? calculateDueDate(issueDate, prazoDias) : issueDate;
    
    setFormData({
      ...formData,
      issue_date: issueDate,
      due_date: newDueDate,
    });
  };

  const extractValueFromPdf = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return null;
    }

    setExtractingValue(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-value`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formDataUpload,
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Limite de requisições",
            description: "Tente novamente em alguns instantes",
            variant: "destructive",
          });
        }
        return null;
      }

      const result = await response.json();
      return result.value;
    } catch (error) {
      console.error("Erro ao extrair valor do PDF:", error);
      return null;
    } finally {
      setExtractingValue(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData({ ...formData, file });

    // Try to extract value from PDF
    if (file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "Processando PDF",
        description: "Extraindo valor do documento...",
      });
      
      const extractedValue = await extractValueFromPdf(file);
      if (extractedValue !== null && extractedValue !== undefined) {
        setFormData(prev => ({
          ...prev,
          file,
          amount: extractedValue.toString(),
        }));
        toast({
          title: "Valor extraído",
          description: `Valor encontrado: R$ ${extractedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        });
      } else {
        toast({
          title: "Valor não encontrado",
          description: "Não foi possível extrair o valor automaticamente. Por favor, insira manualmente.",
          variant: "destructive",
        });
      }
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string } | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("boletos")
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("boletos")
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl, name: file.name };
  };

  const deleteFile = async (fileUrl: string) => {
    const fileName = fileUrl.split("/").pop();
    if (fileName) {
      await supabase.storage.from("boletos").remove([fileName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive",
      });
      return;
    }

    if (!editingCobranca && !formData.file) {
      toast({
        title: "Erro",
        description: "Anexe o arquivo da cobrança",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      let fileData = editingCobranca 
        ? { url: editingCobranca.file_url, name: editingCobranca.file_name }
        : null;

      if (formData.file) {
        if (editingCobranca) {
          await deleteFile(editingCobranca.file_url);
        }
        fileData = await uploadFile(formData.file);
      }

      if (!fileData) {
        throw new Error("Erro ao processar arquivo");
      }

      const payload = {
        customer_id: formData.customer_id,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        file_url: fileData.url,
        file_name: fileData.name,
        type: formData.type,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        status: editingCobranca?.status || "Em aberto",
      };

      if (editingCobranca) {
        const { error } = await supabase
          .from("boletos")
          .update(payload)
          .eq("id", editingCobranca.id);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Cobrança atualizada com sucesso" });
      } else {
        const { error } = await supabase.from("boletos").insert(payload);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Cobrança criada com sucesso" });
      }

      fetchCobrancas();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar cobrança",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (cobranca: Cobranca) => {
    if (!confirm("Deseja realmente excluir esta cobrança?")) return;

    try {
      await deleteFile(cobranca.file_url);

      const { error } = await supabase
        .from("boletos")
        .delete()
        .eq("id", cobranca.id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Cobrança excluída com sucesso" });
      fetchCobrancas();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir cobrança",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (cobranca: Cobranca) => {
    const newStatus = cobranca.status === "Quitado" ? "Em aberto" : "Quitado";
    
    try {
      const { error } = await supabase
        .from("boletos")
        .update({ status: newStatus })
        .eq("id", cobranca.id);

      if (error) throw error;
      toast({ 
        title: "Sucesso", 
        description: newStatus === "Quitado" ? "Cobrança quitada com sucesso" : "Cobrança reaberta com sucesso" 
      });
      fetchCobrancas();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (cobranca: Cobranca) => {
    setEditingCobranca(cobranca);
    setFormData({
      customer_id: cobranca.customer_id,
      issue_date: cobranca.issue_date,
      due_date: cobranca.due_date,
      type: cobranca.type || "boleto",
      amount: cobranca.amount?.toString() || "",
      file: null,
    });
    setDialogOpen(true);
  };

  const handleView = async (cobranca: Cobranca) => {
    setViewingCobranca(cobranca);
    setViewDialogOpen(true);
    setLoadingView(true);
    setViewBlobUrl(null);
    
    try {
      const response = await fetch(cobranca.file_url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      setViewBlobUrl(blobUrl);
    } catch (error) {
      console.error("Erro ao carregar arquivo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o arquivo para visualização",
        variant: "destructive",
      });
    } finally {
      setLoadingView(false);
    }
  };

  const handleCloseViewDialog = () => {
    if (viewBlobUrl) {
      window.URL.revokeObjectURL(viewBlobUrl);
      setViewBlobUrl(null);
    }
    setViewDialogOpen(false);
    setViewingCobranca(null);
  };

  const handleDownload = async (cobranca: Cobranca) => {
    try {
      const response = await fetch(cobranca.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = cobranca.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar:", error);
      window.open(cobranca.file_url, "_blank");
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date().toISOString().split("T")[0],
      type: "boleto",
      amount: "",
      file: null,
    });
    setEditingCobranca(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredCobrancas = cobrancas.filter((cobranca) => {
    const matchesSearch = cobranca.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cobranca.status === statusFilter;
    const matchesType = typeFilter === "all" || cobranca.type === typeFilter;
    const matchesStartDate = !startDate || cobranca.due_date >= startDate;
    const matchesEndDate = !endDate || cobranca.due_date <= endDate;
    
    return matchesSearch && matchesStatus && matchesType && matchesStartDate && matchesEndDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Quitado":
        return <Badge className="bg-green-500 hover:bg-green-600">Quitado</Badge>;
      case "Em Análise":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Em Análise</Badge>;
      default:
        return <Badge variant="destructive">Em aberto</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "boleto":
        return <Badge variant="outline">Boleto</Badge>;
      case "fatura":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Fatura</Badge>;
      case "pix":
        return <Badge variant="outline" className="border-green-500 text-green-600">Pix</Badge>;
      default:
        return <Badge variant="outline">Boleto</Badge>;
    }
  };

  const isFilePreviewable = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cobranças</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Cobrança
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCobranca ? "Editar Cobrança" : "Nova Cobrança"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Tipo de Cobrança *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="fatura">Fatura</SelectItem>
                    <SelectItem value="pix">Pix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customer_id">Cliente *</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={handleCustomerChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.prazo_dias ? `(${customer.prazo_dias} dias)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="issue_date">Data de Emissão *</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => handleIssueDateChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="due_date">Data de Vencimento *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Calculado automaticamente com base no prazo do cliente
                </p>
              </div>

              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    disabled={extractingValue}
                  />
                  {extractingValue && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Para PDFs, o valor será extraído automaticamente
                </p>
              </div>

              <div>
                <Label htmlFor="file">
                  {editingCobranca ? "Substituir Arquivo (opcional)" : "Arquivo da Cobrança *"}
                </Label>
                <div className="mt-2">
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    disabled={extractingValue}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos aceitos: PDF, JPG, PNG
                  </p>
                </div>
                {editingCobranca && !formData.file && (
                  <div className="mt-2 p-2 bg-muted rounded flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm truncate">{editingCobranca.file_name}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading || extractingValue}>
                  {uploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
            <SelectItem value="fatura">Fatura</SelectItem>
            <SelectItem value="pix">Pix</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Em aberto">Em aberto</SelectItem>
            <SelectItem value="Quitado">Quitado</SelectItem>
            <SelectItem value="Em Análise">Em Análise</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">De:</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Até:</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        {(startDate || endDate || statusFilter !== "all" || typeFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); setStatusFilter("all"); setTypeFilter("all"); }}>
            Limpar
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data de Emissão</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCobrancas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Nenhuma cobrança encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCobrancas.map((cobranca) => (
                    <TableRow key={cobranca.id}>
                      <TableCell className="font-medium">
                        {cobranca.customer?.name || "—"}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(cobranca.type)}
                      </TableCell>
                      <TableCell>
                        {cobranca.amount 
                          ? `R$ ${cobranca.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        {format(new Date(cobranca.issue_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(cobranca.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                          {cobranca.file_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(cobranca.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(cobranca)}
                            title={cobranca.status === "Quitado" ? "Desquitar" : "Quitar"}
                          >
                            {cobranca.status === "Quitado" ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(cobranca)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(cobranca)}
                            title="Baixar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cobranca)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cobranca)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={handleCloseViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualizar Cobrança</DialogTitle>
          </DialogHeader>
          {viewingCobranca && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-medium">{viewingCobranca.customer?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <div className="mt-1">{getTypeBadge(viewingCobranca.type)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <p className="font-medium">
                    {viewingCobranca.amount 
                      ? `R$ ${viewingCobranca.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : "—"
                    }
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vencimento:</span>
                  <p className="font-medium">
                    {format(new Date(viewingCobranca.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="mt-1">{getStatusBadge(viewingCobranca.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Arquivo:</span>
                  <p className="font-medium">{viewingCobranca.file_name}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-muted/50 min-h-[400px] flex items-center justify-center">
                {loadingView ? (
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando arquivo...</p>
                  </div>
                ) : viewBlobUrl && isFilePreviewable(viewingCobranca.file_name) ? (
                  viewingCobranca.file_name.toLowerCase().endsWith(".pdf") ? (
                    <iframe
                      src={viewBlobUrl}
                      className="w-full h-[500px]"
                      title="Cobrança PDF"
                    />
                  ) : (
                    <img
                      src={viewBlobUrl}
                      alt="Cobrança"
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  )
                ) : (
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Visualização não disponível para este formato
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleDownload(viewingCobranca)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Arquivo
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseViewDialog}>
                  Fechar
                </Button>
                <Button onClick={() => handleDownload(viewingCobranca)}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cobrancas;
