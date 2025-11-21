<template>
  <div
    :class="{ flap: flap }"
    class="birthday-envelope animate__animated animate__zoomIn"
    @click="$emit('open')"
  >
    <div class="envelope">
      <div class="heart"></div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    // 这里可以保留，外部如果还在传 openTip 就不会报错，
    // 只是组件内部不再使用它
    openTip: String,
    flap: Boolean
  }
}
</script>

<style>
/* 外层：为了适配整体生日信纸风格，加了一个命名空间类 */
.birthday-envelope {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

/* 信封主体：小型贺卡 + 渐变 + 圆角 + 现代阴影 */
.envelope {
  position: relative;
  width: 180px;
  height: 120px;
  padding: 8px 10px;
  box-sizing: border-box;
  background: radial-gradient(circle at top, #ffe4f0 0, #ffffff 60%, #f3f6ff 100%);
  border-radius: 22px;
  box-shadow:
    0 14px 30px rgba(15, 23, 42, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.9);
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.birthday-envelope:hover .envelope {
  transform: translateY(-2px);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.26),
    0 0 0 1px rgba(255, 255, 255, 0.9);
}

/* 上盖：用矩形 + 渐变 + 翻转来模拟信封盖 */
.envelope:before {
  content: "";
  position: absolute;
  top: 0;
  left: 6px;
  right: 6px;
  height: 70%;
  z-index: 3;
  border-radius: 18px 18px 32px 32px;
  background: linear-gradient(135deg, #ffafbd, #ffc3a0);
  box-shadow: 0 8px 18px rgba(255, 154, 158, 0.6);
  transform-origin: top;
  transition: transform 0.5s ease-in-out 0.7s, box-shadow 0.3s ease-in-out;
}


/* 信封正中偏下的“生日贴纸” */
.heart {
  position: absolute;
  top: 56%;
  left: 50%;
  width: 32px;
  height: 32px;
  background: radial-gradient(circle at 30% 30%, #ffeef5 0, #ff6f91 45%, #ff4b7d 100%);
  z-index: 4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(248, 113, 150, 0.7);
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition: transform 0.5s ease-in-out 1s;
  font-size: 14px;
  color: #fff;
}

/* 小高光点，保留一点“心”的感觉 */
.heart:before,
.heart:after {
  content: "";
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.35);
}

.heart:before {
  width: 9px;
  height: 9px;
  top: 5px;
  left: 6px;
}

.heart:after {
  width: 5px;
  height: 5px;
  bottom: 6px;
  right: 7px;
}

/* flap 状态：信封盖翻上去，贴纸转一圈 */
.flap .envelope:before {
  transform: rotateX(180deg);
  z-index: 0;
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
}

.flap .heart {
  transform: translate(-50%, -50%) rotate(720deg);
  transition-delay: 0.4s;
}

/* 小屏适配：稍微缩小一点 */
@media only screen and (max-width: 600px) {
  .envelope {
    width: 160px;
    height: 110px;
    border-radius: 20px;
  }
}
</style>
