<template>
  <div class="avatar-settings-layer" role="presentation" @click.self="$emit('close')">
    <section class="avatar-settings-sheet" role="dialog" aria-modal="true" aria-labelledby="avatar-settings-title">
      <header>
        <div>
          <small>PROFILE PAIR</small>
          <h2 id="avatar-settings-title">设置双方头像</h2>
          <p>照片只保存在当前浏览器里。</p>
        </div>
        <button ref="closeButton" class="avatar-close" type="button" aria-label="关闭头像设置" @click="$emit('close')">
          <svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" /></svg>
        </button>
      </header>

      <div class="avatar-settings-grid">
        <article v-for="person in people" :key="person.role" class="avatar-setting-card">
          <div class="avatar-setting-preview" :class="`is-${person.role}`">
            <img v-if="avatars[person.role]" :src="avatars[person.role]" alt="" />
            <span v-else>{{ person.fallback }}</span>
          </div>
          <div class="avatar-setting-copy">
            <strong>{{ person.label }}</strong>
            <small>{{ isCustomAvatar(person.role) ? '已使用自定义照片' : '当前为默认头像' }}</small>
          </div>
          <label class="avatar-pick-button">
            {{ isCustomAvatar(person.role) ? '更换' : '选择照片' }}
            <input
              :data-avatar-input="person.role"
              type="file"
              accept="image/*"
              @change="handleFile(person.role, $event)"
            />
          </label>
          <button
            v-if="isCustomAvatar(person.role)"
            class="avatar-reset-button"
            type="button"
            @click="removeAvatar(person.role)"
          >恢复默认</button>
        </article>
      </div>

      <p v-if="error" class="avatar-settings-error" role="alert">{{ error }}</p>
      <p class="avatar-settings-tip">图片会自动居中裁成正方形，并压缩到适合头像的尺寸。</p>
    </section>
  </div>
</template>

<script>
import { AVATAR_STORAGE_KEY, DEFAULT_AVATARS, imageFileToDataUrl, writeLocalJson } from './image-utils'

export default {
  props: {
    avatars: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'change'],
  data () {
    return {
      error: '',
      people: [
        { role: 'author', label: '对方头像', fallback: 'W' },
        { role: 'me', label: '我的头像', fallback: 'ME' }
      ]
    }
  },
  mounted () {
    this.$nextTick(() => this.$refs.closeButton && this.$refs.closeButton.focus())
  },
  methods: {
    isCustomAvatar (role) {
      return Boolean(this.avatars[role] && this.avatars[role] !== DEFAULT_AVATARS[role])
    },
    async handleFile (role, event) {
      const input = event.target
      const file = input.files && input.files[0]
      input.value = ''
      if (!file) return
      this.error = ''
      try {
        const source = await imageFileToDataUrl(file, { square: true, maxSize: 256, quality: 0.86 })
        this.commit({ ...this.avatars, [role]: source })
      } catch (error) {
        this.error = error instanceof Error ? error.message : '头像保存失败，请重试'
      }
    },
    removeAvatar (role) {
      this.error = ''
      this.commit({ ...this.avatars, [role]: DEFAULT_AVATARS[role] })
    },
    commit (avatars) {
      try {
        writeLocalJson(AVATAR_STORAGE_KEY, avatars)
        this.$emit('change', avatars)
      } catch (ignore) {
        this.error = '浏览器存储空间不足，头像没有保存'
      }
    }
  }
}
</script>

<style scoped>
.avatar-settings-layer {
  position: absolute;
  z-index: 120;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 12px;
  box-sizing: border-box;
  background: rgba(41, 38, 67, .18);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: avatar-layer-in .18s ease-out both;
}

.avatar-settings-sheet {
  width: 100%;
  padding: 18px;
  box-sizing: border-box;
  color: #25314b;
  border: 1px solid rgba(255,255,255,.72);
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(255,255,255,.28), transparent 50%), rgba(248,249,255,.78);
  box-shadow: 0 22px 54px rgba(55,47,93,.2), inset 0 1px 0 rgba(255,255,255,.88);
  backdrop-filter: blur(24px) saturate(1.16);
  -webkit-backdrop-filter: blur(24px) saturate(1.16);
  animation: avatar-sheet-in .32s cubic-bezier(.22,.7,.2,1) both;
}

header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
header small { color: #8d79e8; font-size: 9px; font-weight: 700; letter-spacing: .18em; }
h2 { margin: 5px 0 3px; font-size: 20px; font-weight: 650; letter-spacing: .02em; }
header p { margin: 0; color: #69738b; font-size: 11px; }

.avatar-close {
  display: grid;
  place-items: center;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  padding: 0;
  color: #69738b;
  border: 1px solid rgba(255,255,255,.7);
  border-radius: 50%;
  background: rgba(255,255,255,.44);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.86);
  cursor: pointer;
}
.avatar-close svg { width: 18px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; }

.avatar-settings-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; margin-top: 18px; }
.avatar-setting-card {
  display: grid;
  justify-items: center;
  gap: 10px;
  min-width: 0;
  padding: 15px 10px 12px;
  border: 1px solid rgba(255,255,255,.68);
  border-radius: 22px;
  background: rgba(255,255,255,.34);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
}
.avatar-setting-preview {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  padding: 4px;
  box-sizing: border-box;
  border: 1px solid rgba(255,255,255,.82);
  border-radius: 50%;
  color: #7462c5;
  background: linear-gradient(145deg, #ded7fc, #ffeff7);
  box-shadow: 0 10px 24px rgba(91,75,162,.13);
  font-size: 14px;
  font-weight: 700;
}
.avatar-setting-preview.is-me { color: #ad5e82; background: linear-gradient(145deg, #ffe2ef, #e1eafe); }
.avatar-setting-preview img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.avatar-setting-copy { display: grid; gap: 2px; text-align: center; }
.avatar-setting-copy strong { font-size: 13px; }
.avatar-setting-copy small { color: #7f879c; font-size: 9px; }

.avatar-pick-button,
.avatar-reset-button {
  min-height: 34px;
  padding: 8px 12px;
  box-sizing: border-box;
  border-radius: 17px;
  font-size: 11px;
  cursor: pointer;
}
.avatar-pick-button { color: #fff; background: linear-gradient(145deg,#9a84ef,#789ee8); box-shadow: 0 5px 14px rgba(112,92,199,.2); }
.avatar-pick-button input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.avatar-reset-button { margin-top: -4px; padding-block: 4px; color: #7f879c; border: 0; background: transparent; }
.avatar-settings-error { margin: 12px 0 0; color: #a64e69; font-size: 11px; text-align: center; }
.avatar-settings-tip { margin: 14px 4px 0; color: #7f879c; font-size: 10px; line-height: 1.6; text-align: center; }

@keyframes avatar-layer-in { from { opacity: 0; } }
@keyframes avatar-sheet-in { from { opacity: 0; transform: translateY(22px) scale(.985); } }
@media (prefers-reduced-motion: reduce) { .avatar-settings-layer,.avatar-settings-sheet { animation: none; } }
@media (max-width: 350px) { .avatar-settings-sheet { padding: 15px; }.avatar-setting-preview { width: 62px; height: 62px; } }
</style>
