# Current State

Last updated: 2026-10-27
Current branch: `main`
Current phase: 相册云端文件时间持久化修复已在本地提交 `92a8000`、待推送部署；第三版 iPhone/WKWebView 键盘视口修复已推送 `main`

## Current Objective

推送并部署相册文件时间持久化修复，确认生产站点按“拍摄时间 → 修改时间 → 创建时间”排序；同时等待真实 iPhone 微信复验第三版键盘视口修复。

## Completed

- 分析并迁移 `refui` 的共享玻璃材质、聊天布局和 View Transition 动效语言。
- 聊天页已完成液态玻璃头部、消息气泡、背景、输入区与响应式改造。
- 顶部右侧按钮可打开“设置双方头像”玻璃面板；双方头像可独立上传、更换或恢复默认。
- 默认头像已固化为项目资源：蓝色图片对应 `author`，羊图片对应 `me`；新浏览器无需配置即可显示。
- 头像在浏览器端自动居中裁成 256×256 JPEG，并保存到 `localStorage`。
- 顶部中间胶囊只显示当前人名，点击可进入标题为“我们俩”的相册；标题下方灰色说明已移除。
- 相册预处理器会扫描 `src/assets/album/`，识别 JPEG、PNG、GIF、WebP、AVIF、HEIC/HEIF；HEIC/HEIF 在启动或构建前转为 JPEG。
- 相册优先读取 EXIF `DateTimeOriginal`，其次读取 `CreateDate`；均不存在时使用文件修改时间，修改时间也不存在时才使用文件创建时间。所有照片按选中的有效时间升序显示，并以修改时间、创建时间、文件名稳定打破并列。
- 相册原始修改/创建时间已持久化到受 Git 跟踪的 `src/assets/album-file-dates.json`；云端构建不再读取被 Git 检出重置的文件系统时间。
- 文件内容会通过魔数识别，扩展名与真实内容不一致的图片也能按实际格式处理。
- 当前相册共 135 张：67 张 HEIC 转换、48 张使用拍摄时间、87 张使用文件修改时间、0 张退回文件创建时间。MOV/MP4 不进入图片相册。
- 相册列表使用构建期生成的 720px WebP 缩略图，首批只渲染 18 张；滚动接近底部时由 `IntersectionObserver` 每批追加 18 张，单图预览仍读取完整兼容图。
- 相册每 6 张形成一组：奇数组左侧 2 张大图、右侧 4 张小图，偶数组左右镜像；135 张照片的最后 3 张自动收成半组高度。
- 全局白色雾光固定在 `#app` 下方；相册容器、画廊、照片和原始图片建立明确层级，图片保持不透明、无滤镜和普通混合模式。
- 用户输入框不再显示矩形 `focus-visible` 轮廓；进入 `userInput` 且输入为空时，整个胶囊外围显示连续彩色细环和同色模糊外辉光，开始输入后自动收敛。
- 信件内容页已改为米白纸张：桌面与横屏保留 148:210 A5 比例，手机竖屏采用 iPhone 16 Pro 的 402:874 比例并接近铺满视口；顶部为透明水彩小羊草地插画，正文为楷体大留白排版，底部保留 `Dancing sunbeams` 花体落款。
- 信件原有标题与逐段 Typed.js 打字、图片段落、纸内滚动、完成返回和右上关闭交互保持不变；粉色徽章、副标题、横线纸和悬浮回顶按钮已移除。
- 聊天与相册使用约 420ms 的原生共享元素过渡；低动态或不支持 View Transition 时使用轻量回退。
- 头像与相册均为本地前端构建功能，未增加 AI、接口或后端服务。
- GitHub `origin/main` 已包含液态玻璃前端、双方头像、相册与信纸改造，以及相册缩略图和分批挂载优化。
- 聊天页背景改为由 `#mobile` 根容器一次性绘制，头部、消息区和输入区透明叠放；上下背景不再因独立半透明层产生颜色分界。
- 移动端聊天区域持续跟随 `visualViewport.height/offsetTop`；键盘开合期间纠正根页面异常滚动，输入栏保持固定横向边距。
- 消息容器使用 `ResizeObserver` 响应可用高度变化：位于底部时跟随最新消息，阅读历史时保留原 `scrollTop`。
- 移动视口解析器会拒绝 `visualViewport.height=0` 或异常小值，依次回退到可信 `innerHeight`、最后稳定高度或布局高度，防止聊天根层被压成 1px。
- 第三版键盘逻辑按参考工程维护“展开高度基线 + 键盘会话”：`offsetTop` 被夹在布局有效范围内，输入失焦后在视口完全恢复前仍保持键盘布局，视口缩放不会误判为键盘。
- 移动端页面根级固定并禁止外层滚动，viewport meta 使用 `viewport-fit=cover, interactive-widget=resizes-content`；触屏输入字号固定为 16px，避免 iOS 聚焦自动缩放。
- 手机竖屏信纸正文固定为每行 20 个字符单元，首行因两格缩进显示 18 字；正文使用硬换行和左对齐，后续逐字出现不会再改变上一行字距或断行。

