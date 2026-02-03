import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Download, Eye, Upload, FileText, Loader2, MoreVertical, Calendar, CheckCircle2, XCircle, Pencil, Trash2, Phone, MessageSquare, Search, FileCheck } from "lucide-react";
import { format, addDays, isWeekend, nextMonday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterableTable, FilterableColumn } from "@/components/ui/filterable-table";
import { useTableFilters } from "@/hooks/useTableFilters";

type Cobranca = {
  id: string;
  customer_id: string;
  pagador_id: string | null;
  issue_date: string;
  due_date: string;
  file_url: string;
  file_name: string;
  status: string;
  type: string;
  amount: number | null;
  cte_reference: string | null;
  doc_number: string | null;
  tratativa_status: string | null;
  data_acerto: string | null;
  comprovante_url: string | null;
  comprovante_name: string | null;
  group_id: string | null;
  observacoes: string | null;
  created_at: string;
  customer?: {
    name: string;
    prazo_dias?: number;
    cpf_cnpj?: string;
    phone?: string;
  };
  pagador?: {
    name: string;
    cpf_cnpj?: string;
    phone?: string;
  } | null;
  group?: {
    name: string;
  } | null;
  // Computed fields for filtering
  customerName?: string;
  pagadorName?: string;
  effectiveStatus?: string;
  formattedAmount?: string;
  formattedDueDate?: string;
  typeLabel?: string;
  tratativaLabel?: string;
};

type CustomerGroup = {
  id: string;
  name: string;
};

type Customer = {
  id: string;
  name: string;
  prazo_dias: number | null;
  cpf_cnpj: string | null;
  phone: string | null;
};

type CustomerContact = {
  id: string;
  customer_id: string;
  tipo: string;
  telefone: string | null;
  email: string | null;
};

