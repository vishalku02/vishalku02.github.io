import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'

function parseSimpleYaml(yamlText) {
  const values = {}
  for (const line of yamlText.split('\n')) {
    const match = line.match(/^(\w+):\s*(.+?)\s*$/)
    if (match) values[match[1]] = match[2]
  }
  return values
}

function renderLiquid(template, site, content) {
  return template
    .replace(/\{\{\s*content\s*\}\}/g, content)
    .replace(/\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}/g, '$1')
    .replace(/\{%\s*if site\.(\w+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, (_, key, body) => (site[key] ? body : ''))
    .replace(/\{\{\s*site\.(\w+)\s*\}\}/g, (_, key) => site[key] ?? '')
}

function jekyllPreview() {
  return {
    name: 'jekyll-preview',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url.split('?')[0]
        if (path !== '/' && path !== '/index.html') return next()
        const site = parseSimpleYaml(readFileSync(resolve(__dirname, '_config.yml'), 'utf8'))
        const layout = readFileSync(resolve(__dirname, '_layouts/default.html'), 'utf8')
        const page = readFileSync(resolve(__dirname, 'index.html'), 'utf8')
        const content = page.replace(/^---[\s\S]*?---\n/, '')
        res.setHeader('Content-Type', 'text/html')
        res.end(renderLiquid(layout, site, content))
      })
    },
  }
}

export default defineConfig({
  plugins: [jekyllPreview()],
})
