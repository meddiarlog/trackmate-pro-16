import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Search, Download, Eye, Upload, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Boleto = {
  id: string;
  customer_id: string;
  issue_date: string;
  due_date: string;
  file_url: string;
  file_name: string;
  status: string;
  created_at: string;
  customer?: {
    name: string;
  };
};

type Customer = {
  id: string;
  name: string;
};

const Boletos = () => {
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
  const [viewingBoleto, setViewingBoleto] = useState<Boleto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    customer_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date().toISOString().split("T")[0],
    file: null as File | null,
  });

  useEffect(() => {
    fetchBoletos();
    fetchCustomers();
  }, []);

  const fetchBoletos = async () => {
    try {
      const { data, error } = await supabase
        .from("boletos")
        .select(`
          *,
          customer:customers(name)
        `)
        .order("due_date", { ascending: false });

      if (error) throw error;
      setBoletos(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar boletos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string } | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("boletos")
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("boletos")
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl, name: file.name };
  };

  const deleteFile = async (fileUrl: string) => {
    const fileName = fileUrl.split("/").pop();
    if (fileName) {
      await supabase.storage.from("boletos").remove([fileName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive",
      });
      return;
    }

    if (!editingBoleto && !formData.file) {
      toast({
        title: "Erro",
        description: "Anexe o arquivo do boleto",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      let fileData = editingBoleto 
        ? { url: editingBoleto.file_url, name: editingBoleto.file_name }
        : null;

      if (formData.file) {
        // Delete old file if editing
        if (editingBoleto) {
          await deleteFile(editingBoleto.file_url);
        }
        fileData = await uploadFile(formData.file);
      }

      if (!fileData) {
        throw new Error("Erro ao processar arquivo");
      }

      const payload = {
        customer_id: formData.customer_id,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        file_url: fileData.url,
        file_name: fileData.name,
        status: "Anexado",
      };

      if (editingBoleto) {
        const { error } = await supabase
          .from("boletos")
          .update(payload)
          .eq("id", editingBoleto.id);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Boleto atualizado com sucesso" });
      } else {
        const { error } = await supabase.from("boletos").insert(payload);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Boleto criado com sucesso" });
      }

      fetchBoletos();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar boleto",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (boleto: Boleto) => {
    if (!confirm("Deseja realmente excluir este boleto?")) return;

    try {
      await deleteFile(boleto.file_url);

      const { error } = await supabase
        .from("boletos")
        .delete()
        .eq("id", boleto.id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Boleto excluído com sucesso" });
      fetchBoletos();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir boleto",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (boleto: Boleto) => {
    setEditingBoleto(boleto);
    setFormData({
      customer_id: boleto.customer_id,
      issue_date: boleto.issue_date,
      due_date: boleto.due_date,
      file: null,
    });
    setDialogOpen(true);
  };

  const handleView = (boleto: Boleto) => {
    setViewingBoleto(boleto);
    setViewDialogOpen(true);
  };

  const handleDownload = (boleto: Boleto) => {
    window.open(boleto.file_url, "_blank");
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date().toISOString().split("T")[0],
      file: null,
    });
    setEditingBoleto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredBoletos = boletos.filter((boleto) =>
    boleto.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Anexado":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const isFilePreviewable = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Boletos</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Boleto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingBoleto ? "Editar Boleto" : "Novo Boleto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="customer_id">Cliente *</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, customer_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="issue_date">Data de Emissão *</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) =>
                    setFormData({ ...formData, issue_date: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="due_date">Data de Vencimento *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="file">
                  {editingBoleto ? "Substituir Arquivo (opcional)" : "Arquivo do Boleto *"}
                </Label>
                <div className="mt-2">
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setFormData({ ...formData, file: e.target.files?.[0] || null })
                    }
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos aceitos: PDF, JPG, PNG
                  </p>
                </div>
                {editingBoleto && !formData.file && (
                  <div className="mt-2 p-2 bg-muted rounded flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm truncate">{editingBoleto.file_name}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Boletos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data de Emissão</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBoletos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Nenhum boleto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBoletos.map((boleto) => (
                    <TableRow key={boleto.id}>
                      <TableCell className="font-medium">
                        {boleto.customer?.name || "—"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(boleto.issue_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(boleto.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                          {boleto.file_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getStatusColor(boleto.status)}`}>
                          {boleto.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(boleto)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(boleto)}
                            title="Baixar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(boleto)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(boleto)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualizar Boleto</DialogTitle>
          </DialogHeader>
          {viewingBoleto && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-medium">{viewingBoleto.customer?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vencimento:</span>
                  <p className="font-medium">
                    {format(new Date(viewingBoleto.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className={`font-medium ${getStatusColor(viewingBoleto.status)}`}>
                    {viewingBoleto.status}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Arquivo:</span>
                  <p className="font-medium">{viewingBoleto.file_name}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-muted/50 min-h-[400px] flex items-center justify-center">
                {isFilePreviewable(viewingBoleto.file_name) ? (
                  viewingBoleto.file_name.toLowerCase().endsWith(".pdf") ? (
                    <iframe
                      src={viewingBoleto.file_url}
                      className="w-full h-[500px]"
                      title="Boleto PDF"
                    />
                  ) : (
                    <img
                      src={viewingBoleto.file_url}
                      alt="Boleto"
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  )
                ) : (
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Visualização não disponível para este formato
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleDownload(viewingBoleto)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Arquivo
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => handleDownload(viewingBoleto)}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Boletos;
