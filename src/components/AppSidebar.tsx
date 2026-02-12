import { ChevronDown, Home, Users, Truck, Package, FileText, DollarSign, BarChart3, Folder, Settings, User, HelpCircle, LogOut, UserCircle, Building2, MapPin, ClipboardList, CreditCard, Receipt, FileCheck, Calculator, Archive, Briefcase, Shield, Wallet, FolderOpen } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Cadastro",
    icon: Users,
    items: [
      { title: "Clientes", url: "/customers", icon: Users },
      { title: "Grupos", url: "/groups", icon: FolderOpen },
      {
        title: "Mot. / Veículo",
        icon: Truck,
        items: [
          { title: "Motoristas", url: "/drivers", icon: UserCircle },
          { title: "Veículos", url: "/vehicles", icon: Truck },
          { title: "Tipo de Veículo", url: "/vehicle-types", icon: Truck },
          { title: "Carroceria", url: "/body-types", icon: Package },
        ],
      },
      { title: "Proprietário de Veículos", url: "/vehicle-owners", icon: Building2 },
      { title: "Fornecedores", url: "/suppliers", icon: Briefcase },
      { title: "Produtos", url: "/products", icon: Package },
    ],
  },
  {
    title: "Serviços",
    icon: ClipboardList,
    items: [
      {
        title: "Frete",
        icon: Package,
        items: [
          { title: "Contratar", url: "/freights", icon: Package },
          { title: "Ordem de Coleta", url: "/collection-orders", icon: MapPin },
          { title: "CTE", url: "/cte", icon: FileText },
          { title: "Contrato", url: "/contracts", icon: FileText },
          { title: "MDF-e", url: "/mdfe", icon: FileCheck },
        ],
      },
      { title: "Cotação", url: "/quotes", icon: Calculator },
    ],
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    items: [
      { title: "Controle de Caixa", url: "/cash-boxes", icon: Wallet },
      { title: "Contas a Pagar", url: "/accounts-payable", icon: Receipt },
      { title: "Contas a Receber", url: "/accounts-receivable", icon: DollarSign },
      { title: "Cobranças", url: "/cobrancas", icon: FileText },
      { title: "Controle de Crédito", url: "/credit-control", icon: CreditCard },
    ],
  },
  {
    title: "Relatórios",
    icon: BarChart3,
    items: [
      { title: "Clientes", url: "/reports/customers", icon: Users },
      { title: "Controle de Crédito", url: "/reports/credit-control", icon: CreditCard },
      { title: "Cobranças", url: "/reports/cobrancas", icon: FileText },
      { title: "Cotação", url: "/reports/quotes", icon: Calculator },
      { title: "Fornecedores", url: "/reports/suppliers", icon: Briefcase },
      { title: "Contas a Pagar", url: "/reports/accounts-payable", icon: Receipt },
      { title: "Contas a Receber", url: "/reports/accounts-receivable", icon: DollarSign },
      { title: "Despesa x Receita", url: "/reports/profit-loss", icon: BarChart3 },
      { title: "Ordens de Coleta", url: "/reports/collection-orders", icon: ClipboardList },
      { title: "Produtos", url: "/reports/products", icon: Package },
    ],
  },
  {
    title: "Repositório",
    url: "/repository",
    icon: Folder,
  },
  {
    title: "Configurações",
    icon: Settings,
    items: [
      { title: "Dados da Empresa", url: "/settings/company", icon: Building2 },
      { title: "Unidades", url: "/settings/units", icon: Building2 },
      {
        title: "Banco",
        icon: Wallet,
        items: [
          { title: "Forma de Pagamento", url: "/settings/payment-methods", icon: CreditCard },
        ],
      },
    ],
  },
  {
    title: "Minha Conta",
    url: "/account",
    icon: User,
  },
  {
    title: "Gestão de Acessos",
    icon: Shield,
    items: [
      { title: "Usuários", url: "/access/users", icon: Users },
      { title: "Grupo de Usuários", url: "/access/user-groups", icon: Users },
      { title: "Permissões", url: "/access/permissions", icon: Shield },
    ],
  },
  {
    title: "Ajuda",
    url: "/help",
    icon: HelpCircle,
  },
];

const MenuItem = ({ item, level = 0 }: { item: any; level?: number }) => {
  const location = useLocation();
  const { open: sidebarOpen } = useSidebar();
  const isActive = location.pathname === item.url;
  
  if (item.items) {
    const hasActiveChild = item.items.some((child: any) => 
      child.url === location.pathname || 
      (child.items && child.items.some((subChild: any) => subChild.url === location.pathname))
    );
    
    return (
      <Collapsible defaultOpen={hasActiveChild} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              className={cn(
                "w-full",
                level > 0 && "pl-8"
              )}
            >
              <item.icon className="h-4 w-4" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left">{item.title}</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </>
              )}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((subItem: any) => (
                <SidebarMenuSubItem key={subItem.title}>
                  {subItem.items ? (
                    <MenuItem item={subItem} level={level + 1} />
                  ) : (
                    <SidebarMenuSubButton asChild>
                      <NavLink
                        to={subItem.url}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 w-full",
                            isActive && "bg-secondary text-secondary-foreground font-medium"
                          )
                        }
                      >
                        <subItem.icon className="h-4 w-4" />
                        {sidebarOpen && (
                          <>
                            <span className="flex-1">{subItem.title}</span>
                            {subItem.badge && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                {subItem.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuSubButton>
                  )}
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
        <NavLink
          to={item.url}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 w-full",
              isActive && "bg-secondary text-secondary-foreground font-medium"
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {sidebarOpen && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const LogoutMenuItem = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { open: sidebarOpen } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        tooltip="Sair" 
        onClick={handleLogout}
        className="flex items-center gap-3 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        {sidebarOpen && <span>Sair</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={cn("h-12 flex items-center px-4", !open && "justify-center")}>
            <Truck className="h-6 w-6" />
            {open && <span className="ml-3 text-lg font-bold">Mutlog</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <MenuItem key={item.title} item={item} />
              ))}
              <LogoutMenuItem />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
