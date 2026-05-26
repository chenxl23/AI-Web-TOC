// ==UserScript==
// @name         AI Platforms Web TOC (All-in-One)
// @namespace    http://tampermonkey.net/
// @version      1.4.0
// @description  Generates a clickable Table of Contents (TOC) sidebar for Gemini, Claude, and ChatGPT conversations.
// @description:zh-CN 为 Gemini, Claude, ChatGPT 网页版对话生成统一的、可点击的交互式侧边大纲目录。
// @author       YourName
// @match        *://gemini.google.com/*
// @match        *://claude.ai/*
// @match        *://chatgpt.com/*
// @run-at       document-start
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    if (window.top !== window.self) return;

    const host = window.location.hostname;

    // ─── ChatGPT：document-start 阶段劫持 fetch，缓存完整对话数据 ───
    let cachedMessages = [];   // [{id, text}, ...]
    let lastMappingData = null; // 保存原始 mapping，供后续重新解析

    if (host.includes('chatgpt.com')) {
        const win = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
        const _orig = win.fetch.bind(win);

        const hookedFetch = function(...args) {
            const url = typeof args[0] === 'string' ? args[0]
                      : (args[0] instanceof Request ? args[0].url : '');

            if (url.includes('/backend-api/conversation/') && !url.includes('gen_title')) {
                return _orig(...args).then(response => {
                    response.clone().json().then(data => {
                        if (data && data.mapping) {
                            lastMappingData = data;
                            cachedMessages = parseMapping(data);
                        }
                    }).catch(() => {});
                    return response;
                });
            }
            return _orig(...args);
        };

        try { win.fetch = hookedFetch; } catch(e) {}
        window.fetch = hookedFetch;
    }

    // 从 mapping 解析消息：从 current_node 沿 parent 链回溯，得到正确对话顺序
    function parseMapping(data) {
        const mapping = data.mapping;
        const currentNode = data.current_node;
        if (!mapping) return [];

        const result = [];

        if (currentNode && mapping[currentNode]) {
            // 从末尾沿 parent 回溯，收集所有节点 id
            const chain = [];
            let cur = currentNode;
            const visited = new Set();
            while (cur && mapping[cur] && !visited.has(cur)) {
                visited.add(cur);
                chain.unshift(cur); // 从头插入，保证正序
                cur = mapping[cur].parent;
            }

            // 遍历 chain，只取 user 消息
            for (const nodeId of chain) {
                const node = mapping[nodeId];
                const msg = node?.message;
                if (!msg || msg.author?.role !== 'user') continue;

                let text = '';
                const ct = msg.content?.content_type;
                if (ct === 'text') {
                    text = (msg.content.parts || [])
                        .filter(p => typeof p === 'string')
                        .join(' ');
                } else if (typeof msg.content === 'string') {
                    text = msg.content;
                }
                text = text.replace(/\n+/g, ' ').trim();
                if (text) result.push({ id: msg.id, text });
            }
        } else {
            // 没有 current_node 时降级：找根节点 DFS
            let rootId = null;
            for (const [id, node] of Object.entries(mapping)) {
                if (!node.parent || !mapping[node.parent]) { rootId = id; break; }
            }
            const visited = new Set();
            function dfs(nodeId) {
                if (!nodeId || visited.has(nodeId)) return;
                visited.add(nodeId);
                const node = mapping[nodeId];
                if (!node) return;
                const msg = node.message;
                if (msg?.author?.role === 'user') {
                    let text = (msg.content?.parts || []).filter(p => typeof p === 'string').join(' ')
                             || (typeof msg.content === 'string' ? msg.content : '');
                    text = text.replace(/\n+/g, ' ').trim();
                    if (text) result.push({ id: msg.id, text });
                }
                (node.children || []).forEach(c => dfs(c));
            }
            dfs(rootId);
        }

        return result;
    }

    // ─── 跳转到目标消息（用 MutationObserver 等待节点渲染）───
    function jumpToMessage(msgId, index, total) {
        const el = document.querySelector(`[data-message-id="${msgId}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            highlight(el);
            return;
        }

        // 目标节点尚未渲染，找真实滚动容器后滚到估算位置
        const scroller = [...document.querySelectorAll('*'), document.documentElement]
            .filter(e => {
                const s = getComputedStyle(e);
                return (s.overflowY === 'auto' || s.overflowY === 'scroll') &&
                       e.scrollHeight > e.clientHeight + 100;
            })
            .sort((a, b) => b.scrollHeight - a.scrollHeight)[0] || document.documentElement;
        const ratio = total > 1 ? index / (total - 1) : 0.5;
        scroller.scrollTop = scroller.scrollHeight * ratio;

        // 用 MutationObserver 监听节点出现，最多等 3 秒
        let found = false;
        const timeout = setTimeout(() => {
            observer.disconnect();
        }, 3000);

        const observer = new MutationObserver(() => {
            const target = document.querySelector(`[data-message-id="${msgId}"]`);
            if (target) {
                found = true;
                observer.disconnect();
                clearTimeout(timeout);
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                highlight(target);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function highlight(el) {
        const orig = el.style.backgroundColor;
        el.style.backgroundColor = 'rgba(138, 180, 248, 0.15)';
        setTimeout(() => { el.style.backgroundColor = orig; }, 1200);
    }

    // ─── DOM ready 后初始化 UI ───
    function init() {
        let panelOpen = false;

        const config = { selectors: '', cleanPrefix: t => t };

        if (host.includes('gemini.google.com')) {
            config.selectors = 'user-query, [data-message-author-role="user"], .user-query-text, .query-text';
            config.cleanPrefix = t => t.replace(/^(你说\s*|You said\s*)/i, '').trim();
        } else if (host.includes('claude.ai')) {
            config.selectors = '[data-testid="user-message"], .font-user, div[class*="bg-user"]';
            config.cleanPrefix = t => t.replace(/^(Pasted Text|Uploaded File|查看组件|Artifacts).*/i, '').trim();
        } else if (host.includes('chatgpt.com')) {
            config.selectors = '[data-message-author-role="user"]';
            config.cleanPrefix = t => t.replace(/\n+/g, ' ').trim();
        }

        function el(tag, css, txt) {
            const e = document.createElement(tag);
            if (css) e.style.cssText = css;
            if (txt) e.textContent = txt;
            return e;
        }

        function buildTOC() {
            const list = document.getElementById('ai-toc-list');
            if (!list) return;
            while (list.firstChild) list.removeChild(list.firstChild);

            // ChatGPT：用缓存的完整数据
            if (host.includes('chatgpt.com')) {
                // 尝试重新解析（以防 current_node 更新）
                if (lastMappingData) cachedMessages = parseMapping(lastMappingData);

                if (cachedMessages.length === 0) {
                    list.appendChild(el('div', 'padding:16px 20px;color:#9aa0a6;font-size:13px;',
                        '数据未就绪，请稍后再点（等页面对话加载完毕）'));
                    return;
                }

                cachedMessages.forEach((m, i) => {
                    const text = m.text;
                    const li = el('li', 'padding:12px 20px;border-bottom:1px solid #3c4043;cursor:pointer;font-size:14px;line-height:1.4;transition:background-color 0.2s;display:flex;');
                    const num = el('span', 'color:#8ab4f8;font-weight:bold;margin-right:8px;flex-shrink:0;', (i + 1) + '.');
                    const title = el('span', 'word-break:break-all;', text.length > 40 ? text.slice(0, 40) + '…' : text);
                    li.appendChild(num); li.appendChild(title);
                    li.onmouseover = () => { li.style.backgroundColor = '#303134'; };
                    li.onmouseout  = () => { li.style.backgroundColor = 'transparent'; };
                    li.onclick = () => jumpToMessage(m.id, i, cachedMessages.length);
                    list.appendChild(li);
                });
                return;
            }

            // Gemini / Claude：DOM 选择器
            const nodes = document.querySelectorAll(config.selectors);
            let count = 1;
            const seen = new Set();
            nodes.forEach((node, i) => {
                let text = (node.innerText || node.textContent || '');
                text = config.cleanPrefix(text);
                if (!text || seen.has(text)) return;
                seen.add(text);
                if (!node.id) node.id = 'ai-toc-anchor-' + i;

                const li = el('li', 'padding:12px 20px;border-bottom:1px solid #3c4043;cursor:pointer;font-size:14px;line-height:1.4;transition:background-color 0.2s;display:flex;');
                const num = el('span', 'color:#8ab4f8;font-weight:bold;margin-right:8px;flex-shrink:0;', count + '.');
                const title = el('span', '', text.length > 40 ? text.slice(0, 40) + '…' : text);
                li.appendChild(num); li.appendChild(title);
                li.onmouseover = () => { li.style.backgroundColor = '#303134'; };
                li.onmouseout  = () => { li.style.backgroundColor = 'transparent'; };
                li.onclick = () => { node.scrollIntoView({ behavior: 'smooth', block: 'center' }); highlight(node); };
                list.appendChild(li);
                count++;
            });

            if (count === 1) {
                list.appendChild(el('div', 'padding:20px;color:#9aa0a6;', '(未提取到当前对话，请尝试滚动网页)'));
            }
        }

        function ensureUI() {
            if (!document.body) return;

            if (!document.getElementById('ai-toc-btn')) {
                const btn = el('div',
                    'position:fixed;right:20px;bottom:80px;width:50px;height:50px;border-radius:25px;' +
                    'background-color:#1a73e8;color:white;text-align:center;line-height:50px;cursor:pointer;' +
                    'z-index:2147483647;box-shadow:0 4px 6px rgba(0,0,0,0.3);font-size:24px;user-select:none;', '📑');
                btn.id = 'ai-toc-btn';
                btn.onclick = () => {
                    const panel = document.getElementById('ai-toc-panel');
                    if (!panel) return;
                    panelOpen = !panelOpen;
                    panel.style.right = panelOpen ? '0px' : '-350px';
                    if (panelOpen) buildTOC();
                };
                document.body.appendChild(btn);
            }

            if (!document.getElementById('ai-toc-panel')) {
                const panel = el('div',
                    'position:fixed;right:-350px;top:0;width:300px;height:100vh;background-color:#1e1e1e;' +
                    'color:#e8eaed;z-index:2147483646;box-shadow:-4px 0 10px rgba(0,0,0,0.3);' +
                    'transition:right 0.3s ease-in-out;display:flex;flex-direction:column;font-family:sans-serif;');
                panel.id = 'ai-toc-panel';

                const header = el('div',
                    'padding:20px;font-size:18px;font-weight:bold;border-bottom:1px solid #3c4043;' +
                    'display:flex;justify-content:space-between;align-items:center;');
                header.appendChild(el('span', '', '对话目录 (TOC)'));
                const closeBtn = el('span', 'cursor:pointer;color:#9aa0a6;', '✖');
                closeBtn.onclick = () => { panelOpen = false; panel.style.right = '-350px'; };
                header.appendChild(closeBtn);
                panel.appendChild(header);

                const list = el('ul', 'flex-grow:1;overflow-y:auto;padding:10px 0;list-style:none;margin:0;');
                list.id = 'ai-toc-list';
                panel.appendChild(list);
                document.body.appendChild(panel);
            }
        }

        setInterval(ensureUI, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
