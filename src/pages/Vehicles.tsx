import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Truck, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Calendar,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Vehicle {
  id: string;
  licensePlate: string;
  year: number;
  model: string;
  renavan: string;
  vehicleType: string;
  bodyType: string;
  capacity: string;
  status: "Disponível" | "Em Uso" | "Manutenção";
}

const vehicleTypes = [
  "Caminhão Simples",
  "Caminhão Toco",
  "Caminhão Truck",
  "Carreta",
  "Bitrem",
  "Rodotrem"
];

const bodyTypes = [
  "Baú",
  "Carroceria",
  "Sider",
  "Frigorífico",
  "Tanque",
  "Graneleiro",
  "Cegonheira"
];

export default function Vehicles() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: "1",
      licensePlate: "ABC-1234",
      year: 2020,
      model: "Scania R450",
      renavan: "123456789",
      vehicleType: "Caminhão Truck",
      bodyType: "Baú",
      capacity: "25 toneladas",
      status: "Disponível"
    },
    {
      id: "2",
      licensePlate: "DEF-5678",
      year: 2019,
      model: "Volvo FH540",
      renavan: "987654321",
      vehicleType: "Carreta",
      bodyType: "Sider",
      capacity: "30 toneladas",
      status: "Em Uso"
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    licensePlate: "",
    year: "",
    model: "",
    renavan: "",
    vehicleType: "",
    bodyType: "",
    capacity: ""
  });

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingVehicle) {
      setVehicles(vehicles.map(v => 
        v.id === editingVehicle.id 
          ? { ...editingVehicle, ...formData, year: parseInt(formData.year), status: "Disponível" as const }
          : v
      ));
      toast({
        title: "Veículo atualizado",
        description: "As informações do veículo foram atualizadas com sucesso.",
      });
    } else {
      const newVehicle: Vehicle = {
        id: Date.now().toString(),
        ...formData,
        year: parseInt(formData.year),
        status: "Disponível"
      };
      setVehicles([...vehicles, newVehicle]);
      toast({
        title: "Veículo cadastrado",
        description: "Novo veículo foi adicionado ao sistema.",
      });
    }

    setIsDialogOpen(false);
    setEditingVehicle(null);
    setFormData({
      licensePlate: "",
      year: "",
      model: "",
      renavan: "",
      vehicleType: "",
      bodyType: "",
      capacity: ""
    });
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      licensePlate: vehicle.licensePlate,
      year: vehicle.year.toString(),
      model: vehicle.model,
      renavan: vehicle.renavan,
      vehicleType: vehicle.vehicleType,
      bodyType: vehicle.bodyType,
      capacity: vehicle.capacity
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
    toast({
      title: "Veículo removido",
      description: "O veículo foi removido do sistema.",
      variant: "destructive",
    });
  };

  const getStatusBadge = (status: Vehicle["status"]) => {
    switch (status) {
      case "Disponível":
        return <Badge className="bg-success/10 text-success border-success/20">Disponível</Badge>;
      case "Em Uso":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Em Uso</Badge>;
      case "Manutenção":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Manutenção</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            Gestão de Veículos
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre e gerencie sua frota de veículos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0">
              <Plus className="h-4 w-4" />
              Cadastrar Veículo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? "Editar Veículo" : "Cadastrar Novo Veículo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">Placa *</Label>
                  <Input
                    id="licensePlate"
                    placeholder="ABC-1234"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Ano de Fabricação *</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2020"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  placeholder="Scania R450, Volvo FH540, etc."
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="renavan">RENAVAN *</Label>
                <Input
                  id="renavan"
                  placeholder="123456789"
                  value={formData.renavan}
                  onChange={(e) => setFormData({...formData, renavan: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Tipo de Veículo *</Label>
                  <Select value={formData.vehicleType} onValueChange={(value) => setFormData({...formData, vehicleType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyType">Tipo de Carroceria *</Label>
                  <Select value={formData.bodyType} onValueChange={(value) => setFormData({...formData, bodyType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a carroceria" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade *</Label>
                <Input
                  id="capacity"
                  placeholder="25 toneladas, 50m³, etc."
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingVehicle ? "Atualizar" : "Cadastrar"}
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
              placeholder="Buscar por placa, modelo ou tipo de veículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{vehicle.licensePlate}</CardTitle>
                {getStatusBadge(vehicle.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Modelo:</span>
                  <span className="text-sm font-medium">{vehicle.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ano:</span>
                  <span className="text-sm font-medium">{vehicle.year}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <span className="text-sm font-medium">{vehicle.vehicleType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Carroceria:</span>
                  <span className="text-sm font-medium">{vehicle.bodyType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Capacidade:</span>
                  <span className="text-sm font-medium">{vehicle.capacity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">RENAVAN:</span>
                  <span className="text-sm font-medium">{vehicle.renavan}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(vehicle)}
                  className="flex-1 gap-2"
                >
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(vehicle.id)}
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

      {filteredVehicles.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum veículo encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente ajustar os filtros de busca." : "Comece cadastrando seu primeiro veículo."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}