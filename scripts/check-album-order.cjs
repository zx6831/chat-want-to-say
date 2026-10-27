const assert = require('assert/strict')
const fs = require('fs')
const path = require('path')
const { comparePhotos, photoSortTimestamp, selectPhotoDate } = require('./prepare-album.cjs')

const projectRoot = path.resolve(__dirname, '..')
const manifestPath = path.join(projectRoot, 'public', 'album-generated', 'manifest.json')
const fileDatesPath = path.join(projectRoot, 'src', 'assets', 'album-file-dates.json')
const reportedPhotoName = '659d5e21bedca5306220a40952cea072.JPG'
const reportedModifiedAt = '2026-03-08T13:07:15.000Z'

const metadataDate = Date.parse('2024-01-01T00:00:00.000Z')
const modifiedDate = Date.parse('2024-02-01T00:00:00.000Z')
const createdDate = Date.parse('2024-03-01T00:00:00.000Z')
const cloudCheckoutDate = Date.parse('2026-10-27T07:41:54.522Z')
const preservedFileDates = {
  modifiedAt: '2026-03-08T13:07:15.000Z',
  createdAt: '2026-10-26T22:15:12.723Z'
}

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
assert.deepEqual(
  selectPhotoDate(null, {
    mtimeMs: cloudCheckoutDate,
    birthtimeMs: cloudCheckoutDate,
    ctimeMs: cloudCheckoutDate
  }, preservedFileDates),
  {
    takenAtMs: Date.parse(preservedFileDates.modifiedAt),
    dateSource: 'file-modified',
    createdAtMs: Date.parse(preservedFileDates.createdAt),
    modifiedAtMs: Date.parse(preservedFileDates.modifiedAt)
  },
  'tracked source dates must override deployment checkout timestamps'
)
assert.equal(photoSortTimestamp({ capturedAt: metadataDate, modifiedAt: modifiedDate, createdAt: createdDate }), metadataDate)
assert.equal(photoSortTimestamp({ modifiedAt: modifiedDate, createdAt: createdDate }), modifiedDate)
assert.equal(photoSortTimestamp({ createdAt: createdDate }), createdDate)

const fileDates = JSON.parse(fs.readFileSync(fileDatesPath, 'utf8'))
assert.equal(fileDates.photos[reportedPhotoName].modifiedAt, reportedModifiedAt, `${reportedPhotoName} must keep its original March modified time`)

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const invalidFallbacks = manifest.filter(photo => photo.dateSource !== 'metadata' && photo.modifiedAt && photo.takenAt !== photo.modifiedAt)
  assert.equal(invalidFallbacks.length, 0, `${invalidFallbacks.length} photos skipped modifiedAt before createdAt`)

  for (let index = 1; index < manifest.length; index++) {
    assert.ok(comparePhotos(manifest[index - 1], manifest[index]) <= 0, `manifest order broke at ${manifest[index].name}`)
  }

  const reportedPhoto = manifest.find(photo => photo.name === reportedPhotoName)
  assert.ok(reportedPhoto, `${reportedPhotoName} is missing from manifest`)
  assert.equal(reportedPhoto.capturedAt, null, `${reportedPhotoName} should use file dates because it has no capture date`)
  assert.equal(reportedPhoto.takenAt, reportedModifiedAt, `${reportedPhotoName} should sort by its March modified time`)
}

console.log('Album date priority verified: capture time -> modified time -> created time.')
