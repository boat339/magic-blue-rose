# 维护与整理记录

## 来源

原文件：`6a1700ba518e5b62056b816b_magic-snowflake.html`

原文件 SHA-256：`e9f6672b57c73ca8218eb84aa8c687a44114a2494620be8d322784fc5febf90d`

整理范围：提取唯一 style 和 script 为独立文件，入口统一为 index.html，设置准确项目标题，并允许浏览器页面缩放。原交互逻辑保持不变。

## 开发

- 页面与内嵌 SVG：index.html。
- 样式与关键帧：assets/css/styles.css。
- 交互逻辑：assets/js/app.js。
- 检查：`node scripts/check.mjs`，需 Node.js 22。
- 本地运行：`python -m http.server 8000`，需 Python 3。

## 验证

结构、资源、ID 与脚本语法检查见 scripts/check.mjs；原始脚本和样式提取后文本逐字一致（去除首尾空白），格式化仅调整排版。真实浏览器中的视觉、触摸、声音及摄像头行为尚未完成实机验收。

- 临时 DOM 检查通过：单指旋转、双指缩放、触摸结束、两个 CDN 均失败时回退触摸模式。摄像头和模型推理未实测。
