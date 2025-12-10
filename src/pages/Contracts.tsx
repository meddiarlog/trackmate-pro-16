import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Download, Eye, Edit, Trash2, X, FileUp, Printer, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContractPrint } from "@/components/ContractPrint";
import { ImportCteDialog } from "@/components/ImportCteDialog";

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface CTE {
  id?: string;
  cte_number: string;
  origin: string;
  destination: string;
  product_description?: string;
  weight?: number;
  value: number;
  issue_date: string;
  cfop?: string;
  cfop_description?: string;
  sender_name?: string;
  sender_cnpj?: string;
  sender_ie?: string;
  sender_address?: string;
  recipient_name?: string;
  recipient_cnpj?: string;
  recipient_ie?: string;
  recipient_address?: string;
  insurance_company?: string;
  insurance_policy?: string;
  driver_name?: string;
  driver_cpf?: string;
  driver_rg?: string;
  driver_rg_issuer?: string;
  driver_license?: string;
  driver_phone?: string;
  driver_cellphone?: string;
  driver_pis?: string;
  driver_city?: string;
  driver_state?: string;
  driver_bank?: string;
  driver_account?: string;
  driver_agency?: string;
  owner_name?: string;
  owner_cpf?: string;
  owner_rg?: string;
  owner_antt?: string;
  owner_pis?: string;
  owner_address?: string;
  vehicle_plate?: string;
  vehicle_rntrc?: string;
  vehicle_renavam?: string;
  vehicle_city?: string;
  vehicle_state?: string;
  vehicle_brand?: string;
  cargo_species?: string;
  cargo_quantity?: number;
  cargo_invoice?: string;
  observations?: string;
}

interface FreightComposition {
  freightValue: number;
  stayValue: number;
  tollValue: number;
  advanceValue: number;
  irrfValue: number;
  inssValue: number;
  sestSenatValue: number;
  insuranceValue: number;
  breakageValue: number;
  otherDiscountValue: number;
}

interface CompanySettings {
  razao_social: string;
  cnpj?: string;
  inscricao_estadual?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  logo_url?: string;
}

interface Contract {
  id: string;
  company_id: string;
  contract_number: string;
  title: string;
  description?: string;
  status: string;
  total_value: number;
  created_at: string;
  companies: Company;
}

const defaultFreightComposition: FreightComposition = {
  freightValue: 0,
  stayValue: 0,
  tollValue: 0,
  advanceValue: 0,
  irrfValue: 0,
  inssValue: 0,
  sestSenatValue: 0,
  insuranceValue: 0,
  breakageValue: 0,
  otherDiscountValue: 0,
};

