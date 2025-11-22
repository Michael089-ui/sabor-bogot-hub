import { Heart, Star, Clock, MapPin, DollarSign, MessageSquare, ArrowLeft, Loader2, ExternalLink, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "react-router-dom";
import { useRestaurantDetail, getPhotoUrl, formatPriceLevel } from "@/hooks/useRestaurants";

const RestauranteDetalle = () => {
  const navigate = useNavigate();
  const { id: placeId } = useParams<{ id: string }>();
  const { data: restaurant, isLoading, error } = useRestaurantDetail(placeId);

  if (isLoading) {
    return (
      <div className="min-h-full bg-background">
        <div className="border-b border-border bg-card px-6 py-4">
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-64 md:h-80 w-full" />
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Restaurante no encontrado
          </h2>
          <p className="text-muted-foreground mb-4">
            No pudimos encontrar los detalles de este restaurante.
          </p>
          <Button onClick={() => navigate("/restaurantes")}>
            Volver a Restaurantes
          </Button>
        </div>
      </div>
    );
  }

  // Obtener foto principal
  const mainPhoto = restaurant.photos && restaurant.photos.length > 0
    ? getPhotoUrl(restaurant.photos[0], 800)
    : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop";

  // Obtener fotos adicionales para el menú (si hay más de una foto)
  const additionalPhotos = restaurant.photos && restaurant.photos.length > 1
    ? restaurant.photos.slice(1, 4).map((photo: string) => getPhotoUrl(photo, 400))
    : [];

  // Formatear tipos de comida
  const categories = restaurant.types && restaurant.types.length > 0
    ? restaurant.types.slice(0, 3).map(type => type.replace(/_/g, " "))
    : ["Restaurante"];

  // Formatear horario
  const openingHoursText = restaurant.opening_hours && restaurant.opening_hours.weekday_text
    ? restaurant.opening_hours.weekday_text
    : null;

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
          src={mainPhoto} 
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
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {restaurant.name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-2">
                {categories.map((category, i) => (
                  <Badge key={i} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
              {restaurant.neighborhood && (
                <p className="text-muted-foreground">{restaurant.neighborhood}</p>
              )}
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
          {restaurant.rating && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-5 w-5 ${star <= Math.round(restaurant.rating!) ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-foreground">{restaurant.rating.toFixed(1)}</span>
              {restaurant.user_ratings_total && (
                <span className="text-muted-foreground">({restaurant.user_ratings_total} reseñas)</span>
              )}
            </div>
          )}
        </div>

        {/* Information Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-1">
                  <DollarSign className="h-3 w-3" />
                </Badge>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Precio</p>
                  <p className="font-medium text-foreground">{formatPriceLevel(restaurant.price_level)}</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Estado</p>
                  <p className="font-medium text-foreground">
                    {restaurant.open_now ? (
                      <span className="text-green-600">Abierto ahora</span>
                    ) : restaurant.open_now === false ? (
                      <span className="text-red-600">Cerrado</span>
                    ) : (
                      "No disponible"
                    )}
                  </p>
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
                  <p className="font-medium text-foreground text-sm line-clamp-2">
                    {restaurant.formatted_address || "No disponible"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {restaurant.phone_number && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">
                    <Phone className="h-3 w-3" />
                  </Badge>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Teléfono</p>
                    <a 
                      href={`tel:${restaurant.phone_number}`}
                      className="font-medium text-foreground hover:text-primary text-sm"
                    >
                      {restaurant.phone_number}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Info */}
        {restaurant.website && (
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2"
                >
                  Visitar sitio web
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Opening Hours */}
        {openingHoursText && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horario
              </h2>
              <div className="space-y-2">
                {openingHoursText.map((text: string, i: number) => (
                  <p key={i} className="text-sm text-muted-foreground">{text}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Section */}
        {restaurant.location && (
          <Card className="mb-8">
            <CardContent className="p-0">
              <div className="relative h-80 bg-muted rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAeFBja7x7CYXTHfZC1D8sZ8RI0RfRLwac&q=place_id:${restaurant.place_id}`}
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gallery Section */}
        {additionalPhotos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Galería</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {additionalPhotos.map((photoUrl, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={photoUrl}
                      alt={`${restaurant.name} foto ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section - From Google */}
        {restaurant.rating && restaurant.user_ratings_total && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Reseñas de Google</h2>
              <Button variant="outline" asChild>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${restaurant.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  Ver en Google Maps
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="text-center md:text-left">
                    <div className="text-5xl font-bold text-foreground mb-2">
                      {restaurant.rating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1 mb-2 justify-center md:justify-start">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-5 w-5 ${star <= Math.round(restaurant.rating!) ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {restaurant.user_ratings_total} opiniones en Google
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground mb-4">
                      Esta calificación proviene de reseñas verificadas de Google Maps.
                      Visita Google Maps para ver todas las reseñas y escribir la tuya.
                    </p>
                    <Button className="w-full md:w-auto gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Escribir reseña en Sabor Capital
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestauranteDetalle;
