import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, Plus, Search, Edit, Trash2, Phone, Mail, FileText, Download, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Driver {
  id: string;
  name: string;
  cpf: string | null;
  cnh: string | null;
  cnh_expiry: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
}

interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

const DOCUMENT_TYPES = [
  { value: "CNH", label: "CNH" },
  { value: "CLV", label: "CLV" },
  { value: "RG", label: "RG" },
  { value: "CPF", label: "CPF" },
  { value: "Comprovante de Residência", label: "Comprovante de Residência" },
  { value: "Outro", label: "Outro" },
];

export default function Drivers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    cnh: "",
    cnh_expiry: "",
    phone: "",
    email: "",
    status: "Ativo"
  });
  
  const [docType, setDocType] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch drivers
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Driver[];
    },
  });

  // Fetch documents for selected driver
  const { data: driverDocuments = [] } = useQuery({
    queryKey: ["driver_documents", selectedDriverId],
    queryFn: async () => {
      if (!selectedDriverId) return [];
      const { data, error } = await supabase
        .from("driver_documents")
        .select("*")
        .eq("driver_id", selectedDriverId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DriverDocument[];
    },
    enabled: !!selectedDriverId,
  });

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.cpf && driver.cpf.includes(searchTerm)) ||
    (driver.cnh && driver.cnh.includes(searchTerm))
  );

  // Save driver mutation
  const saveDriverMutation = useMutation({
    mutationFn: async () => {
      const driverData = {
        name: formData.name,
        cpf: formData.cpf || null,
        cnh: formData.cnh || null,
        cnh_expiry: formData.cnh_expiry || null,
        phone: formData.phone || null,
        email: formData.email || null,
        status: formData.status,
      };

      if (editingDriver) {
        const { error } = await supabase
          .from("drivers")
          .update(driverData)
          .eq("id", editingDriver.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("drivers").insert(driverData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingDriver ? "Motorista atualizado" : "Motorista cadastrado",
        description: `O motorista foi ${editingDriver ? "atualizado" : "cadastrado"} com sucesso.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o motorista.",
        variant: "destructive",
      });
    },
  });

  // Delete driver mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("drivers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: "Motorista removido",
        description: "O motorista foi removido do sistema.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o motorista.",
        variant: "destructive",
      });
    },
  });

  // Upload document mutation
  const uploadDocMutation = useMutation({
    mutationFn: async () => {
      if (!docFile || !docType || !selectedDriverId) throw new Error("Dados incompletos");
      
      setUploading(true);
      
      const fileExt = docFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedDriverId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(filePath, docFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("driver_documents").insert({
        driver_id: selectedDriverId,
        document_type: docType,
        file_name: docFile.name,
        file_url: publicUrl,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver_documents", selectedDriverId] });
      setDocType("");
      setDocFile(null);
      toast({
        title: "Documento anexado",
        description: "O documento foi anexado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível anexar o documento.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  // Delete document mutation
  const deleteDocMutation = useMutation({
    mutationFn: async (doc: DriverDocument) => {
      const { error } = await supabase
        .from("driver_documents")
        .delete()
        .eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver_documents", selectedDriverId] });
      toast({
        title: "Documento removido",
        description: "O documento foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o documento.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      cpf: "",
      cnh: "",
      cnh_expiry: "",
      phone: "",
      email: "",
      status: "Ativo"
    });
    setEditingDriver(null);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      cpf: driver.cpf || "",
      cnh: driver.cnh || "",
      cnh_expiry: driver.cnh_expiry || "",
      phone: driver.phone || "",
      email: driver.email || "",
      status: driver.status || "Ativo"
    });
    setIsDialogOpen(true);
  };

  const handleOpenDocs = (driverId: string) => {
    setSelectedDriverId(driverId);
    setIsDocDialogOpen(true);
  };

  const handleDownloadDoc = async (doc: DriverDocument) => {
    try {
      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      window.open(doc.file_url, '_blank');
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Ativo":
        return <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge>;
      case "Em Viagem":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Em Viagem</Badge>;
      case "Inativo":
        return <Badge className="bg-muted text-muted-foreground">Inativo</Badge>;
      default:
        return <Badge variant="outline">{status || "Ativo"}</Badge>;
    }
  };

  const isNearExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffInDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffInDays <= 30;
  };

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
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
            <div className="space-y-6">
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
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="123.456.789-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnh">CNH</Label>
                  <Input
                    id="cnh"
                    placeholder="12345678901"
                    value={formData.cnh}
                    onChange={(e) => setFormData({...formData, cnh: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnh_expiry">Validade da CNH</Label>
                  <Input
                    id="cnh_expiry"
                    type="date"
                    value={formData.cnh_expiry}
                    onChange={(e) => setFormData({...formData, cnh_expiry: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Em Viagem">Em Viagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="motorista@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => saveDriverMutation.mutate()}>
                {editingDriver ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
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
      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
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
                    <span className="text-sm font-medium">{driver.cpf || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">CNH:</span>
                    <span className="text-sm font-medium">{driver.cnh || "-"}</span>
                  </div>
                  {driver.cnh_expiry && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Validade CNH:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          {format(new Date(driver.cnh_expiry), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {isNearExpiry(driver.cnh_expiry) && (
                          <Badge variant="destructive" className="text-xs">Vence em breve</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {driver.phone && (
                    <div className="flex items-center gap-2 pt-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{driver.phone}</span>
                    </div>
                  )}
                  {driver.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{driver.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDocs(driver.id)}
                    className="flex-1 gap-2"
                  >
                    <FileText className="h-3 w-3" />
                    Documentos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(driver)}
                    className="gap-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteDriverMutation.mutate(driver.id)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredDrivers.length === 0 && !isLoading && (
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

      {/* Documents Dialog */}
      <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Documentos - {selectedDriver?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Upload new document */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-3">Anexar Novo Documento</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Documento</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Arquivo</Label>
                  <Input
                    type="file"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>
              </div>
              <Button
                className="mt-3"
                onClick={() => uploadDocMutation.mutate()}
                disabled={!docType || !docFile || uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Enviando..." : "Anexar Documento"}
              </Button>
            </div>

            {/* Documents list */}
            <div>
              <h4 className="font-medium mb-3">Documentos Anexados</h4>
              {driverDocuments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum documento anexado ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {driverDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.document_type}</p>
                          <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadDoc(doc)}
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDocMutation.mutate(doc)}
                          title="Remover"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
