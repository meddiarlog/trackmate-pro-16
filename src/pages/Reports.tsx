import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, FileSpreadsheet, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString + "T12:00:00").toLocaleDateString("pt-BR");
};
const formatCpfCnpj = (value: string | null) => {
  if (!value) return "-";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value;
};

export default function Reports() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/customers")) return "customers";
    if (path.includes("/credit-control")) return "credit-control";
    if (path.includes("/cobrancas")) return "cobrancas";
    if (path.includes("/quotes")) return "quotes";
    if (path.includes("/suppliers")) return "suppliers";
    if (path.includes("/accounts-payable")) return "accounts-payable";
    if (path.includes("/accounts-receivable")) return "accounts-receivable";
    if (path.includes("/profit-loss")) return "profit-loss";
    if (path.includes("/collection-orders")) return "collection-orders";
    if (path.includes("/products")) return "products";
    return "customers";
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [data, setData] = useState<any[]>([]);
  const [profitLoss, setProfitLoss] = useState<{ totalReceived: number; totalPaid: number; result: number; isProfit: boolean } | null>(null);

  useEffect(() => { setActiveTab(getActiveTab()); }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/reports/${value}`);
    setData([]);
    setProfitLoss(null);
  };

  const validateDates = () => {
    if (!startDate || !endDate) { toast({ title: "Erro", description: "Informe as datas", variant: "destructive" }); return false; }
    if (new Date(startDate) > new Date(endDate)) { toast({ title: "Erro", description: "Data inicial maior que final", variant: "destructive" }); return false; }
    return true;
  };

  const handleGenerateReport = async () => {
    if (!validateDates()) return;
    setLoading(true);
    try {
      let result: any[] = [];
      const start = `${startDate}T00:00:00`, end = `${endDate}T23:59:59`;
      
      if (activeTab === "customers") {
        const { data: d } = await supabase.from("customers").select("id, name, cpf_cnpj, city, state, responsavel, created_at").gte("created_at", start).lte("created_at", end).order("name", { ascending: sortOrder === "asc" });
        result = d || [];
      } else if (activeTab === "suppliers") {
        const { data: d } = await supabase.from("suppliers").select("id, name, cnpj, city, state, responsavel, created_at").gte("created_at", start).lte("created_at", end).order("name", { ascending: sortOrder === "asc" });
        result = d || [];
      } else if (activeTab === "credit-control") {
        const { data: d } = await supabase.from("credit_control").select("*").order("data_emissao", { ascending: false });
        const startObj = new Date(startDate + "T12:00:00"), endObj = new Date(endDate + "T12:00:00");
        result = (d || []).filter(r => { const rd = new Date(r.data_emissao + "T12:00:00"); return rd >= startObj && rd <= endObj; });
      } else if (activeTab === "cobrancas") {
        let q = supabase.from("boletos").select("*, customers(name)").gte("due_date", startDate).lte("due_date", endDate);
        if (statusFilter !== "all") q = q.eq("status", statusFilter);
        const { data: d } = await q.order("due_date");
        result = (d || []).map((i: any) => ({ ...i, customer_name: i.customers?.name || "-" }));
      } else if (activeTab === "quotes") {
        const { data: d } = await supabase.from("quotes").select("*, customers(name)").gte("created_at", start).lte("created_at", end).order("quote_number", { ascending: false });
        result = (d || []).map((i: any) => ({ ...i, customer_name: i.customers?.name || "-" }));
      } else if (activeTab === "accounts-payable") {
        let q = supabase.from("accounts_payable").select("*, suppliers(name)").gte("due_date", startDate).lte("due_date", endDate);
        if (statusFilter !== "all") q = q.eq("status", statusFilter);
        const { data: d } = await q.order("due_date");
        result = (d || []).map((i: any) => ({ ...i, supplier_name: i.suppliers?.name || "-" }));
      } else if (activeTab === "accounts-receivable") {
        let q = supabase.from("accounts_receivable").select("*, customers(name)").gte("due_date", startDate).lte("due_date", endDate);
        if (statusFilter !== "all") q = q.eq("status", statusFilter);
        const { data: d } = await q.order("due_date");
        result = (d || []).map((i: any) => ({ ...i, customer_name: i.customers?.name || "-" }));
      } else if (activeTab === "profit-loss") {
        const { data: rec } = await supabase.from("accounts_receivable").select("total").gte("payment_date", startDate).lte("payment_date", endDate).eq("status", "pago");
        const { data: pay } = await supabase.from("accounts_payable").select("total").gte("payment_date", startDate).lte("payment_date", endDate).eq("status", "pago");
        const totalReceived = (rec || []).reduce((s, i) => s + (i.total || 0), 0);
        const totalPaid = (pay || []).reduce((s, i) => s + (i.total || 0), 0);
        setProfitLoss({ totalReceived, totalPaid, result: totalReceived - totalPaid, isProfit: totalReceived >= totalPaid });
      } else if (activeTab === "collection-orders") {
        const { data: d } = await supabase.from("collection_orders").select("*").gte("order_date", startDate).lte("order_date", endDate).order("order_number", { ascending: false });
        result = d || [];
      } else if (activeTab === "products") {
        const { data: d } = await supabase.from("products").select("*").gte("created_at", start).lte("created_at", end).order("name");
        result = d || [];
      }
      setData(result);
    } catch (e) { console.error(e); toast({ title: "Erro", description: "Erro ao gerar relatório", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const exportToPDF = (title: string, headers: string[], rows: string[][]) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Período: ${formatDate(startDate)} a ${formatDate(endDate)}`, doc.internal.pageSize.getWidth() / 2, 28, { align: "center" });
    autoTable(doc, { head: [headers], body: rows, startY: 35, styles: { fontSize: 8 }, headStyles: { fillColor: [41, 128, 185] } });
    doc.save(`${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const exportToExcel = (title: string, headers: string[], rows: string[][]) => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
  };

  const showStatusFilter = ["cobrancas", "accounts-payable", "accounts-receivable"].includes(activeTab);
  const showSortOrder = ["customers", "suppliers"].includes(activeTab);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Relatórios</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="credit-control">Controle de Crédito</TabsTrigger>
          <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
          <TabsTrigger value="quotes">Cotação</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="accounts-payable">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="accounts-receivable">Contas a Receber</TabsTrigger>
          <TabsTrigger value="profit-loss">Despesa x Receita</TabsTrigger>
          <TabsTrigger value="collection-orders">Ordens de Coleta</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2"><Label>Data Inicial</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" /></div>
              <div className="space-y-2"><Label>Data Final</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" /></div>
              {showStatusFilter && <div className="space-y-2"><Label>Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="pago">Pago</SelectItem><SelectItem value="vencido">Vencido</SelectItem></SelectContent></Select></div>}
              {showSortOrder && <div className="space-y-2"><Label>Ordenação</Label><Select value={sortOrder} onValueChange={(v: "asc" | "desc") => setSortOrder(v)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="asc">A - Z</SelectItem><SelectItem value="desc">Z - A</SelectItem></SelectContent></Select></div>}
              <Button onClick={handleGenerateReport} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Gerar Relatório</Button>
            </div>
          </CardContent>
        </Card>

        {activeTab === "profit-loss" && profitLoss && (
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resumo Financeiro</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToPDF("Despesa x Receita", ["Descrição", "Valor"], [["Total Recebido", formatCurrency(profitLoss.totalReceived)], ["Total Pago", formatCurrency(profitLoss.totalPaid)], ["Resultado", formatCurrency(profitLoss.result)]])}><FileText className="mr-2 h-4 w-4" />PDF</Button>
                <Button variant="outline" size="sm" onClick={() => exportToExcel("Despesa x Receita", ["Descrição", "Valor"], [["Total Recebido", formatCurrency(profitLoss.totalReceived)], ["Total Pago", formatCurrency(profitLoss.totalPaid)], ["Resultado", formatCurrency(profitLoss.result)]])}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Recebido</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(profitLoss.totalReceived)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pago</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(profitLoss.totalPaid)}</div></CardContent></Card>
                <Card className={profitLoss.isProfit ? "border-green-500" : "border-red-500"}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2">Resultado {profitLoss.isProfit ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${profitLoss.isProfit ? "text-green-600" : "text-red-600"}`}>{formatCurrency(profitLoss.result)}</div><p className={`text-sm font-medium ${profitLoss.isProfit ? "text-green-600" : "text-red-600"}`}>{profitLoss.isProfit ? "LUCRO" : "PREJUÍZO"}</p></CardContent></Card>
              </div>
            </CardContent>
          </Card>
        )}

        {data.length > 0 && activeTab !== "profit-loss" && (
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resultado: {data.length} registros</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const configs: Record<string, { headers: string[]; map: (r: any) => string[] }> = {
                    customers: { headers: ["Razão Social", "CPF/CNPJ", "Cidade", "Estado", "Responsável", "Data"], map: (r) => [r.name, formatCpfCnpj(r.cpf_cnpj), r.city || "-", r.state || "-", r.responsavel || "-", formatDate(r.created_at)] },
                    suppliers: { headers: ["Razão Social", "CNPJ", "Cidade", "Estado", "Responsável", "Data"], map: (r) => [r.name, formatCpfCnpj(r.cnpj), r.city || "-", r.state || "-", r.responsavel || "-", formatDate(r.created_at)] },
                    "credit-control": { headers: ["NF-e", "CNPJ", "Razão Social", "Data", "Valor", "Crédito", "UF"], map: (r) => [r.numero_nfe, formatCpfCnpj(r.cnpj_emitente), r.razao_social, formatDate(r.data_emissao), formatCurrency(r.valor_nfe), formatCurrency(r.credito), r.uf] },
                    cobrancas: { headers: ["Cliente", "Documento", "Vencimento", "Valor", "Status"], map: (r) => [r.customer_name, r.doc_number || "-", formatDate(r.due_date), formatCurrency(r.amount || 0), r.status] },
                    quotes: { headers: ["Nº", "Cliente", "Origem", "Destino", "Valor", "Status"], map: (r) => [r.quote_number, r.customer_name, `${r.origin_city || "-"}/${r.origin_state || "-"}`, `${r.destination_city || "-"}/${r.destination_state || "-"}`, formatCurrency(r.freight_value || 0), r.status || "-"] },
                    "accounts-payable": { headers: ["Fornecedor", "Documento", "Vencimento", "Valor", "Total", "Status"], map: (r) => [r.supplier_name, r.document_number || "-", formatDate(r.due_date), formatCurrency(r.amount), formatCurrency(r.total), r.status] },
                    "accounts-receivable": { headers: ["Cliente", "Documento", "Vencimento", "Valor", "Total", "Status"], map: (r) => [r.customer_name, r.document_number || "-", formatDate(r.due_date), formatCurrency(r.amount), formatCurrency(r.total), r.status] },
                    "collection-orders": { headers: ["Nº", "Data", "Remetente", "Destinatário", "Origem", "Destino", "Motorista"], map: (r) => [r.order_number, formatDate(r.order_date), r.sender_name || "-", r.recipient_name, `${r.loading_city || "-"}/${r.loading_state || "-"}`, `${r.unloading_city}/${r.unloading_state}`, r.driver_name || "-"] },
                    products: { headers: ["Nome", "Data Cadastro"], map: (r) => [r.name, formatDate(r.created_at)] },
                  };
                  const cfg = configs[activeTab];
                  if (cfg) exportToPDF(`Relatório ${activeTab}`, cfg.headers, data.map(cfg.map));
                }}><FileText className="mr-2 h-4 w-4" />PDF</Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const configs: Record<string, { headers: string[]; map: (r: any) => string[] }> = {
                    customers: { headers: ["Razão Social", "CPF/CNPJ", "Cidade", "Estado", "Responsável", "Data"], map: (r) => [r.name, formatCpfCnpj(r.cpf_cnpj), r.city || "-", r.state || "-", r.responsavel || "-", formatDate(r.created_at)] },
                    suppliers: { headers: ["Razão Social", "CNPJ", "Cidade", "Estado", "Responsável", "Data"], map: (r) => [r.name, formatCpfCnpj(r.cnpj), r.city || "-", r.state || "-", r.responsavel || "-", formatDate(r.created_at)] },
                    "credit-control": { headers: ["NF-e", "CNPJ", "Razão Social", "Data", "Valor", "Crédito", "UF"], map: (r) => [r.numero_nfe, formatCpfCnpj(r.cnpj_emitente), r.razao_social, formatDate(r.data_emissao), formatCurrency(r.valor_nfe), formatCurrency(r.credito), r.uf] },
                    cobrancas: { headers: ["Cliente", "Documento", "Vencimento", "Valor", "Status"], map: (r) => [r.customer_name, r.doc_number || "-", formatDate(r.due_date), formatCurrency(r.amount || 0), r.status] },
                    quotes: { headers: ["Nº", "Cliente", "Origem", "Destino", "Valor", "Status"], map: (r) => [r.quote_number, r.customer_name, `${r.origin_city || "-"}/${r.origin_state || "-"}`, `${r.destination_city || "-"}/${r.destination_state || "-"}`, formatCurrency(r.freight_value || 0), r.status || "-"] },
                    "accounts-payable": { headers: ["Fornecedor", "Documento", "Vencimento", "Valor", "Total", "Status"], map: (r) => [r.supplier_name, r.document_number || "-", formatDate(r.due_date), formatCurrency(r.amount), formatCurrency(r.total), r.status] },
                    "accounts-receivable": { headers: ["Cliente", "Documento", "Vencimento", "Valor", "Total", "Status"], map: (r) => [r.customer_name, r.document_number || "-", formatDate(r.due_date), formatCurrency(r.amount), formatCurrency(r.total), r.status] },
                    "collection-orders": { headers: ["Nº", "Data", "Remetente", "Destinatário", "Origem", "Destino", "Motorista"], map: (r) => [r.order_number, formatDate(r.order_date), r.sender_name || "-", r.recipient_name, `${r.loading_city || "-"}/${r.loading_state || "-"}`, `${r.unloading_city}/${r.unloading_state}`, r.driver_name || "-"] },
                    products: { headers: ["Nome", "Data Cadastro"], map: (r) => [r.name, formatDate(r.created_at)] },
                  };
                  const cfg = configs[activeTab];
                  if (cfg) exportToExcel(`Relatório ${activeTab}`, cfg.headers, data.map(cfg.map));
                }}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {activeTab === "customers" && <><TableHead>Razão Social</TableHead><TableHead>CPF/CNPJ</TableHead><TableHead>Cidade</TableHead><TableHead>Estado</TableHead><TableHead>Responsável</TableHead><TableHead>Data</TableHead></>}
                    {activeTab === "suppliers" && <><TableHead>Razão Social</TableHead><TableHead>CNPJ</TableHead><TableHead>Cidade</TableHead><TableHead>Estado</TableHead><TableHead>Responsável</TableHead><TableHead>Data</TableHead></>}
                    {activeTab === "credit-control" && <><TableHead>NF-e</TableHead><TableHead>CNPJ</TableHead><TableHead>Razão Social</TableHead><TableHead>Data</TableHead><TableHead>Valor</TableHead><TableHead>Crédito</TableHead><TableHead>UF</TableHead></>}
                    {activeTab === "cobrancas" && <><TableHead>Cliente</TableHead><TableHead>Documento</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></>}
                    {activeTab === "quotes" && <><TableHead>Nº</TableHead><TableHead>Cliente</TableHead><TableHead>Origem</TableHead><TableHead>Destino</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></>}
                    {activeTab === "accounts-payable" && <><TableHead>Fornecedor</TableHead><TableHead>Documento</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></>}
                    {activeTab === "accounts-receivable" && <><TableHead>Cliente</TableHead><TableHead>Documento</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></>}
                    {activeTab === "collection-orders" && <><TableHead>Nº</TableHead><TableHead>Data</TableHead><TableHead>Remetente</TableHead><TableHead>Destinatário</TableHead><TableHead>Origem</TableHead><TableHead>Destino</TableHead><TableHead>Motorista</TableHead></>}
                    {activeTab === "products" && <><TableHead>Nome</TableHead><TableHead>Data Cadastro</TableHead></>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((r) => (
                    <TableRow key={r.id}>
                      {activeTab === "customers" && <><TableCell>{r.name}</TableCell><TableCell>{formatCpfCnpj(r.cpf_cnpj)}</TableCell><TableCell>{r.city || "-"}</TableCell><TableCell>{r.state || "-"}</TableCell><TableCell>{r.responsavel || "-"}</TableCell><TableCell>{formatDate(r.created_at)}</TableCell></>}
                      {activeTab === "suppliers" && <><TableCell>{r.name}</TableCell><TableCell>{formatCpfCnpj(r.cnpj)}</TableCell><TableCell>{r.city || "-"}</TableCell><TableCell>{r.state || "-"}</TableCell><TableCell>{r.responsavel || "-"}</TableCell><TableCell>{formatDate(r.created_at)}</TableCell></>}
                      {activeTab === "credit-control" && <><TableCell>{r.numero_nfe}</TableCell><TableCell>{formatCpfCnpj(r.cnpj_emitente)}</TableCell><TableCell>{r.razao_social}</TableCell><TableCell>{formatDate(r.data_emissao)}</TableCell><TableCell>{formatCurrency(r.valor_nfe)}</TableCell><TableCell>{formatCurrency(r.credito)}</TableCell><TableCell>{r.uf}</TableCell></>}
                      {activeTab === "cobrancas" && <><TableCell>{r.customer_name}</TableCell><TableCell>{r.doc_number || "-"}</TableCell><TableCell>{formatDate(r.due_date)}</TableCell><TableCell>{formatCurrency(r.amount || 0)}</TableCell><TableCell>{r.status}</TableCell></>}
                      {activeTab === "quotes" && <><TableCell>{r.quote_number}</TableCell><TableCell>{r.customer_name}</TableCell><TableCell>{r.origin_city}/{r.origin_state}</TableCell><TableCell>{r.destination_city}/{r.destination_state}</TableCell><TableCell>{formatCurrency(r.freight_value || 0)}</TableCell><TableCell>{r.status || "-"}</TableCell></>}
                      {activeTab === "accounts-payable" && <><TableCell>{r.supplier_name}</TableCell><TableCell>{r.document_number || "-"}</TableCell><TableCell>{formatDate(r.due_date)}</TableCell><TableCell>{formatCurrency(r.amount)}</TableCell><TableCell>{formatCurrency(r.total)}</TableCell><TableCell>{r.status}</TableCell></>}
                      {activeTab === "accounts-receivable" && <><TableCell>{r.customer_name}</TableCell><TableCell>{r.document_number || "-"}</TableCell><TableCell>{formatDate(r.due_date)}</TableCell><TableCell>{formatCurrency(r.amount)}</TableCell><TableCell>{formatCurrency(r.total)}</TableCell><TableCell>{r.status}</TableCell></>}
                      {activeTab === "collection-orders" && <><TableCell>{r.order_number}</TableCell><TableCell>{formatDate(r.order_date)}</TableCell><TableCell>{r.sender_name || "-"}</TableCell><TableCell>{r.recipient_name}</TableCell><TableCell>{r.loading_city}/{r.loading_state}</TableCell><TableCell>{r.unloading_city}/{r.unloading_state}</TableCell><TableCell>{r.driver_name || "-"}</TableCell></>}
                      {activeTab === "products" && <><TableCell>{r.name}</TableCell><TableCell>{formatDate(r.created_at)}</TableCell></>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </Tabs>
    </div>
  );
}
