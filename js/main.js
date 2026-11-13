/* =============================================================
   个人主页 V1 · 交互脚本
   功能：
      1. 页脚年份自动更新
      2. 语言切换（简体中文 / 繁体中文 / 英语）
      3. 页面内部锚点平滑滚动（自动避让吸顶导航栏高度，尊重系统动效偏好）
      4. 移动端汉堡菜单（< 768px 点击展开 / 收起导航）
      5. 动画光标（跟随鼠标播放乌波 APNG 动图，见 css/main.css 第 17.1 节）
      6. 网易云歌单「弹幕式滚动」展示层（V3 新增，见 css/main.css 第 19 节）
      7. 数字分身问答
      8. 访客反馈表单（V5 新增，Supabase JS Client via CDN，见 index.html 的 #feedback）
   说明：代码含注释，方便后续 V2 / V3 修改迭代。
   V1.6 补充：光标图片实为 APNG 动图（各 79 帧），而 CSS 的 cursor 属性
   只能显示第一帧，因此新增跟随图层 index.html 的 .cursor-follow，
   由本文件功能 5 负责跟随、按下切换与回退判断。
   V3 新增：功能 6 —— 网易云歌单「弹幕式滚动」展示层。
   · 弹幕容器与每一条弹幕都由 JS 动态生成，插入到音乐展示区，
     未改动 index.html（不新增、不修改任何 HTML 标签）；
   · 歌单数据写死在 MUSIC_DANMAKU 数组里（取自网易云歌单「list」：
     332 首中随机 12 首，显示为「歌名 - 歌手」+ 专辑封面网络地址），
     页面运行时不调用网易云任何接口，因此不存在跨域问题；
   · 动画交给 CSS @keyframes（匀速 linear + 无限循环），JS 只负责
     量一次宽度、算动画时长与错峰时间，不逐帧操作 DOM；
   · 移动端（< 768px）与系统「减少动态效果」下由 CSS 关闭动画，
     静态显示歌曲列表；
   · 未改动功能 1–5（i18n、平滑滚动、汉堡菜单、乌波光标）与页面其它模块。
   V3.1 优化（弹幕行距 / 密度 / 数量自适应）：
   · 行距：轨道间距固定为「弹幕高 48px + 空隙 8px = 56px」，
     两条轨道之间不再有 16px 交叠，纵向完全不重叠；
   · 密度：同一条轨道上相邻两条之间恒定留 ≥ 72px 空隙（DANMAKU_MIN_GAP），
     错峰位置按每条弹幕的实测宽度累计，长歌名也不会撞在一起；
   · 轨道数 / 数量：一圈可用长度 = 视口宽 + 最宽的一条弹幕，JS 从 2 条轨道
     起自动加到放得下为止（最多 4 条），展示带高度随之调整
     （2 轨 ≈ 116px / 3 轨 ≈ 172px / 4 轨 ≈ 228px），改轨道数不用动 CSS；
   · 所有弹幕共用同一段行程（--danmaku-exit）与同一个周期，
     速度严格一致、循环无缝、不会追尾；
   · 本轮只改 css/main.css 第 19 节的注释 / 兜底高度 / @keyframes 终点，
     以及本功能 6 的参数与排版逻辑；index.html 与其它功能一行未动。
   V5 新增：功能 8 —— 访客反馈表单（Supabase JS Client，CDN 引入）。
   · HTML 侧只新增 index.html 的 #feedback 区块与一行 supabase-js 的
     CDN <script>，原有标签 / 模块顺序 / 文案一行未改；
   · 需你手动替换功能 8.1 顶部的两处占位：SUPABASE_PROJECT_URL 与
     SUPABASE_ANON_KEY（匿名公开密钥）；建表 SQL 与 RLS 策略也写在
     8.1 的注释里，按注释在 Supabase 控制台执行一次即可（无需 npm）；
   · 未改动功能 1–7（i18n、平滑滚动、汉堡菜单、乌波光标、弹幕等）；
     语言切换沿用原 .lang-btn 监听 + setTimeout 的既有写法，
     不侵入 applyLanguage，因此切换语言后表单文案同样能同步。
   ============================================================= */

/* =============================================================
   一、多语言翻译表
   -------------------------------------------------------------
   规则：键名要和 index.html 里 data-i18n="键名" 一一对应。
   新增语言：在下面复制一整块，改键名（如 'ja'），再补翻译即可。
   ============================================================= */
