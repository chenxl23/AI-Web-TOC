// ==UserScript==
// @name         AI Platforms Web TOC (All-in-One)
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Generates a clickable Table of Contents (TOC) sidebar for Gemini, Claude, and ChatGPT conversations.
// @description:zh-CN 为 Gemini, Claude, ChatGPT 网页版对话生成统一的、可点击的交互式侧边大纲目录。
// @author       YourName
// @match        *://gemini.google.com/*
// @match        *://claude.ai/*
// @match        *://chatgpt.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 屏蔽后台隐藏的账号登录或验证框架
    if (window.top !== window.self) return;

    let panelOpen = false;

    // 1. 多平台动态适配器
    const config = {
        selectors: "",
        cleanPrefix: (text) => text
    };

    const host = window.location.hostname;

    if (host.includes('gemini.google.com')) {
        config.selectors = 'user-query, [data-message-author-role="user"], .user-query-text, .query-text';
        config.cleanPrefix = (text) => text.replace(/^(你说\s*|You said\s*)/i, '').trim();
    } 
    else if (host.includes('claude.ai')) {
        config.selectors = '[data-testid="user-message"], .font-user, div[class*="bg-user"]';
        config.cleanPrefix = (text) => {
            // 过滤 Claude 气泡中夹杂的文件上传、Artifacts 提示音等
            return text.replace(/^(Pasted Text|Uploaded File|查看组件|Artifacts).*/i, '').trim();
        };
    } 
    else if (host.includes('chatgpt.com')) {
        config.selectors = '[data-message-author-role="user"]';
        config.cleanPrefix = (text) => {
            // 将 ChatGPT 提问中的换行符平铺为空格，防止大纲折行
            return text.replace(/\n+/g, ' ').trim();
        };
    }

    // 2. 纯 DOM 节点创建辅助函数（100% 绕过 Trusted Types 安全策略）
    function createEl(tag, styles, text) {
        const el = document.createElement(tag);
        if (styles) el.style.cssText = styles;
        if (text) el.textContent = text;
        return el;
    }

    // 3. 提取目录逻辑
    function buildTOC() {
        const list = document.getElementById('ai-toc-list');
        if (!list) return;
        
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }

        if (!config.selectors) return;

        let queryElements = document.querySelectorAll(config.selectors);
        let count = 1;
        let lastProcessedText = "";
        
        queryElements.forEach((el, index) => {
            let text = el.innerText || el.textContent;
            if (!text) return;

            text = config.cleanPrefix(text);

            if (text && text.length > 0 && text !== lastProcessedText) {
                lastProcessedText = text;

                const anchorId = 'ai-toc-anchor-' + index;
                if (!el.id) el.id = anchorId;

                const li = createEl('li', 'padding: 12px 20px; border-bottom: 1px solid #3c4043; cursor: pointer; font-size: 14px; line-height: 1.4; transition: background-color 0.2s; display: flex;');
                const numSpan = createEl('span', 'color: #8ab4f8; font-weight: bold; margin-right: 8px; flex-shrink: 0;', count + '.');
                
                const titleText = text.length > 40 ? text.substring(0, 40) + '...' : text;
                const textSpan = createEl('span', '', titleText);

                li.appendChild(numSpan);
                li.appendChild(textSpan);

                li.onmouseover = () => { li.style.backgroundColor = '#303134'; };
                li.onmouseout = () => { li.style.backgroundColor = 'transparent'; };

                li.onclick = () => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const originalBg = el.style.backgroundColor;
                    // 提供短暂的半透明蓝色高亮反馈
                    el.style.backgroundColor = 'rgba(138, 180, 248, 0.15)';
                    setTimeout(() => { el.style.backgroundColor = originalBg; }, 1000);
                };

                list.appendChild(li);
                count++;
            }
        });

        if (count === 1) {
            list.appendChild(createEl('div', 'padding: 20px; color: #9aa0a6;', '(未提取到当前对话，请尝试滚动网页)'));
        }
    }

    // 4. UI 暴力巡查注入（秒级心跳，完美对抗单页面应用 DOM 刷新）
    function ensureUI() {
        if (!document.body) return;

        // 创建悬浮按钮
        let btn = document.getElementById('ai-toc-btn');
        if (!btn) {
            btn = createEl('div', 'position:fixed; right:20px; bottom:80px; width:50px; height:50px; border-radius:25px; background-color:#1a73e8; color:white; text-align:center; line-height:50px; cursor:pointer; z-index:2147483647; box-shadow:0 4px 6px rgba(0,0,0,0.3); font-size:24px; user-select:none; display:block;', '📑');
            btn.id = 'ai-toc-btn';
            
            btn.onclick = () => {
                const panel = document.getElementById('ai-toc-panel');
                if (panel) {
                    panelOpen = !panelOpen;
                    panel.style.right = panelOpen ? '0px' : '-350px';
                    if (panelOpen) buildTOC();
                }
            };
            document.body.appendChild(btn);
        }

        // 创建侧边面板
        let panel = document.getElementById('ai-toc-panel');
        if (!panel) {
            panel = createEl('div', `position:fixed; right:${panelOpen ? '0px' : '-350px'}; top:0; width:300px; height:100vh; background-color:#1e1e1e; color:#e8eaed; z-index:2147483646; box-shadow:-4px 0 10px rgba(0,0,0,0.3); transition:right 0.3s ease-in-out; display:flex; flex-direction:column; font-family:sans-serif;`);
            panel.id = 'ai-toc-panel';
            
            const header = createEl('div', 'padding: 20px; font-size: 18px; font-weight: bold; border-bottom: 1px solid #3c4043; display: flex; justify-content: space-between; align-items: center;');
            header.appendChild(createEl('span', '', '对话目录 (TOC)'));
            
            const closeBtn = createEl('span', 'cursor: pointer; color: #9aa0a6;', '✖');
            closeBtn.id = 'ai-toc-close';
            header.appendChild(closeBtn);
            panel.appendChild(header);

            const list = createEl('ul', 'flex-grow: 1; overflow-y: auto; padding: 10px 0; list-style: none; margin: 0;');
            list.id = 'ai-toc-list';
            panel.appendChild(list);
            
            document.body.appendChild(panel);
            
            document.getElementById('ai-toc-close').onclick = () => {
                panelOpen = false;
                document.getElementById('ai-toc-panel').style.right = '-350px';
            };
        }
    }

    setInterval(ensureUI, 1000);

})();
