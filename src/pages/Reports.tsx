import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { FileDown, FileSpreadsheet, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type CreditRecord = {
  id: string;
  numero_nfe: string;
  cnpj_emitente: string;
  razao_social: string;
  data_emissao: string;
  valor_nfe: number;
  tipo_combustivel: string;
  quantidade: number;
  credito: number;
  chave_acesso: string;
  uf: string;
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState("credito");
  const [creditRecords, setCreditRecords] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const fetchCreditReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Atenção",
        description: "Informe o período para gerar o relatório",
        variant: "destructive",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: "Atenção",
        description: "A data inicial não pode ser maior que a data final",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase
        .from("credit_control")
        .select("*")
        .gte("data_emissao", startDate)
        .lte("data_emissao", endDate)
        .order("data_emissao", { ascending: true });

      if (error) throw error;
      setCreditRecords(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCredito = creditRecords.reduce((sum, r) => sum + r.credito, 0);
  const totalQuantidade = creditRecords.reduce((sum, r) => sum + r.quantidade, 0);
  const totalValorNfe = creditRecords.reduce((sum, r) => sum + r.valor_nfe, 0);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const exportToPDF = () => {
    if (creditRecords.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    
    // Title
    doc.setFontSize(18);
    doc.text("Relatório de Controle de Crédito", 14, 22);
    
    // Period
    doc.setFontSize(11);
    doc.text(`Período: ${formatDate(startDate)} a ${formatDate(endDate)}`, 14, 32);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 38);

    // Table
    const tableData = creditRecords.map((r) => [
      r.numero_nfe,
      r.cnpj_emitente,
      r.razao_social.substring(0, 30),
      formatDate(r.data_emissao),
      `R$ ${r.valor_nfe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      r.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      r.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      r.uf,
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["NF-e", "CNPJ", "Razão Social", "Data Emissão", "Valor NF-e", "Quantidade", "Crédito", "UF"]],
      body: tableData,
      foot: [[
        "TOTAL",
        "",
        `${creditRecords.length} registros`,
        "",
        `R$ ${totalValorNfe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        totalQuantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        totalCredito.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        "",
      ]],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      footStyles: { fillColor: [236, 240, 241], textColor: 0, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 249, 249] },
    });

    doc.save(`relatorio-credito-${startDate}-a-${endDate}.pdf`);
    toast({ title: "Sucesso", description: "PDF exportado com sucesso" });
  };

  const exportToExcel = () => {
    if (creditRecords.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    const worksheetData = [
      ["Relatório de Controle de Crédito"],
      [`Período: ${formatDate(startDate)} a ${formatDate(endDate)}`],
      [`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`],
      [],
      ["NF-e", "CNPJ Emitente", "Razão Social", "Data Emissão", "Valor NF-e", "Quantidade", "Crédito", "UF", "Chave de Acesso"],
      ...creditRecords.map((r) => [
        r.numero_nfe,
        r.cnpj_emitente,
        r.razao_social,
        formatDate(r.data_emissao),
        r.valor_nfe,
        r.quantidade,
        r.credito,
        r.uf,
        r.chave_acesso,
      ]),
      [],
      ["TOTAIS", "", `${creditRecords.length} registros`, "", totalValorNfe, totalQuantidade, totalCredito, "", ""],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 18 },
      { wch: 35 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 5 },
      { wch: 50 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Créditos");
    XLSX.writeFile(workbook, `relatorio-credito-${startDate}-a-${endDate}.xlsx`);
    
    toast({ title: "Sucesso", description: "Excel exportado com sucesso" });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Relatórios</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="credito">Controle de Crédito</TabsTrigger>
        </TabsList>

        <TabsContent value="credito" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data Inicial</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data Final</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <Button onClick={fetchCreditReport} disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Gerar Relatório
                </Button>
                {creditRecords.length > 0 && (
                  <>
                    <Button variant="outline" onClick={exportToPDF}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Button variant="outline" onClick={exportToExcel}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Exportar Excel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {hasSearched && (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Resultado do Relatório</span>
                  {creditRecords.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {creditRecords.length} registro(s) encontrado(s)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : creditRecords.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum registro encontrado para o período selecionado
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>NF-e</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead>Razão Social</TableHead>
                          <TableHead>Data Emissão</TableHead>
                          <TableHead className="text-right">Valor NF-e</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Crédito</TableHead>
                          <TableHead>UF</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.numero_nfe}</TableCell>
                            <TableCell>{record.cnpj_emitente}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={record.razao_social}>
                              {record.razao_social}
                            </TableCell>
                            <TableCell>{formatDate(record.data_emissao)}</TableCell>
                            <TableCell className="text-right">
                              R$ {record.valor_nfe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              {record.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {record.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>{record.uf}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} className="font-bold">
                            TOTAL ({creditRecords.length} registros)
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right font-bold">
                            R$ {totalValorNfe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {totalQuantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {totalCredito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
