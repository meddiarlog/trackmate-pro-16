import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Users, 
  Package, 
  ClipboardList, 
  TrendingUp, 
  MapPin,
  Plus,
  Calendar,
  DollarSign
} from "lucide-react";

export default function Dashboard() {
  // Mock data for demonstration
  const stats = [
    {
      title: "Fretes Ativos",
      value: "24",
      change: "+12%",
      icon: ClipboardList,
      color: "text-primary"
    },
    {
      title: "Veículos Disponíveis",
      value: "8",
      change: "+2",
      icon: Truck,
      color: "text-success"
    },
    {
      title: "Motoristas Ativos",
      value: "15",
      change: "+3",
      icon: Users,
      color: "text-warning"
    },
    {
      title: "Receita Mensal",
      value: "R$ 45.800",
      change: "+18%",
      icon: DollarSign,
      color: "text-primary"
    }
  ];

  const recentFreights = [
    {
      id: "FR001",
      origin: "São Paulo - SP",
      destination: "Rio de Janeiro - RJ",
      status: "Em Trânsito",
      driver: "João Silva",
      vehicle: "ABC-1234",
      value: "R$ 2.800"
    },
    {
      id: "FR002",
      origin: "Belo Horizonte - MG",
      destination: "Salvador - BA",
      status: "Pendente",
      driver: "Maria Santos",
      vehicle: "DEF-5678",
      value: "R$ 3.200"
    },
    {
      id: "FR003",
      origin: "Porto Alegre - RS",
      destination: "Curitiba - PR",
      status: "Entregue",
      driver: "Carlos Lima",
      vehicle: "GHI-9012",
      value: "R$ 1.950"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Em Trânsito":
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Em Trânsito</Badge>;
      case "Pendente":
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Pendente</Badge>;
      case "Entregue":
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Entregue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das suas operações de frete
          </p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Relatórios
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Frete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-md bg-gradient-to-br from-card to-secondary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={cn("h-5 w-5", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">{stat.change}</span>
                  <span className="text-xs text-muted-foreground">vs mês anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Freights */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Fretes Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFreights.map((freight) => (
                <div key={freight.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm text-foreground">#{freight.id}</span>
                      {getStatusBadge(freight.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="h-3 w-3" />
                      {freight.origin} → {freight.destination}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {freight.driver} • {freight.vehicle}
                    </div>
                  </div>
                  <div className="text-right mt-3 sm:mt-0">
                    <div className="font-semibold text-foreground">{freight.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-3" variant="outline">
              <Plus className="h-4 w-4" />
              Cadastrar Veículo
            </Button>
            <Button className="w-full justify-start gap-3" variant="outline">
              <Users className="h-4 w-4" />
              Cadastrar Motorista
            </Button>
            <Button className="w-full justify-start gap-3" variant="outline">
              <Package className="h-4 w-4" />
              Cadastrar Produto
            </Button>
            <Button className="w-full justify-start gap-3" variant="outline">
              <MapPin className="h-4 w-4" />
              Cadastrar Cliente
            </Button>
            <Button className="w-full justify-start gap-3">
              <ClipboardList className="h-4 w-4" />
              Novo Frete
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}