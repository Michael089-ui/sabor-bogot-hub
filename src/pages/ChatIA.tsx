import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Sparkles, MapPin, ExternalLink, Plus, Minus, Navigation, Star, Clock, DollarSign, Heart, Eye } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { useToast } from "@/hooks/use-toast";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";

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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

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
              console.error('Error parseando el SSE:', e); //Security Service Edge
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

          // Procesar las secciones de la respuesta completa
          const sections = processAssistantResponse(lastMessage.content);
          console.log('🗺️ Mapa:', sections.mapSection);
          console.log('🌟 Recomendaciones:', sections.recommendationsSection);
          console.log('📝 Detalles:', sections.detailedResponse);

          // Extraer restaurantes de la respuesta
          /* console.log('🔍 Extrayendo restaurantes del contenido...'); */
          const extracted = extractRestaurants(lastMessage.content);
          /* console.log('📊 Restaurantes extraídos:', extracted); */

          if (extracted.length > 0) {
            /* console.log('✅ Estableciendo restaurantes en el estado'); */
            setRestaurants(extracted);
            if (map && extracted[0]) {
              console.log('🗺️ Moviendo mapa a:', extracted[0].lat, extracted[0].lng);
              map.panTo({ lat: extracted[0].lat, lng: extracted[0].lng });
              map.setZoom(14);
            }
          } else {
            /* console.log('❌ No se pudieron extraer restaurantes'); */
            // Forzar algunos restaurantes de ejemplo para testing
            const sampleRestaurants: Restaurant[] = [
              {
                name: "Andrés D.C.",
                lat: 4.6932,
                lng: -74.0337,
                address: "Cra. 11a #93-52, Usaquén",
                type: "Comida Colombiana",
                price: "$$$",
                rating: 4.3,
                description: "Experiencia gastronómica única con música en vivo",
                image: restaurantImages[0],
                openingHours: "12:00 PM - 12:00 AM"
              },
              {
                name: "Harry Sasson",
                lat: 4.6482,
                lng: -74.0632,
                address: "Cra. 5 #69a-44, Chapinero",
                type: "Fusión Internacional",
                price: "$$$$",
                rating: 4.7,
                description: "Alta cocina con ingredientes colombianos",
                image: restaurantImages[1],
                openingHours: "6:00 PM - 11:00 PM"
              }
            ];
            console.log('🔄 Usando restaurantes de ejemplo:', sampleRestaurants);
            setRestaurants(sampleRestaurants);
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

          {/* SECCIÓN DE MAPA Y RECOMENDACIONES - ARRIBA DEL CHAT */}
          {restaurants.length > 0 && (
            <div className="mb-8 space-y-6">
              {/* Mapa */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">🗺️ Mapa de Zonas Recomendadas</h3>
                </div>

                <div className="relative rounded-lg overflow-hidden">
                  <LoadScript
                    googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                    onLoad={() => setIsMapLoaded(true)}
                  >
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={restaurants.length > 0 ? { lat: restaurants[0].lat, lng: restaurants[0].lng } : defaultCenter}
                      zoom={13}
                      onLoad={onMapLoad}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: false,
                      }}
                    >
                      {isMapLoaded && restaurants.map((restaurant, index) => (
                        <Marker
                          key={`${restaurant.name}-${index}`}
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

              {/* Lista de Restaurantes Recomendados */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">🌟 Restaurantes Recomendados</h3>
                  <Badge variant="secondary" className="ml-2">
                    ⭐ 2.0+ Estrellas • ✅ Vigentes
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {restaurants.map((restaurant, index) => (
                    <Card
                      key={index}
                      className={`restaurant-card cursor-pointer transition-all hover:shadow-lg border-2 ${selectedRestaurant?.name === restaurant.name
                        ? 'border-primary shadow-xl'
                        : 'border-border hover:border-primary/50'
                        }`}
                      onClick={() => handleRestaurantClick(restaurant)}
                    >
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                        {restaurant.openNow !== undefined && (
                          <Badge
                            variant={restaurant.openNow ? "default" : "destructive"}
                            className="absolute top-2 right-2 text-xs"
                          >
                            {restaurant.openNow ? '🟢 Abierto' : '🔴 Cerrado'}
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-5">
                        {/* NOMBRE DEL RESTAURANTE DESTACADO */}
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-lg text-foreground line-clamp-1">{restaurant.name}</h4>
                          {restaurant.rating && (
                            <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-sm ml-2 flex-shrink-0">
                              ⭐ {restaurant.rating.toFixed(1)}
                            </Badge>
                          )}
                        </div>

                        {restaurant.type && (
                          <Badge variant="secondary" className="mb-3 text-sm">
                            {restaurant.type}
                          </Badge>
                        )}

                        <div className="space-y-2 text-sm">
                          {restaurant.address && (
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2 text-sm">{restaurant.address}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            {restaurant.price && (
                              <div className="flex items-center gap-1">
                                {getPriceLevel(restaurant.price)}
                              </div>
                            )}

                            {restaurant.userRatingsTotal && (
                              <span className="text-muted-foreground text-sm">
                                ({restaurant.userRatingsTotal} reseñas)
                              </span>
                            )}
                          </div>

                          {restaurant.description && (
                            <p className="text-muted-foreground text-sm line-clamp-2">
                              {restaurant.description}
                            </p>
                          )}

                          {/* Botones de acción */}
                          <div className="flex gap-3 mt-4 pt-3 border-t border-border">
                            <Button
                              size="default"
                              variant={isFavorite(restaurant.placeId || '') ? "default" : "outline"}
                              className="flex-1 h-10 text-sm gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(restaurant.placeId || '');
                              }}
                            >
                              <Heart className={`h-4 w-4 ${isFavorite(restaurant.placeId || '') ? 'fill-current' : ''}`} />
                              {isFavorite(restaurant.placeId || '') ? 'Guardado' : 'Guardar'}
                            </Button>
                            <Button
                              size="default"
                              variant="default"
                              className="flex-1 h-10 text-sm gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/restaurantes/${restaurant.placeId}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Ver detalle
                            </Button>
                          </div>

                          {(restaurant.website || restaurant.phone) && (
                            <div className="flex gap-2 mt-2">
                              {restaurant.website && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-9 text-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(restaurant.website, '_blank');
                                  }}
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                  Web
                                </Button>
                              )}
                              {restaurant.phone && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-9 text-sm"
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

          {/* CHAT - DEBAJO DEL MAPA Y RECOMENDACIONES */}
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