## In Progress

- 第三版键盘修复已通过纯函数回归、实际 Vue 组件异常指标注入和生产构建，并已推送；等待真实 iPhone 微信复验。
- 相册时间持久化代码已在本地提交 `92a8000`；尚未推送 `origin/main`，生产站点仍在使用把检出时间当修改时间的旧构建。

## Architecture and Key Decisions

- `ChatDialog` 保持消息状态机所有权，仅管理当前视图、头像状态和设置面板开关。
- `AvatarSettings.vue` 管理双方头像选择、裁切、保存和恢复默认。
- `scripts/capture-album-file-dates.cjs` 在本机读取 135 张源图的原始修改/创建时间并写入受跟踪的 `src/assets/album-file-dates.json`；新增或替换照片后必须运行 `npm run album:capture-dates`。
- `scripts/prepare-album.cjs` 读取源图、受跟踪的文件时间索引和拍摄元数据、转换 HEIC，同时用 Sharp 为每张照片生成最长边 720px、质量 72 的 WebP 缩略图，并生成按优先级时间排序的 `public/album-generated/manifest.json`；索引缺失或文件大小不一致时构建直接失败。
- `AlbumSpace.vue` 读取生成清单，防御性再次按拍摄时间、修改时间、创建时间和文件名排序；网格消费缩略图并分批挂载 DOM，预览消费完整兼容图。
- `AlbumSpace.vue` 将可见照片每 6 张切为一组，用 3 列 × 4 行网格安排 2 张跨 2 列/2 行的大图与 4 张单格小图；组索引决定左右镜像，尾组 1–3 张只保留 2 行。
- `body::before/::after` 是纯背景光效，层级为 0；`#app` 层级为 1，避免全局雾光在照片上方合成。
- `letter/content.vue` 使用“桌面 A5、手机竖屏 402:874”的响应式纸张比例和内部 flex 滚动区；透明插画位于 `public/letter/lamb-watercolor.png`，不依赖外部网络。
- 手机竖屏正文先由 `formatParagraphText` 忽略 Typed.js 的 `^数字` 停顿标记，再按首行 18 字、后续 20 字写入硬换行；CSS 以 20em 行宽、5cqi 自适应字号、`pre-wrap` 和左对齐显示。
- `image-utils.js` 统一图片读取、Canvas 压缩和 JSON 本地存储。
- 存储键：`chat-want-to-say:avatars:v1`；相册不再使用浏览器存储。
- 默认头像由 `DEFAULT_AVATARS` 提供；本地自定义值优先，空值或无存储时回退到项目默认图片。
- 相册目录支持 `.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.avif`、`.heic`、`.heif`，不递归读取子目录。
- `predev`、`prebuild`、`prepreview` 自动执行相册预处理；生成目录被 Git 忽略，并使用处理器版本、源文件名、大小和受跟踪的文件时间组成的指纹增量复用完整图与缩略图。
- Git 不再跟踪 `node_modules/`；`.gitignore` 同时排除 `node_modules/`、`dist/`、`public/album-generated/` 和仅供设计参考的 `refui/`。
- 桌面聊天窗宽 430px；`<=480px` 时铺满视口。玻璃材质继续使用低占比雾白、18px blur 和轻量高光。
- `index.vue` 通过 `viewport-utils.mjs` 维护展开高度、键盘会话、宽度基线和缩放状态，再用 CSS 变量 `--chat-viewport-height`、`--chat-viewport-top` 驱动固定聊天根容器；根节点的 `data-viewport-source/height/top/obscured` 用于真机诊断。

## Validation Status

