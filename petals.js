window.PetalDB = {
  basic: {
    id: 'basic',
    name: 'Basic',
    baseDmg: 12,
    baseHp: 12,
    reload: 2.2,
    radius: 10,
    color: '#ffffff',
    desc: 'Balanced starter petal.'
  },
  stinger: {
    id: 'stinger',
    name: 'Stinger',
    baseDmg: 38,
    baseHp: 8,
    reload: 3.8,
    radius: 9,
    color: '#2f3542',
    desc: 'High burst damage, breaks easily.'
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    baseDmg: 5,
    baseHp: 10,
    reload: 3.2,
    heal: 14,
    radius: 11,
    color: '#ff6b81',
    desc: 'Restores flower HP while active.'
  },
  rock: {
    id: 'rock',
    name: 'Rock',
    baseDmg: 16,
    baseHp: 50,
    reload: 4.5,
    radius: 14,
    color: '#747d8c',
    desc: 'Heavy tank petal that absorbs hits.'
  },
  faster: {
    id: 'faster',
    name: 'Faster',
    baseDmg: 9,
    baseHp: 10,
    reload: 1.8,
    spinBonus: 0.28,
    radius: 8,
    color: '#eccc68',
    desc: 'Increases overall petal spin speed.'
  },
  leaf: {
    id: 'leaf',
    name: 'Leaf',
    baseDmg: 14,
    baseHp: 18,
    reload: 2.4,
    regenBonus: 2.5,
    radius: 11,
    color: '#2ed573',
    desc: 'Passively regenerates flower HP.'
  },
  peas: {
    id: 'peas',
    name: 'Peas',
    baseDmg: 8,
    baseHp: 8,
    reload: 2.8,
    cluster: 3,
    radius: 7,
    color: '#7bed9f',
    desc: 'Splits into 3 orbiting mini-peas.'
  }
};

window.PetalHelper = {
  getStats(petalId, rarityId) {
    const def = PetalDB[petalId] || PetalDB.basic;
    const rar = GameConfig.RARITIES[rarityId] || GameConfig.RARITIES[0];
    return {
      ...def,
      rarity: rar,
      dmg: def.baseDmg * rar.mult,
      maxHp: def.baseHp * rar.mult,
      heal: (def.heal || 0) * rar.mult,
      regenBonus: (def.regenBonus || 0) * rar.mult
    };
  }
};

DebugLog.log('SYSTEM', `Loaded ${Object.keys(PetalDB).length} petal definitions.`);
