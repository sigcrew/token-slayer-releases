// 용사 전투 장면 — 서비스(에이전트)마다 용사 한 명, 가로 레인 하나. 전부 도트로 그린다.
//  · 토큰을 쓰는 중: 오른쪽에서 코드 조각이 날아오고 용사가 칼로 벤다
//  · 쉬는 중: 칼을 땅에 꽂고 모닥불 앞에서 쉰다
//  · 사용량이 줄면: 코드 하나가 방어를 뚫고 용사를 때린다 (-N%)
//  · 0%: 묘비 + 유령, GAME OVER, 부활(리셋)까지 남은 시간
//  · 다시 채워지면: HP 포션을 마시고 기운을 차린다 (+N%)
(function () {
  const PX = 3;          // 스프라이트 픽셀 = 3 CSS px
  const FS = 2;          // 도트 글꼴 픽셀 = 2 CSS px
  const LANE_H = 56;
  const PAD = 6;

  const INK = '#171522';
  const BODY = '#FFF1DC';
  const SHADE = '#F3CFA6';
  const CHEEK = '#FF9DA7';
  const STEEL = '#C3CCDB', STEEL_D = '#7E8AA3', STEEL_H = '#F2F5FA';
  const BLADE = '#E8ECF4';
  const GOLD = '#FFD166';
  const UI_BG = '#141626', UI_EDGE = '#2C3150', UI_HI = '#3B4270';

  // ── 3x5 도트 글꼴 ──
  const G = {
    "A": '.#.#.#####.##.#',
    "B": '##.#.###.#.###.',
    "C": '.###..#..#...##',
    "D": '##.#.##.##.###.',
    "E": '####..##.#..###',
    "F": '####..##.#..#..',
    "G": '.###..#.##.#.##',
    "H": '#.##.#####.##.#',
    "I": '###.#..#..#.###',
    "J": '..#..#..##.#.#.',
    "K": '#.##.###.#.##.#',
    "L": '#..#..#..#..###',
    "M": '#.########.##.#',
    "N": '##.#.##.##.##.#',
    "O": '.#.#.##.##.#.#.',
    "P": '##.#.###.#..#..',
    "Q": '.#.#.##.###..##',
    "R": '##.#.###.#.##.#',
    "S": '.###...#...###.',
    "T": '###.#..#..#..#.',
    "U": '#.##.##.##.####',
    "V": '#.##.##.##.#.#.',
    "W": '#.##.########.#',
    "X": '#.##.#.#.#.##.#',
    "Y": '#.##.#.#..#..#.',
    "Z": '###..#.#.#..###',
    "0": '####.##.##.####',
    "1": '.#.##..#..#.###',
    "2": '##...#.#.#..###',
    "3": '##...#.#...###.',
    "4": '#.##.####..#..#',
    "5": '####..##...###.',
    "6": '.###..####.####',
    "7": '###..#.#..#..#.',
    "8": '####.#####.####',
    "9": '####.####..###.',
    "%": '##..###.#...#...#.###..##',
    ":": '....#.....#....',
    ".": '.............#.',
    "/": '..#..#.#.#..#..',
    "<": '..#.#.#...#...#',
    ">": '#...#...#.#.#..',
    "{": '.##.#.#...#..##',
    "}": '##..#...#.#.##.',
    "[": '##.#..#..#..##.',
    "]": '.##..#..#..#.##',
    "(": '.#.#..#..#...#.',
    ")": '.#...#..#..#.#.',
    ";": '....#.....#.#..',
    "=": '...###...###...',
    "!": '.#..#..#.....#.',
    "&": '.#.#.#.#.#.#.##',
    "-": '......###......',
    "+": '....#.###.#....',
    "?": '##...#.#.....#.',
    "_": '............###',
    " ": '...............',
  };

  // ── 스프라이트 ──
  // 용사 (오른쪽을 봄) 12 x 12 — m: 강철 투구, M: 챙, h: 광택, c/C: 깃털(서비스 색)
  const HERO = [
    '....cc......',
    '...cCcc.....',
    '....oooo....',
    '..oohmmmoo..',
    '.ohmmmmmmmo.',
    '.ommmmmmmmo.',
    'oMMMMMMMMMMo',
    'owwwwwwwwwwo',
    'owwwwwwwwwwo',
    'oswwwwwwwwso',
    '.osssssssso.',
    '..oooooooo..',
  ];
  const TOMB = [
    '..oooooo..',
    '.oggggggo.',
    'ogggoogggo',
    'oggooooggo',
    'ogggoogggo',
    'ogggoogggo',
    'oggggggggo',
    'oggggggggo',
    'oGGGGGGGGo',
    'oooooooooo',
  ];
  const GHOST = ['.www.', 'wwwww', 'wewew', 'wwwww', 'wwwww', 'w.w.w'];
  const FLAME = [
    ['..y..', '.yfy.', '.fff.', 'frrrf'],
    ['.y...', '.fy..', '.ffy.', 'frrrf'],
    ['...y.', '..yf.', '.yff.', 'frrrf'],
  ];
  const FIRE = { y: '#FFE066', f: '#FF9F1C', r: '#FF4D2E', b: '#8B5A2B', B: '#5E3A1A' };
  const HEART = ['.#.#.', '#####', '#####', '.###.', '..#..'];

  // 팩이 없을 때 쓰는 기본값 (packs/*.json 의 knight · code · campfire 와 같음)
  const DEFAULT_HERO = { id: 'knight', grid: HERO, weapon: 'sword', palette: { m: STEEL, M: STEEL_D, h: STEEL_H } };
  const DEFAULT_ENEMIES = {
    id: 'code',
    texts: ['{}', '</>', 'IF', '=>', ';;', '0X1F', 'NULL', 'NPM', '[]', '&&', 'FN()', '!=='],
    colors: ['#FF7AA8', '#7CC7FF', '#B8F28D', '#FFCB6B', '#D29BFF', '#89DDFF'],
    fatal: ['BUG', '429', 'ERR'],
  };
  const DEFAULT_REST = { id: 'campfire', frames: FLAME.map((f) => [...f, 'BbbbB', '.BbB.']), palette: FIRE, glow: '#FF9F1C', embers: true };
  const RANGED = { staff: true, bow: true, shuriken: true };

  function hex2rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  const darken = (hex, f) => { const [r, g, b] = hex2rgb(hex); return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`; };
  const lighten = (hex, f) => { const [r, g, b] = hex2rgb(hex); const c = (v) => Math.round(v + (255 - v) * f); return `rgb(${c(r)},${c(g)},${c(b)})`; };
  const hpColor = (hp) => (hp > 50 ? '#5BE37D' : hp > 20 ? '#FFD23F' : hp > 5 ? '#FF9A3C' : '#FF4D5A');
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  class Hero {
    constructor(meta) {
      this.id = meta.id;
      this.name = meta.name;
      this.color = meta.color;
      this.hp = null;
      this.hpShown = null;
      this.hpGhost = null;
      this.ghostHold = 0;
      this.busy = false;
      this.alert = false;
      this.question = false;
      this.resetAt = null;
      this.enemies = [];
      this.spawnIn = 0.5;
      this.swingT = 0;
      this.hitT = 0;
      this.potionT = 0;
      this.potionAmt = 0;
      this.parts = [];
      this.floaters = [];
      this.blinkIn = rand(1.5, 4);
      this.blinkT = 0;
      this.sweatIn = 0;
      this.standT = 0;
      this.time = rand(0, 10);
      this.shots = [];
      this.level = null;
      this.levelProgress = 0;
      this.burning = false;
      this.levelUpT = 0;
      this.jumpT = 0;
      this.angryT = 0;
      this.pokes = [];
      this.skin = DEFAULT_HERO;
      this.pal();
    }

    setSkin(pack) {
      this.skin = pack && pack.grid ? pack : DEFAULT_HERO;
      this.pal();
    }

    pal() {
      const sp = this.skin.palette || {};
      this.P = { o: INK, w: BODY, s: SHADE, ...sp, c: this.color, C: darken(this.color, 0.65) };
      // 맞았을 때: 몸과 장비를 붉게
      const tint = (hex) => { try { const [r, g, b] = hex2rgb(hex); return `rgb(${Math.min(255, r + 70)},${Math.round(g * 0.6)},${Math.round(b * 0.6)})`; } catch { return hex; } };
      this.PH = { ...this.P, w: '#FFC9C9', s: '#F09C9C' };
      for (const k of Object.keys(sp)) if (/^#/.test(sp[k])) this.PH[k] = tint(sp[k]);
    }

    get dead() { return this.hp != null && this.hp <= 0.5 && !this.enemies.some((e) => e.fatal); }
    get resting() { return !this.busy && !this.dead && this.hp != null && !this.alert && !this.enemies.some((e) => e.fatal); }
  }

  class Scene {
    constructor(canvas) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.heroes = [];
      this.time = 0;
      this.enemyTheme = DEFAULT_ENEMIES;
      this.restTheme = DEFAULT_REST;
      this.backdrop = null;
      this.skins = {};
      this.resize();
    }

    // 꾸미기: { skins: { 서비스id: 용사팩 }, enemies: 적팩, rest: 휴식팩 }
    setTheme(t) {
      if (t.backdrop !== undefined) {
        const b = t.backdrop;
        this.backdrop = b && !b.plain && b.sky && window.Backdrop ? new window.Backdrop(b) : null;
      }
      if (t.enemies !== undefined) this.enemyTheme = t.enemies && t.enemies.texts ? t.enemies : DEFAULT_ENEMIES;
      if (t.rest !== undefined) this.restTheme = t.rest && t.rest.frames ? t.rest : DEFAULT_REST;
      if (t.skins) {
        this.skins = t.skins;
        for (const h of this.heroes) h.setSkin(this.skins[h.id]);
      }
    }

    height() { return this.heroes.length ? this.heroes.length * LANE_H + PAD * 2 : 0; }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      this.w = this.c.clientWidth || 232;
      this.h = this.height() || 1;
      this.c.style.height = `${this.h}px`;
      this.c.width = Math.round(this.w * dpr);
      this.c.height = Math.round(this.h * dpr);
      // 확대/축소(창 크기 설정) 때도 도트가 뭉개지지 않도록, 좌표를 직접 화면 픽셀로 바꿔 그린다
      this.T = dpr;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
    }

    setHeroes(metas) {
      const key = metas.map((m) => m.id).join(',');
      if (key === this.key) {
        for (const m of metas) { const h = this.get(m.id); if (h && h.color !== m.color) { h.color = m.color; h.pal(); } }
        return;
      }
      this.key = key;
      const old = new Map(this.heroes.map((h) => [h.id, h]));
      this.heroes = metas.map((m) => old.get(m.id) || new Hero(m));
      for (const h of this.heroes) h.setSkin(this.skins[h.id]);
      this.resize();
    }

    get(id) { return this.heroes.find((h) => h.id === id); }

    setState(id, s) {
      const h = this.get(id);
      if (!h) return;
      if (s.hp !== undefined) {
        if (h.hp == null && s.hp != null) { h.hpShown = s.hp; h.hpGhost = s.hp; }
        h.hp = s.hp;
      }
      if (s.busy !== undefined) {
        if (s.busy && !h.busy) h.standT = 0.35;
        if (!s.busy) h.enemies = h.enemies.filter((e) => e.fatal);
        h.busy = s.busy;
      }
      if (s.alert !== undefined) h.alert = s.alert;
      if (s.question !== undefined) h.question = s.question;
      if (s.resetAt !== undefined) h.resetAt = s.resetAt;
      if (s.burning !== undefined) h.burning = s.burning;
      if (s.eta !== undefined) { h.eta = s.eta; h.etaAt = Date.now(); }
      if (s.levelProgress !== undefined) h.levelProgress = s.levelProgress || 0;
      if (s.level !== undefined && s.level != null) {
        if (h.level != null && s.level > h.level) this.levelUp(h, s.level);
        h.level = s.level;
      }
    }

    // 클릭한 위치의 용사 (레인 안 용사 그림 근처)
    heroAt(x, y) {
      const i = Math.floor((y - PAD) / LANE_H);
      const h = this.heroes[i];
      if (!h) return null;
      return x >= 2 && x <= 10 + 15 * PX ? h : null;
    }

    // 용사를 쓰다듬었을 때 반응
    poke(h) {
      const now = this.time;
      h.pokes = h.pokes.filter((t) => now - t < 2).concat(now);
      const i = this.heroes.indexOf(h);
      const ground = this.laneTop(i) + LANE_H - 7;
      const fx = 10 + 22 * PX, fy = ground - 22;
      const say = (text, color) => h.floaters.push({ text, x: fx, y: fy, life: 1.2, max: 1.2, color });
      if (h.dead) { say('BOO!', '#EDEFFF'); return 'boo'; }
      if (h.pokes.length >= 5) {
        h.angryT = 1.2;
        h.pokes = [];
        say('STOP!', '#FF4D5A');
        return 'angry';
      }
      h.jumpT = 0.45;
      if (h.resting) { say('?!', '#FFD166'); return 'pet'; }
      say(pick(['HI!', 'HEY!', 'YAY!', 'GO!']), pick(['#FFD166', '#7CC7FF', '#B8F28D', '#FF7AA8']));
      for (let k = 0; k < 3; k++) h.parts.push({ x: 10 + 6 * PX + rand(-8, 8), y: ground - 14 * PX, vx: rand(-20, 20), vy: rand(-60, -40), life: 0.9, max: 0.9, color: '#FF5C8A', heart: true, grav: 40 });
      return 'pet';
    }

    // 드래곤은 전설급: 적 하나당 1/60000, 한 번 나오면 7일은 안 나옴 (앱을 다시 켜도 유지)
    dragonReady() {
      if (this.dragonNext == null) {
        try { this.dragonNext = Number(localStorage.getItem('tb.dragonNext')) || 0; } catch { this.dragonNext = 0; }
      }
      return Date.now() >= this.dragonNext;
    }
    dragonSeen() {
      this.dragonNext = Date.now() + 7 * 86400e3;
      try { localStorage.setItem('tb.dragonNext', String(this.dragonNext)); } catch {}
    }

    // 드래곤 처치: 큰 폭발 + 알림
    slayDragon(h, e, ground) {
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        h.parts.push({ x: e.x, y: ground - 14, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110 - 30, life: 1.2, max: 1.2, color: k % 3 ? '#FF4D2E' : GOLD, grav: 60 });
      }
      h.floaters.push({ text: 'DRAGON SLAIN!', x: this.w / 2 + 20, y: ground - 24, life: 2.2, max: 2.2, color: GOLD });
      if (this.onEvent) this.onEvent('dragon', h.id);
    }

    // LEVEL UP 연출
    levelUp(h, level) {
      h.levelUpT = 2.2;
      const i = this.heroes.indexOf(h);
      const ground = this.laneTop(i) + LANE_H - 7;
      h.floaters.push({ text: 'LEVEL UP!', x: 10 + 20 * PX, y: ground - 20, life: 2, max: 2, color: GOLD });
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        h.parts.push({ x: 10 + 6 * PX, y: ground - 7 * PX, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70 - 30, life: 1, max: 1, color: k % 2 ? GOLD : '#FFFFFF', grav: 80 });
      }
    }

    // 줄어든 만큼 1%짜리 공격이 여러 번 들어온다 (한 번에 너무 많으면 최대 8번으로 나눔)
    hit(id, delta) {
      const h = this.get(id);
      if (!h) return;
      if (delta < 1) {
        // 1%보다 적게 줄었으면 한 방만 (소수점 한 자리)
        h.enemies.push({ x: this.w - 24, text: pick(this.enemyTheme.fatal || DEFAULT_ENEMIES.fatal), color: '#FF4D5A', speed: 200, fatal: true, delta: Math.max(0.1, Math.round(delta * 10) / 10), bob: 0 });
        return;
      }
      const n = Math.max(1, Math.min(8, Math.round(delta)));
      let left = Math.max(1, Math.round(delta));
      for (let k = 0; k < n; k++) {
        const d = k === n - 1 ? left : Math.max(1, Math.floor(delta / n));
        left -= d;
        h.enemies.push({ x: this.w - 24 + k * 44, text: pick(this.enemyTheme.fatal || DEFAULT_ENEMIES.fatal), color: '#FF4D5A', speed: 200, fatal: true, delta: d, bob: 0 });
      }
    }

    heal(id, delta) {
      const h = this.get(id);
      if (!h) return;
      h.potionT = 1.9;
      h.potionAmt = delta;
      h.enemies = [];
    }

    laneTop(i) { return PAD + i * LANE_H; }

    update(dt) {
      this.time += dt;
      if (this.backdrop) this.backdrop.update(dt, this.backdropGeom());
      this.heroes.forEach((h, i) => this.updateHero(h, i, dt));
    }

    backdropGeom() {
      return {
        w: this.w, h: this.h, T: this.T,
        lanes: this.heroes.map((_, i) => ({ top: this.laneTop(i), ground: this.laneTop(i) + LANE_H - 7, bottom: this.laneTop(i) + LANE_H })),
      };
    }

    updateHero(h, i, dt) {
      h.time += dt;
      const top = this.laneTop(i);
      const ground = top + LANE_H - 7;
      const heroX = 10;
      const wpn = h.skin.weapon || 'sword';
      const reach = heroX + 12 * PX + (wpn === 'katana' ? 24 : 18);
      const ranged = !!RANGED[wpn];

      // 아직 날아오는 중인 공격만큼은 HP가 덜 깎인 것으로 보여줌 (맞는 순간 깎임)
      const pending = h.enemies.reduce((a, e) => a + (e.fatal ? e.delta : 0), 0);
      h.hpTarget = h.hp == null ? null : Math.min(100, h.hp + pending);
      if (h.hp != null) {
        const target = h.hpTarget;
        if (h.hpShown == null) h.hpShown = target;
        if (target < h.hpShown - 0.01) {
          if (h.hpGhost == null || h.hpGhost < h.hpShown) h.hpGhost = h.hpShown;
          h.hpShown = target;
          h.ghostHold = 0.6;
        } else h.hpShown += (target - h.hpShown) * Math.min(1, dt * 4);
        if (h.ghostHold > 0) h.ghostHold -= dt;
        else if (h.hpGhost != null) h.hpGhost = Math.max(h.hpShown, h.hpGhost - dt * 30);
      }

      h.levelUpT = Math.max(0, h.levelUpT - dt);
      h.jumpT = Math.max(0, h.jumpT - dt);
      h.angryT = Math.max(0, h.angryT - dt);
      // BURNING TIME: HP바 위로 불티, 적이 더 자주 옴
      if (h.burning && !h.dead && Math.random() < dt * 10) h.parts.push({ x: 78 + rand(0, this.w - 90), y: top + 21, vx: rand(-4, 4), vy: rand(-26, -12), life: 0.8, max: 0.8, color: Math.random() < 0.5 ? '#FF9F1C' : '#FFD166', ember: true });
      h.swingT = Math.max(0, h.swingT - dt);
      h.hitT = Math.max(0, h.hitT - dt);
      h.standT = Math.max(0, h.standT - dt);
      if (h.potionT > 0) {
        const before = h.potionT;
        h.potionT = Math.max(0, h.potionT - dt);
        if (before > 0.8 && h.potionT <= 0.8) {
          for (let k = 0; k < 7; k++) h.parts.push({ x: heroX + 18, y: ground - 30, vx: rand(-40, 40), vy: rand(-70, -30), life: 1, max: 1, color: '#FF5C8A', heart: true, grav: 60 });
          h.floaters.push({ text: `+${h.potionAmt}%`, x: heroX + 70, y: ground - 18, life: 1.5, max: 1.5, color: '#5BE37D' });
        }
      }
      h.blinkIn -= dt;
      if (h.blinkIn <= 0) { h.blinkT = 0.14; h.blinkIn = rand(2, 5); }
      h.blinkT = Math.max(0, h.blinkT - dt);

      if (h.busy && !h.dead && h.potionT <= 0) {
        h.spawnIn -= dt;
        if (h.spawnIn <= 0) {
          h.spawnIn = h.burning ? rand(0.35, 0.8) : rand(0.7, 1.6);
          // 아주 드물게 드래곤 (1/150)
          if (this.dragonReady() && Math.random() < 1 / 60000) {
            this.dragonSeen();
            h.enemies.push({ x: this.w - 20, text: 'DRAGON', color: '#FF4D2E', speed: 12, bob: 0, dragon: true }); // 알림 보고 와서 볼 수 있게 천천히 (약 13초)
            // 전설 등장 연출: 경고 문구 + 불꽃 파티클
            h.floaters.push({ text: 'LEGENDARY!', x: this.w / 2 + 20, y: top + 34, life: 2.4, max: 2.4, color: GOLD });
            for (let k = 0; k < 18; k++) h.parts.push({ x: this.w - 30 + rand(-10, 10), y: top + 38, vx: rand(-60, 20), vy: rand(-90, -20), life: 1.2, max: 1.2, color: k % 2 ? '#FF4D2E' : GOLD, grav: 40 });
            if (this.onEvent) this.onEvent('dragonAppear', h.id);
          } else h.enemies.push({ x: this.w - 20, text: pick(this.enemyTheme.texts), color: pick(this.enemyTheme.colors || DEFAULT_ENEMIES.colors), speed: rand(45, 80), bob: rand(0, 5) });
        }
      }

      for (const e of h.enemies) {
        e.x -= e.speed * dt;
        if (e.fatal) {
          if (e.x <= heroX + 12 * PX) {
            e.dead = true;
            h.hitT = 0.6;
            for (let k = 0; k < 8; k++) h.parts.push({ x: heroX + 22, y: ground - 22, vx: rand(-80, 20), vy: rand(-90, -20), life: 0.7, max: 0.7, color: k % 2 ? '#FF6B6B' : '#FFD166' });
            h.floaters.push({ text: `-${e.delta}%`, x: heroX + 70, y: ground - 18, life: 1.5, max: 1.5, color: '#FF4D5A' });
          }
        } else if (!ranged && e.x <= reach && !e.dead) {
          if (h.swingT <= 0 && h.hitT <= 0) h.swingT = h.hp != null && h.hp < 20 ? 0.4 : 0.26;
          e.dead = true;
          if (e.dragon) this.slayDragon(h, e, ground);
          for (let k = 0; k < 6; k++) h.parts.push({ x: e.x + 4, y: ground - 12 - e.bob, vx: rand(10, 90), vy: rand(-80, 10), life: 0.5, max: 0.5, color: e.color });
        } else if (ranged && !e.targeted && e.x <= this.w * 0.72 && h.swingT <= 0 && h.hitT <= 0) {
          // 원거리: 마법탄 · 화살 · 수리검을 쏜다
          e.targeted = true;
          h.swingT = 0.3;
          h.shots.push({ x: heroX + 13 * PX, y: ground - 9 * PX, target: e, kind: wpn, t: 0 });
        }
      }
      for (const sh of h.shots) {
        sh.t += dt;
        sh.x += (sh.kind === 'staff' ? 220 : 300) * dt;
        const e = sh.target;
        const ty = ground - 12 - (e.bob || 0);
        sh.y += (ty - sh.y) * Math.min(1, dt * 8);
        if (!e.dead && sh.x >= e.x - 6) {
          e.dead = true;
          sh.done = true;
          if (e.dragon) this.slayDragon(h, e, ground);
          const col = sh.kind === 'staff' ? lighten(h.color, 0.4) : e.color;
          for (let k = 0; k < 7; k++) h.parts.push({ x: e.x, y: ty, vx: rand(-40, 90), vy: rand(-80, 10), life: 0.5, max: 0.5, color: k % 2 ? col : e.color });
        }
        if (e.dead && !sh.done && sh.x > e.x + 20) sh.done = true;
      }
      h.shots = h.shots.filter((sh) => !sh.done && sh.x < this.w);
      h.enemies = h.enemies.filter((e) => !e.dead && e.x > -30 && (!h.dead || e.fatal));

      if (h.busy && h.hp != null && h.hp < 20 && !h.dead) {
        h.sweatIn -= dt;
        if (h.sweatIn <= 0) { h.sweatIn = 0.8; h.parts.push({ x: heroX + 4, y: ground - 30, vx: -30, vy: -40, life: 0.7, max: 0.7, color: '#7CC7FF', drop: true }); }
      }
      const rt = this.restTheme;
      if (h.resting && rt.embers && Math.random() < dt * 3) h.parts.push({ x: heroX + 20 * PX + rand(2, 12), y: ground - 12, vx: rand(-6, 6), vy: rand(-30, -18), life: 1, max: 1, color: '#FFB347', ember: true });
      if (h.resting && rt.steam && Math.random() < dt * 2.5) h.parts.push({ x: heroX + 20 * PX + rand(3, 9), y: ground - 6 * PX, vx: rand(-3, 3), vy: rand(-14, -9), life: 1.4, max: 1.4, color: 'rgba(255,255,255,0.7)', ember: true });

      for (const p of h.parts) { p.x += p.vx * dt; p.y += p.vy * dt; if (!p.ember) p.vy += (p.grav != null ? p.grav : 220) * dt; p.life -= dt; }
      h.parts = h.parts.filter((p) => p.life > 0);
      for (const f of h.floaters) { f.y -= 12 * dt; f.life -= dt; }
      h.floaters = h.floaters.filter((f) => f.life > 0);
    }

    frame(dt) {
      this.update(Math.min(dt, 0.1));
      this.draw();
    }

    // 지금 빠른 움직임(전투·피격·물약 등)이 있는지. 모닥불·깜빡임처럼 느려도 되는 장면이면 false
    isActive() {
      return this.heroes.some((h) => h.busy || h.dead || h.alert || h.enemies.length || h.floaters.length ||
        h.hitT > 0 || h.swingT > 0 || h.potionT > 0 || h.jumpT > 0 || h.standT > 0 || h.angryT > 0 || h.levelUpT > 0 || h.burning);
    }

    // ───────── 그리기 도구 ─────────
    // 논리 좌표(CSS px) → 화면 픽셀로 반올림해서 채움. 경계가 항상 픽셀에 딱 맞음
    px(x, y, w, h, c) {
      const T = this.T;
      const x0 = Math.round(Math.round(x) * T), y0 = Math.round(Math.round(y) * T);
      const x1 = Math.round((Math.round(x) + w) * T), y1 = Math.round((Math.round(y) + h) * T);
      this.ctx.fillStyle = c;
      this.ctx.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
    }

    // 1 화면픽셀 두께의 세로선 (활 시위)
    vline(x, y, h, c) {
      const T = this.T;
      this.ctx.fillStyle = c;
      this.ctx.fillRect(Math.round(Math.round(x) * T), Math.round(Math.round(y) * T), Math.max(1, Math.round(T * 0.6)), Math.round(h * T));
    }

    // 스프라이트 픽셀 하나의 화면 크기를 정수로 고정 → 크기를 바꿔도 모든 도트가 같은 크기
    cell(ox, oy, s) {
      const T = this.T;
      return { X: Math.round(Math.round(ox) * T), Y: Math.round(Math.round(oy) * T), S: Math.max(1, Math.round(s * T)) };
    }

    dots(list, ox, oy, pal, s = PX) {
      const { X, Y, S } = this.cell(ox, oy, s);
      const { ctx } = this;
      for (const [x, y, c] of list) { ctx.fillStyle = pal[c] || c; ctx.fillRect(X + x * S, Y + y * S, S, S); }
    }

    blit(grid, ox, oy, pal, s = PX) {
      const { X, Y, S } = this.cell(ox, oy, s);
      const { ctx } = this;
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const ch = grid[y][x];
          if (ch === '.') continue;
          ctx.fillStyle = pal[ch];
          ctx.fillRect(X + x * S, Y + y * S, S, S);
        }
      }
    }

    // 글자 폭: 기본 3칸, 5x5로 그린 글자(%)는 5칸
    gw(ch) { const g = G[ch] || G['?']; return g.length === 25 ? 5 : 3; }
    textWidth(str, s = FS) { let n = 0; for (const ch of String(str).toUpperCase()) n += (this.gw(ch) + 1) * s; return n - s; }

    // 도트 글꼴. align: left | center | right, outline: 테두리 색
    text(str, x, y, color, { s = FS, align = 'left', outline = null } = {}) {
      str = String(str).toUpperCase();
      const w = this.textWidth(str, s);
      let ox = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
      ox = Math.round(ox);
      const { X, Y, S } = this.cell(ox, y, s);
      const o = Math.max(1, Math.round(S / 2));
      const draw = (dx, dy, c) => {
        this.ctx.fillStyle = c;
        let cx = X + dx;
        for (const ch of str) {
          const g = G[ch] || G['?'];
          const gw = g.length === 25 ? 5 : 3;
          for (let i = 0; i < g.length; i++) if (g[i] === '#') this.ctx.fillRect(cx + (i % gw) * S, Y + dy + Math.floor(i / gw) * S, S, S);
          cx += (gw + 1) * S;
        }
      };
      if (outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) draw(dx * o, dy * o, outline);
      draw(0, 0, color);
    }

    sword(hx, hy, a, len = 7) {
      const cx = Math.cos(a), sy = Math.sin(a), gx = -sy, gy = cx;
      for (let k = -1; k <= 1; k++) this.px(hx + gx * k * PX, hy + gy * k * PX, PX, PX, GOLD);
      for (let i = 1; i <= len; i++) this.px(hx + cx * i * PX, hy + sy * i * PX, PX, PX, i === len ? '#FFFFFF' : BLADE);
    }

    // 레트로 게임 창 틀 (모서리를 깎은 픽셀 테두리)
    frameBox(x, y, w, h) {
      const { ctx } = this;
      this.px(x + 2, y, w - 4, h, UI_BG);
      this.px(x, y + 2, w, h - 4, UI_BG);
      this.px(x + 2, y, w - 4, 2, UI_EDGE); this.px(x + 2, y + h - 2, w - 4, 2, UI_EDGE);
      this.px(x, y + 2, 2, h - 4, UI_EDGE); this.px(x + w - 2, y + 2, 2, h - 4, UI_EDGE);
      this.px(x + 4, y + 2, w - 8, 1, UI_HI);
    }

    draw() {
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, this.c.width, this.c.height);
      if (!this.heroes.length) return;
      ctx.globalAlpha = 0.94;
      this.frameBox(0, 0, w, h);
      ctx.globalAlpha = 1;
      if (this.backdrop) this.backdrop.draw(ctx, this.backdropGeom());
      this.heroes.forEach((hero, i) => {
        if (i > 0) for (let x = 10; x < w - 10; x += 4) this.px(x, this.laneTop(i), 2, 1, 'rgba(255,255,255,0.10)');
        this.drawLane(hero, i);
      });
    }

    drawLane(hr, i) {
      const { w } = this;
      const top = this.laneTop(i);
      const ground = top + LANE_H - 7;
      const heroX = 10;

      // 이름 · HP
      const lx = 70; // 용사·무기와 겹치지 않게 충분히 떨어뜨림
      this.text(hr.name, lx, top + 6, lighten(hr.color, 0.2));
      const hpTxt = hr.hp == null ? '--' : `${Math.round(hr.hpTarget != null ? hr.hpTarget : hr.hp)}%`;
      this.text(hpTxt, w - 10, top + 6, hr.hp == null ? '#6B6F86' : hr.dead ? '#FF4D5A' : '#F4F4F8', { align: 'right' });
      if (hr.eta != null && !hr.dead && !hr.burning) {
        // 바닥 예측: 이름 줄에 남은 시간 (빨간 모래시계 느낌으로 깜빡임)
        const left = Math.max(0, hr.eta - (Date.now() - (hr.etaAt || Date.now())));
        const m = Math.round(left / 60000);
        const txt = m >= 60 ? `OUT ${Math.floor(m / 60)}H${String(m % 60).padStart(2, '0')}` : `OUT ${m}M`;
        const warn = m < 30 && Math.floor(this.time * 3) % 2;
        this.text(txt, w - 10 - this.textWidth(hpTxt) - 8, top + 6, warn ? '#FFD166' : '#FF6B6B', { align: 'right', s: 1 });
      }
      if (hr.burning && !hr.dead) {
        const flick = Math.floor(this.time * 8) % 2;
        this.text('BURN X2', w - 10 - this.textWidth(hpTxt) - 8, top + 6, flick ? '#FF9F1C' : '#FFD166', { align: 'right', s: 1 });
      }
      // 하트 + HP바 (테두리 있는 칸 바)
      // 이름 줄과 HP바 사이를 띄움 (글자 높이 10 + 여백 5)
      this.blit(HEART, lx, top + 21, { '#': hr.dead ? '#5A5E75' : '#FF4D6D' }, 1);
      const bx = lx + 8, bw = w - bx - 10, by = top + 21, bh = 5;
      this.px(bx - 1, by - 1, bw + 2, bh + 2, '#0B0C16');
      this.px(bx, by, bw, bh, '#262A40');
      if (hr.hpShown != null) {
        if (hr.hpGhost != null && hr.hpGhost > hr.hpShown) this.px(bx, by, Math.round((bw * hr.hpGhost) / 100), bh, '#FF5A5F');
        const fw = Math.round((bw * hr.hpShown) / 100);
        this.px(bx, by, fw, bh, hpColor(hr.hpShown));
        this.px(bx, by, fw, 2, 'rgba(255,255,255,0.28)');
        for (let k = 1; k < 10; k++) this.px(bx + Math.round((bw * k) / 10), by, 1, bh, 'rgba(11,12,22,0.6)');
      }
      if (hr.burning && !hr.dead) {
        // 불타는 테두리
        const c = Math.floor(this.time * 10) % 2 ? '#FF9F1C' : '#FF4D2E';
        this.px(bx - 1, by - 2, bw + 2, 1, c);
      }
      // 경험치 줄 (HP바 아래 금색)
      if (hr.level != null) {
        this.px(bx, by + bh + 2, bw, 1, 'rgba(255,209,102,0.18)');
        this.px(bx, by + bh + 2, Math.round(bw * Math.min(1, hr.levelProgress)), 1, GOLD);
      }

      // 바닥 (점선)
      for (let x = 8; x < w - 8; x += 6) this.px(x, ground + 1, 3, 1, 'rgba(255,255,255,0.09)');

      // 적: 도트 글꼴 코드 조각
      for (const e of hr.enemies) {
        const ey = Math.round(ground - 13 - e.bob + Math.sin(this.time * 8 + e.x) * 1.5);
        if (e.dragon) {
          const c = Math.floor(this.time * 10) % 2 ? '#FF4D2E' : GOLD;
          this.text(e.text, e.x, ey - 3, c, { align: 'center', outline: '#0B0C16', s: 3 });
        } else this.text(e.text, e.x, ey, e.color, { align: 'center', outline: '#0B0C16' });
      }

      this.drawShots(hr);

      // 레벨 명판 (용사 발 아래)
      if (hr.level != null) this.text(`LV${hr.level}`, heroX + 6 * PX, ground + 2, hr.levelUpT > 0 && Math.floor(this.time * 10) % 2 ? '#FFFFFF' : GOLD, { align: 'center', s: 1 });

      if (hr.dead) this.drawDead(hr, heroX, ground, top);
      else if (hr.resting && hr.potionT <= 0) this.drawResting(hr, heroX, ground);
      else this.drawFighting(hr, heroX, ground);

      for (const p of hr.parts) {
        this.ctx.globalAlpha = Math.max(0, p.life / p.max);
        if (p.heart) this.blit(HEART, p.x, p.y, { '#': p.color }, 1);
        else if (p.drop) this.px(p.x, p.y, 2, 4, p.color);
        else this.px(p.x, p.y, p.ember ? 2 : PX, p.ember ? 2 : PX, p.color);
      }
      this.ctx.globalAlpha = 1;

      for (const f of hr.floaters) {
        this.ctx.globalAlpha = Math.min(1, f.life / 0.4);
        this.text(f.text, f.x, Math.round(f.y), f.color, { align: 'center', outline: '#0B0C16' });
      }
      this.ctx.globalAlpha = 1;

      if (hr.alert || hr.question) this.drawBubble(heroX + 10 * PX, ground - 17 * PX, hr.alert ? '!' : '?', hr.alert ? '#FF4D5A' : '#8A8FA8');
    }

    heroBody(hr, ox, oy, pal, face) {
      this.blit(hr.skin.grid, ox, oy, pal);
      this.dots(hr.skin.faceNoMouth ? face.filter(([, y]) => y !== 9) : face, ox, oy, pal);
    }

    faceFor(mode) {
      const cheeks = [[4, 8, CHEEK], [10, 8, CHEEK]];
      if (mode === 'hit') return [[5, 7, 'o'], [6, 8, 'o'], [5, 9, 'o'], [9, 7, 'o'], [8, 8, 'o'], [9, 9, 'o']];
      if (mode === 'happy') return [[5, 8, 'o'], [6, 7, 'o'], [7, 8, 'o'], [8, 8, 'o'], [9, 7, 'o'], [10, 8, 'o'], [7, 9, 'o']];
      if (mode === 'rest') return [[5, 8, 'o'], [6, 8, 'o'], [8, 8, 'o'], [9, 8, 'o'], ...cheeks, [7, 9, 'o']];
      if (mode === 'tired') return [[5, 8, 'o'], [6, 8, 'o'], [8, 8, 'o'], [9, 8, 'o'], ...cheeks, [7, 9, '#FF6F86']];
      if (mode === 'blink') return [[6, 8, 'o'], [9, 8, 'o'], ...cheeks, [7, 9, 'o'], [8, 9, 'o']];
      return [[6, 7, 'o'], [6, 8, 'o'], [9, 7, 'o'], [9, 8, 'o'], ...cheeks, [7, 9, 'o'], [8, 9, 'o']];
    }

    // 망토: 몸 뒤에서 펄럭임
    cape(hr, ox, oy, moving) {
      const f = moving ? Math.floor(hr.time * 8) % 2 : Math.floor(hr.time * 2) % 2;
      const c = hr.color, C = darken(hr.color, 0.65);
      const pts = f
        ? [[0, 7, c], [-1, 8, C], [0, 8, c], [-1, 9, c], [0, 9, c], [-2, 10, C], [-1, 10, c], [0, 10, c], [-2, 11, C], [-1, 11, c]]
        : [[0, 7, c], [-1, 8, c], [0, 8, c], [-1, 9, C], [0, 9, c], [-1, 10, c], [0, 10, c], [-3, 11, C], [-2, 11, c], [-1, 11, c]];
      this.dots(pts, ox, oy, {});
    }

    drawFighting(hr, heroX, ground) {
      let ox = heroX, oy = ground - 14 * PX;
      const hit = hr.hitT > 0;
      if (hit) ox -= (Math.floor(this.time * 30) % 2 ? 1 : 2) * PX;
      const potion = hr.potionT > 0 ? 1 - hr.potionT / 1.9 : -1;
      if (potion > 0.55) oy -= Math.round(Math.sin(((potion - 0.55) / 0.45) * Math.PI) * 4) * PX;
      if (!hr.busy && potion < 0) oy += Math.sin(hr.time * 2) > 0.7 ? -PX : 0;
      if (hr.standT > 0) oy += PX;
      if (hr.jumpT > 0) oy -= Math.round(Math.sin((1 - hr.jumpT / 0.45) * Math.PI) * 3) * PX;
      if (hr.angryT > 0) ox += (Math.floor(this.time * 30) % 2 ? 1 : -1) * PX;

      if (hr.levelUpT > 0) {
        const a = Math.min(1, hr.levelUpT);
        // 반짝이는 금빛 테두리 (도트 사각 링이 퍼져 나감)
        const grow = Math.round((1 - hr.levelUpT / 2.2) * 4);
        const x0 = ox - (2 + grow) * PX, y0 = oy - (3 + grow) * PX, ww = (16 + grow * 2) * PX, hh = (18 + grow * 2) * PX;
        this.ctx.globalAlpha = 0.8 * a;
        const c = Math.floor(this.time * 12) % 2 ? GOLD : '#FFFFFF';
        for (let x = x0 + 4; x < x0 + ww - 4; x += 6) { this.px(x, y0, 3, 2, c); this.px(x, y0 + hh - 2, 3, 2, c); }
        for (let y = y0 + 4; y < y0 + hh - 4; y += 6) { this.px(x0, y, 2, 3, c); this.px(x0 + ww - 2, y, 2, 3, c); }
        this.ctx.globalAlpha = 1;
      }
      this.px(ox + PX, ground, 10 * PX, 2, 'rgba(0,0,0,0.4)');
      const step = hr.busy && !hit ? Math.floor(hr.time * 6) % 2 : 0;
      this.dots([[2, 12, 'o'], [3, 12, 'o'], [4, 12, 'o'], [2, 13, 'o'], [3, 13, 'o'], [4, 13, 'o']], ox - step * PX, oy, hr.P);
      this.dots([[7, 12, 'o'], [8, 12, 'o'], [9, 12, 'o'], [7, 13, 'o'], [8, 13, 'o'], [9, 13, 'o']], ox + step * PX, oy, hr.P);
      this.cape(hr, ox, oy, hr.busy);

      let mode = 'fight';
      if (!hr.busy) mode = 'normal';
      if (hr.hp != null && hr.hp < 20) mode = 'tired';
      if (hr.blinkT > 0 && mode !== 'tired') mode = 'blink';
      if (potion >= 0) mode = potion > 0.55 ? 'happy' : 'normal';
      if (hr.jumpT > 0) mode = 'happy';
      if (hit || hr.angryT > 0) mode = 'hit';
      this.heroBody(hr, ox, oy, hit || hr.angryT > 0 ? hr.PH : hr.P, this.faceFor(mode));

      const hx = ox + 11 * PX + 1, hy = oy + 9 * PX;
      let a = -1.0;
      if (hr.swingT > 0) {
        const dur = hr.hp != null && hr.hp < 20 ? 0.4 : 0.26;
        const k = 1 - hr.swingT / dur;
        a = -1.3 + k * 2.0;
        // 베는 궤적 (도트 호)
        for (let t = -1.3; t < a; t += 0.18) this.px(hx + Math.cos(t) * 8 * PX, hy + Math.sin(t) * 8 * PX, 2, 2, 'rgba(255,255,255,0.45)');
      } else if (!hr.busy) a = -1.35;
      if (hit) a = -2.0;
      if (potion >= 0) a = 1.2;
      this.weapon(hr, hx, hy, a, potion >= 0);

      if (potion >= 0 && potion < 0.75) {
        const px = ox + 10 * PX;
        const py = potion < 0.3 ? oy - 22 + (potion / 0.3) * 22 : oy + 4;
        this.potion(px, py, potion >= 0.3);
      }
    }

    // 무기 그리기 (전투 자세)
    weapon(hr, hx, hy, a, lowered) {
      const w = hr.skin.weapon || 'sword';
      const casting = hr.swingT > 0;
      if (w === 'sword') return this.sword(hx, hy, a);
      if (w === 'katana') return this.katana(hx, hy, a);
      if (w === 'staff') {
        // 지팡이: 손에 세워 들고, 쏠 때 구슬이 번쩍
        const top = lowered ? hy - 2 * PX : hy - 6 * PX;
        for (let y = top; y <= hy + 4 * PX; y += PX) this.px(hx, y, PX, PX, '#8B5A2B');
        const orb = casting ? '#FFFFFF' : lighten(hr.color, 0.35);
        this.dots([[0, -1, orb], [-1, 0, orb], [0, 0, orb], [1, 0, orb], [0, 1, orb]], hx, top - PX, {});
        return;
      }
      if (w === 'bow') {
        // 활: 세로 호 + 시위 (쏠 때 당김)
        const pts = [[1, -4], [2, -3], [2, -2], [3, -1], [3, 0], [3, 1], [2, 2], [2, 3], [1, 4]];
        for (const [x, y] of pts) this.px(hx + x * PX, hy + y * PX, PX, PX, '#A8703F');
        const pull = casting ? -2 : 0;
        this.vline(hx + (1 + pull) * PX, hy - 4 * PX, 9 * PX, 'rgba(255,255,255,0.7)');
        return;
      }
      if (w === 'shuriken' && !casting && !lowered) {
        this.dots([[0, -1, BLADE], [-1, 0, BLADE], [1, 0, BLADE], [0, 1, BLADE], [0, 0, INK]], hx + PX, hy, {}, 2);
      }
    }

    katana(hx, hy, a) {
      const cx = Math.cos(a), sy = Math.sin(a), gx = -sy, gy = cx;
      for (let k = -1; k <= 1; k++) this.px(hx + gx * k * 2, hy + gy * k * 2, 2, 2, '#2E2B3A');
      for (let i = 1; i <= 10; i++) this.px(hx + cx * i * PX, hy + sy * i * PX, 2, 2, i >= 9 ? '#FFFFFF' : '#F5F7FF');
    }

    // 쉬는 동안 무기 두는 모습
    weaponRest(hr, x, ground) {
      const w = hr.skin.weapon || 'sword';
      if (w === 'sword') return this.sword(x, ground - 1, -Math.PI / 2, 8);
      if (w === 'katana') return this.katana(x, ground - 1, -Math.PI / 2);
      if (w === 'staff') {
        for (let y = ground - 9 * PX; y <= ground; y += PX) this.px(x, y, PX, PX, '#8B5A2B');
        const orb = lighten(hr.color, 0.35);
        this.dots([[0, -1, orb], [-1, 0, orb], [0, 0, orb], [1, 0, orb], [0, 1, orb]], x, ground - 10 * PX, {});
        return;
      }
      if (w === 'bow') {
        for (const [dx, dy] of [[1, -8], [2, -7], [2, -6], [3, -5], [3, -4], [3, -3], [2, -2], [2, -1], [1, 0]]) this.px(x + dx * PX, ground + dy * PX, PX, PX, '#A8703F');
        this.vline(x + PX, ground - 8 * PX, 9 * PX, 'rgba(255,255,255,0.6)');
      }
    }

    drawShots(hr) {
      for (const sh of hr.shots) {
        if (sh.kind === 'staff') {
          const c = lighten(hr.color, 0.4);
          this.ctx.globalAlpha = 0.35;
          this.px(sh.x - 8, sh.y, 8, 2, c);
          this.ctx.globalAlpha = 1;
          this.dots([[0, -1, c], [-1, 0, c], [0, 0, '#FFFFFF'], [1, 0, c], [0, 1, c]], sh.x, sh.y, {}, 2);
        } else if (sh.kind === 'bow') {
          this.px(sh.x - 10, sh.y, 10, 1, '#E8D2A6');
          this.dots([[0, -1, BLADE], [1, 0, BLADE], [0, 1, BLADE], [0, 0, BLADE]], sh.x, sh.y - 1, {}, 2);
          this.px(sh.x - 12, sh.y - 2, 2, 2, '#FF7AA8');
          this.px(sh.x - 12, sh.y + 1, 2, 2, '#FF7AA8');
        } else {
          const r = Math.floor(sh.t * 20) % 2;
          const pts = r ? [[0, -1], [-1, 0], [1, 0], [0, 1]] : [[-1, -1], [1, -1], [-1, 1], [1, 1]];
          this.dots([...pts.map(([x, y]) => [x, y, BLADE]), [0, 0, INK]], sh.x, sh.y, {}, 2);
        }
      }
    }

    potion(x, y, tilt) {
      const K = '#C08A5A', R = '#FF4D6D', L = '#FF9AAE';
      const g = tilt
        ? [[0, 1, K], [1, 1, INK], [2, 0, INK], [3, 0, INK], [4, 0, INK], [2, 1, R], [3, 1, L], [4, 1, R], [5, 1, INK], [2, 2, INK], [3, 2, INK], [4, 2, INK]]
        : [[1, 0, K], [2, 0, K], [1, 1, INK], [2, 1, INK], [0, 2, INK], [1, 2, R], [2, 2, L], [3, 2, INK], [0, 3, INK], [1, 3, R], [2, 3, R], [3, 3, INK], [1, 4, INK], [2, 4, INK]];
      this.dots(g, x, y, {}, 2);
    }

    drawResting(hr, heroX, ground) {
      const { ctx } = this;
      const ox = heroX, oy = ground - 12 * PX;
      // 무기를 옆에 두고
      this.weaponRest(hr, ox + 13 * PX, ground);
      this.px(ox + PX, ground, 12 * PX, 2, 'rgba(0,0,0,0.4)');
      // 망토를 깔고 앉음
      this.dots([[-1, 11, darken(hr.color, 0.65)], [0, 11, hr.color], [1, 11, hr.color]], ox, oy, {});
      // 앞으로 뻗은 발
      this.dots([[9, 11, 'o'], [10, 11, 'o'], [11, 11, 'o'], [10, 10, 'o'], [11, 10, 'o']], ox, oy, hr.P);
      const nod = Math.sin(hr.time * 1.3) > 0.85 ? PX : 0;
      const hop = hr.jumpT > 0 ? -Math.round(Math.sin((1 - hr.jumpT / 0.45) * Math.PI) * 3) * PX : 0;
      const awake = hr.jumpT > 0 || hr.angryT > 0;
      this.heroBody(hr, ox + (hr.angryT > 0 ? (Math.floor(this.time * 30) % 2 ? PX : -PX) : 0), oy + (awake ? hop : nod), hr.angryT > 0 ? hr.PH : hr.P, this.faceFor(hr.angryT > 0 ? 'hit' : awake ? 'fight' : 'rest'));

      // 휴식 소품 (모닥불 · 커피 · 랜턴 … 휴식 팩)
      const rt = this.restTheme;
      const frame = rt.frames[Math.floor(this.time * 7 + hr.id.length) % rt.frames.length];
      const fx = ox + 19 * PX, fy = ground - (frame.length - 1) * PX;
      if (rt.glow) {
        const [r, g, b] = hex2rgb(rt.glow);
        const cy = fy + frame.length * PX * 0.4;
        const T = this.T;
        // 빛 번짐 그라디언트는 한 번만 그려 두고, 깜빡임은 투명도만 바꿔서 쓴다 (매 프레임 새로 만들지 않음)
        const key = `${rt.glow}|${T}`;
        if (!this.glowCache || this.glowCache.key !== key) {
          const cv = document.createElement('canvas');
          cv.width = Math.round(66 * T); cv.height = Math.round(56 * T);
          const g2 = cv.getContext('2d');
          const grad = g2.createRadialGradient(33 * T, 30 * T, 2 * T, 33 * T, 30 * T, 32 * T);
          grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          g2.fillStyle = grad;
          g2.fillRect(0, 0, cv.width, cv.height);
          this.glowCache = { key, cv };
        }
        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = prevAlpha * (0.26 + Math.sin(this.time * 9) * 0.05);
        ctx.drawImage(this.glowCache.cv, Math.round((fx - 26) * T), Math.round((cy - 30) * T));
        ctx.globalAlpha = prevAlpha;
      }
      this.blit(frame, fx, fy, { o: INK, ...rt.palette });

      // zZ
      const zt = (hr.time * 0.6) % 1;
      this.ctx.globalAlpha = 1 - zt;
      this.text('Z', ox + 5 * PX + zt * 3, oy - 4 - zt * 8, '#9AA0BC', { s: 1 });
      this.text('Z', ox + 7 * PX + zt * 3, oy - 12 - zt * 8, '#9AA0BC', { s: 2 });
      this.ctx.globalAlpha = 1;
    }

    drawDead(hr, heroX, ground, top) {
      const { w } = this;
      // 묘비 + 풀
      const tx = heroX + PX, ty = ground - 10 * PX + 1;
      this.blit(TOMB, tx, ty, { o: INK, g: '#A2ABBD', G: '#727C92' });
      this.dots([[-1, 9, '#3FA34D'], [0, 8, '#5BE37D'], [10, 9, '#3FA34D'], [10, 8, '#5BE37D'], [11, 9, '#3FA34D']], tx, ty, {});
      // 묘비에 걸린 투구 깃털(서비스 색)
      this.dots([[3, -1, hr.color], [4, -1, hr.color], [4, -2, darken(hr.color, 0.65)]], tx, ty, {});
      // 떠오르는 유령
      const gy = ty - 8 - ((hr.time * 6) % 14);
      const gx = tx + 11 * PX + Math.sin(hr.time * 3) * 3;
      this.ctx.globalAlpha = 0.85 - ((hr.time * 6) % 14) / 30;
      this.blit(GHOST, gx, gy, { w: '#EDEFFF', e: INK }, 2);
      this.ctx.globalAlpha = 1;

      // GAME OVER + 부활까지 남은 시간
      const cx = Math.round((heroX + 16 * PX + w) / 2) + 6;
      const blink = Math.floor(this.time * 2) % 2 === 0;
      this.text('GAME OVER', cx, top + 26, blink ? '#FF4D5A' : '#D6323F', { align: 'center', outline: '#0B0C16' });
      if (hr.resetAt) {
        const left = Math.max(0, hr.resetAt - Date.now());
        const hh = Math.floor(left / 3600e3), mm = Math.floor((left % 3600e3) / 60e3), ss = Math.floor((left % 60e3) / 1e3);
        const t = hh >= 24 ? `${Math.floor(hh / 24)}D ${hh % 24}H` : `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
        this.text(`RESPAWN ${t}`, cx, top + 39, '#8A8FA8', { align: 'center', s: 1 });
      }
    }

    drawBubble(x, y, mark, color) {
      const bob = Math.floor(this.time * 2) % 2 ? 0 : -2;
      this.px(x + 2, y + bob, 12, 16, INK);
      this.px(x, y + 2 + bob, 16, 12, INK);
      this.px(x + 2, y + 2 + bob, 12, 12, '#FFFFFF');
      this.px(x + 2, y + 16 + bob, 4, 3, INK);
      this.text(mark, x + 8, y + 3 + bob, color, { align: 'center' });
    }
  }

  window.Scene = Scene;
})();
