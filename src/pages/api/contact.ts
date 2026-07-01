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

    const response = await fetch('https://api.brevo.com/v3/contacts', {
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
        listIds: [1], // Update with actual list ID if needed
        updateEnabled: true
      })
    });

    if (response.ok) {
      return new Response(
        JSON.stringify({ message: '¡Gracias! Tu lugar ha sido pre-registrado.' }),
        { status: 200 }
      );
    } else {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ message: 'Error en el servidor de correos.', details: errorData }),
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
