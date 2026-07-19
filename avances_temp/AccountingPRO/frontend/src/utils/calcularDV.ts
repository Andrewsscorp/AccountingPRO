export const calcularDV = (nitStr: string): string => {
  // Limpiamos todo lo que no sea número
  const nitLimpio = nitStr.replace(/\D/g, '');

  if (!nitLimpio || nitLimpio.length === 0) return '';

  const vpri = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let x = 0;
  let y = 0;
  let z = nitLimpio.length;
  let resultado = 0;

  for (let i = 0; i < z; i++) {
    y = parseInt(nitLimpio.charAt(i), 10);
    x += y * vpri[z - 1 - i];
  }

  y = x % 11;
  if (y > 1) {
    resultado = 11 - y;
  } else {
    resultado = y;
  }

  return resultado.toString();
};
