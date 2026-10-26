export const AVATAR_STORAGE_KEY = 'chat-want-to-say:avatars:v1'
export const DEFAULT_AVATARS = {
  author: `${import.meta.env.BASE_URL}avatars/author.jpg`,
  me: `${import.meta.env.BASE_URL}avatars/me.jpg`
}

export function readLocalJson (key, fallback) {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch (ignore) {
    return fallback
  }
}

export function writeLocalJson (key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export async function imageFileToDataUrl (file, { square = false, maxSize = 960, quality = 0.84 } = {}) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('请选择图片文件')
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('单张图片不能超过 12MB')
  }

  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器无法处理图片')

  let sourceX = 0
  let sourceY = 0
  let sourceWidth = image.naturalWidth
  let sourceHeight = image.naturalHeight

  if (square) {
    const edge = Math.min(sourceWidth, sourceHeight)
    sourceX = (sourceWidth - edge) / 2
    sourceY = (sourceHeight - edge) / 2
    sourceWidth = edge
    sourceHeight = edge
    canvas.width = maxSize
    canvas.height = maxSize
  } else {
    const scale = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight))
    canvas.width = Math.max(1, Math.round(sourceWidth * scale))
    canvas.height = Math.max(1, Math.round(sourceHeight * scale))
  }

  context.fillStyle = '#f3f1fb'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return canvas.toDataURL('image/jpeg', quality)
}

function loadImage (file) {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(source)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(source)
      reject(new Error('图片读取失败，请换一张试试'))
    }
    image.src = source
  })
}
