# Omni AI Web TOC (All-in-One)

A lightweight, secure Tampermonkey user script that injects a clean, dynamic navigation sidebar into **Google Gemini**, **Anthropic Claude**, and **OpenAI ChatGPT**. It automatically extracts your prompts and allows smooth jumping between long chat threads.

[简体中文](#简体中文)

## Features

- **Multi-Platform Adapter:** Seamlessly supports Gemini, Claude, and ChatGPT with zero configuration—automatically loading corresponding query selectors based on the domain.
- **Pure Prompt Extraction:** Intelligently ignores massive AI text walls and lists only your user questions in a clean timeline outline.
- **Anti-CSP & Trusted Types Compliant:** Google and OpenAI implement strict Content Security Policies. This script completely abandons `innerHTML` and uses pure, safe raw DOM manipulation methods (`createElement`, `textContent`) to bypass any blocking or quiet crashes.
- **SPA Heartbeat Guard:** Modern AI platforms rely heavily on Single Page Application (SPA) re-rendering. A background heartbeat check loop auto-injects and heals the floating button within a second if wiped out by framework router transitions.
- **Data De-duplication & Text Cleaning:** Strips hidden accessibility metadata prefixes (like `"You said "` or `"你说 "`) and flattens code blocks or multiline text to keep the sidebar compact.

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension for your web browser.
2. Click the extension icon and select **Create a new script**.
3. Copy the entire content of `ai-toc-omni.user.js` and paste it into the script editor.
4. Press `Ctrl + S` (`Cmd + S` on macOS) to save.
5. Open or refresh Gemini, Claude, or ChatGPT. A floating document icon `📑` will appear at the bottom-right corner.

---

## 简体中文

# 全平台 AI 对话目录扩展 (Omni AI Web TOC)

一款轻量级、超安全的 Tampermonkey（篡改猴）用户脚本。支持一键在 **Google Gemini**、**Anthropic Claude** 和 **OpenAI ChatGPT** 网页端注入动态侧边导航栏。它会自动解析庞大的对话流，精准提取用户的 Prompt 提问大纲并支持平滑滚动跳转。

## 功能特性

- **三合一动态适配：** 无需任何繁琐配置，单个脚本完美包揽三大主流 AI 平台。根据当前域名自动切换最契合的底层 DOM 选择器。
- **Prompt 精准大纲：** 智能过滤 AI 动辄上千字的繁杂回复，只提取用户本身发送的原始提问，生成极为干净的对话目录。
- **天然免免疫 CSP 拦截：** 针对各大平台极为严苛的**内容安全策略（CSP）**与 **Trusted Types（可信类型）**审计，脚本底层彻底舍弃 `innerHTML` 污染，全流程改用纯净 DOM 节点挂载，不引发任何静默报错。
- **SPA 级别强效防刷：** 针对现代大模型网页高频局部刷新的 SPA（单页面应用）特性，采用秒级心跳检测，即便 UI 按钮被网页路由彻底抹除，也能自适应秒级无感补回。
- **深度净化与去重：** 自动抹除 Gemini 底层为屏幕阅读器准备的隐藏 `"你说 "` 或 `"You said "` 前缀；同时对 ChatGPT 复杂的多行文本及代码块进行平滑压平处理，防止目录崩塌。

## 安装指南

1. 确保您的浏览器已下载 [Tampermonkey (篡改猴)](https://www.tampermonkey.net/) 插件。
2. 点击扩展程序图标，选择 **“添加新脚本”**。
3. 清空编辑器，将本仓库中 `ai-toc-omni.user.js` 的全部内容粘贴进去并保存 (`Ctrl + S`)。
4. 刷新大模型网页，右下角即会常驻一个蓝色的 `📑` 悬浮图标，点击即可开启高效导航。

## 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。
