# TODO List

## P0 — Blocking

无。

## P1 — Next

### [ ] 在真实 iPhone 微信复验第二版键盘防护

Status: blocked

Depends on: Cloudflare Pages 部署包含异常 VisualViewport 防护的最新 main

Blocked by: 需要用户在真实 iPhone 微信内置浏览器触发软键盘

Scope: 首次唤起、收起、再次唤起、连续输入、页面工具栏展开/收起和 Dynamic Island 状态变化。

Acceptance criteria:

- 键盘打开后头部、消息和输入栏均保持可见，页面不再只剩背景。
- 输入栏贴近键盘上沿且左右不跳动。
- 收起后聊天根层恢复完整高度和 top=0。

Validation: 真机截图或录屏；必要时读取根节点 `data-viewport-source`、`data-viewport-height`、`data-viewport-top`。

## P2 — Later

### [ ] 在真实移动设备验证软键盘和玻璃性能

Status: deferred

Depends on: 可用的 iOS 或 Android 真机

Blocked by: 当前环境只有桌面 Chrome 的移动视口模拟

Scope: 390px 左右视口、软键盘弹出/收起、安全区、长消息滚动、backdrop-filter 帧率

Acceptance criteria:

- 键盘弹出后输入框与发送键保持可见。
- 头部、消息区和底部不发生横向溢出或不可恢复的滚动跳动。
- 连续消息滚动时无明显 GPU 卡顿；若设备性能不足，提供降低模糊的回退。
- iPhone 微信键盘动画期间输入栏与键盘之间无额外大段留白，收起后无残留顶部偏移。

Validation: 在目标设备完整走一遍答题、图片、信件打开与关闭流程。

## Completed

### [x] 修正相册排序的时间回退优先级

Status: completed

Scope: 相册时间选择、manifest 字段、生成端/展示端排序和自动回归测试。

Acceptance criteria:

- 有拍摄时间时使用 `DateTimeOriginal`/`CreateDate`。
- 无拍摄时间时使用文件修改时间；修改时间无效时才使用创建时间。
- 生成清单与前端页面使用相同优先级，时间升序不变。
- 自动测试覆盖三种来源，并能检出旧清单跳过修改时间的问题。

Validation: `npm run test:album-order`、`npm run album:prepare`、`npm run build` 和 `git diff --check` 均通过；135 张中 48 张使用拍摄时间、87 张使用修改时间、0 张使用创建时间；本地页面首批 18 个 DOM 项与 manifest 一致、运行时错误为 0。

### [x] 固定手机信纸每行字数并改为左对齐

Status: completed

Scope: 手机竖屏信纸正文分行、Typed.js 停顿标记计数和 CSS 文本对齐。

Acceptance criteria:

- 手机竖屏正文每行占 20 个字符单元；首行两格缩进后显示 18 字。
- `^280` 等 Typed.js 停顿标记不计入字数。
- 正文靠左对齐，不再使用两端对齐或智能平衡换行。
- 后续字符出现时，已经完成的上一行不改变字距、坐标或断行。
- 桌面信纸排版和逐段 Typed.js 流程保持不变，生产构建通过。

Validation: `npm run build` 通过，439 modules transformed；`agent-browser` 在 402×874 下对比第 20/45 字，第一行字符坐标与宽度变化均为 0；实际长段落分行为 18/20/20/20/20/17。

### [x] 防止异常 VisualViewport 数据压垮聊天根层

Status: completed

Scope: 视口指标校验、可信高度回退、pageTop 补偿、标准回归脚本和实际组件异常注入。

Acceptance criteria:

- `visualViewport.height=0` 时根层不会变成 1px。
- `offsetTop` 延迟时可从 `pageTop - scrollY` 恢复有效顶部偏移。
- 键盘失焦后残留 offset 不会继续移动根层。
- 正常键盘高度路径和历史消息位置不回归。

Validation: `npm run test:viewport` 通过；组件注入零高度后根层为 506px 且头尾可见；正常 874→520→874 和历史 `scrollTop=140` 回归通过；`npm run build` 通过。

### [x] 将相册改为六图左右交错并修复雾光覆盖

Status: completed

Scope: 六图分组、奇偶组左右镜像、尾组收缩、全局光效与照片图层。

Acceptance criteria:

- 每 6 张一组，奇数组左侧 2 张大图、右侧 4 张小图，偶数组左右反转。
- 原有每批 18 张分批挂载和原图预览不受影响。
- 最后不足 6 张时不保留无意义的完整组空白。
- 全局底部白雾位于图片下方，照片无额外透明、滤镜或混合模式。
- 390×844 无横向溢出，135 张全部加载时无破图，生产构建通过。

