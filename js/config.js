// Configuración del sitio de reseñas de Los Sonorenses Parrilla.
// Este es el único archivo que normalmente necesitas editar.
window.CONFIG = {
  negocio: "Los Sonorenses Parrilla",
  telefono: "+52 222 403 8215",

  // ID de Google Maps de "Los Sonorenses Parrilla"
  // (Lateral Sur, Recta a Cholula 1002, Santiago Momoxpan, San Andrés Cholula).
  googlePlaceId: "ChIJx97Phd3Gz4URxQ35fzo0TQo",

  // Desde cuántas estrellas se manda al cliente directo a Google (4 = 4 y 5 estrellas).
  calificacionMinimaGoogle: 4,

  // false: solo quien califica alto ve el enlace de Google (lo que pediste).
  // true:  a quien califica bajo también se le ofrece un enlace discreto a Google.
  //        Google prohíbe pedir reseñas solo a clientes contentos ("review gating");
  //        con true el sitio cumple esa política. Lee el README.
  ofrecerGoogleATodos: false,

  // Datos de Supabase (Project Settings → API Keys). Si los dejas vacíos el sitio
  // funciona en "modo demostración" y guarda las reseñas solo en este navegador.
  supabaseUrl: "",
  supabaseAnonKey: "",

  // Nombres del personal de piso. Si pones nombres, el cliente solo los toca;
  // si la lista está vacía, puede escribir el nombre.
  meseros: [],

  // Opciones que ve el cliente cuando califica con menos de 4 estrellas.
  // Primero elige la categoría y luego lo que pasó exactamente.
  problemas: [
    {
      categoria: "Comida",
      icono: "🍖",
      opciones: [
        "Llegó fría",
        "La carne no tenía el término que pedí",
        "No tenía buen sabor",
        "La porción fue pequeña",
        "Faltó algo de mi orden",
        "Encontré algo extraño en el plato",
      ],
    },
    {
      categoria: "Servicio",
      icono: "🙋",
      opciones: [
        "El mesero estuvo poco atento",
        "Nos trataron de mala manera",
        "Se equivocaron en la orden",
        "Tardaron en atendernos",
      ],
    },
    {
      categoria: "Tiempo de espera",
      icono: "⏱️",
      opciones: [
        "Tardaron en darnos mesa",
        "La comida tardó mucho",
        "Las bebidas tardaron mucho",
        "Tardaron en traer la cuenta",
      ],
    },
    {
      categoria: "Limpieza",
      icono: "🧽",
      opciones: ["Mesa sucia", "Baños sucios", "Cubiertos o vasos sucios"],
    },
    {
      categoria: "Cuenta / precio",
      icono: "💵",
      opciones: [
        "Me cobraron de más",
        "Muy caro para lo que recibí",
        "Problema al pagar con tarjeta",
      ],
    },
    {
      categoria: "Ambiente",
      icono: "🎶",
      opciones: [
        "Música muy fuerte",
        "Mucho ruido",
        "Hacía mucho calor o frío",
        "Mucho humo",
      ],
    },
    {
      categoria: "Reservación",
      icono: "📅",
      opciones: [
        "No respetaron mi reservación",
        "Esperamos aunque teníamos reservación",
        "No contestaron el teléfono",
      ],
    },
    {
      categoria: "Estacionamiento / valet",
      icono: "🚗",
      opciones: ["No había lugar", "El valet tardó mucho", "Mi auto sufrió un daño"],
    },
    {
      categoria: "Otro",
      icono: "✏️",
      opciones: [],
    },
  ],
};
