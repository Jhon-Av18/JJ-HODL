// Utilidades compartidas: API de Digimon, niveles, colores del tema y mensajes de error
export const API_URL = 'https://digimon-api.vercel.app/api/digimon';

export const COLORES = {
  fondo: '#0b0f1a',
  panel: '#141b2d',
  borde: '#26324d',
  cian: '#00e5ff',
  naranja: '#ff9100',
  texto: '#e8f1ff',
  gris: '#8aa0c0',
  verde: '#2ee59d',
  rojo: '#ff5470',
};

// Los 6 niveles que usan las mecánicas de la app, de menor a mayor.
// "valor" son las monedas que recibes al liberar un Digimon de ese nivel.
export const NIVELES = [
  { tier: 0, etiqueta: 'Fresh', emoji: '🥚', color: '#9aa7bd', valor: 2 },
  { tier: 1, etiqueta: 'In Training', emoji: '🐣', color: '#4cc9f0', valor: 4 },
  { tier: 2, etiqueta: 'Rookie', emoji: '🌱', color: '#2ee59d', valor: 8 },
  { tier: 3, etiqueta: 'Champion', emoji: '🔥', color: '#ffd166', valor: 16 },
  { tier: 4, etiqueta: 'Ultimate', emoji: '⚡', color: '#c77dff', valor: 32 },
  { tier: 5, etiqueta: 'Mega', emoji: '👑', color: '#ff5470', valor: 64 },
];

// La API trae algunos niveles extra: "Training" se cuenta como In Training y "Armor" como Champion
export const tierDe = (level) => {
  switch (level) {
    case 'Fresh':
      return 0;
    case 'In Training':
    case 'Training':
      return 1;
    case 'Rookie':
      return 2;
    case 'Champion':
    case 'Armor':
      return 3;
    case 'Ultimate':
      return 4;
    case 'Mega':
      return 5;
    default:
      return 2;
  }
};

export const nivelDe = (level) => NIVELES[tierDe(level)];
export const valorDe = (level) => nivelDe(level).valor;

export const alAzar = (lista) => lista[Math.floor(Math.random() * lista.length)];

// Se descarga una sola vez y se guarda en memoria
let cache = null;
export const cargarDigimon = async () => {
  if (cache) return cache;
  const res = await fetch(API_URL);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error('Respuesta inesperada de la API');
  cache = json.filter((d) => d && d.name && d.img && d.level);
  return cache;
};

// Mensajes de error de Firebase Auth en español
export const mensajeAuth = (code) => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.';
    case 'auth/email-already-in-use':
      return 'Ese correo ya está registrado.';
    case 'auth/weak-password':
      return 'La contraseña debe tener mínimo 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento.';
    default:
      return 'Algo salió mal. Intenta de nuevo.';
  }
};