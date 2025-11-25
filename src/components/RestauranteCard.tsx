import { useState, useEffect, useRef } from "react";
import { Star, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPriceInfo, getPhotoUrl } from "@/hooks/useRestaurants";

interface Restaurant {
  id: string;
  place_id: string;
  name: string;
  formatted_address: string | null;
  neighborhood: string | null;
  rating: number | null;
  user_ratings_total: number | null;
  price_level: string | null;
  photos: any;
  location: any;
  types: string[] | null;
  open_now: boolean | null;
  opening_hours: any;
  phone_number: string | null;
  website: string | null;
  min_price?: number | null;
  max_price?: number | null;
  currency?: string | null;
  description?: string | null;
  cuisine?: string | null;
}

interface RestauranteCardProps {
  restaurant: Restaurant;
  onClick?: () => void;
}

export function RestauranteCard({ restaurant, onClick }: RestauranteCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  
  const priceInfo = getPriceInfo(restaurant);
  const imageUrl = restaurant.photos && restaurant.photos.length > 0
    ? getPhotoUrl(restaurant.photos[0], 400) 
    : `https://source.unsplash.com/400x300/?restaurant,food,${encodeURIComponent(restaurant.cuisine || 'dining')}`;

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Cargar 50px antes de que sea visible
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer min-w-[280px]"
      onClick={onClick}
    >
      <div 
        ref={imgRef}
        className="relative h-40 overflow-hidden bg-muted"
      >
        {!isInView ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <>
            {!isLoaded && <Skeleton className="w-full h-full absolute inset-0" />}
            <img 
              src={imageUrl}
              alt={restaurant.name}
              className={`w-full h-full object-cover hover:scale-105 transition-all duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setIsLoaded(true)}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400';
              }}
              loading="lazy"
            />
          </>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{restaurant.name}</h3>
        
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          <span className="font-medium text-foreground text-sm">{restaurant.rating?.toFixed(1) || 'N/A'}</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{priceInfo.symbols}</span>
            <span className="text-muted-foreground text-xs">({priceInfo.label})</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {priceInfo.range} por persona
          </p>
        </div>
        
        {restaurant.cuisine && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {restaurant.cuisine.split('/')[0].trim()}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
