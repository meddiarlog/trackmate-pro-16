import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

interface VehicleOwner {
  id: string;
  name: string;
  type: string | null;
  cpf: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export default function VehicleOwners() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<VehicleOwner | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cnpjSearching, setCnpjSearching] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "pessoa_fisica",
    cpf: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
  });

  const { data: owners = [], isLoading } = useQuery({
    queryKey: ["vehicle_owners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_owners")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as VehicleOwner[];
    },
  });

  const filteredOwners = owners.filter(
    (owner) =>
      owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.cpf?.includes(searchTerm) ||
      owner.cnpj?.includes(searchTerm)
  );

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
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
          name: data.name || prev.name,
          address: data.address ? `${data.address}, ${data.neighborhood || ''}, ${data.city || ''} - ${data.state || ''}`.replace(/, ,/g, ',').replace(/^, |, $/g, '') : prev.address,
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

  const checkDuplicate = async (cpf: string | null, cnpj: string | null, currentId?: string): Promise<string | null> => {
    // Check CPF duplicate
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "");
      if (cleanCpf) {
        const { data, error } = await supabase
          .from("vehicle_owners")
          .select("id")
          .eq("cpf", cleanCpf);
        
        if (!error && data && data.length > 0) {
          if (!currentId || data.length > 1 || data[0].id !== currentId) {
            return "Já existe um proprietário cadastrado com este CPF.";
          }
        }
      }
    }

    // Check CNPJ duplicate
    if (cnpj) {
      const cleanCnpj = cnpj.replace(/\D/g, "");
      if (cleanCnpj) {
        const { data, error } = await supabase
          .from("vehicle_owners")
          .select("id")
          .eq("cnpj", cleanCnpj);
        
        if (!error && data && data.length > 0) {
          if (!currentId || data.length > 1 || data[0].id !== currentId) {
            return "Já existe um proprietário cadastrado com este CNPJ.";
          }
        }
      }
    }

    return null;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanCpf = formData.cpf.replace(/\D/g, "") || null;
      const cleanCnpj = formData.cnpj.replace(/\D/g, "") || null;
      
      // Check for duplicate
      const duplicateError = await checkDuplicate(formData.cpf, formData.cnpj, editingOwner?.id);
      if (duplicateError) {
        throw new Error(duplicateError);
      }

      const ownerData = {
        name: formData.name,
        type: formData.type,
        cpf: cleanCpf,
        cnpj: cleanCnpj,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
      };

      if (editingOwner) {
        const { error } = await supabase
          .from("vehicle_owners")
          .update(ownerData)
          .eq("id", editingOwner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vehicle_owners").insert(ownerData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle_owners"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(editingOwner ? "Proprietário atualizado!" : "Proprietário cadastrado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar proprietário.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicle_owners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle_owners"] });
      toast.success("Proprietário removido!");
    },
    onError: () => {
      toast.error("Erro ao remover proprietário.");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "pessoa_fisica",
      cpf: "",
      cnpj: "",
      email: "",
      phone: "",
      address: "",
    });
    setEditingOwner(null);
  };

  const handleEdit = (owner: VehicleOwner) => {
    setEditingOwner(owner);
    setFormData({
      name: owner.name,
      type: owner.type || "pessoa_fisica",
      cpf: owner.cpf ? formatCpf(owner.cpf) : "",
      cnpj: owner.cnpj ? formatCnpj(owner.cnpj) : "",
      email: owner.email || "",
      phone: owner.phone || "",
      address: owner.address || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Proprietários de Veículos
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre e gerencie os proprietários de veículos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Cadastrar Proprietário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOwner ? "Editar Proprietário" : "Cadastrar Novo Proprietário"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                    <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "pessoa_fisica" ? (
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCpf(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              ) : (
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
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome / Razão Social *</Label>
                <Input
                  id="name"
                  placeholder="Nome completo ou Razão Social"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Endereço completo"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : editingOwner ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="mb-6 border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, CPF ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Owners Grid */}
      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOwners.map((owner) => (
            <Card key={owner.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{owner.name}</CardTitle>
                  <Badge variant="outline">
                    {owner.type === "pessoa_juridica" ? "PJ" : "PF"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {owner.cpf && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">CPF:</span>
                      <span className="text-sm font-medium">{formatCpf(owner.cpf)}</span>
                    </div>
                  )}
                  {owner.cnpj && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">CNPJ:</span>
                      <span className="text-sm font-medium">{formatCnpj(owner.cnpj)}</span>
                    </div>
                  )}
                  {owner.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{owner.email}</span>
                    </div>
                  )}
                  {owner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{owner.phone}</span>
                    </div>
                  )}
                  {owner.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm truncate">{owner.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(owner)}
                    className="flex-1 gap-2"
                  >
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(owner.id)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredOwners.length === 0 && !isLoading && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum proprietário encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente ajustar os filtros de busca." : "Comece cadastrando seu primeiro proprietário."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
