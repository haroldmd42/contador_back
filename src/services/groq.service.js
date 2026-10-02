import Groq from "groq-sdk";

const FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "groq/compound",
  "qwen/qwen3.6-27b"
];

async function callGroqWithFallback(prompt, temperature = 0.3) {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  let lastError = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature,
        messages: [{ role: "user", content: prompt }],
      });

      let content = completion.choices[0]?.message?.content || "";
      // Clean thinking tags if present
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      if (content) return content;
    } catch (err) {
      console.warn(`[Groq AI Warning] Model ${model} failed: ${err.message}. Retrying fallback model...`);
      lastError = err;
    }
  }

  throw new Error(`Error en el servicio de IA (Groq): ${lastError ? lastError.message : 'No se pudo generar respuesta'}`);
}

export async function generateGherkin(userStory, additionalData) {
  const prompt = `
Actúa como un Lead QA Engineer Senior con más de 20 años de experiencia en análisis funcional, diseño de pruebas, automatización y aseguramiento de calidad de software.
Tu objetivo es generar la checklist de verificación y los casos de prueba para la Historia de Usuario (HU) y datos proporcionados, siguiendo con exactitud el estándar técnico utilizado en el proyecto.

---

### PROCESO DE ANÁLISIS INTERNO (NO mostrar en la respuesta final)
1. Analiza la Historia de Usuario y los Datos Adicionales (diccionarios de datos, especificaciones de campos, mockups, reglas de negocio y criterios de aceptación).
2. Identifica:
   * Roles involucrados y permisos.
   * Criterios de aceptación explícitos e implícitos (cada criterio de aceptación debe estar cubierto).
   * Reglas de negocio críticas y condiciones lógicas.
   * Atributos y campos: obligatoriedad, tipo de dato, longitudes mínimas/máximas, formatos y dependencias.
   * Flujos principales (Happy Path), flujos de error críticos, flujos negativos y validaciones bloqueantes.
   * Manejo de UI, estados de botones, modales, confirmaciones, cancelaciones y navegación.
   * Seguridad, privacidad de datos y consistencia/integridad relacional.
   * Corner cases relevantes.
3. Reglas de calidad:
   * No inventar funcionalidades ni reglas fuera del contexto de la HU y sus datos adicionales.
   * Los resultados deben ser observables y los escenarios ejecutables.
   * No generar escenarios redundantes o duplicados.
   * Mantener trazabilidad directa con los criterios de aceptación.

---

### REGLAS DE ESTRUCTURA Y FORMATO

Debes entregar ÚNICAMENTE el resultado en formato Markdown claro, estructurado con el encabezado y las dos tablas descritas a continuación, listas para ser copiadas y pegadas directamente en una hoja de cálculo de Excel:

---

#### 1. ENCABEZADO DE LA HISTORIA
- **Título:** \`[ID_HU] - [Título descriptivo de la HU]\`
(Si la historia no incluye un ID explícito, infiere uno apropiado como HU-01 o US-01).

---

#### 2. TABLA 1: CHECKLIST DE CRITERIOS O VERIFICACIÓN
Estructura de columnas:
| Caso | Categoría | Criterio o Verificación | Resultado (Cumple/No cumple) | Observaciones |
| :---: | :--- | :--- | :---: | :--- |

Reglas para la Tabla 1:
1. **Caso:** Numeración incremental (1, 2, 3...).
2. **Categoría:** Clasifica cada verificación estrictamente en una de las siguientes taxonomías:
   - \`Acceso / Permisos\` (acceso permitido según rol, bloqueo de acceso y denegación por URL directa).
   - \`UI / Formularios\` (campos requeridos marcados, botones deshabilitados mientras falten datos obligatorios, selectores, tooltips).
   - \`UI / Listado\` (columnas exactas, estado vacío cuando no hay registros, paginación o scroll).
   - \`UI / Detalle\` (modo solo lectura, carga de datos consistentes, modales).
   - \`Reglas de negocio\` (lógica de negocio específica, condiciones condicionales, límites).
   - \`Datos / Campos\` (campos obligatorios vs opcionales, valores precargados).
   - \`Formato / Longitud\` (longitud mínima/máxima de caracteres, sin espacios al inicio/final, validaciones de formato email, teléfono, archivos, etc.).
   - \`Mensajes / Errores\` (textos exactos de error, advertencias modales y mensajes de éxito entre comillas).
   - \`Navegación\` (redirecciones tras guardar, flujo de "Cancelar" con confirmación y opciones "Cancelar" / "Salir sin guardar").
   - \`Estados / Trazabilidad\` (cambios de estado de registros, auditoría de fecha y usuario que realiza la acción).
   - \`Seguridad / Privacidad\` (enmascaramiento de datos sensibles como contraseñas, no exposición de IDs críticos).
   - \`Integridad / Relación\` (consistencia entre entidades relacionadas, descarte de cambios si se cancela la edición).
3. **Criterio o Verificación:** Redactar en formato Gherkin estándar: \`DADO [contexto/rol], CUANDO [acción/evento], ENTONCES [resultado esperado/validación].\`
4. **Resultado (Cumple/No cumple):** Dejar vacío o con un guion \`-\`.
5. **Observaciones:** Dejar vacío.

---

#### 3. TABLA 2: ENUNCIADOS DE CASOS DE PRUEBA (TEST CASES)
Separada por un título: \`### Enunciados de casos de prueba\`
Estructura de columnas:
| Caso | Categoría | Enunciados Casos de prueba | Resultado (Cumple/No cumple) |
| :---: | :--- | :--- | :---: |

Reglas para la Tabla 2:
1. **Caso:** Numeración incremental (1, 2, 3... o 1.1, 1.2...).
2. **Categoría:** Categoría evaluada coincidente con la taxonomía de la checklist.
3. **Enunciados Casos de prueba:** Detallar escenarios específicos de prueba en formato Gherkin exacto (DADO, CUANDO, ENTONCES):
   - Flujo feliz (creación/edición/visualización exitosa con datos válidos).
   - Flujos negativos (omisión de campos obligatorios, formatos incorrectos, desbordamiento de caracteres, duplicidad de datos únicos).
   - Seguridad y permisos (intento de acceso con rol no autorizado y por URL directa).
   - Manejo de UI y cancelación (cancelar acción, persistencia o descarte temporal de datos).
   - Casos de borde / Corner cases (datos con espacios en extremos, caracteres especiales, listas vacías).
4. **Resultado (Cumple/No cumple):** Dejar vacío o con un guion \`-\`.

---

### INSTRUCCIONES DE SALIDA:
- NO incluyas introducciones, ni saludos, ni explicaciones previas.
- NO incluyas resúmenes, conclusiones o texto posterior fuera de las tablas.
- Comienza directamente con el encabezado de la historia, seguido inmediatamente por la Tabla 1 y luego el título y la Tabla 2.

---

### HISTORIA DE USUARIO A PROCESAR:
${userStory}

${additionalData ? `### DATOS ADICIONALES / DICCIONARIO / ESPECIFICACIONES:\n${additionalData}` : ""}
`;

  return await callGroqWithFallback(prompt);
}

export async function generateTestMatrix(userStory, additionalData) {
  const prompt = `
Actúa como QA Lead Senior. Diseña una Matriz de Casos de Prueba completa basada en la Historia de Usuario.
Genera la respuesta formateada como una tabla o lista estructurada fácil de exportar a Excel con las siguientes columnas:
ID | Título | Precondiciones | Pasos | Resultado Esperado | Prioridad (Alta/Media/Baja) | Tipo (Positiva/Negativa/Borde)

Historia de Usuario:
${userStory}

Datos Adicionales:
${additionalData}
`;

  return await callGroqWithFallback(prompt);
}

export async function generateAutomationScript(userStory, framework = "cypress") {
  const prompt = `
Actúa como QA Automation Lead. Genera un script completo de automatización de pruebas en ${framework === 'playwright' ? 'Playwright (TypeScript)' : 'Cypress (JavaScript)'} basado en la siguiente Historia de Usuario.
Incluye selecciones de elementos con buenas prácticas (data-cy / roles), comandos interactivos, aserciones robustas e instrucciones claras.

Historia de Usuario:
${userStory}
`;

  return await callGroqWithFallback(prompt);
}
