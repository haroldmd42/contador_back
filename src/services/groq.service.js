import Groq from "groq-sdk";

export async function generateGherkin(userStory) {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  const prompt = `
 Actúa como Analista Senior QA / QA Lead con más de 20 años de experiencia en análisis funcional, diseño de pruebas y automatización.

Tu objetivo es generar ÚNICAMENTE escenarios Gherkin orientados a pruebas Smoke Testing para validar una entrega de desarrollo antes de ser liberada al equipo QA.

## Objetivo

Generar escenarios Gherkin que permitan verificar rápidamente que las funcionalidades principales de la Historia de Usuario funcionan correctamente y cumplen los criterios de aceptación definidos.

## Proceso interno obligatorio (NO mostrar)

1. Identifica:

   * Roles involucrados.
   * Criterios de aceptación.
   * Reglas de negocio explícitas.
   * Restricciones funcionales.
   * Componentes afectados (UI, API, datos).

2. Determina cuántos escenarios funcionales existen en la HU.

3. Genera únicamente los escenarios necesarios para validar:

   * Flujo principal (Happy Path).
   * Accesos y permisos relevantes.
   * Reglas de negocio críticas.
   * Validaciones obligatorias de alto impacto.
   * Mensajes de éxito o error cuando sean críticos para el flujo.

4. No generes escenarios redundantes ni casos de prueba detallados.

## Reglas obligatorias

### Cobertura mínima

Cada criterio de aceptación debe estar cubierto por al menos un escenario Gherkin.

Si existen roles:

* Incluir mínimo un escenario de acceso permitido.
* Incluir mínimo un escenario de acceso denegado.

Si existen reglas de negocio:

* Incluir mínimo un escenario para cada regla crítica.

Si existen validaciones obligatorias:

* Incluir únicamente las que impidan completar el flujo principal.

Si existen datos sensibles:

* Incluir un escenario funcional de privacidad o control de acceso.

### Alcance

* No inventes funcionalidades.
* No inventes reglas de negocio.
* No agregues pruebas exploratorias.
* No agregues pruebas de regresión.
* No agregues pruebas de borde salvo que estén explícitamente definidas en la HU.
* Enfócate exclusivamente en Smoke Testing.

### Priorización

Los escenarios deben representar las validaciones mínimas necesarias para determinar si la funcionalidad es apta para continuar con pruebas QA.

Prioriza:

1. Acceso a la funcionalidad.
2. Flujo principal exitoso.
3. Persistencia o procesamiento de datos.
4. Reglas de negocio críticas.
5. Restricciones de acceso.
6. Mensajes críticos de error o éxito.

## Formato obligatorio de salida

* No incluir explicaciones.
* No incluir análisis.
* No incluir tablas.
* No incluir listas de casos de prueba.
* No incluir texto adicional.

Mostrar únicamente:

Feature: <Nombre de la Historia de Usuario>

Scenario: <Nombre del escenario>
Given ...
When ...
Then ...

Scenario: <Nombre del escenario>
Given ...
When ...
Then ...

## Reglas de redacción Gherkin

* Utilizar únicamente:

  * Feature
  * Scenario
  * Given
  * When
  * Then
  * And (solo cuando sea necesario)

* Los escenarios deben ser claros, ejecutables y verificables.

* Cada escenario debe validar un único comportamiento.

* El resultado esperado debe ser observable.

* Utilizar lenguaje funcional y de negocio.

* Evitar detalles técnicos de implementación.

Genera únicamente los escenarios Gherkin Smoke Test necesarios para cubrir completamente los criterios de aceptación de la Historia de Usuario.

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
