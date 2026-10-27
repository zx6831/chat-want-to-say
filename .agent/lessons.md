# Lessons Learned

## Frontend Visual System

### 参考页的玻璃感来自透光层级而非纯白卡片

Conclusion: `refui` 的有效玻璃材质组合是低占比雾白底、斜向高光、细边缘、18px 模糊、1.15 饱和与轻阴影；提高纯白不透明度会失去背景透视。

Scope: 聊天页顶部控件、消息气泡、输入区以及后续需要复用的玻璃表面。

Evidence: `refui/.../apps/web/src/ui/glass-surface.css` 的共享 token；本次 1280×900 与 390×844 Chrome 截图中背景渐变可穿过所有玻璃表面。

Correct approach: 先建立统一材质参数，再让结构样式只负责尺寸、圆角与布局；用轻微实色差区分我方和对方消息。

Related files/tests: `src/components/chat-dialog/css/_mobile.scss`、`_mobile.msg.scss`；Chrome CDP 截图检查。

## Compatibility and Validation

### 部署仓库不能跟踪 node_modules 和本地参考工程

Conclusion: 本项目初始提交跟踪了 9,563 个 `node_modules` 文件，Windows 安装依赖后会产生大量换行状态噪声并显著拖慢 Git 与云构建；依赖应只由 `package.json` 和 `yarn.lock` 描述。

Scope: GitHub main 分支、Cloudflare Pages 构建和后续依赖更新。

Evidence: 清理前 tracked `node_modules` 约 65.1MB、9,563 个文件；从索引移除后本地依赖仍保留，`npm run build` 在 Node v22.20.0 / Yarn 1.22.22 下通过。

Correct approach: `.gitignore` 排除 `/node_modules/`、`/dist/`、`/public/album-generated/`、`/refui/`；云端从锁文件安装依赖，并在构建时重新生成相册兼容资源。

Related files/tests: `.gitignore`、`package.json`、`yarn.lock`；`git ls-files node_modules`、`npm run build`。

### 纸张比例应按使用场景分层而不是全端强制 A5

Conclusion: A5 的 148:210 比例适合桌面展示，但在 iPhone 16 Pro 竖屏上会留下大量上下空白；手机端应采用屏幕的 402:874 比例，让信纸接近铺满视口，同时保留纸内滚动。

Scope: 信件内容页的响应式尺寸。

Evidence: 402×874 浏览器实测中，信纸为 382×830.52，左右边距 10px、上下边距约 21.7px，比例与目标 402:874 一致且无横向溢出；844×390 横屏仍保持 A5 比例。

Correct approach: 桌面和横屏使用 A5 比例；`max-width: 600px` 且竖屏时切换到 `aspect-ratio: 402 / 874`，宽度同时受视口宽高约束。

Related files/tests: `src/components/chat-dialog/letter/content.vue`；`agent-browser` 402×874 和 844×390 几何验证。

### 原生输入框可以无缝替换 Varlet 输入外壳

Conclusion: 现有 `setUserInputFoucus()` 只依赖 DOM 的 `scrollIntoView()` 和 `focus()`，因此原生 `<input>` 能保留自动聚焦与 v-model 行为，同时更容易实现参考页的玻璃胶囊。

Scope: `ChatDialog` 的用户答题输入区。

Evidence: 隔离浏览器中输入“雨霖铃”后按钮从 disabled 变为 enabled，点击后消息数 5→6、末项为 `msg-me`、输入值清空。

Correct approach: 保留 `ref="userMsgInputRef"`、`v-model` 和表单 submit；不要改动消息链状态机。

Related files/tests: `src/components/chat-dialog/index.vue`；Chrome CDP 交互验证。

### Chrome 命令行截图不能可靠模拟窄手机视口

Conclusion: Windows Chrome `--window-size=390,844` 仍可能受最小窗口宽度影响；移动端布局验收应使用 CDP `Emulation.setDeviceMetricsOverride`。

Scope: 本项目后续移动端 UI 截图与几何验证。

Evidence: 命令行截图曾裁掉 430px 桌面窗体右侧；CDP 模拟后 `innerWidth=390`、`#mobile=[0,0,390,844]` 且完整显示左右顶部圆钮。

Correct approach: 用 CDP 设置 390×844，再读取 `scrollWidth`、关键元素矩形并截图。

Related files/tests: 本次 Chrome CDP 390×844 几何与截图验证。

### 本地图片先压缩再持久化

Conclusion: 用户自定义头像不能直接把原始文件写入 `localStorage`；先用 Canvas 裁切/缩放并导出 JPEG，能限制单张体积并统一展示行为。

Scope: 双方自定义头像。

Evidence: 浏览器自动化上传两张 SVG 测试图后，头像存储结果为 `data:image/jpeg`，刷新后正确恢复。

