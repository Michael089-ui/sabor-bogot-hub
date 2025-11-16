import { Heart, Star, Clock, MapPin, DollarSign, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const RestauranteDetalle = () => {
  const navigate = useNavigate();

  // Mock data
  const restaurant = {
    name: "El Fogón de Doña Rosa",
    description: "Restaurante de cocina tradicional colombiana",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop",
    category: "Cocina Tradicional",
    priceRange: "$$ (COP 20,000 - 50,000)",
    hours: "Lunes a Sábado: 12:00 PM - 10:00 PM",
    address: "Calle 12 # 3-45, Bogotá",
    rating: 4.5,
    reviewCount: 127,
    isFavorite: false
  };

  const menuItems = [
    { name: "Ajiaco Santafereño", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop" },
    { name: "Bandeja Paisa", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop" },
    { name: "Lechona Tolimense", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop" },
  ];

  const reviews = [
    { user: "María G.", rating: 5, comment: "Excelente comida tradicional, el ajiaco es increíble!", date: "Hace 2 días" },
    { user: "Carlos R.", rating: 4, comment: "Muy buen ambiente y atención. Los precios son justos.", date: "Hace 1 semana" },
    { user: "Ana P.", rating: 5, comment: "El mejor restaurante colombiano de la zona!", date: "Hace 2 semanas" },
  ];

  return (
    <div className="min-h-full bg-background">
      {/* Back Button */}
      <div className="border-b border-border bg-card px-6 py-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/restaurantes')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Restaurantes
        </Button>
      </div>

      {/* Hero Image */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-muted">
        <img 
          src={restaurant.image} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {restaurant.name}
              </h1>
              <p className="text-muted-foreground">{restaurant.description}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="gap-2">
                <Heart className="h-5 w-5" />
                Guardar
              </Button>
              <Button size="lg" className="gap-2">
                <MessageSquare className="h-5 w-5" />
                Escribir Reseña
              </Button>
            </div>
          </div>

          {/* Rating Summary */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-5 w-5 ${star <= restaurant.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold text-foreground">{restaurant.rating}</span>
            <span className="text-muted-foreground">({restaurant.reviewCount} reseñas)</span>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-1">
                  <Star className="h-3 w-3" />
                </Badge>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Categoría</p>
                  <p className="font-medium text-foreground">{restaurant.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-1">
                  <DollarSign className="h-3 w-3" />
                </Badge>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rango de precios</p>
                  <p className="font-medium text-foreground">{restaurant.priceRange}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-1">
                  <Clock className="h-3 w-3" />
                </Badge>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Horario</p>
                  <p className="font-medium text-foreground">{restaurant.hours}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-1">
                  <MapPin className="h-3 w-3" />
                </Badge>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dirección</p>
                  <p className="font-medium text-foreground">{restaurant.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Section */}
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="relative h-80 bg-muted rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop"
                alt="Mapa de ubicación"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Badge className="bg-background/90 text-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {restaurant.address}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Menú</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {menuItems.map((item, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Reseñas y Calificaciones</h2>
            <Button variant="outline">Ver todas las reseñas</Button>
          </div>

          {/* Rating Summary Card */}
          <Card className="mb-6 bg-muted/50">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="text-center md:text-left">
                  <div className="text-5xl font-bold text-foreground mb-2">{restaurant.rating}</div>
                  <div className="flex items-center gap-1 mb-2 justify-center md:justify-start">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-5 w-5 ${star <= restaurant.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{restaurant.reviewCount} opiniones</p>
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground mb-4">
                    Basado en {restaurant.reviewCount} reseñas verificadas de clientes que han visitado este restaurante.
                  </p>
                  <Button className="w-full md:w-auto gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Escribir mi reseña
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Reviews */}
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">
                        {review.user.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">{review.user}</h4>
                        <span className="text-sm text-muted-foreground">• {review.date}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`}
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestauranteDetalle;
