import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface ImportResult {
  fileName: string;
  cteNumber: string;
  status: "success" | "error" | "duplicate";
  message?: string;
}

interface BulkCteImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkCteImportDialog({ open, onOpenChange }: BulkCteImportDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [currentFile, setCurrentFile] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const xmlFiles = selectedFiles.filter((file) =>
      file.name.toLowerCase().endsWith(".xml")
    );

    if (xmlFiles.length !== selectedFiles.length) {
      toast({
        title: "Arquivos inválidos",
        description: "Apenas arquivos XML são aceitos",
        variant: "destructive",
      });
    }

    setFiles((prev) => [...prev, ...xmlFiles]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setProgress(0);
  };

  const checkDuplicate = async (chaveAcesso: string): Promise<boolean> => {
    const { data } = await supabase
      .from("ctes")
      .select("id")
      .eq("doc_number", chaveAcesso)
      .limit(1);

    return (data?.length || 0) > 0;
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults([]);
    setProgress(0);

    const importResults: ImportResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFile(file.name);
      setProgress(Math.round(((i + 1) / files.length) * 100));

      try {
        // Parse the XML using the edge function
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-cte-xml`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          }
        );

        const result = await response.json();

        if (!response.ok || result.error) {
          importResults.push({
            fileName: file.name,
            cteNumber: "-",
            status: "error",
            message: result.error || "Erro ao processar XML",
          });
          continue;
        }

        const data = result.data;

        // Check for duplicate
        if (data.chaveAcesso) {
          const isDuplicate = await checkDuplicate(data.chaveAcesso);
          if (isDuplicate) {
            importResults.push({
              fileName: file.name,
              cteNumber: data.numeroCte || "-",
              status: "duplicate",
              message: "CT-e já cadastrado no sistema",
            });
            continue;
          }
        }

        // Insert the CT-e
        const cteData = {
          cte_number: data.numeroCte?.padStart(6, "0").slice(0, 6) || "000000",
          doc_number: data.chaveAcesso || null,
          issue_date: data.dataEmissao || new Date().toISOString().split("T")[0],
          origin: data.origem || "",
          destination: data.destino || "",
          value: data.valorTotal || 0,
          weight: data.peso || null,
          product_description: data.produtoDescricao || null,
          cfop: data.cfop || null,
          sender_name: data.remetente?.nome || null,
          sender_cnpj: data.remetente?.cnpj || null,
          sender_address: data.remetente?.endereco || null,
          sender_ie: data.remetente?.ie || null,
          recipient_name: data.destinatario?.nome || null,
          recipient_cnpj: data.destinatario?.cnpj || null,
          recipient_address: data.destinatario?.endereco || null,
          recipient_ie: data.destinatario?.ie || null,
          driver_name: data.motorista?.nome || null,
          vehicle_plate: data.veiculo?.placa || null,
          freight_value: data.valorTotal || null,
          contract_id: null,
        };

        const { error: insertError } = await supabase.from("ctes").insert(cteData);

        if (insertError) {
          importResults.push({
            fileName: file.name,
            cteNumber: data.numeroCte || "-",
            status: "error",
            message: insertError.message,
          });
        } else {
          importResults.push({
            fileName: file.name,
            cteNumber: data.numeroCte || "-",
            status: "success",
          });
        }
      } catch (error: any) {
        importResults.push({
          fileName: file.name,
          cteNumber: "-",
          status: "error",
          message: error.message || "Erro desconhecido",
        });
      }
    }

    setResults(importResults);
    setIsProcessing(false);
    setCurrentFile("");

    // Refresh the CTEs list
    queryClient.invalidateQueries({ queryKey: ["ctes"] });

    const successCount = importResults.filter((r) => r.status === "success").length;
    const errorCount = importResults.filter((r) => r.status === "error").length;
    const duplicateCount = importResults.filter((r) => r.status === "duplicate").length;

    toast({
      title: "Importação concluída",
      description: `${successCount} importados, ${duplicateCount} duplicados, ${errorCount} erros`,
    });
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const duplicateCount = results.filter((r) => r.status === "duplicate").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar CT-e em Massa (XML)
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* File upload area */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <Input
              id="bulkXmlFiles"
              type="file"
              accept=".xml"
              multiple
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="hidden"
            />
            <label htmlFor="bulkXmlFiles" className="cursor-pointer">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Clique para selecionar ou arraste os arquivos XML
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione múltiplos arquivos XML de CT-e
              </p>
            </label>
          </div>

          {/* Selected files list */}
          {files.length > 0 && !isProcessing && results.length === 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>{files.length} arquivo(s) selecionado(s)</Label>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>
              <ScrollArea className="h-40 border rounded-lg p-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1 px-2 hover:bg-muted rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[300px]">
                        {file.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processando: {currentFile}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progress}% concluído
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && !isProcessing && (
            <div>
              <div className="flex gap-3 mb-3">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {successCount} Sucesso
                </Badge>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {duplicateCount} Duplicados
                </Badge>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  <XCircle className="h-3 w-3 mr-1" />
                  {errorCount} Erros
                </Badge>
              </div>
              <ScrollArea className="h-60 border rounded-lg">
                <div className="p-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between py-2 px-3 rounded mb-1 ${
                        result.status === "success"
                          ? "bg-success/10"
                          : result.status === "duplicate"
                          ? "bg-warning/10"
                          : "bg-destructive/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {result.status === "success" && (
                          <CheckCircle className="h-4 w-4 text-success" />
                        )}
                        {result.status === "duplicate" && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                        {result.status === "error" && (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <div>
                          <p className="text-sm font-medium truncate max-w-[250px]">
                            {result.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            CT-e: {result.cteNumber}
                            {result.message && ` - ${result.message}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              clearAll();
              onOpenChange(false);
            }}
          >
            {results.length > 0 ? "Fechar" : "Cancelar"}
          </Button>
          {results.length === 0 && (
            <Button
              onClick={processFiles}
              disabled={files.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {files.length} arquivo(s)
                </>
              )}
            </Button>
          )}
          {results.length > 0 && (
            <Button onClick={clearAll}>Nova Importação</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
