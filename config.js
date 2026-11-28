window.GameConfig = {
  VERSION: '2.0.0-florr-scaling',
  ARENA_RADIUS: 1400,
  BASE_SLOTS: 5,
  MAX_SLOTS: 10,
  BASE_PLAYER_SPEED: 240,
  BASE_ORBIT_RADIUS: 68,
  ATTACK_ORBIT_MULT: 1.85,
  DEFEND_ORBIT_MULT: 0.58,
  BASE_SPIN_SPEED: 2.6,

  // 9 Rarity Tiers: Petals scale ~3x per step; Mobs scale 5x -> 25x -> 125x -> 625x -> 3125x -> 78125x -> 390625x -> 1953125x
  RARITIES: [
    { id: 0, name: 'Common',    color: '#7eef6d', petalMult: 1,     mobMult: 1,       armorBase: 0.8,   craftChance: 0.64 },
    { id: 1, name: 'Unusual',   color: '#ffe65d', petalMult: 3,     mobMult: 5,       armorBase: 2.4,   craftChance: 0.32 },
    { id: 2, name: 'Rare',      color: '#4d52e3', petalMult: 9,     mobMult: 25,      armorBase: 7.2,   craftChance: 0.16 },
    { id: 3, name: 'Epic',      color: '#861fde', petalMult: 27,    mobMult: 125,     armorBase: 21.6,  craftChance: 0.08 },
    { id: 4, name: 'Legendary', color: '#de1f1f', petalMult: 81,    mobMult: 625,     armorBase: 64.8,  craftChance: 0.04 },
    { id: 5, name: 'Mythic',    color: '#1fdbde', petalMult: 243,   mobMult: 3125,    armorBase: 194.4, craftChance: 0.02 },
    { id: 6, name: 'Ultra',     color: '#ff2b75', petalMult: 729,   mobMult: 78125,   armorBase: 583.2, craftChance: 0.01 },
    { id: 7, name: 'Super',     color: '#2bffa3', petalMult: 2187,  mobMult: 390625,  armorBase: 1750,  craftChance: 0.005 },
    { id: 8, name: 'Eternal',   color: '#ffffff', petalMult: 6561,  mobMult: 1953125, armorBase: 5250,  craftChance: 0.00 }
  ],

  getPlayerBaseStats(level) {
    // Scales exponentially from Level 1 (200 HP, 10 Body Dmg) to Level 55 (11,634 HP, 1,454.2 Body Dmg)
    const clampedLvl = Math.min(55, Math.max(1, level));
    const progress = (clampedLvl - 1) / 54;
    const baseHp = Math.round(200 * Math.pow(11634 / 200, progress));
    const bodyDmg = +(10 * Math.pow(1454.2 / 10, progress)).toFixed(1);
    return { baseHp, bodyDmg };
  },

  formatNum(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return Math.round(n).toString();
  }
};

window.DebugLog = {
  logs: [],
  errors: [],
  fps: 60,

  log(tag, message) {
    const time = new Date().toISOString().split('T')[1].slice(0, 8);
    this.logs.push(`[${time}][${tag}] ${message}`);
    if (this.logs.length > 40) this.logs.shift();
  },

  initErrorCatcher() {
    window.addEventListener('error', (e) => {
      const err = `${e.message} (${e.filename.split('/').pop()}:${e.lineno})`;
      this.errors.push(err);
      this.log('ERROR', err);
    });
  },

  generateReport() {
    const state = window.Game ? {
      wave: Game.wave,
      mobsAlive: Game.mobs.length,
      player: {
        hp: Math.round(Game.player.hp),
        maxHp: Math.round(Game.player.maxHp),
        bodyDmg: Game.player.bodyDmg,
        level: Progression.level,
        tp: Progression.talentPoints
      },
      equipped: Progression.equipped,
      talents: Progression.talents
    } : { status: 'Not initialized' };

    return JSON.stringify({
      version: GameConfig.VERSION,
      fps: Math.round(this.fps),
      state,
      errors: this.errors,
      recentEvents: this.logs.slice(-20)
    }, null, 2);
  },

  copyReport() {
    const textarea = document.getElementById('debug-output');
    textarea.value = this.generateReport();
    textarea.select();
    navigator.clipboard.writeText(textarea.value);
    UI.toast('Diagnostic report copied to clipboard!');
  }
};

DebugLog.initErrorCatcher();
DebugLog.log('SYSTEM', 'Config v2.0.0 loaded with 9-tier scaling & Level 55 stat curve.');
