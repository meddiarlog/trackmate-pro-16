import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CTE {
  id: string;
  cte_number: string;
  issue_date: string;
  origin: string;
  destination: string;
  value: number;
  weight?: number;
}

interface ImportCteDialogProps {
  availableCtes: CTE[];
  onImport: (selectedIds: string[]) => void;
}

export function ImportCteDialog({ availableCtes, onImport }: ImportCteDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleCte = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleImport = () => {
    onImport(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4">
      {availableCtes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum CT-e disponível para importação
        </div>
      ) : (
        <>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {availableCtes.map((cte) => (
                <div
                  key={cte.id}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={cte.id}
                    checked={selectedIds.includes(cte.id)}
                    onCheckedChange={() => toggleCte(cte.id)}
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={cte.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      CT-e {cte.cte_number}
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      <div>
                        {cte.origin} → {cte.destination}
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span>
                          Data: {format(new Date(cte.issue_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span>Valor: R$ {cte.value.toFixed(2)}</span>
                        {cte.weight && <span>Peso: {cte.weight} kg</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} CT-e(s) selecionado(s)
            </span>
            <Button onClick={handleImport} disabled={selectedIds.length === 0}>
              Importar Selecionados
            </Button>
          </div>
        </>
      )}
    </div>
  );
}