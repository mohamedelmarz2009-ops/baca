import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno locales si existen
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // CAPTURA DE LA LLAVE MAESTRA:
  // Busca primero en las variables del sistema (Vercel) y luego en archivos .env
  // Esto asegura que la llave que pongas en Vercel sea la que se use para todos los usuarios.
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // INYECCIÓN PERMANENTE:
      // Esto "quema" la llave dentro del código JavaScript final.
      // Cuando un usuario entre a tu web, la aplicación ya tendrá la llave configurada.
      // No caduca (mientras no la cambies en Vercel) y es la misma para todos.
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