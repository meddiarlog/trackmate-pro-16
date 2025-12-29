import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Plus, Eye, Edit, Trash2, Download, FileText, Search, CheckCircle, Upload, RefreshCw, ExternalLink, MoreVertical, ChevronDown, Calendar } from "lucide-react";
import { FilterableTable, FilterableColumn } from "@/components/ui/filterable-table";
import { useTableFilters } from "@/hooks/useTableFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkCteImportDialog } from "@/components/BulkCteImportDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
}

interface CTE {
  id: string;
  cte_number: string;
  doc_number?: string;
  issue_date: string;
  origin: string;
  destination: string;
  value: number;
  weight?: number;
  product_description?: string;
  sender_name?: string;
  sender_cnpj?: string;
  sender_address?: string;
  recipient_name?: string;
  recipient_cnpj?: string;
  recipient_address?: string;
  driver_name?: string;
  vehicle_plate?: string;
  freight_value?: number;
  net_value?: number;
  pdf_url?: string;
  cfop?: string;
  tomador_id?: string;
  tomador?: Customer;
}

const MAX_PDF_SIZE_MB = 10;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

interface CTETableData extends CTE {
  formattedDate: string;
  formattedValue: string;
  tomadorName: string;
  docNumberDisplay: string;
  issueDateObj: Date;
}

