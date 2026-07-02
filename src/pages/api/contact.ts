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

    if (!BREVO_API_KEY) {
      console.warn('BREVO_API_KEY no configurada. Simulando éxito.');
      return new Response(
        JSON.stringify({ message: 'Lead recibido (Modo Simulación).' }),
        { status: 200 }
      );
    }

    // 1. Create/Update Contact in Brevo
    const contactResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          NOMBRE: name,
          TELEFONO: phone,
          ORIGEN: 'Landing Europa con Disney 2026'
        },
        listIds: [1],
        updateEnabled: true
      })
    });

    // 2. Send Transactional Email Notification
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
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

    if (contactResponse.ok || emailResponse.ok) {
      return new Response(
        JSON.stringify({ message: '¡Gracias! Tu lugar ha sido pre-registrado y el equipo ha sido notificado.' }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({ message: 'Error en la integración con Brevo.' }),
        { status: 500 }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Error procesando la solicitud.' }),
      { status: 500 }
    );
  }
};
