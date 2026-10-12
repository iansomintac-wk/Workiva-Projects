import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds to a single self-contained dist/index.html so the explainer can be
// published as one artifact (no cross-file links to break).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
});
