<template>
  <section class="album-space" aria-labelledby="album-space-title">
    <div class="album-aurora" aria-hidden="true"></div>
    <header class="album-header">
      <button class="album-round-button" type="button" aria-label="返回聊天" @click="$emit('close')">
        <svg viewBox="0 0 24 24"><path d="M18 12H6m5-5-5 5 5 5" /></svg>
      </button>
      <div class="album-hero">
        <h1 id="album-space-title">我们俩</h1>
      </div>
      <span class="album-header-spacer" aria-hidden="true"></span>
    </header>

    <main class="album-content">
      <div v-if="albumLoading" class="album-empty" aria-live="polite">
        <div class="album-empty-mark" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <h2>正在整理照片</h2>
      </div>

      <div v-else-if="photos.length" class="album-gallery">
        <div class="album-grid">
          <div
            v-for="(group, groupIndex) in visiblePhotoGroups"
            :key="`album-group-${groupIndex}`"
            class="album-cluster"
            :class="{
              'album-cluster--reverse': groupIndex % 2 === 1,
              'album-cluster--short': group.length <= photosPerGroup / 2
            }"
          >
            <button
              v-for="(photo, photoIndex) in group"
              :key="photo.id"
              class="album-photo"
              type="button"
              :aria-label="`查看照片 ${groupIndex * photosPerGroup + photoIndex + 1}`"
              @click="selectedPhoto = photo"
            >
              <img :src="photo.thumbnail || photo.src" :alt="photo.name || `相册照片 ${groupIndex * photosPerGroup + photoIndex + 1}`" loading="lazy" decoding="async" />
              <span>
                <b>{{ String(groupIndex * photosPerGroup + photoIndex + 1).padStart(2, '0') }}</b>
                <small>{{ formatPhotoDate(photo.takenAt) }}</small>
              </span>
            </button>
          </div>
        </div>
        <div v-if="hasMorePhotos" ref="loadMoreSentinel" class="album-load-sentinel" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div v-else class="album-empty">
        <div class="album-empty-mark" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <small>PHOTO NOTES</small>
        <h2>{{ albumLoadError ? '相册读取失败' : '相册还是空的' }}</h2>
        <p>{{ albumLoadError || '请将图片放入 src/assets/album 文件夹。' }}</p>
      </div>
    </main>

    <transition name="photo-preview">
      <div v-if="selectedPhoto" class="photo-preview" role="dialog" aria-modal="true" aria-label="照片预览" @click.self="selectedPhoto = null">
        <button class="photo-preview-close" type="button" aria-label="关闭预览" @click="selectedPhoto = null">
          <svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" /></svg>
        </button>
        <figure>
          <img :src="selectedPhoto.src" :alt="selectedPhoto.name || '相册照片'" />
          <figcaption>
            <span>
              <strong>{{ selectedPhoto.name || '一张照片' }}</strong>
              <small>{{ formatPhotoDate(selectedPhoto.takenAt, true) }}</small>
            </span>
          </figcaption>
        </figure>
      </div>
    </transition>
  </section>
</template>

<script>
const albumBaseUrl = `${import.meta.env.BASE_URL}album-generated/`

