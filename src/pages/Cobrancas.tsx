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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Download, Eye, Upload, FileText, Loader2, MoreVertical, Calendar, CheckCircle2, XCircle, Pencil, Trash2 } from "lucide-react";
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
  cte_reference: string | null;
  tratativa_status: string | null;
  data_acerto: string | null;
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
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [editingCobranca, setEditingCobranca] = useState<Cobranca | null>(null);
  const [reschedulingCobranca, setReschedulingCobranca] = useState<Cobranca | null>(null);
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
  const rescheduleFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    customer_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date().toISOString().split("T")[0],
    type: "boleto",
    amount: "",
    cte_reference: "",
    tratativa_status: "",
    data_acerto: "",
    file: null as File | null,
  });

  const [rescheduleData, setRescheduleData] = useState({
    new_due_date: "",
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
    if (!fileUrl) return;
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

    // File is only required for new charges when type is not "a_combinar"
    const isFileRequired = !editingCobranca && formData.type !== "a_combinar";
    if (isFileRequired && !formData.file) {
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
        if (editingCobranca && editingCobranca.file_url) {
          await deleteFile(editingCobranca.file_url);
        }
        fileData = await uploadFile(formData.file);
      }

      // For "a_combinar" type without file, use empty values
      if (!fileData && formData.type === "a_combinar") {
        fileData = { url: "", name: "" };
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
        cte_reference: formData.cte_reference || null,
        tratativa_status: formData.tratativa_status || null,
        data_acerto: formData.data_acerto || null,
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
      if (cobranca.file_url) {
        await deleteFile(cobranca.file_url);
      }

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

  const handleToggleStatus = async (cobranca: Cobranca, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("boletos")
        .update({ status: newStatus })
        .eq("id", cobranca.id);

      if (error) throw error;
      toast({ 
        title: "Sucesso", 
        description: `Status alterado para ${newStatus}` 
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
      cte_reference: cobranca.cte_reference || "",
      tratativa_status: cobranca.tratativa_status || "",
      data_acerto: cobranca.data_acerto || "",
      file: null,
    });
    setDialogOpen(true);
  };

  const handleReschedule = (cobranca: Cobranca) => {
    setReschedulingCobranca(cobranca);
    setRescheduleData({
      new_due_date: cobranca.due_date,
      file: null,
    });
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingCobranca) return;

    setUploading(true);

    try {
      let fileData = { url: reschedulingCobranca.file_url, name: reschedulingCobranca.file_name };

      if (rescheduleData.file) {
        if (reschedulingCobranca.file_url) {
          await deleteFile(reschedulingCobranca.file_url);
        }
        const uploadedFile = await uploadFile(rescheduleData.file);
        if (uploadedFile) {
          fileData = uploadedFile;
        }
      }

      const { error } = await supabase
        .from("boletos")
        .update({
          due_date: rescheduleData.new_due_date,
          file_url: fileData.url,
          file_name: fileData.name,
          status: "Reagendado",
        })
        .eq("id", reschedulingCobranca.id);

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Cobrança reagendada com sucesso" });
      fetchCobrancas();
      setRescheduleDialogOpen(false);
      setReschedulingCobranca(null);
      setRescheduleData({ new_due_date: "", file: null });
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Erro ao reagendar cobrança",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (cobranca: Cobranca) => {
    if (!cobranca.file_url) {
      toast({
        title: "Aviso",
        description: "Esta cobrança não possui arquivo anexado",
        variant: "destructive",
      });
      return;
    }
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
    if (!cobranca.file_url) {
      toast({
        title: "Aviso",
        description: "Esta cobrança não possui arquivo anexado",
        variant: "destructive",
      });
      return;
    }
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
      cte_reference: "",
      tratativa_status: "",
      data_acerto: "",
      file: null,
    });
    setEditingCobranca(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getEffectiveStatus = (cobranca: Cobranca): string => {
    // If already has a final status, return it
    if (cobranca.status === "Recebido" || cobranca.status === "Reagendado") {
      return cobranca.status;
    }
    // Check if overdue
    const today = new Date().toISOString().split("T")[0];
    if (cobranca.due_date < today && cobranca.status !== "Recebido") {
      return "Atrasado";
    }
    // If "Em aberto" or "Quitado" (legacy), map to new statuses
    if (cobranca.status === "Quitado") {
      return "Recebido";
    }
    return "A Receber";
  };

  const filteredCobrancas = cobrancas.filter((cobranca) => {
    const matchesSearch = cobranca.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || cobranca.type === typeFilter;
    const matchesStartDate = !startDate || cobranca.due_date >= startDate;
    const matchesEndDate = !endDate || cobranca.due_date <= endDate;
    
    const effectiveStatus = getEffectiveStatus(cobranca);
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else {
      matchesStatus = effectiveStatus === statusFilter;
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesStartDate && matchesEndDate;
  });

  const getStatusBadge = (cobranca: Cobranca) => {
    const effectiveStatus = getEffectiveStatus(cobranca);
    
    switch (effectiveStatus) {
      case "Recebido":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Recebido</Badge>;
      case "A Receber":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">A Receber</Badge>;
      case "Atrasado":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white">Atrasado</Badge>;
      case "Reagendado":
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Reagendado</Badge>;
      default:
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">A Receber</Badge>;
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
      case "a_combinar":
        return <Badge variant="outline" className="border-purple-500 text-purple-600">A Combinar</Badge>;
      default:
        return <Badge variant="outline">Boleto</Badge>;
    }
  };

  const isFilePreviewable = (fileName: string) => {
    if (!fileName) return false;
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Cobranças</h1>
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                    <SelectItem value="a_combinar">A Combinar</SelectItem>
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

              <div className="grid grid-cols-2 gap-4">
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
                </div>
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
                <Label htmlFor="cte_reference">Referente a CTE</Label>
                <Input
                  id="cte_reference"
                  placeholder="Número do CTE"
                  value={formData.cte_reference}
                  onChange={(e) => setFormData({ ...formData, cte_reference: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tratativa_status">Status da Tratativa</Label>
                  <Select
                    value={formData.tratativa_status}
                    onValueChange={(value) => setFormData({ ...formData, tratativa_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acertado">Acertado</SelectItem>
                      <SelectItem value="pendente_cliente">Pendente Cliente</SelectItem>
                      <SelectItem value="pendente_nos">Pendente Nós</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="data_acerto">Data de Acerto</Label>
                  <Input
                    id="data_acerto"
                    type="date"
                    value={formData.data_acerto}
                    onChange={(e) => setFormData({ ...formData, data_acerto: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="file">
                  {editingCobranca 
                    ? "Substituir Arquivo (opcional)" 
                    : formData.type === "a_combinar" 
                      ? "Arquivo da Cobrança (opcional)" 
                      : "Arquivo da Cobrança *"
                  }
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
                {editingCobranca && !formData.file && editingCobranca.file_name && (
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
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
            <SelectItem value="a_combinar">A Combinar</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="A Receber">A Receber</SelectItem>
            <SelectItem value="Atrasado">Atrasado</SelectItem>
            <SelectItem value="Recebido">Recebido</SelectItem>
            <SelectItem value="Reagendado">Reagendado</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">De:</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Até:</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36"
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
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Acordado</TableHead>
                  <TableHead>CTE</TableHead>
                  <TableHead>Doc</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCobrancas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
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
                        {cobranca.tratativa_status === "acertado" && (
                          <Badge variant="outline" className="border-green-500 text-green-600 text-xs">Acertado</Badge>
                        )}
                        {cobranca.tratativa_status === "pendente_cliente" && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">Pend. Cliente</Badge>
                        )}
                        {cobranca.tratativa_status === "pendente_nos" && (
                          <Badge variant="outline" className="border-red-500 text-red-600 text-xs">Pend. Nós</Badge>
                        )}
                        {!cobranca.tratativa_status && "—"}
                      </TableCell>
                      <TableCell>
                        {cobranca.cte_reference || "—"}
                      </TableCell>
                      <TableCell>
                        {(cobranca as any).doc_number || "—"}
                      </TableCell>
                      <TableCell>
                        {cobranca.amount 
                          ? `R$ ${cobranca.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        {format(new Date(cobranca.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(cobranca)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleToggleStatus(cobranca, "Recebido")}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" />
                              Recebido
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(cobranca, "Em aberto")}>
                              <XCircle className="mr-2 h-4 w-4 text-green-500" />
                              A Receber
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReschedule(cobranca)}>
                              <Calendar className="mr-2 h-4 w-4 text-orange-500" />
                              Reagendar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {cobranca.file_url && (
                              <>
                                <DropdownMenuItem onClick={() => handleView(cobranca)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(cobranca)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Baixar
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleEdit(cobranca)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(cobranca)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reagendar Cobrança</DialogTitle>
          </DialogHeader>
          {reschedulingCobranca && (
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><strong>Cliente:</strong> {reschedulingCobranca.customer?.name}</p>
                <p><strong>Vencimento atual:</strong> {format(new Date(reschedulingCobranca.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</p>
                {reschedulingCobranca.amount && (
                  <p><strong>Valor:</strong> R$ {reschedulingCobranca.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                )}
              </div>

              <div>
                <Label htmlFor="new_due_date">Nova Data de Vencimento *</Label>
                <Input
                  id="new_due_date"
                  type="date"
                  value={rescheduleData.new_due_date}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, new_due_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="reschedule_file">Novo Arquivo (opcional)</Label>
                <div className="mt-2">
                  <Input
                    ref={rescheduleFileInputRef}
                    id="reschedule_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setRescheduleData({ ...rescheduleData, file: e.target.files?.[0] || null })}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Envie um novo boleto/arquivo se necessário
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRescheduleDialogOpen(false);
                    setReschedulingCobranca(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Reagendar"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={handleCloseViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualizar Cobrança</DialogTitle>
          </DialogHeader>
          {viewingCobranca && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                  <div className="mt-1">{getStatusBadge(viewingCobranca)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Arquivo:</span>
                  <p className="font-medium">{viewingCobranca.file_name || "—"}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-muted/50 min-h-[400px] flex items-center justify-center">
                {loadingView ? (
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando arquivo...</p>
                  </div>
                ) : viewBlobUrl && viewingCobranca.file_name && isFilePreviewable(viewingCobranca.file_name) ? (
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
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Não é possível visualizar este tipo de arquivo
                    </p>
                    {viewingCobranca.file_url && (
                      <Button onClick={() => handleDownload(viewingCobranca)}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Arquivo
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cobrancas;
