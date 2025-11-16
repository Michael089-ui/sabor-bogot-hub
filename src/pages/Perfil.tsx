import { useState } from "react";
import { User, LogOut, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

const Perfil = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("busquedas");

  // Mock data - información del usuario
  const usuario = {
    nombre: "Camila Rodriguez",
    email: "camila.rodriguez@email.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop",
    preferencias: {
      tipoComida: "tradicional",
      presupuesto: "medio",
      ubicacion: "chapinero"
    }
  };

  // Mock data - historial
  const busquedas = [
    "Restaurante La Puerta Falsa",
    "Ajiaco Santafereño",
    "Empanadas de Cambray"
  ];

  const resenas = [
    "El Fogón de Doña Rosa - 5 estrellas",
    "La Puerta Falsa - 4 estrellas",
    "Andrés Carne de Res - 5 estrellas"
  ];

  const favoritos = [
    "Leo Cocina y Cava",
    "Criterion",
    "Harry Sasson"
  ];

  const handleEditProfile = () => {
    // TODO: Abrir modal o navegar a página de edición
    console.log("Editar perfil");
  };

  const handleLogout = () => {
    // TODO: Implementar logout con auth
    console.log("Cerrar sesión");
    navigate('/login');
  };

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Avatar y Datos del Usuario */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-32 w-32 mb-4 border-4 border-primary/10">
            <AvatarImage src={usuario.avatar} alt={usuario.nombre} />
            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
              {usuario.nombre.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {usuario.nombre}
          </h1>
          <p className="text-primary font-medium">
            {usuario.email}
          </p>
        </div>

        {/* Preferencias Gastronómicas */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Mis preferencias gastronómicas
          </h2>
          
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Tipo de comida */}
              <div className="space-y-2">
                <Label htmlFor="tipo-comida" className="text-foreground font-medium">
                  Tipo de comida
                </Label>
                <Select defaultValue={usuario.preferencias.tipoComida}>
                  <SelectTrigger id="tipo-comida">
                    <SelectValue placeholder="Selecciona tipo de comida" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tradicional">Tradicional Colombiana</SelectItem>
                    <SelectItem value="italiana">Italiana</SelectItem>
                    <SelectItem value="asiatica">Asiática</SelectItem>
                    <SelectItem value="mexicana">Mexicana</SelectItem>
                    <SelectItem value="vegetariana">Vegetariana</SelectItem>
                    <SelectItem value="internacional">Internacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Presupuesto */}
              <div className="space-y-2">
                <Label htmlFor="presupuesto" className="text-foreground font-medium">
                  Presupuesto
                </Label>
                <Select defaultValue={usuario.preferencias.presupuesto}>
                  <SelectTrigger id="presupuesto">
                    <SelectValue placeholder="Selecciona presupuesto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economico">$ - Económico</SelectItem>
                    <SelectItem value="medio">$$ - Medio</SelectItem>
                    <SelectItem value="alto">$$$ - Alto</SelectItem>
                    <SelectItem value="premium">$$$$ - Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <Label htmlFor="ubicacion" className="text-foreground font-medium">
                  Ubicación
                </Label>
                <Select defaultValue={usuario.preferencias.ubicacion}>
                  <SelectTrigger id="ubicacion">
                    <SelectValue placeholder="Selecciona ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chapinero">Chapinero</SelectItem>
                    <SelectItem value="usaquen">Usaquén</SelectItem>
                    <SelectItem value="candelaria">La Candelaria</SelectItem>
                    <SelectItem value="zona-rosa">Zona Rosa</SelectItem>
                    <SelectItem value="zona-g">Zona G</SelectItem>
                    <SelectItem value="centro">Centro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Historial
          </h2>
          
          <Card>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="busquedas">Búsquedas</TabsTrigger>
                  <TabsTrigger value="resenas">Reseñas</TabsTrigger>
                  <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
                </TabsList>

                <TabsContent value="busquedas" className="mt-6">
                  <div className="space-y-3">
                    {busquedas.map((busqueda, index) => (
                      <div 
                        key={index}
                        className="py-3 border-b border-border last:border-0 text-foreground hover:text-primary cursor-pointer transition-colors"
                        onClick={() => navigate('/historial-busquedas')}
                      >
                        {busqueda}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="resenas" className="mt-6">
                  <div className="space-y-3">
                    {resenas.map((resena, index) => (
                      <div 
                        key={index}
                        className="py-3 border-b border-border last:border-0 text-foreground hover:text-primary cursor-pointer transition-colors"
                        onClick={() => navigate('/resenas')}
                      >
                        {resena}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="favoritos" className="mt-6">
                  <div className="space-y-3">
                    {favoritos.map((favorito, index) => (
                      <div 
                        key={index}
                        className="py-3 border-b border-border last:border-0 text-foreground hover:text-primary cursor-pointer transition-colors"
                        onClick={() => navigate('/favoritos')}
                      >
                        {favorito}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={handleEditProfile}
          >
            <Edit className="h-4 w-4" />
            Editar perfil
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1 gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Perfil;