Correct approach: 头像居中裁成 256×256、质量 0.86，并捕获容量异常给出明确提示；固定目录相册直接交给 Vite 处理，不写入 `localStorage`。

Related files/tests: `src/components/chat-dialog/image-utils.js`、`AvatarSettings.vue`；Chrome CDP 上传与刷新验证。

### 共享元素转场需要防止用户重入

Conclusion: `document.startViewTransition()` 的更新回调会先切换 DOM，再等待顶层快照动画完成；在约 420ms 内再次触发导航可能与当前快照冲突。

Scope: 聊天与相册之间的进入/返回。

Evidence: 自动化脚本在相册节点刚出现时立即返回，命中防重入并保留当前页面；等待转场结束后返回成功。

Correct approach: 使用 `viewTransitioning` 锁直到 `transition.finished`，稳定验收时同时确认 `data-album-transition` 已清除。

Related files/tests: `src/components/chat-dialog/index.vue`、`css/_mobile.scss`；Chrome CDP 稳定转场与返回验证。

### 项目默认头像与浏览器自定义值分层

Conclusion: 默认头像应作为项目静态资源随构建发布，本地存储只承担用户覆盖值；否则新设备看不到指定头像，“恢复默认”也会退回文字占位。

Scope: 双方头像初始化和恢复默认。

Evidence: 全新 Chrome 配置在 `localStorage` 为空时成功加载 `/avatars/author.jpg` 与 `/avatars/me.jpg`；设置面板两图均完成解码，对方消息实际使用蓝色默认头像。

Correct approach: 用 `DEFAULT_AVATARS` 定义发布资源 URL，初始化时采用“自定义值优先、默认值回退”，恢复默认直接写回对应默认 URL。

Related files/tests: `public/avatars/author.jpg`、`public/avatars/me.jpg`、`image-utils.js`、`index.vue`、`AvatarSettings.vue`。

### 输入提示光效应绑定业务状态而不是永久焦点

Conclusion: 本项目的连续彩色输入光环应由 `userInput` 业务状态和空输入共同控制；单纯绑定 `:focus` 会在用户打字期间持续闪烁，也无法区分程序自动聚焦与真正需要提醒的时机。

Scope: 聊天页底部输入胶囊和后续同类交互提示。

Evidence: 真实消息链进入答题阶段后 `.composer.is-awaiting-input` 启用清晰彩色环 `composerRingFlow` 与模糊外辉光 `composerRingGlow`；输入“雨”后 Vue 立即移除该类，两个伪元素动画变为 `none`、不透明度为 `0`。

Correct approach: 用 `status === 'userInput' && !inputMessage.trim()` 挂载提示类；用遮罩后的多色渐变绘制连续细环，复制一层并模糊为外辉光；输入本体清除矩形 outline，低动态偏好使用静态光环。

Related files/tests: `src/components/chat-dialog/index.vue`、`css/_mobile.scss`；`agent-browser` 计算样式和真实答题阶段交互验证。

### 删除界面引导文案时同步清理结构与关联样式

Conclusion: 删除可见引导文案不能只隐藏文本；应同时移除模板节点、普通样式和低动态模式中的残留选择器，避免死样式继续误导后续维护。

Scope: 聊天页顶部相册胶囊及其他带辅助小字、图标动效的控件。

Evidence: 删除 `.title-note` 节点后，源码精确搜索不再包含旧引导文案或对应选择器；`agent-browser` 验证胶囊可见文本只有“王泽贤”，相册标题区域的 `small` 节点数量为 0。

Correct approach: 从模板删除不需要的可见节点，再搜索类名及文案并清除普通、hover 和 `prefers-reduced-motion` 样式；最后用浏览器读取实际 `textContent` 和节点数量。

Related files/tests: `src/components/chat-dialog/index.vue`、`AlbumSpace.vue`、`css/_mobile.scss`；`agent-browser get text`、`get count`。

### HEIC 相册需要构建前标准化而不是直接交给浏览器

Conclusion: 固定目录相册包含 HEIC/HEIF 时，不能只依靠 Vite 静态 glob 和浏览器解码；需要在开发或构建前提取元数据并转换为浏览器可显示的 JPEG。

Scope: `src/assets/album/` 固定相册目录。

Evidence: 当前 67 个真实 HEIC 均成功转为 JPEG；浏览器完成解码并预览 `IMG_7525.heic`（3085×2314）。

Correct approach: `predev`/`prebuild` 执行 Node 预处理器，生成带时间字段的 manifest 和兼容图片；页面只消费生成清单。

Related files/tests: `scripts/prepare-album.cjs`、`package.json`、`AlbumSpace.vue`；`yarn album:prepare`、`npm run build`、浏览器图片解码验证。

