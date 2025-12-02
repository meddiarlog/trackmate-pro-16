import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { CustomerContactList, Contact } from "@/components/CustomerContactList";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  cep: string;
  loading_location: string;
  unloading_location: string;
  type: "Embarcador" | "Consignatário" | "Ambos";
  cpf_cnpj?: string;
  responsavel?: string;
  prazo_dias?: number;
  observacoes?: string;
}

interface CustomerContact {
  id: string;
  customer_id: string;
  tipo: string;
  telefone: string;
  email: string;
}

export default function Customers() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cnpjSearching, setCnpjSearching] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    neighborhood: "",
    cep: "",
    loading_location: "",
    unloading_location: "",
    type: "Embarcador" as Customer["type"],
    cpf_cnpj: "",
    responsavel: "",
    prazo_dias: 30,
    observacoes: "",
  });

  // Fetch customers from Supabase
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Customer[];
    },
  });

  // Fetch contacts for editing
  const fetchContactsForCustomer = async (customerId: string) => {
    const { data, error } = await supabase
      .from("customer_contacts")
      .select("*")
      .eq("customer_id", customerId);
    if (error) {
      console.error("Error fetching contacts:", error);
      return [];
    }
    return data as CustomerContact[];
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cpf_cnpj?.includes(searchTerm)
  );

  const formatCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 11) {
      // CPF
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    // CNPJ
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/(\d{5})(\d{1,3})/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
  };

  const fetchCnpjData = async (cnpj: string) => {
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCnpj.length !== 14) {
      return;
    }

    setCnpjSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-cnpj", {
        body: { cnpj },
      });

      if (error) throw error;

      if (data) {
        setFormData((prev) => ({
          ...prev,
          name: data.name || prev.name,
          email: data.email || prev.email,
          phone: data.phone ? formatPhone(data.phone) : prev.phone,
          address: data.address || prev.address,
          neighborhood: data.neighborhood || prev.neighborhood,
          city: data.city || prev.city,
          state: data.state || prev.state,
          cep: data.cep ? formatCep(data.cep) : prev.cep,
        }));
        toast.success("Dados do CNPJ encontrados e preenchidos!");
      }
    } catch (error) {
      toast.error("Erro ao buscar dados do CNPJ. Verifique o número informado.");
      console.error(error);
    } finally {
      setCnpjSearching(false);
    }
  };

  const handleCnpjBlur = () => {
    const cnpj = formData.cpf_cnpj?.replace(/[^\d]/g, "");
    if (cnpj && cnpj.length === 14) {
      fetchCnpjData(cnpj);
    }
  };

  const saveCustomerMutation = useMutation({
    mutationFn: async (customer: typeof formData) => {
      let customerId: string;
      
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(customer)
          .eq("id", editingCustomer.id);
        if (error) throw error;
        customerId = editingCustomer.id;
        
        // Delete old contacts
        await supabase
          .from("customer_contacts")
          .delete()
          .eq("customer_id", customerId);
      } else {
        const { data, error } = await supabase
          .from("customers")
          .insert([customer])
          .select()
          .single();
        if (error) throw error;
        customerId = data.id;
      }
      
      // Insert new contacts
      if (contacts.length > 0) {
        const contactsToInsert = contacts.map((c) => ({
          customer_id: customerId,
          tipo: c.tipo,
          telefone: c.telefone,
          email: c.email,
        }));
        
        const { error: contactsError } = await supabase
          .from("customer_contacts")
          .insert(contactsToInsert);
        if (contactsError) throw contactsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(editingCustomer ? "Cliente atualizado!" : "Cliente cadastrado!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar cliente");
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente removido!");
    },
    onError: () => {
      toast.error("Erro ao remover cliente");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      neighborhood: "",
      cep: "",
      loading_location: "",
      unloading_location: "",
      type: "Embarcador",
      cpf_cnpj: "",
      responsavel: "",
      prazo_dias: 30,
      observacoes: "",
    });
    setContacts([]);
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Razão Social é obrigatório");
      return;
    }

    saveCustomerMutation.mutate(formData);
  };

  const handleEdit = async (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      neighborhood: customer.neighborhood || "",
      cep: customer.cep || "",
      loading_location: customer.loading_location || "",
      unloading_location: customer.unloading_location || "",
      type: customer.type || "Embarcador",
      cpf_cnpj: customer.cpf_cnpj || "",
      responsavel: customer.responsavel || "",
      prazo_dias: customer.prazo_dias || 30,
      observacoes: customer.observacoes || "",
    });
    
    // Fetch contacts
    const customerContacts = await fetchContactsForCustomer(customer.id);
    setContacts(customerContacts.map((c) => ({
      id: c.id,
      tipo: c.tipo as "financeiro" | "comercial",
      telefone: c.telefone || "",
      email: c.email || "",
    })));
    
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCustomerMutation.mutate(id);
  };

  const handleCopy = async (text: string, fieldId: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      toast.success("Copiado!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const getTypeBadge = (type: Customer["type"]) => {
    switch (type) {
      case "Embarcador":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Embarcador</Badge>;
      case "Consignatário":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Consignatário</Badge>;
      case "Ambos":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Ambos</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const prazoOptions = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Gestão de Clientes
          </h1>
          <p className="text-muted-foreground mt-1">Cadastre embarcadores e consignatários</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Cadastrar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Editar Cliente" : "Cadastrar Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* CNPJ/CPF */}
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CNPJ / CPF</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: formatCpfCnpj(e.target.value) })}
                  onBlur={handleCnpjBlur}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  disabled={cnpjSearching}
                  maxLength={18}
                />
                {cnpjSearching && (
                  <p className="text-sm text-muted-foreground">Buscando dados do CNPJ...</p>
                )}
              </div>

              {/* Razão Social */}
              <div className="space-y-2">
                <Label htmlFor="name">Razão Social *</Label>
                <Input
                  id="name"
                  placeholder="Empresa ABC Ltda"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Endereço Completo */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Endereço</Label>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    placeholder="Rua, Número, Complemento"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      placeholder="São Paulo"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado (UF)</Label>
                    <Input
                      id="state"
                      placeholder="SP"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: formatCep(e.target.value) })}
                      maxLength={9}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      placeholder="Centro"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Responsável */}
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  placeholder="Nome do responsável"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                />
              </div>

              {/* Contatos */}
              <div className="border-t pt-6">
                <CustomerContactList contacts={contacts} onChange={setContacts} />
              </div>

              {/* Prazo do Cliente */}
              <div className="space-y-2">
                <Label htmlFor="prazo_dias">Prazo do Cliente (dias)</Label>
                <Select
                  value={String(formData.prazo_dias)}
                  onValueChange={(value) => setFormData({ ...formData, prazo_dias: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o prazo" />
                  </SelectTrigger>
                  <SelectContent>
                    {prazoOptions.map((dia) => (
                      <SelectItem key={dia} value={String(dia)}>
                        {dia} {dia === 1 ? "dia" : "dias"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Anotações gerais sobre o cliente..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Campos adicionais (ocultos por padrão, mantidos para compatibilidade) */}
              <div className="space-y-4 border-t pt-6">
                <Label className="text-base font-semibold">Informações Adicionais</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail Principal</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@empresa.com.br"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone Principal</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loading_location">Local de Carregamento</Label>
                    <Input
                      id="loading_location"
                      placeholder="Galpão A - Portão 3"
                      value={formData.loading_location}
                      onChange={(e) => setFormData({ ...formData, loading_location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unloading_location">Local de Descarregamento</Label>
                    <Input
                      id="unloading_location"
                      placeholder="Doca 5 - Setor Norte"
                      value={formData.unloading_location}
                      onChange={(e) => setFormData({ ...formData, unloading_location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Cliente</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as Customer["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Embarcador">Embarcador</SelectItem>
                      <SelectItem value="Consignatário">Consignatário</SelectItem>
                      <SelectItem value="Ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveCustomerMutation.isPending}>
                  {saveCustomerMutation.isPending ? "Salvando..." : editingCustomer ? "Atualizar" : "Cadastrar"}
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
              placeholder="Buscar por nome, cidade, estado ou CNPJ/CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{customer.name}</CardTitle>
                {getTypeBadge(customer.type)}
              </div>
              {customer.cpf_cnpj && (
                <p className="text-sm text-muted-foreground">{customer.cpf_cnpj}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {customer.email && (
                  <div className="flex items-center gap-2 group">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm flex-1">{customer.email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(customer.email, `email-${customer.id}`)}
                    >
                      {copiedField === `email-${customer.id}` ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 group">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm flex-1">{customer.phone}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(customer.phone, `phone-${customer.id}`)}
                    >
                      {copiedField === `phone-${customer.id}` ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
                {(customer.address || customer.city) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      {customer.address && <div>{customer.address}</div>}
                      <div className="text-muted-foreground">
                        {[customer.neighborhood, customer.city, customer.state, customer.cep]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </div>
                  </div>
                )}
                {customer.prazo_dias && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Prazo: </span>
                    <span className="font-medium">{customer.prazo_dias} dias</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button size="sm" variant="outline" onClick={() => handleEdit(customer)} className="flex-1 gap-2">
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(customer.id)}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente ajustar os filtros de busca." : "Comece cadastrando seu primeiro cliente."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