- 生产无缓存诊断：`missmia.206831.xyz` 当前 manifest 将 `659d5e21bedca5306220a40952cea072.JPG` 的修改时间错误写为部署时间 `2026-10-27T07:41:54.522Z`；`capturedAt=null`，已排除 EXIF、前端格式化和缓存因素。
- 云端检出回归：修复前测试稳定失败为部署时间覆盖三月修改时间；修复后 `selectPhotoDate` 使用受跟踪时间覆盖模拟的云端 mtime。
- 目标照片回归：时间索引、开发 manifest 和 `dist` manifest 均为 `2026-03-08T13:07:15.000Z`；在完整升序清单中为第 82 张。
- 本地生产预览：目标照片卡片显示“2026年3月8日”，预览显示“2026年3月8日 21:07”，运行时错误为 0。
- `npm run album:capture-dates`：通过；捕获 135 张照片的原始修改/创建时间。
- `npm run album:prepare`：通过；生成 135 张照片，67 张 HEIC 转换，48 张拍摄时间、87 张修改时间、0 张创建时间回退。
- `npm run test:album-order`：通过；覆盖拍摄、修改、创建三段优先级，并检查实际 manifest 中非拍摄条目没有跳过修改时间及清单整体单调性。
- 相册页面级顺序检查：通过；4174 本地页面首批 18 个 DOM 照片与 manifest 逐项一致，页面运行时错误为 0。
- `npm run build`：通过，Vite 2.9.18，439 modules transformed；保留现有 Zepto 非 module 警告。
- 缩略图完整性：135 个 WebP，总计 3.94MB、平均 29.9KB、最大 73.7KB；`dist/` 共 285 个文件、249.93MB。
- `agent-browser` 相册性能验收：优化前进入页面立即挂载 135 个照片节点，已加载图片最大自然宽度 3961px；优化后首批只有 18 个节点，列表图最大 720px，滚动后节点按批次增至 36；点击照片后预览使用 1080×1440 的完整 JPEG，不误用缩略图。
- 水彩小羊信纸：`npm run build` 通过，438 modules transformed；iPhone 16 Pro 逻辑视口 402×874 下卡片为 382×830.52、比例 0.459955，与 402:874 一致，左右边距 10px、上下边距约 21.7px且无横向溢出；1280×900 桌面为 460×652.69，844×390 横屏为 252.31×358，两者保持 A5 比例。
- 信纸插画 PNG 为 1774×887，包含透明像素；浏览器自然尺寸加载完成。右上关闭按钮点击后 `.letter-content` 数量归零并返回聊天页。
- 部署前最终构建：Node v22.20.0、Yarn 1.22.22 下 `npm run build` 通过，438 modules transformed；构建产物 150 个文件、245.98MB，最大单文件 6.57MB。
- 自动化上传：双方测试头像均转换为 `data:image/jpeg` 并写入本地存储；消息头像读取保存结果。
- 独立恢复默认：清除对方头像后“我的头像”仍保留，验证双方设置互不影响。
- 已目视检查头像设置面板、固定目录相册及待输入连续彩色光环。
- 全新 Chrome 配置清空本地存储后：头像面板加载 `/avatars/author.jpg`（401×401）和 `/avatars/me.jpg`（940×940），5 条对方消息均使用蓝色默认头像。
- `agent-browser` 文案验收：聊天页胶囊可见文本为“王泽贤”；进入相册后 H1 为“我们俩”，`.album-hero small` 数量为 0。
- `agent-browser` 输入态验收：输入框为 `outline: none`；空输入时运行 `composerRingFlow` 和 `composerRingGlow`，计算样式包含六色线性渐变、8px 模糊与 1.35 饱和；输入“雨”后状态类、动画和伪元素不透明度均归零。
- 背景接缝回归：402×874 截图边缘相邻行最大色差，顶部从 13.93 降至 2.47，底部从 10.36 降至 2.55；头部、主体和底部计算背景均透明，根容器独占完整渐变。
- 键盘视口回归：模拟 874→520→874 高度时，聊天根区域分别精确为 520/874px，输入栏左右边距始终 14px，底部对齐可视视口，`scrollY` 始终为 0；最新消息距离底部为 0。
- 历史阅读回归：添加浏览器临时长内容后将 `scrollTop` 设为 140，视口变化后仍保持 140，没有被强制拉到底部。
- 移动端修复后 `npm run build`：通过，Vite 2.9.18，438 modules transformed；仅保留现有 Zepto 非 module 警告。
- 六图相册与移动端修复组合后的 `npm run build`：通过，Vite 2.9.18，438 modules transformed；`git diff --check` 通过，仅保留换行提示和既有 Zepto 警告。
- `agent-browser` 390×844：首组大图 238.7×203、小图 115.3×97.5，左大右小；第二组同尺寸左右镜像；`scrollWidth=390`。
- 相册滚动到底后共渲染 135 张、23 组、破图 0；尾组 3 张高度由 414px 收为 203px，底部间距 28px。照片计算样式为 `opacity: 1`、`filter: none`、`mix-blend-mode: normal`。
- `npm run test:viewport`：通过；覆盖 VisualViewport 高度为 0、正常平移、异常超大偏移夹紧、失焦但键盘未收完、键盘收起残留偏移和 pinch zoom 六类 WebKit 场景。
- `agent-browser` 实际 Vue 组件注入：`height=506/offsetTop=900` 时根层夹紧为 top=368、height=506；失焦且视口仍缩小时保持 top=90 和键盘状态；恢复到 874px 后 top=0；scale=2 时保持 874px 且不进入键盘状态，所有阶段 `scrollY=0`。
- 第二版正常路径回归：874→520→874 时根层高度、头尾位置、最新消息跟随和 `scrollY=0` 正常；历史 `scrollTop=140` 在高度变化后保持不变。
- 第三版键盘会话修复与当前全部功能组合的 `npm run build`：通过，Vite 2.9.18，439 modules transformed；仅保留既有 Zepto 警告。
- `agent-browser` 402×874 信纸动态验收：第 20 字与第 45 字时第一行 18 个字的 x/y/宽度最大变化均为 0；实际含停顿标记的长段落分行为 18/20/20/20/20/17，停顿标记未计入字数；计算样式为左对齐、正常字距、`pre-wrap`。

