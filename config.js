window.GameConfig = {
  VERSION: '1.0.0-modular',
  ARENA_RADIUS: 1300,
  BASE_SLOTS: 5,
  MAX_SLOTS: 10,
  BASE_PLAYER_HP: 100,
  BASE_PLAYER_SPEED: 240,
  BASE_ORBIT_RADIUS: 68,
  ATTACK_ORBIT_MULT: 1.85,
  DEFEND_ORBIT_MULT: 0.58,
  BASE_SPIN_SPEED: 2.6,

  RARITIES: [
    { id: 0, name: 'Common',    color: '#7eef6d', mult: 1.0,  craftChance: 0.80 },
    { id: 1, name: 'Unusual',   color: '#ffe65d', mult: 1.85, craftChance: 0.65 },
    { id: 2, name: 'Rare',      color: '#4d52e3', mult: 3.4,  craftChance: 0.50 },
    { id: 3, name: 'Epic',      color: '#861fde', mult: 6.2,  craftChance: 0.35 },
    { id: 4, name: 'Legendary', color: '#de1f1f', mult: 11.5, craftChance: 0.20 },
    { id: 5, name: 'Mythic',    color: '#1fdbde', mult: 21.0, craftChance: 0.00 }
  ]
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
        level: Progression.level,
        xp: Math.round(Progression.xp)
      },
      equipped: Progression.equipped,
      talents: Progression.talents,
      inventoryCount: Object.keys(Progression.inventory).length
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
DebugLog.log('SYSTEM', 'Config & DebugLog loaded.');
