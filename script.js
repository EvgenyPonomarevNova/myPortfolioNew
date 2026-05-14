(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preloader ---------- */
  const preloader = $('#preloader');
  const preFill = $('#preFill');
  const prePct = $('#prePct');
  const prePct2 = $('#prePct2');
  let preP = 0;
  let preTarget = 0;
  const setPre = (v) => { preTarget = Math.max(preTarget, Math.min(100, v)); };

  setPre(18);
  const preTick = () => {
    preP += (preTarget - preP) * 0.12;
    const p = Math.round(preP);
    if (preFill) preFill.style.width = `${p}%`;
    if (prePct) prePct.textContent = `${p}%`;
    if (prePct2) prePct2.textContent = `${p}%`;

    if (preTarget >= 100 && p >= 99) {
      document.body.classList.remove('is-preloading');
      preloader?.classList.add('is-done');
      window.setTimeout(() => preloader?.remove(), 520);
      return;
    }
    requestAnimationFrame(preTick);
  };

  if (preloader) {
    document.body.classList.add('is-preloading');
    requestAnimationFrame(preTick);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setPre(44), { once: true });
    } else {
      setPre(44);
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => setPre(72)).catch(() => setPre(72));
    }

    window.addEventListener('load', () => setPre(100), { once: true });
  }

  // Year
  const y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());

  /* ---------- Mobile nav ---------- */
  const burger = $('#burger');
  const mnav = $('#mobileNav');
  const hud = $('.hud');
  const closeMobile = () => {
    burger?.setAttribute('aria-expanded', 'false');
    burger?.classList.remove('is-open');
    mnav?.classList.remove('is-open');
  };

  burger?.addEventListener('click', () => {
    const open = mnav?.classList.toggle('is-open');
    burger.classList.toggle('is-open', !!open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('#mobileNav a').forEach(a => a.addEventListener('click', closeMobile));

  /* ---------- Scroll spy + HUD ---------- */
  const secIds = ['about', 'stack', 'work', 'contact'];
  const navLinks = $$('.nav__a');
  const spy = () => {
    const top = window.scrollY + 140;
    let current = '';
    for (const id of secIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const t = el.offsetTop;
      const h = el.offsetHeight;
      if (top >= t && top < t + h) current = id;
    }
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${current}`));
    hud?.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  /* ---------- Smooth anchor scroll ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    closeMobile();

    const y = el.getBoundingClientRect().top + window.pageYOffset - 92;
    window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    history.pushState(null, '', id);
  });

  /* ---------- Canvas starfield ---------- */
  const canvas = /** @type {HTMLCanvasElement|null} */ ($('#stars'));
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.2 + Math.random() * 0.8,
      r: 0.4 + Math.random() * 1.2,
      tw: Math.random() * Math.PI * 2
    }));

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      g.addColorStop(0, 'rgba(139,92,255,0.08)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        s.tw += 0.012 + s.z * 0.01;
        const a = 0.22 + (Math.sin(s.tw) * 0.12 + 0.12) * s.z;
        const px = s.x * w;
        const py = s.y * h;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (!prefersReduced) {
          s.y += 0.00018 + s.z * 0.00025;
          if (s.y > 1.05) { s.y = -0.05; s.x = Math.random(); }
        }
      }

      if (!prefersReduced) requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    requestAnimationFrame(draw);
  }

  /* ---------- Spark canvas (HUD wave) ---------- */
  const sparkCv = /** @type {HTMLCanvasElement|null} */ ($('#sparkCv'));
  const sparkFps = $('#sparkFps');
  if (sparkCv) {
    const ctx = sparkCv.getContext('2d');
    let w = 0, h = 0;
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let lastT = 0;
    let fps = 60;

    const resize = () => {
      w = sparkCv.clientWidth;
      h = sparkCv.clientHeight;
      sparkCv.width = Math.floor(w * dpr);
      sparkCv.height = Math.floor(h * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t) => {
      if (!ctx) return;

      if (lastT) {
        const dt = t - lastT;
        const cur = 1000 / Math.max(1, dt);
        fps += (cur - fps) * 0.12;
        if (sparkFps) sparkFps.textContent = String(Math.max(30, Math.min(60, Math.round(fps))));
      }
      lastT = t;

      ctx.clearRect(0, 0, w, h);

      const g = ctx.createRadialGradient(w * 0.18, h * 0.35, 0, w * 0.3, h * 0.5, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(139,92,255,0.12)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // grid
      ctx.globalAlpha = 0.10;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      const step = 18;
      for (let x = 0; x <= w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // waveform
      const k = 0.0012;
      const phase = t * k;
      const mid = h * 0.52;
      const amp = h * 0.18;

      ctx.lineWidth = 2.2;
      ctx.strokeStyle = 'rgba(51,255,138,0.92)';
      ctx.shadowColor = 'rgba(51,255,138,0.35)';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const n = Math.sin(phase + x * 0.018) * 0.65 + Math.sin(phase * 1.7 + x * 0.042) * 0.35;
        const y = mid + n * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.shadowBlur = 0;
      const sx = (t * 0.06) % w;
      const sn = Math.sin(phase + sx * 0.018) * 0.65 + Math.sin(phase * 1.7 + sx * 0.042) * 0.35;
      const sy = mid + sn * amp;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(139,92,255,0.85)';
      ctx.arc(sx, sy, 6.4, 0, Math.PI * 2);
      ctx.fill();

      if (!prefersReduced) requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(sparkCv);
    resize();
    requestAnimationFrame(draw);
  }

  /* ---------- Code editors ---------- */
  const CODE_LEFT = [
    "// Пишем интерфейс. Без лишнего шума. Только смысл.",
    "const theme = { accent: ['#8B5CF6', '#00FFA3'], base: '#07070A' }",
    "",
    "// Анимации — мягкие, но заметные",
    "function motion(el, opts = {}) {",
    "  const ease = opts.ease ?? 'cubic-bezier(.2,.8,.2,1)'",
    "  el.animate(opts.keyframes ?? [{opacity:0, transform:'translateY(12px)'},{opacity:1, transform:'translateY(0)'}], {",
    "    duration: opts.duration ?? 420,",
    "    easing: ease,",
    "    fill: 'both'",
    "  })",
    "}",
    "",
    "// Сборка проектов (карточки + модалка)",
    "const projects = loadProjects()",
    "renderGrid(projects)",
    "bindModal({ onOpen: preloadImages })",
    "",
    "// Производительность: изображения + lazy + GPU hints",
    "optimize({",
    "  images: 'webp/avif',",
    "  prefetch: ['fonts','hero'],",
    "  targetFps: 60",
    "})",
    "",
    "// Контакт: Telegram (токен вставишь в конфиг ниже)",
    "sendToTelegram({ name, contact, message })",
  ];

  const CODE_RIGHT = [
    "<!DOCTYPE html>",
    "<html lang=\"ru\">",
    "<head>",
    "  <meta charset=\"UTF-8\">",
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    "  <title>E.PONOMAREV | Tech Noir</title>",
    "  <meta name=\"description\" content=\"Техно‑нуар портфолио фронтенд‑разработчика.\">",
    "  <link rel=\"stylesheet\" href=\"./style.css\">",
    "  <link rel=\"preload\" href=\"./img/logo-mark.svg\" as=\"image\">",
    "</head>",
    "<body class=\"dark-ui\">",
    "  <header class=\"hud\">",
    "    <nav class=\"nav\">",
    "      <a href=\"#hero\">Hero</a>",
    "      <a href=\"#projects\">Projects</a>",
    "      <a href=\"#stack\">Stack</a>",
    "    </nav>",
    "  </header>",
    "",
    "  <main>",
    "    <section id=\"hero\" class=\"hero\">",
    "      <div class=\"wrap\">",
    "        <h1>Делаю сайты...</h1>",
    "      </div>",
    "    </section>",
    "  </main>",
    "",
    "  <script src=\"./script.js\" defer></script>",
    "</body>",
    "</html>"
  ];

  const highlightLine = (line) => {
    const esc = (s) => String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

    let s = esc(line);

    // HTML tags
    if (s.includes('&lt;') || s.includes('&gt;')) {
      s = s.replace(/&lt;(\/?[\w-]+)&gt;/g, '<span class="ct tag">&lt;$1&gt;</span>');
      return s;
    }

    // Comment
    if (s.trim().startsWith('//')) {
      return `<span class="ct cmt">${s}</span>`;
    }

    // Strings
    s = s.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="ct str">$1</span>');
    s = s.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="ct str">$1</span>');

    // Numbers
    s = s.replace(/\b(\d+)(?![\w-])/g, '<span class="ct num">$1</span>');

    // JavaScript keywords
    s = s.replace(/\b(const|let|var|function|return|new|class|async|await|if|else|for|while|switch|case|break|null|true|false)\b/g, '<span class="ct kw">$1</span>');

    // Built-ins
    s = s.replace(/\b(animate|loadProjects|renderGrid|bindModal|optimize|sendToTelegram)\b/g, '<span class="ct fn">$1</span>');

    return s;
  };

  // Initialize both code editors
  const initCodeEditors = () => {
    // Left editor (already in HTML with ID="codeLines")
    const leftEditor = $('#codeLines');
    // Right editor - нужно найти второй редактор
    const rightEditor = $('#codeTyper') || $('.codeEditor__code');
    
    const startTyper = (editor, code, delay = 1000) => {
      if (!editor || prefersReduced) {
        // Show all code instantly
        editor.innerHTML = code.map((line, i) => `
          <div class="codeLine">
            <span class="codeLine__n">${i + 1}</span>
            <span class="codeLine__c">${highlightLine(line)}</span>
          </div>
        `).join('');
        return;
      }

      setTimeout(() => {
        let lineIdx = 0;
        let charIdx = 0;
        let typing = true;

        const speed = { min: 15, max: 40 };
        const linePause = 300;
        const blockPause = 2000;

        const ensureLineEl = (i) => {
          let el = editor.querySelector(`[data-ln="${i}"]`);
          if (el) return el;
          el = document.createElement('div');
          el.className = 'codeLine';
          el.dataset.ln = String(i);
          el.innerHTML = `<span class="codeLine__n">${i + 1}</span><span class="codeLine__c"></span>`;
          editor.appendChild(el);
          editor.scrollTop = editor.scrollHeight;
          return el;
        };

        const type = () => {
          if (lineIdx >= code.length) {
            // Loop animation
            setTimeout(() => {
              editor.innerHTML = '';
              lineIdx = 0;
              charIdx = 0;
              typing = true;
              type();
            }, blockPause);
            return;
          }

          const line = code[lineIdx];
          
          if (typing) {
            const currentText = line.slice(0, charIdx);
            const el = ensureLineEl(lineIdx);
            const content = el.querySelector('.codeLine__c');
            if (content) {
              content.innerHTML = highlightLine(currentText) + `<span class="codeCaret"></span>`;
            }

            charIdx++;

            if (charIdx > line.length) {
              // Finish line
              const el = ensureLineEl(lineIdx);
              const content = el.querySelector('.codeLine__c');
              if (content) {
                content.innerHTML = highlightLine(line);
              }
              
              lineIdx++;
              charIdx = 0;
              typing = false;
              
              setTimeout(() => {
                typing = true;
                type();
              }, linePause);
              return;
            }

            const jitter = speed.min + Math.random() * (speed.max - speed.min);
            setTimeout(type, jitter);
          } else {
            setTimeout(type, linePause);
          }
        };

        type();
      }, delay);
    };

    // Start left editor immediately
    startTyper(leftEditor, CODE_LEFT, 500);
    
    // Start right editor with delay
    if (rightEditor) {
      // Create container for right editor if needed
      const container = document.createElement('div');
      container.className = 'codeEditor__lines';
      container.id = 'codeRight';
      rightEditor.parentElement?.insertBefore(container, rightEditor.nextSibling);
      rightEditor.style.display = 'none';
      
      startTyper(container, CODE_RIGHT, 1200);
    }
  };

  // Initialize on load
  window.addEventListener('load', initCodeEditors);

  /* ---------- Reveal animations ---------- */
  const revealEls = $$('[data-reveal]');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (!ent.isIntersecting) return;
        ent.target.classList.add('is-in');
        io.unobserve(ent.target);
      });
    }, { threshold: 0.18 });

    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Chip info hover ---------- */
  const note = $('#note');
  const noteText = note ? note.querySelector('.note__text') : null;
  const infoChips = $$('.chip--info');

  infoChips.forEach(chip => {
    const noteTextContent = chip.dataset.note || 'Наведи на чип, чтобы увидеть описание.';
    
    chip.addEventListener('mouseenter', () => {
      if (noteText) {
        noteText.textContent = noteTextContent;
        note.classList.add('is-active');
      }
    });
    
    chip.addEventListener('mouseleave', () => {
      if (noteText) {
        noteText.textContent = 'Наведи на чип, чтобы увидеть описание.';
        note.classList.remove('is-active');
      }
    });
    
    chip.addEventListener('click', () => {
      if (noteText) {
        noteText.textContent = `Выбрано: ${noteTextContent}`;
        note.classList.add('is-active');
        setTimeout(() => {
          noteText.textContent = 'Наведи на чип, чтобы увидеть описание.';
          note.classList.remove('is-active');
        }, 1500);
      }
    });
  });

  /* ---------- Projects ---------- */
  const PROJECTS = [
    {
  id: 'komp-grad',
  title: 'Компьютерная грамотность — платформа для детей 7–12 лет',
  type: 'App',
  cover: './img/komp-grad.png',          // <-- скриншот сайта сохрани сюда
  desc: 'Обучающая платформа: от нуля до уверенного пользователя ПК. Устройство компьютера, файлы, Windows, установка программ.',
  tech: ['Next.js', 'TypeScript', 'TailwindCSS', 'shadcn/ui'],
  features: [
    'Пошаговая программа обучения для детей 7–12 лет',
    'Интерактивные уроки: устройство ПК, файлы, папки, Windows',
    'Адаптивный дизайн и доступный интерфейс для детской аудитории',
    'Современный стек: Next.js 14 (App Router), TypeScript, TailwindCSS',
    'Компонентная архитектура с shadcn/ui и иконками Lucide React'
  ],
  links: {
    live: '#',
    repo: 'https://github.com/EvgenyPonomarevNova/komp-grad'
  },
  role: 'Frontend-разработка',
  year: '2026'
},{
  id: 'staircase',
  title: 'Лестницы.pro — производство и обшивка лестниц',
  type: 'Landing',
  cover: './img/staircase.png',          // <-- скриншот сайта сохрани сюда
  desc: 'Лендинг мастерской по производству и обшивке лестниц деревом и плиткой. Портфолио, услуги, отзывы.',
  tech: ['JavaScript', 'HTML', 'CSS'],
  features: [
    'Галерея работ с карточками проектов',
    'Блоки услуг: производство, обшивка деревом, обшивка плиткой',
    'Отзывы клиентов',
    'Карта и контактная информация',
    'Адаптивная вёрстка под мобильные, планшеты и десктоп'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/staircase-atelier/',
    repo: 'https://github.com/EvgenyPonomarevNova/staircase-atelier'
  },
  role: 'Frontend-разработка',
  year: '2026'
},
{
  id: 'plainfield',
  title: 'Plainfield™ — AI-native consulting, UAE',
  type: 'Landing',
  cover: './img/plainfield.png',         // <-- скриншот сайта сохрани сюда
  desc: 'Лендинг AI-консалтинговой компании в ОАЭ: лицензирование, банки, золотые визы, AI-автоматизация.',
  tech: ['JavaScript', 'HTML', 'CSS', 'Анимации'],
  features: [
    'Пошаговая схема: Consult → Analyze → Implement → Optimize',
    'Таймлайн скорости услуг (24h лицензия, 12–24h счета, 12–24h виза)',
    'Секции услуг: лицензирование, банки, Golden Visa, AI Workflow',
    'Минималистичный премиум-дизайн в тёмных тонах',
    'Адаптивная вёрстка под мобильные, планшеты и десктоп'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/Plainfield/',
    repo: 'https://github.com/EvgenyPonomarevNova/Plainfield'
  },
  role: 'Frontend-разработка и анимации',
  year: '2025'
},
    {
      id: 'dlc',
      title: 'Corporate website for JSC Concern DLS',
      type: 'Landing',
      cover: './img/workDLC.png',
      desc: 'Корпоративный сайт: структура, адаптив и строгий визуал с фокусом на скорость и понятную навигацию.',
      tech: ['JavaScript', 'HTML', 'CSS Grid', 'jQuery'],
      features: [
        'Сетка и типографика для больших объёмов контента',
        'Адаптив под мобильные/планшеты/десктопы',
        'Оптимизация загрузки изображений и секций',
        'Интерактивные блоки без перегруза интерфейса'
      ],
      links: { live: 'https://длс.рф/', repo: 'https://github.com/EvgenyPonomarevjs' },
      role: 'Frontend-разработка',
      year: '2024'
    },
    {
      id: 'unison',
      title: 'HC Unison Moscow — ticket landing',
      type: 'Landing',
      cover: './img/127.0.0.1_5501_index.html.png',
      desc: 'Лендинг с акцентом на конверсию и удобство: интеграция, навигация и быстрый рендер.',
      tech: ['JavaScript', 'HTML', 'CSS Grid', 'API'],
      features: [
        'Интеграция с внешними сервисами/данными (API)',
        'Чёткие состояния элементов: hover/focus/active',
        'Сжатие и ленивые изображения для скорости',
        'Адаптивная сетка и аккуратные отступы'
      ],
      links: { live: 'https://hcunison.ru/', repo: 'https://github.com/EvgenyPonomarevjs' },
      role: 'Frontend-разработка',
    year: '2024'
    },
{
  id: 'growth-lab',
  title: 'Growth Laboratory — digital‑агентство',
  type: 'Landing',
  cover: './img/growth-lab.png',          // <-- скриншот сайта сохрани сюда
  desc: 'Лендинг digital‑агентства: стратегия, performance, SEO, BI и интерактивный график роста.',
  tech: ['JavaScript', 'HTML', 'CSS', 'Анимации'],
  features: [
    'Интерактивный график роста с прилипающей подсказкой',
    'Аккордеон преимуществ с плавным раскрытием',
    'Сетка услуг и кейсов с карточками‑ссылками',
    'Адаптивная вёрстка под мобильные, планшеты и десктоп',
    'Чистая типографика, техно‑минимализм и акцентные CTA'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/landing-page-growth-laboratory-v2/',
    repo: 'https://github.com/EvgenyPonomarevNova/landing-page-growth-laboratory-v2',
    role: 'Frontend-разработка',
    year: '2026'
  }
},
{
  id: 'top-server',
  title: 'Tales Of Pirates — private server landing',
  type: 'Landing',
  cover: './img/top-server.png',          // <-- скриншот сайта сохрани сюда
  desc: 'Лендинг пиратского MMORPG‑сервера: сообщество, серверные статы, крю‑механики, прогрессия и бета‑регистрация.',
  tech: ['JavaScript', 'HTML', 'CSS', 'Анимации'],
  features: [
    'Доска серверных статов (EXP, Drop, Gold, Balance)',
    'Бета‑форма регистрации с волнами приглашений',
    'Блоки концепции сервера с аккордеоном',
    'Секции для комьюнити, Discord‑CTA, анти‑чит фичи',
    'Адаптивная вёрстка под мобильные, планшеты и десктоп'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/Tales-Of-Pirates/',
    repo: 'https://github.com/EvgenyPonomarevNova/Tales-Of-Pirates',
    role: 'Frontend-разработка и анимации',
    year: '2026',
  }
},
{
  id: 'shield-auto',
  title: 'Щиты автоматизации — ТехноИмпериум',
  type: 'Landing',
  cover: './img/shield-auto.png',          // <-- скриншот сайта сохрани сюда
  desc: 'Корпоративный сайт группы компаний: проектирование, монтаж, пусконаладка котельных и щитов автоматизации.',
  tech: ['JavaScript', 'HTML', 'CSS', 'Strapi CMS'],
  features: [
    'Многостраничная структура с описанием услуг ГК',
    'Формы обратного звонка и заявок',
    'Адаптивная вёрстка под мобильные, планшеты и десктоп',
    'Подключение Strapi CMS для управления контентом',
    'Чистая типографика и строгий корпоративный стиль'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/Shield-Automation/',
    repo: 'https://github.com/EvgenyPonomarevNova/Shield-Automation'
  },
  role: 'Frontend-разработка',
  year: '2026'
},
{
  id: 'master-wash',
  title: 'МастерСтирка — профессиональная стирка для бизнеса',
  type: 'Landing',
  cover: './img/master-wash.png',          // <-- скриншот сайта сохрани сюда
  desc: 'Лендинг прачечной для отелей, ресторанов, фитнес-клубов и медучреждений: услуги, цены, процесс работы и заявки.',
  tech: ['JavaScript', 'HTML', 'CSS'],
  features: [
    'Пошаговая схема работы (заявка → расчёт → забор → возврат)',
    'Блок FAQ с аккордеоном',
    'Форма обратной связи с чекбоксами согласий',
    'Секции для разных типов клиентов (отели, рестораны, фитнес)',
    'Адаптивная вёрстка под мобильные, планшеты и десктоп'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/Remont.info/',
    repo: 'https://github.com/EvgenyPonomarevNova/Remont.info'
  },
  role: 'Frontend-разработка',
  year: '2026'
},{
  id: 'arhistratig',
  title: 'Архистратиг — Рождественские подарки детям Донбасса',
  type: 'Landing',
  cover: './img/arhistratig.png',          // <-- скриншот сайта сохрани сюда
  desc: 'Благотворительный лендинг: выбери ребёнка, узнай его мечту и оплати подарок онлайн. Фонд доставит и пришлёт фотоотчёт.',
  tech: ['JavaScript', 'HTML', 'CSS', 'Анимации'],
  features: [
    'Карточки детей с описанием мечты и стоимостью подарка',
    'Пошаговая схема: выбор → оплата → закупка → доставка → фотоотчёт',
    'Безопасный платёж онлайн (карта, СБП)',
    'Счётчик детей, ждущих подарок, и средняя стоимость подарка',
    'Адаптивная вёрстка под мобильные, планшеты и десктоп'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/ArhistratigChristmasDonbas/',
    repo: 'https://github.com/EvgenyPonomarevNova/ArhistratigChristmasDonbas'
  },
  role: 'Frontend-разработка',
  year: '2026'
},
{
  id: 'invest-belarus',
  title: 'М1 — инвестиции в недвижимость Беларуси',
  type: 'App',
  cover: './img/invest-belarus.png',      // <-- скриншот сайта сохрани сюда
  desc: 'Корпоративный сайт инвестиционной компании: аналитика рынка, кейсы, пошаговая схема работы и формы захвата.',
  tech: ['JavaScript', 'HTML', 'CSS', 'Анимации'],
  features: [
    'Многостраничная структура: аналитика, кейсы, услуги, контакты',
    'Инвестиционные кейсы с детальной калькуляцией и результатами',
    'Пошаговая схема работы: стратегия → подбор → сделка → управление → доход',
    'Ключевые метрики рынка (товарооборот, инвестиции, рост стоимости)',
    'Формы захвата с международными кодами стран'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/invest/',
    repo: 'https://github.com/EvgenyPonomarevNova/invest'
  },
  role: 'Frontend-разработка',
  year: '2026'
},
{
  id: 'harvester-energy',
  title: 'Harvester Energy — энерго кластер для дата-центров',
  type: 'Landing',
  cover: './img/harvester-energy.png',   // <-- скриншот сайта сохрани сюда
  desc: 'Лендинг энерго кластера для операторов ЦОД: презентация проекта и форма захвата лидов.',
  tech: ['JavaScript', 'HTML', 'CSS'],
  features: [
    'Минималистичный лендинг с акцентом на конверсию',
    'Модальная форма захвата (имя, телефон, компания)',
    'Адаптивная вёрстка под мобильные, планшеты и десктоп'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/Harvester-Energy/',
    repo: 'https://github.com/EvgenyPonomarevNova/Harvester-Energy'
  },
  role: 'Frontend-разработка',
  year: '2026'
},{
  id: 'plumbing',
  title: 'Главная страница магазина сантехники',
  type: 'Landing',
  cover: './img/plumbing.png',            // <-- скриншот сайта сохрани сюда
  desc: 'Лендинг магазина сантехники: каталог товаров, акции, отзывы и корпоративная информация.',
  tech: ['JavaScript', 'HTML', 'CSS'],
  features: [
    'Карточки товаров с характеристиками (размер, цвет, страна)',
    'Акционный блок со скидкой и CTA',
    'Блок отзывов клиентов',
    'Секции «О нас», услуги, контакты',
    'Адаптивная вёрстка под мобильные, планшеты и десктоп'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/the-main-page-of-the-Plumbing-site/',
    repo: 'https://github.com/EvgenyPonomarevNova/the-main-page-of-the-Plumbing-site'
  },
  role: 'Frontend-разработка',
  year: '2026'
},{
  id: '1win',
  title: 'Рабочее зеркало 1win — без блокировок и лагов 24/7',
  type: 'Landing',
  cover: './img/1win.png',               // <-- скриншот сайта сохрани сюда
  desc: 'Информационный лендинг: доступ к рабочему зеркалу 1win, бонус +500% к депозиту, инструкции по входу и безопасности.',
  tech: ['JavaScript', 'HTML', 'CSS'],
  features: [
    'Промоблок с бонусом +500% и промокодом',
    'Инструкции по входу, регистрации и настройке профиля',
    'Советы по безопасности (замок в браузере, двухфакторка)',
    'Адаптивная вёрстка под мобильные, планшеты и десктоп'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/1win-landing-page/',
    repo: 'https://github.com/EvgenyPonomarevNova/1win-landing-page'
  },
  role: 'Frontend-разработка',
  year: '2026'
},{
  id: 'wedding-tickets',
  title: 'Поздравительный сайт — билеты в свадебное путешествие',
  type: 'Landing',
  cover: './img/wedding-tickets.png',    // <-- скриншот сайта сохрани сюда
  desc: 'Креативный поздравительный лендинг для родителей: стилизованные посадочные талоны и тёплые пожелания.',
  tech: ['JavaScript', 'HTML', 'CSS', 'Анимации'],
  features: [
    'Стилизация под авиабилеты (пункт отправления, назначения, дата)',
    'Тёплый поздравительный текст с юмором',
    'Анимации и атмосферное оформление',
    'Адаптивная вёрстка под мобильные, планшеты и десктоп'
  ],
  links: {
    live: 'https://evgenyponomarevnova.github.io/congratulations-website/',
    repo: 'https://github.com/EvgenyPonomarevNova/congratulations-website'
  },
  role: 'Frontend-разработка и анимации',
  year: '2026'
},
  ];

  const workGrid = $('#workGrid');
  const modal = /** @type {HTMLDialogElement|null} */ ($('#projectModal'));

  const escapeHtml = (s) => String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const icon = (name) => {
    const map = {
      ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"/></svg>',
      git: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.77.61-3.35-1.17-3.35-1.17-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.64-1.33-2.21-.25-4.53-1.1-4.53-4.9 0-1.08.39-1.96 1.03-2.65-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.01A9.6 9.6 0 0 1 12 6.8c.85 0 1.71.12 2.51.34 1.9-1.28 2.74-1.01 2.74-1.01.56 1.38.21 2.4.1 2.65.64.69 1.03 1.57 1.03 2.65 0 3.81-2.33 4.64-4.55 4.88.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>'
    };
    return map[name] || '';
  };

  const renderProjects = (filter = 'All') => {
    if (!workGrid) return;
    workGrid.innerHTML = '';

    const list = PROJECTS.filter(p => filter === 'All' ? true : p.type === filter);

    list.forEach((p, idx) => {
      const card = document.createElement('article');
      card.className = 'pCard';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Открыть проект: ${p.title}`);
      card.dataset.id = p.id;
      card.style.setProperty('--d', `${Math.min(180, idx * 40)}ms`);

      card.innerHTML = `
        <div class="pCard__media">
          <img src="${p.cover}" alt="${escapeHtml(p.title)}" loading="lazy" decoding="async" />
          <div class="pCard__shine" aria-hidden="true"></div>
          <span class="pCard__type">${p.type}</span>
        </div>
        <div class="pCard__body">
          <h3 class="pCard__t">${escapeHtml(p.title)}</h3>
          <p class="pCard__d">${escapeHtml(p.desc)}</p>
          <div class="pCard__tags">${p.tech.slice(0, 4).map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>
          <div class="pCard__go">Открыть →</div>
        </div>
      `;

      workGrid.appendChild(card);

      requestAnimationFrame(() => card.classList.add('is-in'));
      attachTilt(card);

      const open = () => openProject(p.id);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  };

  /* ---------- Filters ---------- */
  const filterBtns = $$('.fbtn');
  const hudChips = $$('.hudCard .chip');

  const setFilter = (f) => {
    filterBtns.forEach(b => b.classList.toggle('is-active', b.dataset.filter === f));
    renderProjects(f);
    toast(`filter: ${f}`);
  };

  filterBtns.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter || 'All')));
  hudChips.forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.filter || 'All';
    setFilter(f);
    const work = $('#work');
    if (work) {
      const y = work.getBoundingClientRect().top + window.pageYOffset - 92;
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
      history.pushState(null, '', '#work');
    }
  }));

  /* ---------- Modal ---------- */
  let lastFocus = null;
  const mK = $('#mK');
  const mT = $('#mT');
  const mD = $('#mD');
  const mMedia = $('#mMedia');
  const mTech = $('#mTech');
  const mHi = $('#mHi');
  const mMeta = $('#mMeta');
  const mLinks = $('#mLinks');

  const openProject = (id) => {
    const p = PROJECTS.find(x => x.id === id);
    if (!p || !modal) return;

    lastFocus = document.activeElement;

    if (mK) mK.textContent = p.type;
    if (mT) mT.textContent = p.title;
    if (mD) mD.textContent = p.desc;

    if (mMedia) {
      mMedia.innerHTML = `
        <div class="mediaFrame">
          <img src="${p.cover}" alt="${escapeHtml(p.title)}" loading="eager" decoding="async" />
        </div>
      `;
    }

    if (mTech) {
      mTech.innerHTML = p.tech.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    }

    if (mHi) {
      mHi.innerHTML = p.features.map(h => `<li>${escapeHtml(h)}</li>`).join('');
    }

    if (mMeta) {
      mMeta.innerHTML = `
        <div class="mMeta__row"><span>Роль</span><b>${escapeHtml(p.role || 'Frontend')}</b></div>
        <div class="mMeta__row"><span>Год</span><b>${escapeHtml(p.year || '—')}</b></div>
      `;
    }

    if (mLinks) {
      const live = p.links?.live && p.links.live !== '#'
        ? `<a class="linkBtn linkBtn--live" href="${p.links.live}" target="_blank" rel="noreferrer">${icon('ext')}<span>Live</span></a>`
        : `<button class="linkBtn linkBtn--disabled" type="button" disabled>${icon('ext')}<span>Live</span></button>`;
      const repo = p.links?.repo
        ? `<a class="linkBtn linkBtn--repo" href="${p.links.repo}" target="_blank" rel="noreferrer">${icon('git')}<span>GitHub</span></a>`
        : '';
      mLinks.innerHTML = live + repo;
    }

    modal.showModal();
    document.body.classList.add('is-locked');

    const closeBtn = modal.querySelector('button[data-close]');
    closeBtn?.focus?.();

    if (!prefersReduced) {
      const panel = modal.querySelector('.modal__panel');
      panel?.animate(
        [{ transform: 'translateY(12px) scale(.98)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1 }],
        { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    }
  };

  const closeModal = () => {
    if (!modal || !modal.open) return;
    modal.close();
    document.body.classList.remove('is-locked');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    lastFocus = null;
  };

  modal?.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.closest('[data-close]')) closeModal();
  });
  modal?.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(); });

  /* ---------- Command palette ---------- */
  const cmd = /** @type {HTMLDialogElement|null} */ ($('#cmd'));
  const cmdBtn = $('#cmdBtn');
  const cmdInput = /** @type {HTMLInputElement|null} */ ($('#cmdInput'));
  const cmdList = $('#cmdList');

  const jump = (hash) => {
    const el = document.querySelector(hash);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 92;
    window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    history.pushState(null, '', hash);
  };

  const COMMANDS = [
    { key: 'top', label: 'Наверх', action: () => jump('#top') },
    { key: 'about', label: 'Обо мне', action: () => jump('#about') },
    { key: 'stack', label: 'Стек', action: () => jump('#stack') },
    { key: 'projects', label: 'Проекты', action: () => jump('#work') },
    { key: 'contact', label: 'Контакты', action: () => jump('#contact') },
    { key: 'filter:landing', label: 'Фильтр: Landing', action: () => setFilter('Landing') },
    { key: 'filter:app', label: 'Фильтр: App', action: () => setFilter('App') },
    { key: 'filter:webgl', label: 'Фильтр: WebGL', action: () => setFilter('WebGL') },
    { key: 'filter:all', label: 'Фильтр: All', action: () => setFilter('All') },
  ];

  const openCmd = () => {
    if (!cmd) return;
    cmd.showModal();
    document.body.classList.add('is-locked');
    renderCmd('');
    cmdInput?.focus();
  };
  const closeCmd = () => {
    if (!cmd || !cmd.open) return;
    cmd.close();
    document.body.classList.remove('is-locked');
    cmdInput && (cmdInput.value = '');
  };

  cmdBtn?.addEventListener('click', openCmd);
  cmd?.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.closest('[data-close]')) closeCmd();
  });
  cmd?.addEventListener('cancel', (e) => { e.preventDefault(); closeCmd(); });

  const renderCmd = (q) => {
    if (!cmdList) return;
    const query = q.trim().toLowerCase();
    const items = COMMANDS.filter(c => !query || c.key.includes(query) || c.label.toLowerCase().includes(query));

    cmdList.innerHTML = items.map((c, i) => `
      <button class="cmdItem ${i === 0 ? 'is-active' : ''}" type="button" role="option" data-i="${i}">
        <span class="cmdItem__k">${escapeHtml(c.key)}</span>
        <span class="cmdItem__l">${escapeHtml(c.label)}</span>
      </button>
    `).join('');

    $$('.cmdItem', cmdList).forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.i || '0');
        const item = items[i];
        closeCmd();
        item?.action?.();
      });
    });

    cmdList._items = items;
    cmdList._active = 0;
  };

  cmdInput?.addEventListener('input', () => renderCmd(cmdInput.value));
  cmdInput?.addEventListener('keydown', (e) => {
    if (!cmdList) return;
    const items = cmdList._items || [];
    let a = cmdList._active || 0;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      a = Math.min(items.length - 1, a + 1);
      setCmdActive(a);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      a = Math.max(0, a - 1);
      setCmdActive(a);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      closeCmd();
      items[a]?.action?.();
    }
  });

  const setCmdActive = (idx) => {
    if (!cmdList) return;
    const btns = $$('.cmdItem', cmdList);
    btns.forEach((b, i) => b.classList.toggle('is-active', i === idx));
    cmdList._active = idx;
    btns[idx]?.scrollIntoView({ block: 'nearest' });
  };

  /* ---------- Global hotkeys ---------- */
  window.addEventListener('keydown', (e) => {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCmd();
    }

    if (e.key === 'Escape') {
      if (modal?.open) closeModal();
      if (cmd?.open) closeCmd();
      closeMobile();
    }
  });

  /* ---------- Magnetic button ---------- */
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      if (prefersReduced) return;
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      btn.style.transform = `translate(${x * 10}px, ${y * 8}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

  /* ---------- Tilt + shine for project cards ---------- */
  const attachTilt = (card) => {
    const shine = card.querySelector('.pCard__shine');
    if (!shine || prefersReduced) return;

    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -6;
      const ry = (px - 0.5) * 8;
      card.style.transform = `translateY(-6px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      shine.style.opacity = '1';
      shine.style.setProperty('--mx', `${px * 100}%`);
      shine.style.setProperty('--my', `${py * 100}%`);
    };
    const reset = () => {
      card.style.transform = '';
      shine.style.opacity = '';
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', reset);
  };

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer = null;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 1400);
  };

  /* ---------- Contact form ---------- */
  const form = /** @type {HTMLFormElement|null} */ ($('#contactForm'));
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const contact = String(fd.get('email') || '').trim();
    const message = String(fd.get('message') || '').trim();

    if (!name || !contact || !message) {
      toast('Заполни все поля');
      return;
    }

    // Демо-версия: mailto (реальную отправку настрой позже)
    const subject = `Запрос с портфолио: ${name}`;
    const body = `Имя: ${name}%0D%0AEmail: ${contact}%0D%0A%0D%0AСообщение:%0D%0A${message}`;
    
    window.open(`mailto:ponomareve45@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    
    toast('Открываю почтовый клиент...');
    form.reset();
  });

  // CV button (optional)
  $('#downloadBtn')?.addEventListener('click', () => {
    // Замени ссылку на свой CV
    const cvLink = '#'; // Вставь сюда ссылку на CV
    if (cvLink && cvLink !== '#') {
      window.open(cvLink, '_blank');
      toast('Скачиваю CV...');
    } else {
      toast('Добавь ссылку на CV в script.js');
    }
  });

  // Initial render
  renderProjects('All');
})();