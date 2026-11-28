window.PetalDB = {
  basic: {
    id: 'basic',
    name: 'Basic',
    baseDmg: 10,
    baseHp: 10,
    reload: 2.5,
    radius: 11,
    color: '#ffffff',
    shape: 'circle',
    desc: 'A reliable, balanced starter petal.'
  },
  stinger: {
    id: 'stinger',
    name: 'Stinger',
    baseDmg: 35,
    baseHp: 8,
    reload: 4.0,
    radius: 10,
    color: '#2f3542',
    shape: 'shard',
    desc: 'Sharp needle dealing massive burst damage.'
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    baseDmg: 5,
    baseHp: 10,
    reload: 3.5,
    heal: 15,
    radius: 12,
    color: '#ff6b81',
    shape: 'flower',
    desc: 'Restores flower HP when it finishes reloading.'
  },
  rock: {
    id: 'rock',
    name: 'Rock',
    baseDmg: 15,
    baseHp: 45,
    reload: 5.0,
    radius: 15,
    color: '#747d8c',
    shape: 'polygon',
    desc: 'Extremely durable stone that absorbs heavy impacts.'
  },
  faster: {
    id: 'faster',
    name: 'Faster',
    baseDmg: 8,
    baseHp: 10,
    reload: 2.0,
    spinBonus: 0.30,
    radius: 9,
    color: '#eccc68',
    shape: 'wing',
    desc: 'Increases overall petal rotation speed.'
  },
  leaf: {
    id: 'leaf',
    name: 'Leaf',
    baseDmg: 12,
    baseHp: 16,
    reload: 2.5,
    regenBonus: 3.0,
    radius: 12,
    color: '#2ed573',
    shape: 'leaf',
    desc: 'Passively regenerates flower HP every second.'
  },
  peas: {
    id: 'peas',
    name: 'Peas',
    baseDmg: 7,
    baseHp: 8,
    reload: 3.0,
    cluster: 3,
    radius: 7,
    color: '#7bed9f',
    shape: 'cluster',
    desc: 'Splits into a cluster of 3 orbiting pods.'
  }
};

window.PetalHelper = {
  getStats(petalId, rarityId) {
    const def = PetalDB[petalId] || PetalDB.basic;
    const rar = GameConfig.RARITIES[rarityId] || GameConfig.RARITIES[0];
    const petalHpMult = window.Progression ? Progression.getPetalHpMultiplier() : 1;

    return {
      ...def,
      rarity: rar,
      dmg: Math.round(def.baseDmg * rar.petalMult),
      maxHp: Math.round(def.baseHp * rar.petalMult * petalHpMult),
      heal: def.heal ? Math.round(def.heal * rar.petalMult) : 0,
      regenBonus: def.regenBonus ? +(def.regenBonus * rar.petalMult).toFixed(1) : 0
    };
  }
};
