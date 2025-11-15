import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat-ia" element={<ChatIA />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/restaurantes" element={<Restaurantes />} />
            <Route path="/restaurantes/:id" element={<RestauranteDetalle />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/resenas" element={<Resenas />} />
            <Route path="/historial/busquedas" element={<HistorialBusquedas />} />
            <Route path="/historial/resultados" element={<HistorialResultados />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/configuracion" element={<Configuracion />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
