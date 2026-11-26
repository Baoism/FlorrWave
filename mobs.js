window.MobDB = {
  ladybug: {
    id: 'ladybug',
    name: 'Ladybug',
    baseHp: 42,
    baseDmg: 10,
    speed: 95,
    radius: 22,
    xp: 15,
    color: '#ff4757',
    ai: 'chase',
    drops: [
      { petal: 'rose', weight: 60 },
      { petal: 'basic', weight: 40 }
    ]
  },
  bee: {
    id: 'bee',
    name: 'Bee',
    baseHp: 35,
    baseDmg: 18,
    speed: 175,
    radius: 18,
    xp: 20,
    color: '#ffa502',
    ai: 'dash',
    drops: [
      { petal: 'stinger', weight: 55 },
      { petal: 'faster', weight: 45 }
    ]
  },
  boulder: {
    id: 'boulder',
    name: 'Boulder',
    baseHp: 190,
    baseDmg: 22,
    speed: 18,
    radius: 36,
    xp: 35,
    color: '#57606f',
    ai: 'drift',
    drops: [
      { petal: 'rock', weight: 80 },
      { petal: 'basic', weight: 20 }
    ]
  },
  hornet: {
    id: 'hornet',
    name: 'Hornet',
    baseHp: 75,
    baseDmg: 20,
    speed: 130,
    radius: 24,
    xp: 30,
    color: '#eccc68',
    ai: 'ranged',
    drops: [
      { petal: 'stinger', weight: 50 },
      { petal: 'faster', weight: 50 }
    ]
  },
  spider: {
    id: 'spider',
    name: 'Spider',
    baseHp: 90,
    baseDmg: 24,
    speed: 160,
    radius: 25,
    xp: 35,
    color: '#2f3542',
    ai: 'chase',
    drops: [
      { petal: 'faster', weight: 50 },
      { petal: 'leaf', weight: 50 }
    ]
  },
  cactus: {
    id: 'cactus',
    name: 'Cactus',
    baseHp: 140,
    baseDmg: 28,
    speed: 0,
    radius: 30,
    xp: 28,
    color: '#2ed573',
    ai: 'stationary',
    drops: [
      { petal: 'peas', weight: 60 },
      { petal: 'leaf', weight: 40 }
    ]
  }
};

window.WaveManager = {
  spawnWave(waveNum) {
    const mobs = [];
    const count = 6 + Math.floor(waveNum * 2.4);
    const pool = ['ladybug', 'bee', 'boulder'];
    if (waveNum >= 2) pool.push('cactus');
    if (waveNum >= 3) pool.push('hornet');
    if (waveNum >= 4) pool.push('spider');

    // Determine mob rarity scaling based on wave
    const maxRarity = Math.min(5, Math.floor((waveNum - 1) / 3));

    for (let i = 0; i < count; i++) {
      const typeKey = pool[Math.floor(Math.random() * pool.length)];
      const def = MobDB[typeKey];
      const rarityId = Math.random() < 0.35 ? maxRarity : Math.max(0, maxRarity - 1);
      const rar = GameConfig.RARITIES[rarityId];

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = GameConfig.ARENA_RADIUS * (0.55 + Math.random() * 0.35);

      mobs.push({
        id: Math.random().toString(36).slice(2),
        type: typeKey,
        def,
        rarity: rar,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        hp: def.baseHp * rar.mult,
        maxHp: def.baseHp * rar.mult,
        dmg: def.baseDmg * rar.mult,
        radius: def.radius * (1 + rarityId * 0.08),
        aiTimer: Math.random() * 2
      });
    }

    DebugLog.log('WAVE', `Spawned Wave ${waveNum} (${mobs.length} mobs, max rarity: ${GameConfig.RARITIES[maxRarity].name})`);
    return mobs;
  }
};
