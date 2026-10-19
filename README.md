# Magic Blue Rose · 魔法蓝玫瑰

一个基于 Canvas 2D 的魔法蓝玫瑰视觉互动演示，带星空、粒子、平滑缩放和旋转。支持触摸控制，以及基于 MediaPipe Hands 的摄像头手势控制。原上传文件名含 snowflake，实际绘制内容为蓝玫瑰。

## 快速开始

下载本项目并解压，在项目根目录执行：

```bash
python -m http.server 8000
```

打开 <http://localhost:8000>。运行需要 Python 3，或使用任意静态服务器；无需 npm 安装或构建。

## 使用

- 触屏：单指拖动旋转，双指缩放。基础触摸逻辑在页面加载时初始化。
- 手势：点击“开启魔法玫瑰”，等待模型加载并允许摄像头；张合手掌控制大小，左右移动控制旋转。
- 电脑无触屏时主要使用摄像头手势；原版未实现鼠标拖拽。

## 环境与依赖

摄像头需要 HTTPS 或 localhost 安全环境、浏览器权限和可用摄像头。远程 HTTP 地址或内嵌页面可能不允许摄像头。

MediaPipe Hands 从 jsDelivr 加载，JS 有 unpkg 备用源；模型/WASM 仍从 jsDelivr 获取。代码继承原文件的未固定版本 CDN 地址，加载依赖联网，当前未锁定版本。离线只能使用本地绘制与触摸功能。

代码使用摄像头画面进行浏览器端手势推理，没有自建视频上传接口；CDN 模型资源会产生网络请求。摄像头不请求麦克风。离开页面通常会结束会话，实机使用后也可通过浏览器权限控件关闭摄像头。

## 已知限制

原版摄像头启动、重试和异步模型加载逻辑仍需实机验证，包括拒绝授权、超时、重复点击及慢网络情形。本次整理保留其逻辑，不代表已确认这些路径稳定。

## 目录

| 路径 | 用途 |
| --- | --- |
| index.html | 唯一网页入口与页面结构 |
| assets/css/styles.css | 页面样式和动画 |
| assets/js/app.js | 交互脚本 |
| scripts/check.mjs | 结构和语法检查 |
| .github/workflows/check.yml | 推送与 PR 自动检查 |
| docs/MAINTENANCE.md | 来源、维护方法及验证范围 |
| CHANGELOG.md | 变更记录 |

## 维护与部署

安装 Node.js 22 后执行 `node scripts/check.mjs`。修改方法见 [维护记录](docs/MAINTENANCE.md)。浏览器视觉和硬件相关行为需另行实机验收。

整个目录可部署为静态站点；启用 GitHub Pages 时选择 main 分支根目录。建议单独创建 GitHub 仓库 `magic-blue-rose`，解压后上传项目目录内的文件，使 index.html 和 README.md 位于仓库根目录。

## 许可

原文件未附许可证，本次未擅自指定开源许可证。
