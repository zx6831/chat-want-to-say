# Session Handoff

Created: 2026-10-27
Branch: `main`
Working tree: dirty；第三版 iPhone/WKWebView 键盘修复已提交推送，保留一项与本次任务无关的并行相册测试改动

## Session Goal

参考 `C:\Users\zx\Desktop\fuyue-chat-source-20261023` 的键盘唤起逻辑，修复真实 iPhone 微信中键盘打开后聊天 UI 被推出可视区、失焦过渡错位和缩放误判。

## Work Completed

- 对照参考工程 `apps/web/src/app.tsx` 与 `apps/web/tests/chat-viewport.test.mjs`，迁移展开高度基线和跨焦点的键盘会话状态。
- `viewport-utils.mjs` 现在会夹紧 `offsetTop` 到 `layoutHeight-visibleHeight`，排除 pinch zoom，并保留原有的异常高度回退。
- `index.vue` 改为监听 `focusin/focusout`，在每次同步前固定根页面滚动，并持续保存键盘会话、展开高度与视口宽度。
- 移动端 `html/body/#app` 固定且禁止外层滚动；viewport meta 加入 `viewport-fit=cover` 和 `interactive-widget=resizes-content`。
- 触屏输入框字号从 15px 提升到 16px，避免 iOS 聚焦自动缩放。
- 扩展 `scripts/check-mobile-viewport.cjs`，覆盖异常超大偏移、失焦过渡和 pinch zoom。

## Current Stopping Point

代码、回归测试、实际 Vue 组件指标注入和生产构建全部通过，改动已提交推送到 `main`；等待真实 iPhone 微信复验。

## Uncommitted Changes

- `package.json`
- `scripts/prepare-album.cjs`
- `scripts/check-album-order.cjs`
- `scripts/capture-album-file-dates.cjs`（未跟踪）
- `src/assets/album/README.md`

以上文件是本次排查期间并行出现的相册源文件时间持久化改动，未纳入键盘提交；`npm run test:album-order` 与生产构建当前通过。

## Validation Results

- 修复前 `npm run test:viewport`：失败，异常 `offsetTop=900` 实际输出 900，预期夹紧到 368。
- 修复后 `npm run test:viewport`：通过。
- `npm run test:album-order`：通过。
- `npm run build`：通过，Vite 2.9.18，439 modules transformed；仅有既存 Zepto 非 module 警告。
- `git diff --check`：通过，仅有 Windows 换行转换提示。
- `agent-browser` 实际组件注入：异常平移 `(368,506)`；失焦未收完 `(90,506)` 且键盘状态保持；恢复 `(0,874)`；scale=2 `(0,874)` 且不视为键盘；四阶段 `scrollY=0`。

## Failing Tests or Known Errors

- 无失败测试。
- `index.html` 仍提示 `js/zepto.min.js` 缺少 `type="module"`，不影响构建和运行。
- 桌面浏览器无法等价复现微信 WKWebView 的物理键盘动画，最终结论仍需真机复验。

## Recommended Next Steps

1. 等待 Cloudflare Pages 完成部署，关闭旧微信页面或使用带版本参数的 URL 重新打开。
2. 在真实 iPhone 微信按“首次唤起 → 输入 → 失焦/收起 → 再次唤起”录屏复验；若仍异常，采集根节点四个 `data-viewport-*` 值而不再盲调。
3. 单独审查并决定是否提交上述相册源文件时间持久化改动。

## Important Decisions

- 不再使用 `pageTop-scrollY` 作为顶部补偿；参考工程只使用经过布局边界夹紧的 `offsetTop`。
- 键盘状态是一次会话，不等于“输入框当前有焦点”；失焦后要等可视高度恢复才结束。
- scale 不为 1 表示页面缩放，不允许触发键盘布局。
- 根页面不滚动，只有消息列表拥有滚动权。

## Risks and Open Questions

- iOS 微信版本、Dynamic Island 状态和浏览器工具栏高度组合仍可能产生设备特有行为。
- 若部署后仍只剩背景，需要通过临时真机调试浮层采集实时 `innerHeight/visualViewport` 数据。

## Start Here

```powershell
git status --short --branch
npm run test:viewport
npm run build
git log -3 --oneline --decorate
```
