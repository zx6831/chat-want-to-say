# Session Handoff

Created: 2026-10-27
Branch: `main`
Working tree: clean；本地 `main` 包含相册时间持久化提交与本状态提交，尚未推送

## Session Goal

修复生产相册把 Git/Cloudflare 检出时间误当成照片修改时间的问题，确保无 EXIF 照片在部署后仍按本机原始修改时间排序。

## Work Completed

- 生产无缓存请求确认 `659d5e21bedca5306220a40952cea072.JPG` 的 manifest 被写成部署时间 `2026-10-27T07:41:54.522Z`；本机源文件修改时间为 `2026-03-08T13:07:15.000Z`。
- 排除 EXIF、前端格式化和缓存因素，确认根因是 Git/Cloudflare 检出不保留源文件 mtime/birthtime。
- 新增 `scripts/capture-album-file-dates.cjs` 和 `npm run album:capture-dates`，将 135 张照片的原始修改/创建时间写入受跟踪的 `src/assets/album-file-dates.json`。
- `prepare-album.cjs` 构建时只使用受跟踪时间；索引缺项或文件大小不一致会直接失败，不再静默使用部署时间。
- `check-album-order.cjs` 覆盖模拟云端检出时间，并锁定用户报告照片必须使用三月修改时间。
- 代码已提交为 `92a8000 fix: preserve album dates across deployments`。

## Current Stopping Point

相册代码、时间索引、回归测试、生产构建和本地生产页面均已验证并本地提交；尚未推送，因此线上页面仍显示旧的 10 月 27 日时间。

## Uncommitted Changes

- 无。

## Validation Results

- 修复前生产无缓存 manifest：目标照片 `takenAt/modifiedAt=2026-10-27T07:41:54.522Z`，稳定复现错误。
- 修复前云端检出回归：失败，部署时间覆盖受跟踪的三月时间。
- `npm run album:capture-dates`：通过；捕获 135 张照片时间。
- `npm run test:album-order`：通过；包含目标照片与模拟云端检出回归。
- `npm run album:prepare`：通过；48 张拍摄时间、87 张修改时间、0 张创建时间。
- `npm run build`：通过，Vite 2.9.18，439 modules transformed；仅有既存 Zepto 非 module 警告。
- 开发与 `dist` manifest：目标照片为第 82 张，`takenAt=2026-03-08T13:07:15.000Z`。
- 本地生产预览：卡片显示“2026年3月8日”，预览显示“2026年3月8日 21:07”，运行时错误为 0。
- `git diff --check`：通过，仅有 Windows 换行转换提示。

## Failing Tests or Known Errors

- 无失败测试。
- `index.html` 仍提示 `js/zepto.min.js` 缺少 `type="module"`，不影响构建和运行。
- 生产站点仍运行旧构建；在推送并完成 Cloudflare Pages 部署前，线上日期不会变化。
- `index.html` 仍提示 `js/zepto.min.js` 缺少 `type="module"`，不影响构建和运行。

## Recommended Next Steps

1. 将本地相册提交和状态提交推送到 `origin/main`，等待 Cloudflare Pages 完成新部署。
2. 对生产 manifest 使用唯一查询参数读取目标照片，确认 `takenAt/modifiedAt=2026-03-08T13:07:15.000Z`。
3. 在生产相册确认目标照片位于第 82 张附近，卡片与预览显示三月时间。
4. 继续在真实 iPhone 微信复验第三版键盘视口修复。

## Important Decisions

- Git 不保存图片原始 mtime/birthtime，云端文件系统时间不得参与相册业务排序。
- `album-file-dates.json` 是照片时间事实的一部分，必须与新增/替换的照片一起提交。
- `takenAt` 仍遵循“拍摄时间 → 受跟踪修改时间 → 受跟踪创建时间”。
- 构建宁可因索引缺失或大小不一致而失败，也不能静默生成错误日期。

## Risks and Open Questions

- 如果在另一台机器新增照片，必须保证复制过程仍保留所需的原始文件时间，再运行 `npm run album:capture-dates`。
- 当前索引通过文件大小发现大多数未同步替换；同名且同大小的内容替换仍需要维护者主动重新捕获时间。
- 第三版 iOS 键盘逻辑仍需真实 iPhone 微信复验，与相册修复独立。

## Start Here

```powershell
git status --short --branch
npm run test:album-order
npm run build
git log -3 --oneline --decorate
```
