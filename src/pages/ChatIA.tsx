import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Sparkles, MapPin, ExternalLink, Plus, Minus, Navigation, Star, Clock, DollarSign, Heart, Eye } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { useToast } from "@/hooks/use-toast";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getPhotoUrl } from "@/hooks/useRestaurants";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
      <circle cx="16" cy="16" r="15" fill="hsl(12, 88%, 58%)" stroke="white" stroke-width="2"/>
      <path fill="white" d="M12 12h2v8h-2zm6 0h2v8h-2zm-3 4v6h-2v-6h-2l3-4 3 4h-2z"/>
    </svg>
  `)}`
};

const userLocationIcon = {
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="hsl(214, 89%, 52%)" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
      <circle cx="16" cy="16" r="3" fill="hsl(214, 89%, 52%)"/>
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

interface ChatConversation {
  id_conversacion: string;
  id_usuario: string;
  titulo: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

const ChatIA = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState(location.state?.initialPrompt || "");
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
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const RESTAURANTS_PER_PAGE = 6;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { data: userProfile } = useUserProfile();

  // Guardar estado del chat en sessionStorage para preservarlo al navegar a detalles
  useEffect(() => {
    sessionStorage.setItem('chatIA_state', JSON.stringify({
      messages,
      restaurants,
      currentConversationId
    }));
  }, [messages, restaurants, currentConversationId]);

  // Restaurar estado del chat si existe (solo al montar el componente)
  useEffect(() => {
    const savedState = sessionStorage.getItem('chatIA_state');
    if (savedState && !location.state?.loadConversation) {
      try {
        const state = JSON.parse(savedState);
        if (state.messages && state.messages.length > 1) { // Solo restaurar si hay más que el mensaje inicial
          setMessages(state.messages);
          setRestaurants(state.restaurants || []);
          setCurrentConversationId(state.currentConversationId);
          console.log('✅ Estado del chat restaurado:', state.messages.length, 'mensajes');
        }
      } catch (error) {
        console.error('Error restaurando estado del chat:', error);
      }
    }
    
    // Limpiar el flag de loadConversation después de usarlo
    if (location.state?.loadConversation) {
      window.history.replaceState({}, document.title);
    }
  }, []); // Solo ejecutar una vez al montar

  // Enviar prompt inicial si existe
  useEffect(() => {
    if (location.state?.initialPrompt && inputMessage) {
      // Pequeño delay para asegurar que el componente esté montado
      setTimeout(() => {
        handleSend();
      }, 100);
    }
  }, []);

  // Cargar conversación desde historial
  useEffect(() => {
    const loadConversation = async () => {
      if (location.state?.loadConversation && location.state?.conversationId) {
        try {
          const { data: conversacion, error: convError } = await supabase
            .from('chat_conversacion')
            .select('*')
            .eq('id_conversacion', location.state.conversationId)
            .maybeSingle();

          if (convError) throw convError;

          if (conversacion) {
            const { data: mensajes, error: msgError } = await supabase
              .from('chat_mensaje')
              .select('*')
              .eq('id_conversacion', conversacion.id_conversacion)
              .order('timestamp', { ascending: true });

            if (msgError) throw msgError;

            if (mensajes && mensajes.length > 0) {
              const loadedMessages: Message[] = mensajes.map(msg => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
                timestamp: new Date(msg.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
              }));

              setMessages(loadedMessages);
              setCurrentConversationId(conversacion.id_conversacion);

              // Extraer restaurantes de los mensajes del asistente para cargar el mapa
              const allRestaurants: Restaurant[] = [];
              mensajes.forEach(msg => {
                if (msg.role === 'assistant') {
                  const extractedRestaurants = extractRestaurants(msg.content);
                  allRestaurants.push(...extractedRestaurants);
                }
              });

              if (allRestaurants.length > 0) {
                setRestaurants(allRestaurants);
              }

              toast({
                title: "Conversación cargada",
                description: `"${conversacion.titulo}" restaurada con ${mensajes.length} mensajes${allRestaurants.length > 0 ? ` y ${allRestaurants.length} restaurantes en el mapa` : ''}`
              });
            }
          }
        } catch (error) {
          console.error('Error cargando conversación:', error);
          toast({
            title: "Error",
            description: "No se pudo cargar la conversación",
            variant: "destructive"
          });
        }
      }
    };

    loadConversation();
  }, [location.state]);

  const saveConversation = async (userMsg: Message, assistantMsg: Message) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let conversationId = currentConversationId;

      // Si no existe conversación, crear una nueva
      if (!conversationId) {
        const titulo = userMsg.content.substring(0, 100) + (userMsg.content.length > 100 ? '...' : '');
        
        const { data: newConv, error: convError } = await supabase
          .from('chat_conversacion')
          .insert({
            id_usuario: user.id,
            titulo: titulo
          })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConv.id_conversacion;
        setCurrentConversationId(conversationId);

        // Crear entrada en historial_busqueda vinculada a esta conversación
        const { error: histError } = await supabase
          .from('historial_busqueda')
          .insert({
            id_usuario: user.id,
            query: userMsg.content,
            id_conversacion: conversationId
          });

        if (histError) console.error('Error creando historial de busqueda:', histError);
      }

      // Guardar ambos mensajes
      const { error: msgError } = await supabase
        .from('chat_mensaje')
        .insert([
          {
            id_conversacion: conversationId,
            role: userMsg.role,
            content: userMsg.content
          },
          {
            id_conversacion: conversationId,
            role: assistantMsg.role,
            content: assistantMsg.content
          }
        ]);

      if (msgError) throw msgError;

      console.log('✅ Conversación guardada:', conversationId);
    } catch (error) {
      console.error('Error guardando conversación:', error);
    }
  };

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
  ✅ **RECOMENDAR RESTAURANTES ESPECÍFICOS EN BOGOTÁ que cumplan con criterios estrictos de calidad y actualidad**

  📋 **CRITERIOS OBLIGATORIOS PARA RECOMENDACIONES:**
  1. ✅ **UBICACIÓN:** Exclusivamente en Bogotá
  2. ✅ **VALORACIÓN:** Mínimo 2.0 estrellas en plataformas actuales
  3. ✅ **VIGENCIA:** Restaurantes activos y operando en la ACTUALIDAD
  4. ✅ **INFORMACIÓN ACTUALIZADA:** Datos de 2024 o Datos de 2025

  📝 **FORMATO OBLIGATORIO PARA RESPUESTAS:**

  🗺️ **MAPA DE ZONAS RECOMENDADAS**
  [Descripción breve de las zonas donde se encuentran los restaurantes]

  🌟 **RESTAURANTES RECOMENDADOS**

  🍽️ **NOMBRE DEL RESTAURANTE REAL**
  - ***Tipo:*** [Tipo de comida específica] [emoji]
  - **Precio:** [Bajo/Medio/Alto] (rango aproximado)
  - **Dirección:** [Dirección exacta o zona específica]
  - ***Coordenadas:*** [latitud real], [longitud real] - **USAR SOLO COORDENADAS DE LA BASE DE DATOS**
  - ***Valoración:*** ⭐ [2.0-5.0] estrellas (actualizado 2024 o 2025)
  - *Especialidad:* [Plato o característica específica] [emoji]
  - *Estado:* ✅ **VIGENTE Y OPERANDO**

  📝 **RESPUESTA DETALLADA**
  [Aquí desarrollas la respuesta completa a la consulta del usuario, explicando por qué estos restaurantes son recomendados, el tipo de experiencia, ambiente, etc.]

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

  🍽️ **RESTAURANTES REALES Y VIGENTES POR BARRIO (ACTUALIZADO 2024):**

  • **USAQUÉN (⭐4.0+):**
    - **Andrés D.C.** - Cra. 11a #93-52 - ⭐4.3
    - **Abasto** - Cra. 11a #93-52 - ⭐4.5
    - **Osaki** - Cl. 120a #6-01 - ⭐4.4
    - **Wok** - Cra. 11a #93-52 - ⭐4.2
    - **Sant Just** - Cl. 70a #5-57 - ⭐4.6

  • **CHAPINERO/ZONA G (⭐4.0+):**
    - **Harry Sasson** - Cra. 5 #69a-44 - ⭐4.7
    - **Mesa Franca** - Cl. 69a #6-46 - ⭐4.4
    - **El Cielo** - Cl. 70 #4-62 - ⭐4.5
    - **Salvo Patria** - Cl. 54a #4-13 - ⭐4.3
    - **Mini Mal** - Cra. 4a #70-46 - ⭐4.2

  • **PARQUE 93/ZONA T (⭐4.0+):**
    - **Rafael** - Cl. 82 #12-18 - ⭐4.6
    - **El Bandido** - Cl. 83 #12-19 - ⭐4.3
    - **Siete Sopas** - Cra. 13 #83-50 - ⭐4.1
    - **Wok to Walk** - Cra. 12a #83-48 - ⭐4.2

  • **LA CANDELARIA (⭐4.0+):**
    - **La Puerta Falsa** - Cl. 11 #6-50 - ⭐4.4
    - **Pastelería Florida** - Cra. 7 #20-82 - ⭐4.3
    - **Restaurante Club Colombia** - Cra. 7 #24-88 - ⭐4.2

  ⚠️ **REGLAS ESTRICTAS:**
  1. SOLO recomendar restaurantes con 2.0+ estrellas
  2. SOLO restaurantes activos y vigentes en 2024
  3. SOLO ubicados en Bogotá
  4. SOLO usar coordenadas de la base de datos
  5. SIEMPRE incluir la valoración actual
  6. SIEMPRE confirmar que está VIGENTE

  🎯 **EJEMPLO CORRECTO:**

  🗺️ **MAPA DE ZONAS RECOMENDADAS**
  Zona G y Chapinero Alto, conocidas por su alta concentración de restaurantes gourmet y experiencias culinarias premium.

  🌟 **RESTAURANTES RECOMENDADOS**

  🍽️ **Harry Sasson**
  - ***Tipo:*** Fusión colombiana-internacional 🍽️
  - **Precio:** Alto ($$$$)
  - **Dirección:** Cra. 5 #69a-44, Chapinero
  - ***Coordenadas:*** 4.6482, -74.0632
  - ***Valoración:*** ⭐4.7 estrellas (actualizado 2024)
  - *Especialidad:* Experiencia gastronómica de autor con ingredientes colombianos 🌟
  - *Estado:* ✅ **VIGENTE Y OPERANDO**

  🍽️ **El Cielo**
  - ***Tipo:*** Gastronomía molecular y experiencia sensorial 🎨
  - **Precio:** Alto ($$$$)
  - **Dirección:** Cl. 70 #4-62, Chapinero
  - ***Coordenadas:*** 4.6482, -74.0632
  - ***Valoración:*** ⭐4.5 estrellas (actualizado 2024)
  - *Especialidad:* Menú degustación con técnicas vanguardistas ✨
  - *Estado:* ✅ **VIGENTE Y OPERANDO**

  📝 **RESPUESTA DETALLADA**
  Para una experiencia romántica en Bogotá, te recomiendo estos dos restaurantes que cumplen con los más altos estándares de calidad...

  ⚡ **SI NO HAY OPCIONES QUE CUMPLAN LOS CRITERIOS:**
  "Actualmente no encuentro restaurantes que cumplan exactamente con tus criterios y tengan 2.0+ estrellas en esa zona específica. ¿Te gustaría que amplíe la búsqueda a zonas cercanas o flexibilice algún criterio?"`;

  const processAssistantResponse = (content: string) => {
    const sections = {
      mapSection: "",
      recommendationsSection: "",
      detailedResponse: "",
      fullContent: content
    };

    try {
      // Extraer sección del mapa (patrón más flexible)
      const mapMatch = content.match(/🗺️\s*(?:\*\*)?MAPA DE ZONAS RECOMENDADAS(?:\*\*)?\s*\n([^🌟]*)/i);
      if (mapMatch) {
        sections.mapSection = mapMatch[1].trim();
      }

      // Extraer sección de recomendaciones
      const recommendationsMatch = content.match(/🌟\s*(?:\*\*)?RESTAURANTES RECOMENDADOS(?:\*\*)?\s*\n([\s\S]*?)(?=📝\s*(?:\*\*)?RESPUESTA DETALLADA(?:\*\*)?|$)/i);
      if (recommendationsMatch) {
        sections.recommendationsSection = recommendationsMatch[1].trim();
      }

      // Extraer respuesta detallada
      const detailedMatch = content.match(/📝\s*(?:\*\*)?RESPUESTA DETALLADA(?:\*\*)?\s*\n([\s\S]*)$/i);
      if (detailedMatch) {
        sections.detailedResponse = detailedMatch[1].trim();
      }

      // Si no se encontraron secciones, usar el contenido completo
      if (!sections.mapSection && !sections.recommendationsSection && !sections.detailedResponse) {
        sections.detailedResponse = content;
      }
    } catch (error) {
      console.error('Error procesando respuesta del asistente:', error);
      sections.detailedResponse = content;
    }

    return sections;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractRestaurants = (content: string): Restaurant[] => {
    const restaurants: Restaurant[] = [];
    console.log('🔍 Iniciando extracción de restaurantes...');

    // Try to extract Places API metadata first (hidden in HTML comments)
    const placesDataMatch = content.match(/<!--PLACES_DATA:(.*?)-->/s);
    if (placesDataMatch) {
      try {
        const placesData = JSON.parse(placesDataMatch[1]);
        /* console.log('📍 Extraer', placesData.length, 'restaurantes para Places API metadata'); */

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
            image: place.photos?.[0] || restaurantImages[Math.floor(Math.random() * restaurantImages.length)],
            userRatingsTotal: place.user_ratings_total || 0,
            description: `Restaurante con ${place.rating || 0} estrellas y ${place.user_ratings_total || 0} reseñas`
          };
        });
      } catch (error) {
        console.error('Error parseando Places API data:', error);
      }
    }

    const cleanContent = content
      .replace(/\*\*\*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '');

    const restaurantSections = cleanContent.split(/(?=🍽️\s*\*)/);

    console.log(`📄 Encontradas ${restaurantSections.length} secciones de restaurantes`);

    for (const section of restaurantSections) {
      try {
        const nameMatch = section.match(/🍽️\s*\*{0,2}([^\n*-]+)/i);
        const coordMatch = section.match(/Coordenadas:\s*([-\d.]+),\s*([-\d.]+)/i);

        if (coordMatch) {
          const name = nameMatch ? nameMatch[1].trim() : "Restaurante Recomendado";
          const lat = parseFloat(coordMatch[1]);
          const lng = parseFloat(coordMatch[2]);

          console.log(`📍 Procesando: ${name} - Lat: ${lat}, Lng: ${lng}`);

          // Validar que las coordenadas estén dentro de Bogotá
          if (lat >= 4.5 && lat <= 4.8 && lng >= -74.2 && lng <= -74.0) {
            const typeMatch = section.match(/Tipo:\s*([^\n]+)/i);
            const priceMatch = section.match(/Precio:\s*([^\n]+)/i);
            const addressMatch = section.match(/Dirección:\s*([^\n]+)/i);
            const descriptionMatch = section.match(/Especialidad:\s*([^\n]+)/i);
            const ratingMatch = section.match(/Valoración:\s*⭐\s*([\d.]+)/i);

            const randomImage = restaurantImages[Math.floor(Math.random() * restaurantImages.length)];
            const randomRating = ratingMatch ? parseFloat(ratingMatch[1]) : parseFloat((3.5 + Math.random() * 1.5).toFixed(1));

            const restaurant: Restaurant = {
              name: name,
              lat: lat,
              lng: lng,
              address: addressMatch ? addressMatch[1].trim() : "Bogotá, Colombia",
              type: typeMatch ? typeMatch[1].trim() : "Comida variada",
              price: priceMatch ? priceMatch[1].trim() : "$$",
              rating: randomRating,
              description: descriptionMatch ? descriptionMatch[1].trim() : `Excelente restaurante ${name} recomendado por Sabor Capital`,
              image: randomImage,
              openingHours: "11:00 AM - 10:00 PM",
              userRatingsTotal: Math.floor(Math.random() * 100) + 10
            };

            console.log('✅ Restaurante extraído:', restaurant.name);
            restaurants.push(restaurant);
          } else {
            console.log('❌ Coordenadas fuera de Bogotá:', lat, lng);
          }
        }
      } catch (error) {
        console.error('Error procesando sección de restaurante:', error);
      }
    }

    console.log(`🎯 Total de restaurantes extraídos: ${restaurants.length}`);
    return restaurants;
  };

  const handleSend = async () => {
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
        // Build user preferences context
        let preferencesContext = '';
        if (userProfile?.tipo_comida?.length > 0 || userProfile?.presupuesto || userProfile?.ubicacion) {
          preferencesContext = `\n\n**PREFERENCIAS DEL USUARIO:**
