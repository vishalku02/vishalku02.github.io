import { defineConfig } from 'vite'
import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'

function parseSimpleYaml(yamlText) {
  const values = {}
  for (const line of yamlText.split('\n')) {
    const match = line.match(/^(\w+):\s*(.+?)\s*$/)
    if (match) values[match[1]] = match[2]
  }
  return values
}

function parseFrontMatter(pageText) {
  const match = pageText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { page: {}, content: pageText }

  return {
    page: parseSimpleYaml(match[1]),
    content: pageText.slice(match[0].length),
  }
}

function renderLiquid(template, site, page, content) {
  return template
    .replace(/\{\{\s*content\s*\}\}/g, content)
    .replace(/\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}/g, '$1')
    .replace(/\{%\s*if site\.(\w+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, (_, key, body) => (site[key] ? body : ''))
    .replace(/\{%\s*if page\.(\w+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, (_, key, body) => (page[key] ? body : ''))
    .replace(/\{\{\s*site\.(\w+)\s*\}\}/g, (_, key) => site[key] ?? '')
    .replace(/\{\{\s*page\.(\w+)\s*\}\}/g, (_, key) => page[key] ?? '')
}

function jekyllPreview() {
  return {
    name: 'jekyll-preview',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestPath = decodeURIComponent(req.url.split('?')[0])
        const relativePath = requestPath.endsWith('/')
          ? `${requestPath.slice(1)}index.html`
          : requestPath.slice(1)
        const pagePath = resolve(__dirname, relativePath || 'index.html')

        if (!pagePath.startsWith(`${resolve(__dirname)}/`) || !existsSync(pagePath)) return next()

        const pageText = readFileSync(pagePath, 'utf8')
        const { page, content } = parseFrontMatter(pageText)
        if (!page.layout) return next()

        const layoutPath = resolve(__dirname, '_layouts', `${page.layout}.html`)
        if (!existsSync(layoutPath)) return next()

        const site = parseSimpleYaml(readFileSync(resolve(__dirname, '_config.yml'), 'utf8'))
        const layout = readFileSync(layoutPath, 'utf8')
        res.setHeader('Content-Type', 'text/html')
        res.end(renderLiquid(layout, site, page, content))
      })
    },
  }
}

export default defineConfig({
  plugins: [jekyllPreview()],
})
