<template>
  <div class="letter-wrapper animate__animated animate__fadeInUp">
    <article class="letter-content">
      <button class="letter-close" type="button" aria-label="关闭信件" @click="$emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>

      <div class="letter-header">
        <img class="letter-lamb" src="/letter/lamb-watercolor.png" alt="" aria-hidden="true" />
        <div class="letter-title" ref="letter-title"></div>
      </div>

      <div class="letter-detail">
        <div
          v-for="({ type, content, loading, ref }, i) in contents"
          :key="i"
          :ref="`letter-detail-item-${i}`"
          class="letter-detail-item"
        >
          <var-loading
            v-if="loading"
            color="#7f8f5b"
            type="cube"
          />
          <div v-show="!loading">
            <p
              v-if="type === 'text'"
              :ref="ref"
            ></p>
            <div v-else class="letter-image-wrapper">
              <span
                :ref="ref"
                v-html="content"
              ></span>
            </div>
          </div>
        </div>

        <!-- 结束按钮 -->
        <button
          class="finish-action"
          v-show="finish"
          type="button"
          @click="$emit('close')"
        >
          <var-icon name="chevron-left" />
          <span>回到聊天页</span>
        </button>
      </div>

      <footer class="letter-signature" aria-hidden="true">
        <span>Dancing sunbeams</span>
        <i>✿</i>
      </footer>
    </article>
  </div>
</template>

<script>
import Typed from 'typed.js'

export default {
  props: {
    title: String,
    paragraphs: Array,
    speed: {
      type: Number,
      default: 40
    }
  },
  data () {
    return {
      contents: [],
      finish: false
    }
  },
  methods: {
    append (ele, content) {
      return new Promise((resolve) => {
        const typed = new Typed(ele, {
          strings: ['', content],
          typeSpeed: this.speed,
          backSpeed: this.speed,
          showCursor: false,
          onComplete: () => {
            typed.stop()
            setTimeout(() => resolve(), 500)
          }
        })
      })
    },
    initContent () {
      let paragraphChain = Promise.resolve()
      // 标题打字
      paragraphChain = paragraphChain.then(() =>
        this.append(this.$refs['letter-title'], this.title)
      )

      // 段落打字 / 图片
      this.paragraphs.forEach((paragraph, i) => {
        paragraphChain = paragraphChain.then(() => {
          return new Promise((resolve) => {
            const isImg = /<img[^>]+>/.test(paragraph)
            if (isImg) {
              const imgContent = {
                type: 'img',
                loading: true,
                content: paragraph,
                ref: `paragraph-img-${i}`
              }
              this.contents.push(imgContent)

              // 简单延时模拟图片加载完成（不再自动滚动）
              setTimeout(() => {
                imgContent.loading = false
                this.$nextTick(() => {
                  imgContent.dom = this.$refs[imgContent.ref][0]
                  resolve()
                })
              }, 1200)
            } else {
              const textContent = {
                type: 'text',
                content: paragraph,
                ref: `paragraph-text-${i}`
              }
              this.contents.push(textContent)
              this.$nextTick(() => {
                textContent.dom = this.$refs[textContent.ref][0]
                this.append(textContent.dom, paragraph)
                  .then(() => {
                    resolve()
                  })
              })
            }
          })
        })
      })

      paragraphChain.then(() => { this.finish = true })
    }
  },
  mounted () {
    this.initContent()
  }
}
</script>

<style>
.letter-wrapper {
  --paper: #f6f2e6;
  --paper-shadow: #e8dfc9;
  --meadow: #a9b684;
  --leaf: #7f8f5b;
  --dusty-rose: #c8b7ad;
  --ink: #5b5c4e;
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 16%, rgba(246, 242, 230, .95) 0 13%, transparent 42%),
    radial-gradient(circle at 16% 74%, rgba(169, 182, 132, .5), transparent 32%),
    radial-gradient(circle at 88% 82%, rgba(200, 183, 173, .42), transparent 34%),
    linear-gradient(145deg, #c9c7ad 0%, #a9b08c 46%, #817d68 100%);
}

.letter-wrapper::before {
  position: fixed;
  inset: 0;
  content: '';
  pointer-events: none;
  opacity: .2;
  background-image:
    repeating-linear-gradient(112deg, transparent 0 3px, rgba(255, 255, 255, .12) 4px, transparent 5px),
    repeating-linear-gradient(21deg, transparent 0 7px, rgba(91, 92, 78, .08) 8px, transparent 9px);
  mix-blend-mode: soft-light;
}

.letter-content {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  width: min(92vw, 460px, calc(70.48dvh - 22.55px));
  aspect-ratio: 148 / 210;
  max-height: calc(100dvh - 32px);
  margin: 0;
  padding: clamp(22px, 5vw, 34px) clamp(24px, 7vw, 46px) 18px;
  box-sizing: border-box;
  overflow: hidden;
  color: var(--ink);
  border: 1px solid rgba(255, 255, 255, .55);
  border-radius: 2px;
  background:
    radial-gradient(circle at 18% 12%, rgba(255, 255, 255, .8), transparent 28%),
    radial-gradient(circle at 82% 78%, rgba(232, 223, 201, .34), transparent 36%),
    repeating-linear-gradient(96deg, transparent 0 5px, rgba(117, 107, 84, .015) 6px, transparent 7px),
    var(--paper);
  box-shadow:
    0 30px 64px rgba(62, 57, 43, .28),
    0 8px 18px rgba(62, 57, 43, .16),
    inset 0 0 34px rgba(159, 144, 111, .08);
}

