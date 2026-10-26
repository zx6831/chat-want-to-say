const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')
const exifr = require('exifr')
const convertHeic = require('heic-convert')

const projectRoot = path.resolve(__dirname, '..')
const sourceDir = path.join(projectRoot, 'src', 'assets', 'album')
const outputDir = path.join(projectRoot, 'public', 'album-generated')
const manifestPath = path.join(outputDir, 'manifest.json')

const browserImageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'])
const heicExtensions = new Set(['.heic', '.heif'])
const supportedExtensions = new Set([...browserImageExtensions, ...heicExtensions])

async function main () {
  await fs.mkdir(sourceDir, { recursive: true })
  await fs.mkdir(outputDir, { recursive: true })

  const entries = await fs.readdir(sourceDir, { withFileTypes: true })
  const sourceNames = entries
    .filter(entry => entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase()))
    .map(entry => entry.name)

  const photos = await mapWithConcurrency(sourceNames, 2, preparePhoto)
  photos.sort(comparePhotos)

  const keepFiles = new Set(['manifest.json', ...photos.map(photo => photo.file)])
  const generatedEntries = await fs.readdir(outputDir, { withFileTypes: true })
  await Promise.all(generatedEntries
    .filter(entry => entry.isFile() && !keepFiles.has(entry.name))
    .map(entry => fs.unlink(path.join(outputDir, entry.name))))

  const manifest = photos.map(({ file, ...photo }) => ({
    ...photo,
    src: file
  }))
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  const convertedCount = photos.filter(photo => photo.converted).length
  const metadataCount = photos.filter(photo => photo.dateSource === 'metadata').length
  const fallbackCount = photos.length - metadataCount
  console.log(`Album prepared: ${photos.length} photos (${convertedCount} HEIC converted, ${metadataCount} metadata dates, ${fallbackCount} file-date fallbacks).`)
}

async function preparePhoto (name) {
  const sourcePath = path.join(sourceDir, name)
  const extension = path.extname(name).toLowerCase()
  const detectedFormat = await detectImageFormat(sourcePath, extension)
  const stats = await fs.stat(sourcePath)
  const metadataDate = await readCaptureDate(sourcePath)
  const takenAtMs = metadataDate || validTimestamp(stats.birthtimeMs) || validTimestamp(stats.ctimeMs) || stats.mtimeMs
  const fingerprint = crypto
    .createHash('sha1')
    .update(`${name}\0${stats.size}\0${stats.mtimeMs}`)
    .digest('hex')
    .slice(0, 16)
  const needsHeicConversion = heicExtensions.has(detectedFormat)
  const outputExtension = needsHeicConversion ? '.jpg' : detectedFormat
  const outputName = `${fingerprint}${outputExtension}`
  const outputPath = path.join(outputDir, outputName)

  if (!(await fileExists(outputPath))) {
    if (needsHeicConversion) {
      try {
        const output = await convertHeic({
          buffer: await fs.readFile(sourcePath),
          format: 'JPEG',
          quality: 0.88
        })
        await fs.writeFile(outputPath, Buffer.from(output))
      } catch (error) {
        throw new Error(`${name} HEIC conversion failed: ${error.message}`)
      }
    } else {
      await fs.copyFile(sourcePath, outputPath)
    }
  }

  return {
    id: fingerprint,
    file: outputName,
    name,
    takenAt: new Date(takenAtMs).toISOString(),
    dateSource: metadataDate ? 'metadata' : 'file-created',
    createdAt: new Date(validTimestamp(stats.birthtimeMs) || validTimestamp(stats.ctimeMs) || stats.mtimeMs).toISOString(),
    modifiedAt: new Date(stats.mtimeMs).toISOString(),
    originalFormat: extension.slice(1),
    detectedFormat: detectedFormat.slice(1),
    converted: needsHeicConversion
  }
}

async function detectImageFormat (filePath, fallbackExtension) {
  const handle = await fs.open(filePath, 'r')
  try {
    const header = Buffer.alloc(32)
    const { bytesRead } = await handle.read(header, 0, header.length, 0)
    const bytes = header.subarray(0, bytesRead)

    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return '.jpg'
    if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png'
    if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) return '.gif'
    if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return '.webp'

    const fileTypeOffset = bytes.indexOf(Buffer.from('ftyp'))
    if (fileTypeOffset >= 0 && bytes.length >= fileTypeOffset + 8) {
      const brand = bytes.subarray(fileTypeOffset + 4, fileTypeOffset + 8).toString('ascii').toLowerCase()
      if (['avif', 'avis'].includes(brand)) return '.avif'
      if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) return '.heic'
    }

    return fallbackExtension
  } finally {
    await handle.close()
  }
}

async function readCaptureDate (filePath) {
  try {
    const metadata = await exifr.parse(filePath, ['DateTimeOriginal', 'CreateDate'])
    if (!metadata) return null
    return validDateValue(metadata.DateTimeOriginal) || validDateValue(metadata.CreateDate)
  } catch (error) {
    if (error.message !== 'Unknown file format') {
      console.warn(`Album metadata warning: ${path.basename(filePath)} (${error.message})`)
    }
    return null
  }
}

function validDateValue (value) {
  if (!value) return null
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value)
  return validTimestamp(timestamp)
}

function validTimestamp (value) {
  return Number.isFinite(value) && value > 0 ? value : null
}

function comparePhotos (left, right) {
  const timeDifference = Date.parse(left.takenAt) - Date.parse(right.takenAt)
  if (timeDifference !== 0) return timeDifference

  const modifiedDifference = Date.parse(left.modifiedAt) - Date.parse(right.modifiedAt)
  if (modifiedDifference !== 0) return modifiedDifference

  return left.name.localeCompare(right.name, 'zh-CN', { numeric: true })
}

async function fileExists (filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch (ignore) {
    return false
  }
}

async function mapWithConcurrency (items, limit, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function worker () {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await mapper(items[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

main().catch(error => {
  console.error('Album preparation failed:', error)
  process.exitCode = 1
})
