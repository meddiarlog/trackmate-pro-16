import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCircle, Plus, Search, Edit, Trash2, Phone, Mail, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Driver {
  id: string;
  name: string;
  cpf: string;
  cnh: string;
  cnhExpiry: string;
  phone: string;
  email: string;
  status: "Ativo" | "Inativo" | "Em Viagem";
}

export default function Drivers() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: "1",
      name: "João Silva Santos",
      cpf: "123.456.789-00",
      cnh: "12345678901",
      cnhExpiry: "2025-12-31",
      phone: "(11) 99999-9999",
      email: "joao.silva@email.com",
      status: "Ativo"
    },
    {
      id: "2",
      name: "Maria Santos Oliveira",
      cpf: "987.654.321-00",
      cnh: "10987654321",
      cnhExpiry: "2024-08-15",
      phone: "(11) 88888-8888",
      email: "maria.santos@email.com",
      status: "Em Viagem"
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    cnh: "",
    cnhExpiry: "",
    phone: "",
    email: ""
  });

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.cpf.includes(searchTerm) ||
    driver.cnh.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDriver) {
      setDrivers(drivers.map(d => 
        d.id === editingDriver.id 
          ? { ...editingDriver, ...formData, status: "Ativo" as const }
          : d
      ));
      toast({
        title: "Motorista atualizado",
        description: "As informações do motorista foram atualizadas com sucesso.",
      });
    } else {
      const newDriver: Driver = {
        id: Date.now().toString(),
        ...formData,
        status: "Ativo"
      };
      setDrivers([...drivers, newDriver]);
      toast({
        title: "Motorista cadastrado",
        description: "Novo motorista foi adicionado ao sistema.",
      });
    }

    setIsDialogOpen(false);
    setEditingDriver(null);
    setFormData({
      name: "",
      cpf: "",
      cnh: "",
      cnhExpiry: "",
      phone: "",
      email: ""
    });
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      cpf: driver.cpf,
      cnh: driver.cnh,
      cnhExpiry: driver.cnhExpiry,
      phone: driver.phone,
      email: driver.email
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDrivers(drivers.filter(d => d.id !== id));
    toast({
      title: "Motorista removido",
      description: "O motorista foi removido do sistema.",
      variant: "destructive",
    });
  };

  const getStatusBadge = (status: Driver["status"]) => {
    switch (status) {
      case "Ativo":
        return <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge>;
      case "Em Viagem":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Em Viagem</Badge>;
      case "Inativo":
        return <Badge className="bg-muted text-muted-foreground">Inativo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isNearExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffInDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffInDays <= 30;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-primary" />
            Gestão de Motoristas
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre e gerencie os motoristas da sua frota
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0">
              <Plus className="h-4 w-4" />
              Cadastrar Motorista
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDriver ? "Editar Motorista" : "Cadastrar Novo Motorista"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="João Silva Santos"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    placeholder="123.456.789-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnh">CNH *</Label>
                  <Input
                    id="cnh"
                    placeholder="12345678901"
                    value={formData.cnh}
                    onChange={(e) => setFormData({...formData, cnh: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnhExpiry">Validade da CNH *</Label>
                <Input
                  id="cnhExpiry"
                  type="date"
                  value={formData.cnhExpiry}
                  onChange={(e) => setFormData({...formData, cnhExpiry: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="motorista@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDriver ? "Atualizar" : "Cadastrar"}
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
              placeholder="Buscar por nome, CPF ou CNH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrivers.map((driver) => (
          <Card key={driver.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{driver.name}</CardTitle>
                {getStatusBadge(driver.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">CPF:</span>
                  <span className="text-sm font-medium">{driver.cpf}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">CNH:</span>
                  <span className="text-sm font-medium">{driver.cnh}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Validade CNH:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">
                      {new Date(driver.cnhExpiry).toLocaleDateString('pt-BR')}
                    </span>
                    {isNearExpiry(driver.cnhExpiry) && (
                      <Badge variant="destructive" className="text-xs">Vence em breve</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{driver.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{driver.email}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(driver)}
                  className="flex-1 gap-2"
                >
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(driver.id)}
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

      {filteredDrivers.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum motorista encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente ajustar os filtros de busca." : "Comece cadastrando seu primeiro motorista."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}