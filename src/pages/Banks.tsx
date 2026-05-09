import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Landmark, Plus, Search, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Bank {
  id: string;
  name: string;
  code: string | null;
  agency: string | null;
  account: string | null;
  wallet: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  name: "",
  code: "",
  agency: "",
  account: "",
  wallet: "",
  is_active: true,
};

export default function Banks() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banks")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as Bank[];
    },
  });

  const filtered = banks.filter((b) => {
    const s = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(s) ||
      (b.code || "").toLowerCase().includes(s) ||
      (b.agency || "").toLowerCase().includes(s) ||
      (b.account || "").toLowerCase().includes(s)
    );
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof emptyForm) => {
      const { data: existing } = await (supabase as any)
        .from("banks")
        .select("id")
        .ilike("name", payload.name);
      if (existing && existing.length > 0) {
        if (!editing || existing[0].id !== editing.id) {
          throw new Error("Já existe um banco cadastrado com este nome.");
        }
      }
      const body = {
        name: payload.name.trim(),
        code: payload.code.trim() || null,
        agency: payload.agency.trim() || null,
        account: payload.account.trim() || null,
        wallet: payload.wallet.trim() || null,
        is_active: payload.is_active,
      };
      if (editing) {
        const { error } = await (supabase as any).from("banks").update(body).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("banks").insert(body);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      queryClient.invalidateQueries({ queryKey: ["banks-active"] });
      toast.success(editing ? "Banco atualizado!" : "Banco cadastrado!");
      reset();
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (bank: Bank) => {
      const { data: usedByCustomer } = await (supabase as any)
        .from("customers").select("id").eq("bank_id", bank.id).limit(1);
      const { data: usedByBoleto } = await (supabase as any)
        .from("boletos").select("id").eq("bank_id", bank.id).limit(1);
      if ((usedByCustomer && usedByCustomer.length) || (usedByBoleto && usedByBoleto.length)) {
        throw new Error("Este banco está vinculado a clientes ou cobranças e não pode ser excluído.");
      }
      const { error } = await (supabase as any).from("banks").delete().eq("id", bank.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      queryClient.invalidateQueries({ queryKey: ["banks-active"] });
      toast.success("Banco removido!");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao remover"),
  });

  const reset = () => {
    setForm(emptyForm);
    setEditing(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    saveMutation.mutate(form);
  };

  const handleEdit = (b: Bank) => {
    setEditing(b);
    setForm({
      name: b.name,
      code: b.code || "",
      agency: b.agency || "",
      account: b.account || "",
      wallet: b.wallet || "",
      is_active: b.is_active,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <Landmark className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Bancos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Cadastre os bancos utilizados para geração de boletos
          </p>
          <Badge variant="secondary" className="mt-2">
            {banks.length} banco(s) cadastrado(s)
          </Badge>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0" onClick={reset}>
              <Plus className="h-4 w-4" /> Incluir
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Banco" : "Novo Banco"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" placeholder="Ex: Banco do Brasil"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input id="code" placeholder="001" value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wallet">Carteira</Label>
                  <Input id="wallet" placeholder="17" value={form.wallet}
                    onChange={(e) => setForm({ ...form, wallet: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agency">Agência</Label>
                  <Input id="agency" placeholder="0000-0" value={form.agency}
                    onChange={(e) => setForm({ ...form, agency: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Conta</Label>
                  <Input id="account" placeholder="00000-0" value={form.account}
                    onChange={(e) => setForm({ ...form, account: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Status</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{form.is_active ? "Ativo" : "Inativo"}</span>
                  <Switch id="is_active" checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={reset}>Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input type="text" placeholder="Buscar bancos..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Nenhum banco encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((bank) => (
            <Card key={bank.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-start justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <Landmark className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {bank.code ? `${bank.code} - ` : ""}{bank.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {bank.agency && <>Ag: {bank.agency} </>}
                      {bank.account && <>· Cc: {bank.account} </>}
                      {bank.wallet && <>· Cart: {bank.wallet}</>}
                    </div>
                    <div className="mt-2">
                      <Badge variant={bank.is_active ? "default" : "secondary"}
                        className={bank.is_active ? "bg-green-600" : ""}>
                        {bank.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(bank)}>
                      <Pencil className="h-4 w-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive"
                      onClick={() => {
                        if (confirm("Deseja realmente excluir este banco?")) {
                          deleteMutation.mutate(bank);
                        }
                      }}>
                      <Trash2 className="h-4 w-4 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
