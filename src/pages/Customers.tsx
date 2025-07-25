import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  loadingLocation: string;
  unloadingLocation: string;
  type: "Embarcador" | "Consignatário" | "Ambos";
}

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "1",
      name: "Empresa ABC Ltda",
      email: "contato@empresaabc.com.br",
      phone: "(11) 3333-3333",
      address: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
      neighborhood: "Centro",
      loadingLocation: "Galpão A - Portão 3",
      unloadingLocation: "Doca 5 - Setor Norte",
      type: "Embarcador"
    },
    {
      id: "2",
      name: "Distribuidora XYZ S/A",
      email: "logistica@xyz.com.br",
      phone: "(21) 4444-4444",
      address: "Av. Principal, 456",
      city: "Rio de Janeiro",
      state: "RJ",
      neighborhood: "Industrial",
      loadingLocation: "Centro de Distribuição",
      unloadingLocation: "Armazém Central",
      type: "Consignatário"
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    neighborhood: "",
    loadingLocation: "",
    unloadingLocation: "",
    type: "Embarcador" as Customer["type"]
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCustomer) {
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id ? { ...editingCustomer, ...formData } : c
      ));
      toast({
        title: "Cliente atualizado",
        description: "As informações do cliente foram atualizadas com sucesso.",
      });
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        ...formData
      };
      setCustomers([...customers, newCustomer]);
      toast({
        title: "Cliente cadastrado",
        description: "Novo cliente foi adicionado ao sistema.",
      });
    }

    setIsDialogOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      neighborhood: "",
      loadingLocation: "",
      unloadingLocation: "",
      type: "Embarcador"
    });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
    toast({
      title: "Cliente removido",
      description: "O cliente foi removido do sistema.",
      variant: "destructive",
    });
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
          <p className="text-muted-foreground mt-1">
            Cadastre embarcadores e consignatários
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0">
              <Plus className="h-4 w-4" />
              Cadastrar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Editar Cliente" : "Cadastrar Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Razão Social / Nome *</Label>
                <Input
                  id="name"
                  placeholder="Empresa ABC Ltda"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 3333-3333"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    placeholder="São Paulo"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    placeholder="SP"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loadingLocation">Local de Carregamento</Label>
                <Input
                  id="loadingLocation"
                  placeholder="Galpão A - Portão 3"
                  value={formData.loadingLocation}
                  onChange={(e) => setFormData({...formData, loadingLocation: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unloadingLocation">Local de Descarregamento</Label>
                <Input
                  id="unloadingLocation"
                  placeholder="Doca 5 - Setor Norte"
                  value={formData.unloadingLocation}
                  onChange={(e) => setFormData({...formData, unloadingLocation: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Cliente *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as Customer["type"]})}
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
                <Button type="submit">
                  {editingCustomer ? "Atualizar" : "Cadastrar"}
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
                {customer.loadingLocation && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Carregamento:</span>
                    <div className="font-medium">{customer.loadingLocation}</div>
                  </div>
                )}
                {customer.unloadingLocation && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Descarregamento:</span>
                    <div className="font-medium">{customer.unloadingLocation}</div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(customer)}
                  className="flex-1 gap-2"
                >
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