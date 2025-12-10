import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Printer, Pencil, Trash2, X, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CollectionOrderPrint from "@/components/CollectionOrderPrint";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const PAYMENT_METHODS = ["80% + SALDO", "Pix", "Boleto", "Transferência", "Depósito", "Saldo"];

const FREIGHT_MODES = ["Frete FOB", "Frete CIF"];

interface FormData {
  id?: string;
  weight_tons: number;
  code: string;
  recipient_name: string;
  unloading_city: string;
  unloading_state: string;
  product_id: string;
  freight_type_id: string;
  order_request_number: string;
  observations: string;
  employee_name: string;
  payment_method: string;
  driver_id: string;
  driver_name: string;
  driver_cpf: string;
  driver_phone: string;
  driver_cnh: string;
  driver_cnh_expiry: string;
  owner_name: string;
  owner_phone: string;
  vehicle_plate: string;
  trailer_plates: string[];
  vehicle_type_id: string;
  body_type_id: string;
  sender_name: string;
  loading_city: string;
  loading_state: string;
  issue_date: string;
  collection_date: string;
  freight_mode: string;
}

const initialFormData: FormData = {
  weight_tons: 1,
  code: "",
  recipient_name: "",
  unloading_city: "",
  unloading_state: "",
  product_id: "",
  freight_type_id: "",
  order_request_number: "",
  observations: "",
  employee_name: "",
  payment_method: "",
  driver_id: "",
  driver_name: "",
  driver_cpf: "",
  driver_phone: "",
  driver_cnh: "",
  driver_cnh_expiry: "",
  owner_name: "",
  owner_phone: "",
  vehicle_plate: "",
  trailer_plates: [""],
  vehicle_type_id: "",
  body_type_id: "",
  sender_name: "",
  loading_city: "",
  loading_state: "",
  issue_date: new Date().toISOString().split('T')[0],
  collection_date: "",
  freight_mode: "",
};

