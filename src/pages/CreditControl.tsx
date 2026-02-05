import React, { useState, useEffect, useMemo } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Download, Copy, Check, Calculator, X, CreditCard, ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FilterableTable, FilterableColumn } from "@/components/ui/filterable-table";
import { useTableFilters } from "@/hooks/useTableFilters";
import { UtilizarCreditoDialog } from "@/components/UtilizarCreditoDialog";

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
  // Computed fields for filtering
  formattedDataEmissao?: string;
  formattedValorNfe?: string;
  formattedCredito?: string;
};

// Calculator component for quantity field
const QuantityCalculator = ({ onResult }: { onResult: (result: number) => void }) => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue;
      let newValue: number;

      switch (operation) {
        case "+":
          newValue = currentValue + inputValue;
          break;
        case "-":
          newValue = currentValue - inputValue;
          break;
        case "×":
          newValue = currentValue * inputValue;
          break;
        case "÷":
          newValue = currentValue / inputValue;
          break;
        default:
          newValue = inputValue;
      }

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    let newValue: number;

    switch (operation) {
      case "+":
        newValue = previousValue + inputValue;
        break;
      case "-":
        newValue = previousValue - inputValue;
        break;
      case "×":
        newValue = previousValue * inputValue;
        break;
      case "÷":
        newValue = previousValue / inputValue;
        break;
      default:
        newValue = inputValue;
    }

    setDisplay(String(newValue));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const useResult = () => {
    const result = parseFloat(display);
    if (!isNaN(result)) {
      onResult(result);
      clear();
      setIsOpen(false);
    }
  };

  // Keyboard event handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      inputDigit(e.key);
    } else if (e.key === '.' || e.key === ',') {
      e.preventDefault();
      inputDecimal();
    } else if (e.key === '+') {
      e.preventDefault();
      performOperation('+');
    } else if (e.key === '-') {
      e.preventDefault();
      performOperation('-');
    } else if (e.key === '*') {
      e.preventDefault();
      performOperation('×');
    } else if (e.key === '/') {
      e.preventDefault();
      performOperation('÷');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      calculate();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      backspace();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      clear();
    }
  };

  // Auto-focus when opening
  React.useEffect(() => {
    if (isOpen && popoverRef.current) {
      popoverRef.current.focus();
    }
  }, [isOpen]);

  const CalcButton = ({ onClick, children, className = "" }: { onClick: () => void; children: React.ReactNode; className?: string }) => (
    <Button
      type="button"
      variant="outline"
      className={`h-10 w-10 text-lg font-medium ${className}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon">
          <Calculator className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        ref={popoverRef}
        className="w-64 p-3" 
        align="end"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="space-y-2">
          <div className="bg-muted p-2 rounded text-right text-xl font-mono min-h-[40px]">
            {display}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Use o teclado: números, +, -, *, /, Enter, Backspace, C
          </p>
          <div className="grid grid-cols-4 gap-1">
            <CalcButton onClick={clear} className="col-span-2 w-full bg-destructive/10 hover:bg-destructive/20">C</CalcButton>
            <CalcButton onClick={() => performOperation("÷")}>÷</CalcButton>
            <CalcButton onClick={() => performOperation("×")}>×</CalcButton>
            
            <CalcButton onClick={() => inputDigit("7")}>7</CalcButton>
            <CalcButton onClick={() => inputDigit("8")}>8</CalcButton>
            <CalcButton onClick={() => inputDigit("9")}>9</CalcButton>
            <CalcButton onClick={() => performOperation("-")}>-</CalcButton>
            
            <CalcButton onClick={() => inputDigit("4")}>4</CalcButton>
            <CalcButton onClick={() => inputDigit("5")}>5</CalcButton>
            <CalcButton onClick={() => inputDigit("6")}>6</CalcButton>
            <CalcButton onClick={() => performOperation("+")}>+</CalcButton>
            
            <CalcButton onClick={() => inputDigit("1")}>1</CalcButton>
            <CalcButton onClick={() => inputDigit("2")}>2</CalcButton>
            <CalcButton onClick={() => inputDigit("3")}>3</CalcButton>
            <CalcButton onClick={calculate} className="row-span-2 h-full">=</CalcButton>
            
            <CalcButton onClick={() => inputDigit("0")} className="col-span-2 w-full">0</CalcButton>
            <CalcButton onClick={inputDecimal}>.</CalcButton>
          </div>
          <Button type="button" className="w-full" onClick={useResult}>
            Usar Resultado
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const CreditControl = () => {
  const [records, setRecords] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CreditRecord | null>(null);
  const [fetchingNfe, setFetchingNfe] = useState(false);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [utilizarDialogOpen, setUtilizarDialogOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [creditoSort, setCreditoSort] = useState<'none' | 'asc' | 'desc'>('none');

  const handleCopyChave = async (chave: string, id: string) => {
    try {
      await navigator.clipboard.writeText(chave);
      setCopiedIds(prev => new Set(prev).add(id));
      toast({ title: "Copiado!", description: "Chave de acesso copiada para a área de transferência" });
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

  // Transform records with computed fields for filtering
  const transformedRecords = useMemo(() => {
    return records.map(record => ({
      ...record,
      formattedDataEmissao: new Date(record.data_emissao + "T12:00:00").toLocaleDateString("pt-BR"),
      formattedValorNfe: `R$ ${record.valor_nfe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      formattedCredito: record.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    }));
  }, [records]);

  // Apply date filters before useTableFilters
  const dateFilteredRecords = useMemo(() => {
    let result = transformedRecords;

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(record => {
        const recordDate = new Date(record.data_emissao + "T12:00:00");
        recordDate.setHours(0, 0, 0, 0);
        return recordDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(record => {
        const recordDate = new Date(record.data_emissao + "T12:00:00");
        return recordDate <= toDate;
      });
    }

    return result;
  }, [transformedRecords, dateFrom, dateTo]);

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
  } = useTableFilters(dateFilteredRecords, [
    'numero_nfe', 'cnpj_emitente', 'razao_social', 'chave_acesso', 'uf', 'tipo_combustivel'
  ]);

  // Apply credit sorting after useTableFilters
  const sortedFilteredData = useMemo(() => {
    if (creditoSort === 'none') return filteredData;
    return [...filteredData].sort((a, b) => {
      return creditoSort === 'asc'
        ? a.credito - b.credito
        : b.credito - a.credito;
    });
  }, [filteredData, creditoSort]);

  const calculateCredito = (quantidade: number) => {
    return Math.round(((quantidade * 112) / 100) * 100) / 100;
  };

  const checkDuplicateNfe = async (chaveAcesso: string, currentId?: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("credit_control")
      .select("id")
      .eq("chave_acesso", chaveAcesso);
    
    if (error) return false;
    if (!data || data.length === 0) return false;
    if (currentId && data.length === 1 && data[0].id === currentId) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantidade = parseFloat(formData.quantidade);
    const credito = calculateCredito(quantidade);

    // Check for duplicate NF-e
    if (!editingRecord) {
      const isDuplicate = await checkDuplicateNfe(formData.chave_acesso);
      if (isDuplicate) {
        toast({
          title: "NF-e Duplicada",
          description: "Esta NF-e já está cadastrada no sistema. Não é permitido lançar notas duplicadas.",
          variant: "destructive",
        });
        return;
      }
    }

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
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
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

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedFilteredData.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRecord = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  // Calculate totals
  const totalCredito = sortedFilteredData.reduce((sum, record) => sum + record.credito, 0);
  const selectedRecords = sortedFilteredData.filter(r => selectedIds.has(r.id));
  const selectedCredito = selectedRecords.reduce((sum, record) => sum + record.credito, 0);

  const calculatedCredito = formData.quantidade
    ? calculateCredito(parseFloat(formData.quantidade))
    : 0;

  const isAllSelected = sortedFilteredData.length > 0 && sortedFilteredData.every(r => selectedIds.has(r.id));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const columns: FilterableColumn<CreditRecord>[] = [
    {
      key: "select",
      header: "",
      filterable: false,
      className: "w-[40px]",
      headerClassName: "w-[40px]",
      renderHeader: () => (
        <Checkbox
          checked={isAllSelected}
          ref={(el) => {
            if (el) {
              (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isIndeterminate;
            }
          }}
          onCheckedChange={(checked) => handleSelectAll(!!checked)}
          aria-label="Selecionar todos"
        />
      ),
      render: (item) => (
        <Checkbox
          checked={selectedIds.has(item.id)}
          onCheckedChange={(checked) => handleSelectRecord(item.id, !!checked)}
          aria-label={`Selecionar ${item.numero_nfe}`}
        />
      ),
    },
    {
      key: "numero_nfe",
      header: "NF-e",
      sortable: true,
      render: (item) => item.numero_nfe,
    },
    {
      key: "chave_acesso",
      header: "Chave de Acesso",
      sortable: true,
      render: (item) => {
        const isCopied = copiedIds.has(item.id);
        return (
          <div className="flex items-center gap-2">
            <span 
              className={`font-mono text-xs max-w-[180px] truncate transition-colors ${
                isCopied ? 'text-green-600' : ''
              }`} 
              title={item.chave_acesso}
            >
              {item.chave_acesso}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 shrink-0 transition-colors ${
                isCopied ? 'bg-green-50 hover:bg-green-100' : ''
              }`}
              onClick={() => handleCopyChave(item.chave_acesso, item.id)}
              title="Copiar chave de acesso"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
    {
      key: "cnpj_emitente",
      header: "CNPJ",
      sortable: true,
      render: (item) => item.cnpj_emitente,
    },
    {
      key: "razao_social",
      header: "Razão Social",
      sortable: true,
      render: (item) => item.razao_social,
    },
    {
      key: "formattedDataEmissao",
      header: "Data Emissão",
      sortable: true,
      render: (item) => item.formattedDataEmissao,
    },
    {
      key: "formattedValorNfe",
      header: "Valor NF-e",
      sortable: true,
      render: (item) => item.formattedValorNfe,
    },
    {
      key: "tipo_combustivel",
      header: "Combustível",
      sortable: true,
      render: (item) => item.tipo_combustivel,
    },
    {
      key: "quantidade",
      header: "Quantidade",
      sortable: true,
      render: (item) => item.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    },
    {
      key: "formattedCredito",
      header: "Crédito",
      sortable: true,
      render: (item) => (
        <span className="font-semibold">{item.formattedCredito}</span>
      ),
    },
    {
      key: "uf",
      header: "UF",
      sortable: true,
      render: (item) => item.uf,
    },
    {
      key: "actions",
      header: "Ações",
      filterable: false,
      className: "text-right",
      headerClassName: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* STICKY HEADER - Título + Ordenação + Botão + Cards */}
      <div className="sticky top-0 z-10 bg-background pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Controle de Crédito</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={creditoSort} onValueChange={(value: 'none' | 'asc' | 'desc') => setCreditoSort(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar Crédito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem ordenação</SelectItem>
                  <SelectItem value="asc">Crédito: Crescente</SelectItem>
                  <SelectItem value="desc">Crédito: Decrescente</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <div className="flex gap-2">
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
                    <QuantityCalculator 
                      onResult={(result) => setFormData({ ...formData, quantidade: result.toString() })}
                    />
                  </div>
                </div>
              </div>

              {formData.quantidade && (
                <div className="p-3 bg-muted rounded-md">
                  <Label>Crédito Calculado</Label>
                  <p className="text-lg font-semibold">
                    {calculatedCredito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={selectedIds.size > 0 ? "border-primary" : ""}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Selecionados</span>
              {selectedIds.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setUtilizarDialogOpen(true)}
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    Utilizar Crédito
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {selectedIds.size}
                </p>
                <p className="text-xs text-muted-foreground">registros</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {selectedCredito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">crédito total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Total Geral (filtrado)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">
                  {filteredCount}
                </p>
                <p className="text-xs text-muted-foreground">registros</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {totalCredito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">crédito total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Utilizar Crédito Dialog */}
      <UtilizarCreditoDialog
        open={utilizarDialogOpen}
        onOpenChange={setUtilizarDialogOpen}
        selectedRecords={selectedRecords}
      />

      {/* SCROLLABLE CONTENT - Tabela */}
      <div className="flex-1 overflow-y-auto mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterableTable
              data={sortedFilteredData}
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
              isLoading={loading}
              emptyMessage="Nenhum registro encontrado"
              showDateFilters={true}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreditControl;
