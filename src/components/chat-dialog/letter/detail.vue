<template>
  <!-- 封面阶段：cover / opening -->
  <div
    class="letter-cover-wapper"
    v-if="status !== 'opened'"
  >
    <LetterCover
      :flap="status === 'opening'"
      :openTip="openTip"
    />
  </div>

  <!-- 内容阶段：opened -->
  <div
    class="letter-cover-wapper letter-cover-wapper--content"
    v-if="status === 'opened'"
  >
    <LetterContent
      @close="$emit('close')"
      :title="title"
      :paragraphs="paragraphs"
      :speed="speed"
    />
  </div>
</template>

<script>
import LetterCover from './cover.vue'
import LetterContent from './content.vue'

export default {
  props: {
    type: String,
    src: String
  },
  components: {
    LetterContent,
    LetterCover
  },
  data () {
    return {
      openTip: '',
      title: '',
      paragraphs: [],
      speed: 120,
      // cover -> opening -> opened
      status: 'cover'
    }
  },
  mounted () {
    // 小延时：先展示封面，再开始开信动画，最后切到内容
    setTimeout(() => {
      this.status = 'opening'
      setTimeout(() => {
        this.status = 'opened'
      }, 2500)
    }, 1000)
  },
  created () {
    $.getJSON(this.src, ({ openTip, title, paragraphs, speed }) => {
      this.openTip = openTip
      this.paragraphs = paragraphs
      this.title = title
      this.speed = speed
    })
  }
}
</script>

<style>
/* 全局遮罩层：跟 LetterContent 的背景统一成生日主题渐变 */
.letter-cover-wapper {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top, #ffe4f0 0, #ffffff 38%, #f3f6ff 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* 内容层 z-index 稍微高一点，防止被封面压住 */
.letter-cover-wapper--content {
  z-index: 2200;
}
</style>
