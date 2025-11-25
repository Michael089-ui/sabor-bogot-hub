import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Correo electrónico inválido" })
    .max(255, { message: "El correo debe tener menos de 255 caracteres" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(100, { message: "La contraseña debe tener menos de 100 caracteres" }),
});

export const registroSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre debe tener menos de 100 caracteres" }),
  apellidos: z
    .string()
    .trim()
    .min(2, { message: "Los apellidos deben tener al menos 2 caracteres" })
    .max(100, { message: "Los apellidos deben tener menos de 100 caracteres" }),
  email: z
    .string()
    .trim()
    .email({ message: "Correo electrónico inválido" })
    .max(255, { message: "El correo debe tener menos de 255 caracteres" }),
  telefono: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, { message: "Ingresa un número de teléfono válido de 10 dígitos" })
    .length(10, { message: "El teléfono debe tener exactamente 10 dígitos" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .max(100, { message: "La contraseña debe tener menos de 100 caracteres" }),
  confirmPassword: z
    .string()
    .min(6, { message: "Confirma tu contraseña" }),
  tipo_comida: z
    .array(z.string())
    .min(1, { message: "Selecciona al menos un tipo de comida" }),
  presupuesto: z
    .string()
    .min(1, { message: "Selecciona un presupuesto" }),
  id_localidad: z
    .string()
    .min(1, { message: "Selecciona una localidad" }),
  id_barrio: z
    .string()
    .min(1, { message: "Selecciona un barrio" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistroFormData = z.infer<typeof registroSchema>;