.letter-content::after {
  position: absolute;
  z-index: -1;
  inset: 8px;
  content: '';
  pointer-events: none;
  border: 1px solid rgba(123, 116, 93, .055);
}

.letter-header {
  flex: none;
  display: grid;
  justify-items: center;
  padding: 0 0 10px;
  text-align: center;
}

.letter-lamb {
  display: block;
  width: min(76%, 280px);
  max-height: clamp(92px, 17vh, 140px);
  object-fit: contain;
  filter: saturate(.86) contrast(.96);
  user-select: none;
}

.letter-title {
  min-height: 1.7em;
  margin-top: 4px;
  color: #656452;
  font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Noto Serif SC', serif;
  font-size: clamp(1.02rem, 4vw, 1.2rem);
  font-weight: 500;
  line-height: 1.65;
  letter-spacing: .1em;
}

.letter-title::after {
  display: block;
  width: 34px;
  height: 1px;
  margin: 7px auto 0;
  content: '';
  background: linear-gradient(90deg, transparent, rgba(127, 143, 91, .7), transparent);
}

.letter-detail {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  padding: 8px 7px 24px 2px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(127, 143, 91, .34) transparent;
  overscroll-behavior: contain;
  mask-image: linear-gradient(to bottom, transparent, #000 12px, #000 calc(100% - 18px), transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 12px, #000 calc(100% - 18px), transparent);
}

.letter-detail::-webkit-scrollbar { width: 3px; }
.letter-detail::-webkit-scrollbar-track { background: transparent; }
.letter-detail::-webkit-scrollbar-thumb { border-radius: 999px; background: rgba(127, 143, 91, .34); }

.letter-detail-item { margin: 0 0 14px; }

.letter-detail p {
  position: relative;
  margin: 0;
  padding: 0;
  color: var(--ink);
  font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Noto Serif SC', serif;
  font-size: clamp(.91rem, 3.55vw, 1rem) !important;
  font-weight: 400;
  line-height: 2 !important;
  letter-spacing: .055em;
  text-align: justify;
  text-indent: 2em;
  text-wrap: pretty;
}

.letter-image-wrapper {
  margin: 20px 4px;
  text-align: center;
}

.letter-image-wrapper img {
  display: block;
  max-width: 100%;
  margin: 0 auto;
  border: 5px solid rgba(255, 255, 255, .58);
  border-radius: 2px;
  box-shadow: 0 8px 22px rgba(91, 92, 78, .16);
  filter: saturate(.88) sepia(.05);
}

.letter-close {
  position: absolute;
  z-index: 4;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: rgba(91, 92, 78, .66);
  border: 1px solid rgba(127, 143, 91, .2);
  border-radius: 50%;
  background: rgba(246, 242, 230, .62);
  cursor: pointer;
  transition: color .18s ease, border-color .18s ease, transform .18s ease;
}

.letter-close svg {
  width: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
}

.letter-close:hover,
.letter-close:focus-visible {
  color: #626b49;
  border-color: rgba(127, 143, 91, .58);
  outline: none;
  transform: rotate(5deg);
}

.finish-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  margin: 26px auto 6px;
  padding: 6px 2px;
  gap: 3px;
  color: var(--leaf);
  border: 0;
  border-bottom: 1px solid rgba(127, 143, 91, .36);
  background: transparent;
  font-family: 'STKaiti', 'KaiTi', serif;
  font-size: .88rem;
  cursor: pointer;
  transition: color .18s ease, border-color .18s ease;
}

.finish-action:hover,
.finish-action:focus-visible {
  color: #5e6d3f;
  border-color: #7f8f5b;
  outline: none;
}

.finish-action span { font-size: .88rem; }

.letter-signature {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 34px;
  padding-top: 7px;
  color: rgba(125, 91, 67, .78);
}

.letter-signature span {
  font-family: 'Segoe Script', 'Snell Roundhand', 'Brush Script MT', cursive;
  font-size: clamp(.9rem, 3.8vw, 1.08rem);
  font-style: italic;
  letter-spacing: -.035em;
}

.letter-signature i {
  color: rgba(127, 143, 91, .72);
  font-family: serif;
  font-size: 9px;
  font-style: normal;
}

@media only screen and (max-width: 600px) {
  .letter-wrapper { padding: 12px; }
  .letter-content {
    width: min(94vw, 410px, calc(70.48dvh - 16.91px));
    max-height: calc(100dvh - 24px);
    padding: 22px 25px 13px;
  }
  .letter-lamb { width: 79%; max-height: 116px; }
  .letter-header { padding-bottom: 5px; }
  .letter-detail { padding-top: 5px; }
  .letter-close { top: 9px; right: 9px; }
}

@media only screen and (max-width: 600px) and (orientation: portrait) {
  .letter-wrapper { padding: 10px; }
  .letter-content {
    width: min(calc(100vw - 20px), calc(45.995dvh - 9.2px));
    aspect-ratio: 402 / 874;
    max-height: calc(100dvh - 20px);
    padding: 26px 27px 15px;
  }
  .letter-lamb { width: 82%; max-height: 132px; }
  .letter-header { padding-bottom: 9px; }
  .letter-signature { min-height: 38px; }
}

@media only screen and (max-width: 350px) {
  .letter-content { padding-inline: 20px; }
  .letter-lamb { max-height: 96px; }
  .letter-title { margin-top: 0; }
  .letter-detail p { line-height: 1.85 !important; }
}

@media (prefers-reduced-motion: reduce) {
  .letter-wrapper,
  .letter-close,
  .finish-action { animation: none !important; transition: none !important; }
}
</style>
