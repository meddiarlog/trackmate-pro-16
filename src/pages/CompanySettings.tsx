import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CompanyData {
  id?: string;
  cnpj: string;
  inscricao_estadual: string;
  razao_social: string;
  nome_fantasia: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  neighborhood: string;
}

export default function CompanySettings() {
  const queryClient = useQueryClient();
  const [cnpjSearching, setCnpjSearching] = useState(false);
  const [formData, setFormData] = useState<CompanyData>({
    cnpj: "",
    inscricao_estadual: "",
    razao_social: "",
    nome_fantasia: "",
    address: "",
    city: "",
    state: "",
    cep: "",
    neighborhood: "",
  });

  const { data: companyData, isLoading } = useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CompanyData | null;
    },
  });

  useEffect(() => {
    if (companyData) {
      setFormData({
        id: companyData.id,
        cnpj: companyData.cnpj || "",
        inscricao_estadual: companyData.inscricao_estadual || "",
        razao_social: companyData.razao_social || "",
        nome_fantasia: companyData.nome_fantasia || "",
        address: companyData.address || "",
        city: companyData.city || "",
        state: companyData.state || "",
        cep: companyData.cep || "",
        neighborhood: companyData.neighborhood || "",
      });
    }
  }, [companyData]);

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/(\d{5})(\d{1,3})/, "$1-$2");
  };

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

      if (data) {
        setFormData((prev) => ({
          ...prev,
          razao_social: data.name || prev.razao_social,
          nome_fantasia: data.fantasia || prev.nome_fantasia,
          address: data.address || prev.address,
          neighborhood: data.neighborhood || prev.neighborhood,
          city: data.city || prev.city,
          state: data.state || prev.state,
          cep: data.cep ? formatCep(data.cep) : prev.cep,
        }));
        toast.success("Dados do CNPJ encontrados e preenchidos!");
      }
    } catch (error) {
      toast.error("Erro ao buscar dados do CNPJ.");
      console.error(error);
    } finally {
      setCnpjSearching(false);
    }
  };

  const handleCnpjBlur = () => {
    const cnpj = formData.cnpj?.replace(/[^\d]/g, "");
    if (cnpj && cnpj.length === 14) {
      fetchCnpjData(cnpj);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: CompanyData) => {
      // Check for duplicate CNPJ (if there's already a company with this CNPJ and it's not the current one)
      if (data.cnpj) {
        const cleanCnpj = data.cnpj.replace(/\D/g, "");
        const { data: existing, error: checkError } = await supabase
          .from("company_settings")
          .select("id")
          .eq("cnpj", cleanCnpj)
          .maybeSingle();
        
        if (checkError) throw checkError;
        if (existing && existing.id !== data.id) {
          throw new Error("Já existe uma empresa cadastrada com este CNPJ.");
        }
      }

      const payload = {
        cnpj: data.cnpj.replace(/\D/g, "") || null,
        inscricao_estadual: data.inscricao_estadual || null,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        cep: data.cep?.replace(/\D/g, "") || null,
        neighborhood: data.neighborhood || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("company_settings")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_settings")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company_settings"] });
      toast.success("Dados da empresa salvos com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar dados da empresa.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.razao_social) {
      toast.error("Razão Social é obrigatória");
      return;
    }

    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          Dados da Empresa
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure os dados da sua empresa para uso em relatórios e documentos
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
          <CardDescription>
            Estes dados serão utilizados como cabeçalho em relatórios, ordens de coleta e demais documentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })}
                  onBlur={handleCnpjBlur}
                  placeholder="00.000.000/0000-00"
                  disabled={cnpjSearching}
                  maxLength={18}
                />
                {cnpjSearching && (
                  <p className="text-sm text-muted-foreground">Buscando dados do CNPJ...</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                <Input
                  id="inscricao_estadual"
                  value={formData.inscricao_estadual}
                  onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                  placeholder="Inscrição Estadual"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="razao_social">Razão Social *</Label>
              <Input
                id="razao_social"
                value={formData.razao_social}
                onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                placeholder="Razão Social da Empresa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
              <Input
                id="nome_fantasia"
                value={formData.nome_fantasia}
                onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                placeholder="Nome Fantasia"
              />
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Endereço</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, Número, Complemento"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: formatCep(e.target.value) })}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado (UF)</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Dados
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
