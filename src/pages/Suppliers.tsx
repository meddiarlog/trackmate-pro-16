import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MoreVertical, Pencil, Trash2, Building2, MapPin, User, Clock, FileText, Loader2 } from "lucide-react";
import { SupplierContactList } from "@/components/SupplierContactList";

interface SupplierContact { id: string; tipo: "comercial" | "financeiro"; telefone: string; email: string; }
interface Supplier { id: string; name: string; cnpj: string | null; address: string | null; city: string | null; state: string | null; neighborhood: string | null; cep: string | null; responsavel: string | null; prazo_dias: number | null; observacoes: string | null; }

const formatCnpj = (v: string) => { const d = v.replace(/\D/g, ""); return d.length <= 14 ? d.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d)/, "$1-$2") : v; };
const formatCep = (v: string) => { const d = v.replace(/\D/g, ""); return d.length <= 8 ? d.replace(/(\d{5})(\d)/, "$1-$2") : v; };
const formatPhone = (v: string) => { const d = v.replace(/\D/g, ""); return d.length <= 10 ? d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3") : d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3"); };

export default function Suppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [formData, setFormData] = useState({ name: "", cnpj: "", address: "", city: "", state: "", neighborhood: "", cep: "", responsavel: "", prazo_dias: 30, observacoes: "" });

  const { data: suppliers = [], isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: async () => { const { data, error } = await supabase.from("suppliers").select("*").order("name"); if (error) throw error; return data as Supplier[]; } });

  const fetchCnpjData = async (cnpj: string) => {
    const clean = cnpj.replace(/\D/g, "");
    if (clean.length !== 14) return;
    setLoadingCnpj(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-cnpj", { body: { cnpj: clean } });
      if (error) throw error;
      if (data) setFormData(p => ({ ...p, name: data.razao_social || data.nome_fantasia || p.name, address: data.logradouro ? `${data.logradouro}${data.numero ? `, ${data.numero}` : ""}${data.complemento ? ` - ${data.complemento}` : ""}` : p.address, city: data.municipio || p.city, state: data.uf || p.state, neighborhood: data.bairro || p.neighborhood, cep: data.cep ? formatCep(data.cep) : p.cep }));
      toast({ title: "Sucesso", description: "Dados do CNPJ carregados" });
    } catch { toast({ title: "Aviso", description: "Não foi possível buscar CNPJ", variant: "destructive" }); }
    finally { setLoadingCnpj(false); }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const cleanCnpj = data.cnpj.replace(/\D/g, ""), cleanCep = data.cep.replace(/\D/g, "");
      const supplierData = { name: data.name, cnpj: cleanCnpj || null, address: data.address || null, city: data.city || null, state: data.state || null, neighborhood: data.neighborhood || null, cep: cleanCep || null, responsavel: data.responsavel || null, prazo_dias: data.prazo_dias || null, observacoes: data.observacoes || null };
      if (editingId) {
        const { error } = await supabase.from("suppliers").update(supplierData).eq("id", editingId);
        if (error) throw error;
        await supabase.from("supplier_contacts").delete().eq("supplier_id", editingId);
        if (contacts.length > 0) await supabase.from("supplier_contacts").insert(contacts.map(c => ({ supplier_id: editingId, tipo: c.tipo, telefone: c.telefone.replace(/\D/g, "") || null, email: c.email || null })));
        return { id: editingId };
      } else {
        const { data: newS, error } = await supabase.from("suppliers").insert(supplierData).select().single();
        if (error) throw error;
        if (contacts.length > 0) await supabase.from("supplier_contacts").insert(contacts.map(c => ({ supplier_id: newS.id, tipo: c.tipo, telefone: c.telefone.replace(/\D/g, "") || null, email: c.email || null })));
        return newS;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast({ title: "Sucesso", description: editingId ? "Fornecedor atualizado" : "Fornecedor cadastrado" }); resetForm(); setIsDialogOpen(false); },
    onError: (e: Error) => { toast({ title: "Erro", description: e.message || "Erro ao salvar", variant: "destructive" }); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from("supplier_contacts").delete().eq("supplier_id", id); const { error } = await supabase.from("suppliers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast({ title: "Sucesso", description: "Fornecedor removido" }); },
    onError: () => { toast({ title: "Erro", description: "Erro ao remover", variant: "destructive" }); }
  });

  const resetForm = () => { setFormData({ name: "", cnpj: "", address: "", city: "", state: "", neighborhood: "", cep: "", responsavel: "", prazo_dias: 30, observacoes: "" }); setContacts([]); setEditingId(null); };
  const handleEdit = async (s: Supplier) => {
    setEditingId(s.id);
    setFormData({ name: s.name || "", cnpj: s.cnpj ? formatCnpj(s.cnpj) : "", address: s.address || "", city: s.city || "", state: s.state || "", neighborhood: s.neighborhood || "", cep: s.cep ? formatCep(s.cep) : "", responsavel: s.responsavel || "", prazo_dias: s.prazo_dias || 30, observacoes: s.observacoes || "" });
    const { data: c } = await supabase.from("supplier_contacts").select("*").eq("supplier_id", s.id);
    if (c) setContacts(c.map(x => ({ id: x.id, tipo: x.tipo as "comercial" | "financeiro", telefone: x.telefone ? formatPhone(x.telefone) : "", email: x.email || "" })));
    setIsDialogOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.name.trim()) { toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" }); return; } saveMutation.mutate(formData); };
  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.cnpj && (s.cnpj.includes(searchTerm.replace(/\D/g, "")) || formatCnpj(s.cnpj).includes(searchTerm))));
  const prazoOptions = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fornecedores</h1>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Novo Fornecedor</Button></DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Fornecedor</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>CNPJ</Label><div className="relative"><Input value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })} onBlur={() => fetchCnpjData(formData.cnpj)} placeholder="00.000.000/0000-00" maxLength={18} />{loadingCnpj && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}</div></div>
                <div className="space-y-2"><Label>Razão Social *</Label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label>Endereço</Label><Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2"><Label>Cidade</Label><Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
                <div className="space-y-2"><Label>Estado</Label><Input value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })} maxLength={2} /></div>
                <div className="space-y-2"><Label>Bairro</Label><Input value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} /></div>
                <div className="space-y-2"><Label>CEP</Label><Input value={formData.cep} onChange={e => setFormData({ ...formData, cep: formatCep(e.target.value) })} maxLength={9} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Responsável</Label><Input value={formData.responsavel} onChange={e => setFormData({ ...formData, responsavel: e.target.value })} /></div>
                <div className="space-y-2"><Label>Prazo (dias)</Label><Select value={formData.prazo_dias.toString()} onValueChange={v => setFormData({ ...formData, prazo_dias: parseInt(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{prazoOptions.map(d => <SelectItem key={d} value={d.toString()}>{d} {d === 1 ? "dia" : "dias"}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Contatos</Label><SupplierContactList contacts={contacts} onChange={setContacts} /></div>
              <div className="space-y-2"><Label>Observações</Label><Textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} rows={3} /></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { resetForm(); setIsDialogOpen(false); }}>Cancelar</Button><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId ? "Atualizar" : "Cadastrar"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por nome ou CNPJ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" /></div>
      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : filteredSuppliers.length === 0 ? <div className="text-center py-8 text-muted-foreground">{searchTerm ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}</div> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers.map(s => (
            <Card key={s.id}>
              <CardHeader className="pb-2"><div className="flex items-start justify-between"><CardTitle className="text-lg">{s.name}</CardTitle><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleEdit(s)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="mr-2 h-4 w-4" />Remover</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {s.cnpj && <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" /><span>{formatCnpj(s.cnpj)}</span></div>}
                {(s.city || s.state) && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span>{s.city}{s.city && s.state && " / "}{s.state}</span></div>}
                {s.responsavel && <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /><span>{s.responsavel}</span></div>}
                {s.prazo_dias && <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span>Prazo: {s.prazo_dias} dias</span></div>}
                {s.observacoes && <div className="flex items-start gap-2 text-muted-foreground"><FileText className="h-4 w-4 mt-0.5" /><span className="line-clamp-2">{s.observacoes}</span></div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