interface CTEFilterableTableProps {
  ctes: CTE[];
  isLoading: boolean;
  handleView: (cte: CTE) => void;
  handleViewPdf: (cte: CTE) => void;
  handleDownloadPdf: (cte: CTE) => void;
  handleEdit: (cte: CTE) => void;
  deleteCTEMutation: any;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

function CTEFilterableTable({
  ctes,
  isLoading,
  handleView,
  handleViewPdf,
  handleDownloadPdf,
  handleEdit,
  deleteCTEMutation,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: CTEFilterableTableProps) {
  const transformedData: CTETableData[] = useMemo(() => {
    return ctes.map((cte) => {
      // Append T00:00:00 to force local timezone interpretation
      const issueDateStr = cte.issue_date.includes('T') ? cte.issue_date : `${cte.issue_date}T00:00:00`;
      const issueDateObj = new Date(issueDateStr);
      
      return {
        ...cte,
        formattedDate: format(issueDateObj, "dd/MM/yyyy", { locale: ptBR }),
        formattedValue: `R$ ${cte.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        tomadorName: (cte as any).tomador?.name || "-",
        docNumberDisplay: (cte as any).doc_number || "-",
        issueDateObj,
      };
    });
  }, [ctes]);

  // Apply date filter based on issue_date (Data de Emissão)
  const dateFilteredData = useMemo(() => {
    return transformedData.filter((cte) => {
      const issueDate = cte.issueDateObj;
      
      if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        if (issueDate < startOfDay) return false;
      }
      
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (issueDate > endOfDay) return false;
      }
      
      return true;
    });
  }, [transformedData, startDate, endDate]);

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
  } = useTableFilters(dateFilteredData, [
    'cte_number', 'origin', 'destination', 'sender_name', 'tomadorName', 'docNumberDisplay', 'formattedDate'
  ]);

  // Calculate total value of filtered CTEs
  const totalValue = useMemo(() => {
    return filteredData.reduce((sum, cte) => sum + (cte.value || 0), 0);
  }, [filteredData]);

  const handleClearAllFilters = () => {
    clearAllFilters();
    onStartDateChange(undefined);
    onEndDateChange(undefined);
  };

  const columns: FilterableColumn<CTETableData>[] = [
    { key: 'cte_number', header: 'Número', sortable: true, filterable: true },
    { key: 'docNumberDisplay', header: 'Doc.', sortable: true, filterable: true },
    { key: 'formattedDate', header: 'Data', sortable: true, filterable: true },
    { key: 'origin', header: 'Origem', sortable: true, filterable: true },
    { key: 'destination', header: 'Destino', sortable: true, filterable: true },
    { key: 'sender_name', header: 'Remetente', sortable: true, filterable: true,
      render: (item) => item.sender_name || "-" },
    { key: 'tomadorName', header: 'Tomador', sortable: true, filterable: true },
    { key: 'formattedValue', header: 'Valor', sortable: true, filterable: false,
      render: (item) => <span className="text-right block">{item.formattedValue}</span> },
    { key: 'pdf_url', header: 'PDF', sortable: false, filterable: false,
      render: (item) => item.pdf_url ? (
        <Badge 
          variant="outline" 
          className="bg-success/10 text-success border-success/20 cursor-pointer hover:bg-success/20"
          onClick={() => handleViewPdf(item)}
        >
          <FileText className="h-3 w-3 mr-1" />
          Anexado
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          Sem PDF
        </Badge>
      )
    },
    { key: 'id', header: 'Ações', sortable: false, filterable: false,
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleView(item)}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
            {item.pdf_url && (
              <>
                <DropdownMenuItem onClick={() => handleViewPdf(item)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visualizar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadPdf(item)}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleEdit(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => deleteCTEMutation.mutate(item.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ctes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Nenhum CT-e cadastrado. Clique em "Novo CT-e" para adicionar.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CT-es Disponíveis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date filters */}
        <div className="flex flex-wrap gap-4 items-end pb-4 border-b">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={onStartDateChange}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={onEndDateChange}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onStartDateChange(undefined);
                onEndDateChange(undefined);
              }}
            >
              Limpar datas
            </Button>
          )}
        </div>

        <FilterableTable
          data={filteredData}
          columns={columns}
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
          columnFilters={columnFilters}
          onColumnFilterChange={updateColumnFilter}
          sortConfig={sortConfig}
          onSort={toggleSort}
          onClearFilters={handleClearAllFilters}
          hasActiveFilters={hasActiveFilters || !!startDate || !!endDate}
          totalCount={totalCount}
          filteredCount={filteredCount}
          keyExtractor={(item) => item.id}
          emptyMessage="Nenhum CT-e encontrado."
        />

        {/* Total value footer */}
        <div className="flex justify-between items-center pt-4 border-t bg-muted/50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredCount} de {ctes.length} CT-e(s)
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground mr-2">Total dos CT-e filtrados:</span>
            <span className="text-lg font-bold text-primary">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function CTE() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [editingCte, setEditingCte] = useState<string | null>(null);
  const [selectedCte, setSelectedCte] = useState<CTE | null>(null);
  const [importedFromKey, setImportedFromKey] = useState(false);

  // Date filter states
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Form states
  const [accessKey, setAccessKey] = useState("");
  const [isLoadingAccessKey, setIsLoadingAccessKey] = useState(false);
  const [isExtractingFromPdf, setIsExtractingFromPdf] = useState(false);
  const [cteNumber, setCteNumber] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [tomadorId, setTomadorId] = useState("");
  const [cteSerie, setCteSerie] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [value, setValue] = useState("");
  const [weight, setWeight] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [modalTransporte, setModalTransporte] = useState("");
  
  // Emitente (dados do emitente do CT-e)
  const [emitenteName, setEmitenteName] = useState("");
  const [emitenteCnpj, setEmitenteCnpj] = useState("");
  const [emitenteAddress, setEmitenteAddress] = useState("");
  
  // Remetente
  const [senderName, setSenderName] = useState("");
  const [senderCnpj, setSenderCnpj] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  
  // Destinatário
  const [recipientName, setRecipientName] = useState("");
  const [recipientCnpj, setRecipientCnpj] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  
  // Transporte
  const [driverName, setDriverName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [freightValue, setFreightValue] = useState("");
  
  // PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch CTEs
  const { data: ctes = [], isLoading } = useQuery({
    queryKey: ["ctes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ctes")
        .select(`*, tomador:customers(id, name)`)
        .is("contract_id", null)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data as CTE[];
    },
  });

  // Fetch customers for Tomador select
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-tomador"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Customer[];
    },
  });

  const resetForm = () => {
    setAccessKey("");
    setCteNumber("");
    setDocNumber("");
    setTomadorId("");
    setCteSerie("");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setOrigin("");
    setDestination("");
    setValue("");
    setWeight("");
    setProductDescription("");
    setModalTransporte("");
    setEmitenteName("");
    setEmitenteCnpj("");
    setEmitenteAddress("");
    setSenderName("");
    setSenderCnpj("");
    setSenderAddress("");
    setRecipientName("");
    setRecipientCnpj("");
    setRecipientAddress("");
    setDriverName("");
    setVehiclePlate("");
    setFreightValue("");
    setPdfFile(null);
    setEditingCte(null);
    setImportedFromKey(false);
    setExistingPdfUrl(null);
  };

  const handleAccessKeySearch = async () => {
    if (!accessKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe a chave de acesso",
        variant: "destructive",
      });
      return;
    }

    const cleanedKey = accessKey.replace(/\D/g, '');
    
    if (cleanedKey.length !== 44) {
      toast({
        title: "Chave inválida",
        description: "A chave de acesso deve conter exatamente 44 dígitos numéricos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAccessKey(true);
    try {
      toast({
        title: "Importando dados...",
        description: "Buscando informações do CT-e",
      });

      const { data, error } = await supabase.functions.invoke('fetch-cte', {
        body: { chaveAcesso: accessKey }
      });

      if (error) throw error;

      if (data && !data.error) {
        // Preencher dados básicos
        setCteNumber(data.numeroCte || "");
        setCteSerie(data.serie || "");
        setIssueDate(data.dataEmissao || new Date().toISOString().split("T")[0]);
        setOrigin(data.origem || "");
        setModalTransporte(data.modalTransporte || "Rodoviário");
        
        // Dados do emitente (transportadora que emitiu o CT-e)
        setEmitenteName(data.razaoSocialEmitente || "");
        setEmitenteCnpj(data.cnpjEmitente || "");
        setEmitenteAddress(data.enderecoEmitente ? `${data.enderecoEmitente} - ${data.municipioEmitente}/${data.ufEmitente}` : "");
        
        // Remetente e Destinatário - NÃO preencher com dados do emitente
        // O emitente é a transportadora, não o remetente da carga
        // O usuário deve preencher manualmente ou através de consulta CNPJ

        setImportedFromKey(true);

        toast({
          title: "CT-e encontrada e importada com sucesso!",
          description: `Número: ${data.numeroCte} | Série: ${data.serie}`,
        });
      } else {
        throw new Error(data?.error || "Dados não encontrados");
      }
    } catch (error: any) {
      toast({
        title: "CT-e não encontrada",
        description: error.message || "Chave inválida ou CT-e não encontrada. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAccessKey(false);
    }
  };

  const handlePdfExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validatePdfFile(file)) {
      e.target.value = '';
      return;
    }

    setIsExtractingFromPdf(true);
    setPdfFile(file);

    try {
      toast({
        title: "Processando PDF...",
        description: "Extraindo dados do documento CT-e",
      });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-cte-pdf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (response.status === 429) {
        toast({
          title: "Limite excedido",
          description: "Muitas requisições. Aguarde alguns segundos e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (response.status === 402) {
        toast({
          title: "Créditos insuficientes",
          description: "Entre em contato com o suporte para adicionar créditos.",
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erro ao processar PDF');
      }

      const data = result.data;
      
      // Preencher todos os campos extraídos
      if (data.chaveAcesso) setAccessKey(data.chaveAcesso);
      if (data.numeroCte) setCteNumber(data.numeroCte);
      if (data.serie) setCteSerie(data.serie);
      if (data.dataEmissao) setIssueDate(data.dataEmissao);
      if (data.origem) setOrigin(data.origem);
      if (data.destino) setDestination(data.destino);
      if (data.modalTransporte) setModalTransporte(data.modalTransporte);
      if (data.valorTotal) setValue(data.valorTotal.toString());
      if (data.valorFrete) setFreightValue(data.valorFrete.toString());
      if (data.peso) setWeight(data.peso.toString());
      if (data.produtoDescricao) setProductDescription(data.produtoDescricao);
      
      // Emitente
      if (data.emitenteNome) setEmitenteName(data.emitenteNome);
      if (data.emitenteCnpj) setEmitenteCnpj(data.emitenteCnpj);
      if (data.emitenteEndereco) setEmitenteAddress(data.emitenteEndereco);
      
      // Remetente
      if (data.remetenteNome) setSenderName(data.remetenteNome);
      if (data.remetenteCnpj) setSenderCnpj(data.remetenteCnpj);
      if (data.remetenteEndereco) setSenderAddress(data.remetenteEndereco);
      
      // Destinatário
      if (data.destinatarioNome) setRecipientName(data.destinatarioNome);
      if (data.destinatarioCnpj) setRecipientCnpj(data.destinatarioCnpj);
      if (data.destinatarioEndereco) setRecipientAddress(data.destinatarioEndereco);
      
      // Transporte
      if (data.motoristaNome) setDriverName(data.motoristaNome);
      if (data.placaVeiculo) setVehiclePlate(data.placaVeiculo);

      setImportedFromKey(true);

      toast({
        title: "Dados extraídos com sucesso!",
        description: `CT-e ${data.numeroCte || ''} - Verifique e complete as informações.`,
      });
    } catch (error: any) {
      console.error('Error extracting CTE from PDF:', error);
      toast({
        title: "Erro ao extrair dados",
        description: error.message || "Não foi possível extrair os dados do PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingFromPdf(false);
      e.target.value = '';
    }
  };

  const validatePdfFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${MAX_PDF_SIZE_MB}MB.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validatePdfFile(file)) {
      setPdfFile(file);
    } else {
      e.target.value = '';
    }
  };

  const uploadPdf = async (): Promise<string | null> => {
    if (!pdfFile) return null;

    const fileExt = pdfFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `ctes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('cte-pdfs')
      .upload(filePath, pdfFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('cte-pdfs')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // Create/Update CTE mutation
  const saveCTEMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      
      let pdfUrl: string | null = existingPdfUrl;
      if (pdfFile) {
        pdfUrl = await uploadPdf();
      }

      const cteData: any = {
        cte_number: cteNumber.padStart(6, '0').slice(0, 6),
        doc_number: docNumber || null,
        tomador_id: tomadorId || null,
        issue_date: issueDate,
        origin,
        destination,
        value: parseFloat(value) || 0,
        weight: weight ? parseFloat(weight) : null,
        product_description: productDescription || null,
        sender_name: senderName || null,
        sender_cnpj: senderCnpj || null,
        sender_address: senderAddress || null,
        recipient_name: recipientName || null,
        recipient_cnpj: recipientCnpj || null,
        recipient_address: recipientAddress || null,
        driver_name: driverName || null,
        vehicle_plate: vehiclePlate || null,
        freight_value: freightValue ? parseFloat(freightValue) : null,
        contract_id: null,
      };

      if (pdfUrl) {
        cteData.pdf_url = pdfUrl;
      }

      if (editingCte) {
        const { error } = await supabase
          .from("ctes")
          .update(cteData)
          .eq("id", editingCte);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ctes").insert(cteData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ctes"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingCte ? "CT-e atualizado" : "CT-e criado",
        description: `O CT-e foi ${editingCte ? "atualizado" : "criado"} com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || `Não foi possível ${editingCte ? "atualizar" : "criar"} o CT-e.`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  // Delete CTE mutation
  const deleteCTEMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ctes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ctes"] });
      toast({
        title: "CT-e excluído",
        description: "O CT-e foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o CT-e.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (cte: CTE) => {
    setCteNumber(cte.cte_number);
    setDocNumber((cte as any).doc_number || "");
    setTomadorId((cte as any).tomador_id || "");
    setIssueDate(cte.issue_date);
    setOrigin(cte.origin);
    setDestination(cte.destination);
    setValue(cte.value.toString());
    setWeight(cte.weight?.toString() || "");
    setProductDescription(cte.product_description || "");
    setSenderName(cte.sender_name || "");
    setSenderCnpj(cte.sender_cnpj || "");
    setSenderAddress(cte.sender_address || "");
    setRecipientName(cte.recipient_name || "");
    setRecipientCnpj(cte.recipient_cnpj || "");
    setRecipientAddress(cte.recipient_address || "");
    setDriverName(cte.driver_name || "");
    setVehiclePlate(cte.vehicle_plate || "");
    setFreightValue(cte.freight_value?.toString() || "");
    setEditingCte(cte.id);
    setExistingPdfUrl(cte.pdf_url || null);
    setIsDialogOpen(true);
  };

  const handleView = (cte: CTE) => {
    setSelectedCte(cte);
    setIsViewDialogOpen(true);
  };

  const handleViewPdf = (cte: CTE) => {
    if (cte.pdf_url) {
      setSelectedCte(cte);
      setIsPdfViewerOpen(true);
    }
  };

  const handleDownloadPdf = async (cte: CTE) => {
    if (!cte.pdf_url) {
      toast({
        title: "Erro",
        description: "Este CT-e não possui PDF anexado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(cte.pdf_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CTE-${cte.cte_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      window.open(cte.pdf_url, '_blank');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">CT-e - Conhecimento de Transporte</h1>
        <div className="flex gap-2">
          {/* Dropdown for New CT-e options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo CT-e
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Cadastro Manual / PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsBulkImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Importar em Massa (XML)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CTEFilterableTable 
        ctes={ctes}
        isLoading={isLoading}
        handleView={handleView}
        handleViewPdf={handleViewPdf}
        handleDownloadPdf={handleDownloadPdf}
        handleEdit={handleEdit}
        deleteCTEMutation={deleteCTEMutation}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* Bulk Import Dialog */}
      <BulkCteImportDialog 
        open={isBulkImportOpen} 
        onOpenChange={setIsBulkImportOpen} 
      />

      {/* Manual/PDF Import Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCte ? "Editar" : "Novo"} CT-e</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {/* Importação via PDF ou Chave de Acesso */}
            {!editingCte && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileUp className="h-4 w-4" />
                  Importar dados da CT-e
                </h3>
                
                {/* Importação via PDF */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Opção 1: Importar do PDF do DACTE</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfExtract}
                      disabled={isExtractingFromPdf}
                      className="flex-1"
                    />
                    {isExtractingFromPdf && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Extraindo dados...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Envie o PDF do DACTE para extrair automaticamente todos os dados
                  </p>
                </div>

                {/* Separador */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-muted px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                {/* Importação via Chave de Acesso */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Opção 2: Importar pela Chave de Acesso</Label>
                  <div className="flex gap-2">
                    <Input
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      placeholder="Informe os 44 dígitos da chave de acesso"
                      className="font-mono flex-1"
                      maxLength={50}
                    />
                    <Button
                      type="button"
                      onClick={handleAccessKeySearch}
                      disabled={isLoadingAccessKey}
                      className="min-w-[140px]"
                    >
                      {isLoadingAccessKey ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Importar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {importedFromKey && (
                  <Alert className="mt-3 bg-success/10 border-success/20">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <AlertDescription className="text-success">
                      Dados importados automaticamente. Verifique e complete as informações necessárias.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Dados Básicos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="cteNumber">Número do CT-e* (6 dígitos)</Label>
                <Input
                  id="cteNumber"
                  value={cteNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCteNumber(val);
                  }}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="docNumber">Doc.</Label>
                <Input
                  id="docNumber"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="Número do documento"
                />
              </div>
              <div>
                <Label htmlFor="cteSerie">Série</Label>
                <Input
                  id="cteSerie"
                  value={cteSerie}
                  onChange={(e) => setCteSerie(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="issueDate">Data de Emissão*</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tomadorId">Tomador</Label>
                <Select value={tomadorId} onValueChange={setTomadorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tomador" />
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
                <Label htmlFor="modalTransporte">Modal</Label>
                <Input
                  id="modalTransporte"
                  value={modalTransporte}
                  onChange={(e) => setModalTransporte(e.target.value)}
                  placeholder="Ex: Rodoviário"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Origem*</Label>
                <Input
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Cidade/UF"
                  required
                />
              </div>
              <div>
                <Label htmlFor="destination">Destino*</Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Cidade/UF"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="value">Valor Total do Serviço*</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="freightValue">Valor do Frete</Label>
                <Input
                  id="freightValue"
                  type="number"
                  step="0.01"
                  value={freightValue}
                  onChange={(e) => setFreightValue(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="productDescription">Descrição do Produto/Carga</Label>
              <Textarea
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Descreva a mercadoria transportada"
              />
            </div>

            {/* Emitente */}
            {importedFromKey && emitenteName && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10">Emitente</Badge>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Razão Social</Label>
                    <Input value={emitenteName} disabled className="bg-muted" />
                  </div>
                  <div>
                    <Label>CNPJ</Label>
                    <Input value={emitenteCnpj} disabled className="bg-muted" />
                  </div>
                </div>
              </div>
            )}

            {/* Remetente */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Remetente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senderName">Nome/Razão Social</Label>
                  <Input
                    id="senderName"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="senderCnpj">CNPJ</Label>
                  <Input
                    id="senderCnpj"
                    value={senderCnpj}
                    onChange={(e) => setSenderCnpj(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label htmlFor="senderAddress">Endereço</Label>
                <Input
                  id="senderAddress"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  placeholder="Endereço completo"
                />
              </div>
            </div>

            {/* Destinatário */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Destinatário</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientName">Nome/Razão Social</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="recipientCnpj">CNPJ</Label>
                  <Input
                    id="recipientCnpj"
                    value={recipientCnpj}
                    onChange={(e) => setRecipientCnpj(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label htmlFor="recipientAddress">Endereço</Label>
                <Input
                  id="recipientAddress"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Endereço completo"
                />
              </div>
            </div>

            {/* Transporte */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Transporte</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="driverName">Nome do Motorista</Label>
                  <Input
                    id="driverName"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vehiclePlate">Placa do Veículo</Label>
                  <Input
                    id="vehiclePlate"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="ABC1D23"
                  />
                </div>
              </div>
            </div>

            {/* Upload do PDF */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                PDF do CT-e
              </h3>
              
              {existingPdfUrl && !pdfFile && (
                <div className="mb-3 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm">PDF anexado</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(existingPdfUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExistingPdfUrl(null)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Substituir
                    </Button>
                  </div>
                </div>
              )}
              
              {(!existingPdfUrl || pdfFile) && (
                <div className="space-y-2">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <Input
                      id="pdfFile"
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfChange}
                      className="hidden"
                    />
                    <label htmlFor="pdfFile" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique para selecionar ou arraste o PDF aqui
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Máximo: {MAX_PDF_SIZE_MB}MB
                      </p>
                    </label>
                  </div>
                  
                  {pdfFile && (
                    <div className="flex items-center justify-between bg-muted p-2 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm truncate max-w-[200px]">{pdfFile.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPdfFile(null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={() => saveCTEMutation.mutate()} disabled={uploading}>
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : editingCte ? "Atualizar" : "Criar CT-e"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do CT-e</DialogTitle>
          </DialogHeader>
          {selectedCte && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Número</Label>
                  <p className="font-medium">{selectedCte.cte_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data de Emissão</Label>
                  <p className="font-medium">{format(new Date(selectedCte.issue_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Origem</Label>
                  <p className="font-medium">{selectedCte.origin}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Destino</Label>
                  <p className="font-medium">{selectedCte.destination}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Valor Total</Label>
                  <p className="font-medium">R$ {selectedCte.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Peso</Label>
                  <p className="font-medium">{selectedCte.weight ? `${selectedCte.weight} kg` : "-"}</p>
                </div>
              </div>
              {selectedCte.sender_name && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Remetente</Label>
                  <p className="font-medium">{selectedCte.sender_name}</p>
                  {selectedCte.sender_cnpj && <p className="text-sm text-muted-foreground">CNPJ: {selectedCte.sender_cnpj}</p>}
                  {selectedCte.sender_address && <p className="text-sm text-muted-foreground">{selectedCte.sender_address}</p>}
                </div>
              )}
              {selectedCte.recipient_name && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Destinatário</Label>
                  <p className="font-medium">{selectedCte.recipient_name}</p>
                  {selectedCte.recipient_cnpj && <p className="text-sm text-muted-foreground">CNPJ: {selectedCte.recipient_cnpj}</p>}
                  {selectedCte.recipient_address && <p className="text-sm text-muted-foreground">{selectedCte.recipient_address}</p>}
                </div>
              )}
              {(selectedCte.driver_name || selectedCte.vehicle_plate) && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Transporte</Label>
                  <p className="font-medium">{selectedCte.driver_name || "-"}</p>
                  <p className="text-sm text-muted-foreground">Placa: {selectedCte.vehicle_plate || "-"}</p>
                </div>
              )}
              {selectedCte.pdf_url && (
                <div className="border-t pt-4 flex gap-2">
                  <Button onClick={() => handleViewPdf(selectedCte)} variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar PDF
                  </Button>
                  <Button onClick={() => handleDownloadPdf(selectedCte)} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={isPdfViewerOpen} onOpenChange={setIsPdfViewerOpen}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>PDF do CT-e {selectedCte?.cte_number}</DialogTitle>
          </DialogHeader>
          {selectedCte?.pdf_url && (
            <div className="flex-1 h-full min-h-[70vh]">
              <iframe
                src={selectedCte.pdf_url}
                className="w-full h-full min-h-[65vh] border rounded"
                title={`PDF CT-e ${selectedCte.cte_number}`}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPdfViewerOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => selectedCte && handleDownloadPdf(selectedCte)}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
