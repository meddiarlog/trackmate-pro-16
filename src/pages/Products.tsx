import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Plus, Search, Edit, Trash2, Box, Weight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  packagingType: string;
  unit: string;
  weight: string;
  dimensions: string;
  specialHandling: boolean;
  hazardous: boolean;
}

const categories = [
  "Alimentos",
  "Bebidas",
  "Eletrônicos",
  "Eletrodomésticos",
  "Móveis",
  "Têxtil",
  "Químicos",
  "Farmacêuticos",
  "Automotivo",
  "Materiais de Construção",
  "Outros"
];

const packagingTypes = [
  "Caixa de Papelão",
  "Pallet",
  "Container",
  "Saco",
  "Tambor",
  "Big Bag",
  "Fardo",
  "Granel",
  "Bobina",
  "Outros"
];

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Refrigerante 2L",
      description: "Refrigerante de cola em garrafa PET 2L",
      category: "Bebidas",
      packagingType: "Caixa de Papelão",
      unit: "Caixa c/ 6 unidades",
      weight: "12 kg",
      dimensions: "40x30x25 cm",
      specialHandling: false,
      hazardous: false
    },
    {
      id: "2",
      name: "Smartphone Premium",
      description: "Smartphone tela 6.5'' 128GB",
      category: "Eletrônicos",
      packagingType: "Caixa de Papelão",
      unit: "Unidade",
      weight: "0.5 kg",
      dimensions: "20x15x5 cm",
      specialHandling: true,
      hazardous: false
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    packagingType: "",
    unit: "",
    weight: "",
    dimensions: "",
    specialHandling: false,
    hazardous: false
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...editingProduct, ...formData } : p
      ));
      toast({
        title: "Produto atualizado",
        description: "As informações do produto foram atualizadas com sucesso.",
      });
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        ...formData
      };
      setProducts([...products, newProduct]);
      toast({
        title: "Produto cadastrado",
        description: "Novo produto foi adicionado ao sistema.",
      });
    }

    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      category: "",
      packagingType: "",
      unit: "",
      weight: "",
      dimensions: "",
      specialHandling: false,
      hazardous: false
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast({
      title: "Produto removido",
      description: "O produto foi removido do sistema.",
      variant: "destructive",
    });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Gestão de Produtos
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre produtos para facilitar o registro de fretes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 mt-4 sm:mt-0">
              <Plus className="h-4 w-4" />
              Cadastrar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Cadastrar Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Refrigerante 2L"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição detalhada do produto"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Selecione a categoria</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packagingType">Tipo de Embalagem *</Label>
                  <select
                    id="packagingType"
                    value={formData.packagingType}
                    onChange={(e) => setFormData({...formData, packagingType: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Selecione a embalagem</option>
                    {packagingTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade de Medida *</Label>
                  <Input
                    id="unit"
                    placeholder="Ex: Caixa, Unidade, Kg"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso por Unidade</Label>
                  <Input
                    id="weight"
                    placeholder="Ex: 12 kg"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensões (C x L x A)</Label>
                <Input
                  id="dimensions"
                  placeholder="Ex: 40x30x25 cm"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="specialHandling"
                    checked={formData.specialHandling}
                    onChange={(e) => setFormData({...formData, specialHandling: e.target.checked})}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <Label htmlFor="specialHandling">Requer manuseio especial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hazardous"
                    checked={formData.hazardous}
                    onChange={(e) => setFormData({...formData, hazardous: e.target.checked})}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <Label htmlFor="hazardous">Produto perigoso</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? "Atualizar" : "Cadastrar"}
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
              placeholder="Buscar por nome, categoria ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
                <Badge variant="outline">{product.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.description && (
                <p className="text-sm text-muted-foreground">{product.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Embalagem:</span>
                  <span className="text-sm font-medium">{product.packagingType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Unidade:</span>
                  <span className="text-sm font-medium">{product.unit}</span>
                </div>
                {product.weight && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Peso:</span>
                    <span className="text-sm font-medium">{product.weight}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Dimensões:</span>
                    <span className="text-sm font-medium">{product.dimensions}</span>
                  </div>
                )}
              </div>

              {(product.specialHandling || product.hazardous) && (
                <div className="flex gap-2 pt-2">
                  {product.specialHandling && (
                    <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">
                      Manuseio Especial
                    </Badge>
                  )}
                  {product.hazardous && (
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                      Perigoso
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(product)}
                  className="flex-1 gap-2"
                >
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(product.id)}
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

      {filteredProducts.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Tente ajustar os filtros de busca." : "Comece cadastrando seu primeiro produto."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}