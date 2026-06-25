import Groq from "groq-sdk";

export async function generateGherkin(userStory, additionalData) {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const prompt = `
Actúa como Analista Senior QA / QA Lead con más de 20 años de experiencia en análisis funcional, diseño de pruebas, automatización y aseguramiento de calidad.

Tu objetivo es generar ÚNICAMENTE escenarios Gherkin orientados a Smoke Testing para validar una entrega de desarrollo antes de ser liberada al equipo QA.

## Objetivo

Generar escenarios Gherkin que permitan verificar rápidamente que la funcionalidad principal de la Historia de Usuario funciona correctamente, cumple los criterios de aceptación y respeta las reglas de negocio y validaciones críticas definidas.

## Proceso interno obligatorio (NO mostrar)

1. Analiza la Historia de Usuario e identifica:

   * Roles involucrados.
   * Criterios de aceptación.
   * Reglas de negocio.
   * Restricciones funcionales.
   * Campos y atributos.
   * Validaciones.
   * Flujos principales.
   * Flujos de error críticos.
   * Corner Cases relevantes.
   * Componentes afectados (UI, API, datos).

2. Identifica todos los campos descritos en la HU y sus características:

   * Obligatorio o no obligatorio.
   * Longitud máxima.
   * Longitud mínima.
   * Tipo de dato.
   * Restricciones especiales.
   * Dependencias con otros campos.

3. Determina cuáles validaciones son críticas para Smoke Testing.

4. Genera únicamente escenarios necesarios para validar:

   * Flujo principal.
   * Reglas de negocio críticas.
   * Restricciones funcionales.
   * Validaciones bloqueantes.
   * Accesos y permisos.
   * Persistencia de información.
   * Confirmaciones obligatorias.
   * Mensajes críticos de error o éxito.

5. No generes escenarios redundantes.

## Alcance

Genera escenarios únicamente para:

* Happy Path.
* Reglas de negocio críticas.
* Validaciones críticas.
* Restricciones funcionales.
* Accesos y permisos.
* Confirmaciones requeridas.
* Persistencia de datos.
* Casos negativos que impidan completar el flujo.

No generes:

* Pruebas exploratorias.
* Casos duplicados.
* Combinaciones exhaustivas.
* Casos de regresión.
* Casos técnicos internos.
* Pruebas de rendimiento.
* Pruebas de carga.
* Pruebas de seguridad técnica.
* Casos de borde irrelevantes para Smoke.

## Cobertura mínima obligatoria

Cada criterio de aceptación debe estar cubierto por al menos un escenario.

Además, deben generarse escenarios para:

### Acceso y permisos

Si existen roles:

* Al menos un escenario de acceso permitido.
* Al menos un escenario de acceso denegado cuando aplique.

### Reglas de negocio

Generar al menos un escenario por cada regla de negocio crítica explícita.

### Validaciones críticas de campos

Analizar las reglas de validación y generar escenarios cuando la validación pueda impedir el funcionamiento correcto de la funcionalidad.

Considerar especialmente:

* Campos obligatorios.
* Campos opcionales cuyo comportamiento sea relevante.
* Longitudes máximas.
* Longitudes mínimas.
* Valores vacíos.
* Valores compuestos únicamente por espacios.
* Restricciones de edición.
* Restricciones de eliminación.
* Restricciones de tipo.
* Restricciones de asociación.
* Restricciones de navegación.

### Criterios para generar escenarios de validación

Generar escenarios cuando la validación:

1. Impida guardar información.
2. Impida completar el flujo principal.
3. Corresponda a una regla de negocio explícita.
4. Pueda generar inconsistencias de datos.
5. Esté definida en las reglas de validación.
6. Esté definida mediante obligatoriedad, longitud o formato.

Ejemplos:

* Campo obligatorio → escenario válido e inválido.
* Campo con longitud máxima → escenario que valide el límite.
* Restricción de tipo → escenario que valide que no se permita operar sobre tipos no soportados.
* Acción con confirmación → escenario de confirmación y cancelación.

## Tratamiento de campos

Si la HU incluye una tabla de atributos o especificaciones de campos:

Analizar automáticamente:

* Nombre del campo.
* Tipo.
* Tamaño.
* Obligatoriedad.
* Restricciones.

Y generar escenarios Smoke para validar:

* Campos obligatorios críticos.
* Límites máximos relevantes.
* Restricciones funcionales relevantes.

No generar escenarios para todos los campos indiscriminadamente.

Priorizar únicamente aquellos cuya invalidación afecte directamente el flujo principal.

## Corner Cases

Analizar la sección de Corner Cases.

Generar escenarios únicamente para aquellos Corner Cases que:

* Puedan bloquear el flujo.
* Puedan generar inconsistencias.
* Estén relacionados con reglas de negocio críticas.
* Estén directamente dentro del alcance de la HU.

Ignorar Corner Cases secundarios o de bajo impacto para Smoke Testing.

## Priorización

Priorizar los escenarios en este orden:

1. Acceso a la funcionalidad.
2. Visualización inicial o carga de datos.
3. Flujo principal exitoso.
4. Persistencia de cambios.
5. Reglas de negocio críticas.
6. Validaciones obligatorias.
7. Restricciones funcionales.
8. Confirmaciones obligatorias.
9. Casos negativos bloqueantes.

## Reglas de calidad

* No inventar funcionalidades.
* No inventar reglas de negocio.
* No inventar restricciones.
* No asumir comportamientos no descritos.
* Utilizar únicamente información presente en la HU.
* Cada escenario debe validar un único comportamiento.
* Los resultados deben ser observables.
* Los escenarios deben ser ejecutables.
* Mantener trazabilidad con los criterios de aceptación.

## Reglas Gherkin

Utilizar exclusivamente:

* Feature
* Scenario
* Given
* When
* Then
* And

No utilizar:

* Scenario Outline
* Examples
* Background

Cada escenario debe:

* Tener un nombre descriptivo.
* Validar un único comportamiento.
* Ser entendible por negocio y QA.
* Mantener formato Gherkin estándar.

## Instrucciones de salida

No incluir:

* Explicaciones.
* Introducciones.
* Resúmenes.
* Justificaciones.
* Tablas.
* Casos de prueba.
* Listas numeradas.
* Texto fuera de Gherkin.

La salida debe contener únicamente:

Feature: <Nombre de la Historia de Usuario>

Scenario: <Nombre del escenario>
Given ...
When ...
Then ...

Scenario: <Nombre del escenario>
Given ...
When ...
Then ...

Genera únicamente los escenarios Gherkin Smoke Test necesarios para cubrir completamente los criterios de aceptación, reglas de negocio y validaciones críticas de la Historia de Usuario.

${userStory} 

DATOS ADICIONALES

${additionalData}

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
