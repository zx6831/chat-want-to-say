<template>
  <div class="letter-wrapper animate__animated animate__fadeInUp">
    <div class="letter-content">
      <!-- 顶部生日主题头部 -->
      <div class="letter-header">
        <div class="letter-badge">
          🎂 Happy Birthday
        </div>
        <div class="letter-title" ref="letter-title"></div>
        <div class="letter-subtitle">
          愿这一天被温柔、惊喜和小小心愿填满
        </div>
      </div>

      <!-- 信纸主体（内部可滚动） -->
      <div class="letter-detail">
        <div
          v-for="({ type, content, loading, ref }, i) in contents"
          :key="i"
          :ref="`letter-detail-item-${i}`"
          class="letter-detail-item"
        >
          <var-loading
            v-if="loading"
            color="#ff6f61"
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
        <div
          class="finish-action"
          v-show="finish"
          @click="$emit('close')"
        >
          <var-icon name="chevron-left" />
          <text>回到聊天页</text>
        </div>
      </div>

      <!-- 右上角关闭按钮 -->
      <div class="letter-action">
        <var-icon
          name="window-close"
          class="letter-close-icon"
          @click="$emit('close')"
        />
      </div>

      <!-- 回到顶部（还是全页的回到顶部，保留） -->
      <var-back-top
        style="z-index: 2000;"
        :duration="300"
      />
    </div>
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
/* 整体背景：淡渐变，居中一张生日信纸卡片 */
.letter-wrapper {
  width: 100%;
  min-height: 100vh;
  padding: 24px 16px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: radial-gradient(circle at top, #ffe4f0 0, #fff 38%, #f3f6ff 100%);
}

/* 信纸主体卡片 */
.letter-content {
  position: relative;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  color: #322b3a;
  background: #ffffff;
  border-radius: 24px;
  padding: 24px 24px 32px;
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.8);
  box-sizing: border-box;
  overflow: hidden;
}

/* 头部区域：生日主题 */
.letter-header {
  position: relative;
  padding: 16px 8px 20px;
  margin-bottom: 8px;
  text-align: center;
}

/* 小标签：Happy Birthday */
.letter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #ffafbd, #ffc3a0);
  color: #fff;
  box-shadow: 0 6px 16px rgba(255, 154, 158, 0.45);
  margin-bottom: 10px;
}

/* 标题（打字机写入的位置） */
.letter-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 6px 0;
  text-align: center;
  color: #2f234f;
}

/* 副标题：解释气氛一些 */
.letter-subtitle {
  margin-top: 4px;
  font-size: 0.9rem;
  color: #8c7aa8;
}

/* 信纸正文：现代感横线背景 + 内部可滚动 */
.letter-detail {
  position: relative;
  z-index: 1;
  padding: 18px 8px 16px;
  max-height: 70vh; /* 核心：限制高度，内部滚动 */
  overflow-y: auto;
  background:
    linear-gradient(to right, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.95)),
    repeating-linear-gradient(
      to bottom,
      #ffffff 0,
      #ffffff 30px,
      #ffd6dd 31px,
      #ffffff 32px
    );
  background-size: 100% auto;
  border-radius: 18px;
}

/* 滚动条（可选美化，不喜欢可以删） */
.letter-detail::-webkit-scrollbar {
  width: 6px;
}
.letter-detail::-webkit-scrollbar-track {
  background: transparent;
}
.letter-detail::-webkit-scrollbar-thumb {
  background: rgba(252, 165, 180, 0.6);
  border-radius: 999px;
}

/* 每个段落外容器 */
.letter-detail-item {
  margin-bottom: 12px;
}

/* 正文文字：稍微松一点，适合信件 */
.letter-detail p {
  position: relative;
  line-height: 1.9rem !important;
  text-indent: 2em;
  font-size: 0.98rem !important;
  margin: 0;
  padding: 4px 4px;
  letter-spacing: 0.04rem;
  color: #3c324a;
}

/* 图片容器：居中 + 卡片感 */
.letter-image-wrapper {
  text-align: center;
  margin: 18px 0;
}
.letter-image-wrapper img {
  max-width: 100%;
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.25);
}

/* 右上角关闭按钮 */
.letter-action {
  position: absolute;
  top: 14px;
  right: 18px;
  z-index: 3;
  color: #c2b0ff;
}

.letter-close-icon {
  font-size: 22px;
  cursor: pointer;
  transition: transform 0.18s ease, color 0.18s ease;
}
.letter-close-icon:hover {
  transform: scale(1.1);
  color: #ff6f91;
}

/* 结束按钮：右下角「回到聊天页」 */
.finish-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  float: right;
  margin-top: 24px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.9rem;
  color: #ff6f91;
  background: rgba(255, 111, 145, 0.08);
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}
.finish-action:hover {
  background: rgba(255, 111, 145, 0.16);
  transform: translateY(-1px);
}

.finish-action text {
  font-size: 0.9rem;
}

/* 小屏适配 */
@media only screen and (max-width: 600px) {
  .letter-wrapper {
    padding: 16px 12px;
  }
  .letter-content {
    padding: 18px 16px 24px;
    border-radius: 20px;
  }
  .letter-detail {
    border-radius: 14px;
    padding-top: 14px;
    max-height: 65vh;
  }
  .letter-title {
    font-size: 1.3rem;
  }
}
</style>
