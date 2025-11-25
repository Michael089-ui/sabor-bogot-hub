import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ReactNode } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Skeleton } from "@/components/ui/skeleton";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { data: userProfile, isLoading } = useUserProfile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header with trigger */}
          <header className="h-14 border-b border-border bg-card flex items-center px-4 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="ml-4 flex-1">
              <h2 className="text-sm font-medium text-muted-foreground">
                Sabor Capital
              </h2>
            </div>
            
            {/* User name display */}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : userProfile ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">Bienvenido(a),</span>
                  <span className="text-sm font-semibold text-foreground">
                    {userProfile.nombre} {userProfile.apellidos}
                  </span>
                </div>
              ) : null}
            </div>
          </header>
          
          {/* Main content area */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
