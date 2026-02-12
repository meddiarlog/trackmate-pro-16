import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Plus, Printer, Pencil, Trash2, X, Share2, MoreVertical, Eye, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CollectionOrderPrint from "@/components/CollectionOrderPrint";
import { FilterableTable, FilterableColumn } from "@/components/ui/filterable-table";
import { useTableFilters } from "@/hooks/useTableFilters";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

// PAYMENT_METHODS now loaded dynamically from payment_methods table

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
  order_number_type: string;
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
  weight_tons: 0,
  code: "",
  recipient_name: "",
  unloading_city: "",
  unloading_state: "",
  product_id: "",
  freight_type_id: "",
  order_number_type: "pedido",
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

interface OrderTableData {
  id: string;
  order_number: number;
  formattedDate: string;
  recipient_name: string;
  unloadingLocation: string;
  driver_name: string | null;
  weight_tons: number;
  weightDisplay: string;
  originalOrder: any;
}

interface CollectionOrdersFilterableTableProps {
  orders: any[];
  isLoading: boolean;
  handleEdit: (order: any) => void;
  setPrintOrder: (order: any) => void;
  deleteOrderMutation: any;
}

function CollectionOrdersFilterableTable({
  orders,
  isLoading,
  handleEdit,
  setPrintOrder,
  deleteOrderMutation,
}: CollectionOrdersFilterableTableProps) {
  const formatSafeDate = (dateStr: string | null | undefined, formatStr: string = "dd/MM/yyyy"): string => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr + 'T00:00:00');
      if (isNaN(date.getTime())) return "-";
      return format(date, formatStr, { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const transformedData: OrderTableData[] = useMemo(() => {
    return orders.map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      formattedDate: formatSafeDate(order.order_date),
      recipient_name: order.recipient_name || "-",
      unloadingLocation: order.unloading_city ? `${order.unloading_city} - ${order.unloading_state}` : "-",
      driver_name: order.driver_name || "-",
      weight_tons: order.weight_tons,
      weightDisplay: `${order.weight_tons}T`,
      originalOrder: order,
    }));
  }, [orders]);

  const {
    globalSearch,
    setGlobalSearch,
    columnFilters,
    updateColumnFilter,
    sortConfig,
    toggleSort,
    clearAllFilters,
    filteredData,
    hasActiveFilters,
    totalCount,
    filteredCount,
  } = useTableFilters(transformedData, [
    'order_number', 'recipient_name', 'unloadingLocation', 'driver_name', 'formattedDate'
  ]);

  const columns: FilterableColumn<OrderTableData>[] = [
    { key: 'order_number', header: 'Nº', sortable: true, filterable: true,
      render: (item) => <span className="font-medium">{item.order_number}</span> },
    { key: 'formattedDate', header: 'Data', sortable: true, filterable: true },
    { key: 'recipient_name', header: 'Destinatário', sortable: true, filterable: true },
    { key: 'unloadingLocation', header: 'Descarregamento', sortable: true, filterable: true },
    { key: 'driver_name', header: 'Motorista', sortable: true, filterable: true },
    { key: 'weightDisplay', header: 'Peso', sortable: true, filterable: false },
    { key: 'id', header: 'Ações', sortable: false, filterable: false,
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(item.originalOrder)}>
              <Pencil className="h-4 w-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPrintOrder(item.originalOrder)}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setPrintOrder(item.originalOrder);
              toast.info("Use Ctrl+P para salvar como PDF e compartilhar via WhatsApp", { duration: 5000 });
              setTimeout(() => {
                window.open('https://web.whatsapp.com/', '_blank');
              }, 500);
            }}>
              <Share2 className="h-4 w-4 mr-2 text-green-600" /> Compartilhar
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => {
                if (confirm("Deseja realmente excluir esta ordem?")) {
                  deleteOrderMutation.mutate(item.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ];

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  if (orders.length === 0) {
    return <p className="text-muted-foreground">Nenhuma ordem de coleta cadastrada.</p>;
  }

  return (
    <FilterableTable
      data={filteredData}
      columns={columns}
      globalSearch={globalSearch}
      onGlobalSearchChange={setGlobalSearch}
      columnFilters={columnFilters}
      onColumnFilterChange={updateColumnFilter}
      sortConfig={sortConfig}
      onSort={toggleSort}
      onClearFilters={clearAllFilters}
      hasActiveFilters={hasActiveFilters}
      totalCount={totalCount}
      filteredCount={filteredCount}
      keyExtractor={(item) => item.id}
      emptyMessage="Nenhuma ordem de coleta encontrada."
    />
  );
}

export default function CollectionOrders() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState("");
  const [newVehicleType, setNewVehicleType] = useState("");
  const [newBodyType, setNewBodyType] = useState("");
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [driverSearch, setDriverSearch] = useState("");
  const [driverPopoverOpen, setDriverPopoverOpen] = useState(false);
  
  // Quick add dialogs
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [vehicleCategory, setVehicleCategory] = useState<"Cavalo" | "Carreta">("Cavalo");
  
  // Quick add form data
  const [newDriverData, setNewDriverData] = useState({
    name: "",
    cpf: "",
    cnh: "",
    cnh_expiry: "",
    phone: "",
  });
  const [newVehicleData, setNewVehicleData] = useState({
    license_plate: "",
    model: "",
    category: "Cavalo" as "Cavalo" | "Carreta",
  });
  
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

  // Fetch payment methods
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("name");
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
        recipient_name: data.recipient_name || "",
        unloading_city: data.unloading_city || "",
        unloading_state: data.unloading_state || "",
        product_id: data.product_id || null,
        freight_type_id: data.freight_type_id || null,
        order_number_type: data.order_number_type || "pedido",
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
        recipient_name: data.recipient_name || "",
        unloading_city: data.unloading_city || "",
        unloading_state: data.unloading_state || "",
        product_id: data.product_id || null,
        freight_type_id: data.freight_type_id || null,
        order_number_type: data.order_number_type || "pedido",
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

  // Add freight type mutation
  const addFreightTypeMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("freight_types").insert({ name }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["freight-types"] });
      setFormData(prev => ({ ...prev, freight_type_id: data.id }));
      toast.success("Tipo de frete cadastrado!");
    },
    onError: () => toast.error("Erro ao cadastrar tipo de frete"),
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

  // Add driver mutation (quick add)
  const addDriverMutation = useMutation({
    mutationFn: async (driverData: typeof newDriverData) => {
      const { data, error } = await supabase.from("drivers").insert({
        name: driverData.name,
        cpf: driverData.cpf?.replace(/\D/g, "") || null,
        cnh: driverData.cnh || null,
        cnh_expiry: driverData.cnh_expiry || null,
        phone: driverData.phone || null,
        status: "Ativo",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      // Auto-select the new driver
      setFormData(prev => ({
        ...prev,
        driver_id: data.id,
        driver_name: data.name || "",
        driver_cpf: data.cpf || "",
        driver_phone: data.phone || "",
        driver_cnh: data.cnh || "",
        driver_cnh_expiry: data.cnh_expiry || "",
      }));
      setNewDriverData({ name: "", cpf: "", cnh: "", cnh_expiry: "", phone: "" });
      setIsDriverDialogOpen(false);
      toast.success("Motorista cadastrado e selecionado!");
    },
    onError: (error: any) => toast.error(error.message || "Erro ao cadastrar motorista"),
  });

  // Add vehicle mutation (quick add)
  const addVehicleMutation = useMutation({
    mutationFn: async (vehicleData: typeof newVehicleData) => {
      const { data, error } = await supabase.from("vehicles").insert({
        license_plate: vehicleData.license_plate.toUpperCase(),
        model: vehicleData.model || null,
        category: vehicleData.category,
        status: "Disponível",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      // Auto-select the new vehicle based on category
      if (data.category === "Cavalo") {
        setFormData(prev => ({ ...prev, vehicle_plate: data.license_plate }));
      } else {
        // Add to trailer plates
        setFormData(prev => {
          const plates = [...prev.trailer_plates];
          const emptyIndex = plates.findIndex(p => p === "");
          if (emptyIndex >= 0) {
            plates[emptyIndex] = data.license_plate;
          } else {
            plates.push(data.license_plate);
          }
          return { ...prev, trailer_plates: plates };
        });
      }
      setNewVehicleData({ license_plate: "", model: "", category: "Cavalo" });
      setIsVehicleDialogOpen(false);
      toast.success("Veículo cadastrado e selecionado!");
    },
    onError: (error: any) => toast.error(error.message || "Erro ao cadastrar veículo"),
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
    if (driverId === "__none__") {
      setFormData(prev => ({
        ...prev,
        driver_id: "",
        driver_name: "",
        driver_cpf: "",
        driver_phone: "",
        driver_cnh: "",
        driver_cnh_expiry: "",
      }));
      return;
    }
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
    if (!formData.payment_method) {
      toast.error("Preencha a forma de pagamento");
      return;
    }
    if (formData.weight_tons <= 0) {
      toast.error("Informe o peso");
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
      weight_tons: order.weight_tons || 0,
      code: order.code || "",
      recipient_name: order.recipient_name || "",
      unloading_city: order.unloading_city || "",
      unloading_state: order.unloading_state || "",
      product_id: order.product_id || "",
      freight_type_id: order.freight_type_id || "",
      order_number_type: order.order_number_type || "pedido",
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

  const openQuickDriverDialog = () => {
    setNewDriverData({ name: "", cpf: "", cnh: "", cnh_expiry: "", phone: "" });
    setIsDriverDialogOpen(true);
  };

  const openQuickVehicleDialog = (category: "Cavalo" | "Carreta") => {
    setVehicleCategory(category);
    setNewVehicleData({ license_plate: "", model: "", category });
    setIsVehicleDialogOpen(true);
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

                  {/* Weight and Code - Weight now accepts decimal */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Peso (Ton) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Ex: 18,5"
                        value={formData.weight_tons || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight_tons: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label>Cód.</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Recipient - Not required */}
                  <div>
                    <Label>Destinatário</Label>
                    <Input
                      value={formData.recipient_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                      placeholder="Nome do destinatário"
                    />
                  </div>

                  {/* Unloading Location - Not required */}
                  <div>
                    <Label>Descarregamento</Label>
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
                          <SelectItem value="__none__">-</SelectItem>
                          {BRAZILIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Product with add option */}
                  <div>
                    <Label>Produto</Label>
                    <div className="flex gap-2">
                      <Select value={formData.product_id} onValueChange={(v) => setFormData(prev => ({ ...prev, product_id: v === "__none__" ? "" : v }))}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Nenhum</SelectItem>
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

                  {/* Freight Type with add option */}
                  <div>
                    <Label>Tipo</Label>
                    <div className="flex gap-2">
                      <Select value={formData.freight_type_id} onValueChange={(v) => setFormData(prev => ({ ...prev, freight_type_id: v === "__none__" ? "" : v }))}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Nenhum</SelectItem>
                          {freightTypes.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Novo Tipo de Frete</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <Input id="new-freight-type" placeholder="Nome do tipo" />
                            <Button onClick={() => {
                              const input = document.getElementById('new-freight-type') as HTMLInputElement;
                              if (input?.value) {
                                addFreightTypeMutation.mutate(input.value);
                              }
                            }}>Cadastrar</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Order Request Number with Type Selector */}
                  <div>
                    <Label>Identificação do Pedido</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.order_number_type} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, order_number_type: v }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pedido">Nº Pedido</SelectItem>
                          <SelectItem value="dt">Nº DT</SelectItem>
                          <SelectItem value="remessa">Nº Remessa</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="flex-1"
                        value={formData.order_request_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, order_request_number: e.target.value }))}
                        placeholder="Digite o número"
                      />
                    </div>
                  </div>

                  {/* Freight Mode */}
                  <div>
                    <Label>Tipo de Frete</Label>
                    <Select value={formData.freight_mode} onValueChange={(v) => setFormData(prev => ({ ...prev, freight_mode: v === "__none__" ? "" : v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
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
                        {paymentMethods.map((pm: any) => <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>)}
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
                      <div className="flex gap-2">
                        <Popover open={driverPopoverOpen} onOpenChange={setDriverPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="flex-1 justify-between">
                              {formData.driver_name || "Buscar motorista..."}
                              <Search className="h-4 w-4 ml-2 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[350px] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder="Buscar por nome, CPF ou CNH..."
                                value={driverSearch}
                                onValueChange={setDriverSearch}
                              />
                              <CommandList>
                                <CommandEmpty>Nenhum motorista encontrado</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem onSelect={() => {
                                    handleDriverSelect("__none__");
                                    setDriverPopoverOpen(false);
                                    setDriverSearch("");
                                  }}>
                                    <span className="text-muted-foreground">Nenhum</span>
                                  </CommandItem>
                                  {drivers
                                    .filter((d: any) => {
                                      if (!driverSearch) return true;
                                      const search = driverSearch.toLowerCase();
                                      const normalizedSearch = driverSearch.replace(/\D/g, "");
                                      const normalizedCpf = d.cpf?.replace(/\D/g, "") || "";
                                      const normalizedCnh = d.cnh?.replace(/\D/g, "") || "";
                                      return (
                                        d.name?.toLowerCase().includes(search) ||
                                        normalizedCpf.includes(normalizedSearch) ||
                                        normalizedCnh.includes(normalizedSearch)
                                      );
                                    })
                                    .map((d: any) => (
                                      <CommandItem key={d.id} onSelect={() => {
                                        handleDriverSelect(d.id);
                                        setDriverPopoverOpen(false);
                                        setDriverSearch("");
                                      }}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{d.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            CPF: {d.cpf || "-"} | CNH: {d.cnh || "-"}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="icon" onClick={openQuickDriverDialog}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
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
                      <div className="flex gap-2">
                        <Select 
                          value={formData.vehicle_plate} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_plate: v === "__none__" ? "" : v }))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione o cavalo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Nenhum</SelectItem>
                            {cavalosVehicles.map((v: any) => (
                              <SelectItem key={v.id} value={v.license_plate}>
                                {v.license_plate} {v.model ? `- ${v.model}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => openQuickVehicleDialog("Cavalo")}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Carreta(s)</Label>
                        <div className="flex gap-1">
                          <Button type="button" variant="outline" size="sm" onClick={() => openQuickVehicleDialog("Carreta")}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={addTrailerPlate}>
                            Adicionar
                          </Button>
                        </div>
                      </div>
                      {formData.trailer_plates.map((plate, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Select 
                            value={plate} 
                            onValueChange={(v) => updateTrailerPlate(index, v === "__none__" ? "" : v)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={`Selecione carreta ${index + 1}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Nenhum</SelectItem>
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

                    {/* Vehicle Type with add option - can be cleared */}
                    <div>
                      <Label>Tipo de Veículo</Label>
                      <div className="flex gap-2">
                        <Select value={formData.vehicle_type_id} onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_type_id: v === "__none__" ? "" : v }))}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Nenhum</SelectItem>
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

                    {/* Body Type with add option - can be cleared */}
                    <div>
                      <Label>Carroceria</Label>
                      <div className="flex gap-2">
                        <Select value={formData.body_type_id} onValueChange={(v) => setFormData(prev => ({ ...prev, body_type_id: v === "__none__" ? "" : v }))}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Nenhum</SelectItem>
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

      {/* Quick Add Driver Dialog */}
      <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cadastro Rápido de Motorista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={newDriverData.name}
                onChange={(e) => setNewDriverData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CPF</Label>
                <Input
                  value={newDriverData.cpf}
                  onChange={(e) => setNewDriverData(prev => ({ ...prev, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={newDriverData.phone}
                  onChange={(e) => setNewDriverData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CNH</Label>
                <Input
                  value={newDriverData.cnh}
                  onChange={(e) => setNewDriverData(prev => ({ ...prev, cnh: e.target.value }))}
                  placeholder="Número da CNH"
                />
              </div>
              <div>
                <Label>Validade CNH</Label>
                <Input
                  type="date"
                  value={newDriverData.cnh_expiry}
                  onChange={(e) => setNewDriverData(prev => ({ ...prev, cnh_expiry: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDriverDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => {
                if (!newDriverData.name) {
                  toast.error("Informe o nome do motorista");
                  return;
                }
                addDriverMutation.mutate(newDriverData);
              }}
              disabled={addDriverMutation.isPending}
            >
              {addDriverMutation.isPending ? "Salvando..." : "Cadastrar e Selecionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Vehicle Dialog */}
      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cadastro Rápido de {vehicleCategory}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Placa *</Label>
              <Input
                value={newVehicleData.license_plate}
                onChange={(e) => setNewVehicleData(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                placeholder="ABC1234"
                maxLength={7}
              />
            </div>
            <div>
              <Label>Modelo</Label>
              <Input
                value={newVehicleData.model}
                onChange={(e) => setNewVehicleData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Ex: Volvo FH 540"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVehicleDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => {
                if (!newVehicleData.license_plate) {
                  toast.error("Informe a placa do veículo");
                  return;
                }
                addVehicleMutation.mutate({ ...newVehicleData, category: vehicleCategory });
              }}
              disabled={addVehicleMutation.isPending}
            >
              {addVehicleMutation.isPending ? "Salvando..." : "Cadastrar e Selecionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CollectionOrdersFilterableTable
        orders={orders}
        isLoading={isLoading}
        handleEdit={handleEdit}
        setPrintOrder={setPrintOrder}
        deleteOrderMutation={deleteOrderMutation}
      />
    </div>
  );
}
