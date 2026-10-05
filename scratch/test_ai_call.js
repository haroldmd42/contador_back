import dotenv from 'dotenv';
dotenv.config();

import { generateGherkin } from '../src/services/groq.service.js';

const userStory = `HU-011 — Gestionar las fuentes de conocimiento del agente
Criterios de Aceptación:
AC1: Como usuario Psicosocial en Fuentes, al seleccionar Texto y diligenciar título y contenido y guardar, el sistema crea la fuente Pendiente y encola procesamiento.
AC2: Al agregar una fuente tipo Archivo y cargar documento permitido dentro del peso, el sistema almacena el documento y crea la fuente Pendiente.
AC3: Al ejecutar extracción, segmentación y vectorización de fuente Pendiente, pasa a Procesada.
AC4: Si falla el procesamiento por error de extracción, cambia a Error, muestra motivo y permite reintentar o eliminar.
AC5: Al desactivar una fuente Procesada y confirmar, pasa a Inactiva y sus fragmentos no se usan en nuevas conversaciones.
Reglas de Negocio:
REG1: Al omitir título, tipo o contenido, el sistema rechaza el registro.
REG3: Fuentes en Error o Inactivas no aportan contexto a conversaciones.
REG5: Al eliminar una fuente se eliminan sus fragmentos vectorizados.
REG6: Usuarios sin rol Especialista de bienestar no pueden administrar fuentes.
`;

async function main() {
  console.log("Calling generateGherkin...");
  const result = await generateGherkin(userStory, "");
  console.log("SUCCESS RESPONSE:\n", result);
}

main();
