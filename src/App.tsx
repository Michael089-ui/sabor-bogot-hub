import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import RecuperarContrasena from "./pages/RecuperarContrasena";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ChatIA from "./pages/ChatIA";
import Mapa from "./pages/Mapa";
import Restaurantes from "./pages/Restaurantes";
import RestauranteDetalle from "./pages/RestauranteDetalle";
import Favoritos from "./pages/Favoritos";
import Resenas from "./pages/Resenas";
import HistorialBusquedas from "./pages/HistorialBusquedas";
import HistorialResultados from "./pages/HistorialResultados";
import Perfil from "./pages/Perfil";
import PerfilDebug from "./pages/PerfilDebug";
import PerfilSimplificadoV2 from "./pages/PerfilSimplificadoV2";
import Configuracion from "./pages/Configuracion";
import ImportRestaurants from "./pages/ImportRestaurants";
import NotFound from "./pages/NotFound";
import { OnboardingRedirect } from "./components/OnboardingRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/import" element={<ImportRestaurants />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* TODAS las rutas sin OnboardingRedirect */}
          <Route path="/" element={<MainLayout><ProtectedRoute><Dashboard /></ProtectedRoute></MainLayout>} />
          <Route path="/dashboard" element={<MainLayout><ProtectedRoute><Dashboard /></ProtectedRoute></MainLayout>} />
          <Route path="/chat-ia" element={<MainLayout><ProtectedRoute><ChatIA /></ProtectedRoute></MainLayout>} />
          <Route path="/mapa" element={<MainLayout><ProtectedRoute><Mapa /></ProtectedRoute></MainLayout>} />
          <Route path="/restaurantes" element={<MainLayout><ProtectedRoute><Restaurantes /></ProtectedRoute></MainLayout>} />
          <Route path="/restaurantes/:id" element={<MainLayout><ProtectedRoute><RestauranteDetalle /></ProtectedRoute></MainLayout>} />
          <Route path="/favoritos" element={<MainLayout><ProtectedRoute><Favoritos /></ProtectedRoute></MainLayout>} />
          <Route path="/resenas" element={<MainLayout><ProtectedRoute><Resenas /></ProtectedRoute></MainLayout>} />
          <Route path="/historial/busquedas" element={<MainLayout><ProtectedRoute><HistorialBusquedas /></ProtectedRoute></MainLayout>} />
          <Route path="/historial/resultados" element={<MainLayout><ProtectedRoute><HistorialResultados /></ProtectedRoute></MainLayout>} />
          <Route path="/perfil" element={<MainLayout><ProtectedRoute><Perfil /></ProtectedRoute></MainLayout>} />
          <Route path="/configuracion" element={<MainLayout><ProtectedRoute><Configuracion /></ProtectedRoute></MainLayout>} />
          {/* <Route path="/perfil-debug" element={<ProtectedRoute><PerfilDebug /></ProtectedRoute>} />
          <Route path="/perfil" element={<MainLayout><ProtectedRoute><PerfilSimplificadoV2 /></ProtectedRoute></MainLayout>} /> */}
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
