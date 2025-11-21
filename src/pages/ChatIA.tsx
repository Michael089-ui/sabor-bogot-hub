import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Sparkles, MapPin, ExternalLink, Plus, Minus, Navigation, Star, Clock, DollarSign } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { useToast } from "@/hooks/use-toast";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const GOOGLE_MAPS_API_KEY = "AIzaSyBer6JXdqunENnx3lqiLAszzqqREO8nGY0";

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: 4.6533,
  lng: -74.0836
};

// Íconos SVG codificados
const restaurantIcon = {
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="10" fill="hsl(12, 88%, 58%)" stroke="white" stroke-width="3"/>
    </svg>
  `)}`
};

const userLocationIcon = {
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="8" fill="hsl(142, 48%, 45%)" stroke="white" stroke-width="4"/>
    </svg>
  `)}`
};

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Restaurant {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  type?: string;
  price?: string;
  rating?: number;
  description?: string;
  image?: string;
  openingHours?: string | string[];
  phone?: string;
  website?: string;
  openNow?: boolean;
  userRatingsTotal?: number;
  placeId?: string;
}

const ChatIA = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! 👋 Soy Sabor Capital, tu experto en restaurantes de Bogotá 🍽️✨\n\n¿Qué tipo de comida te apetece hoy? Puedo recomendarte lugares increíbles con toda la información que necesitas, incluyendo ubicación exacta 📍",
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const quickSuggestions = [
    "🍴 Restaurantes románticos en Bogotá",
    "💰 Comida económica cerca del centro",
    "🥗 Opciones vegetarianas/veganas",
    "🇨🇴 Comida colombiana tradicional",
    "🌮 Lugares para desayuno bogotano",
    "🏙️ Rooftops con vista a la ciudad",
    "👨‍👩‍👧‍👦 Restaurantes familiares",
    "💼 Restaurantes para reuniones de negocio",
  ];

  const restaurantImages = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop"
  ];

  // Base de datos de coordenadas reales de Bogotá por barrio
  const neighborhoodCoordinates = {
    "usaquén": { lat: 4.6932, lng: -74.0337 },
    "chapinero": { lat: 4.6482, lng: -74.0632 },
    "zona g": { lat: 4.6568, lng: -74.0594 },
    "parque 93": { lat: 4.6750, lng: -74.0520 },
    "zona t": { lat: 4.6662, lng: -74.0551 },
    "la candelaria": { lat: 4.5970, lng: -74.0715 },
    "kennedy": { lat: 4.6122, lng: -74.1389 },
    "bosa": { lat: 4.6230, lng: -74.1850 },
    "suba": { lat: 4.7420, lng: -74.0830 },
    "engativá": { lat: 4.6980, lng: -74.1120 },
    "fontibón": { lat: 4.6810, lng: -74.1420 },
    "barrios unidos": { lat: 4.6820, lng: -74.0920 },
    "teusaquillo": { lat: 4.6360, lng: -74.0780 },
    "los mártires": { lat: 4.6050, lng: -74.0900 },
    "antonio nariño": { lat: 4.5950, lng: -74.1050 },
    "puente aranda": { lat: 4.6150, lng: -74.1150 },
    "ciudad bolívar": { lat: 4.5600, lng: -74.1500 },
    "san cristóbal": { lat: 4.5700, lng: -74.0850 },
    "usme": { lat: 4.5400, lng: -74.1100 },
    "tunjuelito": { lat: 4.5800, lng: -74.1300 },
    "rafael uribe": { lat: 4.5900, lng: -74.1000 }
  };

  const systemPrompt = `Eres "Sabor Capital", un experto en recomendaciones gastronómicas de Bogotá con conocimiento actualizado de los restaurantes que existen en diferentes barrios.
  
  🎯 **OBJETIVO PRINCIPAL:**
  ✅ **RECOMENDAR RESTAURANTES ESPECÍFICOS POR BARRIO basándote en el conocimiento de establecimientos reales y representativos de cada zona**

  📝 **FORMATO OBLIGATORIO PARA RECOMENDACIONES:**

  ***Restaurantes en [BARRIO/ZONA]***

  🍽️ **Nombre del Restaurante Real**
  - ***Tipo:*** [Tipo de comida específica] [emoji]
  - **Precio:** [Bajo/Medio/Alto] (rango aproximado)
  - **Dirección:** [Dirección aproximada o zona específica]
  - ***Coordenadas:*** [latitud real], [longitud real] - **USAR SOLO COORDENADAS DE LA BASE DE DATOS**
  - *Especialidad:* [Plato o característica específica] [emoji]

  🔍 **BASE DE DATOS DE COORDENADAS POR BARRIO (OBLIGATORIO USAR ESTAS):**

  • **USAQUÉN:** 4.6932, -74.0337
  • **CHAPINERO:** 4.6482, -74.0632
  • **ZONA G:** 4.6568, -74.0594
  • **PARQUE 93:** 4.6750, -74.0520
  • **ZONA T:** 4.6662, -74.0551
  • **LA CANDELARIA:** 4.5970, -74.0715
  • **KENNEDY:** 4.6122, -74.1389
  • **BOSA:** 4.6230, -74.1850
  • **SUBA:** 4.7420, -74.0830
  • **ENGATIVÁ:** 4.6980, -74.1120
  • **FONTIBÓN:** 4.6810, -74.1420
  • **BARRIOS UNIDOS:** 4.6820, -74.0920
  • **TEUSAQUILLO:** 4.6360, -74.0780
  • **LOS MÁRTIRES:** 4.6050, -74.0900
  • **ANTONIO NARIÑO:** 4.5950, -74.1050
  • **PUENTE ARANDA:** 4.6150, -74.1150
  • **CIUDAD BOLÍVAR:** 4.5600, -74.1500
  • **SAN CRISTÓBAL:** 4.5700, -74.0850
  • **USME:** 4.5400, -74.1100
  • **TUNJUELITO:** 4.5800, -74.1300
  • **RAFAEL URIBE:** 4.5900, -74.1000

  🍽️ **RESTAURANTES REALES POR BARRIO:**

  • **USAQUÉN:**
    - **Andrés D.C.** - Cra. 11a #93-52
    - **Abasto** - Cra. 11a #93-52
    - **Osaki** - Cl. 120a #6-01
    - **Wok** - Cra. 11a #93-52
    - **Sant Just** - Cl. 70a #5-57

  • **CHAPINERO/ZONA G:**
    - **Harry Sasson** - Cra. 5 #69a-44
    - **Mesa Franca** - Cl. 69a #6-46
    - **El Cielo** - Cl. 70 #4-62
    - **Salvo Patria** - Cl. 54a #4-13
    - **Mini Mal** - Cra. 4a #70-46

  • **PARQUE 93/ZONA T:**
    - **Rafael** - Cl. 82 #12-18
    - **El Bandido** - Cl. 83 #12-19
    - **Siete Sopas** - Cra. 13 #83-50
    - **Wok to Walk** - Cra. 12a #83-48

  • **LA CANDELARIA:**
    - **La Puerta Falsa** - Cl. 11 #6-50
    - **Pastelería Florida** - Cra. 7 #20-82
    - **Restaurante Club Colombia** - Cra. 7 #24-88

  • **KENNEDY:**
    - **Frisby** - Centro Comercial Plaza de las Américas
    - **Crepes & Waffles** - Centro Comercial Plaza de las Américas
    - **McDonald's** - Av. Boyacá con Calle 38 Sur
    - **Asadero Los Paisas** - Cra. 78 #41b-05

  ⚠️ **REGLAS ESTRICTAS PARA COORDENADAS:**
  1. SOLO usar las coordenadas de la base de datos anterior
  2. NO inventar coordenadas nuevas
  3. Si mencionas un barrio, usar SUS coordenadas específicas
  4. Las coordenadas deben estar dentro del rango de Bogotá (lat: 4.5-4.8, lng: -74.2 a -74.0)

  🎯 **CUANDO TE PREGUNTEN POR UN BARRIO ESPECÍFICO:**
  1. Identifica el barrio y usa SUS coordenadas de la base de datos
  2. Selecciona 3-5 restaurantes REALES de esa zona
  3. Proporciona nombres reales y direcciones aproximadas
  4. Usa SOLO las coordenadas del barrio de la base de datos
  5. Describe el tipo de experiencia que ofrece cada lugar

  📌 **EJEMPLO CORRECTO PARA "KENNEDY":**

  ***Restaurantes en Kennedy***

  🍽️ **Frisby**
  - ***Tipo:*** Comida rápida (pollo) 🍗
  - **Precio:** Bajo-Medio ($18,000 - $35,000)
  - **Dirección:** Centro Comercial Plaza de las Américas
  - ***Coordenadas:*** 4.6122, -74.1389
  - *Especialidad:* Pollo asado y alitas picantes 🍗

  🍽️ **Crepes & Waffles**
  - ***Tipo:*** Internacional (crepes, ensaladas) 🥞
  - **Precio:** Medio ($25,000 - $45,000)
  - **Dirección:** Centro Comercial Plaza de las Américas
  - ***Coordenadas:*** 4.6122, -74.1389
  - *Especialidad:* Crepes dulces y salados con ingredientes frescos 🥗

  ⚠️ **SI NO CONOCES EL BARRIO:**
  "Conozco principalmente los barrios más representativos de Bogotá. ¿Te refieres a alguna de estas zonas?
  • Norte: Usaquén, Chapinero, Suba
  • Centro: La Candelaria, Santa Fe
  • Sur: Kennedy, Bosa, Tunjuelito
  • Occidente: Engativá, Fontibón, Puente Aranda

  ¿Cuál de estas te queda más cerca? 🗺️"`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://ozladdazcubyvmgdpyop.supabase.co/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemPrompt: systemPrompt,
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            }))
          })
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Error al conectar con el asistente');
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;

              if (text) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage.role === "assistant") {
                    lastMessage.content += text;
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }

      const extractRestaurants = (content: string): Restaurant[] => {
        const restaurants: Restaurant[] = [];
        
        // Try to extract Places API metadata first (hidden in HTML comments)
        const placesDataMatch = content.match(/<!--PLACES_DATA:(.*?)-->/s);
        if (placesDataMatch) {
          try {
            const placesData = JSON.parse(placesDataMatch[1]);
            console.log('📍 Extracted', placesData.length, 'restaurants from Places API metadata');
            
            return placesData.map((place: any) => {
              const convertPriceLevel = (priceLevel: string): string => {
                const priceLevelMap: { [key: string]: string } = {
                  'PRICE_LEVEL_FREE': '$',
                  'PRICE_LEVEL_INEXPENSIVE': '$',
                  'PRICE_LEVEL_MODERATE': '$$',
                  'PRICE_LEVEL_EXPENSIVE': '$$$',
                  'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$',
                  'PRICE_LEVEL_UNSPECIFIED': '$$'
                };
                return priceLevelMap[priceLevel] || '$$';
              };

              return {
                placeId: place.place_id,
                name: place.name,
                lat: place.location.lat,
                lng: place.location.lng,
                rating: place.rating || 0,
                price: convertPriceLevel(place.price_level),
                type: place.types?.[0]?.replace(/_/g, ' ') || 'restaurant',
                address: place.formatted_address,
                phone: place.phone_number,
                website: place.website,
                openNow: place.open_now,
                openingHours: place.opening_hours,
                image: place.photos?.[0] || restaurantImages[0],
                userRatingsTotal: place.user_ratings_total || 0,
                description: `Restaurante con ${place.rating || 0} estrellas y ${place.user_ratings_total || 0} reseñas`
              };
            });
          } catch (error) {
            console.error('Error parsing Places API data:', error);
          }
        }

        // Fallback: Extract from text format (Gemini's response)
        const cleanContent = content
          .replace(/\*\*\*/g, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '');

        const coordPattern = /Coordenadas:\s*([-\d.]+),\s*([-\d.]+)/gi;
        const namePattern = /🍽️\s*([^\n-]+)/i;
        const typePattern = /Tipo:\s*([^\n]+)/i;
        const pricePattern = /Precio:\s*([^\n]+)/i;
        const addressPattern = /Dirección:\s*([^\n]+)/i;
        const descriptionPattern = /Especialidad:\s*([^\n]+)/i;

        const sections = cleanContent.split(/(?=🍽️)/);

        for (const section of sections) {
          const coordMatch = coordPattern.exec(section);
          if (coordMatch) {
            const nameMatch = section.match(namePattern);
            const typeMatch = section.match(typePattern);
            const priceMatch = section.match(pricePattern);
            const addressMatch = section.match(addressPattern);
            const descriptionMatch = section.match(descriptionPattern);

            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);

            // Validar que las coordenadas estén dentro de Bogotá
            if (lat >= 4.5 && lat <= 4.8 && lng >= -74.2 && lng <= -74.0) {
              const randomImage = restaurantImages[Math.floor(Math.random() * restaurantImages.length)];
              const randomRating = parseFloat((4 + Math.random() * 1).toFixed(1));
              
              restaurants.push({
                name: nameMatch ? nameMatch[1].trim() : "Restaurante Recomendado",
                lat,
                lng,
                address: addressMatch ? addressMatch[1].trim() : undefined,
                type: typeMatch ? typeMatch[1].trim() : "Comida variada",
                price: priceMatch ? priceMatch[1].trim() : "$$",
                rating: randomRating,
                description: descriptionMatch ? descriptionMatch[1].trim() : "Excelente restaurante recomendado por Sabor Capital",
                image: randomImage,
                openingHours: "11:00 AM - 10:00 PM"
              });
            }
          }
          coordPattern.lastIndex = 0;
        }

        return restaurants;
      };

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === "assistant") {
          const extracted = extractRestaurants(lastMessage.content);
          if (extracted.length > 0) {
            setRestaurants(extracted);
            if (map && extracted[0]) {
              // Usar las coordenadas extraídas correctamente
              map.panTo({ lat: extracted[0].lat, lng: extracted[0].lng });
              map.setZoom(14);
            }
          }
        }
        return prev;
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Por favor intenta de nuevo.",
        variant: "destructive"
      });

      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === "assistant" && !lastMessage.content) {
          newMessages.pop();
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleZoomIn = () => {
    if (map) {
      map.setZoom((map.getZoom() || 13) + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom((map.getZoom() || 13) - 1);
    }
  };

  const handleLocate = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.panTo({ lat: latitude, lng: longitude });
          map.setZoom(16);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Error",
            description: "No se pudo obtener tu ubicación",
            variant: "destructive"
          });
        }
      );
    }
  };

  const onMapLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsMapLoaded(true);
  };

  const getPriceLevel = (price: string) => {
    const priceCount = (price.match(/\$/g) || []).length;
    return Array.from({ length: 4 }, (_, i) => (
      <DollarSign 
        key={i} 
        className={`h-3 w-3 ${i < priceCount ? 'text-green-600 fill-green-600' : 'text-gray-300'}`}
      />
    ));
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    console.log("Restaurante clickeado:", restaurant);
    setSelectedRestaurant(restaurant);
    
    if (map && restaurant.lat && restaurant.lng) {
      // Validar que las coordenadas sean números válidos
      if (!isNaN(restaurant.lat) && !isNaN(restaurant.lng)) {
        map.panTo({ 
          lat: restaurant.lat, 
          lng: restaurant.lng 
        });
        map.setZoom(16);
        
        // Forzar la actualización del InfoWindow
        setTimeout(() => {
          setSelectedRestaurant(null);
          setTimeout(() => {
            setSelectedRestaurant(restaurant);
          }, 50);
        }, 100);
      } else {
        console.error("Coordenadas inválidas:", restaurant.lat, restaurant.lng);
        toast({
          title: "Error",
          description: "Las coordenadas del restaurante no son válidas",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              ¡Hola! Soy Sabor Capital 🍽️
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Tu asistente experto para encontrar los mejores restaurantes de Bogotá 🌟✨
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSuggestion(suggestion)}
                className="rounded-full text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {suggestion}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <ChatMessage
                role="assistant"
                content="Buscando las mejores opciones para ti..."
                timestamp={new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          {restaurants.length > 0 && (
            <div className="mt-8 mb-6 space-y-6">
              {/* Mapa */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Ubicaciones en el Mapa</h3>
                </div>
                
                <div className="relative rounded-lg overflow-hidden">
                  <LoadScript 
                    googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                    onLoad={() => setIsMapLoaded(true)}
                  >
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={restaurants[0] ? { lat: restaurants[0].lat, lng: restaurants[0].lng } : defaultCenter}
                      zoom={13}
                      onLoad={onMapLoad}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: false,
                      }}
                    >
                      {isMapLoaded && restaurants.map((restaurant, index) => (
                        <Marker
                          key={index}
                          position={{ lat: restaurant.lat, lng: restaurant.lng }}
                          onClick={() => handleRestaurantClick(restaurant)}
                          icon={restaurantIcon}
                        />
                      ))}

                      {isMapLoaded && selectedRestaurant && (
                        <InfoWindow
                          position={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}
                          onCloseClick={() => setSelectedRestaurant(null)}
                        >
                          <div className="p-2 max-w-xs">
                            <h4 className="font-semibold text-sm mb-1">{selectedRestaurant.name}</h4>
                            {selectedRestaurant.type && (
                              <Badge variant="secondary" className="text-xs mb-2">
                                {selectedRestaurant.type}
                              </Badge>
                            )}
                            {selectedRestaurant.address && (
                              <p className="text-xs text-gray-600 mb-2">{selectedRestaurant.address}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                              {selectedRestaurant.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span>{selectedRestaurant.rating}</span>
                                </div>
                              )}
                              {selectedRestaurant.price && (
                                <div className="flex items-center gap-1">
                                  {getPriceLevel(selectedRestaurant.price)}
                                </div>
                              )}
                            </div>
                            {selectedRestaurant.description && (
                              <p className="text-xs text-gray-600 mb-2">{selectedRestaurant.description}</p>
                            )}
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </LoadScript>

                  <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
                    <Button 
                      size="icon" 
                      onClick={handleZoomIn} 
                      className="shadow-glow bg-primary hover:bg-primary-hover text-primary-foreground rounded-full h-12 w-12 transition-all hover:scale-110"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                    <Button 
                      size="icon" 
                      onClick={handleZoomOut} 
                      className="shadow-glow bg-primary hover:bg-primary-hover text-primary-foreground rounded-full h-12 w-12 transition-all hover:scale-110"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Button 
                      size="icon" 
                      onClick={handleLocate} 
                      className="shadow-glow bg-accent hover:bg-accent/90 text-accent-foreground rounded-full h-12 w-12 transition-all hover:scale-110"
                    >
                      <Navigation className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lista de Restaurantes - Nuevo Diseño */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Restaurantes Recomendados</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {restaurants.map((restaurant, index) => (
                    <Card 
                      key={index} 
                      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                        selectedRestaurant?.name === restaurant.name 
                          ? 'border-primary shadow-xl' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleRestaurantClick(restaurant)}
                    >
                      <div className="relative h-40 overflow-hidden rounded-t-lg">
                        <img 
                          src={restaurant.image} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                        {restaurant.openNow !== undefined && (
                          <Badge 
                            variant={restaurant.openNow ? "default" : "destructive"}
                            className="absolute top-2 right-2"
                          >
                            {restaurant.openNow ? '🟢 Abierto' : '🔴 Cerrado'}
                          </Badge>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <h4 className="font-bold text-lg mb-2">{restaurant.name}</h4>
                        
                        {restaurant.type && (
                          <Badge variant="secondary" className="mb-2 text-xs">
                            {restaurant.type}
                          </Badge>
                        )}

                        <div className="space-y-2 text-sm">
                          {restaurant.address && (
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{restaurant.address}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            {restaurant.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                                {restaurant.userRatingsTotal && (
                                  <span className="text-muted-foreground text-xs">
                                    ({restaurant.userRatingsTotal})
                                  </span>
                                )}
                              </div>
                            )}

                            {restaurant.price && (
                              <div className="flex items-center gap-1">
                                {getPriceLevel(restaurant.price)}
                              </div>
                            )}
                          </div>

                          {restaurant.openingHours && (
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span className="text-xs">
                                {typeof restaurant.openingHours === 'string' 
                                  ? restaurant.openingHours 
                                  : restaurant.openingHours[0]}
                              </span>
                            </div>
                          )}

                          {(restaurant.website || restaurant.phone) && (
                            <div className="flex gap-2 mt-3">
                              {restaurant.website && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(restaurant.website, '_blank');
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Web
                                </Button>
                              )}
                              {restaurant.phone && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`tel:${restaurant.phone}`, '_blank');
                                  }}
                                >
                                  📞 Llamar
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background/95 backdrop-blur-sm p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Mic className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Escribe tu mensaje..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatIA;