import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Folder, 
  FileText, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  ChevronRight, 
  Home,
  FolderPlus,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RepositoryFolder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

interface RepositoryFile {
  id: string;
  folder_id: string | null;
  file_name: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
}

export default function RepositoryFixed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<RepositoryFolder[]>([]);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  // Fetch folders in current directory
  const { data: folders = [], isLoading: loadingFolders } = useQuery({
    queryKey: ["repository_folders", currentFolderId],
    queryFn: async () => {
      const query = supabase
        .from("repository_folders")
        .select("*")
        .order("name");
      
      if (currentFolderId) {
        query.eq("parent_id", currentFolderId);
      } else {
        query.is("parent_id", null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RepositoryFolder[];
    },
  });

  // Fetch files in current directory
  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ["repository_files", currentFolderId],
    queryFn: async () => {
      const query = supabase
        .from("repository_files")
        .select("*")
        .order("file_name");
      
      if (currentFolderId) {
        query.eq("folder_id", currentFolderId);
      } else {
        query.is("folder_id", null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RepositoryFile[];
    },
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("repository_folders").insert({
        name: newFolderName,
        parent_id: currentFolderId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repository_folders", currentFolderId] });
      setIsNewFolderDialogOpen(false);
      setNewFolderName("");
      toast({
        title: "Pasta criada",
        description: "A pasta foi criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a pasta.",
        variant: "destructive",
      });
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from("repository_folders")
        .delete()
        .eq("id", folderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repository_folders", currentFolderId] });
      toast({
        title: "Pasta removida",
        description: "A pasta foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a pasta.",
        variant: "destructive",
      });
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadingFile(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = currentFolderId ? `${currentFolderId}/${fileName}` : `root/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('repository-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('repository-files')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("repository_files").insert({
        folder_id: currentFolderId,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repository_files", currentFolderId] });
      toast({
        title: "Arquivo enviado",
        description: "O arquivo foi enviado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o arquivo.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploadingFile(false);
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase
        .from("repository_files")
        .delete()
        .eq("id", fileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repository_files", currentFolderId] });
      toast({
        title: "Arquivo removido",
        description: "O arquivo foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o arquivo.",
        variant: "destructive",
      });
    },
  });

  const handleFolderClick = async (folder: RepositoryFolder) => {
    setFolderPath([...folderPath, folder]);
    setCurrentFolderId(folder.id);
  };

  const handleNavigateToRoot = () => {
    setCurrentFolderId(null);
    setFolderPath([]);
  };

  const handleNavigateBack = () => {
    if (folderPath.length === 0) return;
    
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  };

  const handleNavigateToFolder = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
    e.target.value = '';
  };

  const handleDownloadFile = async (file: RepositoryFile) => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      window.open(file.file_url, '_blank');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isLoading = loadingFolders || loadingFiles;

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Folder className="h-8 w-8 text-primary" />
            Repositório
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize e armazene seus documentos
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Nova Pasta
          </Button>
          <Button asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {uploadingFile ? "Enviando..." : "Enviar Arquivo"}
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
            </label>
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <Card className="mb-6 border-0 shadow-md">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigateToRoot}
              className="gap-1"
            >
              <Home className="h-4 w-4" />
              Início
            </Button>
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigateToFolder(index)}
                >
                  {folder.name}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Back button */}
      {folderPath.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNavigateBack}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      )}

      {/* Content */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>
            {currentFolderId ? folderPath[folderPath.length - 1]?.name : "Pasta Raiz"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Esta pasta está vazia</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie uma pasta ou envie um arquivo para começar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Folders */}
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <Folder className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{folder.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(folder.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFolderMutation.mutate(folder.id);
                    }}
                    title="Remover pasta"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}

              {/* Files */}
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.file_size)} • {format(new Date(file.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadFile(file)}
                      title="Baixar arquivo"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFileMutation.mutate(file.id)}
                      title="Remover arquivo"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Folder Dialog */}
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Nome da Pasta</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Digite o nome da pasta"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createFolderMutation.mutate()}
              disabled={!newFolderName.trim()}
            >
              Criar Pasta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
