import Groq from "groq-sdk";

export async function generateGherkin(userStory) {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  const prompt = `
  
Actúa como Analista Senior de QA / QA Lead con 20 años de experiencia. Tu objetivo es generar artefactos de prueba listos para ejecución y trazables a los criterios de aceptación, manteniendo alta cobertura sin inventar alcance.
 
Necesito que generes EXACTAMENTE dos tablas basadas en la historia de usuario (HU) incluida más abajo. El objetivo es preparar pruebas para:
- Entrega de desarrollo a QA (smoke/aceptación) mediante un Checklist mínimo.

 
## Proceso interno obligatorio (NO lo muestres):
1) Identifica con claridad:
   - Roles involucrados y restricciones.
   - Escenarios de aceptación (Gherkin o equivalentes).
   - Reglas de negocio importantes (explícitas e implícitas solo si son necesarias dentro del alcance).
   - Datos sensibles (PII, credenciales, identificación, fiscal, etc.) si aplica.
   - Componentes afectados (UI, API, datos) dentro del alcance descrito.
2) Cuenta explícitamente cuántos escenarios de aceptación tiene la HU.
3) Calcula el mínimo de casos por complejidad (ver “Calibración por complejidad”).
4) Verifica completitud: cada criterio de aceptación debe quedar cubierto al menos por 1 ítem en cada tabla.
5) Ajusta el número de filas hacia arriba hasta cumplir todos los mínimos (no reduzcas por brevedad).
 
## Reglas de calidad obligatorias:
A) Deriva casos directamente de:
   1) Criterios de aceptación.
   2) Notas/soportes.
   3) Prototipo, si está disponible.
   4) Reglas del dominio implícitas necesarias para evitar defectos obvios DENTRO del alcance actual.
B) Aporta cobertura balanceada en estas dimensiones cuando apliquen:
   - Acceso y permisos (positivo y negativo).
   - Flujos felices end-to-end dentro del alcance.
   - Validaciones negativas y manejo de errores.
   - Reglas de negocio (explícitas e inferidas dentro del alcance).
   - Integridad de datos y relaciones (si aplica).
   - UI/UX (si hay interfaz): listado, detalle, formularios, estados vacíos, etiquetas, navegación.
   - Seguridad y privacidad (no exposición de datos sensibles, enmascarado, acciones seguras).
   - Formato/longitud y límites.
   - Estados / trazabilidad / auditoría (solo si la HU menciona estados).
   - Mensajes esperados (éxito, error, advertencia) cuando sean observables.
   - API / contrato de servicio (solo si la HU menciona backend/API/servicios/contratos).
C) Si una dimensión NO aplica a la HU, no la fuerces; prioriza relevancia sobre volumen.
D) No inventes funcionalidades fuera del alcance. Si una nota indica “se creará otra HU”, NO cubras esa funcionalidad en profundidad; solo valida que no afecte el alcance actual.
E) Cada fila debe describir un único comportamiento verificable (no mezcles varios comportamientos en una sola fila).
 
## Criterios de completitud (obligatorios):
1) Cada criterio de aceptación debe estar cubierto por al menos:
   - 1 ítem del Checklist mínimo, y
   - 1 ítem de Enunciados de casos de prueba.
2) Cada nota/soporte relevante debe reflejarse en al menos un caso cuando aplique.
3) Si hay roles, incluye mínimo 1 prueba negativa por cada rol restringido.
4) Si hay datos sensibles, incluye mínimo 1 criterio de seguridad/privacidad explícito (funcional).
5) No reduzcas el número de casos “por brevedad”; cumple los mínimos aunque la respuesta sea larga.
 
## Cobertura mínima exigida:
1) Tabla 1 (Checklist mínimo):
   - Incluye al menos:
     a) 1 caso de acceso permitido (si hay roles).
     b) 1 caso de acceso denegado (si hay roles).
     c) 2 casos de UI o visualización (si hay UI).
     d) 1 caso de estado vacío o sin datos (si hay listados).
     e) 2 casos de reglas de negocio.
     f) 2 casos de validaciones negativas.
     g) 1 caso de seguridad/privacidad si hay datos sensibles.
   - Si la HU es principalmente backend/API y eso está explícito en la HU, reemplaza UI por:
     - Validación de contrato, códigos de respuesta, estructura del payload, errores y reglas de negocio en el servicio.

## Reglas de redacción (obligatorias):
- Es obligatorio escribir cada criterio y cada enunciado con estructura verificable:
  “DADO/Condición + CUANDO/Acción + ENTONCES/Resultado observable”.
- DADO, CUANDO y ENTONCES deben ir en MAYÚSCULAS.
- DADO, CUANDO y ENTONCES deben ir en UNA SOLA CELDA, en UNA SOLA LÍNEA, y el ÚNICO separador entre las frases debe ser UN ESPACIO (sin tabulaciones dentro de la celda y sin caracteres extra).
- No comiences los textos con frases genéricas como “Validar que…”. Reescribe siempre en formato DADO/CUANDO/ENTONCES.
- Evita frases vagas como “funciona correctamente” sin detalle observable.
- Si hay listados, considera: columnas visibles, comportamiento con datos y sin datos, lectura/etiquetas y navegación básica.
- Si hay vista de detalle, considera: modo solo lectura, consistencia con el listado, campos relevantes dentro del alcance.
- Si hay formato/longitud, incluye al menos un caso de límite válido y uno de valor inválido.
 
## Calibración por complejidad (obligatoria):
1) Calcula el MÍNIMO por complejidad y NUNCA generes menos que ese mínimo.
2) Usa el RANGO OBJETIVO solo como guía de tamaño (no es un tope).
3) No hay máximo: si para cumplir completitud/cobertura necesitas más casos, puedes superar el rango objetivo.
 
- Si la HU tiene 1 escenario:
  - Checklist: mínimo 8 (objetivo 8–12)
  - Enunciados: mínimo 12 (objetivo 12–18)
 
- Si tiene 2–3 escenarios:
  - Checklist: mínimo 12 (objetivo 12–18)
  - Enunciados: mínimo 18 (objetivo 18–28)
 
- Si tiene más de 3 escenarios:
  - Checklist: mínimo 18 (objetivo 18–26)
  - Enunciados: mínimo 28 (objetivo 28–40)
 
## Uso de categorías (obligatorio para uniformidad):
- Usa exclusivamente estas etiquetas estándar de categoría. No inventes etiquetas nuevas.
   - Acceso / Permisos
   - UI / Listado
   - UI / Detalle
   - UI / Formularios
   - Navegación
   - Datos / Campos
   - Reglas de negocio
   - Integridad / Relación
   - Seguridad / Privacidad
   - Mensajes / Errores
   - Formato / Longitud
   - Estados / Trazabilidad
   - API / Contrato
 
## Restricciones adicionales para uniformidad:
- No inventes nuevas etiquetas de categoría. Si un caso es negativo, clasifícalo según la dimensión principal:
  - “Formato / Longitud” para errores de formato o tamaño.
  - “Datos / Campos” para obligatoriedad simple.
  - “Reglas de negocio” para restricciones de negocio.
  - “Mensajes / Errores” para validación explícita de mensajes/códigos/errores cuando sea el foco observable.
- Seguridad técnica transversal:
  - Solo incluye casos de XSS, SQL injection, API/Contrato o logs si la HU, las notas o el contexto mencionan APIs, integraciones o requisitos de seguridad específicos.
  - En caso contrario, prioriza seguridad funcional (no exposición de datos sensibles, privacidad, control de acceso).
- Unicidad por caso:
  - Cada fila = un solo comportamiento verificable. Si hay duda, divide en dos filas.
 
## Instrucciones de salida (obligatorias):
3) No incluyas explicaciones, introducciones ni texto adicional fuera de los dos bloques.
4) Cada bloque debe iniciar con:
   - El nombre de la HU (para el checklist), y
   - El título “Enunciados de casos de prueba” (para la segunda tabla).
5) Usa columnas separadas por tabulaciones y filas en líneas nuevas (TSV compatible con Excel).
6) Para cada criterio o verificación, las tabulaciones solo deben usarse para separar columnas, no para separar partes del texto dentro de una misma celda.
7) Numera consecutivamente cada fila en la columna Caso.
8) En la tabla 1 (Checklist mínimo) deja vacíos:
   - Resultado (Cumple/No cumple)
   - Observaciones

## Formato exacto esperado (modelo de salida):
 

<NOMBRE DE LA HU>
Caso Categoría Criterio o Verificación Resultado (Cumple/No cumple) Observaciones
1 ... DADO ... CUANDO ... ENTONCES ...
2 ... DADO ... CUANDO ... ENTONCES ...

 
 
${userStory} 

`;
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return completion.choices[0].message.content;
}
