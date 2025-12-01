import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";

interface CTE {
  id: string;
  cte_number: string;
  issue_date: string;
  origin: string;
  destination: string;
  value: number;
  weight?: number;
  product_description?: string;
  sender_name?: string;
  sender_cnpj?: string;
  recipient_name?: string;
  recipient_cnpj?: string;
  driver_name?: string;
  vehicle_plate?: string;
  freight_value?: number;
  net_value?: number;
}

export default function CTE() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCte, setEditingCte] = useState<string | null>(null);
  const [selectedCte, setSelectedCte] = useState<CTE | null>(null);

  // Form states
  const [accessKey, setAccessKey] = useState("");
  const [isLoadingAccessKey, setIsLoadingAccessKey] = useState(false);
  const [cteNumber, setCteNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [value, setValue] = useState("");
  const [weight, setWeight] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderCnpj, setSenderCnpj] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientCnpj, setRecipientCnpj] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [freightValue, setFreightValue] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch CTEs
  const { data: ctes = [], isLoading } = useQuery({
    queryKey: ["ctes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ctes")
        .select("*")
        .is("contract_id", null)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data as CTE[];
    },
  });

  const resetForm = () => {
    setAccessKey("");
    setCteNumber("");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setOrigin("");
    setDestination("");
    setValue("");
    setWeight("");
    setProductDescription("");
    setSenderName("");
    setSenderCnpj("");
    setRecipientName("");
    setRecipientCnpj("");
    setDriverName("");
    setVehiclePlate("");
    setFreightValue("");
    setEditingCte(null);
  };

  const handleAccessKeySearch = async () => {
    if (!accessKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe a chave de acesso",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAccessKey(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-cte', {
        body: { chaveAcesso: accessKey }
      });

      if (error) throw error;

      if (data) {
        setCteNumber(data.numeroCte || "");
        setIssueDate(data.dataEmissao || new Date().toISOString().split("T")[0]);
        setSenderName(data.razaoSocial || "");
        setSenderCnpj(data.cnpjEmitente || "");
        setOrigin(data.uf || "");

        toast({
          title: "Dados importados",
          description: "Dados do CT-e foram carregados com sucesso!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao buscar CT-e",
        description: error.message || "Não foi possível buscar os dados da chave de acesso",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAccessKey(false);
    }
  };

  // Create/Update CTE mutation
  const saveCTEMutation = useMutation({
    mutationFn: async () => {
      const cteData = {
        cte_number: cteNumber,
        issue_date: issueDate,
        origin,
        destination,
        value: parseFloat(value),
        weight: weight ? parseFloat(weight) : null,
        product_description: productDescription || null,
        sender_name: senderName || null,
        sender_cnpj: senderCnpj || null,
        recipient_name: recipientName || null,
        recipient_cnpj: recipientCnpj || null,
        driver_name: driverName || null,
        vehicle_plate: vehiclePlate || null,
        freight_value: freightValue ? parseFloat(freightValue) : null,
        contract_id: null,
      };

      if (editingCte) {
        const { error } = await supabase
          .from("ctes")
          .update(cteData)
          .eq("id", editingCte);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ctes").insert(cteData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ctes"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingCte ? "CT-e atualizado" : "CT-e criado",
        description: `O CT-e foi ${editingCte ? "atualizado" : "criado"} com sucesso.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: `Não foi possível ${editingCte ? "atualizar" : "criar"} o CT-e.`,
        variant: "destructive",
      });
    },
  });

  // Delete CTE mutation
  const deleteCTEMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ctes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ctes"] });
      toast({
        title: "CT-e excluído",
        description: "O CT-e foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o CT-e.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (cte: CTE) => {
    setCteNumber(cte.cte_number);
    setIssueDate(cte.issue_date);
    setOrigin(cte.origin);
    setDestination(cte.destination);
    setValue(cte.value.toString());
    setWeight(cte.weight?.toString() || "");
    setProductDescription(cte.product_description || "");
    setSenderName(cte.sender_name || "");
    setSenderCnpj(cte.sender_cnpj || "");
    setRecipientName(cte.recipient_name || "");
    setRecipientCnpj(cte.recipient_cnpj || "");
    setDriverName(cte.driver_name || "");
    setVehiclePlate(cte.vehicle_plate || "");
    setFreightValue(cte.freight_value?.toString() || "");
    setEditingCte(cte.id);
    setIsDialogOpen(true);
  };

  const handleView = (cte: CTE) => {
    setSelectedCte(cte);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">CT-e - Conhecimento de Transporte</h1>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo CT-e
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCte ? "Editar" : "Novo"} CT-e</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                {!editingCte && (
                  <div className="border-b pb-4">
                    <Label htmlFor="accessKey">Chave de Acesso do CT-e</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="accessKey"
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        placeholder="Informe os 44 dígitos da chave de acesso"
                        maxLength={44}
                      />
                      <Button
                        type="button"
                        onClick={handleAccessKeySearch}
                        disabled={isLoadingAccessKey}
                      >
                        {isLoadingAccessKey ? "Buscando..." : "Buscar"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cteNumber">Número do CT-e*</Label>
                    <Input
                      id="cteNumber"
                      value={cteNumber}
                      onChange={(e) => setCteNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="issueDate">Data de Emissão*</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origin">Origem*</Label>
                    <Input
                      id="origin"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">Destino*</Label>
                    <Input
                      id="destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="value">Valor Total*</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="freightValue">Valor do Frete</Label>
                    <Input
                      id="freightValue"
                      type="number"
                      step="0.01"
                      value={freightValue}
                      onChange={(e) => setFreightValue(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="productDescription">Descrição do Produto</Label>
                  <Textarea
                    id="productDescription"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Remetente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="senderName">Nome/Razão Social</Label>
                      <Input
                        id="senderName"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="senderCnpj">CNPJ</Label>
                      <Input
                        id="senderCnpj"
                        value={senderCnpj}
                        onChange={(e) => setSenderCnpj(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Destinatário</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipientName">Nome/Razão Social</Label>
                      <Input
                        id="recipientName"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="recipientCnpj">CNPJ</Label>
                      <Input
                        id="recipientCnpj"
                        value={recipientCnpj}
                        onChange={(e) => setRecipientCnpj(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Transporte</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="driverName">Nome do Motorista</Label>
                      <Input
                        id="driverName"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehiclePlate">Placa do Veículo</Label>
                      <Input
                        id="vehiclePlate"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={() => saveCTEMutation.mutate()}>
                  {editingCte ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CT-es Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Carregando...</div>
          ) : ctes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum CT-e cadastrado. Clique em "Novo CT-e" para adicionar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ctes.map((cte) => (
                  <TableRow key={cte.id}>
                    <TableCell className="font-medium">{cte.cte_number}</TableCell>
                    <TableCell>{format(new Date(cte.issue_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{cte.origin}</TableCell>
                    <TableCell>{cte.destination}</TableCell>
                    <TableCell>{cte.driver_name || "-"}</TableCell>
                    <TableCell>{cte.vehicle_plate || "-"}</TableCell>
                    <TableCell className="text-right">
                      R$ {cte.value.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(cte)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cte)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCTEMutation.mutate(cte.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do CT-e</DialogTitle>
          </DialogHeader>
          {selectedCte && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número do CT-e</Label>
                  <p className="text-sm">{selectedCte.cte_number}</p>
                </div>
                <div>
                  <Label>Data de Emissão</Label>
                  <p className="text-sm">{format(new Date(selectedCte.issue_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div>
                  <Label>Origem</Label>
                  <p className="text-sm">{selectedCte.origin}</p>
                </div>
                <div>
                  <Label>Destino</Label>
                  <p className="text-sm">{selectedCte.destination}</p>
                </div>
                <div>
                  <Label>Valor Total</Label>
                  <p className="text-sm">R$ {selectedCte.value.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Peso</Label>
                  <p className="text-sm">{selectedCte.weight ? `${selectedCte.weight} kg` : "-"}</p>
                </div>
                {selectedCte.sender_name && (
                  <div>
                    <Label>Remetente</Label>
                    <p className="text-sm">{selectedCte.sender_name}</p>
                  </div>
                )}
                {selectedCte.recipient_name && (
                  <div>
                    <Label>Destinatário</Label>
                    <p className="text-sm">{selectedCte.recipient_name}</p>
                  </div>
                )}
                {selectedCte.driver_name && (
                  <div>
                    <Label>Motorista</Label>
                    <p className="text-sm">{selectedCte.driver_name}</p>
                  </div>
                )}
                {selectedCte.vehicle_plate && (
                  <div>
                    <Label>Placa do Veículo</Label>
                    <p className="text-sm">{selectedCte.vehicle_plate}</p>
                  </div>
                )}
              </div>
              {selectedCte.product_description && (
                <div>
                  <Label>Descrição do Produto</Label>
                  <p className="text-sm">{selectedCte.product_description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}