${userProfile.tipo_comida?.length > 0 ? `- Tipos de comida favoritos: ${userProfile.tipo_comida.join(', ')}` : ''}
${userProfile.presupuesto ? `- Presupuesto preferido: ${userProfile.presupuesto}` : ''}
${userProfile.ubicacion ? `- Ubicación preferida: ${userProfile.ubicacion}` : ''}`;
        }

        const systemPrompt = `Eres Sabor Capital, un asistente experto en restaurantes de Bogotá, Colombia. 

Tu misión es ayudar a los usuarios a encontrar el lugar perfecto para comer en Bogotá.

**INSTRUCCIONES IMPORTANTES:**
- SIEMPRE menciona las **coordenadas exactas** de cada restaurante
- Habla de forma amigable y entusiasta
- Da recomendaciones específicas
- Si te preguntan por un tipo de comida o zona, busca restaurantes relevantes
- Menciona detalles como calificación, precio, dirección y tipo de cocina
${preferencesContext}

**DETECCIÓN DE CONSULTAS GENERALES:**
Si el usuario te saluda o pregunta algo general como "hola", "qué recomiendas", "ayúdame a buscar" o no especifica qué tipo de comida quiere:
1. Responde el saludo de forma amigable
2. Pregúntale si quiere ver recomendaciones basadas en sus preferencias guardadas o si prefiere que le recomiendes algo general
3. Ejemplo: "¡Hola! 👋 Veo que tienes preferencias guardadas. ¿Quieres que busque restaurantes basándome en tus gustos (${userProfile?.tipo_comida?.join(', ') || 'tus preferencias'}) o prefieres que te recomiende algo diferente?"
`;

        const response = await fetch(
          `https://ozladdazcubyvmgdpyop.supabase.co/functions/v1/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              systemPrompt: systemPrompt,
              userPreferences: userProfile ? {
                tipo_comida: userProfile.tipo_comida,
                presupuesto: userProfile.presupuesto,
                ubicacion: userProfile.ubicacion
              } : undefined,
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
      let receivedRestaurants: Restaurant[] = [];

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
              console.log('📥 Parsed SSE data:', parsed);
              
              // Check if this is metadata
              if (parsed.type === 'metadata' && parsed.restaurants) {
                console.log('📦 Received metadata with', parsed.restaurants.length, 'restaurants');
                console.log('📦 Full metadata:', parsed.restaurants);
                
                // Convert metadata to Restaurant objects
                receivedRestaurants = parsed.restaurants.map((place: any) => {
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
                    image: place.photos?.[0] ? getPhotoUrl(place.photos[0], 800) : restaurantImages[Math.floor(Math.random() * restaurantImages.length)],
                    userRatingsTotal: place.user_ratings_total || 0,
                    description: `${place.name} - ${place.rating || 0} ⭐ (${place.user_ratings_total || 0} reseñas)`
                  };
                });
                
                console.log('✅ Converted', receivedRestaurants.length, 'restaurants:', receivedRestaurants.map(r => r.name));
                
                // Set restaurants immediately
                setRestaurants(receivedRestaurants);
                setCurrentPage(1); // Reset to first page
                console.log('✅ Set', receivedRestaurants.length, 'restaurants from metadata');
                continue;
              }

              // Otherwise it's AI response text
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
              console.error('Error parseando el SSE:', e);
              console.error('Line that failed:', line);
            }
          }
        }
      }

      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        const firstUserMessage = newMessages[newMessages.length - 2];
        
        if (lastMessage.role === "assistant") {
          // Guardar conversación completa
          saveConversation(firstUserMessage, lastMessage);

          // If we received restaurants from metadata, use those and center map
          if (receivedRestaurants.length > 0 && map) {
            console.log('🗺️ Centering map on first restaurant:', receivedRestaurants[0].name);
            map.panTo({ lat: receivedRestaurants[0].lat, lng: receivedRestaurants[0].lng });
            map.setZoom(14);
          }
        }
        return newMessages;
      });

    } catch (error) {
      console.error('Error enviando el mensaje:', error);
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
          console.error("Error obteniendo location:", error);
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

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  return (
    <div className="flex h-full bg-background">
      {/* LEFT SIDE: Map + Restaurant Cards */}
      <div className="w-[55%] flex flex-col border-r border-border">
        {/* Map Section */}
        <div className="flex-1 relative min-h-0">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={restaurants.length > 0 ? { lat: restaurants[0].lat, lng: restaurants[0].lng } : defaultCenter}
              zoom={13}
              onLoad={onMapLoad}
              options={{
                disableDefaultUI: true,
                zoomControl: false,
              }}
            >
              {restaurants.map((restaurant, index) => (
                <Marker
                  key={`${restaurant.name}-${index}`}
                  position={{ lat: restaurant.lat, lng: restaurant.lng }}
                  onClick={() => handleRestaurantClick(restaurant)}
                  icon={restaurantIcon}
                />
              ))}

              {selectedRestaurant && (
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
                    <div className="flex items-center gap-4 text-xs text-gray-500">
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
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
                <p className="text-sm text-muted-foreground">Cargando mapa...</p>
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            <Button
              size="icon"
              onClick={handleZoomIn}
              className="shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleZoomOut}
              className="shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-10 w-10"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleLocate}
              className="shadow-lg bg-accent hover:bg-accent/90 text-accent-foreground rounded-full h-10 w-10"
            >
              <Navigation className="h-4 w-4" />
            </Button>
          </div>

          {/* Empty state overlay */}
          {restaurants.length === 0 && isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center p-6">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Pregúntame qué quieres comer</p>
                <p className="text-sm text-muted-foreground/70">y te mostraré los mejores lugares en el mapa</p>
              </div>
            </div>
          )}
        </div>

        {/* Restaurant Cards - Bottom */}
        {restaurants.length > 0 && (
          <div className="h-[200px] border-t border-border bg-card flex-shrink-0">
            <div className="px-3 py-2 border-b bg-gradient-to-r from-primary/5 to-secondary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{restaurants.length} restaurantes</span>
                <Badge variant="secondary" className="text-[10px]">⭐ 2.0+</Badge>
              </div>
              {restaurants.length > RESTAURANTS_PER_PAGE && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    ←
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {currentPage}/{Math.ceil(restaurants.length / RESTAURANTS_PER_PAGE)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(restaurants.length / RESTAURANTS_PER_PAGE), prev + 1))}
                    disabled={currentPage === Math.ceil(restaurants.length / RESTAURANTS_PER_PAGE)}
                  >
                    →
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-3 overflow-x-auto">
              {restaurants
                .slice((currentPage - 1) * RESTAURANTS_PER_PAGE, currentPage * RESTAURANTS_PER_PAGE)
                .map((restaurant, index) => (
                <Card
                  key={index}
                  className={`flex-shrink-0 w-[280px] cursor-pointer transition-all hover:shadow-md ${
                    selectedRestaurant?.name === restaurant.name
                      ? 'ring-2 ring-primary shadow-md'
                      : 'hover:ring-1 hover:ring-primary/50'
                  }`}
                  onClick={() => handleRestaurantClick(restaurant)}
                >
                  <div className="flex h-full">
                    <div className="w-20 h-full flex-shrink-0">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-full object-cover rounded-l-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = restaurantImages[0];
                        }}
                      />
                    </div>
                    <CardContent className="flex-1 p-2">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-semibold text-xs line-clamp-1">{restaurant.name}</h4>
                        {restaurant.rating && (
                          <Badge className="text-[9px] shrink-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 px-1">
                            ⭐{restaurant.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {restaurant.price && (
                          <div className="flex items-center scale-75 origin-left">
                            {getPriceLevel(restaurant.price)}
                          </div>
                        )}
                        {restaurant.type && (
                          <Badge variant="outline" className="text-[9px] px-1 h-4">
                            {restaurant.type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1 mt-1">
                        <Button
                          size="sm"
                          variant={isFavorite(restaurant.placeId || '') ? "default" : "outline"}
                          className="h-5 text-[10px] px-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(restaurant.placeId || '');
                          }}
                        >
                          <Heart className={`h-2.5 w-2.5 mr-0.5 ${isFavorite(restaurant.placeId || '') ? 'fill-current' : ''}`} />
                          {isFavorite(restaurant.placeId || '') ? '✓' : 'Guardar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-5 text-[10px] px-1.5"
                          asChild
                        >
                          <a
                            href={`/restaurantes/${restaurant.placeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye className="h-2.5 w-2.5 mr-0.5" />
                            Ver
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Chat */}
      <div className="w-[45%] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                Sabor Capital IA
              </h1>
              <p className="text-xs text-muted-foreground">Tu asistente gastronómico</p>
            </div>
          </div>
        </div>

        {/* Quick Suggestions */}
        <div className="px-3 py-2 border-b bg-muted/30">
          <div className="flex flex-wrap gap-1.5">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSuggestion(suggestion)}
                className="rounded-full text-xs h-7 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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

        {/* Input */}
        <div className="border-t border-border bg-background p-3 flex-shrink-0">
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground shrink-0">
              <Mic className="h-5 w-5" />
            </Button>
            <Input
              placeholder="¿Qué te apetece comer hoy?"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="bg-primary hover:bg-primary/90 shrink-0"
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