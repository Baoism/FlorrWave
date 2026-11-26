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
    if (id === 'inv-modal') this.renderInventory();
    if (id === 'talent-modal') this.renderTalents();
    if (id === 'debug-modal') {
      document.getElementById('debug-output').value = DebugLog.generateReport();
    }
  },

  closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
  },

  updateHUD() {
    if (!window.Game) return;
    document.getElementById('wave-label').textContent = `Wave ${Game.wave}`;
    document.getElementById('mobs-label').textContent = `Mobs: ${Game.mobs.length}`;
    document.getElementById('lvl-label').textContent = `Lvl ${Progression.level}`;
    document.getElementById('xp-bar-fill').style.width = `${Math.min(100, (Progression.xp / Progression.xpNext) * 100)}%`;
    document.getElementById('hp-label').textContent = `HP: ${Math.ceil(Game.player.hp)}/${Math.ceil(Game.player.maxHp)}`;

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
        const def = PetalDB[item.petalId];
        const rar = GameConfig.RARITIES[item.rarityId];
        div.style.borderColor = rar.color;
        div.innerHTML = `<div class="slot-dot" style="background:${def.color}"></div><span>${def.name}</span>`;
      } else {
        div.innerHTML = `<span style="color:#666">Empty</span>`;
      }
      bar.appendChild(div);
    }
  },

  renderInventory() {
    const grid = document.getElementById('inv-grid');
    grid.innerHTML = '';
    const keys = Object.keys(Progression.inventory).sort((a, b) => {
      const [pA, rA] = a.split('_');
      const [pB, rB] = b.split('_');
      return Number(rB) - Number(rA) || pA.localeCompare(pB);
    });

    if (keys.length === 0) {
      grid.innerHTML = '<p style="color:#888; grid-column:1/-1;">No unequipped petals. Defeat mobs to collect drops!</p>';
      return;
    }

    keys.forEach(key => {
      const count = Progression.inventory[key];
      const [petalId, rarityStr] = key.split('_');
      const rarityId = Number(rarityStr);
      const def = PetalDB[petalId];
      const rar = GameConfig.RARITIES[rarityId];

      const card = document.createElement('div');
      card.className = 'inv-card';
      card.style.borderColor = rar.color;
      card.innerHTML = `
        <div class="slot-dot" style="background:${def.color}"></div>
        <strong style="color:${rar.color}">${def.name} x${count}</strong>
        <span style="font-size:10px; color:#bbb">${rar.name}</span>
        <button class="btn-equip" onclick="Progression.equip('${petalId}', ${rarityId})">Equip</button>
        <button class="btn-craft" ${count < 5 || rarityId >= 5 ? 'disabled' : ''} onclick="Progression.craft('${petalId}', ${rarityId}); UI.renderInventory();">
          ${rarityId >= 5 ? 'Max Tier' : `Craft (${Math.round(rar.craftChance * 100)}%)`}
        </button>
      `;
      grid.appendChild(card);
    });
  },

  renderTalents() {
    document.getElementById('tp-count').textContent = Progression.talentPoints;
    const list = document.getElementById('talent-list');
    list.innerHTML = '';
    Object.entries(Progression.talents).forEach(([key, t]) => {
      const row = document.createElement('div');
      row.className = 'talent-row';
      row.innerHTML = `
        <div>
          <strong>${t.name}</strong> <span style="color:#4cd137">(Lv.${t.level}/${t.max})</span>
          <div style="font-size:12px; color:#aaa">${t.desc}</div>
        </div>
        <button class="talent-btn" ${Progression.talentPoints <= 0 || t.level >= t.max ? 'disabled' : ''} onclick="Progression.upgradeTalent('${key}')">
          Upgrade (1 TP)
        </button>
      `;
      list.appendChild(row);
    });
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

  player: {
    x: 0, y: 0,
    radius: 22,
    hp: 100, maxHp: 100,
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

    // Input Listeners
    window.addEventListener('keydown', e => {
      this.input.keys[e.code] = true;
      if (e.code === 'KeyC') UI.openModal('inv-modal');
      if (e.code === 'KeyT') UI.openModal('talent-modal');
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
    DebugLog.log('GAME', 'Engine initialized successfully.');
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  recalcPlayerStats() {
    const hpMult = 1 + Progression.talents.maxHp.level * 0.25;
    const ratio = this.player.hp / this.player.maxHp;
    this.player.maxHp = GameConfig.BASE_PLAYER_HP * hpMult;
    this.player.hp = Math.min(this.player.maxHp, Math.max(1, this.player.maxHp * ratio));
    UI.updateHUD();
  },

  rebuildActivePetals() {
    this.activePetals = [];
    const slots = Progression.equipped.slice(0, Progression.getSlotCount());
    slots.forEach((item, slotIdx) => {
      if (!item) return;
      const stats = PetalHelper.getStats(item.petalId, item.rarityId);
      const count = stats.cluster || 1;
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

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    if (dt > 0) DebugLog.fps = DebugLog.fps * 0.9 + (1 / dt) * 0.1;

    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.loop(t));
  },

  update(dt) {
    // 1. Player Movement
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

    // Clamp to Arena
    const pDist = Math.hypot(this.player.x, this.player.y);
    if (pDist > GameConfig.ARENA_RADIUS - this.player.radius) {
      const ang = Math.atan2(this.player.y, this.player.x);
      this.player.x = Math.cos(ang) * (GameConfig.ARENA_RADIUS - this.player.radius);
      this.player.y = Math.sin(ang) * (GameConfig.ARENA_RADIUS - this.player.radius);
    }

    if (this.player.invuln > 0) this.player.invuln -= dt;

    // 2. Active Petals & Orbit
    const attacking = this.input.mouseDownLeft || this.input.keys['Space'];
    const defending = this.input.mouseDownRight || this.input.keys['ShiftLeft'];

    let spinBonus = 1 + Progression.talents.spinSpeed.level * 0.15;
    let passiveRegen = 0;
    this.activePetals.forEach(p => {
      if (!p.dead && p.stats.spinBonus) spinBonus += p.stats.spinBonus;
      if (!p.dead && p.stats.regenBonus) passiveRegen += p.stats.regenBonus;
    });

    if (passiveRegen > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + passiveRegen * dt);
    }

    this.orbitAngle += GameConfig.BASE_SPIN_SPEED * spinBonus * dt;
    const reachMult = 1 + Progression.talents.reach.level * 0.10;
    let targetOrbit = GameConfig.BASE_ORBIT_RADIUS;
    if (attacking) targetOrbit *= GameConfig.ATTACK_ORBIT_MULT * reachMult;
    else if (defending) targetOrbit *= GameConfig.DEFEND_ORBIT_MULT;

    const reloadMult = 1 + Progression.talents.reloadSpeed.level * 0.12;
    const totalSlots = Math.max(1, Progression.getSlotCount());

    this.activePetals.forEach(p => {
      if (p.dead) {
        p.reloadTimer -= dt * reloadMult;
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
      const orbitR = p.subTotal > 1 ? targetOrbit + Math.sin(subOffset + this.orbitAngle * 2) * 14 : targetOrbit;
      const ang = baseAng + (p.subTotal > 1 ? Math.cos(subOffset + this.orbitAngle * 2) * 0.18 : 0);

      p.x = this.player.x + Math.cos(ang) * orbitR;
      p.y = this.player.y + Math.sin(ang) * orbitR;
    });

    // 3. Mobs AI & Collisions
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const m = this.mobs[i];
      const dx = this.player.x - m.x;
      const dy = this.player.y - m.y;
      const dist = Math.hypot(dx, dy) || 1;
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

      // Petal vs Mob Collision
      this.activePetals.forEach(p => {
        if (p.dead || m.hp <= 0) return;
        if (Math.hypot(p.x - m.x, p.y - m.y) < p.stats.radius + m.radius) {
          m.hp -= p.stats.dmg;
          p.hp -= m.dmg * 0.35;
          // Knockback
          m.x -= (dx / dist) * 14;
          m.y -= (dy / dist) * 14;
          if (p.hp <= 0) {
            p.dead = true;
            p.reloadTimer = p.stats.reload;
          }
        }
      });

      // Player vs Mob Collision
      if (dist < this.player.radius + m.radius && this.player.invuln <= 0) {
        this.player.hp -= m.dmg;
        this.player.invuln = 0.45;
        this.player.x += (dx / dist) * -35;
        this.player.y += (dy / dist) * -35;
      }

      // Check Mob Death
      if (m.hp <= 0) {
        this.onMobKilled(m);
        this.mobs.splice(i, 1);
      }
    }

    // 4. Projectiles
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

    // 5. Loot Drops Pickup
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

    // 6. Player Death Check
    if (this.player.hp <= 0) {
      DebugLog.log('PLAYER', `Defeated on Wave ${this.wave}. Respawning...`);
      UI.toast(`Defeated on Wave ${this.wave}! Restarting Wave...`);
      this.player.hp = this.player.maxHp;
      this.player.x = 0;
      this.player.y = 0;
      this.projectiles = [];
      this.startWave(Math.max(1, this.wave - 1));
    }

    // 7. Wave Cleared Check
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
    Progression.addXp(m.def.xp * m.rarity.mult);
    if (Math.random() < 0.72) {
      const totalW = m.def.drops.reduce((s, d) => s + d.weight, 0);
      let r = Math.random() * totalW;
      let chosen = m.def.drops[0].petal;
      for (const d of m.def.drops) {
        r -= d.weight;
        if (r <= 0) { chosen = d.petal; break; }
      }
      this.drops.push({
        x: m.x, y: m.y,
        petalId: chosen,
        rarityId: m.rarity.id
      });
    }
  },

  render() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#1e824c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 - this.player.x, canvas.height / 2 - this.player.y);

    // Arena Floor & Grid
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

    // Loot Drops
    this.drops.forEach(d => {
      const rar = GameConfig.RARITIES[d.rarityId];
      const def = PetalDB[d.petalId];
      ctx.fillStyle = rar.color;
      ctx.fillRect(d.x - 12, d.y - 12, 24, 24);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x - 12, d.y - 12, 24, 24);

      ctx.beginPath();
      ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();
    });

    // Mobs
    this.mobs.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fillStyle = m.def.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = m.rarity.color;
      ctx.stroke();

      // Health bar
      const bw = m.radius * 1.8;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(m.x - bw / 2, m.y + m.radius + 6, bw, 5);
      ctx.fillStyle = '#2ed573';
      ctx.fillRect(m.x - bw / 2, m.y + m.radius + 6, bw * Math.max(0, m.hp / m.maxHp), 5);
    });

    // Projectiles
    this.projectiles.forEach(pr => {
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#2f3542';
      ctx.fill();
    });

    // Active Petals
    this.activePetals.forEach(p => {
      if (p.dead) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.stats.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.stats.color;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = p.stats.rarity.color;
      ctx.stroke();
    });

    // Player Flower
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.player.invuln > 0 ? '#ff7675' : '#ffeaa7';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d63031';
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(this.player.x - 7, this.player.y - 4, 3, 0, Math.PI * 2);
    ctx.arc(this.player.x + 7, this.player.y - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
};

window.addEventListener('load', () => Game.init());
