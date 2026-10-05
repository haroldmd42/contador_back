import Groq from "groq-sdk";

const FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b"
];

async function callGroqWithFallback(prompt, temperature = 0.2) {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  let lastError = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature,
        max_tokens: 8192,
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
Actúa como un Lead QA Engineer Senior experto en pruebas funcionales y aseguramiento de calidad de software.
Tu objetivo es generar OBLIGATORIAMENTE DOS TABLAS Markdown completas para la Historia de Usuario (HU) y datos proporcionados:
1. Tabla 1: Checklist de Verificación (Criterios y Reglas principales)
2. Tabla 2: Enunciados de Casos de Prueba (Test Cases detallados con numeración decimal 1.1, 1.2, 2.1... vinculados a cada fuente)

---

### PROCESO DE ANÁLISIS INTERNO (NO mostrar en la respuesta final)
1. Analiza exhaustivamente la Historia de Usuario y los Datos Adicionales (criterios de aceptación AC, reglas de negocio REG, diccionarios de datos y corner cases).
2. Identifica:
   * Cada Criterio de Aceptación (etiquétalos como AC1, AC2, AC3...).
   * Cada Regla de Negocio explícita (etiquétalas como REG1, REG2...).
   * Flujos felices, flujos de error, validaciones de campos obligatorios/formatos y corner cases (CORNER1, CORNER2...).
3. Rigor QA:
   * Es mandatorio generar la Tabla 1 (Checklist) Y la Tabla 2 (Casos de prueba).
   * La Tabla 2 debe desglosar los escenarios de prueba detallados (Happy path, negativos, límites, corner cases) vinculados por numeración decimal a cada caso de la Tabla 1.

---

### FORMATO DE SALIDA OBLIGATORIO

Debes entregar el resultado en dos tablas Markdown claras y listas para ser copiadas o exportadas a Excel:

#### 1. ENCABEZADO DE LA HISTORIA
- **Título:** \`[ID_HU] — [Título descriptivo de la HU]\`
(Si la historia no incluye un ID explícito, infiere uno apropiado como HU-01 o US-01).

---

#### 2. TABLA 1: CHECKLIST DE CRITERIOS O VERIFICACIÓN
Estructura de columnas exacta:
| Caso | Fuente | Criterio o Verificación | Resultado (Cumple/No cumple) | Observaciones |
| :---: | :---: | :--- | :---: | :--- |

Reglas para la Tabla 1:
1. **Caso:** Numeración incremental (1, 2, 3, 4...).
2. **Fuente:** Código de la fuente evaluada: \`AC1\`, \`AC2\`, \`AC3\`... (Criterios de Aceptación), \`REG1\`, \`REG2\`... (Reglas de Negocio) o categoría si no hay código.
3. **Criterio o Verificación:** Redactar en formato Gherkin estándar usando \`<br>\` para separar las cláusulas:
   \`DADO [contexto/rol]<br>CUANDO [acción/evento]<br>ENTONCES [resultado esperado/validación]\`
4. **Resultado (Cumple/No cumple):** Dejar un guion \`-\` o vacío.
5. **Observaciones:** Dejar vacío o con un guion \`-\`.

---

#### 3. TABLA 2: ENUNCIADOS DE CASOS DE PRUEBA (TEST CASES)
Separada OBLIGATORIAMENTE por este título exacto:
### Enunciados de casos de prueba

Estructura de columnas exacta:
| Caso | Fuente | Enunciados Casos de prueba | Resultado (Cumple/No cumple) |
| :---: | :---: | :--- | :---: |

Reglas para la Tabla 2:
1. **Caso:** Numeración decimal vinculada al número de Caso de la Tabla 1:
   - Para Caso 1 (\`AC1\`): Casos \`1.1\`, \`1.2\`...
   - Para Caso 2 (\`AC2\`): Casos \`2.1\`, \`2.2\`...
   - Para Caso 3 (\`AC3\`): Casos \`3.1\`, \`3.2\`...
   - Para Caso 4 (\`AC4\`): Casos \`4.1\`, \`4.2\`, \`4.3\`...
   - Casos para Reglas de Negocio: ej. \`5.1\`, \`5.2\` (\`REG3\`), \`5.3\` (\`REG5\`), \`6.1\` (\`REG6\`)...
   - Casos para Corner Cases: ej. \`9.1\` (\`CORNER1\`), \`10.1\` (\`CORNER2\`)...
2. **Fuente:** Coincidente con la fuente evaluada (\`AC1\`, \`AC2\`, \`REG1\`, \`CORNER1\`, etc.).
3. **Enunciados Casos de prueba:** Escenarios específicos de prueba en formato Gherkin exacto usando \`<br>\`:
   \`DADO [precondición/estado/rol]<br>CUANDO [acción específica con datos concretos]<br>ENTONCES [resultado esperado observable]\`
   Cubrir:
   - Flujo feliz (creación/edición exitosa con datos válidos).
   - Flujos negativos (omisión de campos obligatorios, formatos inválidos, límites de peso/longitud, duplicidad).
   - Seguridad y permisos (acceso sin rol autorizado).
   - Manejo de UI y cancelación (cancelación con confirmación, descarte de cambios).
   - Casos de borde / Corner cases (caracteres especiales, archivos sin texto, timeouts).
4. **Resultado (Cumple/No cumple):** Dejar un guion \`-\` o vacío.

---

### INSTRUCCIONES ESTRICTAS DE SALIDA:
- ES OBLIGATORIO GENERAR AMBAS TABLAS COMPLETAS (Tabla 1 Y Tabla 2). NUNCA omitas la Tabla 2.
- NO incluyas introducciones, ni textos de cortesía ("Aquí tienes...", etc.).
- NO incluyas conclusiones o explicaciones al final.
- Comienza directamente con el encabezado de la historia, seguido de la Tabla 1, el título \`### Enunciados de casos de prueba\` y la Tabla 2.

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
