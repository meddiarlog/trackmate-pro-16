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
import { Wallet, Plus, Search, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PaymentMethods() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formName, setFormName] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const { data: paymentMethods = [], isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  const filteredMethods = paymentMethods.filter((method) =>
    method.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const saveMutation = useMutation({
    mutationFn: async ({ name, is_active }: { name: string; is_active: boolean }) => {
      // Check for duplicate
      const { data: existing } = await supabase
        .from("payment_methods")
        .select("id")
        .ilike("name", name);

      if (existing && existing.length > 0) {
        if (!editingMethod || existing[0].id !== editingMethod.id) {
          throw new Error("Já existe uma forma de pagamento com este nome.");
        }
      }

      if (editingMethod) {
        const { error } = await supabase
          .from("payment_methods")
          .update({ name, is_active })
          .eq("id", editingMethod.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_methods")
          .insert({ name, is_active });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods-active"] });
      toast.success(editingMethod ? "Forma de pagamento atualizada!" : "Forma de pagamento cadastrada!");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (method: PaymentMethod) => {
      // Check if in use
      const checks = await Promise.all([
        supabase.from("accounts_payable").select("id").eq("payment_method", method.name).limit(1),
        supabase.from("accounts_receivable").select("id").eq("payment_method", method.name).limit(1),
        supabase.from("collection_orders").select("id").eq("payment_method", method.name).limit(1),
        supabase.from("quotes").select("id").eq("payment_method", method.name).limit(1),
      ]);

      const inUse = checks.some(result => result.data && result.data.length > 0);
      if (inUse) {
        throw new Error("Esta forma de pagamento está vinculada a registros existentes e não pode ser excluída.");
      }

      const { error } = await supabase.from("payment_methods").delete().eq("id", method.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods-active"] });
      toast.success("Forma de pagamento removida!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover.");
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormIsActive(true);
    setEditingMethod(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    saveMutation.mutate({ name: formName.trim(), is_active: formIsActive });
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormName(method.name);
    setFormIsActive(method.is_active);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Formas de Pagamento
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Cadastre as formas de pagamento utilizadas no sistema
          </p>
          <Badge variant="secondary" className="mt-2">
            {paymentMethods.length} forma(s) cadastrada(s)
          </Badge>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Incluir
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{editingMethod ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Boleto, Pix, Transferência"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Status</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{formIsActive ? "Ativo" : "Inativo"}</span>
                  <Switch
                    id="is_active"
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar formas de pagamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : filteredMethods.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma forma de pagamento encontrada.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMethods.map((method) => (
            <Card key={method.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">{method.name}</span>
                    <div className="mt-1">
                      <Badge variant={method.is_active ? "default" : "secondary"} className={method.is_active ? "bg-green-600" : ""}>
                        {method.is_active ? "Ativo" : "Inativo"}
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
                    <DropdownMenuItem onClick={() => handleEdit(method)}>
                      <Pencil className="h-4 w-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("Deseja realmente excluir esta forma de pagamento?")) {
                          deleteMutation.mutate(method);
                        }
                      }}
                    >
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