const I18N = {
  /* ---------- 简体中文（默认） ---------- */
  "zh-CN": {
    "page.title": "王天睿 · 个人主页",
    "brand.name": "王天睿",

    "nav.about": "关于我",
    "nav.projects": "项目",
    "nav.skills": "技能",
    "nav.music": "音乐",
    "nav.contact": "联系",
    "header.cta": "联系我",

    "hero.greeting": '你好，我是 <span class="highlight">王天睿</span>',
    "hero.tagline": "我在天津大学学习智能医学工程（脑机接口方向），也在用原生 JavaScript 做自己的个人主页。",
    "hero.tag.1": "大一新生",
    "hero.tag.2": "前端开发",
    "hero.tag.3": "爱听歌",
    "hero.tag.4": "PTCG",
    "hero.action.projects": "查看作品",

    "about.title": "关于我",
    "about.intro": "我是天津大学智能医学工程专业本科生，方向是脑机接口。课余我喜欢探索前端开发，也会把学习中的尝试做成网页。",
    "about.label.identity": "身份",
    "about.value.identity": "天津大学大一本科生",
    "about.label.major": "专业",
    "about.value.major": "智能医学工程（脑机接口方向）",
    "about.label.city": "城市",
    "about.value.city": "天津 / 深圳",

    "projects.title": "项目与作品",
    "projects.1.title": "王天睿 · 个人主页",
    "projects.1.desc": "我用 HTML、CSS 和原生 JavaScript 搭建了这个课程项目，从蓝白初版迭代到 Chiikawa 主题，并实现了三语切换和 Supabase 访客反馈。",
    "projects.1.link": "查看源代码 →",

    "skills.title": "技能与兴趣",
    "skills.skillHeading": "技能",
    "skills.skill.1": "HTML",
    "skills.skill.2": "CSS",
    "skills.skill.3": "JavaScript（学习中）",
    "skills.interestHeading": "兴趣",
    "skills.interest.1": "前端",
    "skills.interest.2": "听歌",
    "skills.interest.3": "PTCG",

    "music.title": "我的音乐歌单",
    "music.desc": "这里展示我收藏的网易云歌单中的部分歌曲。",

    "hero.action.twin": "问问数字分身",
    "projects.feedback": "收到访客反馈后，我调整了移动端字号，在首屏补充专业方向，并修正了版本文案。",
    "twin.label": "输入你的问题",
    "twin.send": "提问",
    "twin.source": "查看相关内容 →",
    "twin.unknown": "公开资料里暂时没有这个问题的答案。你可以试试上面的示例问题。",
    "twin.private": "分身只能提供公开资料。如需联系，请使用联系区的公开邮箱。",
    "twin.question.profile": "你在学什么？",
    "twin.question.project": "这个主页怎么做的？",
    "twin.question.feedback": "V4 根据反馈改了什么？",
    "twin.question.interests": "你有哪些兴趣？",
    "twin.answer.project": "这个主页使用 HTML、CSS 和原生 JavaScript，支持三语切换。访客反馈通过 Supabase 提交。",
    "twin.title": "数字分身 · Digital Twin",
    "twin.desc": "我是王天睿的数字分身。试着问我他的学习方向、主页项目或兴趣，我会根据公开资料回答。",

    "contact.title": "联系我",
    "contact.desc": "欢迎交流、合作或联系。",
    "contact.label.email": "邮箱",
    "contact.label.github": "GitHub",
    "contact.value.github": "github.com/wtrrr123",
    "contact.label.netease": "网易云音乐",
    "contact.value.netease": "我的网易云音乐主页",

    /* ---------- V5：访客反馈表单（静态文案，走 data-i18n） ---------- */
    "feedback.title": "访客反馈",
    "feedback.desc":
      "欢迎留下你的建议或想法，无需登录即可提交；我会定期查看。",
    "feedback.nickname": "昵称",
    "feedback.optional": "（选填）",
    "feedback.message": "反馈内容",
    "feedback.required": "（必填）",
    "feedback.submit": "提交反馈",
    "feedback.reset": "清空",
    "feedback.privacy":
      "仅收集昵称与反馈内容，用于改进这个主页；不会收集手机号、身份证等个人信息。",

    "footer.copyright": "王天睿 · 保留所有权利",
    "footer.note": "课程项目 · 用于学习交流",
  },

  /* ---------- 繁体中文 ---------- */
  "zh-TW": {
    "page.title": "王天睿 · 個人主頁",
    "brand.name": "王天睿",

    "nav.about": "關於我",
    "nav.projects": "專案",
    "nav.skills": "技能",
    "nav.music": "音樂",
    "nav.contact": "聯絡",
    "header.cta": "聯絡我",

    "hero.greeting": '你好，我是 <span class="highlight">王天睿</span>',
    "hero.tagline": "我在天津大學學習智慧醫學工程（腦機介面方向），也在用原生 JavaScript 做自己的個人主頁。",
    "hero.tag.1": "大一新生",
    "hero.tag.2": "前端開發",
    "hero.tag.3": "愛聽歌",
    "hero.tag.4": "PTCG",
    "hero.action.projects": "查看作品",

    "about.title": "關於我",
    "about.intro": "我是天津大學智慧醫學工程專業的大學生，方向是腦機介面。課餘我喜歡探索前端開發，也會把學習中的嘗試做成網頁。",
    "about.label.identity": "身分",
    "about.value.identity": "天津大學大一本科生",
    "about.label.major": "專業",
    "about.value.major": "智能醫學工程（腦機接口方向）",
    "about.label.city": "城市",
    "about.value.city": "天津 / 深圳",

    "projects.title": "專案與作品",
    "projects.1.title": "王天睿 · 個人主頁",
    "projects.1.desc": "我用 HTML、CSS 和原生 JavaScript 製作了這個課程專案，從藍白初版迭代到 Chiikawa 主題，並實作三語切換與 Supabase 訪客回饋。",
    "projects.1.link": "查看原始碼 →",

    "skills.title": "技能與興趣",
    "skills.skillHeading": "技能",
    "skills.skill.1": "HTML",
    "skills.skill.2": "CSS",
    "skills.skill.3": "JavaScript（學習中）",
    "skills.interestHeading": "興趣",
    "skills.interest.1": "前端",
    "skills.interest.2": "聽歌",
    "skills.interest.3": "PTCG",

    "music.title": "我的音樂歌單",
    "music.desc": "這裡展示我收藏的網易雲歌單中的部分歌曲。",

    "hero.action.twin": "問問數位分身",
    "projects.feedback": "收到訪客回饋後，我調整了行動版字級，在首頁首屏補充專業方向，並修正了版本文案。",
    "twin.label": "輸入你的問題",
    "twin.send": "提問",
    "twin.source": "查看相關內容 →",
    "twin.unknown": "公開資料裡暫時沒有這個問題的答案。你可以試試上面的範例問題。",
    "twin.private": "分身只能提供公開資料。如需聯絡，請使用聯絡區的公開信箱。",
    "twin.question.profile": "你在學什麼？",
    "twin.question.project": "這個主頁怎麼做的？",
    "twin.question.feedback": "V4 根據回饋改了什麼？",
    "twin.question.interests": "你有哪些興趣？",
    "twin.answer.project": "這個主頁使用 HTML、CSS 和原生 JavaScript，支援三語切換。訪客回饋透過 Supabase 提交。",
    "twin.title": "數位分身 · Digital Twin",
    "twin.desc": "我是王天睿的數位分身。試著問我他的學習方向、主頁專案或興趣，我會根據公開資料回答。",

    "contact.title": "聯絡我",
    "contact.desc": "歡迎交流、合作或聯絡。",
    "contact.label.email": "電子郵件",
    "contact.label.github": "GitHub",
    "contact.value.github": "github.com/wtrrr123",
    "contact.label.netease": "網易雲音樂",
    "contact.value.netease": "我的網易雲音樂主頁",

    /* ---------- V5：訪客回饋表單（靜態文案，走 data-i18n） ---------- */
    "feedback.title": "訪客回饋",
    "feedback.desc":
      "歡迎留下你的建議或想法，無需登入即可送出；我會定期查看。",
    "feedback.nickname": "暱稱",
    "feedback.optional": "（選填）",
    "feedback.message": "回饋內容",
    "feedback.required": "（必填）",
    "feedback.submit": "送出回饋",
    "feedback.reset": "清空",
    "feedback.privacy":
      "僅收集暱稱與回饋內容，用於改進這個主頁；不會收集手機號、身分證等個人資訊。",

    "footer.copyright": "王天睿 · 保留所有權利",
    "footer.note": "課程專案 · 用於學習交流",
  },

  /* ---------- 英语 ---------- */
  en: {
    "page.title": "Wang Tianrui · Homepage",
    "brand.name": "Wang Tianrui",

    "nav.about": "About",
    "nav.projects": "Projects",
    "nav.skills": "Skills",
    "nav.music": "Music",
    "nav.contact": "Contact",
    "header.cta": "Contact Me",

    "hero.greeting": 'Hi, I\'m <span class="highlight">Wang Tianrui</span>',
    "hero.tagline": "I study Intelligent Medical Engineering at Tianjin University, focusing on brain–computer interfaces, and build my homepage with vanilla JavaScript.",
    "hero.tag.1": "Freshman",
    "hero.tag.2": "Front-end Dev",
    "hero.tag.3": "Music Lover",
    "hero.tag.4": "PTCG",
    "hero.action.projects": "View my work",

    "about.title": "About Me",
    "about.intro": "I study Intelligent Medical Engineering at Tianjin University, with a focus on brain–computer interfaces. I enjoy exploring front-end development and turning what I learn into websites.",
    "about.label.identity": "Identity",
    "about.value.identity": "Freshman at Tianjin University",
    "about.label.major": "Major",
    "about.value.major": "Intelligent Medical Engineering (Brain-Computer Interface)",
    "about.label.city": "City",
    "about.value.city": "Tianjin / Shenzhen",

    "projects.title": "Projects & Works",
    "projects.1.title": "Tianrui Wang · Personal homepage",
    "projects.1.desc": "I built this course project with HTML, CSS, and vanilla JavaScript. It evolved from a blue-and-white prototype into a Chiikawa-themed site with three languages and Supabase visitor feedback.",
    "projects.1.link": "View source code →",

    "skills.title": "Skills & Interests",
    "skills.skillHeading": "Skills",
    "skills.skill.1": "HTML",
    "skills.skill.2": "CSS",
    "skills.skill.3": "JavaScript (learning)",
    "skills.interestHeading": "Interests",
    "skills.interest.1": "Front-end",
    "skills.interest.2": "Music",
    "skills.interest.3": "PTCG",

    "music.title": "My Music Playlist",
    "music.desc": "A selection of tracks from my NetEase Cloud Music playlist.",

    "hero.action.twin": "Ask my digital twin",
    "projects.feedback": "After receiving visitor feedback, I adjusted mobile font sizes, added my academic focus to the first screen, and corrected the version text.",
    "twin.label": "Enter your question",
    "twin.send": "Ask",
    "twin.source": "Read more →",
    "twin.unknown": "I couldn’t find an answer in the public profile. Try one of the example questions above.",
    "twin.private": "I can only share public profile information. Please use the public email in the contact section.",
    "twin.question.profile": "What do you study?",
    "twin.question.project": "How did you build this site?",
    "twin.question.feedback": "What changed after feedback in V4?",
    "twin.question.interests": "What are your interests?",
    "twin.answer.project": "This site uses HTML, CSS, and vanilla JavaScript, supports three languages, and uses Supabase to collect visitor feedback.",
    "twin.title": "Digital Twin",
    "twin.desc": "I’m Tianrui Wang’s digital twin. Ask about his studies, homepage project, or interests. I answer using his public profile.",

    "contact.title": "Contact Me",
    "contact.desc": "Feel free to reach out for a chat or collaboration.",
    "contact.label.email": "Email",
    "contact.label.github": "GitHub",
    "contact.value.github": "github.com/wtrrr123",
    "contact.label.netease": "NetEase Cloud Music",
    "contact.value.netease": "My NetEase Cloud Music profile",

    /* ---------- V5: visitor feedback form (static copy, via data-i18n) ---------- */
    "feedback.title": "Feedback",
    "feedback.desc":
      "Feel free to leave a suggestion or an idea — no sign-in required. I read every message.",
    "feedback.nickname": "Nickname",
    "feedback.optional": "(optional)",
    "feedback.message": "Message",
    "feedback.required": "(required)",
    "feedback.submit": "Send feedback",
    "feedback.reset": "Clear",
    "feedback.privacy":
      "Only your nickname and message are collected, to help improve this site — no phone numbers, ID numbers, or other personal data.",

    "footer.copyright": "Wang Tianrui · All rights reserved",
    "footer.note": "Course project · Built for learning",
  },
};

