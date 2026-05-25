# Gemini Web TOC Userscript

[English](#english) | [中文](#中文)

---

<h2 id="english">English</h2>

A lightweight Tampermonkey userscript that adds an interactive, floating Table of Contents (TOC) to the [Google Gemini](https://gemini.google.com/) web interface. When your conversations get long, this handy side panel lets you quickly navigate, search, and jump to specific prompts you've made.

### Features

- **Floating UI**: A discreet bookmark icon (📑) stays in the bottom right corner of your screen.
- **Slide-out Panel**: Clicking the icon reveals a beautifully styled, dark-mode TOC panel listing all your prompts.
- **Smooth Scrolling**: Click any item in the list, and the page will smoothly scroll down (or up) right to that specific message.
- **Auto-Detection**: Works flawlessly with Gemini's Single Page Application (SPA) architecture. The TOC updates automatically as you chat or switch between history threads.
- **Safe & Secure**: Does not use `innerHTML` for rendering the list, ensuring it's completely safe from XSS.

### Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension for your browser (Chrome, Edge, Firefox, etc.).
2. Click on the Tampermonkey icon in your browser and select **"Create a new script..."**.
3. Clear any default code in the editor.
4. Copy the entire contents of [`gemini-web-toc.user.js`](./gemini-web-toc.user.js) from this repository.
5. Paste it into the Tampermonkey editor and press `Ctrl+S` (or `Cmd+S`) to save.

### Usage

1. Open [Google Gemini](https://gemini.google.com/).
2. You will see a blue 📑 button in the bottom right corner.
3. Chat as usual. When you want to find a previous prompt, click the button to open the TOC panel.
4. Click on any prompt in the list to jump straight to it.

---

<h2 id="中文">中文</h2>

这是一个轻量级的 Tampermonkey（油猴）用户脚本，专为 [Google Gemini 网页版](https://gemini.google.com/) 打造。它会在页面右下角添加一个悬浮的交互式对话目录 (TOC)。当你的聊天记录变得非常长时，通过这个侧边栏，你可以快速浏览并跳转到你之前提问的任何位置。

### 功能特点

- **悬浮界面**：屏幕右下角常驻一个低调的书签图标 (📑)。
- **丝滑侧边栏**：点击图标，会滑出一个美观的深色模式目录面板，按顺序排列你所有的历史提问。
- **平滑跳转**：在目录中点击任意问题，网页就会像坐电梯一样，平滑滚动定位到那句话的位置，并高亮提示。
- **动态自适应**：完美兼容 Gemini 的单页应用 (SPA) 架构，无论你是继续聊天还是切换左侧的历史对话，目录都会自动更新。
- **安全可靠**：代码完全摒弃了 `innerHTML` 的暴力渲染，采用原生 DOM API 构建元素，彻底杜绝 XSS 风险，符合最严格的安全策略。

### 安装方法

1. 为你的浏览器（Chrome、Edge 等）安装 [Tampermonkey](https://www.tampermonkey.net/)（油猴）扩展插件。
2. 点击浏览器右上角的油猴图标，选择 **“添加新脚本...”**。
3. 清空编辑器里自带的默认代码。
4. 复制本仓库中 [`gemini-web-toc.user.js`](./gemini-web-toc.user.js) 文件的所有代码。
5. 粘贴到油猴编辑器中，按下 `Ctrl+S` 保存即可。

### 使用方法

1. 打开 [Google Gemini 网页版](https://gemini.google.com/)。
2. 页面右下角会出现一个蓝色的 📑 悬浮按钮。
3. 正常进行对话，当你想找之前的问题时，点击按钮展开面板。
4. 在目录列表中点击任意问题，即可瞬间跳转过去！

### 开源协议 (License)
MIT