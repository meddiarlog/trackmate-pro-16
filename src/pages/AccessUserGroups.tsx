import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";

interface UserGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function AccessUserGroups() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  // Fetch groups
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["user_groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_groups")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as UserGroup[];
    },
  });

  // Check if group has users
  const checkGroupHasUsers = async (groupId: string): Promise<boolean> => {
    const { count, error } = await supabase
      .from("system_users")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId);
    if (error) throw error;
    return (count || 0) > 0;
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; description: string | null }) => {
      if (editingGroup) {
        const { error } = await supabase
          .from("user_groups")
          .update(data)
          .eq("id", editingGroup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_groups").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_groups"] });
      toast.success(editingGroup ? "Grupo atualizado!" : "Grupo criado!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Já existe um grupo com este nome");
      } else {
        toast.error("Erro ao salvar grupo");
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if group has users
      const hasUsers = await checkGroupHasUsers(id);
      if (hasUsers) {
        throw new Error("GROUP_HAS_USERS");
      }
      const { error } = await supabase.from("user_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_groups"] });
      toast.success("Grupo excluído!");
    },
    onError: (error: any) => {
      if (error.message === "GROUP_HAS_USERS") {
        toast.error("Não é possível excluir: existem usuários neste grupo");
      } else {
        toast.error("Erro ao excluir grupo");
      }
    },
  });

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setEditingGroup(null);
  };

  const handleEdit = (group: UserGroup) => {
    setEditingGroup(group);
    setForm({
      name: group.name,
      description: group.description || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    saveMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || null,
    });
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Grupos de Usuários</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Grupos
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingGroup ? "Editar Grupo" : "Novo Grupo"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nome do grupo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Descrição do grupo"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filteredGroups.length === 0 ? (
            <p className="text-muted-foreground">
              {searchTerm
                ? "Nenhum grupo encontrado"
                : "Nenhum grupo cadastrado"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.description || "-"}</TableCell>
                    <TableCell>
                      {new Date(group.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(group)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(group.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
