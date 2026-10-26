# Current State

Last updated: 2026-10-27
Current branch: `main`
Current phase: 前端功能与资源已完成，仓库已整理为可由 Cloudflare Pages 构建部署的状态

## Current Objective

将当前完整前端安全推送到 GitHub `main`，并使用 Cloudflare Pages 从 Git 仓库执行 `npm run build`、发布 `dist/`。

## Completed

- 分析并迁移 `refui` 的共享玻璃材质、聊天布局和 View Transition 动效语言。
- 聊天页已完成液态玻璃头部、消息气泡、背景、输入区与响应式改造。
- 顶部右侧按钮可打开“设置双方头像”玻璃面板；双方头像可独立上传、更换或恢复默认。
- 默认头像已固化为项目资源：蓝色图片对应 `author`，羊图片对应 `me`；新浏览器无需配置即可显示。
- 头像在浏览器端自动居中裁成 256×256 JPEG，并保存到 `localStorage`。
- 顶部中间胶囊只显示当前人名，点击可进入标题为“我们俩”的相册；标题下方灰色说明已移除。
- 相册预处理器会扫描 `src/assets/album/`，识别 JPEG、PNG、GIF、WebP、AVIF、HEIC/HEIF；HEIC/HEIF 在启动或构建前转为 JPEG。
- 相册优先读取 EXIF `DateTimeOriginal`，其次读取 `CreateDate`；均不存在时使用文件创建时间。所有照片按时间升序显示，并以修改时间、文件名稳定打破并列。
- 文件内容会通过魔数识别，扩展名与真实内容不一致的图片也能按实际格式处理。
- 当前相册共 135 张：67 张 HEIC 转换、48 张使用元数据时间、87 张使用文件创建时间回退。MOV/MP4 不进入图片相册。
- 相册列表使用构建期生成的 720px WebP 缩略图，首批只渲染 18 张；滚动接近底部时由 `IntersectionObserver` 每批追加 18 张，单图预览仍读取完整兼容图。
- 用户输入框不再显示矩形 `focus-visible` 轮廓；进入 `userInput` 且输入为空时，整个胶囊外围显示连续彩色细环和同色模糊外辉光，开始输入后自动收敛。
- 信件内容页已改为米白纸张：桌面与横屏保留 148:210 A5 比例，手机竖屏采用 iPhone 16 Pro 的 402:874 比例并接近铺满视口；顶部为透明水彩小羊草地插画，正文为楷体大留白排版，底部保留 `Dancing sunbeams` 花体落款。
- 信件原有标题与逐段 Typed.js 打字、图片段落、纸内滚动、完成返回和右上关闭交互保持不变；粉色徽章、副标题、横线纸和悬浮回顶按钮已移除。
- 聊天与相册使用约 420ms 的原生共享元素过渡；低动态或不支持 View Transition 时使用轻量回退。
- 头像与相册均为本地前端构建功能，未增加 AI、接口或后端服务。

## In Progress

- 无。

## Architecture and Key Decisions

- `ChatDialog` 保持消息状态机所有权，仅管理当前视图、头像状态和设置面板开关。
- `AvatarSettings.vue` 管理双方头像选择、裁切、保存和恢复默认。
- `scripts/prepare-album.cjs` 读取源图、提取时间、转换 HEIC，同时用 Sharp 为每张照片生成最长边 720px、质量 72 的 WebP 缩略图，并生成按时间排序的 `public/album-generated/manifest.json`。
- `AlbumSpace.vue` 读取生成清单，防御性再次按拍摄时间、修改时间和文件名排序；网格消费缩略图并分批挂载 DOM，预览消费完整兼容图。
- `letter/content.vue` 使用“桌面 A5、手机竖屏 402:874”的响应式纸张比例和内部 flex 滚动区；透明插画位于 `public/letter/lamb-watercolor.png`，不依赖外部网络。
- `image-utils.js` 统一图片读取、Canvas 压缩和 JSON 本地存储。
- 存储键：`chat-want-to-say:avatars:v1`；相册不再使用浏览器存储。
- 默认头像由 `DEFAULT_AVATARS` 提供；本地自定义值优先，空值或无存储时回退到项目默认图片。
- 相册目录支持 `.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.avif`、`.heic`、`.heif`，不递归读取子目录。
- `predev`、`prebuild`、`prepreview` 自动执行相册预处理；生成目录被 Git 忽略，并使用处理器版本、源文件名、大小和修改时间组成的指纹增量复用完整图与缩略图。
- Git 不再跟踪 `node_modules/`；`.gitignore` 同时排除 `node_modules/`、`dist/`、`public/album-generated/` 和仅供设计参考的 `refui/`。
- 桌面聊天窗宽 430px；`<=480px` 时铺满视口。玻璃材质继续使用低占比雾白、18px blur 和轻量高光。

## Validation Status

- `yarn album:prepare`：通过；生成 135 张照片，67 张 HEIC 转换，48 张元数据时间，87 张文件时间回退。
- 相册清单单调性检查：通过，全部 `takenAt` 从早到晚；生成目录清单 135 项、图片 135 个、缺失 0、空文件 0。
- `npm run build`：通过，Vite 2.9.18，438 modules transformed；构建产物相册清单 135 项、完整图与缩略图缺失 0；保留现有 Zepto 非 module 警告。
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

## Known Problems

- `index.html` 的传统 Zepto script 会触发 Vite “can't be bundled without type=module” 警告，但构建和运行正常。
- 自定义头像仍依赖当前浏览器 `localStorage` 容量；固定目录相册不受该容量限制。
- 尚未在真实 iOS/Android 设备验证文件选择器、软键盘、安全区和低端 GPU 模糊性能。
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
- `public/options/preview/chat.json`
- `refui/fuyue-chat-source-20261023/fuyue-chat-source-20261023/apps/web/src/ui/view-transitions.css`
- `refui/fuyue-chat-source-20261023/fuyue-chat-source-20261023/apps/web/src/ui/relationship-home.css`
