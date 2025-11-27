import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  loading_location: string;
  unloading_location: string;
  type: "Embarcador" | "Consignatário" | "Ambos";
  cpf_cnpj?: string;
}

export default function Customers() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cnpjSearching, setCnpjSearching] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    neighborhood: "",
    loading_location: "",
    unloading_location: "",
    type: "Embarcador" as Customer["type"],
    cpf_cnpj: "",
  });

  // Fetch customers from Supabase
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Customer[];
    },
  });

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchCnpjData = async (cnpj: string) => {
    setCnpjSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-cnpj", {
        body: { cnpj },
      });

      if (error) throw error;

      if (data) {
        setFormData({
          ...formData,
          name: data.name || formData.name,
          email: data.email || formData.email,
          phone: data.phone || formData.phone,
          address: data.address || formData.address,
        });
        toast.success("Dados do CNPJ/CPF encontrados!");
      }
    } catch (error) {
      toast.error("Erro ao buscar dados do CNPJ/CPF");
      console.error(error);
    } finally {
      setCnpjSearching(false);
    }
  };

  const handleCnpjBlur = () => {
    const cnpj = formData.cpf_cnpj?.replace(/[^\d]/g, "");
    if (cnpj && cnpj.length >= 11) {
      fetchCnpjData(cnpj);
    }
  };

  const saveCustomerMutation = useMutation({
    mutationFn: async (customer: any) => {
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(customer)
          .eq("id", editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customers").insert([customer]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(editingCustomer ? "Cliente atualizado!" : "Cliente cadastrado!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao salvar cliente");
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente removido!");
    },
    onError: () => {
      toast.error("Erro ao remover cliente");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      neighborhood: "",
      loading_location: "",
      unloading_location: "",
      type: "Embarcador",
      cpf_cnpj: "",
    });
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    saveCustomerMutation.mutate(formData);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      neighborhood: customer.neighborhood || "",
      loading_location: customer.loading_location || "",
      unloading_location: customer.unloading_location || "",
      type: customer.type,
      cpf_cnpj: customer.cpf_cnpj || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCustomerMutation.mutate(id);
  };

  const getTypeBadge = (type: Customer["type"]) => {
    switch (type) {
      case "Embarcador":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Embarcador</Badge>;
      case "Consignatário":
        return <Badge className="bg-success/10 text-success border-success/20">Consignatário</Badge>;
      case "Ambos":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Ambos</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Gestão de Clientes
          </h1>
          <p className="text-muted-foreground mt-1">Cadastre embarcadores e consignatários</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Cadastrar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Editar Cliente" : "Cadastrar Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                  onBlur={handleCnpjBlur}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  disabled={cnpjSearching}
                />
                {cnpjSearching && (
                  <p className="text-sm text-muted-foreground mt-1">Buscando dados do CNPJ/CPF...</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Razão Social / Nome *</Label>
                <Input
                  id="name"
                  placeholder="Empresa ABC Ltda"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@empresa.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 3333-3333"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço *</Label>
                <Input
                  id="address"
                  placeholder="Rua, Número, Complemento"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Centro"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    placeholder="São Paulo"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    placeholder="SP"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loading_location">Local de Carregamento</Label>
                <Input
                  id="loading_location"
                  placeholder="Galpão A - Portão 3"
                  value={formData.loading_location}
                  onChange={(e) => setFormData({ ...formData, loading_location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unloading_location">Local de Descarregamento</Label>
                <Input
                  id="unloading_location"
                  placeholder="Doca 5 - Setor Norte"
                  value={formData.unloading_location}
                  onChange={(e) => setFormData({ ...formData, unloading_location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Cliente *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Customer["type"] })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="Embarcador">Embarcador</option>
                  <option value="Consignatário">Consignatário</option>
                  <option value="Ambos">Ambos</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingCustomer ? "Atualizar" : "Cadastrar"}</Button>
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
              placeholder="Buscar por nome, cidade ou estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{customer.name}</CardTitle>
                {getTypeBadge(customer.type)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <div>{customer.address}</div>
                    <div className="text-muted-foreground">
                      {customer.neighborhood}, {customer.city} - {customer.state}
                    </div>
                  </div>
                </div>
                {customer.loading_location && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Carregamento:</span>
                    <div className="font-medium">{customer.loading_location}</div>
                  </div>
                )}
                {customer.unloading_location && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Descarregamento:</span>
                    <div className="font-medium">{customer.unloading_location}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button size="sm" variant="outline" onClick={() => handleEdit(customer)} className="flex-1 gap-2">
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(customer.id)}
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

      {filteredCustomers.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente ajustar os filtros de busca." : "Comece cadastrando seu primeiro cliente."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
