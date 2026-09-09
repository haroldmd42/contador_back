function fixEncoding(obj) {
  if (typeof obj === 'string') {
    try {
      return decodeURIComponent(escape(obj));
    } catch {
      return obj;
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(fixEncoding);
  }

  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        fixEncoding(value),
      ])
    );
  }

  return obj;
}

export function encodeInput(input, type) {
  if (input === undefined || input === null) return '';
  const str = String(input);
  try {
    switch (type) {
      case 'base64':
        return Buffer.from(str, 'utf-8').toString('base64');
      case 'url':
        return encodeURIComponent(str);
      case 'json':
        return JSON.stringify(JSON.parse(str), null, 2);
      default:
        throw new Error('Tipo no soportado');
    }
  } catch (err) {
    throw new Error(`Error al codificar: ${err.message}`);
  }
}

export function decodeInput(input, type) {
  if (input === undefined || input === null) return '';
  const str = String(input);
  try {
    switch (type) {
      case 'base64':
        return Buffer.from(str, 'base64').toString('utf-8');
      case 'url':
        return decodeURIComponent(str);
      case 'json':
        return JSON.stringify(JSON.parse(str), null, 2);
      default:
        throw new Error('Tipo no soportado');
    }
  } catch (err) {
    throw new Error(`Error al decodificar: ${err.message}`);
  }
}

export function cleanWeirdJSON(raw) {
  if (!raw) return '';
  try {
    const input = String(raw).trim();
    const streamPattern = /^\d+:/m;

    if (streamPattern.test(input)) {
      const result = {};

      input
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .forEach((line) => {
          const separator = line.indexOf(':');

          if (separator === -1) return;

          const key = line.substring(0, separator).trim();
          const value = line.substring(separator + 1).trim();

          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        });

      return JSON.stringify(fixEncoding(result), null, 2);
    }

    let cleaned = input;
    const firstBrace = cleaned.indexOf('{');

    if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
    }

    const parsed = JSON.parse(cleaned);
    return JSON.stringify(fixEncoding(parsed), null, 2);
  } catch (err) {
    throw new Error('Debe ingresar una respuesta o JSON válido');
  }
}
