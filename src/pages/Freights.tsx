import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Calendar,
  User,
  Truck,
  Package,
  DollarSign,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Freight {
  id: string;
  orderNumber: string;
  loadCode: string;
  originCity: string;
  destinationCity: string;
  loadingCustomer: string;
  unloadingCustomer: string;
  product: string;
  quantity: string;
  packagingType: string;
  driver: string;
  vehicle: string;
  trailer?: string;
  registrationDate: string;
  collectionDate: string;
  paymentMethod: "Antecipado" | "Dinheiro" | "Pix" | "Cartão" | "Transferência";
  value: string;
  status: "Pendente" | "Carregado" | "Em Trânsito" | "Entregue" | "Cancelado";
  observations?: string;
}

const paymentMethods = [
  "Antecipado",
  "Dinheiro", 
  "Pix",
  "Cartão",
  "Transferência"
];

export default function Freights() {
  const { toast } = useToast();
  const [freights, setFreights] = useState<Freight[]>([
    {
      id: "1",
      orderNumber: "PED-2024-001",
      loadCode: "CAR-001",
      originCity: "São Paulo - SP",
      destinationCity: "Rio de Janeiro - RJ",
      loadingCustomer: "Empresa ABC Ltda",
      unloadingCustomer: "Distribuidora XYZ S/A",
      product: "Refrigerante 2L",
      quantity: "500 caixas",
      packagingType: "Caixa de Papelão",
      driver: "João Silva Santos",
      vehicle: "ABC-1234",
      trailer: "TRL-9876",
      registrationDate: "2024-01-15",
      collectionDate: "2024-01-16",
      paymentMethod: "Pix",
      value: "R$ 2.800,00",
      status: "Em Trânsito",
      observations: "Entrega prevista para manhã"
    },
    {
      id: "2",
      orderNumber: "PED-2024-002", 
      loadCode: "CAR-002",
      originCity: "Belo Horizonte - MG",
      destinationCity: "Salvador - BA",
      loadingCustomer: "Indústria DEF",
      unloadingCustomer: "Atacado GHI",
      product: "Smartphone Premium",
      quantity: "200 unidades",
      packagingType: "Caixa de Papelão",
      driver: "Maria Santos Oliveira",
      vehicle: "DEF-5678",
      registrationDate: "2024-01-14",
      collectionDate: "2024-01-17",
      paymentMethod: "Antecipado",
      value: "R$ 3.200,00",
      status: "Pendente"
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFreight, setEditingFreight] = useState<Freight | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    orderNumber: "",
    loadCode: "",
    originCity: "",
    destinationCity: "",
    loadingCustomer: "",
    unloadingCustomer: "",
    product: "",
    quantity: "",
    packagingType: "",
    driver: "",
    vehicle: "",
    trailer: "",
    collectionDate: "",
    paymentMethod: "Pix" as Freight["paymentMethod"],
    value: "",
    observations: ""
  });

  const filteredFreights = freights.filter(freight => {
    const matchesSearch = freight.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      freight.originCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      freight.destinationCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      freight.driver.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || freight.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingFreight) {
      setFreights(freights.map(f => 
        f.id === editingFreight.id 
          ? { ...editingFreight, ...formData, registrationDate: editingFreight.registrationDate, status: editingFreight.status }
          : f
      ));
      toast({
        title: "Frete atualizado",
        description: "As informações do frete foram atualizadas com sucesso.",
      });
    } else {
      const newFreight: Freight = {
        id: Date.now().toString(),
        ...formData,
        registrationDate: new Date().toISOString().split('T')[0],
        status: "Pendente"
      };
      setFreights([...freights, newFreight]);
      toast({
        title: "Frete cadastrado",
        description: "Novo frete foi adicionado ao sistema.",
      });
    }

    setIsDialogOpen(false);
    setEditingFreight(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      orderNumber: "",
      loadCode: "",
      originCity: "",
      destinationCity: "",
      loadingCustomer: "",
      unloadingCustomer: "",
      product: "",
      quantity: "",
      packagingType: "",
      driver: "",
      vehicle: "",
      trailer: "",
      collectionDate: "",
      paymentMethod: "Pix",
      value: "",
      observations: ""
    });
  };

  const handleEdit = (freight: Freight) => {
    setEditingFreight(freight);
    setFormData({
      orderNumber: freight.orderNumber,
      loadCode: freight.loadCode,
      originCity: freight.originCity,
      destinationCity: freight.destinationCity,
      loadingCustomer: freight.loadingCustomer,
      unloadingCustomer: freight.unloadingCustomer,
      product: freight.product,
      quantity: freight.quantity,
      packagingType: freight.packagingType,
      driver: freight.driver,
      vehicle: freight.vehicle,
      trailer: freight.trailer || "",
      collectionDate: freight.collectionDate,
      paymentMethod: freight.paymentMethod,
      value: freight.value,
      observations: freight.observations || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setFreights(freights.filter(f => f.id !== id));
    toast({
      title: "Frete removido",
      description: "O frete foi removido do sistema.",
      variant: "destructive",
    });
  };

  const handleStatusChange = (freightId: string, newStatus: Freight["status"]) => {
    setFreights(freights.map(f => 
      f.id === freightId ? { ...f, status: newStatus } : f
    ));
    toast({
      title: "Status atualizado",
      description: `Status do frete alterado para ${newStatus}.`,
    });
  };

  const getStatusBadge = (status: Freight["status"]) => {
    switch (status) {
      case "Pendente":
        return <Badge className="bg-muted text-muted-foreground">Pendente</Badge>;
      case "Carregado":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Carregado</Badge>;
      case "Em Trânsito":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Em Trânsito</Badge>;
      case "Entregue":
        return <Badge className="bg-success/10 text-success border-success/20">Entregue</Badge>;
      case "Cancelado":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (method: string) => {
    const colors = {
      "Antecipado": "bg-success/10 text-success border-success/20",
      "Pix": "bg-primary/10 text-primary border-primary/20",
      "Cartão": "bg-warning/10 text-warning border-warning/20",
      "Dinheiro": "bg-muted text-muted-foreground",
      "Transferência": "bg-accent/10 text-accent border-accent/20"
    };
    
    return (
      <Badge className={colors[method as keyof typeof colors] || "bg-muted text-muted-foreground"}>
        {method}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            Gestão de Fretes
          </h1>
          <p className="text-muted-foreground mt-1">
            Controle completo das suas operações de frete
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0">
              <Plus className="h-4 w-4" />
              Cadastrar Frete
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFreight ? "Editar Frete" : "Cadastrar Novo Frete"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Número do Pedido *</Label>
                  <Input
                    id="orderNumber"
                    placeholder="PED-2024-001"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loadCode">Código da Carga *</Label>
                  <Input
                    id="loadCode"
                    placeholder="CAR-001"
                    value={formData.loadCode}
                    onChange={(e) => setFormData({...formData, loadCode: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originCity">Cidade de Origem *</Label>
                  <Input
                    id="originCity"
                    placeholder="São Paulo - SP"
                    value={formData.originCity}
                    onChange={(e) => setFormData({...formData, originCity: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinationCity">Cidade de Destino *</Label>
                  <Input
                    id="destinationCity"
                    placeholder="Rio de Janeiro - RJ"
                    value={formData.destinationCity}
                    onChange={(e) => setFormData({...formData, destinationCity: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loadingCustomer">Cliente Carregamento *</Label>
                  <Input
                    id="loadingCustomer"
                    placeholder="Empresa ABC Ltda"
                    value={formData.loadingCustomer}
                    onChange={(e) => setFormData({...formData, loadingCustomer: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unloadingCustomer">Cliente Descarregamento *</Label>
                  <Input
                    id="unloadingCustomer"
                    placeholder="Distribuidora XYZ S/A"
                    value={formData.unloadingCustomer}
                    onChange={(e) => setFormData({...formData, unloadingCustomer: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Produto *</Label>
                  <Input
                    id="product"
                    placeholder="Refrigerante 2L"
                    value={formData.product}
                    onChange={(e) => setFormData({...formData, product: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    placeholder="500 caixas"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packagingType">Tipo de Embalagem *</Label>
                  <Input
                    id="packagingType"
                    placeholder="Caixa de Papelão"
                    value={formData.packagingType}
                    onChange={(e) => setFormData({...formData, packagingType: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driver">Motorista *</Label>
                  <Input
                    id="driver"
                    placeholder="João Silva Santos"
                    value={formData.driver}
                    onChange={(e) => setFormData({...formData, driver: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Veículo *</Label>
                  <Input
                    id="vehicle"
                    placeholder="ABC-1234"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trailer">Reboque/Carreta</Label>
                  <Input
                    id="trailer"
                    placeholder="TRL-9876"
                    value={formData.trailer}
                    onChange={(e) => setFormData({...formData, trailer: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collectionDate">Data de Coleta *</Label>
                  <Input
                    id="collectionDate"
                    type="date"
                    value={formData.collectionDate}
                    onChange={(e) => setFormData({...formData, collectionDate: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value: Freight["paymentMethod"]) => setFormData({...formData, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor do Frete *</Label>
                  <Input
                    id="value"
                    placeholder="R$ 2.800,00"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Observações gerais sobre o frete..."
                  value={formData.observations}
                  onChange={(e) => setFormData({...formData, observations: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingFreight ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6 border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por pedido, origem, destino ou motorista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Carregado">Carregado</SelectItem>
                <SelectItem value="Em Trânsito">Em Trânsito</SelectItem>
                <SelectItem value="Entregue">Entregue</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Freights List */}
      <div className="space-y-4">
        {filteredFreights.map((freight) => (
          <Card key={freight.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle className="text-lg font-semibold">{freight.orderNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground">Código: {freight.loadCode}</p>
                  </div>
                  {getStatusBadge(freight.status)}
                </div>
                <div className="flex items-center gap-2">
                  {getPaymentBadge(freight.paymentMethod)}
                  <span className="font-semibold text-primary">{freight.value}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{freight.originCity}</strong> → <strong>{freight.destinationCity}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{freight.product} - {freight.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{freight.driver}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {freight.vehicle} {freight.trailer && `+ ${freight.trailer}`}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Carregamento:</strong> {freight.loadingCustomer}
                  </div>
                  <div className="text-sm">
                    <strong>Descarregamento:</strong> {freight.unloadingCustomer}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Coleta: {new Date(freight.collectionDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {freight.observations && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Obs:</strong> {freight.observations}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t">
                <Select
                  value={freight.status}
                  onValueChange={(value: Freight["status"]) => handleStatusChange(freight.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Carregado">Carregado</SelectItem>
                    <SelectItem value="Em Trânsito">Em Trânsito</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(freight)}
                  className="gap-2"
                >
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(freight.id)}
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

      {filteredFreights.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum frete encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "Tente ajustar os filtros de busca." 
                : "Comece cadastrando seu primeiro frete."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}