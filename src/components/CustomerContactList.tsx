import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export interface Contact {
  id?: string;
  tipo: "financeiro" | "comercial";
  telefone: string;
  email: string;
}

interface CustomerContactListProps {
  contacts: Contact[];
  onChange: (contacts: Contact[]) => void;
}

export function CustomerContactList({ contacts, onChange }: CustomerContactListProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const addContact = () => {
    onChange([...contacts, { tipo: "comercial", telefone: "", email: "" }]);
  };

  const removeContact = (index: number) => {
    onChange(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const updated = contacts.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    );
    onChange(updated);
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
        <Button type="button" variant="outline" size="sm" onClick={addContact} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Contato
        </Button>
      </div>

      {contacts.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
          Nenhum contato adicionado. Clique em "Adicionar Contato" para começar.
        </p>
      )}

      {contacts.map((contact, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Contato {index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeContact(index)}
              className="text-destructive hover:text-destructive h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Contato</Label>
              <Select
                value={contact.tipo}
                onValueChange={(value) => updateContact(index, "tipo", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <div className="flex gap-2">
                <Input
                  value={contact.telefone}
                  onChange={(e) => updateContact(index, "telefone", formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(contact.telefone, `phone-${index}`)}
                  disabled={!contact.telefone}
                  className="shrink-0"
                >
                  {copiedField === `phone-${index}` ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) => updateContact(index, "email", e.target.value)}
                  placeholder="contato@email.com"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(contact.email, `email-${index}`)}
                  disabled={!contact.email}
                  className="shrink-0"
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
  );
}
