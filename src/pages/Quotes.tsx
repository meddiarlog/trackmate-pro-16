import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerSearchSelect } from "@/components/CustomerSearchSelect";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Calculator,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QuotePrintView } from "@/components/QuotePrintView";
import { CustomerFormDialog } from "@/components/CustomerFormDialog";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

type QuoteLocation = {
  city: string;
  state: string;
};

const emptyLocation = (): QuoteLocation => ({ city: "", state: "" });



interface Quote {
  id: string;
  quote_number: number;
  customer_id: string | null;
  responsavel: string | null;
  contato: string | null;
  service_type: string;
  service_transporte?: boolean;
  service_munck?: boolean;
  service_carregamento?: boolean;
  service_descarga?: boolean;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  product_id: string | null;
  freight_value: number;
  munck_value: number;
  carregamento_value?: number;
  descarga_value?: number;
  carga_responsavel?: string | null;
  descarga_responsavel?: string | null;
  vehicle_type_id: string | null;
  body_type_id?: string | null;
  freight_mode?: string | null;
  weight_kg?: number | null;
  delivery_days: number;
  quote_validity_days?: number;
  payment_term_days?: number;
  observations: string | null;
  payment_method: string | null;
  status: string;
  created_at: string;
  customer?: { name: string; cpf_cnpj: string | null } | null;
  product?: { name: string } | null;
  vehicle_type?: { name: string } | null;
  body_type?: { name: string } | null;
  recipients?: QuoteRecipient[];
}


interface BodyType {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  cpf_cnpj: string | null;
  nome_fantasia: string | null;
}

interface Product {
  id: string;
  name: string;
}

interface VehicleType {
  id: string;
  name: string;
}

interface CompanySettings {
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
  logo_url: string | null;
  vendedor: string | null;
  contato: string | null;
  email: string | null;
}

