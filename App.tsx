import React, { useState, useEffect } from 'react';
import { 
  Activity, Shield, Terminal, Search, Lock, AlertOctagon, 
  ExternalLink, RefreshCw, Hexagon, MessageSquare, 
  Zap, ChevronRight, Languages, Check, Copy,
  Siren, FileCheck, Radar, Info, ArrowRight, CheckCircle,
  LogIn, User as UserIcon, X, CreditCard, Square, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeRequest } from './services/geminiService';
import { AuditResult, AnalysisResponse, Severity, SentinelModule, Language, User, PlanType } from './types';
import ScoreGauge from './components/ScoreGauge';
import VulnerabilityList from './components/VulnerabilityList';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- VIEW STATE TYPES ---
type ViewState = 'landing' | 'dashboard' | 'terms';

// --- TRANSLATIONS CONFIGURATION (UPDATED WITH TECH DETAILS) ---
const DICTIONARY = {
    es: {
        modules: {
            audit: { title: 'Motor de Auditoría', desc: 'Detección SAST/DAST Híbrida', placeholder: '// Pega tu código para análisis de vulnerabilidades...' },
            advisory: { title: 'Chat de Asesoría', desc: 'LLM Especializado en SecOps', placeholder: 'Describe tu infraestructura para recibir asesoría...' },
            forge: { title: 'Forja Segura', desc: 'Generación de Código Endurecido', placeholder: 'Ej: Middleware de autenticación JWT con rotación de claves...' },
            crisis: { title: 'Simulador de Crisis', desc: 'Modelado de Riesgo Estocástico', placeholder: 'Describe el escenario de ataque (ej. Ransomware en BD principal)...' },
            compliance: { title: 'Escudo Legal', desc: 'NLP para ISO 27001 / RGPD', placeholder: 'Especifica el alcance y la normativa requerida...' },
            leak: { title: 'Cazador de Fugas', desc: 'OSINT & Dark Web Scraper (Sim)', placeholder: 'Ingresa dominio o tecnología para buscar exposiciones...' },
            about: { title: 'Tecnología y Uso', desc: 'Documentación Técnica', placeholder: '' }
        },
        ui: {
            systemOnline: 'SISTEMA ONLINE',
            secureChannel: 'CANAL CIFRADO',
            commandInput: 'VECTOR DE ENTRADA',
            awaiting: 'ESPERANDO DATOS PARA',
            processing: 'ANALIZANDO...',
            execute: 'EJECUTAR ANÁLISIS',
            systemIdle: 'SISTEMA EN ESPERA',
            waitingStream: 'Conexión segura establecida. Esperando input.',
            aborted: 'OPERACIÓN ABORTADA',
            report: 'REPORTE DE INTELIGENCIA',
            riskDist: 'DISTRIBUCIÓN DE RIESGO',
            execSummary: 'RESUMEN EJECUTIVO',
            threats: 'AMENAZAS DETECTADAS',
            techReport: 'ANÁLISIS TÉCNICO',
            sources: 'FUENTES DE INTELIGENCIA',
            footer: 'SENTINEL CORE // PROTECTING YOUR DIGITAL ASSETS',
            accessDashboard: 'ACCEDER AL DASHBOARD',
            terms: 'Términos de Servicio',
            back: 'Volver',
            login: 'INICIAR SESIÓN / REGISTRO',
            upgrade: 'MEJORAR PLAN',
            usageLimit: 'LÍMITE ALCANZADO',
            usageDesc: 'Has alcanzado el límite de tu plan gratuito (1 consulta). Actualiza para continuar.',
            locked: 'MÓDULO BLOQUEADO',
            lockedDesc: 'Este módulo requiere plan COMMAND.',
            welcome: 'Bienvenido, Agente.',
            integrateApi: 'INTEGRAR API KEY'
        },
        aboutContent: {
            intro: 'SENTINEL CORE opera sobre una arquitectura híbrida que combina Modelos de Lenguaje Grande (LLMs) de última generación (Gemini 1.5 Pro/Flash) con bases de datos vectoriales de vulnerabilidades (CVE/CWE). A continuación, se detalla la tecnología detrás de cada módulo.',
            sections: [
                {
                    title: 'MOTOR DE AUDITORÍA (AUDIT ENGINE)',
                    text: 'TECNOLOGÍA: Análisis Estático de Código (SAST) potenciado por IA Heurística. Utiliza reconocimiento de patrones semánticos para identificar flujos de datos inseguros que los linters tradicionales ignoran. Capaz de rastrear "Tainted Data" desde la entrada hasta la ejecución (Sinks).'
                },
                {
                    title: 'CHAT DE ASESORÍA (ADVISORY CHAT)',
                    text: 'TECNOLOGÍA: Modelo RAG (Retrieval-Augmented Generation) conectado a bases de conocimiento de NIST, CIS Benchmarks y OWASP ASVS. Proporciona consultoría contextualizada en tiempo real, actuando como un Arquitecto de Seguridad Virtual.'
                },
                {
                    title: 'FORJA SEGURA (SECURE FORGE)',
                    text: 'TECNOLOGÍA: Generación de Código "Secure-by-Design". Los modelos están ajustados (Fine-Tuned) específicamente para evitar antipatrones de seguridad. Cada snippet generado incluye validación de entradas, manejo de errores seguro y criptografía estándar.'
                },
                {
                    title: 'SIMULADOR DE CRISIS (CRISIS SIMULATOR)',
                    text: 'TECNOLOGÍA: Motores de simulación de Monte Carlo y análisis de impacto económico. Estima pérdidas financieras basándose en el tiempo de inactividad promedio de la industria y las multas regulatorias vigentes (4% facturación anual para RGPD).'
                },
                {
                    title: 'ESCUDO LEGAL (COMPLIANCE SHIELD)',
                    text: 'TECNOLOGÍA: Procesamiento de Lenguaje Natural (NLP) especializado en textos legales. Traduce requisitos normativos abstractos (ISO 27001 Anexo A) en configuraciones técnicas concretas y políticas administrativas.'
                },
                {
                    title: 'CAZADOR DE FUGAS (LEAK HUNTER)',
                    text: 'TECNOLOGÍA: Simulación de reconocimiento OSINT (Open Source Intelligence). Utiliza Google Search Grounding API para correlacionar dominios con bases de datos públicas de brechas de seguridad y repositorios de código expuestos.'
                }
            ]
        }
    },
    en: {
        /* Keeping basic structure, assuming users prefer Spanish based on prompt language but providing fallback structure */
        modules: {
            audit: { title: 'Audit Engine', desc: 'Hybrid SAST/DAST Detection', placeholder: '// Paste code...' },
            advisory: { title: 'Advisory Chat', desc: 'SecOps Specialized LLM', placeholder: 'Describe infrastructure...' },
            forge: { title: 'Secure Forge', desc: 'Hardened Code Gen', placeholder: 'Ex: JWT Middleware...' },
            crisis: { title: 'Crisis Simulator', desc: 'Stochastic Risk Modeling', placeholder: 'Describe scenario...' },
            compliance: { title: 'Compliance Shield', desc: 'NLP for ISO 27001', placeholder: 'Specify scope...' },
            leak: { title: 'Leak Hunter', desc: 'OSINT Simulation', placeholder: 'Enter domain...' },
            about: { title: 'Tech Specs', desc: 'Technical Documentation', placeholder: '' }
        },
        ui: {
            systemOnline: 'SYSTEM ONLINE',
            secureChannel: 'ENCRYPTED CHANNEL',
            commandInput: 'INPUT VECTOR',
            awaiting: 'AWAITING DATA FOR',
            processing: 'ANALIZING...',
            execute: 'EXECUTE ANALYSIS',
            systemIdle: 'SYSTEM IDLE',
            waitingStream: 'Secure connection established.',
            aborted: 'OPERATION ABORTED',
            report: 'INTELLIGENCE REPORT',
            riskDist: 'RISK DISTRIBUTION',
            execSummary: 'EXECUTIVE SUMMARY',
            threats: 'DETECTED THREATS',
            techReport: 'TECHNICAL ANALYSIS',
            sources: 'INTELLIGENCE SOURCES',
            footer: 'SENTINEL CORE // PROTECTING YOUR DIGITAL ASSETS',
            accessDashboard: 'ACCESS DASHBOARD',
            terms: 'Terms of Service',
            back: 'Back',
            login: 'LOGIN / REGISTER',
            upgrade: 'UPGRADE PLAN',
            usageLimit: 'LIMIT REACHED',
            usageDesc: 'Free plan limit reached (1 query). Upgrade to continue.',
            locked: 'MODULE LOCKED',
            lockedDesc: 'Requires COMMAND plan.',
            welcome: 'Welcome, Agent.',
            integrateApi: 'INTEGRATE API KEY'
        },
        aboutContent: {
            intro: 'SENTINEL CORE operates on a hybrid architecture combining LLMs with vector databases. Below is the tech stack per module.',
            sections: [
                { title: 'AUDIT ENGINE', text: 'TECH: AI-Powered SAST. Semantic pattern recognition for insecure data flows.' },
                { title: 'ADVISORY CHAT', text: 'TECH: RAG Model connected to NIST/CIS knowledge bases.' },
                { title: 'SECURE FORGE', text: 'TECH: Secure-by-Design code generation fine-tuned to avoid antipatterns.' },
                { title: 'CRISIS SIMULATOR', text: 'TECH: Monte Carlo simulation engines for economic impact analysis.' },
                { title: 'COMPLIANCE SHIELD', text: 'TECH: NLP for legal text translation into technical controls.' },
                { title: 'LEAK HUNTER', text: 'TECH: OSINT simulation via Google Search Grounding.' }
            ]
        }
    }
};

