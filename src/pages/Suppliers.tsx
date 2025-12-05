import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Briefcase, Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export default function Suppliers() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cnpjSearching, setCnpjSearching] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
  });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.cnpj?.includes(searchTerm)
  );

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

  const checkDuplicate = async (cnpj: string, currentId?: string): Promise<boolean> => {
    if (!cnpj) return false;
    const cleanCnpj = cnpj.replace(/\D/g, "");
    if (!cleanCnpj) return false;

    const { data, error } = await supabase
      .from("suppliers")
      .select("id")
      .eq("cnpj", cleanCnpj);
    
    if (error) return false;
    if (!data || data.length === 0) return false;
    if (currentId && data.length === 1 && data[0].id === currentId) return false;
    return true;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanCnpj = formData.cnpj.replace(/\D/g, "") || null;
      
      // Check for duplicate
      if (cleanCnpj) {
        const isDuplicate = await checkDuplicate(formData.cnpj, editingSupplier?.id);
        if (isDuplicate) {
          throw new Error("Já existe um fornecedor cadastrado com este CNPJ.");
        }
      }

      const supplierData = {
        name: formData.name,
        cnpj: cleanCnpj,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
      };

      if (editingSupplier) {
        const { error } = await supabase
          .from("suppliers")
          .update(supplierData)
          .eq("id", editingSupplier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(supplierData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(editingSupplier ? "Fornecedor atualizado!" : "Fornecedor cadastrado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar fornecedor.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor removido!");
    },
    onError: () => {
      toast.error("Erro ao remover fornecedor.");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      address: "",
    });
    setEditingSupplier(null);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      cnpj: supplier.cnpj ? formatCnpj(supplier.cnpj) : "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
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
            <Briefcase className="h-8 w-8 text-primary" />
            Gestão de Fornecedores
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre e gerencie seus fornecedores
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Cadastrar Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="name">Nome / Razão Social *</Label>
                <Input
                  id="name"
                  placeholder="Nome do Fornecedor"
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
                    placeholder="email@fornecedor.com"
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
                  {saveMutation.isPending ? "Salvando..." : editingSupplier ? "Atualizar" : "Cadastrar"}
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
              placeholder="Buscar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{supplier.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">CNPJ:</span>
                    <span className="text-sm font-medium">{supplier.cnpj ? formatCnpj(supplier.cnpj) : "-"}</span>
                  </div>
                  {supplier.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm truncate">{supplier.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(supplier)}
                    className="flex-1 gap-2"
                  >
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(supplier.id)}
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

      {filteredSuppliers.length === 0 && !isLoading && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente ajustar os filtros de busca." : "Comece cadastrando seu primeiro fornecedor."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
