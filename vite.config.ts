import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Plugin to generate compact ZIP data at build time
function zipDataPlugin(): Plugin {
  const virtualModuleId = 'virtual:zip-data';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'zip-data-plugin',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        // Read and convert raw ZIP data at build time
        const rawPath = path.resolve(__dirname, 'scripts/raw-zips.json');
        
        if (!fs.existsSync(rawPath)) {
          console.warn('ZIP data file not found, using empty dataset');
          return 'export default {};';
        }
        
        const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
        const compact: Record<string, [string, string]> = {};
        
        for (const entry of raw) {
          const zip = String(entry.zip_code).padStart(5, '0');
          compact[zip] = [entry.city, entry.state];
        }
        
        return `export default ${JSON.stringify(compact)};`;
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    zipDataPlugin(),
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
