// ==UserScript==
// @name         Gemini Web TOC 
// @namespace    http://tampermonkey.net/
// @author       Gemini CLI & User
// @match        *://gemini.google.com/*
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // 屏蔽后台隐藏的账号登录框架
    if (window.top !== window.self) return;

    let panelOpen = false;

    // 核心武器：完全不使用 innerHTML 的 DOM 创建辅助函数
    function createEl(tag, styles, text) {
        const el = document.createElement(tag);
        if (styles) el.style.cssText = styles;
        if (text) el.textContent = text;
        return el;
    }

    // 提取目录逻辑
    function buildTOC() {
        const list = document.getElementById('gemini-toc-list');
        if (!list) return;
        
        // 安全清空列表
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }

        let queryElements = document.querySelectorAll('user-query, [data-message-author-role="user"], .user-query-text, .query-text');
        let count = 1;
        let lastProcessedText = ""; // 🌟 用于记录上一句话，防止重复提取
        
        queryElements.forEach((el, index) => {
            let text = el.innerText || el.textContent;
            text = text.trim();

            // 🌟 关键修复：用正则干掉开头的“你说 ”或“You said ”
            text = text.replace(/^(你说\s*|You said\s*)/i, '').trim();

            // 过滤空文本，并且与上一条记录进行比对，如果一模一样就跳过（解决重复数字问题）
            if (text && text.length > 0 && text !== lastProcessedText) {
                lastProcessedText = text; // 更新最后一次处理的文本

                const anchorId = 'gemini-toc-anchor-' + index;
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
                    el.style.backgroundColor = '#3c4043';
                    setTimeout(() => { el.style.backgroundColor = originalBg; }, 1000);
                };

                list.appendChild(li);
                count++;
            }
        });

        // 没找到对话时的提示
        if (count === 1) {
            const emptyMsg = createEl('div', 'padding: 20px; color: #9aa0a6;', '(未提取到对话，请尝试滚动网页或刷新)');
            list.appendChild(emptyMsg);
        }
    }

    // 暴力巡查并安全注入 UI
    function ensureUI() {
        if (!document.body) return;

        let btn = document.getElementById('gemini-toc-btn');
        if (!btn) {
            btn = createEl('div', 'position:fixed; right:20px; bottom:80px; width:50px; height:50px; border-radius:25px; background-color:#1a73e8; color:white; text-align:center; line-height:50px; cursor:pointer; z-index:2147483647; box-shadow:0 4px 6px rgba(0,0,0,0.3); font-size:24px; user-select:none; display:block;', '📑');
            btn.id = 'gemini-toc-btn';
            
            btn.onclick = () => {
                const panel = document.getElementById('gemini-toc-panel');
                if (panel) {
                    panelOpen = !panelOpen;
                    panel.style.right = panelOpen ? '0px' : '-350px';
                    if (panelOpen) buildTOC();
                }
            };
            document.body.appendChild(btn);
        }

        let panel = document.getElementById('gemini-toc-panel');
        if (!panel) {
            panel = createEl('div', `position:fixed; right:${panelOpen ? '0px' : '-350px'}; top:0; width:300px; height:100vh; background-color:#1e1e1e; color:#e8eaed; z-index:2147483646; box-shadow:-4px 0 10px rgba(0,0,0,0.3); transition:right 0.3s ease-in-out; display:flex; flex-direction:column; font-family:sans-serif;`);
            panel.id = 'gemini-toc-panel';
            
            const header = createEl('div', 'padding: 20px; font-size: 18px; font-weight: bold; border-bottom: 1px solid #3c4043; display: flex; justify-content: space-between; align-items: center;');
            
            const title = createEl('span', '', '对话目录 (TOC)');
            const closeBtn = createEl('span', 'cursor: pointer; color: #9aa0a6;', '✖');
            closeBtn.id = 'gemini-toc-close';
            
            header.appendChild(title);
            header.appendChild(closeBtn);
            panel.appendChild(header);

            const list = createEl('ul', 'flex-grow: 1; overflow-y: auto; padding: 10px 0; list-style: none; margin: 0;');
            list.id = 'gemini-toc-list';
            panel.appendChild(list);
            
            document.body.appendChild(panel);
            
            document.getElementById('gemini-toc-close').onclick = () => {
                panelOpen = false;
                document.getElementById('gemini-toc-panel').style.right = '-350px';
            };
        }
    }

    setInterval(ensureUI, 1000);

})();