function validPhotoTime (value) {
  const timestamp = typeof value === 'number' ? value : Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

function photoSortTimestamp (photo) {
  const candidates = [
    photo.capturedAt,
    photo.dateSource === 'metadata' ? photo.takenAt : null,
    photo.modifiedAt,
    photo.createdAt,
    photo.takenAt
  ]

  for (const value of candidates) {
    const timestamp = validPhotoTime(value)
    if (timestamp !== null) return timestamp
  }
  return 0
}

function compareAlbumPhotos (left, right) {
  return photoSortTimestamp(left) - photoSortTimestamp(right) ||
    (validPhotoTime(left.modifiedAt) || 0) - (validPhotoTime(right.modifiedAt) || 0) ||
    (validPhotoTime(left.createdAt) || 0) - (validPhotoTime(right.createdAt) || 0) ||
    left.name.localeCompare(right.name, 'zh-CN', { numeric: true })
}

export default {
  emits: ['close'],
  data () {
    return {
      photos: [],
      selectedPhoto: null,
      albumLoading: true,
      albumLoadError: '',
      photosPerGroup: 6,
      renderedPhotoCount: 18,
      photoBatchSize: 18,
      loadMoreObserver: null
    }
  },
  computed: {
    visiblePhotos () {
      return this.photos.slice(0, this.renderedPhotoCount)
    },
    visiblePhotoGroups () {
      return this.visiblePhotos.reduce((groups, photo, index) => {
        const groupIndex = Math.floor(index / this.photosPerGroup)
        if (!groups[groupIndex]) groups[groupIndex] = []
        groups[groupIndex].push(photo)
        return groups
      }, [])
    },
    hasMorePhotos () {
      return this.renderedPhotoCount < this.photos.length
    }
  },
  created () {
    this.loadAlbum()
  },
  beforeUnmount () {
    this.disconnectLoadMoreObserver()
  },
  methods: {
    async loadAlbum () {
      try {
        const response = await fetch(`${albumBaseUrl}manifest.json`, { cache: 'no-cache' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const manifest = await response.json()
        this.photos = (Array.isArray(manifest) ? manifest : [])
          .map(photo => ({ ...photo, src: `${albumBaseUrl}${photo.src}` }))
          .map(photo => ({ ...photo, thumbnail: photo.thumbnail ? `${albumBaseUrl}${photo.thumbnail}` : photo.src }))
          .sort(compareAlbumPhotos)
        this.renderedPhotoCount = Math.min(this.photoBatchSize, this.photos.length)
      } catch (error) {
        this.albumLoadError = '相册读取失败，请重新启动或构建项目'
        console.error('Album manifest load failed:', error)
      } finally {
        this.albumLoading = false
        if (this.photos.length) this.$nextTick(this.setupLoadMoreObserver)
      }
    },
    setupLoadMoreObserver () {
      this.disconnectLoadMoreObserver()
      if (!this.hasMorePhotos) return
      if (typeof IntersectionObserver === 'undefined') {
        this.renderedPhotoCount = this.photos.length
        return
      }
      this.loadMoreObserver = new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) this.loadMorePhotos()
      }, {
        root: this.$el.querySelector('.album-content'),
        rootMargin: '360px 0px'
      })
      if (this.$refs.loadMoreSentinel) this.loadMoreObserver.observe(this.$refs.loadMoreSentinel)
    },
    disconnectLoadMoreObserver () {
      if (!this.loadMoreObserver) return
      this.loadMoreObserver.disconnect()
      this.loadMoreObserver = null
    },
    loadMorePhotos () {
      this.renderedPhotoCount = Math.min(this.renderedPhotoCount + this.photoBatchSize, this.photos.length)
      if (!this.hasMorePhotos) this.disconnectLoadMoreObserver()
    },
    formatPhotoDate (value, withTime = false) {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '时间未知'
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {})
      }).format(date)
    }
  }
}
</script>

