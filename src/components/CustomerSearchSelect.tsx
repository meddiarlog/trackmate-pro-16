import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface CustomerOption {
  id: string;
  name: string;
  nome_fantasia?: string | null;
  cpf_cnpj?: string | null;
  prazo_dias?: number | null;
  phone?: string | null;
}

interface CustomerSearchSelectProps {
  customers: CustomerOption[];
  value: string;
  onChange: (customerId: string) => void;
  placeholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
}

function highlightMatch(text: string, search: string) {
  if (!search || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="text-foreground">{text.slice(idx, idx + search.length)}</strong>
      {text.slice(idx + search.length)}
    </>
  );
}

export function CustomerSearchSelect({
  customers,
  value,
  onChange,
  placeholder = "Selecione um cliente",
  allowNone = false,
  noneLabel = "Nenhum (usar cliente)",
}: CustomerSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCustomer = customers.find((c) => c.id === value);

  const displayLabel = selectedCustomer
    ? selectedCustomer.nome_fantasia && selectedCustomer.nome_fantasia !== selectedCustomer.name
      ? `${selectedCustomer.name} (${selectedCustomer.nome_fantasia})`
      : selectedCustomer.name
    : placeholder;

  const filtered = useMemo(() => {
    if (!search) return customers;
    const term = search.toLowerCase();
    const termDigits = search.replace(/\D/g, "");

    return customers
      .filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(term);
        const fantasiaMatch = c.nome_fantasia?.toLowerCase().includes(term) ?? false;
        const docMatch =
          termDigits.length > 0 && c.cpf_cnpj
            ? c.cpf_cnpj.replace(/\D/g, "").includes(termDigits)
            : false;
        return nameMatch || fantasiaMatch || docMatch;
      })
      .sort((a, b) => {
        // Items starting with search term come first
        const aStarts = a.name.toLowerCase().startsWith(term) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(term) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.localeCompare(b.name);
      });
  }, [customers, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          type="button"
        >
          <span className="truncate">{displayLabel}</span>
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nome, nome fantasia, CPF ou CNPJ..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            <CommandGroup>
              {allowNone && (
                <CommandItem
                  value="none"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="text-muted-foreground">{noneLabel}</span>
                </CommandItem>
              )}
              {filtered.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={() => {
                    onChange(customer.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <div className="flex flex-col">
                    <span>{highlightMatch(customer.name, search)}</span>
                    {customer.nome_fantasia &&
                      customer.nome_fantasia !== customer.name && (
                        <span className="text-xs text-muted-foreground">
                          {highlightMatch(customer.nome_fantasia, search)}
                        </span>
                      )}
                    <span className="text-xs text-muted-foreground">
                      {customer.cpf_cnpj
                        ? highlightMatch(
                            customer.cpf_cnpj,
                            search.replace(/\D/g, "").length > 0 ? search : ""
                          )
                        : "Sem CPF/CNPJ"}
                      {customer.prazo_dias ? ` • ${customer.prazo_dias} dias` : ""}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
