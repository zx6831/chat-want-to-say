<template>
  <div id="mobile" ref="chatRoot">
    <div class="ambient-glow ambient-glow--violet" aria-hidden="true"></div>
    <div class="ambient-glow ambient-glow--rose" aria-hidden="true"></div>
    <div class="chat-view-shell" v-show="activeView === 'chat'" :aria-hidden="activeView !== 'chat'">
    <header id="mobile-head">
      <div class="header-orb" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 3.5c.35 4.95 3.55 8.15 8.5 8.5-4.95.35-8.15 3.55-8.5 8.5-.35-4.95-3.55-8.15-8.5-8.5 4.95-.35 8.15-3.55 8.5-8.5Z" />
        </svg>
      </div>
      <button id="mobile-head-title" type="button" aria-label="打开我们的相册" @click="openAlbum">
        <span class="title-name">{{ title }}</span>
      </button>
      <button class="header-orb header-orb--profile" type="button" aria-label="设置双方头像" :aria-expanded="avatarSettingsOpen" @click="avatarSettingsOpen = true">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="8.3" r="3.2" />
          <path d="M5.8 19c.7-3 2.8-4.7 6.2-4.7s5.5 1.7 6.2 4.7M18.6 4.8v3.4M16.9 6.5h3.4" />
        </svg>
      </button>
    </header>
    <div id="mobile-body">
      <div id="mobile-body-bg" aria-hidden="true">
        <span class="wish-thread wish-thread--one"></span>
        <span class="wish-thread wish-thread--two"></span>
        <span class="floating-speck floating-speck--one"></span>
        <span class="floating-speck floating-speck--two"></span>
        <span class="floating-speck floating-speck--three"></span>
      </div>
      <div id="mobile-body-content" ref="chatContent">
        <div id="mock-msg-row"
             class="msg-row">
          <div id="mock-msg"
               class="msg"
               v-html="latestMsgContent"></div>
        </div>
        <div class="msg-row"
             v-for="(msg, index) in messages"
             :key="index"
             :class="msg.author === 'author' ? 'msg-author' : 'msg-me'">
          <div class="msg-avatar" aria-hidden="true">
            <img v-if="avatars[msg.author]" :src="avatars[msg.author]" alt="" />
            <span v-else>{{ msg.author === 'author' ? 'W' : 'ME' }}</span>
          </div>
          <div class="msg-stack">
            <div class="msg"
                 :style="msg.width && msg.height && {width: msg.width - 26 + 'px', height: msg.height - 18 + 'px'}"
                 :class="{
                   'msg-bounce-in-left':  msg.author === 'author',
                   'msg-bounce-in-right':  msg.author === 'me',
                   'animate_breathe': index === (messages.length - 1) && status === 'componentClose'
                  }"
                 @click="$emit('msg-click', msg)">
              <span v-if="msg.type === 'text'"
                    v-html="msg.content"></span>
              <component v-else
                         :is="msg.type"
                         v-bind="msg.props"
                         @open="handleComponentOpen(msg)"
                         @close="handleComponentClose"></component>
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer id="mobile-foot">
      <form
        class="composer"
        :class="{ 'is-awaiting-input': status === 'userInput' && !inputMessage.trim() }"
        @submit.prevent="sendUserMsg"
      >
        <span class="composer-spark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3.5c.35 4.95 3.55 8.15 8.5 8.5-4.95.35-8.15 3.55-8.5 8.5-.35-4.95-3.55-8.15-8.5-8.5 4.95-.35 8.15-3.55 8.5-8.5Z" /></svg>
        </span>
        <label id="input-hint" class="composer-field">
          <span v-show="status === 'systemInput'"
                class="system-input-element"></span>
          <input ref="userMsgInputRef"
                 v-show="status === 'userInput'"
                 v-model="inputMessage"
                 class="user-message-input"
                 type="text"
                 autocomplete="off"
                 enterkeyhint="send"
                 aria-label="回复消息"
                 placeholder="写一句话…" />
          <span v-show="status !== 'systemInput' && status !== 'userInput'"
                class="composer-placeholder">等我把话说完…</span>
        </label>
        <button ref="sendMsgBtnRef"
                class="send-button"
                :class="{ 'is-ready': !sendBtnDisabled }"
                type="submit"
                :disabled="sendBtnDisabled"
                aria-label="发送消息">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M13 7l5 5-5 5" />
          </svg>
        </button>
      </form>
    </footer>
    </div>
    <AlbumSpace v-if="activeView === 'album'" @close="closeAlbum" />
    <AvatarSettings
      v-if="avatarSettingsOpen"
      :avatars="avatars"
      @change="avatars = $event"
      @close="avatarSettingsOpen = false"
    />
  </div>
  <MessageDetail v-if="currentOpenComponent"
                 :type="currentOpenComponent.type"
                 :options="currentOpenComponent.props"
                 @close="handleComponentClose">
  </MessageDetail>