/* 默认语言（当浏览器未保存过语言选择时使用） */
const DEFAULT_LANG = "zh-CN";

/* =============================================================
   二、应用语言
   ============================================================= */
function applyLanguage(lang) {
  /* 语言不在翻译表里时，回退到默认语言 */
  const dict = I18N[lang] || I18N[DEFAULT_LANG];

  /* 1) 替换所有带 data-i18n 标记的元素文字
        （翻译内容可能含 <span> 等标签，所以用 innerHTML） */
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });

  /* 2) 更新浏览器标签标题与页面语言标记（利于 SEO / 无障碍） */
  if (dict["page.title"]) {
    document.title = dict["page.title"];
  }
  document.documentElement.lang = lang;

  /* 3) 更新语言按钮的选中状态 */
  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    const active = btn.getAttribute("data-lang") === lang;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  /* 4) 记住用户的语言选择（file:// 下可能不可用，用 try 兜底） */
  try {
    localStorage.setItem("preferred-lang", lang);
  } catch (e) {
    /* 忽略：某些环境（如部分浏览器的 file://）会禁用 localStorage */
  }
}

/* 读取上次保存的语言（失败时返回默认语言） */
function getSavedLanguage() {
  try {
    const saved = localStorage.getItem("preferred-lang");
    if (saved && I18N[saved]) {
      return saved;
    }
  } catch (e) {
    /* 忽略读取错误 */
  }
  return DEFAULT_LANG;
}

/* =============================================================
   三、页面初始化
   ============================================================= */
