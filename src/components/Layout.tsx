import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Truck, 
  Users, 
  MapPin, 
  Package, 
  ClipboardList, 
  UserCircle, 
  Settings, 
  Menu,
  Home,
  FileText,
  DollarSign,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/vehicles", label: "Veículos", icon: Truck },
  { href: "/drivers", label: "Motoristas", icon: UserCircle },
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/freights", label: "Fretes", icon: ClipboardList },
  { href: "/contracts", label: "Contratos", icon: FileText },
  { href: "/financial", label: "Financeiro", icon: DollarSign },
  { href: "/credit-control", label: "Controle de Crédito", icon: CreditCard },
  { href: "/locations", label: "Localizações", icon: MapPin },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn("flex", mobile ? "flex-col space-y-2" : "hidden lg:flex space-x-1")}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => mobile && setIsMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className={mobile ? "block" : "hidden xl:block"}>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-lg">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground">Mutlog</h1>
                <p className="text-xs text-muted-foreground">Sistema de Gestão de Fretes</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <NavItems />

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-6">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-lg">
                    <Truck className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground">Mutlog</h1>
                    <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
                  </div>
                </div>
                <NavItems mobile />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}