</template>

<script>
import letter from './letter/cover.vue'
import vlog from './vlog/cover.vue'
import MessageDetail from './MessageDetail.vue'
import AlbumSpace from './AlbumSpace.vue'
import AvatarSettings from './AvatarSettings.vue'
import { AVATAR_STORAGE_KEY, DEFAULT_AVATARS, readLocalJson } from './image-utils'
import { resolveMobileViewport } from './viewport-utils.mjs'
import Typed from 'typed.js'
import './css/main.scss'
const AUTHOR = {
  AUTHOR: 'author',
  ME: 'me'
};
const TRIGGER_NEXT_ACTION_TYPE = {
  USER_INPUT: 'userInput',
  COMPONENT_CLOSE: 'componentClose'
};

export default {
  components: {
    letter,
    vlog,
    MessageDetail,
    AlbumSpace,
    AvatarSettings
  },
  props: {
    title: String,
    options: Array
  },
  computed: {
    sendBtnDisabled () {
      if (this.status === 'systemInput') {
        return true;
      }
      if (this.inputMessage && this.inputMessage.trim().length > 0) {
        return false;
      }
      return true;
    }
  },
  data () {
    const storedAvatars = readLocalJson(AVATAR_STORAGE_KEY, {})
    const savedAvatars = storedAvatars && typeof storedAvatars === 'object' ? storedAvatars : {}
    return {
      // 已经展示的消息
      messages: [],
      // 消息链条
      msgChain: Promise.resolve(),
      // 输入消息
      inputMessage: '',
      // 用户交互触发器
      nextActionTrigger: null,
      // 当前状态 等待用户交互
      status: 'systemInput',
      // 当前打开的组件
      currentOpenComponent: null,
      activeView: 'chat',
      avatarSettingsOpen: false,
      avatars: {
        author: savedAvatars.author || DEFAULT_AVATARS.author,
        me: savedAvatars.me || DEFAULT_AVATARS.me
      },
      viewTransitioning: false,
      isTyping: false,
      latestMsgContent: null
    }
  },
  watch: {
    options () {
      this.buildMsgChain(this.options);
    },
    status (newVal, oldVal) {
      if (newVal === TRIGGER_NEXT_ACTION_TYPE.USER_INPUT) {
        this.setUserInputFoucus();
      }
    }
  },
  mounted () {
    document.addEventListener('keydown', this.handleGlobalKeydown)
    this.setupViewportTracking()
  },
  beforeUnmount () {
    document.removeEventListener('keydown', this.handleGlobalKeydown)
    this.teardownViewportTracking()
  },
  methods: {
    openAlbum () {
      this.avatarSettingsOpen = false
      this.changeView('album', 'push')
    },

    closeAlbum () {
      this.changeView('chat', 'pop')
    },

    async changeView (view, direction) {
      if (this.viewTransitioning || this.activeView === view) return
      this.viewTransitioning = true
      const root = document.documentElement
      const update = () => {
        this.activeView = view
        return this.$nextTick()
      }

      try {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (document.startViewTransition && !reduceMotion) {
          root.dataset.albumTransition = direction
          const transition = document.startViewTransition(update)
          await transition.finished
        } else {
          await update()
        }
      } finally {
        delete root.dataset.albumTransition
        this.viewTransitioning = false
        if (view === 'chat') this.$nextTick(updateScroll)
      }
    },

    handleGlobalKeydown (event) {
      if (event.key !== 'Escape') return
      if (this.avatarSettingsOpen) {
        this.avatarSettingsOpen = false
      } else if (this.activeView === 'album') {
        this.closeAlbum()
      }
    },

    setupViewportTracking () {
      this.$nextTick(() => {
        const viewport = window.visualViewport
        this._visualViewport = viewport
        this._layoutViewportHeight = Math.max(
          window.innerHeight || 0,
          document.documentElement.clientHeight || 0,
          viewport ? viewport.height : 0
        )
        this._expandedViewportHeight = window.innerHeight || this._layoutViewportHeight
        this._viewportWidth = window.innerWidth
        this._keyboardSession = false
        this._lastStableViewportHeight = this._layoutViewportHeight
        this._handleViewportChange = () => {
          this.queueViewportSync()
          this.scheduleViewportStabilization()
        }
        this._handleRootScroll = () => {
          if (Math.abs(((this._visualViewport && this._visualViewport.scale) || 1) - 1) > .01) return
          let corrected = false
          if (window.scrollX || window.scrollY || document.documentElement.scrollTop || document.body.scrollTop) {
            window.scrollTo({ left: 0, top: 0, behavior: 'instant' })
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
            corrected = true
          }
          if (corrected) this.queueViewportSync()
        }
        this._handleInputViewportChange = () => {
          this.captureChatResizeAnchor()
          this.queueViewportSync()
          this.scheduleViewportStabilization()
        }

        window.addEventListener('resize', this._handleViewportChange, { passive: true })
        window.addEventListener('orientationchange', this._handleViewportChange, { passive: true })
        window.addEventListener('scroll', this._handleRootScroll, { passive: true })
        document.addEventListener('focusin', this._handleInputViewportChange)
        document.addEventListener('focusout', this._handleInputViewportChange)
        if (viewport) {
          viewport.addEventListener('resize', this._handleViewportChange, { passive: true })
          viewport.addEventListener('scroll', this._handleViewportChange, { passive: true })
        }
        if (typeof ResizeObserver !== 'undefined' && this.$refs.chatContent) {
          this._chatResizeObserver = new ResizeObserver(() => this.handleChatResize())
          this._chatResizeObserver.observe(this.$refs.chatContent)
        }
        this.syncChatViewport()
      })
    },

    teardownViewportTracking () {
      const viewport = this._visualViewport
      window.removeEventListener('resize', this._handleViewportChange)
      window.removeEventListener('orientationchange', this._handleViewportChange)
      window.removeEventListener('scroll', this._handleRootScroll)
      document.removeEventListener('focusin', this._handleInputViewportChange)
      document.removeEventListener('focusout', this._handleInputViewportChange)
      if (viewport) {
        viewport.removeEventListener('resize', this._handleViewportChange)
        viewport.removeEventListener('scroll', this._handleViewportChange)
      }
      if (this._chatResizeObserver) this._chatResizeObserver.disconnect()
      if (this._viewportFrame) cancelAnimationFrame(this._viewportFrame)
      this.clearViewportTimers()
    },

    queueViewportSync () {
      if (this._viewportFrame) cancelAnimationFrame(this._viewportFrame)
      this._viewportFrame = requestAnimationFrame(() => {
        this._viewportFrame = 0
        this.syncChatViewport()
      })
    },

    syncChatViewport () {
      const root = this.$refs.chatRoot
      if (!root) return
      if (!window.matchMedia('(max-width: 480px)').matches) {
        root.style.removeProperty('--chat-viewport-top')
        root.style.removeProperty('--chat-viewport-height')
        root.classList.remove('is-keyboard-open')
        delete root.dataset.viewportSource
        delete root.dataset.viewportHeight
        delete root.dataset.viewportTop
        delete root.dataset.viewportObscured
        return
      }

      const viewport = window.visualViewport
      const inputFocused = document.activeElement === this.$refs.userMsgInputRef
      this._handleRootScroll()
      const resolvedViewport = resolveMobileViewport({
        visualHeight: viewport ? viewport.height : window.innerHeight,
        innerHeight: window.innerHeight,
        layoutHeight: this._layoutViewportHeight,
        expandedHeight: this._expandedViewportHeight,
        lastStableHeight: this._lastStableViewportHeight,
        offsetTop: viewport ? viewport.offsetTop : 0,
        scale: viewport ? viewport.scale : 1,
        inputFocused,
        keyboardSession: this._keyboardSession,
        viewportWidth: window.innerWidth,
        previousViewportWidth: this._viewportWidth
      })
      this._expandedViewportHeight = resolvedViewport.expandedHeight
      this._viewportWidth = resolvedViewport.viewportWidth
      this._keyboardSession = resolvedViewport.keyboardOpen
      if (resolvedViewport.visualHeightReliable) {
        this._lastStableViewportHeight = resolvedViewport.height
      }

      this.captureChatResizeAnchor()
      root.style.setProperty('--chat-viewport-height', `${resolvedViewport.height}px`)
      root.style.setProperty('--chat-viewport-top', `${resolvedViewport.top}px`)
      root.classList.toggle('is-keyboard-open', resolvedViewport.keyboardOpen)
      root.dataset.viewportSource = resolvedViewport.source
      root.dataset.viewportHeight = String(resolvedViewport.height)
      root.dataset.viewportTop = String(resolvedViewport.top)
      root.dataset.viewportObscured = String(Math.max(0, Math.round(resolvedViewport.obscuredHeight)))
    },

    scheduleViewportStabilization () {
      this.clearViewportTimers()
      this._viewportTimers = [60, 160, 320, 520, 800].map(delayMs => setTimeout(() => {
        this._handleRootScroll()
        this.syncChatViewport()
      }, delayMs))
    },

    clearViewportTimers () {
      ;(this._viewportTimers || []).forEach(timer => clearTimeout(timer))
      this._viewportTimers = []
    },

    captureChatResizeAnchor () {
      const chatbox = this.$refs.chatContent
      if (!chatbox) return
      const distanceFromBottom = chatbox.scrollHeight - chatbox.clientHeight - chatbox.scrollTop
      this._followLatestOnResize = document.activeElement === this.$refs.userMsgInputRef || distanceFromBottom <= 72
      this._historyScrollTop = chatbox.scrollTop
    },

    handleChatResize () {
      const chatbox = this.$refs.chatContent
      if (!chatbox || this._followLatestOnResize == null) return
      const shouldFollowLatest = this._followLatestOnResize
      const historyScrollTop = this._historyScrollTop
      requestAnimationFrame(() => {
        if (shouldFollowLatest) {
          chatbox.scrollTop = chatbox.scrollHeight
        } else {
          chatbox.scrollTop = Math.min(historyScrollTop, Math.max(0, chatbox.scrollHeight - chatbox.clientHeight))
        }
        this._followLatestOnResize = null
      })
    },

    buildMsgChain (messages) {
      messages.forEach(({ msgs, msgInputSpeed, author, triggerNextAction }) => {
        this.msgChain = this.msgChain
          .then(() => this.sendSysMsg(msgs, msgInputSpeed, author, triggerNextAction));
      })
    },

    sendSysMsg (messages, inputSpeed = 150, author, triggerNextAction = null) {
      return new Promise((resolve) => {
        this.sendSysMsgInner(messages, inputSpeed, author).then(() => {
          if (triggerNextAction) {
            // 需要行为触发下一个消息活动
            const trigger = () => delay(500).then(() => resolve());
            this.nextActionTrigger = {
              inputSpeed,
              triggerNextAction,
              trigger
            };
            console.log('set trigger', this.nextActionTrigger);
            const { type, options } = triggerNextAction;
            this.status = type;
          } else {
            resolve();
          }
        });
      });
    },

    sendSysMsgInner (messages, inputSpeed, author) {
      return new Promise((resolve) => {
        const message = Array.isArray(messages) ? messages[messages.length - 1] : messages;
        const messageType = this.getMsgType(message);
        this.status = 'systemInput';
        if (messageType === 'text') {
          let strings = [''];
          Array.isArray(messages) ? strings = strings.concat(messages) : strings.push(messages);
          const typed = new Typed(".system-input-element", {
            strings: strings,
            typeSpeed: inputSpeed,
            backSpeed: inputSpeed,
            onComplete: () => {
              typed.destroy();
              this.pushMsg(message, author || AUTHOR.AUTHOR, messageType);
              delay(500).then(() => resolve());
            }
          });
        } else {
          this.pushMsg(message, AUTHOR.AUTHOR, messageType);
          delay(500).then(() => resolve());
        }
      });
    },

    sendUserMsg () {
      const message = this.inputMessage;
      this.inputMessage = '';
      this.pushMsg(message, AUTHOR.ME, 'text');

      if (!this.nextActionTrigger) {
        return;
      }
      const { triggerNextAction, inputSpeed, tryCnt = 0 } = this.nextActionTrigger;
      const { type, options } = triggerNextAction;
      const { resolveKeyTexts, rejectKeyTexts, rejectHitTexts } = options;

      if (type === TRIGGER_NEXT_ACTION_TYPE.USER_INPUT) {
        if (this.rejectNextMsg(message, resolveKeyTexts, rejectKeyTexts)) {
          const rejectDisabled = tryCnt >= rejectHitTexts.length - 1;
          const rejectText = rejectHitTexts[Math.min(tryCnt, rejectHitTexts.length - 1)];
          let rejectSysMsgChain = Promise.resolve();
          if (Array.isArray(rejectText)) {
            // 多条回复
            rejectText.forEach(text => {
              rejectSysMsgChain = rejectSysMsgChain
                .then(() => this.sendSysMsg(text, inputSpeed));
            })
          } else {
            // 单条回复
            rejectSysMsgChain = this.sendSysMsg(rejectText, inputSpeed);
          }
          rejectSysMsgChain.then(() => {
            if (rejectDisabled) {
              this.handleTriggerNextAction();
            } else {
              this.status = TRIGGER_NEXT_ACTION_TYPE.USER_INPUT;
            }
          });
          this.nextActionTrigger.tryCnt = tryCnt + 1;
        } else {
          this.handleTriggerNextAction();
        }
      }
    },

    handleComponentOpen ({ type, props }) {
      this.currentOpenComponent = { type, props };
    },

    handleComponentClose () {
      this.currentOpenComponent = null;
      if (!this.nextActionTrigger) {
        return;
      }
      const triggerObj = this.nextActionTrigger;
      const { triggerNextAction } = triggerObj;
      const { type, options } = triggerNextAction;
      if (type === TRIGGER_NEXT_ACTION_TYPE.COMPONENT_CLOSE) {
        this.handleTriggerNextAction();
      }
    },

    handleTriggerNextAction () {
      if (!this.nextActionTrigger) {
        return;
      }
      const triggerObj = this.nextActionTrigger;
      const { trigger } = triggerObj;
      trigger();
      this.nextActionTrigger = null;
      console.log('remove trigger', this.nextActionTrigger);
    },

    setUserInputFoucus () {
      setTimeout(() => {
        this.$nextTick(() => {
          const input = this.$refs.userMsgInputRef
          if (!input) return
          this.captureChatResizeAnchor()
          try {
            input.focus({ preventScroll: true })
          } catch (ignore) {
            input.focus()
          }
          this.queueViewportSync()
          this.scheduleViewportStabilization()
        });
      }, 1000);
    },

    rejectNextMsg (message, resolveKeyTexts = [], rejectKeyTexts = []) {
      if (rejectKeyTexts.some(rejectText => message.indexOf(rejectText) > -1)) {
        return true;
      }
      if (resolveKeyTexts.some(resolveKey => message.indexOf(resolveKey) > -1)) {
        return false;
      }
      return true;
    },

    pushMsg (message, author, type = 'text') {
      this.messages.push({
        author: author,
        content: message,
        type,
        props: this.getProps(message, type),
      });
      onMessageSending();
    },

    getProps (message, type) {
      const props = {};
      if (type === 'text') {
        return props;
      }
      const domParse = new DOMParser();
      const messageDoc = domParse.parseFromString(message, 'text/html');
      const messageDoms = messageDoc.getElementsByTagName(type);
      if (messageDoms.length === 1) {
        const messageDom = messageDoms[0];
        const attrs = messageDom.getAttributeNames();
        attrs.forEach(attrName => props[attrName] = messageDom.getAttribute(attrName));
      }
      return props;
    },

    getMsgType (message) {
      const isImg = /<img[^>]+>/.test(message);
      const isLetter = /<letter[^>]+>/.test(message);
      const isVlog = /<vlog[^>]+>/.test(message);
      if (isImg) return 'img';
      if (isLetter) return 'letter';
      if (isVlog) return 'vlog';
      return 'text';
    },

    markMsgSize (msg, content = null) {
      this.latestMsgContent = content || msg.content;
      return delay(0)
        .then(() => msg.type === 'img' && onImageLoad($('#mock-msg img')))
        .then(() => {
          Object.assign(msg, getMockMsgSize());
          this.messages = [...this.messages];
        });
    },


  }
}