Validation: `npm run build` 和 `git diff --check` 通过；`agent-browser` 实测首组左大右小、第二组左右镜像，135 张/23 组/破图 0，尾组 3 张高 203px、底部间距 28px，图片层计算样式正常。

### [x] 消除聊天分区背景接缝并加入第一版移动端视口同步

Status: completed

Scope: 根背景、跨分区装饰、visualViewport 定位、根页面滚动纠偏、统一输入栏边距和消息区 ResizeObserver。

Acceptance criteria:

- 顶部、消息主体和底部输入区不再出现明显颜色分界线。
- 键盘开合时聊天区域与可视视口对齐，输入栏横向不跳动且不产生大片留白。
- 最新消息随可用高度变化保持可见，阅读历史时不被强制滚到底部。
- 生产构建通过并推送到 `main`。

Validation: 402×874 截图顶部/底部边缘色差分别由 13.93/10.36 降至 2.47/2.55；模拟 874→520→874 键盘高度时根区域、输入栏和滚动状态均通过；历史 `scrollTop=140` 保持；`npm run build` 通过。真实 iPhone 后续暴露 VisualViewport 零高度问题，已由第二版防护覆盖并另行等待真机复验。

### [x] 推送部署就绪版本到 GitHub main

Status: completed

Scope: 清理已跟踪依赖和未使用视频，提交完整前端与相册性能优化，并推送 `origin/main`。

Acceptance criteria:

- `node_modules/`、`dist/`、生成相册缓存和 `refui/` 不在新提交中。
- `npm run build` 通过。
- `origin/main` 指向本地最新提交，推送后工作区无未提交业务改动。

Validation: `git ls-files node_modules` 为 0；`npm run build` 通过；`git rev-parse HEAD` 与 `git ls-remote origin refs/heads/main` 核对一致，工作区 clean。

### [x] 优化相册首次进入与滚动性能

Status: completed

Scope: 构建期缩略图、首批 DOM 限制、滚动分批挂载、原图预览与低动态适配。

Acceptance criteria:

- 相册列表不再使用完整分辨率图片作为网格源。
- 首次进入不一次性挂载全部 135 个照片卡片，滚动接近底部时继续追加。
- 单图预览继续使用完整兼容图，排序和图片格式适配保持不变。
- 生产构建及生成文件完整性检查通过。

Validation: `npm run build` 通过；135 个完整图与 135 个缩略图均存在；浏览器实测首批 18 个卡片，滚动后为 36，列表图最大 720px，预览图为非缩略图的 1080×1440 JPEG。

### [x] 将信件内容页改为水彩小羊信纸

Status: completed

Scope: 信纸结构、纸张材质、透明水彩插画、标题与正文排版、落款、关闭交互和响应式比例。

Acceptance criteria:

- 顶部显示透明水彩小羊草地插画，正文为米白大留白信纸，底部显示 `Dancing sunbeams` 花体落款。
- 保留标题和正文逐字显示、图片段落、内部滚动、完成返回和右上关闭。
- iPhone 16 Pro 竖屏按 402:874 比例接近铺满屏幕；桌面和横屏保持 A5 比例。
- 页面无横向溢出，插画透明背景正确，生产构建通过。

Validation: `npm run build` 通过；`agent-browser` 在 402×874 下测得信纸 382×830.52、左右 10px、上下约 21.7px，比例 0.459955；1280×900 和 844×390 下保持 A5 比例；关闭按钮可返回聊天页。

### [x] 适配相册图片格式并按拍摄时间升序显示

Status: completed

Scope: 图片格式检测、HEIC/HEIF 转换、EXIF 时间提取、文件时间回退、生成清单与前端排序。

Acceptance criteria:

- JPEG/JPG、PNG、GIF、WebP、AVIF 可直接进入相册。
- HEIC/HEIF 自动转换为浏览器可显示的 JPEG，扩展名与实际格式不一致时仍能处理。
- 优先按拍摄时间排序；无拍摄时间使用文件修改时间，修改时间无效时使用文件创建时间；越早越靠前。
- 生成清单引用的每个文件都存在且非空，前端无破图。

Validation:

```powershell
yarn album:prepare
npm run build
```

结果：135 张照片全部生成；67 张 HEIC 转换；原任务完成时 48 张使用元数据时间、87 张使用文件创建时间，后续已由“修正相册排序的时间回退优先级”任务调整为修改时间优先；清单升序、源生成目录和 dist 完整性检查均通过；浏览器渲染 135 项并成功预览转换后的 HEIC。

