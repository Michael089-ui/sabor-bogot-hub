import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  nombre: string;
  confirmationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nombre, confirmationUrl }: ConfirmationEmailRequest = await req.json();

    console.log("Sending confirmation email to:", email);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sabor Capital <onboarding@resend.dev>",
        to: [email],
        subject: "Confirma tu cuenta en Sabor Capital",
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
              .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>¡Bienvenido a Sabor Capital!</h1>
              </div>
              <div class="content">
                <p>Hola ${nombre},</p>
                <p>Gracias por registrarte en Sabor Capital. Para completar tu registro y acceder a la plataforma, por favor confirma tu correo electrónico haciendo clic en el botón de abajo:</p>
                <center>
                  <a href="${confirmationUrl}" class="button">Confirmar mi cuenta</a>
                </center>
                <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #667eea;">${confirmationUrl}</p>
                <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
                <p>¡Esperamos que disfrutes descubriendo los mejores restaurantes de la capital!</p>
                <p>Saludos,<br><strong>El equipo de Sabor Capital</strong></p>
              </div>
              <div class="footer">
                <p>&copy; 2025 Sabor Capital. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
        </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