/**
 * UI updating when new message is sending
 */
function onMessageSending () {
  setTimeout(() => {
    // update scroll position when vue has updated ui
    updateScroll();

    const $latestMsg = $('#mobile-body-content .msg-row:last-child .msg');

    // add target="_blank" for links
    $latestMsg.find('a').attr('target', '_blank');

    // update scroll position when images are loaded
    onImageLoad($latestMsg).then(updateScroll);
  });
}

function updateScroll () {
  const $chatbox = $('#mobile-body-content');

  const distance = $chatbox[0].scrollHeight - $chatbox.height() - $chatbox.scrollTop();
  const duration = 250;
  const startTime = Date.now();

  requestAnimationFrame(function step () {
    const p = Math.min(1, (Date.now() - startTime) / duration);
    $chatbox.scrollTop($chatbox.scrollTop() + distance * p);
    p < 1 && requestAnimationFrame(step);
  });
}

function delay (amount = 0) {
  return new Promise(resolve => {
    setTimeout(resolve, amount);
  });
}

function getMockMsgSize () {
  const $mockMsg = $('#mock-msg');
  return {
    width: $mockMsg.width(),
    height: $mockMsg.height()
  };
}

function onImageLoad ($img) {
  return new Promise(resolve => {
    $img.one('load', resolve)
      .each((index, target) => {
        // trigger load when the image is cached
        target.complete && $(target).trigger('load');
      });
  });
}
</script>

<style>
.animate_breathe {
  animation: breathe 1800ms ease-in-out 500ms infinite alternate;
}
@keyframes breathe {
  0% {
    filter: drop-shadow(0 4px 10px rgba(141, 121, 232, 0.08));
  }

  100% {
    filter: drop-shadow(0 8px 18px rgba(141, 121, 232, 0.28));
  }
}
</style>
