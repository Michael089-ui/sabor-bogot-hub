import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
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
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";
import { OnboardingRedirect } from "./components/OnboardingRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes without MainLayout */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          
          {/* Onboarding route - protected but without MainLayout */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          
          {/* Protected routes with MainLayout */}
          <Route path="/" element={<MainLayout><ProtectedRoute><OnboardingRedirect><Dashboard /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="/dashboard" element={<MainLayout><ProtectedRoute><OnboardingRedirect><Dashboard /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="/chat-ia" element={<MainLayout><ProtectedRoute><OnboardingRedirect><ChatIA /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="/mapa" element={<MainLayout><ProtectedRoute><OnboardingRedirect><Mapa /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="/restaurantes" element={<MainLayout><ProtectedRoute><OnboardingRedirect><Restaurantes /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="/restaurantes/:id" element={<MainLayout><ProtectedRoute><OnboardingRedirect><RestauranteDetalle /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="/favoritos" element={<MainLayout><ProtectedRoute><OnboardingRedirect><Favoritos /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="/resenas" element={<MainLayout><ProtectedRoute><OnboardingRedirect><Resenas /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="/historial/busquedas" element={<MainLayout><ProtectedRoute><OnboardingRedirect><HistorialBusquedas /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="/historial/resultados" element={<MainLayout><ProtectedRoute><OnboardingRedirect><HistorialResultados /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="/perfil" element={<MainLayout><ProtectedRoute><OnboardingRedirect><Perfil /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="/configuracion" element={<MainLayout><ProtectedRoute><OnboardingRedirect><Configuracion /></OnboardingRedirect></ProtectedRoute></MainLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
