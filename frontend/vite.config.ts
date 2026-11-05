import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const runtimePath = path.join(rootDir, '.local_session')

type RuntimeSession = { token?: string; port?: number }

function readRuntime(): RuntimeSession {
  try {
    const raw = fs.readFileSync(runtimePath, 'utf8')
    const data = JSON.parse(raw) as RuntimeSession
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

const bootRuntime = readRuntime()
const apiPort = typeof bootRuntime.port === 'number' ? bootRuntime.port : 8765

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-local-app-token',
      transformIndexHtml(html: string) {
        const token = readRuntime().token
        if (!token) return html
        const snippet = `<script>window.__APP_TOKEN__=${JSON.stringify(token)};</script>`
        return html.includes('</head>') ? html.replace('</head>', `${snippet}</head>`) : `${snippet}${html}`
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})