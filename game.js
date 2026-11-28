window.UI = {
  toastTimer: null,
  toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.style.opacity = '0', 2200);
  },

  openModal(id) {
    this.closeModals();
    document.getElementById(id).classList.add('open');
    if (id === 'inv-modal' || id === 'craft-modal') this.renderInventory();
    if (id === 'talent-modal') this.renderTalents();
    if (id === 'gallery-modal') this.renderGallery();
    if (id === 'debug-modal') {
      document.getElementById('debug-output').value = DebugLog.generateReport();
    }
  },

  closeModals() {
    document.querySelectorAll('.modal').forEach(m => {
      if (m.id !== 'death-modal') m.classList.remove('open');
    });
    this.hideTooltip();
  },

  isAnyModalOpen() {
    return document.querySelectorAll('.modal.open').length > 0;
  },

  showTooltip(e, type, data1, data2) {
    const tip = document.getElementById('tooltip');
    tip.style.display = 'block';
    
    let left = e.clientX + 14;
    let top = e.clientY + 14;
    const tipWidth = 235;
    const tipHeight = 190;

    if (left + tipWidth > window.innerWidth) left = e.clientX - tipWidth - 14;
    if (top + tipHeight > window.innerHeight) top = e.clientY - tipHeight - 14;

    tip.style.left = left + 'px';
    tip.style.top = top + 'px';

    if (type === 'petal') {
      const stats = PetalHelper.getStats(data1, data2);
      tip.innerHTML = `
        <div style="font-weight:700; color:${stats.rarity.color}; margin-bottom:3px;">${stats.rarity.name} ${stats.name}</div>
        <div style="font-size:11px; color:#ddd; margin-bottom:6px;">${stats.desc}</div>
        <div style="font-size:11px; display:flex; flex-direction:column; gap:2px;">
          <span>Damage: <strong>${GameConfig.formatNum(stats.dmg)}</strong></span>
          <span>Health: <strong>${GameConfig.formatNum(stats.maxHp)}</strong></span>
          <span>Reload: <strong>${stats.reload}s</strong></span>
          ${stats.heal ? `<span>Heal: <strong>+${GameConfig.formatNum(stats.heal)} HP</strong></span>` : ''}
          ${stats.regenBonus ? `<span>Regen: <strong>+${GameConfig.formatNum(stats.regenBonus)}/s</strong></span>` : ''}
        </div>
      `;
    } else if (type === 'mob') {
      const mobDef = MobDB[data1];
      const rar = GameConfig.RARITIES[data2];
      const mStats = MobHelper.getStats(data1, data2);
      
      const dropsHtml = mStats.normalizedDrops.map(d =>
        `<span style="color:${rar.color}">${d.chanceText} ${PetalDB[d.petal].name}</span>`
      ).join('<br/>');

      tip.innerHTML = `
        <div style="font-weight:700; color:${rar.color}; margin-bottom:3px;">${rar.name} ${mobDef.name}</div>
        <div style="font-size:11px; display:flex; flex-direction:column; gap:2px; margin-bottom:6px;">
          <span>Health: <strong>${GameConfig.formatNum(mStats.hp)}</strong></span>
          <span>Damage: <strong>${GameConfig.formatNum(mStats.dmg)}</strong></span>
          <span>Armor: <strong>${GameConfig.formatNum(mStats.armor)}</strong></span>
          <span>Speed: <strong>${mobDef.speed}</strong></span>
        </div>
        <div style="font-size:11px; border-top:1px solid #444; padding-top:4px;">
          <strong style="color:#f1c40f">Drop Rates:</strong><br/>
          ${dropsHtml}
        </div>
      `;
    }
  },

  hideTooltip() {
    const tip = document.getElementById('tooltip');
    if (tip) tip.style.display = 'none';
  },

  updateHUD() {
    if (!window.Game) return;
    document.getElementById('wave-label').textContent = `Wave ${Game.wave}`;
    document.getElementById('mobs-label').textContent = `Mobs: ${Game.mobs.length}`;
    document.getElementById('lvl-label').textContent = `Lvl ${Progression.level}`;
    document.getElementById('xp-bar-fill').style.width = `${Math.min(100, (Progression.xp / Progression.xpNext) * 100)}%`;
    document.getElementById('hp-label').textContent = `HP: ${GameConfig.formatNum(Game.player.hp)}/${GameConfig.formatNum(Game.player.maxHp)}`;

    const badge = document.getElementById('tp-badge');
    badge.style.display = Progression.talentPoints > 0 ? 'inline-block' : 'none';
    badge.textContent = Progression.talentPoints;
  },

  renderLoadout() {
    const bar = document.getElementById('loadout-bar');
    bar.innerHTML = '';
    const count = Progression.getSlotCount();
    for (let i = 0; i < count; i++) {
      const item = Progression.equipped[i];
      const div = document.createElement('div');
      div.className = 'slot';
      div.onclick = () => Progression.unequip(i);
      if (item) {
        const stats = PetalHelper.getStats(item.petalId, item.rarityId);
        div.style.borderColor = stats.rarity.color;
        div.onmouseenter = (e) => this.showTooltip(e, 'petal', item.petalId, item.rarityId);
        div.onmouseleave = () => this.hideTooltip();
        div.innerHTML = `<div class="slot-dot" style="background:${stats.color}"></div><span>${stats.name}</span>`;
      } else {
        div.innerHTML = `<span style="color:#666">Empty</span>`;
      }
      bar.appendChild(div);
    }
  },

  renderInventory() {
    const invGrid = document.getElementById('inv-grid');
    const craftGrid = document.getElementById('craft-grid');
    const keys = Object.keys(Progression.inventory).sort((a, b) => {
      const [pA, rA] = a.split('_');
      const [pB, rB] = b.split('_');
      return Number(rB) - Number(rA) || pA.localeCompare(pB);
    });

    if (invGrid) {
      invGrid.innerHTML = '';
      if (keys.length === 0) {
        invGrid.innerHTML = '<p style="color:#ddd; grid-column:1/-1;">No petals in inventory.</p>';
      } else {
        keys.forEach(key => {
          const count = Progression.inventory[key];
          const [petalId, rarityStr] = key.split('_');
          const rarityId = Number(rarityStr);
          const stats = PetalHelper.getStats(petalId, rarityId);

          const card = document.createElement('div');
          card.className = 'inv-card';
          card.style.borderColor = stats.rarity.color;
          card.onmouseenter = (e) => this.showTooltip(e, 'petal', petalId, rarityId);
          card.onmouseleave = () => this.hideTooltip();

          card.innerHTML = `
            <div class="slot-dot" style="background:${stats.color}"></div>
            <strong style="color:${stats.rarity.color}">${stats.name} x${count}</strong>
            <span style="font-size:10px; color:#ddd">${stats.rarity.name}</span>
            <button class="btn-equip" onclick="Progression.equip('${petalId}', ${rarityId}); UI.renderInventory();">Equip</button>
          `;
          invGrid.appendChild(card);
        });
      }
    }

    if (craftGrid) {
      craftGrid.innerHTML = '';
      const maxTier = GameConfig.RARITIES.length - 1;
      if (keys.length === 0) {
        craftGrid.innerHTML = '<p style="color:#ddd; grid-column:1/-1;">No petals available to craft.</p>';
      } else {
        keys.forEach(key => {
          const count = Progression.inventory[key];
          const [petalId, rarityStr] = key.split('_');
          const rarityId = Number(rarityStr);
          const stats = PetalHelper.getStats(petalId, rarityId);

          const card = document.createElement('div');
          card.className = 'inv-card';
          card.style.borderColor = stats.rarity.color;
          card.onmouseenter = (e) => this.showTooltip(e, 'petal', petalId, rarityId);
          card.onmouseleave = () => this.hideTooltip();

          card.innerHTML = `
            <div class="slot-dot" style="background:${stats.color}"></div>
            <strong style="color:${stats.rarity.color}">${stats.name} x${count}</strong>
            <span style="font-size:10px; color:#ddd">${stats.rarity.name}</span>
            <button class="btn-craft" ${count < 5 || rarityId >= maxTier ? 'disabled' : ''} onclick="Progression.craft('${petalId}', ${rarityId}); UI.renderInventory();">
              ${rarityId >= maxTier ? 'Max Tier' : `Craft (${(stats.rarity.craftChance * 100).toFixed(1)}%)`}
            </button>
          `;
          craftGrid.appendChild(card);
        });
      }
    }
  },

  renderTalents() {
    document.getElementById('tp-count').textContent = Progression.talentPoints;
    const list = document.getElementById('talent-list');
    list.innerHTML = '';
    Object.entries(Progression.talents).forEach(([key, t]) => {
      const isMax = t.tier >= t.maxTier;
      const nextCost = isMax ? 0 : t.costs[t.tier];
      const curRar = t.tier > 0 ? GameConfig.RARITIES[t.tier - 1] : null;
      const nextRar = !isMax ? GameConfig.RARITIES[t.tier] : null;

      let statPreview = '';
      if (key === 'health') {
        const curPct = Math.round(Progression.getHealthBonus() * 100);
        const nextPct = !isMax ? Math.round(t.bonuses[t.tier] * 100) : curPct;
        statPreview = `Current: +${curPct}% HP ${!isMax ? `-> Next (${nextRar.name}): +${nextPct}% HP` : '(MAX)'}`;
      } else if (key === 'petalHealth') {
        const curPct = (Progression.getPetalHpMultiplier() * 100).toFixed(1);
        const nextPct = !isMax ? (t.mults[t.tier] * 100).toFixed(1) : curPct;
        statPreview = `Current: ${curPct}% Petal HP ${!isMax ? `-> Next (${nextRar.name}): ${nextPct}%` : '(MAX)'}`;
      } else {
        statPreview = `Tier: ${curRar ? curRar.name : 'Unranked'} (${t.tier}/${t.maxTier})`;
      }

      const row = document.createElement('div');
      row.className = 'talent-row';
      row.innerHTML = `
        <div>
          <strong>${t.name}</strong> <span style="color:${curRar ? curRar.color : '#555'}">[${curRar ? curRar.name : 'Locked'}]</span>
          <div style="font-size:12px; color:#ddd">${t.desc}</div>
          <div style="font-size:11px; font-weight:700; color:#74b9ff; margin-top:2px;">${statPreview}</div>
        </div>
        <button class="talent-btn" ${Progression.talentPoints < nextCost || isMax ? 'disabled' : ''} onclick="Progression.upgradeTalent('${key}')">
          ${isMax ? 'MAXED' : `Upgrade (${nextCost} TP)`}
        </button>
      `;
      list.appendChild(row);
    });
  },

  renderGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    
    Object.keys(MobDB).forEach(mKey => {
      const mobDef = MobDB[mKey];
      GameConfig.RARITIES.forEach(rar => {
        const key = `${mKey}_${rar.id}`;
        const unlocked = Progression.unlockedMobs[key];

        const card = document.createElement('div');
        card.className = `gallery-card ${unlocked ? '' : 'locked'}`;
        card.style.borderColor = rar.color;

        if (unlocked) {
          card.onmouseenter = (e) => this.showTooltip(e, 'mob', mKey, rar.id);
          card.onmouseleave = () => this.hideTooltip();
        }

        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        if (unlocked) {
          Game.renderMobShape(ctx, { x: 12, y: 12, radius: 9, def: mobDef, rarity: rar }, true);
        } else {
          ctx.fillStyle = '#444';
          ctx.beginPath(); ctx.arc(12, 12, 8, 0, Math.PI * 2); ctx.fill();
        }

        card.appendChild(canvas);

        const label = document.createElement('span');
        label.style.fontSize = '7px';
        label.style.fontWeight = '700';
        label.style.color = unlocked ? '#fff' : '#888';
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        label.style.whiteSpace = 'nowrap';
        label.style.width = '100%';
        label.textContent = mobDef.name;
        card.appendChild(label);

        grid.appendChild(card);
      });
    });
  },

  showDeathSummary() {
    const grid = document.getElementById('collected-run-grid');
    grid.innerHTML = '';
    const keys = Object.keys(Progression.runCollected);

    if (keys.length === 0) {
      grid.innerHTML = '<p style="color:#888; grid-column:1/-1; text-align:center;">No petals collected this run.</p>';
    } else {
      keys.forEach(key => {
        const count = Progression.runCollected[key];
        const [petalId, rarityStr] = key.split('_');
        const stats = PetalHelper.getStats(petalId, Number(rarityStr));
        const card = document.createElement('div');
        card.className = 'inv-card';
        card.style.borderColor = stats.rarity.color;
        card.innerHTML = `
          <div class="slot-dot" style="background:${stats.color}"></div>
          <strong style="color:${stats.rarity.color}; font-size:11px;">${stats.name}</strong>
          <span style="font-size:10px; color:#fff;">x${count}</span>
          <span style="font-size:9px; color:#bbb">${stats.rarity.name}</span>
        `;
        grid.appendChild(card);
      });
    }
    document.getElementById('death-modal').classList.add('open');
  }
};

