import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FolderOpen, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomerGroup {
  id: string;
  name: string;
  created_at: string;
}

export default function Groups() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupName, setGroupName] = useState("");

  // Fetch groups
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["customer_groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_groups")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as CustomerGroup[];
    },
  });

  // Filtered groups
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Save mutation
  const saveGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      // Check for duplicate name
      const { data: existing } = await supabase
        .from("customer_groups")
        .select("id")
        .ilike("name", name);

      if (existing && existing.length > 0) {
        if (!editingGroup || (existing.length > 1 || existing[0].id !== editingGroup.id)) {
          throw new Error("Já existe um grupo com este nome.");
        }
      }

      if (editingGroup) {
        const { error } = await supabase
          .from("customer_groups")
          .update({ name })
          .eq("id", editingGroup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customer_groups")
          .insert([{ name }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_groups"] });
      toast.success(editingGroup ? "Grupo atualizado!" : "Grupo cadastrado!");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar grupo");
    },
  });

  // Delete mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if group has linked customers
      const { data: linkedCustomers } = await supabase
        .from("customers")
        .select("id")
        .eq("group_id", id)
        .limit(1);

      if (linkedCustomers && linkedCustomers.length > 0) {
        throw new Error("Este grupo possui clientes vinculados e não pode ser excluído.");
      }

      // Check if group has linked cobrancas
      const { data: linkedCobrancas } = await supabase
        .from("boletos")
        .select("id")
        .eq("group_id", id)
        .limit(1);

      if (linkedCobrancas && linkedCobrancas.length > 0) {
        throw new Error("Este grupo possui cobranças vinculadas e não pode ser excluído.");
      }

      const { error } = await supabase
        .from("customer_groups")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_groups"] });
      toast.success("Grupo removido!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover grupo");
    },
  });

  const resetForm = () => {
    setGroupName("");
    setEditingGroup(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("O nome do grupo é obrigatório");
      return;
    }
    saveGroupMutation.mutate(groupName.trim());
  };

  const handleEdit = (group: CustomerGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir este grupo?")) {
      deleteGroupMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Gestão de Grupos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Organize clientes e cobranças em grupos
          </p>
          <Badge variant="secondary" className="mt-2">
            {groups.length} grupo(s) cadastrado(s)
          </Badge>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Editar Grupo" : "Cadastrar Novo Grupo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Grupo *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Clientes Premium"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveGroupMutation.isPending}>
                  {saveGroupMutation.isPending
                    ? "Salvando..."
                    : editingGroup
                    ? "Atualizar"
                    : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="mb-6 border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Grupos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum grupo encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Tente ajustar os filtros de busca."
                  : "Comece cadastrando seu primeiro grupo."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome do Grupo</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-mono text-muted-foreground">
                      {group.id.substring(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>
                      {format(new Date(group.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(group)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(group.id)}
                          className="text-destructive hover:text-destructive"
                          disabled={deleteGroupMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
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
    </div>
  );
}
