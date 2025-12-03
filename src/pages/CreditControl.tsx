import { useState, useEffect } from "react";
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
import { Pencil, Trash2, Plus, Search, Download, Copy, Check } from "lucide-react";

type CreditRecord = {
  id: string;
  numero_nfe: string;
  cnpj_emitente: string;
  razao_social: string;
  data_emissao: string;
  valor_nfe: number;
  tipo_combustivel: "DIESEL" | "DIESEL+ARLA";
  quantidade: number;
  credito: number;
  chave_acesso: string;
  uf: string;
};

const CreditControl = () => {
  const [records, setRecords] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CreditRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchingNfe, setFetchingNfe] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCopyChave = async (chave: string, id: string) => {
    try {
      await navigator.clipboard.writeText(chave);
      setCopiedId(id);
      toast({ title: "Copiado!", description: "Chave de acesso copiada para a área de transferência" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao copiar chave", variant: "destructive" });
    }
  };
  
  const [formData, setFormData] = useState({
    numero_nfe: "",
    cnpj_emitente: "",
    razao_social: "",
    data_emissao: new Date().toISOString().split("T")[0],
    valor_nfe: "",
    tipo_combustivel: "DIESEL" as "DIESEL" | "DIESEL+ARLA",
    quantidade: "",
    chave_acesso: "",
    uf: "",
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_control")
        .select("*")
        .order("data_emissao", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar registros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCredito = (quantidade: number) => {
    return (quantidade * 112) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantidade = parseFloat(formData.quantidade);
    const credito = calculateCredito(quantidade);

    const payload = {
      ...formData,
      valor_nfe: parseFloat(formData.valor_nfe),
      quantidade,
      credito,
    };

    try {
      if (editingRecord) {
        const { error } = await supabase
          .from("credit_control")
          .update(payload)
          .eq("id", editingRecord.id);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Registro atualizado com sucesso" });
      } else {
        const { error } = await supabase.from("credit_control").insert(payload);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Registro criado com sucesso" });
      }

      fetchRecords();
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar registro",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este registro?")) return;

    try {
      const { error } = await supabase
        .from("credit_control")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Registro excluído com sucesso" });
      fetchRecords();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir registro",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (record: CreditRecord) => {
    setEditingRecord(record);
    setFormData({
      numero_nfe: record.numero_nfe,
      cnpj_emitente: record.cnpj_emitente,
      razao_social: record.razao_social,
      data_emissao: record.data_emissao,
      valor_nfe: record.valor_nfe.toString(),
      tipo_combustivel: record.tipo_combustivel,
      quantidade: record.quantidade.toString(),
      chave_acesso: record.chave_acesso,
      uf: record.uf,
    });
    setDialogOpen(true);
  };

  const fetchNfeData = async () => {
    if (!formData.chave_acesso) {
      toast({
        title: "Atenção",
        description: "Informe a chave de acesso da NF-e",
        variant: "destructive",
      });
      return;
    }

    const chaveNumerica = formData.chave_acesso.replace(/\D/g, "");

    if (chaveNumerica.length !== 44) {
      toast({
        title: "Chave inválida",
        description: `A chave de acesso deve ter 44 dígitos numéricos, você informou ${chaveNumerica.length}.`,
        variant: "destructive",
      });
      return;
    }

    setFetchingNfe(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-nfe", {
        body: { chaveAcesso: chaveNumerica },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Preencher os campos com os dados da NF-e
      setFormData({
        ...formData,
        cnpj_emitente: data.cnpj_emitente,
        razao_social: data.razao_social,
        data_emissao: data.data_emissao,
        numero_nfe: data.numero_nfe,
        uf: data.uf,
        chave_acesso: data.chave_acesso,
      });

      toast({
        title: "Sucesso",
        description: "Dados da NF-e carregados com sucesso",
      });
    } catch (error) {
      console.error("Erro ao buscar NF-e:", error);
      toast({
        title: "Erro",
        description: "Erro ao buscar dados da NF-e",
        variant: "destructive",
      });
    } finally {
      setFetchingNfe(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numero_nfe: "",
      cnpj_emitente: "",
      razao_social: "",
      data_emissao: new Date().toISOString().split("T")[0],
      valor_nfe: "",
      tipo_combustivel: "DIESEL",
      quantidade: "",
      chave_acesso: "",
      uf: "",
    });
    setEditingRecord(null);
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.numero_nfe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.cnpj_emitente.toLowerCase().includes(searchTerm.toLowerCase());
    
    const recordDate = record.data_emissao;
    const matchesStartDate = !startDate || recordDate >= startDate;
    const matchesEndDate = !endDate || recordDate <= endDate;
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const totalCredito = filteredRecords.reduce(
    (sum, record) => sum + record.credito,
    0
  );

  const calculatedCredito = formData.quantidade
    ? calculateCredito(parseFloat(formData.quantidade))
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Controle de Crédito</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? "Editar Registro" : "Novo Registro"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="chave_acesso">Chave de Acesso da NF-e</Label>
                <div className="flex gap-2">
                  <Input
                    id="chave_acesso"
                    value={formData.chave_acesso}
                    onChange={(e) =>
                      setFormData({ ...formData, chave_acesso: e.target.value })
                    }
                    placeholder="44 dígitos da chave de acesso"
                    maxLength={44}
                    required
                  />
                  <Button
                    type="button"
                    onClick={fetchNfeData}
                    disabled={fetchingNfe || !formData.chave_acesso}
                    variant="secondary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {fetchingNfe ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Informe a chave de acesso e clique em "Buscar" para preencher automaticamente os dados da NF-e
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero_nfe">Número NF-e</Label>
                  <Input
                    id="numero_nfe"
                    value={formData.numero_nfe}
                    onChange={(e) =>
                      setFormData({ ...formData, numero_nfe: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj_emitente">CNPJ Emitente</Label>
                  <Input
                    id="cnpj_emitente"
                    value={formData.cnpj_emitente}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj_emitente: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input
                  id="razao_social"
                  value={formData.razao_social}
                  onChange={(e) =>
                    setFormData({ ...formData, razao_social: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data_emissao">Data de Emissão</Label>
                  <Input
                    id="data_emissao"
                    type="date"
                    value={formData.data_emissao}
                    onChange={(e) =>
                      setFormData({ ...formData, data_emissao: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="valor_nfe">Valor da NF-e</Label>
                  <Input
                    id="valor_nfe"
                    type="number"
                    step="0.01"
                    value={formData.valor_nfe}
                    onChange={(e) =>
                      setFormData({ ...formData, valor_nfe: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_combustivel">Tipo de Combustível</Label>
                  <Select
                    value={formData.tipo_combustivel}
                    onValueChange={(value: "DIESEL" | "DIESEL+ARLA") =>
                      setFormData({ ...formData, tipo_combustivel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIESEL">DIESEL</SelectItem>
                      <SelectItem value="DIESEL+ARLA">DIESEL+ARLA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    step="0.01"
                    value={formData.quantidade}
                    onChange={(e) =>
                      setFormData({ ...formData, quantidade: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {formData.quantidade && (
                <div className="p-3 bg-muted rounded-md">
                  <Label>Crédito Calculado</Label>
                  <p className="text-lg font-semibold">
                    {calculatedCredito.toFixed(2)}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  value={formData.uf}
                  onChange={(e) =>
                    setFormData({ ...formData, uf: e.target.value.toUpperCase() })
                  }
                  maxLength={2}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
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
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por NF-e, Razão Social ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">De:</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Até:</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        {(startDate || endDate) && (
          <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); }}>
            Limpar
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Registros</span>
            <span className="text-primary">
              Total de Crédito: {totalCredito.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NF-e</TableHead>
                  <TableHead>Chave de Acesso</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Valor NF-e</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Crédito</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.numero_nfe}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs max-w-[180px] truncate" title={record.chave_acesso}>
                            {record.chave_acesso}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 shrink-0"
                            onClick={() => handleCopyChave(record.chave_acesso, record.id)}
                            title="Copiar chave de acesso"
                          >
                            {copiedId === record.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{record.cnpj_emitente}</TableCell>
                      <TableCell>{record.razao_social}</TableCell>
                      <TableCell>
                        {new Date(record.data_emissao + "T12:00:00").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        R$ {record.valor_nfe.toFixed(2)}
                      </TableCell>
                      <TableCell>{record.tipo_combustivel}</TableCell>
                      <TableCell>{record.quantidade.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">
                        {record.credito.toFixed(2)}
                      </TableCell>
                      <TableCell>{record.uf}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
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
    </div>
  );
};

export default CreditControl;