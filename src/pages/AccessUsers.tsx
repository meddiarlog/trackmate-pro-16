import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Users, Eye, EyeOff } from "lucide-react";

interface SystemUser {
  id: string;
  name: string;
  email: string;
  group_id: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface UserGroup {
  id: string;
  name: string;
}

export default function AccessUsers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    group_id: "",
    is_active: true,
  });

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["system_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_users")
        .select("id, name, email, group_id, is_active, last_login, created_at")
        .order("name");
      if (error) throw error;
      return data as SystemUser[];
    },
  });

  // Fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ["user_groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_groups")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as UserGroup[];
    },
  });

  // Hash password via edge function
  const hashPassword = async (password: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("hash-password", {
      body: { password },
    });
    if (error) throw error;
    return data.hash;
  };

  // Check email uniqueness
  const checkEmailExists = async (email: string, excludeId?: string): Promise<boolean> => {
    let query = supabase
      .from("system_users")
      .select("id", { count: "exact", head: true })
      .eq("email", email.toLowerCase());
    
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    
    const { count, error } = await query;
    if (error) throw error;
    return (count || 0) > 0;
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password?: string;
      group_id: string | null;
      is_active: boolean;
    }) => {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error("INVALID_EMAIL");
      }

      // Check email uniqueness
      const emailExists = await checkEmailExists(data.email, editingUser?.id);
      if (emailExists) {
        throw new Error("EMAIL_EXISTS");
      }

      if (editingUser) {
        // Update user
        const updateData: any = {
          name: data.name,
          email: data.email.toLowerCase(),
          group_id: data.group_id || null,
          is_active: data.is_active,
        };

        // Only update password if provided
        if (data.password) {
          updateData.password_hash = await hashPassword(data.password);
        }

        const { error } = await supabase
          .from("system_users")
          .update(updateData)
          .eq("id", editingUser.id);
        if (error) throw error;
      } else {
        // Create new user - password is required
        if (!data.password) {
          throw new Error("PASSWORD_REQUIRED");
        }

        const passwordHash = await hashPassword(data.password);
        const { error } = await supabase.from("system_users").insert([
          {
            name: data.name,
            email: data.email.toLowerCase(),
            password_hash: passwordHash,
            group_id: data.group_id || null,
            is_active: data.is_active,
          },
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_users"] });
      toast.success(editingUser ? "Usuário atualizado!" : "Usuário criado!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (error.message === "INVALID_EMAIL") {
        toast.error("E-mail inválido");
      } else if (error.message === "EMAIL_EXISTS") {
        toast.error("Este e-mail já está em uso");
      } else if (error.message === "PASSWORD_REQUIRED") {
        toast.error("Senha é obrigatória para novos usuários");
      } else {
        toast.error("Erro ao salvar usuário");
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("system_users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_users"] });
      toast.success("Usuário excluído!");
    },
    onError: () => toast.error("Erro ao excluir usuário"),
  });

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      group_id: "",
      is_active: true,
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleEdit = (user: SystemUser) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      confirmPassword: "",
      group_id: user.group_id || "",
      is_active: user.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    // Validate required fields
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!form.email.trim()) {
      toast.error("E-mail é obrigatório");
      return;
    }
    if (form.name.trim().length < 3) {
      toast.error("Nome deve ter pelo menos 3 caracteres");
      return;
    }

    // Validate password for new users
    if (!editingUser && !form.password) {
      toast.error("Senha é obrigatória");
      return;
    }

    // Validate password match
    if (form.password && form.password !== form.confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }

    // Validate password length
    if (form.password && form.password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    saveMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password || undefined,
      group_id: form.group_id || null,
      is_active: form.is_active,
    });
  };

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return "-";
    const group = groups.find((g) => g.id === groupId);
    return group?.name || "-";
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Usuários</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Usuários
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "Editar Usuário" : "Novo Usuário"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">
                      Senha {editingUser ? "(deixe em branco para manter)" : "*"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        placeholder="••••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {form.password && (
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setForm({ ...form, confirmPassword: e.target.value })
                        }
                        placeholder="••••••"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="group">Grupo</Label>
                    <Select
                      value={form.group_id}
                      onValueChange={(value) =>
                        setForm({ ...form, group_id: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={form.is_active}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Usuário ativo</Label>
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
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-muted-foreground">
              {searchTerm
                ? "Nenhum usuário encontrado"
                : "Nenhum usuário cadastrado"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getGroupName(user.group_id)}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(user.id)}
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