// --- COMPONENTS ---

const CopyableCodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4 rounded border border-cyber-panel bg-black">
             <div className="flex items-center justify-between px-4 py-1 bg-cyber-panel border-b border-cyber-dark">
                <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-cyber-cyan" />
                    <span className="text-[10px] text-cyber-cyan font-mono tracking-wider">SECURE_BLOCK</span>
                </div>
                <button onClick={handleCopy} className="text-cyber-text hover:text-cyber-cyan transition-colors">
                    {copied ? <Check size={12} className="text-cyber-cyan" /> : <Copy size={12} />}
                </button>
             </div>
             <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-sm text-cyber-text leading-relaxed"><code>{code}</code></pre>
             </div>
        </div>
    );
};

const MarkdownDisplay: React.FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/```(\w+)?\n([\s\S]*?)```/g);
  const elements = [];
  let i = 0;
  while (i < parts.length) {
    if (parts[i]) {
        elements.push(<div key={`text-${i}`} className="prose prose-invert prose-sm max-w-none font-mono whitespace-pre-wrap text-cyber-text mb-2">{parts[i]}</div>);
    }
    if (i + 2 < parts.length) {
        const code = parts[i + 2];
        elements.push(<CopyableCodeBlock key={`code-${i}`} code={code} />);
        i += 3;
    } else { i++; }
  }
  return <div className="space-y-1">{elements}</div>;
};

