import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno locales si existen
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // CAPTURA DE LA LLAVE MAESTRA:
  // Se prioriza la variable de entorno, pero se usa la LLAVE MAESTRA proporcionada
  // como respaldo GARANTIZADO si la configuración del servidor falla.
  const apiKey = process.env.API_KEY || env.API_KEY || "AIzaSyBYebg7cldNtx77C36YUptjafekZyunExk";

  return {
    plugins: [react()],
    define: {
      // INYECCIÓN PERMANENTE:
      // Esto "quema" la llave dentro del código JavaScript final.
      // Cuando un usuario entre a tu web, la aplicación ya tendrá la llave configurada.
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
    }
  }
});