// Configuración del sitio de reseñas de Los Sonorenses Parrilla.
// Este es el único archivo que normalmente necesitas editar.
window.CONFIG = {
  negocio: "Los Sonorenses Parrilla",
  telefono: "+52 222 403 8215",

  // ID de Google Maps de "Los Sonorenses Parrilla"
  // (Lateral Sur, Recta a Cholula 1002, Santiago Momoxpan, San Andrés Cholula).
  googlePlaceId: "ChIJx97Phd3Gz4URxQ35fzo0TQo",

  // Desde cuántas estrellas se manda al cliente a Google (4 = 4 y 5 estrellas).
  calificacionMinimaGoogle: 4,

  // Segundos que se muestra el "gracias" antes de abrir Google.
  segundosAntesDeGoogle: 3,

  // false: solo quien califica alto ve el enlace de Google (lo que pediste).
  // true:  a quien califica bajo también se le ofrece un enlace discreto a Google.
  //        Google prohíbe pedir reseñas solo a clientes contentos ("review gating");
  //        con true el sitio cumple esa política. Lee el README.
  ofrecerGoogleATodos: false,

  // Datos de Supabase (Project Settings → API). Si los dejas vacíos el sitio
  // funciona en "modo demostración" y guarda las reseñas solo en este navegador.
  supabaseUrl: "",
  supabaseAnonKey: "",

  categoriasProblema: [
    "Comida",
    "Servicio / atención",
    "Tiempo de espera",
    "Limpieza",
    "Precio",
    "Ambiente / ruido",
    "Reservación",
    "Estacionamiento / valet",
    "Otro",
  ],
};
