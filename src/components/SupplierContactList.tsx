import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface SupplierContact {
  id: string;
  tipo: "financeiro" | "comercial";
  telefone: string;
  email: string;
}

interface SupplierContactListProps {
  contacts: SupplierContact[];
  onChange: (contacts: SupplierContact[]) => void;
}

export function SupplierContactList({ contacts, onChange }: SupplierContactListProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const addContact = () => {
    onChange([
      ...contacts,
      { id: crypto.randomUUID(), tipo: "comercial", telefone: "", email: "" },
    ]);
  };

  const removeContact = (index: number) => {
    const newContacts = [...contacts];
    newContacts.splice(index, 1);
    onChange(newContacts);
  };

  const updateContact = (index: number, field: keyof SupplierContact, value: string) => {
    const newContacts = [...contacts];
    if (field === "telefone") {
      newContacts[index][field] = formatPhone(value);
    } else {
      (newContacts[index] as any)[field] = value;
    }
    onChange(newContacts);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Contatos</Label>
        <Button type="button" variant="outline" size="sm" onClick={addContact}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar Contato
        </Button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <div key={contact.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Select
                  value={contact.tipo}
                  onValueChange={(value) => updateContact(index, "tipo", value)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeContact(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Telefone</Label>
                  <div className="flex gap-1">
                    <Input
                      value={contact.telefone}
                      onChange={(e) => updateContact(index, "telefone", e.target.value)}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleCopy(contact.telefone, `phone-${index}`)}
                    >
                      {copiedField === `phone-${index}` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">E-mail</Label>
                  <div className="flex gap-1">
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(index, "email", e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleCopy(contact.email, `email-${index}`)}
                    >
                      {copiedField === `email-${index}` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