export default function Contracts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isImportCteDialogOpen, setIsImportCteDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedPrintCtes, setSelectedPrintCtes] = useState<CTE[]>([]);
  const [printFreightComposition, setPrintFreightComposition] = useState<FreightComposition>(defaultFreightComposition);
  const [editingContract, setEditingContract] = useState<string | null>(null);
  
  // Form states
  const [companyId, setCompanyId] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ctes, setCtes] = useState<CTE[]>([]);
  const [freightComposition, setFreightComposition] = useState<FreightComposition>(defaultFreightComposition);
  
  // New company form
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCnpj, setNewCompanyCnpj] = useState("");
  const [cnpjSearching, setCnpjSearching] = useState(false);
  const [quickCnpj, setQuickCnpj] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch company settings for logo and header
  const { data: companySettings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CompanySettings | null;
    },
  });

  // Fetch CNPJ data automatically
  const fetchCnpjData = async (cnpj: string) => {
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCnpj.length !== 14) {
      return;
    }

    setCnpjSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-cnpj", {
        body: { cnpj },
      });

      if (error) throw error;

      if (data && data.name) {
        setNewCompanyName(data.name);
        toast({
          title: "Dados encontrados",
          description: "Dados do CNPJ encontrados e preenchidos!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar CNPJ",
        description: "Verifique o número informado.",
        variant: "destructive",
      });
    } finally {
      setCnpjSearching(false);
    }
  };

  const handleCnpjBlur = () => {
    const cnpj = newCompanyCnpj?.replace(/[^\d]/g, "");
    if (cnpj && cnpj.length === 14) {
      fetchCnpjData(cnpj);
    }
  };

  // Quick CNPJ search and auto-register
  const handleQuickCnpjSearch = async () => {
    const cleanCnpj = quickCnpj.replace(/[^\d]/g, '');
    
    if (cleanCnpj.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ válido com 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    // Check if company already exists
    const existingCompany = companies.find(c => c.cnpj?.replace(/[^\d]/g, '') === cleanCnpj);
    if (existingCompany) {
      setCompanyId(existingCompany.id);
      setQuickCnpj("");
      toast({
        title: "Empresa encontrada",
        description: `${existingCompany.name} foi selecionada.`,
      });
      return;
    }

    // Fetch and auto-register
    setCnpjSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-cnpj", {
        body: { cnpj: cleanCnpj },
      });

      if (error) throw error;

      if (data && data.name) {
        // Auto-register the company
        const { data: newCompany, error: insertError } = await supabase
          .from("companies")
          .insert({
            name: data.name,
            cnpj: cleanCnpj,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await queryClient.invalidateQueries({ queryKey: ["companies"] });
        setCompanyId(newCompany.id);
        setQuickCnpj("");
        
        toast({
          title: "Empresa cadastrada",
          description: `${data.name} foi cadastrada e selecionada automaticamente.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar CNPJ",
        description: "Não foi possível buscar ou cadastrar a empresa. Verifique o CNPJ.",
        variant: "destructive",
      });
    } finally {
      setCnpjSearching(false);
    }
  };

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Company[];
    },
  });

  // Fetch contracts
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          companies (
            id,
            name,
            cnpj,
            address,
            phone,
            email
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });

  // Fetch CTEs for a contract
  const fetchCTEsForContract = async (contractId: string) => {
    const { data, error } = await supabase
      .from("ctes")
      .select("*")
      .eq("contract_id", contractId)
      .order("issue_date", { ascending: false });
    if (error) throw error;
    return data as CTE[];
  };

  // Fetch available CTEs (not assigned to any contract)
  const { data: availableCtes = [] } = useQuery({
    queryKey: ["available-ctes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ctes")
        .select("*")
        .is("contract_id", null)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .insert({
          name: newCompanyName,
          cnpj: newCompanyCnpj,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setCompanyId(data.id);
      setIsCompanyDialogOpen(false);
      setNewCompanyName("");
      setNewCompanyCnpj("");
      toast({
        title: "Empresa criada",
        description: "A empresa foi criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a empresa.",
        variant: "destructive",
      });
    },
  });

  // Create/Update contract mutation
  const saveContractMutation = useMutation({
    mutationFn: async () => {
      const totalValue = ctes.reduce((sum, cte) => sum + Number(cte.value), 0);
      
      if (editingContract) {
        // Update existing contract
        const { error: contractError } = await supabase
          .from("contracts")
          .update({
            company_id: companyId,
            contract_number: contractNumber,
            title,
            description,
            total_value: totalValue,
          })
          .eq("id", editingContract);
        
        if (contractError) throw contractError;

        // Delete old CTEs
        await supabase.from("ctes").delete().eq("contract_id", editingContract);

        // Insert new CTEs
        if (ctes.length > 0) {
          const { error: ctesError } = await supabase.from("ctes").insert(
            ctes.map((cte) => ({
              contract_id: editingContract,
              ...cte,
            }))
          );
          if (ctesError) throw ctesError;
        }
      } else {
        // Create new contract
        const { data: contractData, error: contractError } = await supabase
          .from("contracts")
          .insert({
            company_id: companyId,
            contract_number: contractNumber,
            title,
            description,
            total_value: totalValue,
            status: "draft",
          })
          .select()
          .single();

        if (contractError) throw contractError;

        // Insert CTEs
        if (ctes.length > 0) {
          const { error: ctesError } = await supabase.from("ctes").insert(
            ctes.map((cte) => ({
              contract_id: contractData.id,
              ...cte,
            }))
          );
          if (ctesError) throw ctesError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["available-ctes"] });
      resetForm();
      setIsCreateDialogOpen(false);
      toast({
        title: editingContract ? "Contrato atualizado" : "Contrato criado",
        description: `O contrato foi ${editingContract ? "atualizado" : "criado"} com sucesso.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: `Não foi possível ${editingContract ? "atualizar" : "criar"} o contrato.`,
        variant: "destructive",
      });
    },
  });

  // Delete contract mutation
  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["available-ctes"] });
      toast({
        title: "Contrato excluído",
        description: "O contrato foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contrato.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCompanyId("");
    setContractNumber("");
    setTitle("");
    setDescription("");
    setCtes([]);
    setFreightComposition(defaultFreightComposition);
    setEditingContract(null);
  };

  const addCTE = () => {
    setCtes([
      ...ctes,
      {
        cte_number: "",
        origin: "",
        destination: "",
        product_description: "",
        weight: 0,
        value: 0,
        issue_date: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const updateCTE = (index: number, field: keyof CTE, value: string | number) => {
    const updatedCtes = [...ctes];
    updatedCtes[index] = { ...updatedCtes[index], [field]: value };
    setCtes(updatedCtes);
  };

  const removeCTE = (index: number) => {
    setCtes(ctes.filter((_, i) => i !== index));
  };

  const importCtes = (selectedIds: string[]) => {
    const ctesToImport = availableCtes.filter((cte) => selectedIds.includes(cte.id));
    setCtes([...ctes, ...ctesToImport.map((cte) => ({
      cte_number: cte.cte_number,
      origin: cte.origin,
      destination: cte.destination,
      product_description: cte.product_description,
      weight: cte.weight,
      value: cte.value,
      issue_date: cte.issue_date,
      cfop: cte.cfop,
      cfop_description: cte.cfop_description,
      sender_name: cte.sender_name,
      sender_cnpj: cte.sender_cnpj,
      sender_ie: cte.sender_ie,
      sender_address: cte.sender_address,
      recipient_name: cte.recipient_name,
      recipient_cnpj: cte.recipient_cnpj,
      recipient_ie: cte.recipient_ie,
      recipient_address: cte.recipient_address,
      insurance_company: cte.insurance_company,
      insurance_policy: cte.insurance_policy,
      driver_name: cte.driver_name,
      driver_cpf: cte.driver_cpf,
      driver_rg: cte.driver_rg,
      driver_rg_issuer: cte.driver_rg_issuer,
      driver_license: cte.driver_license,
      driver_phone: cte.driver_phone,
      driver_cellphone: cte.driver_cellphone,
      driver_pis: cte.driver_pis,
      driver_city: cte.driver_city,
      driver_state: cte.driver_state,
      driver_bank: cte.driver_bank,
      driver_account: cte.driver_account,
      driver_agency: cte.driver_agency,
      owner_name: cte.owner_name,
      owner_cpf: cte.owner_cpf,
      owner_rg: cte.owner_rg,
      owner_antt: cte.owner_antt,
      owner_pis: cte.owner_pis,
      owner_address: cte.owner_address,
      vehicle_plate: cte.vehicle_plate,
      vehicle_rntrc: cte.vehicle_rntrc,
      vehicle_renavam: cte.vehicle_renavam,
      vehicle_city: cte.vehicle_city,
      vehicle_state: cte.vehicle_state,
      vehicle_brand: cte.vehicle_brand,
      cargo_species: cte.cargo_species,
      cargo_quantity: cte.cargo_quantity,
      cargo_invoice: cte.cargo_invoice,
      observations: cte.observations,
    }))]);
    setIsImportCteDialogOpen(false);
  };

  const updateFreightField = (field: keyof FreightComposition, value: number) => {
    setFreightComposition(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrintContract = async (contract: Contract) => {
    const contractCtes = await fetchCTEsForContract(contract.id);
    if (contractCtes.length === 0) {
      toast({
        title: "Sem CT-es",
        description: "Este contrato não possui CT-es vinculados.",
        variant: "destructive",
      });
      return;
    }

    // Check if CFOP is missing
    const primaryCte = contractCtes[0];
    if (!primaryCte.cfop) {
      toast({
        title: "Aviso",
        description: "CFOP não encontrado na CTE vinculada.",
        variant: "default",
      });
    }

    setSelectedContract(contract);
    setSelectedPrintCtes(contractCtes);
    setPrintFreightComposition(defaultFreightComposition);
    setIsPrintDialogOpen(true);
  };

  const handleEdit = async (contract: Contract) => {
    setEditingContract(contract.id);
    setCompanyId(contract.company_id);
    setContractNumber(contract.contract_number);
    setTitle(contract.title);
    setDescription(contract.description || "");
    
    const contractCtes = await fetchCTEsForContract(contract.id);
    setCtes(contractCtes);
    setFreightComposition(defaultFreightComposition);
    
    setIsCreateDialogOpen(true);
  };

  const handleView = async (contract: Contract) => {
    setSelectedContract(contract);
    const contractCtes = await fetchCTEsForContract(contract.id);
    setCtes(contractCtes);
    setIsViewDialogOpen(true);
  };

  const handleDownload = async (contract: Contract) => {
    const contractCtes = await fetchCTEsForContract(contract.id);
    
    // Generate simple text content for download
    const content = `
CONTRATO DE FRETE N° ${contract.contract_number}

Empresa: ${contract.companies.name}
${contract.companies.cnpj ? `CNPJ: ${contract.companies.cnpj}` : ""}

Título: ${contract.title}
Descrição: ${contract.description || "N/A"}
Status: ${contract.status}
Valor Total: R$ ${contract.total_value.toFixed(2)}

CTes VINCULADOS:
${contractCtes.map((cte, i) => `
${i + 1}. CTe N° ${cte.cte_number}
   Origem: ${cte.origin}
   Destino: ${cte.destination}
   Produto: ${cte.product_description || "N/A"}
   Peso: ${cte.weight || 0} kg
   Valor: R$ ${cte.value.toFixed(2)}
   Data: ${format(new Date(cte.issue_date), "dd/MM/yyyy", { locale: ptBR })}
`).join("\n")}

Data de Criação: ${format(new Date(contract.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contrato_${contract.contract_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      draft: "secondary",
      active: "default",
      completed: "default",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      draft: "Rascunho",
      active: "Ativo",
      completed: "Concluído",
      cancelled: "Cancelado",
    };

    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  // Calculate net value for display
  const calculateNetValue = () => {
    const totalDeductions = 
      freightComposition.tollValue + 
      freightComposition.advanceValue + 
      freightComposition.irrfValue + 
      freightComposition.inssValue + 
      freightComposition.sestSenatValue + 
      freightComposition.insuranceValue + 
      freightComposition.breakageValue + 
      freightComposition.otherDiscountValue;
    
    return freightComposition.freightValue + freightComposition.stayValue - totalDeductions;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Contratos de Frete
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie contratos e CTes vinculados
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContract ? "Editar Contrato" : "Criar Novo Contrato"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do contrato e adicione os CTes vinculados
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Company Selection */}
              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                <div className="flex gap-2">
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} {company.cnpj && `- ${company.cnpj}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" title="Cadastrar manualmente">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Empresa</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="newCompanyCnpj">CNPJ</Label>
                          <Input
                            id="newCompanyCnpj"
                            value={newCompanyCnpj}
                            onChange={(e) => setNewCompanyCnpj(e.target.value)}
                            onBlur={handleCnpjBlur}
                            placeholder="Digite o CNPJ para buscar automaticamente"
                            disabled={cnpjSearching}
                          />
                          {cnpjSearching && (
                            <p className="text-sm text-muted-foreground mt-1">Buscando dados do CNPJ...</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="newCompanyName">Nome da Empresa *</Label>
                          <Input
                            id="newCompanyName"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            disabled={cnpjSearching}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => createCompanyMutation.mutate()}
                          disabled={!newCompanyName}
                        >
                          Criar Empresa
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="quickCnpj" className="text-sm text-muted-foreground">
                      Ou busque por CNPJ para cadastro automático
                    </Label>
                    <Input
                      id="quickCnpj"
                      value={quickCnpj}
                      onChange={(e) => setQuickCnpj(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickCnpjSearch();
                        }
                      }}
                      placeholder="Digite o CNPJ e pressione Enter"
                      disabled={cnpjSearching}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleQuickCnpjSearch}
                    disabled={cnpjSearching || !quickCnpj}
                    variant="secondary"
                  >
                    {cnpjSearching ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
              </div>

              {/* Contract Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractNumber">Número do Contrato *</Label>
                  <Input
                    id="contractNumber"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    placeholder="Ex: CTR-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Transporte de Produtos"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes adicionais do contrato..."
                  rows={3}
                />
              </div>

              {/* CTEs */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base">CTes Vinculados</Label>
                  <div className="flex gap-2">
                    <Dialog open={isImportCteDialogOpen} onOpenChange={setIsImportCteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <FileUp className="h-4 w-4 mr-2" />
                          Importar CT-e
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Importar CT-es Disponíveis</DialogTitle>
                          <DialogDescription>
                            Selecione os CT-es que deseja vincular a este contrato
                          </DialogDescription>
                        </DialogHeader>
                        <ImportCteDialog
                          availableCtes={availableCtes}
                          onImport={importCtes}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button type="button" variant="outline" size="sm" onClick={addCTE}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Manualmente
                    </Button>
                  </div>
                </div>

                {ctes.map((cte, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm">CTe #{index + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCTE(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Número do CTe *</Label>
                          <Input
                            value={cte.cte_number}
                            onChange={(e) => updateCTE(index, "cte_number", e.target.value)}
                            placeholder="Ex: CTE-001"
                          />
                        </div>
                        <div>
                          <Label>Data de Emissão *</Label>
                          <Input
                            type="date"
                            value={cte.issue_date}
                            onChange={(e) => updateCTE(index, "issue_date", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Origem *</Label>
                          <Input
                            value={cte.origin}
                            onChange={(e) => updateCTE(index, "origin", e.target.value)}
                            placeholder="Ex: São Paulo, SP"
                          />
                        </div>
                        <div>
                          <Label>Destino *</Label>
                          <Input
                            value={cte.destination}
                            onChange={(e) => updateCTE(index, "destination", e.target.value)}
                            placeholder="Ex: Rio de Janeiro, RJ"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Descrição do Produto</Label>
                        <Input
                          value={cte.product_description || ""}
                          onChange={(e) =>
                            updateCTE(index, "product_description", e.target.value)
                          }
                          placeholder="Ex: Carga geral"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Peso (kg)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={cte.weight || ""}
                            onChange={(e) =>
                              updateCTE(index, "weight", parseFloat(e.target.value) || 0)
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Valor (R$) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={cte.value}
                            onChange={(e) =>
                              updateCTE(index, "value", parseFloat(e.target.value) || 0)
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Show driver and owner info if available */}
                      {(cte.driver_name || cte.owner_name) && (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                            <Label className="text-muted-foreground text-xs">Motorista</Label>
                            <p className="text-sm">{cte.driver_name || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Proprietário</Label>
                            <p className="text-sm">{cte.owner_name || '-'}</p>
                          </div>
                        </div>
                      )}

                      {/* Show CFOP if available */}
                      {cte.cfop && (
                        <div className="pt-2 border-t">
                          <Label className="text-muted-foreground text-xs">CFOP</Label>
                          <p className="text-sm">{cte.cfop} {cte.cfop_description && `- ${cte.cfop_description}`}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {ctes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum CTe adicionado ainda</p>
                    <p className="text-sm">Clique em "Adicionar CTe" para começar</p>
                  </div>
                )}
              </div>

              {/* Freight Composition - Manual Fields */}
              {ctes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Composição do Frete - Motorista</CardTitle>
                    <CardDescription>Preencha manualmente os valores da composição do frete</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Frete Motorista (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={freightComposition.freightValue || ""}
                          onChange={(e) => updateFreightField("freightValue", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>Estadia (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={freightComposition.stayValue || ""}
                          onChange={(e) => updateFreightField("stayValue", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>(-) Pedágio (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={freightComposition.tollValue || ""}
                          onChange={(e) => updateFreightField("tollValue", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>(-) Adiantamento (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={freightComposition.advanceValue || ""}
                          onChange={(e) => updateFreightField("advanceValue", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>(-) I.R.R.F. (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={freightComposition.irrfValue || ""}
                          onChange={(e) => updateFreightField("irrfValue", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>(-) INSS (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={freightComposition.inssValue || ""}
                          onChange={(e) => updateFreightField("inssValue", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>(-) SEST/SENAT (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={freightComposition.sestSenatValue || ""}
                          onChange={(e) => updateFreightField("sestSenatValue", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>(-) Seguro (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={freightComposition.insuranceValue || ""}
                          onChange={(e) => updateFreightField("insuranceValue", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>(-) Quebra (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={freightComposition.breakageValue || ""}
                          onChange={(e) => updateFreightField("breakageValue", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>(-) Outros Descontos (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={freightComposition.otherDiscountValue || ""}
                          onChange={(e) => updateFreightField("otherDiscountValue", parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Saldo a Receber:</span>
                        <span className="text-primary">
                          R$ {calculateNetValue().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {ctes.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Valor Total CTes:</span>
                    <span className="text-primary">
                      R$ {ctes.reduce((sum, cte) => sum + Number(cte.value), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => saveContractMutation.mutate()}
                disabled={
                  !companyId ||
                  !contractNumber ||
                  !title ||
                  saveContractMutation.isPending
                }
              >
                {saveContractMutation.isPending
                  ? "Salvando..."
                  : editingContract
                  ? "Atualizar Contrato"
                  : "Criar Contrato"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contracts List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando contratos...</p>
        </div>
      ) : contracts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Nenhum contrato cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro contrato de frete
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contract_number}</TableCell>
                  <TableCell>{contract.title}</TableCell>
                  <TableCell>{contract.companies.name}</TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell>R$ {contract.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    {format(new Date(contract.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrintContract(contract)}
                        title="Imprimir contrato"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(contract)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(contract)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const message = `*Contrato Nº ${contract.contract_number}*%0A%0ATítulo: ${contract.title}%0AEmpresa: ${contract.companies.name}%0AValor Total: R$ ${contract.total_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}%0AData: ${format(new Date(contract.created_at), "dd/MM/yyyy", { locale: ptBR })}`;
                          window.open(`https://web.whatsapp.com/send?text=${message}`, '_blank');
                        }}
                        title="Compartilhar via WhatsApp"
                      >
                        <Share2 className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(contract)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteContractMutation.mutate(contract.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* View Contract Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedContract && (
            <>
              <DialogHeader>
                <DialogTitle>Contrato {selectedContract.contract_number}</DialogTitle>
                <DialogDescription>Visualização completa do contrato</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Empresa</Label>
                    <p className="font-medium">{selectedContract.companies.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Título</Label>
                  <p className="font-medium">{selectedContract.title}</p>
                </div>

                {selectedContract.description && (
                  <div>
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p className="text-sm">{selectedContract.description}</p>
                  </div>
                )}

                <div>
                  <Label className="text-base mb-3 block">CTes Vinculados</Label>
                  <div className="space-y-3">
                    {ctes.map((cte, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">CTe:</span>{" "}
                              <span className="font-medium">{cte.cte_number}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Data:</span>{" "}
                              {format(new Date(cte.issue_date), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Origem:</span> {cte.origin}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Destino:</span>{" "}
                              {cte.destination}
                            </div>
                            {cte.product_description && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Produto:</span>{" "}
                                {cte.product_description}
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Peso:</span>{" "}
                              {cte.weight || 0} kg
                            </div>
                            <div>
                              <span className="text-muted-foreground">Valor:</span> R${" "}
                              {cte.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Valor Total:</span>
                    <span className="text-primary">
                      R$ {selectedContract.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Contract Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
          {selectedContract && selectedPrintCtes.length > 0 && (
            <>
              <DialogHeader>
                <DialogTitle>Contrato de Serviço de Transporte</DialogTitle>
                <DialogDescription>
                  Preencha a composição do frete e use Ctrl+P para imprimir
                </DialogDescription>
              </DialogHeader>

              {/* Freight Composition for Print */}
              <Card className="mb-4 print:hidden">
                <CardHeader>
                  <CardTitle className="text-base">Composição do Frete - Motorista</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <Label className="text-xs">Frete Motorista</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={printFreightComposition.freightValue || ""}
                        onChange={(e) => setPrintFreightComposition(prev => ({...prev, freightValue: parseFloat(e.target.value) || 0}))}
                        placeholder="0,00"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Estadia</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={printFreightComposition.stayValue || ""}
                        onChange={(e) => setPrintFreightComposition(prev => ({...prev, stayValue: parseFloat(e.target.value) || 0}))}
                        placeholder="0,00"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">(-) Pedágio</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={printFreightComposition.tollValue || ""}
                        onChange={(e) => setPrintFreightComposition(prev => ({...prev, tollValue: parseFloat(e.target.value) || 0}))}
                        placeholder="0,00"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">(-) Adiantamento</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={printFreightComposition.advanceValue || ""}
                        onChange={(e) => setPrintFreightComposition(prev => ({...prev, advanceValue: parseFloat(e.target.value) || 0}))}
                        placeholder="0,00"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">(-) I.R.R.F.</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={printFreightComposition.irrfValue || ""}
                        onChange={(e) => setPrintFreightComposition(prev => ({...prev, irrfValue: parseFloat(e.target.value) || 0}))}
                        placeholder="0,00"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">(-) INSS</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={printFreightComposition.inssValue || ""}
                        onChange={(e) => setPrintFreightComposition(prev => ({...prev, inssValue: parseFloat(e.target.value) || 0}))}
                        placeholder="0,00"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">(-) SEST/SENAT</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={printFreightComposition.sestSenatValue || ""}
                        onChange={(e) => setPrintFreightComposition(prev => ({...prev, sestSenatValue: parseFloat(e.target.value) || 0}))}
                        placeholder="0,00"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">(-) Seguro</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={printFreightComposition.insuranceValue || ""}
                        onChange={(e) => setPrintFreightComposition(prev => ({...prev, insuranceValue: parseFloat(e.target.value) || 0}))}
                        placeholder="0,00"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">(-) Quebra</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={printFreightComposition.breakageValue || ""}
                        onChange={(e) => setPrintFreightComposition(prev => ({...prev, breakageValue: parseFloat(e.target.value) || 0}))}
                        placeholder="0,00"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">(-) Outros Desc.</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={printFreightComposition.otherDiscountValue || ""}
                        onChange={(e) => setPrintFreightComposition(prev => ({...prev, otherDiscountValue: parseFloat(e.target.value) || 0}))}
                        placeholder="0,00"
                        className="h-8"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ContractPrint 
                contract={selectedContract} 
                ctes={selectedPrintCtes}
                freightComposition={printFreightComposition}
                companySettings={companySettings || undefined}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