document.addEventListener("DOMContentLoaded", function () {
  /* ---------- 功能 1：页脚年份自动更新 ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------- 功能 2：语言切换 ---------- */
  // 绑定三个语言按钮的点击事件
  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLanguage(btn.getAttribute("data-lang"));
    });
  });

  // 页面打开时按上次选择（或默认）渲染语言
  applyLanguage(getSavedLanguage());

  /* ---------- 功能 3：页面内部锚点平滑滚动 ----------
     说明：
     · CSS 的 scroll-behavior: smooth 已能让锚点平滑滚动，这里补一层 JS 增强：
       滚动时自动避开吸顶导航栏（.site-header）的高度，
       保证目标区块标题不被顶栏压住。
     · 系统开启「减少动态效果」时改为立即跳转（尊重无障碍偏好）。
     · 只接管页面内部的 # 锚点链接，其余链接行为完全不变。 */
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* 吸顶导航栏的实际高度（取不到时按 0 处理，不影响滚动） */
  function getStickyHeaderHeight() {
    const header = document.querySelector(".site-header");
    return header ? header.offsetHeight : 0;
  }

  /* 滚动到目标元素：顶部额外留出导航栏高度 + 12px 呼吸间距 */
  function scrollToAnchor(target) {
    const offset = getStickyHeaderHeight() + 12;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });
  }

  // 为页内锚点链接（导航、品牌 Logo、首屏按钮、顶栏主按钮等）统一绑定
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    const hash = link.getAttribute("href");

    // 跳过空锚点（href="#"）与找不到目标的链接：交回浏览器默认行为
    if (!hash || hash === "#" || !document.querySelector(hash)) {
      return;
    }

    link.addEventListener("click", function (event) {
      // 带修饰键的点击（如新窗口打开）保持浏览器默认行为
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = document.querySelector(hash);
      if (!target) {
        return;
      }
      event.preventDefault();
      scrollToAnchor(target);

      // 同步地址栏 hash（方便复制链接 / 刷新后定位），但不触发二次跳动
      try {
        history.pushState(null, "", hash);
      } catch (e) {
        /* file:// 等环境可能不允许，忽略即可，不影响滚动 */
      }
    });
  });

  /* ---------- 功能 4：移动端汉堡菜单（屏幕宽度 < 768px） ----------
     说明：
     · 桌面端（≥ 768px）不显示汉堡按钮，导航保持完整展示，本功能不产生任何影响；
     · 小屏点击汉堡按钮展开 / 收起导航（由 CSS 的 .is-open 控制显示）；
     · 同时处理：点击菜单内链接后收起、点击外部收起、Esc 收起并回焦、
       视口变宽回桌面端时清理状态、切换语言后同步无障碍标签。 */
  const navToggleBtn = document.querySelector(".nav-toggle");
  const siteNavEl = document.getElementById("site-nav");

  if (navToggleBtn && siteNavEl) {
    /* 与 CSS 断点保持一致：< 768px 视为小屏 */
    const smallScreen = window.matchMedia("(max-width: 767.98px)");

    /* 汉堡按钮的无障碍标签（跟随当前语言，不显示在页面上） */
    const NAV_TOGGLE_LABELS = {
      "zh-CN": { open: "打开导航菜单", close: "收起导航菜单" },
      "zh-TW": { open: "開啟導覽選單", close: "收起導覽選單" },
      en: { open: "Open navigation menu", close: "Close navigation menu" },
    };

    function updateToggleLabel(isOpen) {
      const lang = document.documentElement.lang || DEFAULT_LANG;
      const dict = NAV_TOGGLE_LABELS[lang] || NAV_TOGGLE_LABELS[DEFAULT_LANG];
      navToggleBtn.setAttribute("aria-label", isOpen ? dict.close : dict.open);
    }

    function setNavOpen(isOpen) {
      siteNavEl.classList.toggle("is-open", isOpen);
      navToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      updateToggleLabel(isOpen);
    }

    // 初始保持收起状态
    setNavOpen(false);

    // 点击汉堡按钮切换展开 / 收起
    // （阻止冒泡，避免被下面的「点击外部收起」逻辑立即关掉）
    navToggleBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      setNavOpen(!siteNavEl.classList.contains("is-open"));
    });

    // 小屏下点击菜单里的链接后自动收起，便于看到跳转后的区块
    siteNavEl.addEventListener("click", function (event) {
      if (event.target.closest("a") && smallScreen.matches) {
        setNavOpen(false);
      }
    });

    // 点击菜单与按钮之外的区域时收起
    document.addEventListener("click", function (event) {
      if (!siteNavEl.classList.contains("is-open")) {
        return;
      }
      if (siteNavEl.contains(event.target) || navToggleBtn.contains(event.target)) {
        return;
      }
      setNavOpen(false);
    });

    // 按 Esc 收起，并把焦点交回汉堡按钮（键盘可访问性）
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !siteNavEl.classList.contains("is-open")) {
        return;
      }
      setNavOpen(false);
      navToggleBtn.focus();
    });

    // 视口变宽回到桌面端时清理展开状态，避免残留
    function handleBreakpointChange(event) {
      if (event.matches) {
        return; // 仍处于小屏，无需处理
      }
      siteNavEl.classList.remove("is-open");
      navToggleBtn.setAttribute("aria-expanded", "false");
      updateToggleLabel(false);
    }
    if (typeof smallScreen.addEventListener === "function") {
      smallScreen.addEventListener("change", handleBreakpointChange);
    } else if (typeof smallScreen.addListener === "function") {
      smallScreen.addListener(handleBreakpointChange); // 旧版浏览器兼容
    }

    // 切换语言后同步刷新按钮的无障碍标签
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        updateToggleLabel(siteNavEl.classList.contains("is-open"));
      });
    });
  }

  /* ---------- 功能 5：动画光标（跟随鼠标播放 APNG 动图） ----------
     为什么需要：CSS 的 cursor 属性不支持动图，APNG / GIF 用作 cursor 时
     浏览器只会显示第一帧，所以这里用「跟随鼠标的图层」来播放动画，
     并把系统光标隐藏掉（样式见 css/main.css 第 17.1 节）。
     · 仅在支持精细指针的设备启用（触屏 / 纯触摸设备不启用）；
     · 系统开启「减少动态效果」时不启用，自动退回第 17 节的静态光标；
     · 用 requestAnimationFrame 合并高频 mousemove，跟随更省资源；
     · 鼠标移出窗口时隐藏图层，避免光标“残留”在页面上。 */
  const cursorFollowEl = document.querySelector(".cursor-follow");

  if (cursorFollowEl) {
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionAllowedQuery = window.matchMedia("(prefers-reduced-motion: no-preference)");

    // 与 CSS 第 17 节保持一致的热点：光标图片左上角对齐指针位置
    const CURSOR_HOTSPOT_X = 12;
    const CURSOR_HOTSPOT_Y = 12;

    let cursorX = 0;
    let cursorY = 0;
    let cursorFrame = 0; // requestAnimationFrame 的句柄，0 表示当前没有待执行帧
    let cursorEnabled = false;

    // 真正写入位置：用 transform + translate3d，走合成层，跟随更顺滑
    function paintCursor() {
      cursorFrame = 0;
      cursorFollowEl.style.transform =
        "translate3d(" +
        (cursorX - CURSOR_HOTSPOT_X) +
        "px, " +
        (cursorY - CURSOR_HOTSPOT_Y) +
        "px, 0)";
    }

    function onCursorMove(event) {
      cursorX = event.clientX;
      cursorY = event.clientY;
      // 一帧只写一次样式，避免高频 mousemove 造成布局抖动
      if (!cursorFrame) {
        cursorFrame = window.requestAnimationFrame(paintCursor);
      }
      cursorFollowEl.classList.add("is-visible"); // 鼠标进入页面后才显示
    }

    function onCursorDown() {
      cursorFollowEl.classList.add("is-pressed"); // 按下换成异色动图
    }

    function onCursorUp() {
      cursorFollowEl.classList.remove("is-pressed");
    }

    function onCursorLeave() {
      cursorFollowEl.classList.remove("is-visible", "is-pressed");
    }

    function enableAnimatedCursor() {
      if (cursorEnabled) {
        return;
      }
      cursorEnabled = true;
      document.body.classList.add("has-animated-cursor"); // 由 CSS 隐藏系统光标
      // passive: true 表示不阻止默认行为，滚动时性能更好
      document.addEventListener("mousemove", onCursorMove, { passive: true });
      document.addEventListener("mousedown", onCursorDown);
      document.addEventListener("mouseup", onCursorUp);
      document.addEventListener("mouseleave", onCursorLeave);
      window.addEventListener("blur", onCursorUp); // 切走窗口时清掉按下态
    }

    function disableAnimatedCursor() {
      if (!cursorEnabled) {
        return;
      }
      cursorEnabled = false;
      document.body.classList.remove("has-animated-cursor");
      cursorFollowEl.classList.remove("is-visible", "is-pressed");
      document.removeEventListener("mousemove", onCursorMove);
      document.removeEventListener("mousedown", onCursorDown);
      document.removeEventListener("mouseup", onCursorUp);
      document.removeEventListener("mouseleave", onCursorLeave);
      window.removeEventListener("blur", onCursorUp);
      if (cursorFrame) {
        window.cancelAnimationFrame(cursorFrame);
        cursorFrame = 0;
      }
    }

    // 设备能力或系统动效偏好变化时，重新判断是否启用
    function syncAnimatedCursor() {
      if (finePointerQuery.matches && motionAllowedQuery.matches) {
        enableAnimatedCursor();
      } else {
        disableAnimatedCursor();
      }
    }

    syncAnimatedCursor();
    if (typeof finePointerQuery.addEventListener === "function") {
      finePointerQuery.addEventListener("change", syncAnimatedCursor);
      motionAllowedQuery.addEventListener("change", syncAnimatedCursor);
    } else if (typeof finePointerQuery.addListener === "function") {
      // 旧版浏览器的兼容写法
      finePointerQuery.addListener(syncAnimatedCursor);
      motionAllowedQuery.addListener(syncAnimatedCursor);
    }
  }

  /* ---------- 功能 6：网易云歌单「弹幕式滚动」展示层（V3 新增） ----------
     【标签导航：这就是弹幕功能的完整实现；样式在 css/main.css 第 19 节】
     桌面端滚动展示歌曲，手机端和减少动态效果模式下显示静态列表。
     ============================================================= */
  const MUSIC_DANMAKU = [
    { title: "Kill Bill - SZA", cover: "https://p2.music.126.net/qQ5e7rM-xY6YWJW9_3tR-w==/109951168121859537.jpg?param=96y96" },
    { title: "m.A.A.d city - Kendrick Lamar", cover: "https://p1.music.126.net/SCk1DYSjx9m3AR6r3lo7Fw==/109951170271201605.jpg?param=96y96" },
    { title: "I Want To Break Free - Queen", cover: "https://p1.music.126.net/k5kwNrevbpzDZb7y8IjPYQ==/109951173586764514.jpg?param=96y96" },
    { title: "Ghost Town - Kanye West", cover: "https://p1.music.126.net/0_TEMEngYYsmrwFTXgC1Nw==/109951166959857767.jpg?param=96y96" },
    { title: "Hol' Up - Kendrick Lamar", cover: "https://p1.music.126.net/6isEZRvvV973OSc7WKo0Ig==/109951164259304679.jpg?param=96y96" },
    { title: "SKY CITY - ¥$", cover: "https://p2.music.126.net/Qh8A9YR0shxbXTjUpOUEpQ==/109951169877712367.jpg?param=96y96" },
    { title: "United In Grief - Kendrick Lamar", cover: "https://p1.music.126.net/tFv2HaAosP5YBfHCkJq9wg==/109951167481735108.jpg?param=96y96" },
    { title: "Praise The Lord (Da Shine) - A$AP Rocky", cover: "https://p2.music.126.net/nDn1OeuJXe2oJqBIl8Zjmw==/109951165984153765.jpg?param=96y96" },
    { title: "Can't Tell Me Nothing - Kanye West", cover: "https://p2.music.126.net/1pIJlLQmblxVIJXaKnWykw==/109951167119530519.jpg?param=96y96" },
    { title: "Deja Vu - Post Malone", cover: "https://p1.music.126.net/64pEagjGEHdeVtUXO1A5CA==/18742275207196978.jpg?param=96y96" },
    { title: "Love Me - Lil Wayne", cover: "https://p1.music.126.net/BW7EfQrAVi16mxXa9-qFbw==/109951166048808784.jpg?param=96y96" },
    { title: "PRIDE. - Kendrick Lamar", cover: "https://p1.music.126.net/U4CJPNLQOz_ZFXW4eCBUUQ==/109951170258095019.jpg?param=96y96" },
  ];

  /* ============ 弹幕可调参数（V3.1：行距 / 密度 / 数量自适应）============
     下面这一组数字决定观感，想微调只改这里：
       · 速度：每秒多少像素，数值越大越快；
       · 行距：轨道间距 = 弹幕高 + DANMAKU_LANE_GAP，纵向完全不重叠；
       · 密度：同一条轨道上相邻两条弹幕之间至少留 DANMAKU_MIN_GAP 像素。
     轨道数量不用手写，也不用跟着改 CSS：
     layoutDanmaku() 会拿「视口宽 + 最宽的一条弹幕」当一圈的可用长度，
     从 2 条轨道起算，直到每条轨道都放得下为止（最多 DANMAKU_MAX_LANES 条），
     并把展示带高度调到刚好装下所有轨道（CSS 里的 80px 只是兜底）。
     ============================================================ */
  const DANMAKU_SPEED = 72;            /* 匀速滚动速度：每秒 72 像素（数值越大越快） */
  const DANMAKU_ITEM_HEIGHT = 48;      /* 单条弹幕高（与 css/main.css 的 .danmaku-cover 一致） */
  const DANMAKU_LANE_GAP = 8;          /* 轨道之间的额外空隙：48 + 8 = 56px 一个轨道间距 */
  const DANMAKU_LANE_PAD = 6;          /* 展示带上下各留的空白 */
  const DANMAKU_MIN_GAP = 72;          /* 同轨相邻两条弹幕的最小水平空隙（越大越松、越不容易重叠） */
  const DANMAKU_MIN_GAP_FLOOR = 28;    /* 空隙压缩下限：轨道用满还放不下时才会用到 */
  const DANMAKU_MAX_LANES = 4;         /* 最多分几条轨道（展示带高度会随之自动变化） */
  const DANMAKU_REPEAT = 1;            /* 每首歌重复出现的次数（1 = 一首只飘一条）；12 首 ×1 = 12 条弹幕 */

  /* ---- 内置占位封面：不需要任何图片文件，file:// 双击打开也能显示 ----
     用 SVG 现场拼一张 96×96 的淡蓝封面（页面上由 CSS 缩到 48×48），
     转成 data: URI 交给 <img>，所以不联网、不会裂图。
     等你把 MUSIC_DANMAKU 里的 cover 换成真实地址后，
     这个函数就不会再被调用（可以留着，以后加歌继续用）。 */
  function makeDanmakuCover(seed) {
    /* 几张低饱和淡蓝轮换使用，让相邻弹幕的封面颜色略有区别 */
    const coverPalette = ["#cfe0f7", "#dbe7f8", "#c7dbf5", "#e2ecfa", "#d3e3f9", "#cbddf6"];
    const coverBg = coverPalette[seed % coverPalette.length];
    /* 图形用简单的「均衡器」三根圆角竖条，一眼能看出是音乐封面 */
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
      '<rect width="96" height="96" rx="20" fill="' + coverBg + '"/>' +
      '<g fill="#5b8cd6">' +
      '<rect x="24" y="44" width="9" height="28" rx="4.5"/>' +
      '<rect x="43.5" y="28" width="9" height="44" rx="4.5"/>' +
      '<rect x="63" y="38" width="9" height="34" rx="4.5"/>' +
      "</g>" +
      "</svg>";
    /* encodeURIComponent 保证 SVG 里的 # / < / > 等字符在 data URI 里合法 */
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* 歌单播放器的外层容器：弹幕要插到它的正上方。
     如果页面里找不到它，或歌单数据为空，就跳过本功能 —— 
     保证这段代码永远不会影响其它任何功能。 */
  const musicDisplayEl = document.getElementById("music-display");

  if (musicDisplayEl && MUSIC_DANMAKU.length) {
    /* 1) 生成展示带骨架：
            .danmaku（外框：高度 / 圆角 / 淡蓝底 / 裁切）
              ├ .danmaku-static   移动端静态标题（桌面端隐藏）
              └ .danmaku-viewport 裁切层（弹幕在这里面飘） */
    const danmakuEl = document.createElement("div");
    danmakuEl.className = "danmaku";

    const danmakuStaticEl = document.createElement("ul");
    danmakuStaticEl.className = "danmaku-static";
    MUSIC_DANMAKU.forEach(function (song) {
      const item = document.createElement("li");
      item.textContent = song.title;
      danmakuStaticEl.appendChild(item);
    });
    danmakuEl.appendChild(danmakuStaticEl);

    const danmakuViewportEl = document.createElement("div");
    danmakuViewportEl.className = "danmaku-viewport";
    danmakuEl.appendChild(danmakuViewportEl);

    /* 2) 逐条生成弹幕：专辑封面小图 + 歌名
          先把 DOM 全部建好、再统一量宽度算动画参数，避免「边建边量」反复回流。 */
    const danmakuItems = [];

    for (let repeatIndex = 0; repeatIndex < DANMAKU_REPEAT; repeatIndex++) {
      MUSIC_DANMAKU.forEach(function (song, songIndex) {
        const itemEl = document.createElement("div");
        itemEl.className = "danmaku-item";

        const coverEl = document.createElement("img");
        coverEl.className = "danmaku-cover";
        coverEl.alt = "";              /* 装饰性图片：歌名已经写在旁边的文字里 */
        coverEl.decoding = "async";
        coverEl.draggable = false;
        /* cover 留空时用内置占位封面；填了网络地址但加载失败（断网 / 图片失效）时，
           下面的 error 事件会自动换成占位封面 —— 任何情况都不会出现裂图 */
        coverEl.src = song.cover ? song.cover : makeDanmakuCover(repeatIndex + songIndex);
        coverEl.addEventListener("error", function () {
          /* data-fallback 标记用来防死循环（占位图是 data URI，不会再触发失败） */
          if (coverEl.getAttribute("data-fallback") === "1") {
            return;
          }
          coverEl.setAttribute("data-fallback", "1");
          coverEl.src = makeDanmakuCover(repeatIndex + songIndex);
        });
        itemEl.appendChild(coverEl);

        const titleEl = document.createElement("span");
        titleEl.className = "danmaku-title";
        titleEl.textContent = song.title;
        itemEl.appendChild(titleEl);

        danmakuViewportEl.appendChild(itemEl);
        danmakuItems.push(itemEl);
      });
    }

    musicDisplayEl.appendChild(danmakuEl);

    /* 4) 量宽度 → 算轨道与动画参数（V3.1：行距 / 密度 / 轨道数全部自适应）
          三个目标：
            A. 横向匀速 —— 所有弹幕速度完全一致（不是靠缓动假装的）；
            B. 行距清晰 —— 轨道之间留出空隙，纵向不重叠、不糊成一团；
            C. 同轨不挤 —— 同一条轨道上任意两条之间始终留 ≥ DANMAKU_MIN_GAP 的空隙。
          做法：
            1. 每条弹幕都在「视口宽 + 最宽的一条弹幕」这条环形轨道空间里循环
               （从视口右侧外飘到左侧外），所以它要占用的长度 = 自身宽度 + 最小空隙；
            2. 轨道数从 2 条起递增，直到每条轨道的占用总和都放得进一圈；
               若 4 条仍然放不下，就把空隙压到下限再排一次（真实数据走不到这一步）；
            3. 每条弹幕的起点位置 = 它在本轨道内「前缀累计长度」，再换算成时间错峰，
               于是相邻两条的实际水平间距 = 各自宽度 + 最小空隙，严格均匀；
            4. 展示带高度 = 上下留白 + 轨道数 × 弹幕高 + 轨道间隙，
               由 JS 写入 style.height —— 所以改轨道数不用动 CSS。 */
    function layoutDanmaku() {
      /* 量宽度前先确认弹幕是显示状态：移动端 / 系统「减少动态效果」下
         它们被 CSS 隐藏（display: none），此时宽度为 0，量出来没有意义；
         顺便把 JS 写过的高度清掉，让展示带回落到 CSS 的
         「自适应高度 + 静态列表」形态（见 css/main.css 第 19.1 节）。 */
      if (!danmakuItems.length || danmakuItems[0].offsetParent === null) {
        danmakuEl.style.height = "";
        return;
      }

      const total = danmakuItems.length;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      /* 4.1 逐条量真实宽度（封面 + 歌名，歌名长短不同，宽度也不同） */
      const widths = [];
      let widest = 0;
      for (let i = 0; i < total; i++) {
        const itemWidth = danmakuItems[i].offsetWidth;
        widths.push(itemWidth);
        if (itemWidth > widest) { widest = itemWidth; }
      }
      if (!widest) { return; }   /* 还没渲染出宽度（字体未就位等），等下一次校正 */

      /* 一圈环形空间的长度：视口宽 + 最宽一条的宽度
         （最宽的那条刚好完全离开左侧时，右侧正好能放下下一条） */
      const loopLength = viewportWidth + widest;

      /* 4.2 选轨道数：从 2 条起，够了就停（宽度大的先占位，尽量分得均匀） */
      let laneCount = DANMAKU_MAX_LANES;
      let gap = DANMAKU_MIN_GAP;
      let lanesOf = null;
      for (let tryLanes = 2; tryLanes <= DANMAKU_MAX_LANES; tryLanes++) {
        const tried = assignDanmakuLanes(widths, tryLanes, loopLength, DANMAKU_MIN_GAP);
        if (tried) { laneCount = tryLanes; lanesOf = tried; break; }
      }
      if (!lanesOf) {
        /* 轨道用满还是放不下：把空隙压到下限再排一次（此时允许轻微溢出） */
        gap = DANMAKU_MIN_GAP_FLOOR;
        laneCount = DANMAKU_MAX_LANES;
        lanesOf = assignDanmakuLanes(widths, laneCount, loopLength, gap, true);
      }

      /* 4.3 展示带高度：正好装下所有轨道（CSS 里的 80px 只是 JS 未运行时的兜底） */
      const laneStep = DANMAKU_ITEM_HEIGHT + DANMAKU_LANE_GAP;
      danmakuEl.style.height =
        (DANMAKU_LANE_PAD * 2 + laneCount * DANMAKU_ITEM_HEIGHT + (laneCount - 1) * DANMAKU_LANE_GAP) + "px";

      /* 终点：所有弹幕都飘到「最宽的一条完全离开左侧」为止 ——
         每条行程一样长，所以周期一样、速度一样，循环起来无缝且不会追尾 */
      danmakuEl.style.setProperty("--danmaku-exit", (-widest) + "px");

      /* 4.4 逐条写入纵向位置与错峰参数 */
      const duration = loopLength / DANMAKU_SPEED;   /* 所有弹幕共用同一个周期 */
      const laneOffsets = [];                        /* 每条轨道已经排到哪个位置了 */
      for (let i = 0; i < laneCount; i++) { laneOffsets.push(0); }

      for (let index = 0; index < total; index++) {
        const itemEl = danmakuItems[index];
        const lane = lanesOf[index];
        const offset = laneOffsets[lane];            /* 这条在本轨道一圈里的起点 */
        laneOffsets[lane] = offset + widths[index] + gap;

        /* 下面这几个值都被 css/main.css 第 19 节的 .danmaku-item 读取 */
        itemEl.style.setProperty("--danmaku-top", (DANMAKU_LANE_PAD + lane * laneStep) + "px");
        itemEl.style.zIndex = String(lane + 1);      /* 靠下的轨道叠在上层，层次清楚 */
        itemEl.style.setProperty("--danmaku-duration", duration.toFixed(2) + "s");
        itemEl.style.setProperty("--danmaku-delay", (-offset / DANMAKU_SPEED).toFixed(2) + "s");
      }
    }

    /* 轨道分配：按宽度从大到小，依次放进「当前最空」的那条轨道，尽量分得均匀。
       返回「每条弹幕的轨道号」数组；只要有一条轨道装不下就返回 null，
       调用方会换成更多轨道重试。force = true 时不做容量检查（兜底用）。 */
    function assignDanmakuLanes(widths, laneCount, loopLength, gap, force) {
      const loads = [];
      const lanesOf = [];
      const order = [];
      for (let i = 0; i < laneCount; i++) { loads.push(0); }
      for (let i = 0; i < widths.length; i++) { order.push(i); }
      order.sort(function (a, b) { return widths[b] - widths[a]; });

      for (let k = 0; k < order.length; k++) {
        const index = order[k];
        let best = 0;
        for (let i = 1; i < laneCount; i++) {
          if (loads[i] < loads[best]) { best = i; }
        }
        const cost = widths[index] + gap;
        if (!force && loads[best] + cost > loopLength) { return null; }
        loads[best] = loads[best] + cost;
        lanesOf[index] = best;
      }
      return lanesOf;
    }

    /* 初始量一次；窗口变化时防抖重算（尺寸变了，时长也要跟着变） */
    layoutDanmaku();

    let danmakuLayoutTimer = 0;
    function scheduleDanmakuLayout() {
      window.clearTimeout(danmakuLayoutTimer);
      danmakuLayoutTimer = window.setTimeout(layoutDanmaku, 180);
    }
    window.addEventListener("resize", scheduleDanmakuLayout);

    /* 小屏 ↔ 桌面端切换后重新量一次
       （移动端是隐藏状态，切回桌面端需要重算时长，否则动画会偏快 / 偏慢） */
    const danmakuBreakpoint = window.matchMedia("(max-width: 767.98px)");
    if (typeof danmakuBreakpoint.addEventListener === "function") {
      danmakuBreakpoint.addEventListener("change", scheduleDanmakuLayout);
    } else if (typeof danmakuBreakpoint.addListener === "function") {
      danmakuBreakpoint.addListener(scheduleDanmakuLayout); // 旧版浏览器兼容
    }

    /* 页面完全加载（字体 / 图片就位）后再校正一次，时长更贴合真实文字宽度 */
    window.addEventListener("load", layoutDanmaku);

  }

  /* ---------- 功能 7：数字分身问答 ---------- */
  const twinForm = document.getElementById("twin-form");
  const twinQuestion = document.getElementById("twin-question");
  const twinAnswer = document.getElementById("twin-answer");
  const twinSource = document.getElementById("twin-source");
  const twinTopics = {
    private: { match: /手机号|手機號|电话|電話|留言|密码|密碼|phone|password|visitor messages|private/iu, keys: ["twin.private"], source: "#contact" },
    contact: { match: /邮箱|郵箱|信箱|联系|聯絡|email|contact/iu, keys: ["contact.desc"], source: "#contact" },
    feedback: { match: /v4|反馈|回饋|改版|迭代|feedback|changes?/iu, keys: ["projects.feedback"], source: "#homepage-feedback" },
    project: { match: /主页|主頁|网站|網站|项目|專案|作品|javascript|html|css|supabase|homepage|website|project|build/iu, keys: ["twin.answer.project"], source: "#homepage-project" },
    profile: { match: /专业|專業|学习|學習|在学|在學|大学|大學|脑机|腦機|study|studies|major|university|brain/iu, keys: ["about.intro"], source: "#about" },
    interests: { match: /兴趣|興趣|爱好|愛好|技能|喜欢|喜歡|音乐|音樂|ptcg|interest|hobb|music|skills?/iu, keys: ["skills.interestHeading", "skills.interest.1", "skills.interest.2", "skills.interest.3"], source: "#skills" },
    unknown: { keys: ["twin.unknown"] },
  };
  let activeTwinTopic;

  function renderTwinReply() {
    if (!activeTwinTopic) return;
    const dict = I18N[document.documentElement.lang] || I18N[DEFAULT_LANG];
    const answers = activeTwinTopic.keys.map(function (key) { return dict[key]; });
    twinAnswer.textContent = answers.length === 1
      ? answers[0]
      : answers[0] + " · " + answers.slice(1).join(" / ");
    twinSource.hidden = !activeTwinTopic.source;
    if (activeTwinTopic.source) {
      twinSource.setAttribute("href", activeTwinTopic.source);
    } else {
      twinSource.removeAttribute("href");
    }
  }

  twinForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const question = twinQuestion.value.trim();
    if (!question) {
      twinQuestion.value = "";
      twinQuestion.reportValidity();
      return;
    }

    activeTwinTopic = Object.values(twinTopics).find(function (topic) {
      return topic.match?.test(question);
    }) || twinTopics.unknown;
    renderTwinReply();
  });

  document.querySelectorAll("[data-twin-topic]").forEach(function (button) {
    button.addEventListener("click", function () {
      activeTwinTopic = twinTopics[button.dataset.twinTopic];
      renderTwinReply();
    });
  });

  document.querySelectorAll(".lang-btn").forEach(function (button) {
    button.addEventListener("click", renderTwinReply);
  });

  /* =============================================================
     功能 8：访客反馈表单（V5 新增 · 通过 CDN 引入的 Supabase JS Client 提交）
     -------------------------------------------------------------
     【这一块做什么】
     把「联系我」下方反馈表单里的两项内容（昵称 + 反馈内容）写进
     Supabase 的 public.feedback 表，访客无需登录即可提交。

     【上线前必做两件事 —— 不做的话提交一定失败】
     ① 建表 + 开启 RLS：把下面「部署 SQL」整段复制到
        Supabase 控制台 → SQL Editor → Run（只需跑一次）；
     ② 把 8.1 里的两个占位换成你自己项目的值。

     【安全须知（重要，请务必看完）】
     · anon key 是「公开密钥」，它本来就会随网页发到访客的浏览器里，
       所以它不算秘密；真正决定「谁能读写哪些数据」的是数据库的 RLS 策略，
       所以第 ① 步的 RLS 与策略不能省。
     · 严禁把 service_role key 写进前端代码！那个密钥会绕过全部 RLS，
       一旦发到浏览器就等于把整个数据库交给了任何人。本项目只需要 anon key。
     · 除了下面的 anon key，不要把任何密钥 / 数据库密码写进本文件；
       也建议把本文件纳入版本库前先确认没有粘贴过 secret。
     · 出于隐私考虑，前端只提交「昵称」与「反馈内容」两个字段，
       不采集手机号 / 身份证 / 邮箱 / IP / 设备指纹等任何额外信息。
     ============================================================= */

  /* ---------- 8.1 配置区：这两行占位需要你手动替换 ---------- */
  /* 项目地址：Supabase 控制台 → Project Settings → API → Project URL */
  const SUPABASE_PROJECT_URL = "https://fhodvigderxqaaufjfgy.supabase.co"; /* 例：https://abcdefgh.supabase.co */
  /* 公开密钥：同一页面的 anon public key（不是 service_role！） */
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZob2R2aWdkZXJ4cWFhdWZqZmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMzA5MTEsImV4cCI6MjEwNTYwNjkxMX0.ICc-HV51VST2ZEzROvctcHI50Fc4hpZVpCnwxj_lnDg";

  /* ---------- 部署 SQL（复制到 Supabase → SQL Editor 执行一次） ----------
     -- 1) 建表：字段长度在数据库层再兜一层，防止有人绕过前端校验
     create table if not exists public.feedback (
       id         bigint generated by default as identity primary key,
       nickname   text check (nickname is null or char_length(nickname) <= 30),
       message    text not null check (char_length(message) between 1 and 500),
       created_at timestamptz not null default now()
     );

     -- 2) 开启行级安全（RLS）：不开的话上面的策略不生效
     alter table public.feedback enable row level security;

     -- 3) 只给匿名访客「插入」权限，不给读取 / 修改 / 删除
     --    （没有 SELECT 策略，别人就无法拿 anon key 把反馈全查走）
     create policy "anon can insert feedback"
       on public.feedback for insert to anon with check (true);

     -- 4) 查看反馈：登录 Supabase 控制台 → Table Editor 看即可（管理员视角）。
     --    如果你还想给管理员开放查询，请另建「登录用户可读」的策略，
     --    不要直接给 anon 开 SELECT。
     ---------------------------------------------------------------------- */

  /* ---------- 8.2 多语言文案 ----------
     说明：静态文案（标题 / 标签 / 按钮）走 index.html 的 data-i18n，
     由 applyLanguage 处理；但 placeholder 和多变的提示语
     applyLanguage 管不到（它只写 innerHTML），所以这两类放在这里，
     由本功能自己监听语言按钮来切换（和「功能 6」弹幕标题用的是同一套做法）。 */
  const FEEDBACK_TEXT = {
    "zh-CN": {
      submit: "提交反馈",
      loading: "提交中…",
      placeholderNickname: "怎么称呼你？（不填也可以）",
      placeholderMessage: "想说的话…（最多 500 字）",
      needMessage: "请先写点内容再提交～",
      tooLong: "反馈内容最多 500 字，麻烦精简一下～",
      nicknameTooLong: "昵称最多 30 个字～",
      notConfigured: "表单还没配置好（缺少项目地址或密钥），请联系站长～",
      needSdk: "提交组件加载失败，请检查网络后刷新页面重试。",
      ok: "提交成功，谢谢你的反馈！",
      fail: "提交失败，稍后再试一次吧～",
    },
    "zh-TW": {
      submit: "送出回饋",
      loading: "送出中…",
      placeholderNickname: "怎麼稱呼你？（不填也可以）",
      placeholderMessage: "想說的話…（最多 500 字）",
      needMessage: "請先寫點內容再送出～",
      tooLong: "回饋內容最多 500 字，麻煩精簡一下～",
      nicknameTooLong: "暱稱最多 30 個字～",
      notConfigured: "表單還沒設定好（缺少專案網址或金鑰），請聯絡站長～",
      needSdk: "送出元件載入失敗，請檢查網路後重新整理再試。",
      ok: "送出成功，謝謝你的回饋！",
      fail: "送出失敗，稍後再試一次吧～",
    },
    en: {
      submit: "Send feedback",
      loading: "Sending…",
      placeholderNickname: "What should I call you? (optional)",
      placeholderMessage: "Your message… (up to 500 characters)",
      needMessage: "Please write something before sending.",
      tooLong: "The message can be at most 500 characters.",
      nicknameTooLong: "The nickname can be at most 30 characters.",
      notConfigured: "The form is not configured yet (missing project URL or key).",
      needSdk: "The submit module failed to load. Please check your network and refresh.",
      ok: "Sent — thanks for your feedback!",
      fail: "Sending failed. Please try again in a moment.",
    },
  };

  /* ---------- 8.3 取元素 ---------- */
  const feedbackForm = document.getElementById("feedback-form");
  const feedbackNickname = document.getElementById("feedback-nickname");
  const feedbackMessage = document.getElementById("feedback-message");
  const feedbackCount = document.getElementById("feedback-count");
  const feedbackSubmit = document.getElementById("feedback-submit");
  const feedbackResetBtn = document.getElementById("feedback-reset");
  const feedbackStatus = document.getElementById("feedback-status");

  /* 表单核心元素不全时整块跳过（例如以后把该模块删掉了），不影响其它功能 */
  if (feedbackForm && feedbackMessage && feedbackSubmit && feedbackStatus) {
    const FEEDBACK_MAX_MESSAGE = 500;   /* 与 textarea 的 maxlength 保持一致 */
    const FEEDBACK_MAX_NICKNAME = 30;   /* 与 input 的 maxlength 保持一致 */

    let feedbackClient = null;          /* 惰性创建，避免没配置也在启动时连接 */
    let feedbackSending = false;        /* 提交中标志：防重复提交的第二道保险 */
    let feedbackStatusState = null;     /* { key: "ok", kind: "success" }，null 表示无提示 */

    /* 当前语言：优先看语言按钮的选中态，其次读已保存的语言，最后回退默认 */
    function getFeedbackLang() {
      const activeBtn = document.querySelector(".lang-btn.is-active");
      const activeLang = activeBtn ? activeBtn.getAttribute("data-lang") : null;
      if (activeLang && FEEDBACK_TEXT[activeLang]) {
        return activeLang;
      }
      const saved = getSavedLanguage();
      return FEEDBACK_TEXT[saved] ? saved : DEFAULT_LANG;
    }

    /* 取当前语言文案，缺键时回退到默认语言 */
    function feedbackText(key) {
      const dict = FEEDBACK_TEXT[getFeedbackLang()] || FEEDBACK_TEXT[DEFAULT_LANG];
      return dict[key] || FEEDBACK_TEXT[DEFAULT_LANG][key] || "";
    }

    /* 渲染状态提示：文案随语言走，所以切语言要重新渲染 */
    function renderFeedbackStatus() {
      if (!feedbackStatusState) {
        feedbackStatus.textContent = "";
        feedbackStatus.className = "form-status";
        return;
      }
      feedbackStatus.textContent = feedbackText(feedbackStatusState.key);
      feedbackStatus.className = "form-status is-" + feedbackStatusState.kind;
    }

    /* 设置状态提示：key 为 null 表示清空 */
    function setFeedbackStatus(key, kind) {
      feedbackStatusState = key ? { key: key, kind: kind } : null;
      renderFeedbackStatus();
    }

    /* 同步字数统计（与 maxlength 一起构成「不超 500 字」的双重保障） */
    function updateFeedbackCount() {
      if (!feedbackCount) {
        return;
      }
      feedbackCount.textContent = String((feedbackMessage.value || "").length);
    }

    /* 两个占位是否已替换 */
    function isFeedbackConfigured() {
      return (
        SUPABASE_PROJECT_URL.indexOf("YOUR_SUPABASE") !== 0 &&
        SUPABASE_ANON_KEY.indexOf("YOUR_SUPABASE") !== 0 &&
        SUPABASE_PROJECT_URL.length > 0 &&
        SUPABASE_ANON_KEY.length > 0
      );
    }

    /* CDN 是否加载成功（离线 / 被拦截时为 false） */
    function isFeedbackSdkReady() {
      return (
        typeof window.supabase !== "undefined" &&
        window.supabase !== null &&
        typeof window.supabase.createClient === "function"
      );
    }

    /* 取客户端（只创建一次） */
    function getFeedbackClient() {
      if (feedbackClient) {
        return feedbackClient;
      }
      if (!isFeedbackSdkReady()) {
        return null;
      }
      feedbackClient = window.supabase.createClient(
        SUPABASE_PROJECT_URL,
        SUPABASE_ANON_KEY
      );
      return feedbackClient;
    }

    /* 提交中 / 提交结束：按钮禁用 + 转圈 + 文案切换。
       禁用按钮本身就挡住了重复点击，feedbackSending 是第二道保险 */
    function setFeedbackBusy(busy) {
      feedbackSending = busy;
      feedbackSubmit.disabled = busy;
      if (feedbackResetBtn) {
        feedbackResetBtn.disabled = busy;
      }
      if (busy) {
        feedbackSubmit.classList.add("is-loading");
        feedbackSubmit.setAttribute("aria-busy", "true");
      } else {
        feedbackSubmit.classList.remove("is-loading");
        feedbackSubmit.removeAttribute("aria-busy");
      }
      /* 注意：这里只用 textContent 写文案，转圈是 CSS 伪元素，不会被清掉 */
      feedbackSubmit.textContent = busy ? feedbackText("loading") : feedbackText("submit");
    }

    /* 失败处理：页面只给一句友好提示，具体错误打到控制台方便自查
       （不在页面上暴露数据库结构等内部信息） */
    function feedbackFail(error) {
      console.error("[反馈表单] 提交失败：", error);
      setFeedbackStatus("fail", "error");
    }

    /* ---------- 提交 ---------- */
    function onFeedbackSubmit(event) {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault(); /* 单页站点：阻止原生提交导致的页面跳转 */
      }
      if (feedbackSending) {
        return; /* 提交中：忽略重复提交 */
      }

      const nickname = (feedbackNickname ? feedbackNickname.value : "").trim();
      const message = (feedbackMessage.value || "").trim();

      /* 前端校验：内容必填、不超长；昵称选填但也要限长 */
      if (!message) {
        setFeedbackStatus("needMessage", "error");
        feedbackMessage.focus();
        return;
      }
      if (message.length > FEEDBACK_MAX_MESSAGE) {
        setFeedbackStatus("tooLong", "error");
        feedbackMessage.focus();
        return;
      }
      if (nickname.length > FEEDBACK_MAX_NICKNAME) {
        setFeedbackStatus("nicknameTooLong", "error");
        if (feedbackNickname) {
          feedbackNickname.focus();
        }
        return;
      }

      /* 配置 / 依赖检查：给出「能看懂」的提示，而不是一个看不懂的报错 */
      if (!isFeedbackConfigured()) {
        console.warn(
          "[反馈表单] 尚未配置：请把 js/main.js 功能 8.1 里的 " +
            "SUPABASE_PROJECT_URL 与 SUPABASE_ANON_KEY 换成你自己的值。"
        );
        setFeedbackStatus("notConfigured", "error");
        return;
      }
      const client = getFeedbackClient();
      if (!client) {
        setFeedbackStatus("needSdk", "error");
        return;
      }

      setFeedbackBusy(true);
      setFeedbackStatus("loading", "loading");

      /* 只提交这两个字段，且刻意不接 .select()：
         我们没有给 anon 开放 SELECT 权限，接上 .select()（要求返回数据）
         会因为 RLS 拒绝而报错。空昵称存 null，不存空字符串。
         写法说明：用 .then(成功回调, 失败回调) 的两段式，
         与 .then(...).catch(...) 等效，但通篇 ES5 风格更统一。 */
      client
        .from("feedback")
        .insert([{ nickname: nickname ? nickname : null, message: message }])
        .then(
          function (res) {
            setFeedbackBusy(false);
            if (res && res.error) {
              feedbackFail(res.error);
              return;
            }
            feedbackForm.reset();      /* 成功：清空表单 */
            updateFeedbackCount();
            setFeedbackStatus("ok", "success");
          },
          function (error) {
            setFeedbackBusy(false);
            feedbackFail(error);
          }
        );
    }

    /* ---------- 多语言：placeholders 与提示文案（applyLanguage 管不到的部分） ---------- */
    function applyFeedbackLang() {
      if (feedbackNickname) {
        feedbackNickname.setAttribute("placeholder", feedbackText("placeholderNickname"));
      }
      feedbackMessage.setAttribute("placeholder", feedbackText("placeholderMessage"));
      updateFeedbackCount();
      if (!feedbackSending) {
        feedbackSubmit.textContent = feedbackText("submit");
      }
      renderFeedbackStatus(); /* 让已有的提示也跟着换语言 */
    }

    /* ---------- 绑定事件 ---------- */
    feedbackForm.addEventListener("submit", onFeedbackSubmit);
    feedbackMessage.addEventListener("input", updateFeedbackCount);

    /* 用户主动点「清空」：连上一次的提示一起清掉
       （延后一拍，等浏览器先清完输入框再更新字数） */
    if (feedbackResetBtn) {
      feedbackResetBtn.addEventListener("click", function () {
        window.setTimeout(function () {
          updateFeedbackCount();
          setFeedbackStatus(null, null);
        }, 0);
      });
    }

    /* 原生 reset（含提交成功后的自动清空）：只同步字数 */
    feedbackForm.addEventListener("reset", function () {
      window.setTimeout(updateFeedbackCount, 0);
    });

    /* 切语言后刷新 placeholder 与提示
       （延后一拍执行，等 applyLanguage 把 data-i18n 的文字换完再读当前语言） */
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.setTimeout(applyFeedbackLang, 0);
      });
    });

    /* 初始化：字数 / placeholder / 按钮文案一次到位
       （覆盖「首次进入时语言已经不是默认语言」的情况） */
    updateFeedbackCount();
    applyFeedbackLang();
  }
});