## Known Problems

- 生产站点尚未包含本地提交 `92a8000`，目标照片仍显示 2026 年 10 月 27 日；必须推送并完成 Cloudflare Pages 新部署后才能在线生效。
- `index.html` 的传统 Zepto script 会触发 Vite “can't be bundled without type=module” 警告，但构建和运行正常。
- 自定义头像仍依赖当前浏览器 `localStorage` 容量；固定目录相册不受该容量限制。
- 第三版已覆盖零高度、超大偏移、失焦过渡、页面滚动和 pinch zoom，但真实 iPhone 微信键盘动画及 Dynamic Island/浏览器工具栏组合仍需部署后真机复验。
- 手机信纸固定字数已在 Chrome 402×874 模拟视口验证，真实 iPhone 字体回退和微信内置浏览器渲染仍需真机目视确认。
- 首次处理大量 HEIC 并生成缩略图会比后续启动慢；本机首次新版预处理约 80 秒，生成缓存存在时会按版本化源文件指纹复用。
- Cloudflare Pages 全球网络不保证中国大陆访问质量；如需稳定大陆访问，需要另行考虑境内部署、备案和 CDN。

## Blockers

- 无。

## Important Files

- `src/components/chat-dialog/index.vue`
- `src/components/chat-dialog/letter/content.vue`
- `src/components/chat-dialog/letter/detail.vue`
- `public/letter/lamb-watercolor.png`
- `scripts/prepare-album.cjs`
- `scripts/check-album-order.cjs`
- `scripts/capture-album-file-dates.cjs`
- `src/assets/album-file-dates.json`
- `package.json`
- `yarn.lock`
- `src/components/chat-dialog/AvatarSettings.vue`
- `src/components/chat-dialog/AlbumSpace.vue`
- `src/assets/album/README.md`
- `src/components/chat-dialog/image-utils.js`
- `public/avatars/author.jpg`
- `public/avatars/me.jpg`
- `src/components/chat-dialog/css/_mobile.scss`
- `src/components/chat-dialog/css/_mobile.msg.scss`
- `src/components/chat-dialog/css/_mobile.body.scss`
- `src/components/chat-dialog/css/_global.scss`
- `src/components/chat-dialog/viewport-utils.mjs`
- `scripts/check-mobile-viewport.cjs`
- `public/options/preview/chat.json`
- `refui/fuyue-chat-source-20261023/fuyue-chat-source-20261023/apps/web/src/ui/view-transitions.css`
- `refui/fuyue-chat-source-20261023/fuyue-chat-source-20261023/apps/web/src/ui/relationship-home.css`