export default function Quotes() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const printRef = useRef<HTMLDivElement>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  
  // Quick-add dialogs states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [vehicleTypeDialogOpen, setVehicleTypeDialogOpen] = useState(false);
  const [newVehicleTypeName, setNewVehicleTypeName] = useState("");
  const [bodyTypeDialogOpen, setBodyTypeDialogOpen] = useState(false);
  const [newBodyTypeName, setNewBodyTypeName] = useState("");

  const [formData, setFormData] = useState({
    customer_id: "",
    responsavel: "",
    contato: "",
    service_transporte: false,
    service_munck: false,
    service_carregamento: false,
    service_descarga: false,
    origin_city: "",
    origin_state: "",
    destination_city: "",
    destination_state: "",
    product_id: "",
    freight_value: "",
    munck_value: "",
    carregamento_value: "",
    descarga_value: "",
    carga_responsavel: "",
    descarga_responsavel: "",
    vehicle_type_id: "",
    body_type_id: "",
    freight_mode: "",
    weight_kg: "",
    delivery_days: "0",
    quote_validity_days: "15",
    payment_term_days: "30",
    observations: "",
    payment_method: "",
    recipients: [emptyRecipient()] as QuoteRecipient[],
  });


  // Helper to build service_type string for backward compatibility
  const buildServiceTypeString = () => {
    const services: string[] = [];
    if (formData.service_transporte) services.push("transporte");
    if (formData.service_munck) services.push("munck");
    if (formData.service_carregamento) services.push("carregamento");
    if (formData.service_descarga) services.push("descarga");
    return services.join(", ") || "transporte";
  };

  // Compute the transport value (handles per-ton vs closed)
  const computeTransportValue = () => {
    const freight = parseFloat(formData.freight_value) || 0;
    if (formData.freight_mode === "per_ton") {
      const weightKg = parseFloat(formData.weight_kg) || 0;
      return Math.round(((weightKg / 1000) * freight) * 100) / 100;
    }
    return freight;
  };

  // Calculate total value
  const calculateTotal = () => {
    let total = 0;
    if (formData.service_transporte) total += computeTransportValue();
    if (formData.service_munck) total += parseFloat(formData.munck_value) || 0;
    if (formData.service_carregamento) total += parseFloat(formData.carregamento_value) || 0;
    if (formData.service_descarga) total += parseFloat(formData.descarga_value) || 0;
    return total;
  };

  // Currency input helpers (mask: digit input → "1.234,56", stored as "1234.56")
  const formatBR = (value: string) =>
    value === ""
      ? ""
      : (parseFloat(value) || 0).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  const handleCurrencyChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numeric = digits ? (parseInt(digits, 10) / 100).toFixed(2) : "";
    setFormData((prev) => ({ ...prev, [field]: numeric }));
  };
  const getQuoteTotal = (quote: Quote) => {
    const transport = quote.freight_mode === "per_ton"
      ? Math.round((((quote.weight_kg || 0) / 1000) * (quote.freight_value || 0)) * 100) / 100
      : (quote.freight_value || 0);
    return transport + (quote.munck_value || 0) + (quote.carregamento_value || 0) + (quote.descarga_value || 0);
  };

  // Helper to get service display string from a quote
  const getServiceDisplay = (quote: Quote) => {
    // Use new boolean fields if available, fallback to service_type
    const services: string[] = [];
    if (quote.service_transporte) services.push("Transporte");
    if (quote.service_munck) services.push("Munck");
    if (quote.service_carregamento) services.push("Carregamento");
    if (quote.service_descarga) services.push("Descarga");
    if (services.length > 0) return services.join(", ");
    // Fallback for old records
    return quote.service_type?.split(",").map(s => s.trim().charAt(0).toUpperCase() + s.trim().slice(1)).join(", ") || "-";
  };

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          customer:customers(name, cpf_cnpj),
          product:products(name),
          vehicle_type:vehicle_types(name)
        `)
        .order("quote_number", { ascending: false });
      if (error) throw error;
      
      // Fetch body types separately to join manually
      const bodyTypeIds = data
        .map((q: any) => q.body_type_id)
        .filter((id: string | null) => id !== null);
      
      let bodyTypeMap: Record<string, string> = {};
      if (bodyTypeIds.length > 0) {
        const { data: bodyTypesData } = await supabase
          .from("body_types")
          .select("id, name")
          .in("id", bodyTypeIds);
        if (bodyTypesData) {
          bodyTypeMap = bodyTypesData.reduce((acc: Record<string, string>, bt) => {
            acc[bt.id] = bt.name;
            return acc;
          }, {});
        }
      }
      
      return data.map((q: any) => ({
        ...q,
        body_type: q.body_type_id ? { name: bodyTypeMap[q.body_type_id] || null } : null,
      })) as Quote[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, cpf_cnpj, nome_fantasia")
        .order("name");
      if (error) throw error;
      return data as Customer[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ["vehicle_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_types")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as VehicleType[];
    },
  });

  const { data: bodyTypes = [] } = useQuery({
    queryKey: ["body_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("body_types")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as BodyType[];
    },
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: companySettings } = useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as CompanySettings | null;
    },
  });

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quote_number.toString().includes(searchTerm)
  );

  const saveQuoteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // First recipient drives legacy destination_city/state for backward compatibility
      const firstRecipient = data.recipients?.[0];
      const legacyDestCity = firstRecipient?.city?.trim() || data.destination_city || "";
      const legacyDestState = firstRecipient?.state?.trim() || data.destination_state || "";

      const payload: any = {
        customer_id: data.customer_id || null,
        responsavel: data.responsavel || null,
        contato: data.contato || null,
        service_transporte: data.service_transporte,
        service_munck: data.service_munck,
        service_carregamento: data.service_carregamento,
        service_descarga: data.service_descarga,
        service_type: buildServiceTypeString(),
        origin_city: data.origin_city || null,
        origin_state: data.origin_state || null,
        destination_city: legacyDestCity || null,
        destination_state: legacyDestState || null,
        product_id: data.product_id || null,
        freight_value: data.service_transporte ? parseFloat(data.freight_value) || 0 : 0,
        munck_value: data.service_munck ? parseFloat(data.munck_value) || 0 : 0,
        carregamento_value: data.service_carregamento ? parseFloat(data.carregamento_value) || 0 : 0,
        descarga_value: data.service_descarga ? parseFloat(data.descarga_value) || 0 : 0,
        carga_responsavel: data.carga_responsavel || null,
        descarga_responsavel: data.descarga_responsavel || null,
        vehicle_type_id: data.vehicle_type_id || null,
        body_type_id: data.body_type_id || null,
        freight_mode: data.service_transporte ? (data.freight_mode || null) : null,
        weight_kg: data.service_transporte && data.freight_mode === "per_ton"
          ? (parseFloat(data.weight_kg) || 0)
          : null,
        delivery_days: parseInt(data.delivery_days) || 0,
        quote_validity_days: parseInt(data.quote_validity_days) || 15,
        payment_term_days: parseInt(data.payment_term_days) || 30,
        observations: data.observations || null,
        payment_method: data.payment_method || null,
        status: "active",
      };

      let quoteId: string;
      if (editingQuote) {
        const { error } = await supabase
          .from("quotes")
          .update(payload)
          .eq("id", editingQuote.id);
        if (error) throw error;
        quoteId = editingQuote.id;
      } else {
        const { data: inserted, error } = await supabase
          .from("quotes")
          .insert([payload])
          .select("id")
          .single();
        if (error) throw error;
        quoteId = inserted.id;
      }

      // Replace recipients: delete existing then insert new
      await (supabase as any)
        .from("quote_recipients")
        .delete()
        .eq("quote_id", quoteId);

      const recipientRows = (data.recipients || [])
        .filter(r => (r.name || r.cpf_cnpj || r.address || r.city || r.state || r.cep || r.phone).toString().trim() !== "")
        .map((r, idx) => ({
          quote_id: quoteId,
          position: idx,
          name: r.name || null,
          cpf_cnpj: r.cpf_cnpj || null,
          phone: r.phone || null,
          address: r.address || null,
          city: r.city || null,
          state: r.state || null,
          cep: r.cep || null,
        }));

      if (recipientRows.length > 0) {
        const { error: recError } = await (supabase as any)
          .from("quote_recipients")
          .insert(recipientRows);
        if (recError) throw recError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success(editingQuote ? "Proposta atualizada!" : "Proposta salva!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar proposta");
    },
  });


  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Proposta removida!");
    },
    onError: () => {
      toast.error("Erro ao remover proposta");
    },
  });

  const handleCustomerCreated = (customerId: string) => {
    setFormData({ ...formData, customer_id: customerId });
  };

  // Quick-add mutations
  const addProductMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("products")
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setFormData(prev => ({ ...prev, product_id: data.id }));
      setNewProductName("");
      setProductDialogOpen(false);
      toast.success("Produto cadastrado!");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao cadastrar produto");
    },
  });

  const addVehicleTypeMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("vehicle_types")
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicle_types"] });
      setFormData(prev => ({ ...prev, vehicle_type_id: data.id }));
      setNewVehicleTypeName("");
      setVehicleTypeDialogOpen(false);
      toast.success("Tipo de veículo cadastrado!");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao cadastrar tipo de veículo");
    },
  });

  const addBodyTypeMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("body_types")
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["body_types"] });
      setFormData(prev => ({ ...prev, body_type_id: data.id }));
      setNewBodyTypeName("");
      setBodyTypeDialogOpen(false);
      toast.success("Tipo de carroceria cadastrado!");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao cadastrar tipo de carroceria");
    },
  });

  const resetForm = () => {
    setFormData({
      customer_id: "",
      responsavel: "",
      contato: "",
      service_transporte: false,
      service_munck: false,
      service_carregamento: false,
      service_descarga: false,
      origin_city: "",
      origin_state: "",
      destination_city: "",
      destination_state: "",
      product_id: "",
      freight_value: "",
      munck_value: "",
      carregamento_value: "",
      descarga_value: "",
      carga_responsavel: "",
      descarga_responsavel: "",
      vehicle_type_id: "",
      body_type_id: "",
      freight_mode: "",
      weight_kg: "",
      delivery_days: "0",
      quote_validity_days: "15",
      payment_term_days: "30",
      observations: "",
      payment_method: "",
      recipients: [emptyRecipient()],
    });
    setEditingQuote(null);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // At least one service must be selected
    if (!formData.service_transporte && !formData.service_munck && !formData.service_carregamento && !formData.service_descarga) {
      toast.error("Selecione pelo menos um tipo de serviço");
      return;
    }

    // Validate recipients: at least one with a name
    const validRecipients = (formData.recipients || []).filter(r => r.name?.trim());
    if (validRecipients.length === 0) {
      toast.error("Informe pelo menos um destinatário com nome");
      return;
    }

    if (formData.service_transporte) {
      if (!formData.origin_city) {
        toast.error("Origem é obrigatória para Transporte");
        return;
      }
      const firstCity = formData.recipients?.[0]?.city?.trim();
      if (!firstCity) {
        toast.error("Informe a cidade do primeiro destinatário para Transporte");
        return;
      }
      if (!formData.freight_mode) {
        toast.error("Selecione o tipo de frete: P/Ton ou Fechado");
        return;
      }
      if (formData.freight_mode === "per_ton" && (!formData.weight_kg || parseFloat(formData.weight_kg) <= 0)) {
        toast.error("Informe o Peso (KG) para frete P/Ton");
        return;
      }
    }


    saveQuoteMutation.mutate(formData);
  };

  const handleEdit = async (quote: Quote) => {
    setEditingQuote(quote);

    // Load recipients for this quote
    const { data: recipientsData } = await (supabase as any)
      .from("quote_recipients")
      .select("*")
      .eq("quote_id", quote.id)
      .order("position", { ascending: true });

    let recipients: QuoteRecipient[] = (recipientsData || []).map((r: any) => ({
      name: r.name || "",
      cpf_cnpj: r.cpf_cnpj || "",
      phone: r.phone || "",
      address: r.address || "",
      city: r.city || "",
      state: r.state || "",
      cep: r.cep || "",
    }));

    // Fallback for legacy quotes: build first recipient from legacy destination fields
    if (recipients.length === 0) {
      recipients = [{
        ...emptyRecipient(),
        city: quote.destination_city || "",
        state: quote.destination_state || "",
      }];
    }

    setFormData({
      customer_id: quote.customer_id || "",
      responsavel: quote.responsavel || "",
      contato: quote.contato || "",
      service_transporte: quote.service_transporte ?? (quote.service_type === "transporte"),
      service_munck: quote.service_munck ?? (quote.service_type === "munck"),
      service_carregamento: quote.service_carregamento ?? false,
      service_descarga: quote.service_descarga ?? false,
      origin_city: quote.origin_city || "",
      origin_state: quote.origin_state || "",
      destination_city: quote.destination_city || "",
      destination_state: quote.destination_state || "",
      product_id: quote.product_id || "",
      freight_value: quote.freight_value?.toString() || "",
      munck_value: quote.munck_value?.toString() || "",
      carregamento_value: (quote.carregamento_value || 0)?.toString() || "",
      descarga_value: (quote.descarga_value || 0)?.toString() || "",
      carga_responsavel: quote.carga_responsavel || "",
      descarga_responsavel: quote.descarga_responsavel || "",
      vehicle_type_id: quote.vehicle_type_id || "",
      body_type_id: quote.body_type_id || "",
      freight_mode: quote.freight_mode || "",
      weight_kg: quote.weight_kg != null ? quote.weight_kg.toString() : "",
      delivery_days: quote.delivery_days?.toString() || "0",
      quote_validity_days: quote.quote_validity_days?.toString() || "15",
      payment_term_days: quote.payment_term_days?.toString() || "30",
      observations: quote.observations || "",
      payment_method: quote.payment_method || "",
      recipients,
    });
    setIsDialogOpen(true);
  };

  const handleView = async (quote: Quote) => {
    // Load recipients for printing
    const { data: recipientsData } = await (supabase as any)
      .from("quote_recipients")
      .select("*")
      .eq("quote_id", quote.id)
      .order("position", { ascending: true });

    const recipients: QuoteRecipient[] = (recipientsData || []).map((r: any) => ({
      name: r.name || "",
      cpf_cnpj: r.cpf_cnpj || "",
      phone: r.phone || "",
      address: r.address || "",
      city: r.city || "",
      state: r.state || "",
      cep: r.cep || "",
    }));

    setViewingQuote({ ...quote, recipients });
    setIsPrintDialogOpen(true);
  };



  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Proposta Comercial</title>
              <style>
                @page { margin: 15mm; size: A4; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .print-container { max-width: 800px; margin: 0 auto; }
                .header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                .logo { max-width: 150px; max-height: 80px; }
                .company-info { flex: 1; }
                .company-name { font-size: 18px; font-weight: bold; }
                .company-details { font-size: 12px; color: #555; margin-top: 5px; }
                .title { text-align: center; font-size: 24px; font-weight: bold; margin: 30px 0; }
                .quote-number { text-align: right; font-size: 14px; margin-bottom: 20px; }
                .section { margin-bottom: 20px; }
                .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                .field { display: flex; margin-bottom: 8px; }
                .field-label { font-weight: bold; width: 180px; font-size: 13px; }
                .field-value { flex: 1; font-size: 13px; }
                .signature { margin-top: 60px; text-align: center; }
                .signature-line { border-top: 1px solid #000; width: 300px; margin: 0 auto 10px; }
                .signature-text { font-size: 14px; }
                .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #666; }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir esta proposta?")) {
      deleteQuoteMutation.mutate(id);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatCnpj = (value: string | null) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  };

  const hasAnyService = formData.service_transporte || formData.service_munck || formData.service_carregamento || formData.service_descarga;

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Cotação / Proposta Comercial
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gerencie propostas comerciais para clientes
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Nova Proposta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuote ? "Editar Proposta" : "Nova Proposta Comercial"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cliente */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label>Cliente</Label>
                    <CustomerSearchSelect
                      customers={customers}
                      value={formData.customer_id}
                      onChange={(id) => setFormData({ ...formData, customer_id: id })}
                    />
                  </div>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon" 
                    className="mt-6"
                    onClick={() => setCustomerDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <CustomerFormDialog
                  open={customerDialogOpen}
                  onOpenChange={setCustomerDialogOpen}
                  onSuccess={handleCustomerCreated}
                />
                {formData.customer_id && (
                  <p className="text-sm text-muted-foreground">
                    CNPJ:{" "}
                    {formatCnpj(
                      customers.find((c) => c.id === formData.customer_id)
                        ?.cpf_cnpj || ""
                    )}
                  </p>
                )}
              </div>

              {/* Responsável e Contato */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel}
                    onChange={(e) =>
                      setFormData({ ...formData, responsavel: e.target.value })
                    }
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contato">Contato</Label>
                  <Input
                    id="contato"
                    value={formData.contato}
                    onChange={(e) =>
                      setFormData({ ...formData, contato: e.target.value })
                    }
                    placeholder="Telefone ou email"
                  />
                </div>
              </div>

              {/* Tipo de Serviço - Checkboxes */}
              <div className="space-y-3">
                <Label>Tipo de Serviço <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="service_transporte"
                      checked={formData.service_transporte}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, service_transporte: !!checked })
                      }
                    />
                    <Label htmlFor="service_transporte" className="font-normal cursor-pointer">
                      Transporte
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="service_munck"
                      checked={formData.service_munck}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, service_munck: !!checked })
                      }
                    />
                    <Label htmlFor="service_munck" className="font-normal cursor-pointer">
                      Munck
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="service_carregamento"
                      checked={formData.service_carregamento}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, service_carregamento: !!checked })
                      }
                    />
                    <Label htmlFor="service_carregamento" className="font-normal cursor-pointer">
                      Carregamento
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="service_descarga"
                      checked={formData.service_descarga}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, service_descarga: !!checked })
                      }
                    />
                    <Label htmlFor="service_descarga" className="font-normal cursor-pointer">
                      Descarga
                    </Label>
                  </div>
                </div>
              </div>

              {/* Modalidade de Frete (somente Transporte) */}
              {formData.service_transporte && (
                <div className="space-y-3">
                  <Label>Modalidade de Frete <span className="text-destructive">*</span></Label>
                  <RadioGroup
                    value={formData.freight_mode}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        freight_mode: value,
                        weight_kg: value === "per_ton" ? formData.weight_kg : "",
                      })
                    }
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="per_ton" id="freight_per_ton" />
                      <Label htmlFor="freight_per_ton" className="font-normal cursor-pointer">
                        Frete P/Ton
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="closed" id="freight_closed" />
                      <Label htmlFor="freight_closed" className="font-normal cursor-pointer">
                        Frete Fechado
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Origem{" "}
                  {formData.service_transporte && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.origin_city}
                    onChange={(e) =>
                      setFormData({ ...formData, origin_city: e.target.value })
                    }
                    placeholder="Cidade"
                    className="flex-1"
                  />
                  <Input
                    value={formData.origin_state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        origin_state: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="UF"
                    maxLength={2}
                    className="w-16"
                  />
                </div>
              </div>

              {/* Destinatários (multi) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>
                    Destinatários <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      recipients: [...(prev.recipients || []), emptyRecipient()],
                    }))}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adicionar destinatário
                  </Button>
                </div>
                <Accordion
                  type="multiple"
                  defaultValue={["recipient-0"]}
                  className="border rounded-md bg-muted/30 px-3"
                >
                  {(formData.recipients || []).map((rec, idx) => (
                    <AccordionItem key={idx} value={`recipient-${idx}`} className="border-b last:border-b-0">
                      <div className="flex items-center gap-2">
                        <AccordionTrigger className="flex-1 hover:no-underline">
                          <span className="text-sm font-medium text-left">
                            #{idx + 1} — {rec.name?.trim() || "Sem nome"}
                            {(rec.city || rec.state) && (
                              <span className="text-muted-foreground font-normal">
                                {" "}({[rec.city, rec.state].filter(Boolean).join("/")})
                              </span>
                            )}
                          </span>
                        </AccordionTrigger>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          disabled={(formData.recipients?.length || 0) <= 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({
                              ...prev,
                              recipients: (prev.recipients || []).filter((_, i) => i !== idx),
                            }));
                          }}
                          title="Remover destinatário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          <div className="md:col-span-2">
                            <Label className="text-xs">Nome / Razão Social</Label>
                            <Input
                              value={rec.name}
                              onChange={(e) => setFormData(prev => {
                                const recipients = [...(prev.recipients || [])];
                                recipients[idx] = { ...recipients[idx], name: e.target.value };
                                return { ...prev, recipients };
                              })}
                              placeholder="Nome do destinatário"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">CPF / CNPJ</Label>
                            <Input
                              value={rec.cpf_cnpj}
                              onChange={(e) => setFormData(prev => {
                                const recipients = [...(prev.recipients || [])];
                                recipients[idx] = { ...recipients[idx], cpf_cnpj: formatCpfCnpj(e.target.value) };
                                return { ...prev, recipients };
                              })}
                              placeholder="000.000.000-00 / 00.000.000/0000-00"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Telefone</Label>
                            <Input
                              value={rec.phone}
                              onChange={(e) => setFormData(prev => {
                                const recipients = [...(prev.recipients || [])];
                                recipients[idx] = { ...recipients[idx], phone: formatPhone(e.target.value) };
                                return { ...prev, recipients };
                              })}
                              placeholder="(00) 00000-0000"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs">Endereço</Label>
                            <Input
                              value={rec.address}
                              onChange={(e) => setFormData(prev => {
                                const recipients = [...(prev.recipients || [])];
                                recipients[idx] = { ...recipients[idx], address: e.target.value };
                                return { ...prev, recipients };
                              })}
                              placeholder="Rua, número, bairro"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2 md:col-span-2">
                            <div className="col-span-2">
                              <Label className="text-xs">
                                Cidade {idx === 0 && formData.service_transporte && (<span className="text-destructive">*</span>)}
                              </Label>
                              <Input
                                value={rec.city}
                                onChange={(e) => setFormData(prev => {
                                  const recipients = [...(prev.recipients || [])];
                                  recipients[idx] = { ...recipients[idx], city: e.target.value };
                                  return { ...prev, recipients };
                                })}
                                placeholder="Cidade"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">UF</Label>
                              <Select
                                value={rec.state || "__none__"}
                                onValueChange={(v) => setFormData(prev => {
                                  const recipients = [...(prev.recipients || [])];
                                  recipients[idx] = { ...recipients[idx], state: v === "__none__" ? "" : v };
                                  return { ...prev, recipients };
                                })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="UF" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">-</SelectItem>
                                  {BRAZILIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">CEP</Label>
                            <Input
                              value={rec.cep}
                              onChange={(e) => setFormData(prev => {
                                const recipients = [...(prev.recipients || [])];
                                recipients[idx] = { ...recipients[idx], cep: formatCep(e.target.value) };
                                return { ...prev, recipients };
                              })}
                              placeholder="00000-000"
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>


              {/* Produto */}
              <div className="space-y-2">
                <Label>Produto</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={formData.product_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, product_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setProductDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Peso (KG) - somente quando Frete P/Ton */}
              {formData.service_transporte && formData.freight_mode === "per_ton" && (
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Peso (KG) <span className="text-destructive">*</span></Label>
                  <Input
                    id="weight_kg"
                    type="text"
                    inputMode="decimal"
                    value={
                      formData.weight_kg === ""
                        ? ""
                        : (parseFloat(formData.weight_kg) || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                    }
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      if (!digits) {
                        setFormData({ ...formData, weight_kg: "" });
                        return;
                      }
                      const numeric = (parseInt(digits, 10) / 100).toFixed(2);
                      setFormData({ ...formData, weight_kg: numeric });
                    }}
                    placeholder="0,00"
                    required
                  />
                </div>
              )}

              {hasAnyService && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Valores</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formData.service_transporte && (
                      <div className="space-y-2">
                        <Label htmlFor="freight_value">
                          {formData.freight_mode === "per_ton" ? "Valor de Frete (R$/Ton)" : "Valor de Frete (R$)"}
                        </Label>
                        <Input
                          id="freight_value"
                          type="text"
                          inputMode="decimal"
                          value={formatBR(formData.freight_value)}
                          onChange={handleCurrencyChange("freight_value")}
                          placeholder="0,00"
                        />
                        {formData.freight_mode === "per_ton" && (
                          <p className="text-xs text-muted-foreground">
                            Subtotal Transporte: {formatCurrency(computeTransportValue())}
                          </p>
                        )}
                      </div>
                    )}
                    {formData.service_munck && (
                      <div className="space-y-2">
                        <Label htmlFor="munck_value">Valor de Serviço de Munck (R$)</Label>
                        <Input
                          id="munck_value"
                          type="text"
                          inputMode="decimal"
                          value={formatBR(formData.munck_value)}
                          onChange={handleCurrencyChange("munck_value")}
                          placeholder="0,00"
                        />
                      </div>
                    )}
                    {formData.service_carregamento && (
                      <div className="space-y-2">
                        <Label htmlFor="carregamento_value">Valor de Carregamento (R$)</Label>
                        <Input
                          id="carregamento_value"
                          type="text"
                          inputMode="decimal"
                          value={formatBR(formData.carregamento_value)}
                          onChange={handleCurrencyChange("carregamento_value")}
                          placeholder="0,00"
                        />
                      </div>
                    )}
                    {formData.service_descarga && (
                      <div className="space-y-2">
                        <Label htmlFor="descarga_value">Valor de Descarga (R$)</Label>
                        <Input
                          id="descarga_value"
                          type="text"
                          inputMode="decimal"
                          value={formatBR(formData.descarga_value)}
                          onChange={handleCurrencyChange("descarga_value")}
                          placeholder="0,00"
                        />
                      </div>
                    )}
                  </div>
                  {/* Total */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-bold text-sm">VALOR TOTAL:</span>
                    <span className="font-bold text-lg">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              )}

              {/* Responsabilidade - Carga e Descarga */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Responsabilidade</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Carga */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="carga_check"
                        checked={!!formData.carga_responsavel}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            carga_responsavel: checked ? "contratante" : "",
                          })
                        }
                      />
                      <Label htmlFor="carga_check" className="font-normal cursor-pointer">
                        Carga
                      </Label>
                    </div>
                    {formData.carga_responsavel && (
                      <RadioGroup
                        value={formData.carga_responsavel}
                        onValueChange={(value) =>
                          setFormData({ ...formData, carga_responsavel: value })
                        }
                        className="ml-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="contratante" id="carga_contratante" />
                          <Label htmlFor="carga_contratante" className="font-normal cursor-pointer text-sm">
                            Por Conta do Contratante
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="contratado" id="carga_contratado" />
                          <Label htmlFor="carga_contratado" className="font-normal cursor-pointer text-sm">
                            Por Conta do Contratado
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  </div>

                  {/* Descarga */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="descarga_check"
                        checked={!!formData.descarga_responsavel}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            descarga_responsavel: checked ? "contratante" : "",
                          })
                        }
                      />
                      <Label htmlFor="descarga_check" className="font-normal cursor-pointer">
                        Descarga
                      </Label>
                    </div>
                    {formData.descarga_responsavel && (
                      <RadioGroup
                        value={formData.descarga_responsavel}
                        onValueChange={(value) =>
                          setFormData({ ...formData, descarga_responsavel: value })
                        }
                        className="ml-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="contratante" id="descarga_contratante" />
                          <Label htmlFor="descarga_contratante" className="font-normal cursor-pointer text-sm">
                            Por Conta do Contratante
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="contratado" id="descarga_contratado" />
                          <Label htmlFor="descarga_contratado" className="font-normal cursor-pointer text-sm">
                            Por Conta do Contratado
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                </div>
              </div>

              {/* Tipo de Veículo e Carroceria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Veículo</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={formData.vehicle_type_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, vehicle_type_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tipo de veículo" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setVehicleTypeDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Carroceria</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={formData.body_type_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, body_type_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma carroceria" />
                        </SelectTrigger>
                        <SelectContent>
                          {bodyTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setBodyTypeDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Prazos e Validade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Prazo de Entrega (dias)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="365"
                    value={formData.delivery_days}
                    onChange={(e) =>
                      setFormData({ ...formData, delivery_days: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Validade da Proposta (dias)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.quote_validity_days}
                    onChange={(e) =>
                      setFormData({ ...formData, quote_validity_days: e.target.value })
                    }
                    placeholder="15"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prazo de Pagamento (dias)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="365"
                    value={formData.payment_term_days}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_term_days: e.target.value })
                    }
                    placeholder="30"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) =>
                    setFormData({ ...formData, observations: e.target.value })
                  }
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payment_method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.id} value={pm.name}>
                        {pm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveQuoteMutation.isPending}>
                  {saveQuoteMutation.isPending
                    ? "Salvando..."
                    : "Salvar Proposta"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por cliente ou número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Propostas Comerciais</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "Nenhuma proposta encontrada"
                : "Nenhuma proposta cadastrada"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Origem/Destino</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">
                        {quote.quote_number}
                      </TableCell>
                      <TableCell>{quote.customer?.name || "-"}</TableCell>
                      <TableCell>
                        {getServiceDisplay(quote)}
                      </TableCell>
                      <TableCell>
                        {quote.origin_city && quote.destination_city
                          ? `${quote.origin_city}/${quote.origin_state} → ${quote.destination_city}/${quote.destination_state}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(getQuoteTotal(quote))}
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(quote.created_at),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(quote)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(quote)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(quote.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Visualizar Proposta</span>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimir PDF
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div ref={printRef}>
            {viewingQuote && (
              <QuotePrintView
                quote={viewingQuote}
                companySettings={companySettings}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick-add Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_product_name">Nome do Produto *</Label>
              <Input
                id="new_product_name"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Nome do produto"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewProductName("");
                  setProductDialogOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (newProductName.trim()) {
                    addProductMutation.mutate(newProductName.trim());
                  } else {
                    toast.error("Nome do produto é obrigatório");
                  }
                }}
                disabled={addProductMutation.isPending}
              >
                {addProductMutation.isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick-add Vehicle Type Dialog */}
      <Dialog open={vehicleTypeDialogOpen} onOpenChange={setVehicleTypeDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Tipo de Veículo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_vehicle_type_name">Nome do Tipo *</Label>
              <Input
                id="new_vehicle_type_name"
                value={newVehicleTypeName}
                onChange={(e) => setNewVehicleTypeName(e.target.value)}
                placeholder="Ex: Carreta, Truck, Toco..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewVehicleTypeName("");
                  setVehicleTypeDialogOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (newVehicleTypeName.trim()) {
                    addVehicleTypeMutation.mutate(newVehicleTypeName.trim());
                  } else {
                    toast.error("Nome do tipo de veículo é obrigatório");
                  }
                }}
                disabled={addVehicleTypeMutation.isPending}
              >
                {addVehicleTypeMutation.isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick-add Body Type Dialog */}
      <Dialog open={bodyTypeDialogOpen} onOpenChange={setBodyTypeDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Tipo de Carroceria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_body_type_name">Nome do Tipo *</Label>
              <Input
                id="new_body_type_name"
                value={newBodyTypeName}
                onChange={(e) => setNewBodyTypeName(e.target.value)}
                placeholder="Ex: Baú, Sider, Graneleira..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewBodyTypeName("");
                  setBodyTypeDialogOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (newBodyTypeName.trim()) {
                    addBodyTypeMutation.mutate(newBodyTypeName.trim());
                  } else {
                    toast.error("Nome do tipo de carroceria é obrigatório");
                  }
                }}
                disabled={addBodyTypeMutation.isPending}
              >
                {addBodyTypeMutation.isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
