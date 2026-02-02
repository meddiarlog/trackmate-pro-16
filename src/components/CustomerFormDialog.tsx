import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CustomerContactList, Contact } from "@/components/CustomerContactList";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customerId: string) => void;
  editingCustomer?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    neighborhood?: string;
    cep?: string;
    cpf_cnpj?: string;
    responsavel?: string;
    prazo_dias?: number;
    observacoes?: string;
  } | null;
}

interface CustomerContact {
  id: string;
  customer_id: string;
  tipo: string;
  telefone: string;
  email: string;
  responsavel: string | null;
}

export function CustomerFormDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  editingCustomer 
}: CustomerFormDialogProps) {
  const queryClient = useQueryClient();
  const [cnpjSearching, setCnpjSearching] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    nome_fantasia: "",
    email: "",
    address: "",
    city: "",
    state: "",
    neighborhood: "",
    cep: "",
    cpf_cnpj: "",
    prazo_dias: 30,
    observacoes: "",
  });

  // Load data when editing
  useEffect(() => {
    if (editingCustomer && open) {
      setFormData({
        name: editingCustomer.name || "",
        nome_fantasia: (editingCustomer as any).nome_fantasia || "",
        email: "",
        address: editingCustomer.address || "",
        city: editingCustomer.city || "",
        state: editingCustomer.state || "",
        neighborhood: editingCustomer.neighborhood || "",
        cep: editingCustomer.cep || "",
        cpf_cnpj: editingCustomer.cpf_cnpj || "",
        prazo_dias: editingCustomer.prazo_dias || 30,
        observacoes: editingCustomer.observacoes || "",
      });
      // Fetch contacts
      fetchContactsForCustomer(editingCustomer.id);
    } else if (!open) {
      resetForm();
    }
  }, [editingCustomer, open]);

  const fetchContactsForCustomer = async (customerId: string) => {
    const { data, error } = await supabase
      .from("customer_contacts")
      .select("*")
      .eq("customer_id", customerId);
    if (error) {
      console.error("Error fetching contacts:", error);
      return;
    }
    setContacts((data as CustomerContact[]).map((c) => ({
      id: c.id,
      tipo: c.tipo as "financeiro" | "comercial",
      telefone: c.telefone || "",
      email: c.email || "",
      responsavel: c.responsavel || "",
    })));
  };

  const formatCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
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
      
      // Check for duplicate CPF/CNPJ
      if (customer.cpf_cnpj) {
        const cleanDoc = customer.cpf_cnpj.replace(/\D/g, "");
        if (cleanDoc) {
          const { data: existing } = await supabase
            .from("customers")
            .select("id")
            .eq("cpf_cnpj", cleanDoc);
          
          if (existing && existing.length > 0) {
            if (!editingCustomer || (existing.length > 1 || existing[0].id !== editingCustomer.id)) {
              throw new Error("Já existe um cliente cadastrado com este CPF/CNPJ.");
            }
          }
        }
      }
      
      const customerData = {
        ...customer,
        cpf_cnpj: customer.cpf_cnpj?.replace(/\D/g, "") || null,
      };
      
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(customerData)
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
          .insert([customerData])
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
          responsavel: c.responsavel || null,
        }));
        
        const { error: contactsError } = await supabase
          .from("customer_contacts")
          .insert(contactsToInsert);
        if (contactsError) throw contactsError;
      }
      
      return customerId;
    },
    onSuccess: (customerId) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(editingCustomer ? "Cliente atualizado!" : "Cliente cadastrado!");
      onOpenChange(false);
      resetForm();
      onSuccess?.(customerId);
    },
    onError: (error: Error) => {
      console.error(error);
      toast.error(error.message || "Erro ao salvar cliente");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      nome_fantasia: "",
      email: "",
      address: "",
      city: "",
      state: "",
      neighborhood: "",
      cep: "",
      cpf_cnpj: "",
      prazo_dias: 30,
      observacoes: "",
    });
    setContacts([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Razão Social é obrigatório");
      return;
    }

    saveCustomerMutation.mutate(formData);
  };

  const prazoOptions = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          {/* Nome Fantasia */}
          <div className="space-y-2">
            <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
            <Input
              id="nome_fantasia"
              placeholder="Nome Fantasia"
              value={formData.nome_fantasia}
              onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveCustomerMutation.isPending}>
              {saveCustomerMutation.isPending ? "Salvando..." : editingCustomer ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