export default function CollectionOrders() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState("");
  const [newVehicleType, setNewVehicleType] = useState("");
  const [newBodyType, setNewBodyType] = useState("");
  const [printOrder, setPrintOrder] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["collection-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_orders")
        .select(`
          *,
          products(name),
          freight_types(name),
          vehicle_types(name),
          body_types(name)
        `)
        .order("order_number", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch company settings for order number configuration
  const { data: companySettings } = useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("collection_order_start_number")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").order("license_plate");
      if (error) throw error;
      return data;
    },
  });

  // Filter vehicles by category
  const cavalosVehicles = vehicles.filter((v: any) => v.category === "Cavalo");
  const carretasVehicles = vehicles.filter((v: any) => v.category === "Carreta");

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch freight types
  const { data: freightTypes = [] } = useQuery({
    queryKey: ["freight-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("freight_types").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch vehicle types
  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ["vehicle-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicle_types").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch body types
  const { data: bodyTypes = [] } = useQuery({
    queryKey: ["body-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("body_types").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Calculate the next order number
      let nextOrderNumber: number | undefined = undefined;
      
      // Get the max existing order number
      const { data: maxOrderData } = await supabase
        .from("collection_orders")
        .select("order_number")
        .order("order_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const maxExisting = maxOrderData?.order_number || 0;
      const startNumber = companySettings?.collection_order_start_number || 1;
      
      // Use the greater of: configured start number or (max existing + 1)
      if (maxExisting === 0 && startNumber > 1) {
        // No orders yet and there's a custom start number
        nextOrderNumber = startNumber;
      } else {
        // Use max existing + 1, but ensure it's at least the start number
        nextOrderNumber = Math.max(maxExisting + 1, startNumber);
      }

      const { error } = await supabase.from("collection_orders").insert({
        order_number: nextOrderNumber,
        weight_tons: data.weight_tons,
        code: data.code || null,
        recipient_name: data.recipient_name,
        unloading_city: data.unloading_city,
        unloading_state: data.unloading_state,
        product_id: data.product_id || null,
        freight_type_id: data.freight_type_id || null,
        order_request_number: data.order_request_number || null,
        observations: data.observations || null,
        employee_name: data.employee_name || null,
        payment_method: data.payment_method,
        driver_id: data.driver_id || null,
        driver_name: data.driver_name || null,
        driver_cpf: data.driver_cpf || null,
        driver_phone: data.driver_phone || null,
        driver_cnh: data.driver_cnh || null,
        driver_cnh_expiry: data.driver_cnh_expiry || null,
        owner_name: data.owner_name || null,
        owner_phone: data.owner_phone || null,
        vehicle_plate: data.vehicle_plate || null,
        trailer_plates: data.trailer_plates.filter(p => p.trim() !== ""),
        vehicle_type_id: data.vehicle_type_id || null,
        body_type_id: data.body_type_id || null,
        sender_name: data.sender_name || null,
        loading_city: data.loading_city || null,
        loading_state: data.loading_state || null,
        issue_date: data.issue_date || null,
        collection_date: data.collection_date || null,
        freight_mode: data.freight_mode || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-orders"] });
      toast.success("Ordem de coleta criada com sucesso!");
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingOrderId(null);
    },
    onError: (error) => {
      toast.error("Erro ao criar ordem: " + error.message);
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!data.id) throw new Error("ID da ordem não encontrado");
      const { error } = await supabase.from("collection_orders").update({
        weight_tons: data.weight_tons,
        code: data.code || null,
        recipient_name: data.recipient_name,
        unloading_city: data.unloading_city,
        unloading_state: data.unloading_state,
        product_id: data.product_id || null,
        freight_type_id: data.freight_type_id || null,
        order_request_number: data.order_request_number || null,
        observations: data.observations || null,
        employee_name: data.employee_name || null,
        payment_method: data.payment_method,
        driver_id: data.driver_id || null,
        driver_name: data.driver_name || null,
        driver_cpf: data.driver_cpf || null,
        driver_phone: data.driver_phone || null,
        driver_cnh: data.driver_cnh || null,
        driver_cnh_expiry: data.driver_cnh_expiry || null,
        owner_name: data.owner_name || null,
        owner_phone: data.owner_phone || null,
        vehicle_plate: data.vehicle_plate || null,
        trailer_plates: data.trailer_plates.filter(p => p.trim() !== ""),
        vehicle_type_id: data.vehicle_type_id || null,
        body_type_id: data.body_type_id || null,
        sender_name: data.sender_name || null,
        loading_city: data.loading_city || null,
        loading_state: data.loading_state || null,
        issue_date: data.issue_date || null,
        collection_date: data.collection_date || null,
        freight_mode: data.freight_mode || null,
      }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-orders"] });
      toast.success("Ordem de coleta atualizada com sucesso!");
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingOrderId(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar ordem: " + error.message);
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("products").insert({ name }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setFormData(prev => ({ ...prev, product_id: data.id }));
      setNewProduct("");
      toast.success("Produto cadastrado!");
    },
    onError: () => toast.error("Erro ao cadastrar produto"),
  });

  // Add vehicle type mutation
  const addVehicleTypeMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("vehicle_types").insert({ name }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-types"] });
      setFormData(prev => ({ ...prev, vehicle_type_id: data.id }));
      setNewVehicleType("");
      toast.success("Tipo de veículo cadastrado!");
    },
    onError: () => toast.error("Erro ao cadastrar tipo de veículo"),
  });

  // Add body type mutation
  const addBodyTypeMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("body_types").insert({ name }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["body-types"] });
      setFormData(prev => ({ ...prev, body_type_id: data.id }));
      setNewBodyType("");
      toast.success("Carroceria cadastrada!");
    },
    onError: () => toast.error("Erro ao cadastrar carroceria"),
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collection_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-orders"] });
      toast.success("Ordem excluída!");
    },
    onError: () => toast.error("Erro ao excluir ordem"),
  });

  // Handle driver selection
  const handleDriverSelect = (driverId: string) => {
    const driver = drivers.find((d: any) => d.id === driverId);
    if (driver) {
      setFormData(prev => ({
        ...prev,
        driver_id: driverId,
        driver_name: driver.name || "",
        driver_cpf: driver.cpf || "",
        driver_phone: driver.phone || "",
        driver_cnh: driver.cnh || "",
        driver_cnh_expiry: driver.cnh_expiry || "",
      }));
    }
  };

  const handleSubmit = () => {
    if (!formData.recipient_name || !formData.unloading_city || !formData.unloading_state || !formData.payment_method) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (editingOrderId) {
      updateOrderMutation.mutate({ ...formData, id: editingOrderId });
    } else {
      createOrderMutation.mutate(formData);
    }
  };

  const handleEdit = (order: any) => {
    // Force refetch to get latest data before editing
    queryClient.invalidateQueries({ queryKey: ["collection-orders"] });
    
    setEditingOrderId(order.id);
    setFormData({
      weight_tons: order.weight_tons || 1,
      code: order.code || "",
      recipient_name: order.recipient_name || "",
      unloading_city: order.unloading_city || "",
      unloading_state: order.unloading_state || "",
      product_id: order.product_id || "",
      freight_type_id: order.freight_type_id || "",
      order_request_number: order.order_request_number || "",
      observations: order.observations || "",
      employee_name: order.employee_name || "",
      payment_method: order.payment_method || "",
      driver_id: order.driver_id || "",
      driver_name: order.driver_name || "",
      driver_cpf: order.driver_cpf || "",
      driver_phone: order.driver_phone || "",
      driver_cnh: order.driver_cnh || "",
      driver_cnh_expiry: order.driver_cnh_expiry || "",
      owner_name: order.owner_name || "",
      owner_phone: order.owner_phone || "",
      vehicle_plate: order.vehicle_plate || "",
      trailer_plates: order.trailer_plates?.length > 0 ? order.trailer_plates : [""],
      vehicle_type_id: order.vehicle_type_id || "",
      body_type_id: order.body_type_id || "",
      sender_name: order.sender_name || "",
      loading_city: order.loading_city || "",
      loading_state: order.loading_state || "",
      issue_date: order.issue_date || "",
      collection_date: order.collection_date || "",
      freight_mode: order.freight_mode || "",
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setFormData(initialFormData);
      setEditingOrderId(null);
    }
    setIsDialogOpen(open);
  };

  const addTrailerPlate = () => {
    setFormData(prev => ({
      ...prev,
      trailer_plates: [...prev.trailer_plates, ""],
    }));
  };

  const updateTrailerPlate = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      trailer_plates: prev.trailer_plates.map((p, i) => (i === index ? value : p)),
    }));
  };

  const removeTrailerPlate = (index: number) => {
    if (formData.trailer_plates.length > 1) {
      setFormData(prev => ({
        ...prev,
        trailer_plates: prev.trailer_plates.filter((_, i) => i !== index),
      }));
    }
  };

  if (printOrder) {
    return <CollectionOrderPrint order={printOrder} onClose={() => setPrintOrder(null)} />;
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Ordem de Coleta</h1>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingOrderId(null); setFormData(initialFormData); }} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Nova Ordem</Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editingOrderId ? "Editar Ordem de Coleta" : "Nova Ordem de Coleta"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT SIDE - Order Data */}
              <Card>
                <CardHeader className="bg-muted py-2">
                  <CardTitle className="text-sm font-semibold">DESCRIÇÃO DA ORDEM DE COLETA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Issue Date and Collection Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Emissão</Label>
                      <Input
                        type="date"
                        value={formData.issue_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Data da Coleta</Label>
                      <Input
                        type="date"
                        value={formData.collection_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, collection_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Sender and Loading Location */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Remetente</Label>
                      <Input
                        value={formData.sender_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, sender_name: e.target.value }))}
                        placeholder="Nome do remetente"
                      />
                    </div>
                    <div>
                      <Label>Local de Coleta</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.loading_city}
                          onChange={(e) => setFormData(prev => ({ ...prev, loading_city: e.target.value }))}
                          placeholder="Cidade"
                          className="flex-1"
                        />
                        <Select value={formData.loading_state} onValueChange={(v) => setFormData(prev => ({ ...prev, loading_state: v }))}>
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {BRAZILIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Weight and Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Peso (Ton) *</Label>
                      <Select value={String(formData.weight_tons)} onValueChange={(v) => setFormData(prev => ({ ...prev, weight_tons: Number(v) }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 100 }, (_, i) => i + 1).map(n => (
                            <SelectItem key={n} value={String(n)}>{n}T</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cód.</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Recipient */}
                  <div>
                    <Label>Destinatário *</Label>
                    <Input
                      value={formData.recipient_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                      placeholder="Nome do destinatário"
                    />
                  </div>

                  {/* Unloading Location */}
                  <div>
                    <Label>Descarregamento *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.unloading_city}
                        onChange={(e) => setFormData(prev => ({ ...prev, unloading_city: e.target.value }))}
                        placeholder="Cidade"
                        className="flex-1"
                      />
                      <Select value={formData.unloading_state} onValueChange={(v) => setFormData(prev => ({ ...prev, unloading_state: v }))}>
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRAZILIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Product with add option */}
                  <div>
                    <Label>Produto</Label>
                    <div className="flex gap-2">
                      <Select value={formData.product_id} onValueChange={(v) => setFormData(prev => ({ ...prev, product_id: v }))}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <Input value={newProduct} onChange={(e) => setNewProduct(e.target.value)} placeholder="Nome do produto" />
                            <Button onClick={() => newProduct && addProductMutation.mutate(newProduct)}>Cadastrar</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Freight Type */}
                  <div>
                    <Label>Tipo</Label>
                    <Select value={formData.freight_type_id} onValueChange={(v) => setFormData(prev => ({ ...prev, freight_type_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {freightTypes.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Order Request Number */}
                  <div>
                    <Label>Nº Pedido</Label>
                    <Input
                      value={formData.order_request_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, order_request_number: e.target.value }))}
                    />
                  </div>

                  {/* Freight Mode */}
                  <div>
                    <Label>Tipo de Frete</Label>
                    <Select value={formData.freight_mode} onValueChange={(v) => setFormData(prev => ({ ...prev, freight_mode: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREIGHT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Observations */}
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observations}
                      onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {/* Employee */}
                  <div>
                    <Label>Funcionário</Label>
                    <Input
                      value={formData.employee_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, employee_name: e.target.value }))}
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label>Forma de Pagamento *</Label>
                    <Select value={formData.payment_method} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* RIGHT SIDE - Driver, Owner, Vehicle */}
              <div className="space-y-4">
                {/* Driver Data */}
                <Card>
                  <CardHeader className="bg-muted py-2">
                    <CardTitle className="text-sm font-semibold">DADOS DO MOTORISTA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div>
                      <Label>Motorista</Label>
                      <Select value={formData.driver_id} onValueChange={handleDriverSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o motorista" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>CPF</Label>
                        <Input value={formData.driver_cpf} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>Celular</Label>
                        <Input value={formData.driver_phone} readOnly className="bg-muted" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>CNH</Label>
                        <Input value={formData.driver_cnh} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>Validade CNH</Label>
                        <Input value={formData.driver_cnh_expiry} readOnly className="bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Owner Data */}
                <Card>
                  <CardHeader className="bg-muted py-2">
                    <CardTitle className="text-sm font-semibold">DADOS DO PATRÃO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome</Label>
                        <Input
                          value={formData.owner_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Telefone</Label>
                        <Input
                          value={formData.owner_phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, owner_phone: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Data */}
                <Card>
                  <CardHeader className="bg-muted py-2">
                    <CardTitle className="text-sm font-semibold">DADOS DO VEÍCULO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div>
                      <Label>Placa (Cavalo)</Label>
                      <Select 
                        value={formData.vehicle_plate} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_plate: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cavalo" />
                        </SelectTrigger>
                        <SelectContent>
                          {cavalosVehicles.map((v: any) => (
                            <SelectItem key={v.id} value={v.license_plate}>
                              {v.license_plate} {v.model ? `- ${v.model}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Carreta(s)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addTrailerPlate}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.trailer_plates.map((plate, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Select 
                            value={plate} 
                            onValueChange={(v) => updateTrailerPlate(index, v)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={`Selecione carreta ${index + 1}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {carretasVehicles.map((v: any) => (
                                <SelectItem key={v.id} value={v.license_plate}>
                                  {v.license_plate} {v.model ? `- ${v.model}` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formData.trailer_plates.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeTrailerPlate(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Vehicle Type with add option */}
                    <div>
                      <Label>Tipo de Veículo</Label>
                      <div className="flex gap-2">
                        <Select value={formData.vehicle_type_id} onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_type_id: v }))}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleTypes.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Novo Tipo de Veículo</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <Input value={newVehicleType} onChange={(e) => setNewVehicleType(e.target.value)} placeholder="Ex: LS, Bitrem, etc." />
                              <Button onClick={() => newVehicleType && addVehicleTypeMutation.mutate(newVehicleType)}>Cadastrar</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Body Type with add option */}
                    <div>
                      <Label>Carroceria</Label>
                      <div className="flex gap-2">
                        <Select value={formData.body_type_id} onValueChange={(v) => setFormData(prev => ({ ...prev, body_type_id: v }))}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {bodyTypes.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Nova Carroceria</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <Input value={newBodyType} onChange={(e) => setNewBodyType(e.target.value)} placeholder="Ex: Sider, Baú, etc." />
                              <Button onClick={() => newBodyType && addBodyTypeMutation.mutate(newBodyType)}>Cadastrar</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Standard Text */}
            <Card className="mt-4">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground italic">
                  "Fica estabelecido entre as partes que o prazo para carga é de até 48 horas úteis e para descarga é de até 24 horas úteis. 
                  Considerando que o horário para carga e descarga é das 08:00 às 18:00 horas, de segunda a sexta-feira, exceto feriados. 
                  Com base nos termos do §6º, artigo 11 da Lei nº 11.442/2007. Será pago o valor de até R$ 0,35 / t / h para carga a partir 
                  da 49ª hora e descarga a partir da 25ª hora."
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 mt-4">
              <Button variant="outline" onClick={() => handleDialogClose(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createOrderMutation.isPending || updateOrderMutation.isPending}>
                {(createOrderMutation.isPending || updateOrderMutation.isPending) ? "Salvando..." : (editingOrderId ? "Salvar Alterações" : "Criar Ordem")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma ordem de coleta cadastrada.</p>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="block sm:hidden space-y-4">
            {orders.map((order: any) => (
              <Card key={order.id} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-bold text-lg">Nº {order.order_number}</span>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.order_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                      {order.weight_tons}T
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Destinatário:</span> {order.recipient_name}</p>
                    <p><span className="text-muted-foreground">Destino:</span> {order.unloading_city} - {order.unloading_state}</p>
                    {order.driver_name && (
                      <p><span className="text-muted-foreground">Motorista:</span> {order.driver_name}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPrintOrder(order)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setPrintOrder(order);
                        toast.info("Use Ctrl+P para salvar como PDF e compartilhar via WhatsApp", { duration: 5000 });
                        setTimeout(() => {
                          window.open('https://web.whatsapp.com/', '_blank');
                        }, 500);
                      }}
                    >
                      <Share2 className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (confirm("Deseja realmente excluir esta ordem?")) {
                        deleteOrderMutation.mutate(order.id);
                      }
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead className="hidden md:table-cell">Descarregamento</TableHead>
                  <TableHead className="hidden lg:table-cell">Motorista</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{format(new Date(order.order_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{order.recipient_name}</TableCell>
                    <TableCell className="hidden md:table-cell">{order.unloading_city} - {order.unloading_state}</TableCell>
                    <TableCell className="hidden lg:table-cell">{order.driver_name || "-"}</TableCell>
                    <TableCell>{order.weight_tons}T</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(order)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPrintOrder(order)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setPrintOrder(order);
                            toast.info("Use Ctrl+P para salvar como PDF e compartilhar via WhatsApp", { duration: 5000 });
                            setTimeout(() => {
                              window.open('https://web.whatsapp.com/', '_blank');
                            }, 500);
                          }}
                          title="Compartilhar via WhatsApp"
                        >
                          <Share2 className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          if (confirm("Deseja realmente excluir esta ordem?")) {
                            deleteOrderMutation.mutate(order.id);
                          }
                        }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
