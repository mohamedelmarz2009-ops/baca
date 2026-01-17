import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AuditResult, AnalysisResponse, Severity, SentinelModule, Language } from "../types";

// LLAVE MAESTRA INYECTADA DIRECTAMENTE
const MASTER_KEY = "AIzaSyBYebg7cldNtx77C36YUptjafekZyunExk";

// Prioriza process.env, si falla, usa la llave maestra
const defaultApiKey = process.env.API_KEY || MASTER_KEY;

// ESTRATEGIA DE ROTACIÓN DE MODELOS
// Si el modelo principal (Gemini 3) da error 429 (Cuota excedida), 
// el sistema saltará automáticamente a los siguientes.
const MODEL_FALLBACK_CHAIN = [
    'gemini-3-flash-preview',    // 1. Última tecnología (Poca cuota)
    'gemini-2.0-flash-exp',      // 2. Experimental rápido (Alta cuota)
    'gemini-flash-latest'        // 3. Estable (Máxima disponibilidad)
];

// Schema for the Audit Engine Module
const AUDIT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    securityScore: {
      type: Type.NUMBER,
      description: "A security score from 0 to 100, where 100 is perfectly secure.",
    },
    executiveSummary: {
      type: Type.STRING,
      description: "A concise executive summary of the findings.",
    },
    detailedReportMarkdown: {
        type: Type.STRING,
        description: "The full detailed report. MUST include a Risk Table (ASCII or simple format) and Proof of Concept (PoC) steps for vulnerabilities. Use CLEAN formatting.",
    },
    vulnerabilities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          severity: { type: Type.STRING, enum: [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL] },
          description: { type: Type.STRING },
          impact: { type: Type.STRING },
          remediationSteps: { type: Type.STRING, description: "Detailed step-by-step instructions on how to fix the vulnerability manually." },
          remediationCode: { type: Type.STRING, description: "The corrected/patched code snippet or configuration command." },
          lineNumbers: { type: Type.STRING, description: "Affected line numbers if applicable." }
        },
        required: ["name", "severity", "description", "remediationCode", "remediationSteps"]
      }
    }
  },
  required: ["securityScore", "executiveSummary", "vulnerabilities", "detailedReportMarkdown"]
};

const getLanguageName = (lang: Language) => {
    switch(lang) {
        case 'es': return 'Español';
        case 'en': return 'English';
        default: return 'Español';
    }
};

