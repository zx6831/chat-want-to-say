const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { comparePhotos, photoSortTimestamp, selectPhotoDate } = require('./prepare-album.cjs')

const projectRoot = path.resolve(__dirname, '..')
const manifestPath = path.join(projectRoot, 'public', 'album-generated', 'manifest.json')

const metadataDate = Date.parse('2024-01-01T00:00:00.000Z')
const modifiedDate = Date.parse('2024-02-01T00:00:00.000Z')
const createdDate = Date.parse('2024-03-01T00:00:00.000Z')

assert.deepEqual(
  selectPhotoDate(metadataDate, { mtimeMs: modifiedDate, birthtimeMs: createdDate, ctimeMs: createdDate }),
  { takenAtMs: metadataDate, dateSource: 'metadata', createdAtMs: createdDate, modifiedAtMs: modifiedDate }
)
assert.deepEqual(
  selectPhotoDate(null, { mtimeMs: modifiedDate, birthtimeMs: createdDate, ctimeMs: createdDate }),
  { takenAtMs: modifiedDate, dateSource: 'file-modified', createdAtMs: createdDate, modifiedAtMs: modifiedDate }
)
assert.deepEqual(
  selectPhotoDate(null, { mtimeMs: 0, birthtimeMs: createdDate, ctimeMs: createdDate + 1 }),
  { takenAtMs: createdDate, dateSource: 'file-created', createdAtMs: createdDate, modifiedAtMs: null }
)
assert.equal(photoSortTimestamp({ capturedAt: metadataDate, modifiedAt: modifiedDate, createdAt: createdDate }), metadataDate)
assert.equal(photoSortTimestamp({ modifiedAt: modifiedDate, createdAt: createdDate }), modifiedDate)
assert.equal(photoSortTimestamp({ createdAt: createdDate }), createdDate)

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const invalidFallbacks = manifest.filter(photo => photo.dateSource !== 'metadata' && photo.modifiedAt && photo.takenAt !== photo.modifiedAt)
  assert.equal(invalidFallbacks.length, 0, `${invalidFallbacks.length} photos skipped modifiedAt before createdAt`)

  for (let index = 1; index < manifest.length; index++) {
    assert.ok(comparePhotos(manifest[index - 1], manifest[index]) <= 0, `manifest order broke at ${manifest[index].name}`)
  }
}

console.log('Album date priority verified: capture time -> modified time -> created time.')
