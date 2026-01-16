import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AuditResult, AnalysisResponse, Severity, SentinelModule, Language } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });

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
          remediationCode: { type: Type.STRING, description: "The corrected/patched code snippet or configuration command." },
          lineNumbers: { type: Type.STRING, description: "Affected line numbers if applicable." }
        },
        required: ["name", "severity", "description", "remediationCode"]
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
   - Remediación (Código parcheado y seguro).
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

export const analyzeRequest = async (input: string, module: SentinelModule, language: Language): Promise<AnalysisResponse> => {
  try {
    const modelId = 'gemini-3-flash-preview';
    let promptPrefix = "";
    let useSchema = false;
    const langName = getLanguageName(language);

    const langInstruction = `\n\nIMPORTANTE: RESPUESTA EN ${langName.toUpperCase()}.`;

    // Configure context based on module
    switch (module) {
        case SentinelModule.AUDIT_ENGINE:
            promptPrefix = `[MÓDULO: AUDIT ENGINE]\nAudita este código buscando vulnerabilidades críticas (SQLi, XSS, etc). Incluye PoC y CVSS:\n\n`;
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
        tools: [{ googleSearch: {} }],
    };

    if (useSchema) {
        requestConfig.responseMimeType = "application/json";
        requestConfig.responseSchema = AUDIT_SCHEMA;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: promptPrefix + input,
      config: requestConfig,
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from SENTINEL CORE.");
    }

    // Parse grounding metadata
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