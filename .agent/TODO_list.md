# TODO List

## P0 — Blocking

无。

## P1 — Next

### [ ] 推送部署就绪版本到 GitHub main

Status: in_progress

Depends on: 最终构建通过、Git 暂存范围审查通过

Blocked by: 无

Scope: 清理已跟踪 `node_modules`，提交前端源码与静态资源，推送 `origin/main`，确认远端 HEAD 与本地一致。

Acceptance criteria:

- `node_modules/`、`dist/`、生成相册缓存和 `refui/` 不在新提交中。
- `npm run build` 通过。
- `origin/main` 指向本地最新提交，推送后工作区无未提交业务改动。

Validation: `git ls-files node_modules`、`npm run build`、`git rev-parse HEAD` 与 `git ls-remote origin refs/heads/main`。

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

Validation: 在目标设备完整走一遍答题、图片、信件打开与关闭流程。

## Completed

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

Scope: 图片格式检测、HEIC/HEIF 转换、EXIF 时间提取、文件创建时间回退、生成清单与前端排序。

Acceptance criteria:

- JPEG/JPG、PNG、GIF、WebP、AVIF 可直接进入相册。
- HEIC/HEIF 自动转换为浏览器可显示的 JPEG，扩展名与实际格式不一致时仍能处理。
- 优先按拍摄时间排序；无拍摄时间使用文件创建时间；越早越靠前。
- 生成清单引用的每个文件都存在且非空，前端无破图。

Validation:

```powershell
yarn album:prepare
npm run build
```

结果：135 张照片全部生成；67 张 HEIC 转换，48 张使用元数据时间，87 张使用文件创建时间；清单升序、源生成目录和 dist 完整性检查均通过；浏览器渲染 135 项并成功预览转换后的 HEIC。

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
- 相册自动读取 `src/assets/album/` 支持的图片，优先按拍摄时间、无元数据时按文件创建时间升序排列。
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