<style scoped>
.album-space {
  position: absolute;
  z-index: 40;
  isolation: isolate;
  inset: 0;
  overflow: hidden;
  color: #25314b;
  background: radial-gradient(circle at 12% 6%, rgba(255,220,235,.72), transparent 28%),
    radial-gradient(circle at 88% 22%, rgba(194,216,251,.72), transparent 34%),
    linear-gradient(160deg,#fbf9ff,#eef1fb 56%,#f8eef6);
  view-transition-name: album-content;
  animation: album-fallback-in .28s cubic-bezier(.2,.8,.2,1) both;
}

.album-aurora {
  position: absolute;
  z-index: 0;
  inset: 82px -70px auto;
  height: 260px;
  pointer-events: none;
  border: 1px solid rgba(255,255,255,.58);
  border-color: rgba(255,255,255,.7) transparent transparent;
  border-radius: 50%;
  transform: rotate(13deg);
}

.album-header {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 44px minmax(0,1fr) 44px;
  align-items: center;
  gap: 10px;
  min-height: 104px;
  padding: 12px 16px 10px;
  box-sizing: border-box;
}

.album-round-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  color: #7666c4;
  border: 1px solid rgba(255,255,255,.66);
  border-radius: 50%;
  background: linear-gradient(135deg,rgba(255,255,255,.3),transparent 55%),rgba(255,255,255,.3);
  box-shadow: 0 6px 22px rgba(73,62,126,.08), inset 0 1px 0 rgba(255,255,255,.8);
  backdrop-filter: blur(18px) saturate(1.15);
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
  cursor: pointer;
}
.album-round-button svg { width: 20px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.album-header-spacer { width: 44px; height: 44px; }

.album-hero {
  justify-self: center;
  display: grid;
  justify-items: center;
  min-width: 0;
  width: min(100%, 220px);
  padding: 9px 16px;
  box-sizing: border-box;
  border: 1px solid rgba(255,255,255,.66);
  border-radius: 29px;
  background: linear-gradient(135deg,rgba(255,255,255,.24),transparent 52%,rgba(141,121,232,.04)),rgba(255,255,255,.34);
  box-shadow: 0 7px 26px rgba(73,62,126,.07), inset 0 1px 0 rgba(255,255,255,.76);
  backdrop-filter: blur(18px) saturate(1.15);
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
  view-transition-name: album-bar;
}
.album-hero h1 { margin: 0; font-size: 17px; font-weight: 650; letter-spacing: .04em; }

.album-content {
  position: absolute;
  z-index: 3;
  inset: 104px 0 0;
  overflow: auto;
  padding: 12px 14px 28px;
  box-sizing: border-box;
  scrollbar-width: none;
}
.album-content::-webkit-scrollbar { display: none; }
.album-gallery { position: relative; z-index: 2; min-height: 100%; isolation: isolate; }
.album-grid { display: grid; gap: 10px; }
.album-cluster {
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
  grid-template-rows: repeat(4,min(25vw,106px));
  gap: 8px;
}
.album-cluster--short { grid-template-rows: repeat(2,min(25vw,106px)); }

.album-cluster:not(.album-cluster--reverse) .album-photo:nth-child(1) { grid-column: 1 / span 2; grid-row: 1 / span 2; }
.album-cluster:not(.album-cluster--reverse) .album-photo:nth-child(2) { grid-column: 3; grid-row: 1; }
.album-cluster:not(.album-cluster--reverse) .album-photo:nth-child(3) { grid-column: 3; grid-row: 2; }
.album-cluster:not(.album-cluster--reverse) .album-photo:nth-child(4) { grid-column: 1 / span 2; grid-row: 3 / span 2; }
.album-cluster:not(.album-cluster--reverse) .album-photo:nth-child(5) { grid-column: 3; grid-row: 3; }
.album-cluster:not(.album-cluster--reverse) .album-photo:nth-child(6) { grid-column: 3; grid-row: 4; }

.album-cluster--reverse .album-photo:nth-child(1) { grid-column: 1; grid-row: 1; }
.album-cluster--reverse .album-photo:nth-child(2) { grid-column: 2 / span 2; grid-row: 1 / span 2; }
.album-cluster--reverse .album-photo:nth-child(3) { grid-column: 1; grid-row: 2; }
.album-cluster--reverse .album-photo:nth-child(4) { grid-column: 1; grid-row: 3; }
.album-cluster--reverse .album-photo:nth-child(5) { grid-column: 2 / span 2; grid-row: 3 / span 2; }
.album-cluster--reverse .album-photo:nth-child(6) { grid-column: 1; grid-row: 4; }

.album-photo {
  position: relative;
  z-index: 2;
  isolation: isolate;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  color: white;
  border: 1px solid rgba(255,255,255,.72);
  border-radius: 18px;
  background: #eef0f6;
  box-shadow: 0 9px 24px rgba(62,54,102,.1), inset 0 1px 0 rgba(255,255,255,.72);
  cursor: zoom-in;
  contain: layout paint;
}
.album-photo img { position: absolute; z-index: 1; inset: 0; width: 100%; height: 100%; display: block; object-fit: cover; opacity: 1; filter: none; mix-blend-mode: normal; transition: transform .35s cubic-bezier(.2,.8,.2,1); }
.album-photo:hover img { transform: scale(1.035); }
.album-photo > span { position: absolute; z-index: 2; inset: auto 0 0; display: flex; align-items: end; justify-content: space-between; gap: 8px; padding: 22px 9px 8px; background: linear-gradient(transparent,rgba(29,25,47,.54)); }
.album-photo b { font-size: 9px; letter-spacing: .12em; }
.album-photo small { font-size: 8px; }
.album-load-sentinel { display: flex; justify-content: center; gap: 5px; min-height: 54px; padding-top: 20px; box-sizing: border-box; }
.album-load-sentinel span { width: 4px; height: 4px; border-radius: 50%; background: rgba(118,102,196,.45); animation: album-load-pulse 1.1s ease-in-out infinite alternate; }
.album-load-sentinel span:nth-child(2) { animation-delay: .16s; }
.album-load-sentinel span:nth-child(3) { animation-delay: .32s; }

.album-empty {
  display: grid;
  justify-items: center;
  margin-top: 11vh;
  padding: 30px 24px;
  text-align: center;
  border: 1px solid rgba(255,255,255,.68);
  border-radius: 28px;
  background: linear-gradient(135deg,rgba(255,255,255,.25),transparent 55%),rgba(255,255,255,.34);
  box-shadow: 0 16px 48px rgba(73,62,126,.08), inset 0 1px 0 rgba(255,255,255,.78);
  backdrop-filter: blur(18px) saturate(1.15);
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
}
.album-empty-mark { position: relative; width: 104px; height: 74px; margin-bottom: 17px; }
.album-empty-mark span { position: absolute; width: 54px; height: 66px; border: 1px solid rgba(255,255,255,.82); border-radius: 16px; background: linear-gradient(145deg,rgba(217,208,250,.8),rgba(255,231,241,.86)); box-shadow: 0 7px 18px rgba(83,70,144,.1); }
.album-empty-mark span:nth-child(1) { left: 3px; transform: rotate(-12deg); }
.album-empty-mark span:nth-child(2) { left: 25px; z-index: 2; transform: translateY(-4px); }
.album-empty-mark span:nth-child(3) { right: 3px; transform: rotate(12deg); }
.album-empty > small { color: #8d79e8; font-size: 8px; font-weight: 700; letter-spacing: .18em; }
.album-empty h2 { margin: 5px 0; font-size: 21px; }
.album-empty p { max-width: 260px; margin: 0; color: #69738b; font-size: 11px; line-height: 1.7; }

.photo-preview {
  position: absolute;
  z-index: 80;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 54px 18px 24px;
  box-sizing: border-box;
  background: rgba(29,26,47,.58);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.photo-preview-close { position: absolute; top: 16px; right: 16px; display: grid; place-items: center; width: 42px; height: 42px; padding: 0; color: white; border: 1px solid rgba(255,255,255,.3); border-radius: 50%; background: rgba(255,255,255,.14); cursor: pointer; }
.photo-preview-close svg { width: 18px; fill: none; stroke: currentColor; stroke-width: 1.7; }
.photo-preview figure { width: 100%; max-height: 100%; margin: 0; overflow: hidden; border: 1px solid rgba(255,255,255,.34); border-radius: 24px; background: rgba(252,251,255,.9); box-shadow: 0 24px 70px rgba(23,20,39,.3); }
.photo-preview figure > img { display: block; width: 100%; max-height: calc(100vh - 180px); object-fit: contain; background: #191722; }
.photo-preview figcaption { padding: 13px 15px; }
.photo-preview figcaption span { display: grid; min-width: 0; gap: 2px; }
.photo-preview figcaption strong { overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.photo-preview figcaption small { color: #7f879c; font-size: 9px; }
.photo-preview-enter-active,.photo-preview-leave-active { transition: opacity .2s ease; }
.photo-preview-enter-active figure,.photo-preview-leave-active figure { transition: transform .28s cubic-bezier(.2,.8,.2,1); }
.photo-preview-enter-from,.photo-preview-leave-to { opacity: 0; }
.photo-preview-enter-from figure,.photo-preview-leave-to figure { transform: scale(.96) translateY(8px); }

@keyframes album-fallback-in { from { opacity: .6; transform: translateX(18px); } }
@keyframes album-load-pulse { to { opacity: .25; transform: translateY(-3px); } }
@media (max-width: 360px) { .album-header { padding-inline: 10px; gap: 7px; }.album-grid { gap: 8px; }.album-cluster { gap: 7px; }.album-hero { padding-inline: 11px; }.album-content { padding-inline: 10px; } }
@media (prefers-reduced-motion: reduce) { .album-space,.album-photo img,.album-load-sentinel span,.photo-preview-enter-active,.photo-preview-leave-active,.photo-preview-enter-active figure,.photo-preview-leave-active figure { animation: none; transition: none; } }
</style>
