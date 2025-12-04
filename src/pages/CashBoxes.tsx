import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wallet, Tag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CashCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface CashBox {
  id: string;
  name: string;
  category_id: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

export default function CashBoxes() {
  const queryClient = useQueryClient();
  
  // Category state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CashCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  
  // Cash box state
  const [cashBoxDialogOpen, setCashBoxDialogOpen] = useState(false);
  const [editingCashBox, setEditingCashBox] = useState<CashBox | null>(null);
  const [cashBoxForm, setCashBoxForm] = useState({
    name: "",
    category_id: "",
    initial_balance: "",
  });

  // Fetch data
  const { data: categories = [] } = useQuery({
    queryKey: ["cash_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as CashCategory[];
    },
  });

  const { data: cashBoxes = [] } = useQuery({
    queryKey: ["cash_boxes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_boxes")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as CashBox[];
    },
  });

  // Category mutations
  const saveCategoryMutation = useMutation({
    mutationFn: async (category: { name: string; description: string }) => {
      if (editingCategory) {
        const { error } = await supabase
          .from("cash_categories")
          .update(category)
          .eq("id", editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cash_categories").insert([category]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_categories"] });
      toast.success(editingCategory ? "Categoria atualizada!" : "Categoria criada!");
      setCategoryDialogOpen(false);
      resetCategoryForm();
    },
    onError: () => toast.error("Erro ao salvar categoria"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cash_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_categories"] });
      toast.success("Categoria excluída!");
    },
    onError: () => toast.error("Erro ao excluir categoria. Verifique se não há caixas vinculados."),
  });

  // Cash box mutations
  const saveCashBoxMutation = useMutation({
    mutationFn: async (cashBox: { name: string; category_id: string; initial_balance: number; current_balance: number }) => {
      if (editingCashBox) {
        const { error } = await supabase
          .from("cash_boxes")
          .update({ name: cashBox.name, category_id: cashBox.category_id })
          .eq("id", editingCashBox.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cash_boxes").insert([cashBox]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_boxes"] });
      toast.success(editingCashBox ? "Caixa atualizado!" : "Caixa criado!");
      setCashBoxDialogOpen(false);
      resetCashBoxForm();
    },
    onError: () => toast.error("Erro ao salvar caixa"),
  });

  const deleteCashBoxMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cash_boxes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_boxes"] });
      toast.success("Caixa excluído!");
    },
    onError: () => toast.error("Erro ao excluir caixa. Verifique se não há movimentações vinculadas."),
  });

  // Handlers
  const resetCategoryForm = () => {
    setCategoryForm({ name: "", description: "" });
    setEditingCategory(null);
  };

  const resetCashBoxForm = () => {
    setCashBoxForm({ name: "", category_id: "", initial_balance: "" });
    setEditingCashBox(null);
  };

  const handleSaveCategory = () => {
    if (!categoryForm.name) {
      toast.error("Preencha o nome da categoria");
      return;
    }
    saveCategoryMutation.mutate(categoryForm);
  };

  const handleEditCategory = (category: CashCategory) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, description: category.description || "" });
    setCategoryDialogOpen(true);
  };

  const handleSaveCashBox = () => {
    if (!cashBoxForm.name || !cashBoxForm.category_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const initialBalance = parseFloat(cashBoxForm.initial_balance) || 0;
    saveCashBoxMutation.mutate({
      name: cashBoxForm.name,
      category_id: cashBoxForm.category_id,
      initial_balance: initialBalance,
      current_balance: initialBalance,
    });
  };

  const handleEditCashBox = (cashBox: CashBox) => {
    setEditingCashBox(cashBox);
    setCashBoxForm({
      name: cashBox.name,
      category_id: cashBox.category_id,
      initial_balance: cashBox.initial_balance.toString(),
    });
    setCashBoxDialogOpen(true);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Categoria não encontrada";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Controle de Caixa</h1>

      <Tabs defaultValue="cashboxes" className="w-full">
        <TabsList>
          <TabsTrigger value="cashboxes" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Caixas
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categorias
          </TabsTrigger>
        </TabsList>

        {/* Cash Boxes Tab */}
        <TabsContent value="cashboxes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Caixas Cadastrados</CardTitle>
                <Dialog open={cashBoxDialogOpen} onOpenChange={setCashBoxDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetCashBoxForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Caixa
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCashBox ? "Editar Caixa" : "Novo Caixa"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome do Caixa *</Label>
                        <Input
                          value={cashBoxForm.name}
                          onChange={(e) => setCashBoxForm({ ...cashBoxForm, name: e.target.value })}
                          placeholder="Ex: Caixa Principal"
                        />
                      </div>
                      <div>
                        <Label>Categoria *</Label>
                        <Select
                          value={cashBoxForm.category_id}
                          onValueChange={(value) => setCashBoxForm({ ...cashBoxForm, category_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {!editingCashBox && (
                        <div>
                          <Label>Saldo Inicial</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={cashBoxForm.initial_balance}
                            onChange={(e) => setCashBoxForm({ ...cashBoxForm, initial_balance: e.target.value })}
                            placeholder="0,00"
                          />
                        </div>
                      )}
                      <Button onClick={handleSaveCashBox} className="w-full">
                        {editingCashBox ? "Atualizar" : "Salvar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma categoria cadastrada.</p>
                  <p className="text-sm">Cadastre uma categoria primeiro para criar caixas.</p>
                </div>
              ) : cashBoxes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum caixa cadastrado.</p>
                  <p className="text-sm">Clique em "Novo Caixa" para começar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Saldo Inicial</TableHead>
                      <TableHead>Saldo Atual</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashBoxes.map((cashBox) => (
                      <TableRow key={cashBox.id}>
                        <TableCell className="font-medium">{cashBox.name}</TableCell>
                        <TableCell>{getCategoryName(cashBox.category_id)}</TableCell>
                        <TableCell>
                          {Number(cashBox.initial_balance).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          {Number(cashBox.current_balance).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cashBox.is_active ? "default" : "secondary"}>
                            {cashBox.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditCashBox(cashBox)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCashBoxMutation.mutate(cashBox.id)}
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
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Categorias de Caixa</CardTitle>
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetCategoryForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome *</Label>
                        <Input
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          placeholder="Ex: Operacional"
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Input
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          placeholder="Descrição opcional"
                        />
                      </div>
                      <Button onClick={handleSaveCategory} className="w-full">
                        {editingCategory ? "Atualizar" : "Salvar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma categoria cadastrada.</p>
                  <p className="text-sm">Clique em "Nova Categoria" para começar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Caixas Vinculados</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => {
                      const linkedBoxes = cashBoxes.filter((cb) => cb.category_id === category.id).length;
                      return (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.description || "-"}</TableCell>
                          <TableCell>{linkedBoxes}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteCategoryMutation.mutate(category.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