const Cobrancas = () => {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [comprovanteDialogOpen, setComprovanteDialogOpen] = useState(false);
  const [editingCobranca, setEditingCobranca] = useState<Cobranca | null>(null);
  const [reschedulingCobranca, setReschedulingCobranca] = useState<Cobranca | null>(null);
  const [comprovanteCobranca, setComprovanteCobranca] = useState<Cobranca | null>(null);
  const [viewingCobranca, setViewingCobranca] = useState<Cobranca | null>(null);
  const [viewBlobUrl, setViewBlobUrl] = useState<string | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingComprovante, setUploadingComprovante] = useState(false);
  const [extractingValue, setExtractingValue] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rescheduleFileInputRef = useRef<HTMLInputElement>(null);
  const comprovanteFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    customer_id: "",
    pagador_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date().toISOString().split("T")[0],
    type: "boleto",
    amount: "",
    cte_reference: "",
    doc_number: "",
    tratativa_status: "",
    data_acerto: "",
    group_id: "",
    observacoes: "",
    file: null as File | null,
  });

  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [pagadorSearch, setPagadorSearch] = useState("");
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [pagadorPopoverOpen, setPagadorPopoverOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [selectedCobrancaForWhatsapp, setSelectedCobrancaForWhatsapp] = useState<Cobranca | null>(null);
  const [availableContacts, setAvailableContacts] = useState<Array<{ phone: string; type: string; name: string }>>([]);

  const [rescheduleData, setRescheduleData] = useState({
    new_due_date: "",
    file: null as File | null,
  });

  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);

  // Transform cobrancas with computed fields for filtering
  const transformedCobrancas = cobrancas.map(cobranca => {
    const effectiveStatus = getEffectiveStatus(cobranca);
    return {
      ...cobranca,
      customerName: cobranca.customer?.name || "",
      pagadorName: cobranca.pagador?.name || "",
      effectiveStatus,
      formattedAmount: cobranca.amount 
        ? `R$ ${cobranca.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : "",
      formattedDueDate: format(new Date(cobranca.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }),
      typeLabel: getTypeLabel(cobranca.type),
      tratativaLabel: getTratativaLabel(cobranca.tratativa_status),
    };
  });

  const {
    globalSearch,
    setGlobalSearch,
    columnFilters,
    updateColumnFilter,
    sortConfig,
    toggleSort,
    clearAllFilters,
    filteredData,
    hasActiveFilters,
    totalCount,
    filteredCount,
  } = useTableFilters(transformedCobrancas, [
    'customerName', 'pagadorName', 'cte_reference', 'doc_number', 'typeLabel', 'effectiveStatus', 'formattedAmount'
  ]);

  useEffect(() => {
    fetchCobrancas();
    fetchCustomers();
    fetchCustomerGroups();
  }, []);

  const fetchCustomerGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("customer_groups")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCustomerGroups(data || []);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    }
  };

  const fetchCobrancas = async () => {
    try {
      const { data, error } = await supabase
        .from("boletos")
        .select(`
          *,
          customer:customers!boletos_customer_id_fkey(name, prazo_dias, cpf_cnpj, phone),
          pagador:customers!boletos_pagador_id_fkey(name, cpf_cnpj, phone)
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
        .select("id, name, prazo_dias, cpf_cnpj, phone")
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

  const uploadFile = async (file: File, prefix: string = ""): Promise<{ url: string; name: string } | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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

      if (!fileData && formData.type === "a_combinar") {
        fileData = { url: "", name: "" };
      }

      if (!fileData) {
        throw new Error("Erro ao processar arquivo");
      }

      const payload = {
        customer_id: formData.customer_id,
        pagador_id: formData.pagador_id || null,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        file_url: fileData.url,
        file_name: fileData.name,
        type: formData.type,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        cte_reference: formData.cte_reference || null,
        doc_number: formData.doc_number || null,
        tratativa_status: formData.tratativa_status || null,
        data_acerto: formData.data_acerto || null,
        group_id: formData.group_id || null,
        observacoes: formData.observacoes || null,
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
      if (cobranca.comprovante_url) {
        await deleteFile(cobranca.comprovante_url);
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
      pagador_id: cobranca.pagador_id || "",
      issue_date: cobranca.issue_date,
      due_date: cobranca.due_date,
      type: cobranca.type || "boleto",
      amount: cobranca.amount?.toString() || "",
      cte_reference: cobranca.cte_reference || "",
      doc_number: cobranca.doc_number || "",
      tratativa_status: cobranca.tratativa_status || "",
      data_acerto: cobranca.data_acerto || "",
      group_id: cobranca.group_id || "",
      observacoes: cobranca.observacoes || "",
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

  // Comprovante handlers
  const handleOpenComprovante = (cobranca: Cobranca) => {
    setComprovanteCobranca(cobranca);
    setComprovanteFile(null);
    setComprovanteDialogOpen(true);
  };

  const handleComprovanteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comprovanteCobranca || !comprovanteFile) return;

    setUploadingComprovante(true);

    try {
      // Delete old comprovante if exists
      if (comprovanteCobranca.comprovante_url) {
        await deleteFile(comprovanteCobranca.comprovante_url);
      }

      const uploadedFile = await uploadFile(comprovanteFile, "comprovante_");
      if (!uploadedFile) throw new Error("Erro ao fazer upload");

      const { error } = await supabase
        .from("boletos")
        .update({
          comprovante_url: uploadedFile.url,
          comprovante_name: uploadedFile.name,
        })
        .eq("id", comprovanteCobranca.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Comprovante anexado com sucesso" });
      fetchCobrancas();
      setComprovanteDialogOpen(false);
      setComprovanteCobranca(null);
      setComprovanteFile(null);
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Erro ao anexar comprovante",
        variant: "destructive",
      });
    } finally {
      setUploadingComprovante(false);
    }
  };

  const handleViewComprovante = async (cobranca: Cobranca) => {
    if (!cobranca.comprovante_url) return;
    window.open(cobranca.comprovante_url, "_blank");
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
      pagador_id: "",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date().toISOString().split("T")[0],
      type: "boleto",
      amount: "",
      cte_reference: "",
      doc_number: "",
      tratativa_status: "",
      data_acerto: "",
      group_id: "",
      observacoes: "",
      file: null,
    });
    setEditingCobranca(null);
    setCustomerSearch("");
    setPagadorSearch("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredCustomerOptions = customers.filter((customer) => {
    const search = customerSearch.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      (customer.cpf_cnpj && customer.cpf_cnpj.replace(/\D/g, "").includes(search.replace(/\D/g, "")))
    );
  });

  const filteredPagadorOptions = customers.filter((customer) => {
    const search = pagadorSearch.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      (customer.cpf_cnpj && customer.cpf_cnpj.replace(/\D/g, "").includes(search.replace(/\D/g, "")))
    );
  });

  const getSelectedCustomerName = () => {
    const customer = customers.find(c => c.id === formData.customer_id);
    return customer ? customer.name : "";
  };

  const getSelectedPagadorName = () => {
    const pagador = customers.find(c => c.id === formData.pagador_id);
    return pagador ? pagador.name : "";
  };

  const handleCobrar = async (cobranca: Cobranca) => {
    const targetCustomerId = cobranca.pagador_id || cobranca.customer_id;
    const targetName = cobranca.pagador?.name || cobranca.customer?.name || "Cliente";
    
    const { data: contacts, error } = await supabase
      .from("customer_contacts")
      .select("*")
      .eq("customer_id", targetCustomerId);

    if (error) {
      console.error("Erro ao buscar contatos:", error);
    }

    const allContacts: Array<{ phone: string; type: string; name: string }> = [];
    
    const targetCustomer = customers.find(c => c.id === targetCustomerId);
    if (targetCustomer?.phone) {
      allContacts.push({
        phone: targetCustomer.phone,
        type: "Principal",
        name: targetName
      });
    }

    if (contacts) {
      contacts.forEach((contact: CustomerContact) => {
        if (contact.telefone) {
          allContacts.push({
            phone: contact.telefone,
            type: contact.tipo,
            name: targetName
          });
        }
      });
    }

    if (allContacts.length === 0) {
      toast({
        title: "Sem contato",
        description: "Não há telefone cadastrado para este cliente/pagador",
        variant: "destructive",
      });
      return;
    }

    if (allContacts.length === 1) {
      sendWhatsappMessage(cobranca, allContacts[0].phone);
    } else {
      setSelectedCobrancaForWhatsapp(cobranca);
      setAvailableContacts(allContacts);
      setWhatsappDialogOpen(true);
    }
  };

  const sendWhatsappMessage = (cobranca: Cobranca, phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    
    const customerName = cobranca.pagador?.name || cobranca.customer?.name || "Cliente";
    const amount = cobranca.amount 
      ? `R$ ${cobranca.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : "valor não informado";
    const dueDate = format(new Date(cobranca.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
    
    const message = `Olá ${customerName}! 👋

Gostaríamos de informar sobre a cobrança:

📄 *Tipo:* ${cobranca.type === "boleto" ? "Boleto" : cobranca.type === "fatura" ? "Fatura" : cobranca.type === "pix" ? "Pix" : "A Combinar"}
💰 *Valor:* ${amount}
📅 *Vencimento:* ${dueDate}
${cobranca.cte_reference ? `🚚 *CTE:* ${cobranca.cte_reference}` : ""}
${cobranca.doc_number ? `📋 *Doc:* ${cobranca.doc_number}` : ""}

Por favor, entre em contato para mais informações.

Atenciosamente,
Equipe de Cobrança`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, "_blank");
    setWhatsappDialogOpen(false);
  };

  function getEffectiveStatus(cobranca: Cobranca): string {
    if (cobranca.status === "Recebido" || cobranca.status === "Reagendado") {
      return cobranca.status;
    }
    const today = new Date().toISOString().split("T")[0];
    if (cobranca.due_date < today && cobranca.status !== "Recebido") {
      return "Atrasado";
    }
    if (cobranca.status === "Quitado") {
      return "Recebido";
    }
    return "A Receber";
  }

  function getTypeLabel(type: string): string {
    switch (type) {
      case "boleto": return "Boleto";
      case "fatura": return "Fatura";
      case "pix": return "Pix";
      case "a_combinar": return "A Combinar";
      default: return "Boleto";
    }
  }

  function getTratativaLabel(tratativa: string | null): string {
    switch (tratativa) {
      case "acertado": return "Acertado";
      case "pendente_cliente": return "Pend. Cliente";
      case "pendente_nos": return "Pend. Nós";
      default: return "";
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const getTratativaBadge = (tratativa: string | null) => {
    switch (tratativa) {
      case "acertado":
        return <Badge variant="outline" className="border-green-500 text-green-600 text-xs">Acertado</Badge>;
      case "pendente_cliente":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">Pend. Cliente</Badge>;
      case "pendente_nos":
        return <Badge variant="outline" className="border-red-500 text-red-600 text-xs">Pend. Nós</Badge>;
      default:
        return <span className="text-muted-foreground">—</span>;
    }
  };

  const isFilePreviewable = (fileName: string) => {
    if (!fileName) return false;
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  const columns: FilterableColumn<Cobranca>[] = [
    {
      key: "customerName",
      header: "Cliente",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.customer?.name || "—"}</span>
          {item.comprovante_url && (
            <Badge variant="outline" className="border-green-500 text-green-600 text-xs gap-1">
              <FileCheck className="h-3 w-3" />
              Comprov.
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "typeLabel",
      header: "Tipo",
      sortable: true,
      render: (item) => getTypeBadge(item.type),
    },
    {
      key: "tratativaLabel",
      header: "Acordado",
      sortable: true,
      render: (item) => getTratativaBadge(item.tratativa_status),
    },
    {
      key: "cte_reference",
      header: "CTE",
      sortable: true,
      render: (item) => item.cte_reference || "—",
    },
    {
      key: "doc_number",
      header: "Doc",
      sortable: true,
      render: (item) => item.doc_number || "—",
    },
    {
      key: "formattedAmount",
      header: "Valor",
      sortable: true,
      render: (item) => item.formattedAmount || "—",
    },
    {
      key: "due_date",
      header: "Vencimento",
      sortable: true,
      render: (item) => item.formattedDueDate,
    },
    {
      key: "effectiveStatus",
      header: "Status",
      sortable: true,
      render: (item) => getStatusBadge(item.effectiveStatus || "A Receber"),
    },
    {
      key: "actions",
      header: "Ações",
      filterable: false,
      className: "text-right",
      headerClassName: "text-right",
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleToggleStatus(item, "Recebido")}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" />
              Recebido
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(item, "Em aberto")}>
              <XCircle className="mr-2 h-4 w-4 text-green-500" />
              A Receber
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleReschedule(item)}>
              <Calendar className="mr-2 h-4 w-4 text-orange-500" />
              Reagendar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCobrar(item)} className="text-green-600">
              <MessageSquare className="mr-2 h-4 w-4" />
              Cobrar (WhatsApp)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleOpenComprovante(item)}>
              <Upload className="mr-2 h-4 w-4 text-purple-500" />
              {item.comprovante_url ? "Substituir Comprovante" : "Anexar Comprovante"}
            </DropdownMenuItem>
            {item.comprovante_url && (
              <DropdownMenuItem onClick={() => handleViewComprovante(item)}>
                <FileCheck className="mr-2 h-4 w-4 text-green-500" />
                Ver Comprovante
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {item.file_url && (
              <>
                <DropdownMenuItem onClick={() => handleView(item)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload(item)}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => handleEdit(item)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(item)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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
                <Label htmlFor="customer_id">Cliente * (busque por nome ou CNPJ)</Label>
                <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.customer_id ? getSelectedCustomerName() : "Selecione um cliente..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Buscar por nome ou CNPJ..." 
                        value={customerSearch}
                        onValueChange={setCustomerSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {filteredCustomerOptions.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.id}
                              onSelect={() => {
                                handleCustomerChange(customer.id);
                                setCustomerPopoverOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{customer.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {customer.cpf_cnpj || "Sem CNPJ"} {customer.prazo_dias ? `• ${customer.prazo_dias} dias` : ""}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="pagador_id">Pagador (opcional)</Label>
                <Popover open={pagadorPopoverOpen} onOpenChange={setPagadorPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={pagadorPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.pagador_id ? getSelectedPagadorName() : "Selecione um pagador..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Buscar por nome ou CNPJ..." 
                        value={pagadorSearch}
                        onValueChange={setPagadorSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum pagador encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              setFormData({ ...formData, pagador_id: "" });
                              setPagadorPopoverOpen(false);
                            }}
                          >
                            <span className="text-muted-foreground">Nenhum (usar cliente)</span>
                          </CommandItem>
                          {filteredPagadorOptions.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.id}
                              onSelect={() => {
                                setFormData({ ...formData, pagador_id: customer.id });
                                setPagadorPopoverOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{customer.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {customer.cpf_cnpj || "Sem CNPJ"}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cte_reference">CTE</Label>
                  <Input
                    id="cte_reference"
                    placeholder="Número do CTE"
                    value={formData.cte_reference}
                    onChange={(e) => setFormData({ ...formData, cte_reference: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="doc_number">Doc</Label>
                  <Input
                    id="doc_number"
                    placeholder="Número das notas"
                    value={formData.doc_number}
                    onChange={(e) => setFormData({ ...formData, doc_number: e.target.value })}
                  />
                </div>
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

              {/* Grupo */}
              <div>
                <Label htmlFor="group_id">Grupo</Label>
                <Select
                  value={formData.group_id}
                  onValueChange={(value) => setFormData({ ...formData, group_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {customerGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Registre tratativas, negociações, acordos..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
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

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterableTable
            data={filteredData}
            columns={columns}
            globalSearch={globalSearch}
            onGlobalSearchChange={setGlobalSearch}
            columnFilters={columnFilters}
            onColumnFilterChange={updateColumnFilter}
            sortConfig={sortConfig}
            onSort={toggleSort}
            onClearFilters={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
            totalCount={totalCount}
            filteredCount={filteredCount}
            keyExtractor={(item) => item.id}
            isLoading={loading}
            emptyMessage="Nenhuma cobrança encontrada"
          />
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

      {/* Comprovante Dialog */}
      <Dialog open={comprovanteDialogOpen} onOpenChange={setComprovanteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Anexar Comprovante de Pagamento</DialogTitle>
          </DialogHeader>
          {comprovanteCobranca && (
            <form onSubmit={handleComprovanteSubmit} className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><strong>Cliente:</strong> {comprovanteCobranca.customer?.name}</p>
                <p><strong>Vencimento:</strong> {format(new Date(comprovanteCobranca.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</p>
                {comprovanteCobranca.amount && (
                  <p><strong>Valor:</strong> R$ {comprovanteCobranca.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                )}
              </div>

              {comprovanteCobranca.comprovante_name && (
                <div className="p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 truncate">
                    Comprovante atual: {comprovanteCobranca.comprovante_name}
                  </span>
                </div>
              )}

              <div>
                <Label htmlFor="comprovante_file">
                  {comprovanteCobranca.comprovante_url ? "Substituir Comprovante *" : "Comprovante *"}
                </Label>
                <div className="mt-2">
                  <Input
                    ref={comprovanteFileInputRef}
                    id="comprovante_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setComprovanteFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos aceitos: PDF, JPG, PNG (máx 5MB)
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setComprovanteDialogOpen(false);
                    setComprovanteCobranca(null);
                    setComprovanteFile(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploadingComprovante || !comprovanteFile}>
                  {uploadingComprovante ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Anexar
                    </>
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
                  <div className="mt-1">{getStatusBadge(getEffectiveStatus(viewingCobranca))}</div>
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

      {/* WhatsApp Contact Selection Dialog */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha para qual número deseja enviar a mensagem de cobrança:
            </p>
            <div className="space-y-2">
              {availableContacts.map((contact, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => selectedCobrancaForWhatsapp && sendWhatsappMessage(selectedCobrancaForWhatsapp, contact.phone)}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span>{contact.phone}</span>
                    <span className="text-xs text-muted-foreground">{contact.type}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cobrancas;
