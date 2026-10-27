const fs = require('fs/promises')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const sourceDir = path.join(projectRoot, 'src', 'assets', 'album')
const outputPath = path.join(projectRoot, 'src', 'assets', 'album-file-dates.json')
const supportedExtensions = new Set(['.avif', '.gif', '.heic', '.heif', '.jpeg', '.jpg', '.png', '.webp'])

function validTimestamp (value) {
  return Number.isFinite(value) && value > 0 ? value : null
}

async function main () {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })
  const names = entries
    .filter(entry => entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase()))
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right, 'zh-CN', { numeric: true }))

  const photos = {}
  for (const name of names) {
    const stats = await fs.stat(path.join(sourceDir, name))
    const modifiedAtMs = validTimestamp(stats.mtimeMs)
    const createdAtMs = validTimestamp(stats.birthtimeMs) || validTimestamp(stats.ctimeMs)
    photos[name] = {
      size: stats.size,
      modifiedAt: modifiedAtMs ? new Date(modifiedAtMs).toISOString() : null,
      createdAt: createdAtMs ? new Date(createdAtMs).toISOString() : null
    }
  }

  await fs.writeFile(outputPath, `${JSON.stringify({ version: 1, photos }, null, 2)}\n`, 'utf8')
  console.log(`Captured original file dates for ${names.length} album photos.`)
}

main().catch(error => {
  console.error('Album file-date capture failed:', error)
  process.exitCode = 1
})