### [x] 将聊天前端改造成 refui 液态玻璃风格

Status: completed

Scope: 聊天页结构、主题变量、全局背景、消息气泡、输入区、响应式与可访问性基础样式。

Acceptance criteria:

- 仅修改前端，不增加 AI/后端功能。
- 保留逐字消息、答题、图片和信件交互。
- 桌面和 390×844 移动视口无溢出，玻璃背景可透视。
- 生产构建与 diff 检查通过。

Validation:

```powershell
npm run build
git diff --check
```

结果：均通过；Vite 保留 Zepto 非 module 警告。

### [x] 增加双方头像设置

Status: completed

Scope: 双方独立头像上传、居中裁切、本地保存、更换和恢复默认。

Acceptance criteria:

- 对方与我的头像可分别设置，消息列表即时使用。
- 刷新页面后仍保留。
- 恢复一方默认头像不会清除另一方。
- 非图片、超大图片和存储失败均有明确反馈。

Validation: Chrome CDP 合成图片上传、JPEG 转换、本地存储、刷新恢复和单方重置均通过。

### [x] 增加顶部胶囊入口与固定目录相册空间

Status: completed

Scope: 胶囊入口、共享元素过渡、固定目录读取、相册拼贴和单图预览。

Acceptance criteria:

- 点击顶部胶囊进入相册，返回后聊天状态仍保留。
- 相册自动读取 `src/assets/album/` 支持的图片，优先按拍摄时间、无元数据时按文件修改时间、再按文件创建时间升序排列。
- 页面不提供上传或删除入口，不使用相册 `localStorage`。
- 390×844 无横向溢出，低动态模式禁用非必要动画。

Validation: `agent-browser` 检测到 135 个相册项，顺序与生成清单一致；页面文件输入数量为 0；生产构建通过。

### [x] 设置指定的双方默认头像

Status: completed

Scope: 将用户提供的蓝色图片设为对方默认头像，将羊图片设为我方默认头像，并更新恢复默认语义。

Acceptance criteria:

- 全新浏览器无需本地设置即可加载两张指定头像。
- 对方消息使用蓝色头像，我方消息使用羊头像。
- 用户自定义头像优先于默认头像。
- “恢复默认”返回指定图片而不是文字占位。

Validation: 全新 Chrome 配置清空 `localStorage` 后，两张默认头像完成加载；5 条对方消息均使用 `/avatars/author.jpg`。

### [x] 收敛相册入口与页头文案

Status: completed

Scope: 删除聊天页胶囊中的“进入我们的相册”引导与箭头；删除相册页 `OUR SPACE` 小字，将 H1 改为“我们俩”。

Acceptance criteria:

- 聊天页顶部胶囊只显示人名，点击进入相册的行为保持不变。
- 相册页标题为“我们俩”，不再渲染标题上方小字。
- 废弃的 `.title-note` 样式无残留，生产构建通过。

Validation: `npm run build` 通过；`agent-browser` 读取胶囊文本为“王泽贤”，相册 H1 为“我们俩”，`.album-hero small` 数量为 0。

### [x] 用待输入连续彩色光环替代矩形焦点框

Status: completed

Scope: 去除文本输入框的矩形 `focus-visible` 轮廓；在等待用户输入且内容为空时，为整个底部胶囊增加连续彩色细环和模糊外辉光。

Acceptance criteria:

- 自动聚焦和手动聚焦均不显示输入框矩形描边。
- 只有 `userInput` 且输入为空时显示连续彩色光环。
- 开始输入后动画立即停止，发送和消息状态机行为不变。
- 低动态偏好不播放闪烁动画，保留静态提示。

Validation: `npm run build` 通过；真实答题阶段计算样式显示六色连续渐变环 `composerRingFlow` 与 8px 模糊外辉光 `composerRingGlow` 正在运行，输入“雨”后提示类消失、动画为 `none`、光环不透明度为 `0`。

### [x] 移除相册标题下方灰色说明

Status: completed

Scope: 删除“我们俩”标题下方的照片数量/空状态灰色小字及对应样式。

Acceptance criteria:

- 相册顶部胶囊只显示“我们俩”。
- `.album-hero` 中不存在 `<p>` 或遗留的小字样式。

Validation: `agent-browser get count ".album-hero p"` 返回 `0`，相册无障碍快照只包含 H1“我们俩”。
