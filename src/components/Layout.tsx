import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import logoMutlog from "@/assets/LogoMutlog.png";

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-6">
              <SidebarTrigger className="shrink-0" />
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <img src={logoMutlog} alt="Mutlog" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-foreground truncate">Mutlog</h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden xs:block">Sistema de Gestão de Fretes</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-x-hidden">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}