window.Game = {
  canvas: document.getElementById('gameCanvas'),
  ctx: null,
  wave: 1,
  waveCooldown: 0,
  mobs: [],
  drops: [],
  projectiles: [],
  activePetals: [],
  orbitAngle: 0,
  currentOrbitRadius: 68,

  player: {
    x: 0, y: 0,
    radius: 22,
    hp: 200, maxHp: 200,
    bodyDmg: 10,
    invuln: 0
  },

  input: {
    keys: {},
    mouseX: 0, mouseY: 0,
    mouseDownLeft: false,
    mouseDownRight: false,
    useMouseMove: false
  },

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('keydown', e => {
      this.input.keys[e.code] = true;
      if (e.code === 'KeyZ') UI.openModal('inv-modal');
      if (e.code === 'KeyX') UI.openModal('talent-modal');
      if (e.code === 'KeyC') UI.openModal('craft-modal');
      if (e.code === 'Backquote') UI.openModal('debug-modal');
      if (e.code === 'Escape') UI.closeModals();
    });
    window.addEventListener('keyup', e => this.input.keys[e.code] = false);
    window.addEventListener('mousemove', e => {
      this.input.mouseX = e.clientX - this.canvas.width / 2;
      this.input.mouseY = e.clientY - this.canvas.height / 2;
      this.input.useMouseMove = true;
    });
    window.addEventListener('mousedown', e => {
      if (e.target !== this.canvas) return;
      if (e.button === 0) this.input.mouseDownLeft = true;
      if (e.button === 2) this.input.mouseDownRight = true;
    });
    window.addEventListener('mouseup', e => {
      if (e.button === 0) this.input.mouseDownLeft = false;
      if (e.button === 2) this.input.mouseDownRight = false;
    });
    window.addEventListener('contextmenu', e => e.preventDefault());

    this.recalcPlayerStats();
    this.rebuildActivePetals();
    UI.renderLoadout();
    this.startWave(1);

    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
    DebugLog.log('GAME', 'Engine initialized.');
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  recalcPlayerStats() {
    const baseStats = GameConfig.getPlayerBaseStats(Progression.level);
    const hpMult = 1 + Progression.getHealthBonus();
    const ratio = this.player.maxHp > 0 ? (this.player.hp / this.player.maxHp) : 1;
    this.player.maxHp = Math.round(baseStats.baseHp * hpMult);
    this.player.bodyDmg = baseStats.bodyDmg;
    this.player.hp = Math.min(this.player.maxHp, Math.max(1, this.player.maxHp * ratio));
    UI.updateHUD();
  },

  rebuildActivePetals() {
    this.activePetals = [];
    const slots = Progression.equipped.slice(0, Progression.getSlotCount());
    const dupBonus = Progression.talents.duplicator.tier;

    slots.forEach((item, slotIdx) => {
      if (!item) return;
      const stats = PetalHelper.getStats(item.petalId, item.rarityId);
      const count = (stats.cluster || 1) + (stats.cluster ? 0 : dupBonus);
      for (let c = 0; c < count; c++) {
        this.activePetals.push({
          slotIdx,
          subIdx: c,
          subTotal: count,
          stats,
          hp: stats.maxHp,
          reloadTimer: 0,
          dead: false,
          x: this.player.x,
          y: this.player.y
        });
      }
    });
  },

  startWave(num) {
    this.wave = num;
    this.mobs = WaveManager.spawnWave(num);
    UI.updateHUD();
  },

  respawn() {
    document.getElementById('death-modal').classList.remove('open');
    Progression.resetRunCollection();
    this.player.hp = this.player.maxHp;
    this.player.x = 0;
    this.player.y = 0;
    this.projectiles = [];
    this.startWave(Math.max(1, this.wave - 1));
  },

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    if (dt > 0) DebugLog.fps = DebugLog.fps * 0.9 + (1 / dt) * 0.1;

    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.loop(t));
  },

  update(dt) {
    const modalOpen = UI.isAnyModalOpen();
    if (modalOpen) this.input.useMouseMove = false;

    if (!modalOpen) {
      let vx = 0, vy = 0;
      if (this.input.keys['KeyW'] || this.input.keys['ArrowUp'])    { vy -= 1; this.input.useMouseMove = false; }
      if (this.input.keys['KeyS'] || this.input.keys['ArrowDown'])  { vy += 1; this.input.useMouseMove = false; }
      if (this.input.keys['KeyA'] || this.input.keys['ArrowLeft'])  { vx -= 1; this.input.useMouseMove = false; }
      if (this.input.keys['KeyD'] || this.input.keys['ArrowRight']) { vx += 1; this.input.useMouseMove = false; }

      if (vx !== 0 || vy !== 0) {
        const len = Math.hypot(vx, vy);
        this.player.x += (vx / len) * GameConfig.BASE_PLAYER_SPEED * dt;
        this.player.y += (vy / len) * GameConfig.BASE_PLAYER_SPEED * dt;
      } else if (this.input.useMouseMove) {
        const dist = Math.hypot(this.input.mouseX, this.input.mouseY);
        if (dist > 12) {
          const speedFactor = Math.min(1, dist / 120);
          this.player.x += (this.input.mouseX / dist) * GameConfig.BASE_PLAYER_SPEED * speedFactor * dt;
          this.player.y += (this.input.mouseY / dist) * GameConfig.BASE_PLAYER_SPEED * speedFactor * dt;
        }
      }
    }

    const pDist = Math.hypot(this.player.x, this.player.y);
    if (pDist > GameConfig.ARENA_RADIUS - this.player.radius) {
      const ang = Math.atan2(this.player.y, this.player.x);
      this.player.x = Math.cos(ang) * (GameConfig.ARENA_RADIUS - this.player.radius);
      this.player.y = Math.sin(ang) * (GameConfig.ARENA_RADIUS - this.player.radius);
    }

    if (this.player.invuln > 0) this.player.invuln -= dt;

    const attacking = this.input.mouseDownLeft || this.input.keys['Space'];
    const defending = this.input.mouseDownRight || this.input.keys['ShiftLeft'];

    let spinBonus = 1 + Progression.talents.rotationSpeed.tier * 0.15;
    let passiveRegen = 0;
    this.activePetals.forEach(p => {
      if (!p.dead && p.stats.spinBonus) spinBonus += p.stats.spinBonus;
      if (!p.dead && p.stats.regenBonus) passiveRegen += p.stats.regenBonus;
    });

    if (passiveRegen > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + passiveRegen * dt);
    }

    this.orbitAngle += GameConfig.BASE_SPIN_SPEED * spinBonus * dt;
    let targetOrbit = GameConfig.BASE_ORBIT_RADIUS;
    if (attacking) targetOrbit *= GameConfig.ATTACK_ORBIT_MULT;
    else if (defending) targetOrbit *= GameConfig.DEFEND_ORBIT_MULT;

    this.currentOrbitRadius += (targetOrbit - this.currentOrbitRadius) * Math.min(1, dt * 12);

    const totalSlots = Math.max(1, Progression.getSlotCount());

    this.activePetals.forEach(p => {
      if (p.dead) {
        p.reloadTimer -= dt;
        if (p.reloadTimer <= 0) {
          p.dead = false;
          p.hp = p.stats.maxHp;
          if (p.stats.heal) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + p.stats.heal);
          }
        }
        return;
      }

      const baseAng = this.orbitAngle + (Math.PI * 2 * p.slotIdx) / totalSlots;
      const subOffset = p.subTotal > 1 ? ((p.subIdx / p.subTotal) * Math.PI * 2) : 0;
      const orbitR = p.subTotal > 1 ? this.currentOrbitRadius + Math.sin(subOffset + this.orbitAngle * 2) * 14 : this.currentOrbitRadius;
      const ang = baseAng + (p.subTotal > 1 ? Math.cos(subOffset + this.orbitAngle * 2) * 0.18 : 0);

      p.x = this.player.x + Math.cos(ang) * orbitR;
      p.y = this.player.y + Math.sin(ang) * orbitR;
    });

    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const m = this.mobs[i];
      const dx = this.player.x - m.x;
      const dy = this.player.y - m.y;
      const dist = Math.hypot(dx, dy) || 1;
      const minDist = this.player.radius + m.radius;

      if (dist < minDist) {
        const overlap = minDist - dist;
        const pushX = (dx / dist) * overlap * 0.5;
        const pushY = (dy / dist) * overlap * 0.5;
        this.player.x += pushX;
        this.player.y += pushY;
        m.x -= pushX;
        m.y -= pushY;

        if (this.player.invuln <= 0) {
          this.player.hp -= m.dmg;
          m.hp -= Math.max(1, this.player.bodyDmg - m.armor);
          this.player.invuln = 0.45;
        }
      }

      m.aiTimer += dt;

      if (m.def.ai === 'chase' || m.def.ai === 'dash') {
        const dashMult = (m.def.ai === 'dash' && Math.sin(m.aiTimer * 4) > 0.6) ? 1.8 : 1;
        m.x += (dx / dist) * m.def.speed * dashMult * dt;
        m.y += (dy / dist) * m.def.speed * dashMult * dt;
      } else if (m.def.ai === 'ranged') {
        if (dist > 260) {
          m.x += (dx / dist) * m.def.speed * dt;
          m.y += (dy / dist) * m.def.speed * dt;
        }
        if (m.aiTimer > 2.4) {
          m.aiTimer = 0;
          this.projectiles.push({
            x: m.x, y: m.y,
            vx: (dx / dist) * 320,
            vy: (dy / dist) * 320,
            dmg: m.dmg * 0.7,
            radius: 7,
            life: 2.5
          });
        }
      } else if (m.def.ai === 'drift') {
        m.x += Math.cos(m.aiTimer * 0.5) * m.def.speed * dt;
        m.y += Math.sin(m.aiTimer * 0.5) * m.def.speed * dt;
      }

      this.activePetals.forEach(p => {
        if (p.dead || m.hp <= 0) return;
        const pDistToMob = Math.hypot(p.x - m.x, p.y - m.y);
        if (pDistToMob < p.stats.radius + m.radius) {
          const mobIncomingDmg = m.dmg * 0.35;
          const netDmg = Math.max(1, p.stats.dmg - m.armor);
          m.hp -= netDmg;

          if (p.hp > mobIncomingDmg) {
            p.hp -= mobIncomingDmg * 0.2;
          } else {
            p.hp -= mobIncomingDmg;
            m.x -= (dx / dist) * 10;
            m.y -= (dy / dist) * 10;
          }

          if (p.hp <= 0) {
            p.dead = true;
            p.reloadTimer = p.stats.reload;
          }
        }
      });

      if (m.hp <= 0) {
        Progression.unlockMob(m.type, m.rarity.id);
        this.onMobKilled(m);
        this.mobs.splice(i, 1);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      if (Math.hypot(pr.x - this.player.x, pr.y - this.player.y) < pr.radius + this.player.radius) {
        if (this.player.invuln <= 0) {
          this.player.hp -= pr.dmg;
          this.player.invuln = 0.3;
        }
        this.projectiles.splice(i, 1);
        continue;
      }
      if (pr.life <= 0) this.projectiles.splice(i, 1);
    }

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      const dist = Math.hypot(d.x - this.player.x, d.y - this.player.y);
      if (dist < 130) {
        d.x += ((this.player.x - d.x) / dist) * 280 * dt;
        d.y += ((this.player.y - d.y) / dist) * 280 * dt;
      }
      if (dist < this.player.radius + 14) {
        Progression.addPetal(d.petalId, d.rarityId, 1);
        UI.toast(`Picked up ${GameConfig.RARITIES[d.rarityId].name} ${PetalDB[d.petalId].name}`);
        this.drops.splice(i, 1);
      }
    }

    if (this.player.hp <= 0) {
      DebugLog.log('PLAYER', `Defeated on Wave ${this.wave}. Showing summary.`);
      UI.showDeathSummary();
      this.player.hp = this.player.maxHp;
    }

    if (this.mobs.length === 0) {
      this.waveCooldown += dt;
      if (this.waveCooldown > 1.2) {
        this.waveCooldown = 0;
        this.startWave(this.wave + 1);
      }
    }

    UI.updateHUD();
  },

  onMobKilled(m) {
    Progression.addXp(m.def.xp * m.rarity.petalMult);
    if (Math.random() < 0.75) {
      let r = Math.random();
      let chosen = m.drops[0].petal;
      for (const d of m.drops) {
        r -= d.prob;
        if (r <= 0) { chosen = d.petal; break; }
      }
      this.drops.push({
        x: m.x, y: m.y,
        petalId: chosen,
        rarityId: m.rarity.id
      });
    }
  },

  renderPetalShape(ctx, x, y, r, stats) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = stats.color;
    ctx.strokeStyle = stats.rarity.color;
    ctx.lineWidth = 2.5;

    switch (stats.shape) {
      case 'shard':
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.3);
        ctx.lineTo(r * 0.8, r * 0.8);
        ctx.lineTo(0, r * 0.4);
        ctx.lineTo(-r * 0.8, r * 0.8);
        ctx.closePath();
        break;
      case 'flower':
        for (let i = 0; i < 5; i++) {
          const ang = (Math.PI * 2 / 5) * i;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * (r * 0.4), Math.sin(ang) * (r * 0.4), r * 0.6, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
        break;
      case 'polygon':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI / 3) * i;
          const px = Math.cos(ang) * r, py = Math.sin(ang) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case 'wing':
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.2, r * 0.6, Math.PI / 4, 0, Math.PI * 2);
        break;
      case 'leaf':
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.2);
        ctx.quadraticCurveTo(r * 1.2, 0, 0, r * 1.2);
        ctx.quadraticCurveTo(-r * 1.2, 0, 0, -r * 1.2);
        break;
      case 'cluster':
        for (let i = 0; i < 3; i++) {
          const ang = (Math.PI * 2 / 3) * i;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * (r * 0.5), Math.sin(ang) * (r * 0.5), r * 0.6, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
        break;
      default:
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        break;
    }
    if (stats.shape !== 'flower' && stats.shape !== 'cluster') {
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  },

  renderMobShape(ctx, m, isMini = false) {
    const { x, y, radius: r, def, rarity } = m;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = def.color;
    ctx.strokeStyle = rarity.color;
    ctx.lineWidth = isMini ? 1.5 : 3;

    switch (def.shape) {
      case 'ladybug':
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(0, -r * 0.4, r * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.3, 0, Math.PI * 2); ctx.fill();
        break;
      case 'bee':
        ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.ellipse(-r * 0.2, -r * 0.8, r * 0.4, r * 0.2, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(r * 0.2, -r * 0.8, r * 0.4, r * 0.2, 0.3, 0, Math.PI * 2); ctx.fill();
        break;
      case 'rock':
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
          const ang = (Math.PI * 2 / 7) * i;
          const pr = r * (0.8 + Math.sin(i * 3) * 0.2);
          const px = Math.cos(ang) * pr, py = Math.sin(ang) * pr;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case 'hornet':
        ctx.beginPath(); ctx.moveTo(r * 1.3, 0); ctx.lineTo(-r, -r * 0.8); ctx.lineTo(-r * 0.6, 0); ctx.lineTo(-r, r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case 'spider':
        ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = def.color; ctx.lineWidth = isMini ? 1 : 2.5;
        for (let i = 0; i < 8; i++) {
          const ang = (Math.PI / 4) * i;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * r * 1.5, Math.sin(ang) * r * 1.5); ctx.stroke();
        }
        break;
      case 'cactus':
        ctx.beginPath(); ctx.roundRect(-r * 0.4, -r, r * 0.8, r * 2, r * 0.4); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(-r, -r * 0.3, r * 2, r * 0.6, r * 0.3); ctx.fill(); ctx.stroke();
        break;
      default:
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        break;
    }
    ctx.restore();
  },

  render() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#1e824c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 - this.player.x, canvas.height / 2 - this.player.y);

    ctx.beginPath();
    ctx.arc(0, 0, GameConfig.ARENA_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#26a65b';
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#196f3d';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    const step = 100;
    for (let x = -GameConfig.ARENA_RADIUS; x <= GameConfig.ARENA_RADIUS; x += step) {
      ctx.beginPath(); ctx.moveTo(x, -GameConfig.ARENA_RADIUS); ctx.lineTo(x, GameConfig.ARENA_RADIUS); ctx.stroke();
    }
    for (let y = -GameConfig.ARENA_RADIUS; y <= GameConfig.ARENA_RADIUS; y += step) {
      ctx.beginPath(); ctx.moveTo(-GameConfig.ARENA_RADIUS, y); ctx.lineTo(GameConfig.ARENA_RADIUS, y); ctx.stroke();
    }

    this.drops.forEach(d => {
      const rar = GameConfig.RARITIES[d.rarityId];
      const stats = PetalHelper.getStats(d.petalId, d.rarityId);
      ctx.fillStyle = rar.color;
      ctx.fillRect(d.x - 12, d.y - 12, 24, 24);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x - 12, d.y - 12, 24, 24);

      this.renderPetalShape(ctx, d.x, d.y, 8, stats);
    });

    this.mobs.forEach(m => {
      this.renderMobShape(ctx, m);

      const bw = m.radius * 1.8;
      const barY = m.y + m.radius + 6;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(m.x - bw / 2, barY, bw, 5);
      ctx.fillStyle = '#2ed573';
      ctx.fillRect(m.x - bw / 2, barY, bw * Math.max(0, m.hp / m.maxHp), 5);

      ctx.font = 'bold 10px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = m.rarity.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.fillText(`${m.rarity.name} ${m.def.name}`, m.x, barY + 16);
      ctx.shadowBlur = 0;
    });

    this.projectiles.forEach(pr => {
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#2f3542';
      ctx.fill();
    });

    this.activePetals.forEach(p => {
      if (p.dead) return;
      this.renderPetalShape(ctx, p.x, p.y, p.stats.radius, p.stats);
    });

    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.player.invuln > 0 ? '#ff7675' : '#ffeaa7';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d63031';
    ctx.stroke();

    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(this.player.x - 7, this.player.y - 4, 3, 0, Math.PI * 2);
    ctx.arc(this.player.x + 7, this.player.y - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
};

window.addEventListener('load', () => Game.init());