### 图片真实格式应由文件签名判定

Conclusion: 文件扩展名不可靠；相册中存在名为 `.HEIC`、内容实际为 JPEG/JFIF 的文件，仅按后缀转换会失败。

Scope: 相册图片格式适配。

Evidence: `IMG_20251227_155424.HEIC` 的文件签名为 JPEG，签名识别后按 JPEG 直接复制并正常展示。

Correct approach: 先读取文件头识别 JPEG/PNG/GIF/WebP/AVIF/HEIC，再决定直接复制或 HEIC 转换；扩展名只作为未知格式回退。

Related files/tests: `scripts/prepare-album.cjs::detectImageFormat`；相册生成统计与浏览器无破图检查。

### 相册时间排序必须在生成端和展示端使用同一规则

Conclusion: 相册应优先使用 EXIF `DateTimeOriginal`，其次 `CreateDate`；没有拍摄时间时先使用文件修改时间，修改时间无效时才使用文件创建时间。时间从早到晚，完全相同时以修改时间、创建时间和文件名稳定排序。

Scope: 相册清单生成和前端渲染。

Evidence: 修复前的清单断言稳定检出 87/87 个无拍摄时间条目错误使用创建时间；修复后 135 项 manifest 中 48 张使用拍摄时间、87 张使用修改时间、0 张使用创建时间，优先级和单调性测试通过，前端首批 18 个 DOM 项与 manifest 逐项一致。

Correct approach: 生成端分别写入 `capturedAt`、`modifiedAt`、`createdAt` 和 `dateSource`，用统一选择函数生成有效 `takenAt`；前端按相同优先级防御性排序，不使用文件名推断拍摄时间。保留 `npm run test:album-order` 覆盖三种回退分支和实际清单。

Related files/tests: `scripts/prepare-album.cjs::selectPhotoDate/comparePhotos`、`scripts/check-album-order.cjs`、`AlbumSpace.vue::loadAlbum`；`npm run test:album-order`、`agent-browser` DOM 顺序检查。

### 图片原生懒加载不能替代缩略图和 DOM 分批挂载

Conclusion: `loading="lazy"` 只能推迟部分网络请求；一次渲染 135 个卡片并让网格直接引用多兆像素原图，仍会产生明显的 DOM、解码、内存与合成压力。

Scope: 固定目录相册的列表滚动和后续大批量图片展示。

Evidence: 优化前进入相册即存在 135 个照片节点，已加载列表图最大自然宽度 3961px；优化后初始节点为 18，列表图最大 720px，滚动后按批次增至 36，单图预览仍正确加载 1080×1440 完整图。135 个缩略图总计 3.94MB，平均 29.9KB。

Correct approach: 构建阶段生成小尺寸 WebP 列表图；前端首批只挂载可用数量的卡片，以相册滚动容器为根通过 `IntersectionObserver` 逐批追加；预览保持使用完整兼容图。观察器必须在 loading 分支退出、哨兵节点实际挂载后的 `$nextTick` 中建立。

Related files/tests: `scripts/prepare-album.cjs`、`src/components/chat-dialog/AlbumSpace.vue`；`npm run build`、`agent-browser` 节点数量/自然尺寸/预览源验证。

### 连续页面背景只能由一个根层绘制

Conclusion: 头部、消息区和底部若各自叠加半透明渐变，即使颜色相近，也会在容器边界出现可见接缝。

Scope: 移动端聊天页及其他全屏玻璃界面。

Evidence: 将完整渐变提升到 `#mobile`，并把三段子容器改为透明后，402×874 截图边缘相邻行色差顶部由 13.93 降至 2.47、底部由 10.36 降至 2.55。

Correct approach: 根容器负责连续底色和渐变；分区只负责布局与玻璃控件，跨分区装饰层覆盖整个根区域，避免在 header/body/footer 边缘重新开始绘制。

Related files/tests: `css/_mobile.scss`、`css/_mobile.body.scss`；修复前后截图像素扫描。

### iOS 键盘布局必须持续跟随 VisualViewport

Conclusion: 只在 focus 后调用 `scrollIntoView()` 或等待少量帧，无法覆盖 iOS/微信键盘动画中异步发生的可视高度、顶部偏移和根页面滚动变化；同时不能默认 VisualViewport 的每次读数都可信。

Scope: 移动端聊天输入、固定底栏和消息列表滚动。

Evidence: 模拟可视高度 874→520→874 后，根容器与输入栏精确贴合视口、横向边距保持 14px、页面滚动归零；历史 `scrollTop=140` 在高度变化后保持不变，底部状态则继续跟随最新消息。

