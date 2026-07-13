import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, phone, email } = data;

    if (!name || !phone || !email) {
      return new Response(
        JSON.stringify({ message: 'Todos los campos son requeridos.' }),
        { status: 400 }
      );
    }

    const BREVO_API_KEY = import.meta.env.BREVO_API_KEY;
    const WEBHOOK_URL = import.meta.env.WEBHOOK_URL;

    let emailResponse: Response | null = null;

    if (BREVO_API_KEY) {
      // 1. Send Transactional Email Notification
      emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: { name: "Landing Europa con Disney", email: "noreply@futurite.info" },
          to: [
            { email: "ventas@viajacomoyo.net", name: "Ventas Viaja Como Yo" },
            { email: "dev@futurite.com", name: "Dev Futurite" }
          ],
          subject: `Nuevo Lead: Europa con Disney 2026 - ${name}`,
          htmlContent: `
            <html>
              <body>
                <h1>Nuevo Prerregistro de Viaje</h1>
                <p>Se ha recibido un nuevo lead desde la landing page <strong>Europa con Disney 2026</strong>.</p>
                <hr />
                <p><strong>Nombre:</strong> ${name}</p>
                <p><strong>Teléfono:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <hr />
                <p>Este es un correo automático generado por el sistema.</p>
              </body>
            </html>
          `
        })
      });
    } else {
      console.warn('BREVO_API_KEY no configurada. Saltando integración con Brevo.');
    }

    // 3. Enviar datos al webhook externo n8n
    let webhookResponse: Response | null = null;

    if (WEBHOOK_URL) {
      webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          nombre: name,
          telefono: phone,
          correo: email,
          origen: 'Europa - Disney Paris'
        })
      });
    } else {
      console.warn('WEBHOOK_URL no configurada. No se envió webhook n8n.');
    }

    const brevoSuccess = BREVO_API_KEY
      ? (emailResponse?.ok ?? false)
      : false;

    const webhookSuccess = webhookResponse?.ok ?? false;

    if (!brevoSuccess) {
      console.warn('La integración con Brevo falló o no está configurada.');
    }

    if (!webhookSuccess) {
      console.warn('El webhook n8n devolvió un estado no OK:', webhookResponse?.status);
    }

    if (brevoSuccess && webhookSuccess) {
      return new Response(
        JSON.stringify({ message: '¡Gracias! Tu lugar ha sido pre-registrado y el equipo ha sido notificado.' }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({ message: 'Hubo un problema, por favor intenta de nuevo.' }),
        { status: 500 }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Hubo un problema, por favor intenta de nuevo.' }),
      { status: 500 }
    );
  }
};
