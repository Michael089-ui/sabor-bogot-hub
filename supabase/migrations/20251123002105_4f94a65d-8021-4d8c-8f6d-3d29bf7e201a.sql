-- Crear tabla de localidades de Bogotá
CREATE TABLE public.localidad (
  id_localidad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER UNIQUE NOT NULL,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de barrios
CREATE TABLE public.barrio (
  id_barrio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  id_localidad UUID NOT NULL REFERENCES public.localidad(id_localidad) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(nombre, id_localidad)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_barrio_localidad ON public.barrio(id_localidad);
CREATE INDEX idx_barrio_nombre ON public.barrio(nombre);

-- Habilitar RLS
ALTER TABLE public.localidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barrio ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (lectura pública para usuarios autenticados)
CREATE POLICY "Lectura pública de localidades"
  ON public.localidad FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lectura pública de barrios"
  ON public.barrio FOR SELECT
  TO authenticated
  USING (true);

-- Insertar las 20 localidades de Bogotá
INSERT INTO public.localidad (numero, nombre) VALUES
  (1, 'Usaquén'),
  (2, 'Chapinero'),
  (3, 'Santa Fe'),
  (4, 'San Cristóbal'),
  (5, 'Usme'),
  (6, 'Tunjuelito'),
  (7, 'Bosa'),
  (8, 'Kennedy'),
  (9, 'Fontibón'),
  (10, 'Engativá'),
  (11, 'Suba'),
  (12, 'Barrios Unidos'),
  (13, 'Teusaquillo'),
  (14, 'Los Mártires'),
  (15, 'Antonio Nariño'),
  (16, 'Puente Aranda'),
  (17, 'La Candelaria'),
  (18, 'Rafael Uribe Uribe'),
  (19, 'Ciudad Bolívar'),
  (20, 'Sumapaz');

-- Insertar barrios por localidad

-- USAQUÉN (Localidad 1)
INSERT INTO public.barrio (nombre, id_localidad) 
SELECT 'Pasadena', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'San Cristóbal Norte', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Toberín', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Los Cedros', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Usaquén', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Country Club', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Santa Bárbara', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'La Calleja', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'San Patricio', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Las Margaritas', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Cedritos', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Contador', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'La Uribe', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'San Antonio Norte', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Verbenal', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Santa Ana', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Buenavista', id_localidad FROM localidad WHERE numero = 1
UNION ALL SELECT 'Tibabita', id_localidad FROM localidad WHERE numero = 1

-- CHAPINERO (Localidad 2)
UNION ALL SELECT 'Chicó Lago', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'El Refugio', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'San Isidro - Patios', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'Pardo Rubio', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'Chapinero', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'El Nogal', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'Chicó Norte', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'Quinta Camacho', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'Los Rosales', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'Porciúncula', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'San Luis', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'Sagrado Corazón', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'Marly', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'Chapinero Norte', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'El Retiro', id_localidad FROM localidad WHERE numero = 2
UNION ALL SELECT 'Chicó Norte II', id_localidad FROM localidad WHERE numero = 2

-- SANTA FE (Localidad 3)
UNION ALL SELECT 'Sagrado Corazón', id_localidad FROM localidad WHERE numero = 3
UNION ALL SELECT 'La Macarena', id_localidad FROM localidad WHERE numero = 3
UNION ALL SELECT 'Las Nieves', id_localidad FROM localidad WHERE numero = 3
UNION ALL SELECT 'Las Cruces', id_localidad FROM localidad WHERE numero = 3
UNION ALL SELECT 'Lourdes', id_localidad FROM localidad WHERE numero = 3
UNION ALL SELECT 'Egipto', id_localidad FROM localidad WHERE numero = 3
UNION ALL SELECT 'La Perseverancia', id_localidad FROM localidad WHERE numero = 3
UNION ALL SELECT 'San Bernardo', id_localidad FROM localidad WHERE numero = 3
UNION ALL SELECT 'Santa Inés', id_localidad FROM localidad WHERE numero = 3
UNION ALL SELECT 'Las Aguas', id_localidad FROM localidad WHERE numero = 3
UNION ALL SELECT 'Ramírez', id_localidad FROM localidad WHERE numero = 3
UNION ALL SELECT 'San Diego', id_localidad FROM localidad WHERE numero = 3

-- SAN CRISTÓBAL (Localidad 4)
UNION ALL SELECT 'San Blas', id_localidad FROM localidad WHERE numero = 4
UNION ALL SELECT '20 de Julio', id_localidad FROM localidad WHERE numero = 4
UNION ALL SELECT 'La Gloria', id_localidad FROM localidad WHERE numero = 4
UNION ALL SELECT 'Los Libertadores', id_localidad FROM localidad WHERE numero = 4
UNION ALL SELECT 'Sosiego', id_localidad FROM localidad WHERE numero = 4
UNION ALL SELECT 'San Cristóbal Sur', id_localidad FROM localidad WHERE numero = 4
UNION ALL SELECT 'Ramajal', id_localidad FROM localidad WHERE numero = 4
UNION ALL SELECT 'San Rafael', id_localidad FROM localidad WHERE numero = 4
UNION ALL SELECT 'Guacamayas', id_localidad FROM localidad WHERE numero = 4
UNION ALL SELECT 'Juan Rey', id_localidad FROM localidad WHERE numero = 4
UNION ALL SELECT 'Valles de Cafam', id_localidad FROM localidad WHERE numero = 4

-- USME (Localidad 5)
UNION ALL SELECT 'Comuneros', id_localidad FROM localidad WHERE numero = 5
UNION ALL SELECT 'Alfonso López', id_localidad FROM localidad WHERE numero = 5
UNION ALL SELECT 'Gran Yomasa', id_localidad FROM localidad WHERE numero = 5
UNION ALL SELECT 'Danubio', id_localidad FROM localidad WHERE numero = 5
UNION ALL SELECT 'Parque Entre Nubes', id_localidad FROM localidad WHERE numero = 5
UNION ALL SELECT 'La Flora', id_localidad FROM localidad WHERE numero = 5
UNION ALL SELECT 'Usme Centro', id_localidad FROM localidad WHERE numero = 5
UNION ALL SELECT 'Ciudad Usme', id_localidad FROM localidad WHERE numero = 5
UNION ALL SELECT 'El Virrey', id_localidad FROM localidad WHERE numero = 5
UNION ALL SELECT 'La Andrea', id_localidad FROM localidad WHERE numero = 5

-- TUNJUELITO (Localidad 6)
UNION ALL SELECT 'Tunal', id_localidad FROM localidad WHERE numero = 6
UNION ALL SELECT 'Venecia', id_localidad FROM localidad WHERE numero = 6
UNION ALL SELECT 'Tunjuelito', id_localidad FROM localidad WHERE numero = 6
UNION ALL SELECT 'Abraham Lincoln', id_localidad FROM localidad WHERE numero = 6
UNION ALL SELECT 'Nuevo Muzú', id_localidad FROM localidad WHERE numero = 6
UNION ALL SELECT 'San Benito', id_localidad FROM localidad WHERE numero = 6
UNION ALL SELECT 'El Carmen', id_localidad FROM localidad WHERE numero = 6

-- BOSA (Localidad 7)
UNION ALL SELECT 'Apogeo', id_localidad FROM localidad WHERE numero = 7
UNION ALL SELECT 'Bosa Occidental', id_localidad FROM localidad WHERE numero = 7
UNION ALL SELECT 'Bosa Central', id_localidad FROM localidad WHERE numero = 7
UNION ALL SELECT 'El Porvenir', id_localidad FROM localidad WHERE numero = 7
UNION ALL SELECT 'Tintal Sur', id_localidad FROM localidad WHERE numero = 7
UNION ALL SELECT 'San Bernardino', id_localidad FROM localidad WHERE numero = 7
UNION ALL SELECT 'La Libertad', id_localidad FROM localidad WHERE numero = 7
UNION ALL SELECT 'Laureles', id_localidad FROM localidad WHERE numero = 7
UNION ALL SELECT 'Bosa Piamonte', id_localidad FROM localidad WHERE numero = 7

-- KENNEDY (Localidad 8)
UNION ALL SELECT 'Kennedy Central', id_localidad FROM localidad WHERE numero = 8
UNION ALL SELECT 'Timiza', id_localidad FROM localidad WHERE numero = 8
UNION ALL SELECT 'Carvajal', id_localidad FROM localidad WHERE numero = 8
UNION ALL SELECT 'Américas', id_localidad FROM localidad WHERE numero = 8
UNION ALL SELECT 'Bavaria', id_localidad FROM localidad WHERE numero = 8
UNION ALL SELECT 'Castilla', id_localidad FROM localidad WHERE numero = 8
UNION ALL SELECT 'Tintal Norte', id_localidad FROM localidad WHERE numero = 8
UNION ALL SELECT 'Patio Bonito', id_localidad FROM localidad WHERE numero = 8
UNION ALL SELECT 'Las Margaritas', id_localidad FROM localidad WHERE numero = 8
UNION ALL SELECT 'Corabastos', id_localidad FROM localidad WHERE numero = 8
UNION ALL SELECT 'Gran Britalia', id_localidad FROM localidad WHERE numero = 8
UNION ALL SELECT 'Clase', id_localidad FROM localidad WHERE numero = 8

-- FONTIBÓN (Localidad 9)
UNION ALL SELECT 'Fontibón', id_localidad FROM localidad WHERE numero = 9
UNION ALL SELECT 'Fontibón - San Pablo', id_localidad FROM localidad WHERE numero = 9
UNION ALL SELECT 'Zona Franca', id_localidad FROM localidad WHERE numero = 9
UNION ALL SELECT 'Ciudad Salitre Occidental', id_localidad FROM localidad WHERE numero = 9
UNION ALL SELECT 'Granjas de Techo', id_localidad FROM localidad WHERE numero = 9
UNION ALL SELECT 'Modelia', id_localidad FROM localidad WHERE numero = 9
UNION ALL SELECT 'Capellanía', id_localidad FROM localidad WHERE numero = 9
UNION ALL SELECT 'Aeropuerto El Dorado', id_localidad FROM localidad WHERE numero = 9
UNION ALL SELECT 'Villemar', id_localidad FROM localidad WHERE numero = 9

-- ENGATIVÁ (Localidad 10)
UNION ALL SELECT 'Las Ferias', id_localidad FROM localidad WHERE numero = 10
UNION ALL SELECT 'Minuto de Dios', id_localidad FROM localidad WHERE numero = 10
UNION ALL SELECT 'Boyacá Real', id_localidad FROM localidad WHERE numero = 10
UNION ALL SELECT 'Santa Cecilia', id_localidad FROM localidad WHERE numero = 10
UNION ALL SELECT 'Bolivia', id_localidad FROM localidad WHERE numero = 10
UNION ALL SELECT 'Engativá', id_localidad FROM localidad WHERE numero = 10
UNION ALL SELECT 'Jardín Botánico', id_localidad FROM localidad WHERE numero = 10
UNION ALL SELECT 'Álamos', id_localidad FROM localidad WHERE numero = 10
UNION ALL SELECT 'Garcés Navas', id_localidad FROM localidad WHERE numero = 10
UNION ALL SELECT 'Normandía', id_localidad FROM localidad WHERE numero = 10
UNION ALL SELECT 'La Floresta', id_localidad FROM localidad WHERE numero = 10
UNION ALL SELECT 'Quirigua', id_localidad FROM localidad WHERE numero = 10

-- SUBA (Localidad 11)
UNION ALL SELECT 'La Alhambra', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'Casa Blanca Suba', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'Niza', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'La Floresta', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'Suba', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'El Rincón', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'Tibabuyes', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'Prado', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'Lisboa', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'Britalia', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'San José de Bavaria', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'Suba Centro', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'El Poa', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'Colina Campestre', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'Compartir', id_localidad FROM localidad WHERE numero = 11
UNION ALL SELECT 'Casablanca', id_localidad FROM localidad WHERE numero = 11

-- BARRIOS UNIDOS (Localidad 12)
UNION ALL SELECT 'Los Andes', id_localidad FROM localidad WHERE numero = 12
UNION ALL SELECT '12 de Octubre', id_localidad FROM localidad WHERE numero = 12
UNION ALL SELECT 'Los Alcázares', id_localidad FROM localidad WHERE numero = 12
UNION ALL SELECT 'Parque El Salitre', id_localidad FROM localidad WHERE numero = 12
UNION ALL SELECT 'San Fernando', id_localidad FROM localidad WHERE numero = 12
UNION ALL SELECT 'Simón Bolívar', id_localidad FROM localidad WHERE numero = 12
UNION ALL SELECT 'Rionegro', id_localidad FROM localidad WHERE numero = 12
UNION ALL SELECT 'Santa Sofía', id_localidad FROM localidad WHERE numero = 12

-- TEUSAQUILLO (Localidad 13)
UNION ALL SELECT 'Galerías', id_localidad FROM localidad WHERE numero = 13
UNION ALL SELECT 'Teusaquillo', id_localidad FROM localidad WHERE numero = 13
UNION ALL SELECT 'Parque Simón Bolívar - CAN', id_localidad FROM localidad WHERE numero = 13
UNION ALL SELECT 'La Esmeralda', id_localidad FROM localidad WHERE numero = 13
UNION ALL SELECT 'Quinta Paredes', id_localidad FROM localidad WHERE numero = 13
UNION ALL SELECT 'Ciudad Salitre Oriental', id_localidad FROM localidad WHERE numero = 13
UNION ALL SELECT 'Acevedo Tejada', id_localidad FROM localidad WHERE numero = 13
UNION ALL SELECT 'Rafael Núñez', id_localidad FROM localidad WHERE numero = 13
UNION ALL SELECT 'Quesada', id_localidad FROM localidad WHERE numero = 13
UNION ALL SELECT 'Nicolás de Federmán', id_localidad FROM localidad WHERE numero = 13

-- LOS MÁRTIRES (Localidad 14)
UNION ALL SELECT 'Santa Isabel', id_localidad FROM localidad WHERE numero = 14
UNION ALL SELECT 'La Favorita', id_localidad FROM localidad WHERE numero = 14
UNION ALL SELECT 'La Sabana', id_localidad FROM localidad WHERE numero = 14
UNION ALL SELECT 'Voto Nacional', id_localidad FROM localidad WHERE numero = 14
UNION ALL SELECT 'Ricaurte', id_localidad FROM localidad WHERE numero = 14
UNION ALL SELECT 'Paloquemao', id_localidad FROM localidad WHERE numero = 14
UNION ALL SELECT 'El Vergel', id_localidad FROM localidad WHERE numero = 14
UNION ALL SELECT 'Usatama', id_localidad FROM localidad WHERE numero = 14

-- ANTONIO NARIÑO (Localidad 15)
UNION ALL SELECT 'Restrepo', id_localidad FROM localidad WHERE numero = 15
UNION ALL SELECT 'Ciudad Jardín Sur', id_localidad FROM localidad WHERE numero = 15
UNION ALL SELECT 'Antonio Nariño', id_localidad FROM localidad WHERE numero = 15
UNION ALL SELECT 'Santander', id_localidad FROM localidad WHERE numero = 15
UNION ALL SELECT 'Luna Park', id_localidad FROM localidad WHERE numero = 15
UNION ALL SELECT 'San Antonio', id_localidad FROM localidad WHERE numero = 15

-- PUENTE ARANDA (Localidad 16)
UNION ALL SELECT 'Puente Aranda', id_localidad FROM localidad WHERE numero = 16
UNION ALL SELECT 'San Rafael', id_localidad FROM localidad WHERE numero = 16
UNION ALL SELECT 'La Guaca', id_localidad FROM localidad WHERE numero = 16
UNION ALL SELECT 'Zona Industrial', id_localidad FROM localidad WHERE numero = 16
UNION ALL SELECT 'Muzu', id_localidad FROM localidad WHERE numero = 16
UNION ALL SELECT 'Ciudad Montes', id_localidad FROM localidad WHERE numero = 16
UNION ALL SELECT 'Cundinamarca', id_localidad FROM localidad WHERE numero = 16
UNION ALL SELECT 'Veraguas', id_localidad FROM localidad WHERE numero = 16

-- LA CANDELARIA (Localidad 17)
UNION ALL SELECT 'La Candelaria', id_localidad FROM localidad WHERE numero = 17
UNION ALL SELECT 'Las Aguas', id_localidad FROM localidad WHERE numero = 17
UNION ALL SELECT 'Santa Bárbara', id_localidad FROM localidad WHERE numero = 17
UNION ALL SELECT 'Belén', id_localidad FROM localidad WHERE numero = 17
UNION ALL SELECT 'Centro Administrativo', id_localidad FROM localidad WHERE numero = 17

-- RAFAEL URIBE URIBE (Localidad 18)
UNION ALL SELECT 'San José Sur', id_localidad FROM localidad WHERE numero = 18
UNION ALL SELECT 'Quiroga', id_localidad FROM localidad WHERE numero = 18
UNION ALL SELECT 'Marco Fidel Suárez', id_localidad FROM localidad WHERE numero = 18
UNION ALL SELECT 'Marruecos', id_localidad FROM localidad WHERE numero = 18
UNION ALL SELECT 'Diana Turbay', id_localidad FROM localidad WHERE numero = 18
UNION ALL SELECT 'Inglés', id_localidad FROM localidad WHERE numero = 18
UNION ALL SELECT 'Claret', id_localidad FROM localidad WHERE numero = 18
UNION ALL SELECT 'Danubio Azul', id_localidad FROM localidad WHERE numero = 18

-- CIUDAD BOLÍVAR (Localidad 19)
UNION ALL SELECT 'Lucero', id_localidad FROM localidad WHERE numero = 19
UNION ALL SELECT 'El Tesoro', id_localidad FROM localidad WHERE numero = 19
UNION ALL SELECT 'Jerusalén', id_localidad FROM localidad WHERE numero = 19
UNION ALL SELECT 'Arborizadora', id_localidad FROM localidad WHERE numero = 19
UNION ALL SELECT 'San Francisco', id_localidad FROM localidad WHERE numero = 19
UNION ALL SELECT 'Ismael Perdomo', id_localidad FROM localidad WHERE numero = 19
UNION ALL SELECT 'El Mochuelo', id_localidad FROM localidad WHERE numero = 19
UNION ALL SELECT 'Montebello', id_localidad FROM localidad WHERE numero = 19
UNION ALL SELECT 'Quiba', id_localidad FROM localidad WHERE numero = 19

-- SUMAPAZ (Localidad 20)
UNION ALL SELECT 'Betania', id_localidad FROM localidad WHERE numero = 20
UNION ALL SELECT 'Nazareth', id_localidad FROM localidad WHERE numero = 20
UNION ALL SELECT 'San Juan', id_localidad FROM localidad WHERE numero = 20
UNION ALL SELECT 'Ariguaní', id_localidad FROM localidad WHERE numero = 20;

-- Modificar tabla usuario para agregar campos de localidad y barrio
ALTER TABLE public.usuario 
  ADD COLUMN id_localidad UUID REFERENCES public.localidad(id_localidad),
  ADD COLUMN id_barrio UUID REFERENCES public.barrio(id_barrio);