Correct approach: 使用经过校验的 `visualViewport.height/offsetTop/pageTop` 驱动根容器 CSS 变量，监听 window 与 visualViewport 的 resize/scroll、focus/blur，并在键盘动画窗口持续复查；高度为 0 或异常小时使用可信回退，不能写成 1px；用 `ResizeObserver` 区分“跟随最新”和“保留历史位置”。

Related files/tests: `src/components/chat-dialog/index.vue`、`css/_mobile.scss`；`agent-browser` 402×874、402×520 键盘开合及历史位置回归。

### WebKit 的 VisualViewport 事件值需要先校验再写入布局

Conclusion: iOS Safari/WKWebView 在软键盘动画中可能先派发 `resize`，但 `visualViewport.height` 暂时为 0，`offsetTop` 也可能晚于 `pageTop`；直接写入根容器会让整个聊天界面消失。

Scope: iPhone Safari、微信等 WKWebView 中的全屏聊天布局。

Evidence: 用户真机截图中键盘打开后只剩背景；旧逻辑对高度 0 执行 `Math.max(1, height)`，会把根层设为 1px。回归测试在旧逻辑下明确失败；加固后实际组件注入 `height=0/offsetTop=420` 时保持 506px 高，头部和输入区仍可见。

Correct approach: 拒绝 0/异常小的 visual height，使用合理的 `innerHeight`、最后稳定高度或布局高度回退；只在 visual height 可信时采用视觉顶部偏移，并以 `max(offsetTop, pageTop - scrollY)`覆盖延迟字段；失焦时始终清零顶部补偿。

Related files/tests: `viewport-utils.mjs`、`scripts/check-mobile-viewport.cjs`、`index.vue::syncChatViewport`；`npm run test:viewport`、`agent-browser` 异常属性注入。

### 六图交错拼贴应按组建模而不是依赖全局 nth-child

Conclusion: “两张大图 + 四张小图、下一轮左右镜像”是六张照片共同决定的结构，应先把可见照片切成六图组，再让组索引控制镜像；全局周期选择器难以正确表达左右翻转和尾组收缩。

Scope: 相册列表拼贴、分批挂载与不满六张的最后一组。

Evidence: 390×844 浏览器实测首组左侧大图为 238.7×203、右侧小图为 115.3×97.5；第二组左右镜像；135 张照片形成 23 组，最后 3 张由完整 414px 组高自动收为 203px。

Correct approach: `visiblePhotoGroups` 每 6 张切组；每批仍追加 18 张以保持 3 个完整组；组内按照片序号显式落到 3 列 × 4 行网格，尾组 1–3 张使用两行高度。

Related files/tests: `src/components/chat-dialog/AlbumSpace.vue`；`agent-browser` 组几何、全量滚动和尾组高度验证。

### 页面级光效必须低于应用根层才能保证原图显示

Conclusion: `body::before/::after` 这类固定伪元素即使只是背景装饰，也需要显式放在应用根节点下面；否则后绘制的半透明白色光效可能在相册图片上方合成，造成底部照片发白。

Scope: 全局背景光斑、相册图片和其他需要保持原始色彩的媒体。

Evidence: 调整后计算层级为全局光效 z=0、`#app` z=1、相册内容 z=3、照片 z=2、图片 z=1；图片为 `opacity: 1`、`filter: none`、`mix-blend-mode: normal`，135 张全量底部截图无白雾覆盖。

Correct approach: 为 `#app` 建立高于全局装饰的层级；在相册内部使用隔离 stacking context，并让图片自身无透明度、滤镜或混合模式。

Related files/tests: `src/components/chat-dialog/css/_global.scss`、`src/components/chat-dialog/AlbumSpace.vue`；`agent-browser` 层级计算和相册底部截图。

### 逐字显示的正文不能使用两端对齐或智能平衡换行

Conclusion: `text-align: justify` 会在每增加一个字符时重新分配当前行字距，`text-wrap: pretty` 还可能重新平衡前面的断行；两者都会让 Typed.js 已显示的上一行持续变化。

Scope: 手机竖屏信纸的逐字正文和其他流式打字文本。

Evidence: 改为硬换行、左对齐和普通换行后，从第 20 字继续显示到第 45 字，第一行 18 个可见字符的 x、y 和宽度最大变化均为 0；实际长段落稳定形成 18/20/20/20/20/17 字行。

Correct approach: 格式化时忽略 `^数字` 停顿标记，首行按“两格缩进 + 18 字”、后续按 20 字插入换行；CSS 使用 `white-space: pre-wrap`、`text-align: left`、正常字距和与 20em 对应的响应式字号。

Related files/tests: `src/components/chat-dialog/letter/content.vue`；`agent-browser` 第 20/45 字坐标对比与实际 `letter.json` 长段落计数。
