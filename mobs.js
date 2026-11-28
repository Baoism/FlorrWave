window.MobDB = {
  ladybug: {
    id: 'ladybug',
    name: 'Ladybug',
    baseHp: 45,
    baseDmg: 10,
    armorFactor: 0.8,
    speed: 95,
    radius: 22,
    xp: 15,
    color: '#ff4757',
    shape: 'ladybug',
    ai: 'chase',
    drops: [
      { petal: 'rose', baseWeight: 60 },
      { petal: 'basic', baseWeight: 40 }
    ]
  },
  bee: {
    id: 'bee',
    name: 'Bee',
    baseHp: 38,
    baseDmg: 18,
    armorFactor: 0.5,
    speed: 175,
    radius: 18,
    xp: 22,
    color: '#ffa502',
    shape: 'bee',
    ai: 'dash',
    drops: [
      { petal: 'stinger', baseWeight: 55 },
      { petal: 'faster', baseWeight: 45 }
    ]
  },
  boulder: {
    id: 'boulder',
    name: 'Boulder',
    baseHp: 210,
    baseDmg: 22,
    armorFactor: 2.2,
    speed: 18,
    radius: 36,
    xp: 40,
    color: '#57606f',
    shape: 'rock',
    ai: 'drift',
    drops: [
      { petal: 'rock', baseWeight: 80 },
      { petal: 'basic', baseWeight: 20 }
    ]
  },
  hornet: {
    id: 'hornet',
    name: 'Hornet',
    baseHp: 80,
    baseDmg: 20,
    armorFactor: 0.7,
    speed: 130,
    radius: 24,
    xp: 35,
    color: '#eccc68',
    shape: 'hornet',
    ai: 'ranged',
    drops: [
      { petal: 'stinger', baseWeight: 52 },
      { petal: 'faster', baseWeight: 48 }
    ]
  },
  spider: {
    id: 'spider',
    name: 'Spider',
    baseHp: 95,
    baseDmg: 24,
    armorFactor: 0.9,
    speed: 160,
    radius: 25,
    xp: 38,
    color: '#2f3542',
    shape: 'spider',
    ai: 'chase',
    drops: [
      { petal: 'faster', baseWeight: 50 },
      { petal: 'leaf', baseWeight: 50 }
    ]
  },
  cactus: {
    id: 'cactus',
    name: 'Cactus',
    baseHp: 150,
    baseDmg: 28,
    armorFactor: 1.4,
    speed: 0,
    radius: 30,
    xp: 32,
    color: '#2ed573',
    shape: 'cactus',
    ai: 'stationary',
    drops: [
      { petal: 'peas', baseWeight: 62 },
      { petal: 'leaf', baseWeight: 38 }
    ]
  }
};

window.MobHelper = {
  getStats(mobId, rarityId) {
    const def = MobDB[mobId];
    const rar = GameConfig.RARITIES[rarityId] || GameConfig.RARITIES[0];
    const hp = Math.round(def.baseHp * rar.mobMult);
    const dmg = Math.round(def.baseDmg * rar.mobMult);
    const armor = Math.round(rar.armorBase * def.armorFactor);

    // Bounded drop rate scaling: higher rarity shifts weight toward rarer primary drop,
    // while strictly normalizing total probability to 1.0 (100%).
    const scaled = def.drops.map((d, idx) => {
      const powerBoost = idx === 0 ? (1 + rarityId * 0.15) : 1;
      return { petal: d.petal, raw: d.baseWeight * powerBoost };
    });
    const sum = scaled.reduce((acc, item) => acc + item.raw, 0);
    const normalizedDrops = scaled.map(item => ({
      petal: item.petal,
      prob: item.raw / sum,
      chanceText: ((item.raw / sum) * 100).toFixed(1) + '%'
    }));

    return { hp, dmg, armor, normalizedDrops };
  }
};

window.WaveManager = {
  spawnWave(waveNum) {
    const mobs = [];
    const count = 6 + Math.floor(waveNum * 2.2);
    const pool = ['ladybug', 'bee', 'boulder'];
    if (waveNum >= 2) pool.push('cactus');
    if (waveNum >= 3) pool.push('hornet');
    if (waveNum >= 4) pool.push('spider');

    // Scales up across all 9 rarities (0 = Common up to 8 = Eternal)
    const maxRarity = Math.min(8, Math.floor((waveNum - 1) / 3));

    for (let i = 0; i < count; i++) {
      const typeKey = pool[Math.floor(Math.random() * pool.length)];
      const def = MobDB[typeKey];
      const rarityId = Math.random() < 0.35 ? maxRarity : Math.max(0, maxRarity - 1);
      const rar = GameConfig.RARITIES[rarityId];
      const stats = MobHelper.getStats(typeKey, rarityId);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = GameConfig.ARENA_RADIUS * (0.55 + Math.random() * 0.35);

      mobs.push({
        id: Math.random().toString(36).slice(2),
        type: typeKey,
        def,
        rarity: rar,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        hp: stats.hp,
        maxHp: stats.hp,
        dmg: stats.dmg,
        armor: stats.armor,
        drops: stats.normalizedDrops,
        speed: def.speed,
        radius: def.radius * (1 + rarityId * 0.06),
        aiTimer: Math.random() * 2
      });
    }

    DebugLog.log('WAVE', `Spawned Wave ${waveNum} (${mobs.length} mobs, max rarity: ${GameConfig.RARITIES[maxRarity].name})`);
    return mobs;
  }
};
