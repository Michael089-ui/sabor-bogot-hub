import { Heart, Star, Clock, MapPin, DollarSign, MessageSquare, ArrowLeft, Loader2, ExternalLink, Phone, Globe, AlertCircle, BarChart3, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate, useParams } from "react-router-dom";
import { useRestaurantDetail, getPhotoUrl, getPriceInfo, formatCurrency } from "@/hooks/useRestaurants";
import { useRestaurantReviews, useCreateReview } from "@/hooks/useReviews";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { useState, useEffect } from "react";
import { GoogleReview } from "@/lib/types";
import { ReviewModal } from "@/components/ReviewModal";

const RestauranteDetalle = () => {
  const navigate = useNavigate();
  const { id: placeId } = useParams<{ id: string }>();
  const { data: restaurant, isLoading, error } = useRestaurantDetail(placeId);
  const { data: communityReviews } = useRestaurantReviews(placeId);
  const createReview = useCreateReview();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  // Obtener información de precio
  const priceInfo = getPriceInfo(restaurant);

  // Google reviews
  const googleReviews: GoogleReview[] = restaurant.reviews || [];

  // Calcular promedio de reseñas de la comunidad
  const communityAvgRating = communityReviews && communityReviews.length > 0
    ? communityReviews.reduce((sum, r) => sum + (r.calificacion || 0), 0) / communityReviews.length
    : 0;

  const handleCreateReview = (data: { calificacion: number; comentario: string }) => {
    if (!placeId) return;
    createReview.mutate(
      { place_id: placeId, calificacion: data.calificacion, comentario: data.comentario },
      { onSuccess: () => setShowReviewModal(false) }
    );
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  };

  const goToPrevious = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : additionalPhotos.length - 1));
  };

  const goToNext = () => {
    setSelectedImageIndex((prev) => (prev < additionalPhotos.length - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageModalOpen) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        setIsImageModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, additionalPhotos.length]);

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
            <div className="flex flex-wrap gap-3">
              <Button 
                variant={isFavorite(placeId || '') ? "default" : "outline"} 
                size="lg" 
                className="gap-2"
                onClick={() => placeId && toggleFavorite(placeId)}
              >
                <Heart className={`h-5 w-5 ${isFavorite(placeId || '') ? 'fill-current' : ''}`} />
                {isFavorite(placeId || '') ? 'Guardado' : 'Guardar'}
              </Button>
              <Button size="lg" className="gap-2" onClick={() => setShowReviewModal(true)}>
                <MessageSquare className="h-5 w-5" />
                Escribir Reseña
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={() => navigate(`/restaurantes/${placeId}/estadisticas`)}
              >
                <BarChart3 className="h-5 w-5" />
                Estadísticas
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
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Precio</p>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {priceInfo.symbols} ({priceInfo.label})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {priceInfo.range}
                    </p>
                    {restaurant.min_price && restaurant.max_price && (
                      <p className="text-xs text-muted-foreground">
                        Promedio: {formatCurrency(priceInfo.avgPrice)}/persona
                      </p>
                    )}
                  </div>
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

        {/* Description */}
        {restaurant.description && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Acerca de {restaurant.name}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {restaurant.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Map Section */}
        {restaurant.location && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación
              </h2>
              
              <div className="relative h-80 bg-muted rounded-lg overflow-hidden mb-4">
                {restaurant.location?.lat && restaurant.location?.lng ? (
                  <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '320px' }}
                      center={{ lat: restaurant.location.lat, lng: restaurant.location.lng }}
                      zoom={16}
                      onLoad={(mapInstance) => setMap(mapInstance)}
                      options={{
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                      }}
                    >
                      <Marker
                        position={{ lat: restaurant.location.lat, lng: restaurant.location.lng }}
                        onClick={() => setShowInfoWindow(true)}
                        title={restaurant.name}
                      />
                      
                      {showInfoWindow && (
                        <InfoWindow
                          position={{ lat: restaurant.location.lat, lng: restaurant.location.lng }}
                          onCloseClick={() => setShowInfoWindow(false)}
                        >
                          <div className="p-2">
                            <h3 className="font-semibold text-sm">{restaurant.name}</h3>
                            <p className="text-xs text-muted-foreground">{restaurant.formatted_address}</p>
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </LoadScript>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <div className="text-center p-6">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        Mapa no disponible
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Fallback - Botón para abrir en Google Maps */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.formatted_address || restaurant.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir en Google Maps
                  </a>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.formatted_address || restaurant.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-4 w-4" />
                    Cómo llegar
                  </a>
                </Button>
              </div>

              {/* Nota sobre disponibilidad del mapa */}
              <div className="mt-4 p-3 bg-muted rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Si el mapa no se visualiza correctamente, puedes usar los botones de arriba para ver la ubicación directamente en Google Maps.
                </p>
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
                <div 
                  key={index}
                  className="relative h-64 overflow-hidden rounded-lg bg-muted cursor-pointer group"
                  onClick={() => openImageModal(index)}
                >
                  <img 
                    src={photoUrl} 
                    alt={`${restaurant.name} - foto ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Zoom Modal */}
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
            <div className="relative flex items-center justify-center min-h-[80vh]">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => setIsImageModalOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Previous Button */}
              {additionalPhotos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {/* Image */}
              <img
                src={additionalPhotos[selectedImageIndex]}
                alt={`${restaurant.name} - foto ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain"
              />

              {/* Next Button */}
              {additionalPhotos.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Image Counter */}
              {additionalPhotos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                  {selectedImageIndex + 1} de {additionalPhotos.length}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Reviews Section - Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="google" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="google">
                Reseñas de Google ({restaurant.user_ratings_total || 0})
              </TabsTrigger>
              <TabsTrigger value="community">
                Reseñas de la Comunidad ({communityReviews?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Google Reviews Tab */}
            <TabsContent value="google" className="mt-6">
              <div className="space-y-6">
                {/* Calificación Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-foreground">Calificación</h2>
                    <Button variant="outline" size="sm" asChild>
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

                  {restaurant.rating ? (
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
                              {restaurant.user_ratings_total?.toLocaleString('es-CO')} opiniones en Google
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-muted-foreground">
                              Esta calificación proviene de reseñas verificadas de Google Maps.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-muted-foreground text-center">
                          No hay calificación disponible para este restaurante
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Reseñas Individuales Section */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Reseñas</h3>
                  {googleReviews.length > 0 ? (
                    <div className="space-y-4">
                      {googleReviews.slice(0, 5).map((review, index) => (
                        <Card key={index}>
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              {review.author_photo && (
                                <img 
                                  src={review.author_photo} 
                                  alt={review.author_name}
                                  className="w-10 h-10 rounded-full"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-semibold">{review.author_name}</p>
                                  {review.relative_time && (
                                    <span className="text-xs text-muted-foreground">
                                      • {review.relative_time}
                                    </span>
                                  )}
                                </div>
                                {review.rating && (
                                  <div className="flex items-center gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={`h-4 w-4 ${star <= review.rating! ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`}
                                      />
                                    ))}
                                  </div>
                                )}
                                <p className="text-muted-foreground">{review.text}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {restaurant.user_ratings_total && restaurant.user_ratings_total > 5 && (
                        <Card className="bg-muted/20">
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              Mostrando {Math.min(5, googleReviews.length)} de {restaurant.user_ratings_total.toLocaleString('es-CO')} reseñas.{" "}
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${restaurant.place_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Ver todas en Google Maps
                              </a>
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card className="bg-muted/20">
                      <CardContent className="p-8 text-center">
                        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-2">
                          Las reseñas individuales no están disponibles en este momento
                        </p>
                        {restaurant.user_ratings_total && restaurant.user_ratings_total > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Aunque este restaurante tiene {restaurant.user_ratings_total.toLocaleString('es-CO')} opiniones en Google,{" "}
                            el detalle de las reseñas no está disponible temporalmente.{" "}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${restaurant.place_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Ver en Google Maps
                            </a>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Community Reviews Tab */}
            <TabsContent value="community" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Reseñas de la Comunidad</h2>
                  <Button size="sm" onClick={() => setShowReviewModal(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Escribir Reseña
                  </Button>
                </div>

                {communityAvgRating > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-foreground mb-2">
                            {communityAvgRating.toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-5 w-5 ${star <= Math.round(communityAvgRating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {communityReviews?.length} reseñas
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Display Community Reviews */}
                {communityReviews && communityReviews.length > 0 ? (
                  <div className="space-y-4">
                    {communityReviews.map((review) => (
                      <Card key={review.id_resena}>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">Usuario</Badge>
                            {review.fecha_resena && (
                              <span className="text-xs text-muted-foreground">
                                • {new Date(review.fecha_resena).toLocaleDateString('es-CO')}
                              </span>
                            )}
                          </div>
                          {review.calificacion && (
                            <div className="flex items-center gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-4 w-4 ${star <= review.calificacion! ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`}
                                />
                              ))}
                            </div>
                          )}
                          <p className="text-muted-foreground">{review.comentario}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Sé el primero en reseñar
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Comparte tu experiencia en este restaurante
                      </p>
                      <Button onClick={() => setShowReviewModal(true)}>
                        Escribir Reseña
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Review Modal */}
        {placeId && (
          <ReviewModal
            open={showReviewModal}
            onOpenChange={setShowReviewModal}
            restaurantName={restaurant.name}
            placeId={placeId}
            onSubmit={handleCreateReview}
            isLoading={createReview.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default RestauranteDetalle;
