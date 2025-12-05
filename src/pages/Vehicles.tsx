import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  license_plate: string;
  year: number | null;
  model: string | null;
  renavam: string | null;
  vehicle_type: string | null;
  body_type: string | null;
  capacity: string | null;
  status: string | null;
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
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    license_plate: "",
    year: "",
    model: "",
    renavam: "",
    vehicle_type: "",
    body_type: "",
    capacity: ""
  });

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("license_plate");
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkDuplicate = async (licensePlate: string, currentId?: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id")
      .eq("license_plate", licensePlate.toUpperCase());
    
    if (error) return false;
    if (!data || data.length === 0) return false;
    if (currentId && data.length === 1 && data[0].id === currentId) return false;
    return true;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const plate = formData.license_plate.toUpperCase();
      
      // Check for duplicate
      const isDuplicate = await checkDuplicate(plate, editingVehicle?.id);
      if (isDuplicate) {
        throw new Error("Já existe um veículo cadastrado com esta placa.");
      }

      const vehicleData = {
        license_plate: plate,
        year: formData.year ? parseInt(formData.year) : null,
        model: formData.model || null,
        renavam: formData.renavam || null,
        vehicle_type: formData.vehicle_type || null,
        body_type: formData.body_type || null,
        capacity: formData.capacity || null,
        status: "Disponível",
      };

      if (editingVehicle) {
        const { error } = await supabase
          .from("vehicles")
          .update(vehicleData)
          .eq("id", editingVehicle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vehicles").insert(vehicleData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(editingVehicle ? "Veículo atualizado!" : "Veículo cadastrado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar veículo.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Veículo removido!");
    },
    onError: () => {
      toast.error("Erro ao remover veículo.");
    },
  });

  const resetForm = () => {
    setFormData({
      license_plate: "",
      year: "",
      model: "",
      renavam: "",
      vehicle_type: "",
      body_type: "",
      capacity: ""
    });
    setEditingVehicle(null);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      license_plate: vehicle.license_plate,
      year: vehicle.year?.toString() || "",
      model: vehicle.model || "",
      renavam: vehicle.renavam || "",
      vehicle_type: vehicle.vehicle_type || "",
      body_type: vehicle.body_type || "",
      capacity: vehicle.capacity || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.license_plate) {
      toast.error("Placa é obrigatória");
      return;
    }
    saveMutation.mutate();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Disponível":
        return <Badge className="bg-success/10 text-success border-success/20">Disponível</Badge>;
      case "Em Uso":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Em Uso</Badge>;
      case "Manutenção":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Manutenção</Badge>;
      default:
        return <Badge variant="outline">{status || "Disponível"}</Badge>;
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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0" onClick={resetForm}>
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
                  <Label htmlFor="license_plate">Placa *</Label>
                  <Input
                    id="license_plate"
                    placeholder="ABC-1234 ou ABC1D23"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({...formData, license_plate: e.target.value.toUpperCase()})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Ano de Fabricação</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2020"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  placeholder="Scania R450, Volvo FH540, etc."
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="renavam">RENAVAM</Label>
                <Input
                  id="renavam"
                  placeholder="123456789"
                  value={formData.renavam}
                  onChange={(e) => setFormData({...formData, renavam: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Tipo de Veículo</Label>
                  <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({...formData, vehicle_type: value})}>
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
                  <Label htmlFor="body_type">Tipo de Carroceria</Label>
                  <Select value={formData.body_type} onValueChange={(value) => setFormData({...formData, body_type: value})}>
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
                <Label htmlFor="capacity">Capacidade</Label>
                <Input
                  id="capacity"
                  placeholder="25 toneladas, 50m³, etc."
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : editingVehicle ? "Atualizar" : "Cadastrar"}
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
      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{vehicle.license_plate}</CardTitle>
                  {getStatusBadge(vehicle.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Modelo:</span>
                    <span className="text-sm font-medium">{vehicle.model || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ano:</span>
                    <span className="text-sm font-medium">{vehicle.year || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <span className="text-sm font-medium">{vehicle.vehicle_type || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Carroceria:</span>
                    <span className="text-sm font-medium">{vehicle.body_type || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Capacidade:</span>
                    <span className="text-sm font-medium">{vehicle.capacity || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">RENAVAM:</span>
                    <span className="text-sm font-medium">{vehicle.renavam || "-"}</span>
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
                    onClick={() => deleteMutation.mutate(vehicle.id)}
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

      {filteredVehicles.length === 0 && !isLoading && (
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