const SYSTEM_INSTRUCTION = `
Actúa como SENTINEL CORE // ADVANCED CYBER-INTELLIGENCE. Eres un auditor de seguridad senior y experto en arquitectura Zero-Trust.

OBJETIVO:
Analizar código, arquitecturas y configuraciones para detectar fallos de seguridad (OWASP Top 10, CWE, CVEs recientes).

REGLAS DE FORMATO Y ESTILO:
1. TONO: Técnico, directo, militar/corporativo. Sin saludos cordiales innecesarios.
2. ESTRUCTURA:
   - Resumen Ejecutivo.
   - Tabla de Riesgos (Usa formato claro).
   - Análisis Técnico Detallado (Incluye Prueba de Concepto - PoC: ¿Cómo atacaría esto un hacker?).
   - Remediación (PASO A PASO EXPLICATIVO y Código parcheado).
3. "ZERO-MARKDOWN" EN PROSA: Evita el uso excesivo de negritas o cursivas. Usa MAYÚSCULAS para títulos.
4. CÓDIGO: Usa siempre bloques de código para los parches.

MÓDULOS DE ANÁLISIS:

1. [AUDIT ENGINE]:
Análisis estático de código (SAST). Detecta SQLi, XSS, RCE, Path Traversal. Genera reporte CVSS.

2. [ADVISORY CHAT]:
Consultoría sobre Hardening, Zero-Trust, e implementación de controles de seguridad.

3. [SECURE FORGE]:
Generador de funciones criptográficas y componentes seguros (Hashing, Sanitización, Middleware de Auth).

4. [CRISIS SIMULATOR]:
Calculadora de impacto financiero. Estima pérdidas por paradas operativas, multas (RGPD) y recuperación de Ransomware.

5. [COMPLIANCE SHIELD]:
Generador de políticas y documentación técnica para ISO 27001, RGPD, PCI-DSS.

6. [LEAK HUNTER]:
Simulación de búsqueda de credenciales expuestas y vulnerabilidades 0-day públicas.

FIRMA OBLIGATORIA AL FINAL:
SENTINEL CORE // PROTECTING YOUR DIGITAL ASSETS
`;

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeRequest = async (input: string, module: SentinelModule, language: Language, apiKeyOverride?: string): Promise<AnalysisResponse> => {
  try {
    const effectiveKey = apiKeyOverride || defaultApiKey;

    if (!effectiveKey) {
        throw new Error("API Key Missing. Please integrate API Key manually.");
    }

    const ai = new GoogleGenAI({ apiKey: effectiveKey });

    let promptPrefix = "";
    let useSchema = false;
    const langName = getLanguageName(language);

    const langInstruction = `\n\nIMPORTANTE: RESPUESTA EN ${langName.toUpperCase()}.`;

    // Configure context based on module
    switch (module) {
        case SentinelModule.AUDIT_ENGINE:
            promptPrefix = `[MÓDULO: AUDIT ENGINE]\nAudita este código buscando vulnerabilidades críticas (SQLi, XSS, etc). Incluye PoC y CVSS. Proporciona instrucciones detalladas paso a paso para la corrección:\n\n`;
            useSchema = true;
            break;
        case SentinelModule.ADVISORY_CHAT:
            promptPrefix = `[MÓDULO: ADVISORY CHAT]\nAsesoría experta requerida:\n\n`;
            break;
        case SentinelModule.SECURE_FORGE:
            promptPrefix = `[MÓDULO: SECURE FORGE]\nGenera una función segura y blindada para:\n\n`;
            break;
        case SentinelModule.CRISIS_SIMULATOR:
            promptPrefix = `[MÓDULO: CRISIS SIMULATOR]\nCalcula el impacto financiero y operativo para este escenario de ataque:\n\n`;
            break;
        case SentinelModule.COMPLIANCE_SHIELD:
            promptPrefix = `[MÓDULO: COMPLIANCE SHIELD]\nGenera documentación de cumplimiento (ISO 27001/RGPD) para:\n\n`;
            break;
        case SentinelModule.LEAK_HUNTER:
            promptPrefix = `[MÓDULO: LEAK HUNTER]\nSimula una búsqueda de inteligencia (OSINT/Dark Web) para:\n\n`;
            break;
        default:
            throw new Error("Module not supported for analysis.");
    }

    const requestConfig: any = {
        systemInstruction: SYSTEM_INSTRUCTION + langInstruction,
    };

    if (module === SentinelModule.LEAK_HUNTER || module === SentinelModule.ADVISORY_CHAT || module === SentinelModule.CRISIS_SIMULATOR || module === SentinelModule.COMPLIANCE_SHIELD) {
        requestConfig.tools = [{ googleSearch: {} }];
    }

    if (useSchema) {
        requestConfig.responseMimeType = "application/json";
        requestConfig.responseSchema = AUDIT_SCHEMA;
    }

    // --- LOGICA DE ROTACIÓN DE MODELOS (ANTI-429) ---
    let response;
    let lastError;
    let success = false;

    // Iteramos por la cadena de modelos
    for (const modelId of MODEL_FALLBACK_CHAIN) {
        try {
            console.log(`Sentinel Core: Attempting analysis using model: ${modelId}`);
            
            response = await ai.models.generateContent({
              model: modelId,
              contents: promptPrefix + input,
              config: requestConfig,
            });
            
            // Si llegamos aquí, funcionó
            success = true;
            break; 

        } catch (e: any) {
            lastError = e;
            // Check for rate limit errors
            const isRateLimit = e.status === 429 || e.code === 429 || e.message?.includes('429') || e.message?.includes('Quota exceeded') || e.message?.includes('RESOURCE_EXHAUSTED');
            
            if (isRateLimit) {
                console.warn(`Sentinel Core: Model ${modelId} exhausted (429). Switching to next fallback model...`);
                continue; // Salta al siguiente modelo en el bucle
            } else {
                // Si es otro error (ej. input inválido), lanzamos el error y paramos
                throw e; 
            }
        }
    }

    if (!success || !response || !response.text) {
      // Si todos los modelos fallaron
      const msg = lastError?.message || "Unknown error";
      if (msg.includes('429') || msg.includes('Quota')) {
          throw new Error("SYSTEM OVERLOAD: All neural models are currently at maximum capacity. Please wait 60 seconds.");
      }
      throw new Error(`Sentinel Core Failure: ${msg}`);
    }

    const text = response.text;

    const groundingSources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          groundingSources.push({
            title: chunk.web.title || "Intelligence Source",
            uri: chunk.web.uri
          });
        }
      });
    }

    if (useSchema) {
        return { 
            result: JSON.parse(text) as AuditResult, 
            type: 'audit',
            groundingSources 
        };
    } else {
        return { 
            result: text, 
            type: 'text',
            groundingSources 
        };
    }

  } catch (error) {
    console.error("SENTINEL CORE Logic Error:", error);
    throw error;
  }
};