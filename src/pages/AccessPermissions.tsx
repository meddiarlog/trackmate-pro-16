import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Shield, Save } from "lucide-react";

interface SystemUser {
  id: string;
  name: string;
  email: string;
}

interface SystemModule {
  id: string;
  name: string;
  code: string;
  description: string | null;
  display_order: number;
}

interface UserPermission {
  id: string;
  user_id: string;
  module_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface ModulePermission extends SystemModule {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export default function AccessPermissions() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["system_users_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_users")
        .select("id, name, email")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as SystemUser[];
    },
  });

  // Fetch modules
  const { data: modules = [] } = useQuery({
    queryKey: ["system_modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_modules")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as SystemModule[];
    },
  });

  // Fetch user permissions
  const { data: userPermissions = [], refetch: refetchPermissions } = useQuery({
    queryKey: ["user_permissions", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const { data, error } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", selectedUserId);
      if (error) throw error;
      return data as UserPermission[];
    },
    enabled: !!selectedUserId,
  });

  // Update permissions when user or data changes
  useEffect(() => {
    if (modules.length > 0) {
      const modulePermissions = modules.map((module) => {
        const userPerm = userPermissions.find((p) => p.module_id === module.id);
        return {
          ...module,
          can_view: userPerm?.can_view || false,
          can_create: userPerm?.can_create || false,
          can_edit: userPerm?.can_edit || false,
          can_delete: userPerm?.can_delete || false,
        };
      });
      setPermissions(modulePermissions);
      setHasChanges(false);
    }
  }, [modules, userPermissions, selectedUserId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error("Selecione um usuário");

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", selectedUserId);
      if (deleteError) throw deleteError;

      // Insert new permissions (only those with at least one permission)
      const permissionsToInsert = permissions
        .filter((p) => p.can_view || p.can_create || p.can_edit || p.can_delete)
        .map((p) => ({
          user_id: selectedUserId,
          module_id: p.id,
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
        }));

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("user_permissions")
          .insert(permissionsToInsert);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_permissions"] });
      toast.success("Permissões salvas com sucesso!");
      setHasChanges(false);
    },
    onError: () => toast.error("Erro ao salvar permissões"),
  });

  const handleUserChange = (userId: string) => {
    if (hasChanges) {
      const confirm = window.confirm(
        "Existem alterações não salvas. Deseja continuar?"
      );
      if (!confirm) return;
    }
    setSelectedUserId(userId);
  };

  const handlePermissionChange = (
    moduleId: string,
    field: "can_view" | "can_create" | "can_edit" | "can_delete",
    value: boolean
  ) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.id === moduleId) {
          const updated = { ...p, [field]: value };
          // If removing view, remove all other permissions
          if (field === "can_view" && !value) {
            updated.can_create = false;
            updated.can_edit = false;
            updated.can_delete = false;
          }
          // If adding any other permission, ensure view is enabled
          if (field !== "can_view" && value) {
            updated.can_view = true;
          }
          return updated;
        }
        return p;
      })
    );
    setHasChanges(true);
  };

  const handleSelectAll = (field: "can_view" | "can_create" | "can_edit" | "can_delete") => {
    const allChecked = permissions.every((p) => p[field]);
    setPermissions((prev) =>
      prev.map((p) => {
        const updated = { ...p, [field]: !allChecked };
        // Apply the same logic as individual changes
        if (field === "can_view" && allChecked) {
          updated.can_create = false;
          updated.can_edit = false;
          updated.can_delete = false;
        }
        if (field !== "can_view" && !allChecked) {
          updated.can_view = true;
        }
        return updated;
      })
    );
    setHasChanges(true);
  };

  const handleSelectAllRow = (moduleId: string) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.id === moduleId) {
          const allChecked = p.can_view && p.can_create && p.can_edit && p.can_delete;
          return {
            ...p,
            can_view: !allChecked,
            can_create: !allChecked,
            can_edit: !allChecked,
            can_delete: !allChecked,
          };
        }
        return p;
      })
    );
    setHasChanges(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Permissões</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gerenciar Permissões
            </CardTitle>
            {selectedUserId && (
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !hasChanges}
              >
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? "Salvando..." : "Salvar Permissões"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User selector */}
          <div className="max-w-md">
            <Select value={selectedUserId} onValueChange={handleUserChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permissions table */}
          {selectedUserId ? (
            permissions.length === 0 ? (
              <p className="text-muted-foreground">Carregando módulos...</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Módulo</TableHead>
                      <TableHead className="text-center w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <span>Ver</span>
                          <Checkbox
                            checked={permissions.every((p) => p.can_view)}
                            onCheckedChange={() => handleSelectAll("can_view")}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <span>Criar</span>
                          <Checkbox
                            checked={permissions.every((p) => p.can_create)}
                            onCheckedChange={() => handleSelectAll("can_create")}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <span>Editar</span>
                          <Checkbox
                            checked={permissions.every((p) => p.can_edit)}
                            onCheckedChange={() => handleSelectAll("can_edit")}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <span>Excluir</span>
                          <Checkbox
                            checked={permissions.every((p) => p.can_delete)}
                            onCheckedChange={() => handleSelectAll("can_delete")}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[100px]">Todos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{module.name}</span>
                            {module.description && (
                              <p className="text-xs text-muted-foreground">
                                {module.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={module.can_view}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(module.id, "can_view", !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={module.can_create}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(module.id, "can_create", !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={module.can_edit}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(module.id, "can_edit", !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={module.can_delete}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(module.id, "can_delete", !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={
                              module.can_view &&
                              module.can_create &&
                              module.can_edit &&
                              module.can_delete
                            }
                            onCheckedChange={() => handleSelectAllRow(module.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <p className="text-muted-foreground">
              Selecione um usuário para gerenciar suas permissões
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