// --- MODALS ---

const ApiKeyModal: React.FC<{ onClose: () => void, onSave: (key: string) => void }> = ({ onClose, onSave }) => {
    const MASTER_KEY = "AIzaSyBYebg7cldNtx77C36YUptjafekZyunExk";
    const [inputKey, setInputKey] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(MASTER_KEY);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        if (inputKey.trim()) {
            onSave(inputKey.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-cyber-dark border border-cyber-cyan w-full max-w-lg p-6 relative shadow-[0_0_50px_rgba(0,242,255,0.1)]"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Key className="text-cyber-cyan" /> INTEGRACIÓN MANUAL DE LLAVE
                </h3>

                <div className="space-y-6">
                    <div className="bg-black border border-gray-700 p-4 rounded">
                        <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Paso 1: Copia tu Llave Maestra</label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-gray-900 p-2 text-cyber-cyan font-mono text-sm break-all border border-gray-800 rounded">
                                {MASTER_KEY}
                            </code>
                            <button 
                                onClick={handleCopy}
                                className="p-2 bg-cyber-panel border border-gray-600 hover:border-cyber-cyan hover:text-cyber-cyan transition-colors rounded"
                            >
                                {copied ? <Check size={16}/> : <Copy size={16}/>}
                            </button>
                        </div>
                    </div>

                    <div className="bg-black border border-gray-700 p-4 rounded">
                         <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Paso 2: Pega para vincular</label>
                         <input 
                            type="text" 
                            className="w-full bg-gray-900 border border-gray-800 p-3 text-white focus:border-cyber-cyan outline-none font-mono text-sm mb-4 rounded"
                            placeholder="Pega la API Key aquí..."
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                         />
                         <button 
                            onClick={handleSave}
                            disabled={!inputKey.trim()}
                            className="w-full bg-cyber-cyan text-black font-bold py-3 uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            CONECTAR AL SISTEMA
                         </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const AuthModal: React.FC<{ onLogin: (email: string, name: string | undefined, plan: PlanType) => void, onClose: () => void }> = ({ onLogin, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);

        // Register Validation
        if (isRegister) {
            if (!captchaVerified) {
                setAuthError('Verificación de seguridad fallida. Complete el Captcha.');
                return;
            }
            if (!name || !email || !password) {
                setAuthError('Todos los campos son obligatorios.');
                return;
            }
            // Registration always starts as FREE
            onLogin(email, name, 'FREE');
        } 
        // Login Logic
        else {
             if (!email || !password) {
                setAuthError('Credenciales incompletas.');
                return;
            }

            // Hardcoded Admin Check with Trim for robustness
            // FIXED: Added toLowerCase() to prevent case sensitivity issues for admin login
            if (email.trim().toLowerCase() === 'administrador@sentinel.com' && password.trim() === 'adminsentinelcore10@') {
                onLogin(email, 'Administrador', 'COMMAND');
            } else {
                // Default Login
                onLogin(email, undefined, 'FREE');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-cyber-dark border border-cyber-cyan w-full max-w-md p-8 relative shadow-[0_0_50px_rgba(0,242,255,0.1)]"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                
                <div className="text-center mb-8">
                    <Hexagon size={48} className="text-cyber-cyan mx-auto mb-4 animate-spin-slow" />
                    <h2 className="text-2xl font-bold text-white tracking-widest">{isRegister ? 'NUEVO AGENTE' : 'IDENTIFICACIÓN'}</h2>
                    <p className="text-xs text-cyber-cyan font-mono mt-2">ACCESO AL SISTEMA CENTRAL</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {isRegister && (
                         <div>
                            <label className="block text-xs font-mono text-gray-500 mb-2">NOMBRE OPERATIVO</label>
                            <input 
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black border border-gray-700 p-3 text-white focus:border-cyber-cyan outline-none font-mono"
                                placeholder="Nombre o Alias"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-mono text-gray-500 mb-2">CORREO ELECTRÓNICO</label>
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black border border-gray-700 p-3 text-white focus:border-cyber-cyan outline-none font-mono"
                            placeholder=""
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-mono text-gray-500 mb-2">CLAVE DE ACCESO</label>
                        <input 
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black border border-gray-700 p-3 text-white focus:border-cyber-cyan outline-none"
                            placeholder="••••••••" 
                        />
                    </div>

                    {isRegister && (
                        <div 
                            className="flex items-center gap-4 p-4 border border-gray-700 bg-black cursor-pointer hover:border-gray-500 transition-colors"
                            onClick={() => setCaptchaVerified(!captchaVerified)}
                        >
                            <div className={`w-6 h-6 border flex items-center justify-center transition-colors ${captchaVerified ? 'bg-cyber-cyan border-cyber-cyan' : 'border-gray-500'}`}>
                                {captchaVerified && <Check size={16} className="text-black" />}
                            </div>
                            <span className="text-sm text-gray-300 select-none">No soy un robot</span>
                            <Shield size={20} className="ml-auto text-gray-600" />
                        </div>
                    )}
                    
                    {authError && (
                        <div className="text-red-500 text-xs font-mono text-center border border-red-900/50 bg-red-900/10 p-2">
                            {authError}
                        </div>
                    )}

                    <button type="submit" className="w-full bg-cyber-cyan text-black font-bold py-3 uppercase tracking-widest hover:bg-white transition-colors">
                        {isRegister ? 'REGISTRAR CREDENCIALES' : 'INICIAR ENLACE'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => { setIsRegister(!isRegister); setAuthError(null); }} className="text-xs text-gray-500 hover:text-cyber-cyan underline">
                        {isRegister ? '¿Ya tienes cuenta? Iniciar Sesión' : '¿Nuevo acceso? Crear Cuenta'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const UpgradeModal: React.FC<{ onClose: () => void, onUpgrade: (plan: PlanType) => void }> = ({ onClose, onUpgrade }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div 
                initial={{ y: 50, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-4xl relative"
            >
                <button onClick={onClose} className="absolute -top-12 right-0 text-white hover:text-cyber-pink flex items-center gap-2">
                    <X size={24}/> CERRAR
                </button>

                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-2">NIVEL DE ACCESO INSUFICIENTE</h2>
                    <p className="text-cyber-pink font-mono">LÍMITE DEL PLAN GRATUITO ALCANZADO (1/1 CONSULTAS)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* PLAN OPERATIVE */}
                    <div className="bg-cyber-panel border border-cyber-dark p-8 hover:border-cyber-cyan/50 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <Shield size={32} className="text-gray-400 group-hover:text-cyber-cyan transition-colors" />
                            <span className="bg-gray-800 text-xs px-2 py-1 rounded text-gray-300">BÁSICO</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">PLAN OPERATIVE</h3>
                        <div className="text-4xl font-mono text-cyber-cyan mb-6">49€<span className="text-sm text-gray-500">/mes</span></div>
                        <ul className="space-y-3 mb-8 text-sm font-mono text-gray-400">
                            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-cyber-cyan" /> 10 Análisis Diarios</li>
                            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-cyber-cyan" /> Auditoría & Asesoría</li>
                            <li className="flex items-center gap-2 text-gray-600"><X size={14} /> Simulador & Forja (Bloqueado)</li>
                        </ul>
                        <a 
                            href="https://sentinelcores.lemonsqueezy.com/checkout/buy/d8ee101a-ab6c-4c26-bbde-3db2bfe0bfea" 
                            target="_blank" rel="noreferrer"
                            className="block w-full py-3 text-center border border-gray-600 text-gray-300 hover:border-cyber-cyan hover:text-cyber-cyan uppercase font-bold tracking-wider transition-all mb-4"
                        >
                            COMPRAR AHORA
                        </a>
                    </div>

                    {/* PLAN COMMAND */}
                    <div className="bg-cyber-panel border border-cyber-pink p-8 shadow-[0_0_30px_rgba(255,0,85,0.15)] relative">
                        <div className="absolute top-0 right-0 bg-cyber-pink text-black text-xs font-bold px-2 py-1">RECOMENDADO</div>
                        <div className="flex justify-between items-start mb-4">
                            <Siren size={32} className="text-cyber-pink" />
                            <span className="bg-cyber-pink/20 text-xs px-2 py-1 rounded text-cyber-pink">PRO</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">PLAN COMMAND</h3>
                        <div className="text-4xl font-mono text-cyber-pink mb-6">199€<span className="text-sm text-gray-500">/mes</span></div>
                        <ul className="space-y-3 mb-8 text-sm font-mono text-gray-400">
                            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-cyber-pink" /> Acceso TOTAL Ilimitado</li>
                            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-cyber-pink" /> Todos los 6 Módulos</li>
                            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-cyber-pink" /> Soporte Prioritario 24/7</li>
                        </ul>
                        <a 
                            href="https://sentinelcores.lemonsqueezy.com/checkout/buy/5281e524-024e-4e5f-a574-0c13d9cf99f0" 
                            target="_blank" rel="noreferrer"
                            className="block w-full py-3 text-center bg-cyber-pink text-black hover:bg-white hover:text-black uppercase font-bold tracking-wider transition-all mb-4"
                        >
                            COMPRAR AHORA
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- PAGES ---

const LandingPage: React.FC<{ onStart: () => void, onTerms: () => void }> = ({ onStart, onTerms }) => {
    return (
        <div className="min-h-screen bg-cyber-black text-cyber-text font-sans relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none cyber-grid"></div>
            
            <div className="relative z-10 container mx-auto px-6 pt-24 pb-12 flex flex-col items-center text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.8 }}
                    className="mb-8"
                >
                    <Hexagon size={64} className="text-cyber-cyan mx-auto mb-6 animate-pulse" />
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-4">
                        SENTINEL <span className="text-cyber-cyan">CORE</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-cyber-text/80 font-mono tracking-wide max-w-3xl mx-auto">
                        INTELIGENCIA DEFENSIVA DE ÉLITE
                    </p>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStart}
                    className="group relative px-8 py-4 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-bold tracking-widest uppercase hover:bg-cyber-cyan hover:text-black transition-all duration-300"
                >
                    <span className="flex items-center gap-2">
                        ACCEDER AL DASHBOARD <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 border border-cyber-cyan blur-[2px] opacity-50"></div>
                </motion.button>
            </div>
            
            {/* Short Feature Preview */}
            <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-6 border border-cyber-panel bg-cyber-dark/50">
                    <Shield className="mx-auto text-cyber-cyan mb-4" />
                    <h3 className="text-white font-bold mb-2">AUDITORÍA IA</h3>
                    <p className="text-sm text-gray-500">Detección de vulnerabilidades en tiempo real.</p>
                </div>
                 <div className="p-6 border border-cyber-panel bg-cyber-dark/50">
                    <Zap className="mx-auto text-green-400 mb-4" />
                    <h3 className="text-white font-bold mb-2">CÓDIGO SEGURO</h3>
                    <p className="text-sm text-gray-500">Generación de funciones blindadas.</p>
                </div>
                 <div className="p-6 border border-cyber-panel bg-cyber-dark/50">
                    <Siren className="mx-auto text-cyber-pink mb-4" />
                    <h3 className="text-white font-bold mb-2">SIMULACIÓN</h3>
                    <p className="text-sm text-gray-500">Cálculo de impacto de crisis.</p>
                </div>
            </div>

            <footer className="relative z-10 border-t border-cyber-dark bg-cyber-black py-8 text-center text-xs text-gray-600 font-mono">
                <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-4">
                    <div className="flex items-center gap-2"><Lock size={12} /> SSL 256-BIT ENCRYPTION</div>
                    <div className="flex items-center gap-2"><FileCheck size={12} /> COMPLIANCE-READY</div>
                </div>
                <p>SENTINEL CORE © 2025. PROTECTING YOUR DIGITAL ASSETS.</p>
                <button onClick={onTerms} className="mt-2 hover:text-cyber-cyan underline">Términos de Servicio</button>
            </footer>
        </div>
    );
};

const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-cyber-black text-cyber-text p-8 font-mono">
            <button onClick={onBack} className="flex items-center gap-2 text-cyber-cyan mb-8 hover:underline">
                <ArrowRight className="rotate-180" size={16} /> Volver
            </button>
            <div className="max-w-3xl mx-auto prose prose-invert">
                <h1 className="text-3xl font-bold text-white mb-6 uppercase border-b border-cyber-pink pb-4">Términos de Servicio</h1>
                <p>El usuario se compromete a utilizar SENTINEL CORE exclusivamente con fines defensivos. Cualquier uso no autorizado es ilegal.</p>
            </div>
        </div>
    );
};

const AboutView: React.FC<{ language: Language }> = ({ language }) => {
    const content = DICTIONARY[language].aboutContent;
    
    return (
        <div className="h-full overflow-y-auto p-8 bg-cyber-dark/50 rounded-sm border border-cyber-panel">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-6 animate-fade-in">
                     <div className="flex items-center justify-center gap-4 mb-6">
                        <Hexagon size={48} className="text-cyber-cyan" />
                        <h1 className="text-4xl font-bold tracking-widest text-white">SENTINEL CORE</h1>
                     </div>
                     <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto border-l-2 border-cyber-cyan pl-6 italic font-mono">
                        {content.intro}
                     </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.sections.map((section: any, idx: number) => (
                        <div key={idx} className="bg-cyber-panel p-6 border border-cyber-dark hover:border-cyber-cyan/30 transition-colors group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyber-cyan/10 to-transparent pointer-events-none"></div>
                            <h3 className="text-cyber-cyan font-bold text-sm tracking-widest mb-3 group-hover:text-white transition-colors uppercase">
                                {section.title}
                            </h3>
                            <p className="text-gray-400 text-xs leading-relaxed text-justify font-mono">
                                {section.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<{ user: User, onBack: () => void, onUpgradeNeeded: () => void, incrementUsage: () => void }> = ({ user, onBack, onUpgradeNeeded, incrementUsage }) => {
  const [currentModule, setCurrentModule] = useState<SentinelModule>(SentinelModule.ABOUT_PLATFORM);
  const [currentLang, setCurrentLang] = useState<Language>('es');
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New state for manual API Key override
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const t = DICTIONARY[currentLang];

  // Helper: Check if module is allowed for current plan
  const isModuleLocked = (module: SentinelModule) => {
      if (user.plan === 'COMMAND') return false;
      if (user.plan === 'FREE') return false; // Free can access all, but limited by count
      if (user.plan === 'OPERATIVE') {
          // Operative allows Audit & Advisory only (and About)
          const allowed = [SentinelModule.AUDIT_ENGINE, SentinelModule.ADVISORY_CHAT, SentinelModule.ABOUT_PLATFORM];
          return !allowed.includes(module);
      }
      return false;
  };

  const handleExecute = async () => {
    // 1. Check Usage Limit for Free Plan
    if (user.plan === 'FREE' && user.usageCount >= 1) {
        onUpgradeNeeded();
        return;
    }

    if (!inputCode.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);
    try {
      // Pass the manual apiKey if present
      const result = await analyzeRequest(inputCode, currentModule, currentLang, apiKey);
      setAnalysisData(result);
      incrementUsage(); // Increment usage after successful call
    } catch (err: any) {
      setError(err.message || "Secure link compromised or API Key missing.");
    } finally {
      setIsLoading(false);
    }
  };

  const getModuleConfig = (module: SentinelModule) => {
    switch (module) {
        case SentinelModule.AUDIT_ENGINE: return { title: t.modules.audit.title, desc: t.modules.audit.desc, icon: <Shield size={18} />, color: 'text-cyber-cyan', placeholder: t.modules.audit.placeholder };
        case SentinelModule.ADVISORY_CHAT: return { title: t.modules.advisory.title, desc: t.modules.advisory.desc, icon: <MessageSquare size={18} />, color: 'text-cyber-pink', placeholder: t.modules.advisory.placeholder };
        case SentinelModule.SECURE_FORGE: return { title: t.modules.forge.title, desc: t.modules.forge.desc, icon: <Zap size={18} />, color: 'text-green-400', placeholder: t.modules.forge.placeholder };
        case SentinelModule.CRISIS_SIMULATOR: return { title: t.modules.crisis.title, desc: t.modules.crisis.desc, icon: <Siren size={18} />, color: 'text-red-500', placeholder: t.modules.crisis.placeholder };
        case SentinelModule.COMPLIANCE_SHIELD: return { title: t.modules.compliance.title, desc: t.modules.compliance.desc, icon: <FileCheck size={18} />, color: 'text-blue-400', placeholder: t.modules.compliance.placeholder };
        case SentinelModule.LEAK_HUNTER: return { title: t.modules.leak.title, desc: t.modules.leak.desc, icon: <Radar size={18} />, color: 'text-purple-400', placeholder: t.modules.leak.placeholder };
        case SentinelModule.ABOUT_PLATFORM: return { title: t.modules.about.title, desc: t.modules.about.desc, icon: <Info size={18} />, color: 'text-gray-400', placeholder: '' };
    }
  };

  const activeConfig = getModuleConfig(currentModule);
  const locked = isModuleLocked(currentModule);

  return (
    <div className="flex h-screen bg-cyber-black overflow-hidden font-sans">
        {showKeyModal && (
            <ApiKeyModal 
                onClose={() => setShowKeyModal(false)}
                onSave={(key) => { setApiKey(key); setShowKeyModal(false); }}
            />
        )}

        {/* SIDEBAR */}
        <motion.aside 
            initial={{ x: -100 }} animate={{ x: 0 }}
            className="w-16 md:w-64 bg-cyber-dark border-r border-cyber-panel flex flex-col z-20"
        >
            <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-cyber-panel">
                <Hexagon className="text-cyber-cyan" size={24} />
                <span className="ml-3 font-bold tracking-widest text-white hidden md:block">SENTINEL</span>
            </div>
            
            {/* User Info Snippet */}
            <div className="p-4 border-b border-cyber-panel">
                <div className="flex items-center gap-2 mb-1">
                    <UserIcon size={14} className="text-gray-400"/>
                    <span className="text-xs text-white truncate max-w-[100px] hidden md:block">{user.name || user.email.split('@')[0]}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-1.5 rounded ${user.plan === 'COMMAND' ? 'bg-cyber-pink text-black' : user.plan === 'OPERATIVE' ? 'bg-cyber-cyan text-black' : 'bg-gray-700 text-gray-300'}`}>
                        {user.plan}
                    </span>
                    {user.plan === 'FREE' && (
                        <span className="text-[10px] text-gray-500 font-mono hidden md:block">{user.usageCount}/1</span>
                    )}
                </div>
            </div>

            <nav className="flex-1 py-6 space-y-1 px-2 overflow-y-auto">
                {Object.values(SentinelModule).map((module) => {
                    const config = getModuleConfig(module);
                    const isActive = currentModule === module;
                    const isLocked = isModuleLocked(module);
                    
                    return (
                        <button
                            key={module}
                            onClick={() => { setCurrentModule(module); setAnalysisData(null); setError(null); }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-sm transition-all group relative ${isActive ? 'bg-cyber-panel border-l-2 border-cyber-cyan' : 'hover:bg-cyber-panel/50 text-gray-500 hover:text-gray-300'} ${isLocked ? 'opacity-50' : ''}`}
                        >
                            <div className={`${isActive ? config.color : 'group-hover:text-white'} transition-colors`}>{config.icon}</div>
                            <div className="text-left hidden md:block">
                                <div className={`text-xs font-bold uppercase tracking-wide ${isActive ? 'text-white' : ''}`}>{config.title}</div>
                            </div>
                            {isLocked && <Lock size={12} className="absolute right-2 top-4 text-gray-600 hidden md:block" />}
                        </button>
                    )
                })}
            </nav>
            <div className="p-4 border-t border-cyber-panel text-center md:text-left space-y-2">
                {user.plan === 'FREE' && (
                    <button onClick={onUpgradeNeeded} className="w-full flex items-center justify-center gap-2 bg-cyber-pink/10 text-cyber-pink text-xs py-2 border border-cyber-pink/50 hover:bg-cyber-pink hover:text-black transition-colors mb-2">
                        <CreditCard size={12} /> {t.ui.upgrade}
                    </button>
                )}
                <button onClick={onBack} className="text-xs text-gray-600 hover:text-white hover:underline font-mono w-full text-center">LOGOUT</button>
            </div>
        </motion.aside>

        {/* MAIN */}
        <main className="flex-1 flex flex-col min-w-0">
             {/* TOP BAR */}
            <header className="h-16 border-b border-cyber-panel bg-cyber-black/95 backdrop-blur flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4">
                     <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        {activeConfig.icon} <span className={activeConfig.color}>{activeConfig.title}</span>
                     </h2>
                </div>
                <div className="flex items-center gap-4">
                     {/* Manual API Key Integration Button */}
                     <button 
                        onClick={() => setShowKeyModal(true)}
                        className={`px-3 py-1.5 rounded flex items-center gap-2 text-[10px] font-bold uppercase transition-all border ${apiKey ? 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-cyber-cyan'}`}
                     >
                        <Key size={12} />
                        {apiKey ? 'API KEY CONECTADA' : t.ui.integrateApi}
                     </button>

                     <div className="flex bg-cyber-panel rounded border border-cyber-dark">
                        {(['es', 'en'] as Language[]).map(lang => (
                            <button key={lang} onClick={() => setCurrentLang(lang)} className={`px-2 py-1 text-[10px] font-bold uppercase ${currentLang === lang ? 'bg-cyber-dark text-cyber-cyan' : 'text-gray-600 hover:text-gray-400'}`}>
                                {lang}
                            </button>
                        ))}
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-full">
                        <Lock size={10} className="text-cyber-cyan" />
                        <span className="text-[10px] font-mono text-cyber-cyan">{t.ui.secureChannel}</span>
                     </div>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-6 overflow-hidden">
                
                {currentModule === SentinelModule.ABOUT_PLATFORM ? (
                    <AboutView language={currentLang} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                        {/* INPUT PANEL */}
                        <div className="flex flex-col gap-2 h-full min-h-[400px]">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-mono text-cyber-cyan uppercase tracking-widest">{t.ui.commandInput}</span>
                                <span className="text-[10px] font-mono text-gray-600">{currentModule}</span>
                            </div>
                            <div className="relative flex-1 group border border-cyber-panel bg-cyber-dark rounded-sm overflow-hidden relative">
                                {locked ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
                                        <Lock size={48} className="text-gray-700 mb-4" />
                                        <h3 className="text-white font-bold tracking-widest">{t.ui.locked}</h3>
                                        <p className="text-gray-500 text-sm mb-4">{t.ui.lockedDesc}</p>
                                        <button onClick={onUpgradeNeeded} className="px-6 py-2 bg-cyber-cyan text-black font-bold text-xs uppercase hover:bg-white">{t.ui.upgrade}</button>
                                    </div>
                                ) : null}

                                <textarea
                                    className="w-full h-full bg-transparent text-sm font-mono p-4 text-cyber-text outline-none resize-none placeholder:text-gray-700"
                                    placeholder={activeConfig.placeholder}
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value)}
                                    spellCheck={false}
                                    disabled={locked}
                                />
                                <button
                                    onClick={handleExecute}
                                    disabled={isLoading || !inputCode.trim() || locked}
                                    className="absolute bottom-4 right-4 bg-cyber-cyan text-black font-bold text-xs px-6 py-2 uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                >
                                    {isLoading ? t.ui.processing : t.ui.execute}
                                </button>
                                {isLoading && <div className="absolute inset-0 bg-cyber-cyan/5 animate-pulse pointer-events-none"></div>}
                            </div>
                        </div>

                        {/* OUTPUT PANEL */}
                        <div className="flex flex-col h-full bg-cyber-dark border border-cyber-panel rounded-sm relative overflow-hidden">
                            <div className="h-8 bg-cyber-panel border-b border-cyber-dark flex items-center justify-between px-3">
                                <span className="text-[10px] font-mono text-gray-500 uppercase">{t.ui.report}</span>
                                <Activity size={12} className={isLoading ? "text-cyber-cyan animate-spin" : "text-gray-600"} />
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                                {!analysisData && !isLoading && !error && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-700 font-mono">
                                        <AlertOctagon size={48} className="mb-4 opacity-20" />
                                        <p className="text-xs tracking-widest">{t.ui.systemIdle}</p>
                                    </div>
                                )}
                                
                                {error && (
                                     <div className="p-4 border border-cyber-pink/30 bg-cyber-pink/10 text-cyber-pink font-mono text-sm text-center">
                                        {t.ui.aborted}: {error}
                                     </div>
                                )}

                                {analysisData && (
                                    <div className="animate-fade-in space-y-8">
                                         {/* Structured Audit Result */}
                                         {analysisData.type === 'audit' && typeof analysisData.result !== 'string' && (
                                             <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <ScoreGauge score={analysisData.result.securityScore} />
                                                    <div className="border border-cyber-panel p-4 bg-black/50">
                                                        <h4 className="text-[10px] font-mono text-gray-500 uppercase mb-4">{t.ui.riskDist}</h4>
                                                        <ResponsiveContainer width="100%" height={150}>
                                                            <BarChart data={[
                                                                { name: 'CRIT', count: analysisData.result.vulnerabilities.filter(v => v.severity === Severity.CRITICAL).length, color: '#ff0055' },
                                                                { name: 'HIGH', count: analysisData.result.vulnerabilities.filter(v => v.severity === Severity.HIGH).length, color: '#ef4444' },
                                                                { name: 'MED', count: analysisData.result.vulnerabilities.filter(v => v.severity === Severity.MEDIUM).length, color: '#f59e0b' },
                                                                { name: 'LOW', count: analysisData.result.vulnerabilities.filter(v => v.severity === Severity.LOW).length, color: '#00f2ff' },
                                                            ]}>
                                                                <Bar dataKey="count"><Cell fill="#ff0055"/><Cell fill="#ef4444"/><Cell fill="#f59e0b"/><Cell fill="#00f2ff"/></Bar>
                                                                <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-cyber-cyan font-mono text-sm uppercase mb-2 border-b border-cyber-cyan/20 pb-1">{t.ui.execSummary}</h3>
                                                    <p className="text-sm text-gray-400 font-mono leading-relaxed">{analysisData.result.executiveSummary}</p>
                                                </div>

                                                <div>
                                                    <h3 className="text-cyber-pink font-mono text-sm uppercase mb-4 border-b border-cyber-pink/20 pb-1">{t.ui.threats}</h3>
                                                    <VulnerabilityList vulnerabilities={analysisData.result.vulnerabilities} language={currentLang} />
                                                </div>

                                                <div>
                                                    <h3 className="text-white font-mono text-sm uppercase mb-4 border-b border-white/10 pb-1">{t.ui.techReport}</h3>
                                                    <MarkdownDisplay content={analysisData.result.detailedReportMarkdown} />
                                                </div>
                                             </>
                                         )}

                                         {/* Text Result */}
                                         {analysisData.type === 'text' && typeof analysisData.result === 'string' && (
                                             <MarkdownDisplay content={analysisData.result} />
                                         )}

                                        {/* Grounding Sources / Citations */}
                                        {analysisData.groundingSources && analysisData.groundingSources.length > 0 && (
                                            <div className="mt-8 pt-4 border-t border-cyber-panel">
                                                <h3 className="text-xs font-mono text-gray-500 uppercase mb-3">{t.ui.sources || 'SOURCES'}</h3>
                                                <ul className="space-y-2">
                                                    {analysisData.groundingSources.map((source, idx) => (
                                                        <li key={idx} className="flex items-start gap-2">
                                                            <ExternalLink size={12} className="text-cyber-cyan mt-0.5" />
                                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-cyber-cyan hover:underline font-mono break-all">
                                                                {source.title}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                         <div className="text-center pt-8 opacity-50">
                                             <span className="text-[10px] font-mono tracking-[0.2em]">{t.ui.footer}</span>
                                         </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};

// --- APP ROOT ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Auth Handling
  const handleLogin = (email: string, name: string | undefined, plan: PlanType) => {
      setUser({ email, name, plan, usageCount: 0 });
      setShowAuth(false);
      setView('dashboard');
  };

  const handleStartAccess = () => {
      if (user) {
          setView('dashboard');
      } else {
          setShowAuth(true);
      }
  };

  const handleUpgrade = (plan: PlanType) => {
      if (user) {
          setUser({ ...user, plan: plan }); // Unlock features
          setShowUpgrade(false);
      }
  };

  return (
    <AnimatePresence mode="wait">
      {showAuth && <AuthModal onLogin={handleLogin} onClose={() => setShowAuth(false)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onUpgrade={handleUpgrade} />}

      {view === 'landing' && (
        <motion.div key="landing" exit={{ opacity: 0 }}>
            <LandingPage onStart={handleStartAccess} onTerms={() => setView('terms')} />
        </motion.div>
      )}
      {view === 'terms' && (
        <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TermsPage onBack={() => setView('landing')} />
        </motion.div>
      )}
      {view === 'dashboard' && user && (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dashboard 
                user={user}
                onBack={() => { setUser(null); setView('landing'); }} 
                onUpgradeNeeded={() => setShowUpgrade(true)}
                incrementUsage={() => setUser({ ...user, usageCount: user.usageCount + 1 })}
            />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;