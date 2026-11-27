window.PetalDB = {
  basic: {
    id: 'basic',
    name: 'Basic',
    baseDmg: 12,
    baseHp: 12,
    reload: 2.2,
    radius: 11,
    color: '#ffffff',
    shape: 'circle',
    desc: 'A reliable, balanced starter petal.'
  },
  stinger: {
    id: 'stinger',
    name: 'Stinger',
    baseDmg: 38,
    baseHp: 8,
    reload: 3.8,
    radius: 10,
    color: '#2f3542',
    shape: 'shard',
    desc: 'Sharp blade that deals high burst damage.'
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    baseDmg: 5,
    baseHp: 10,
    reload: 3.2,
    heal: 14,
    radius: 12,
    color: '#ff6b81',
    shape: 'flower',
    desc: 'A gentle blossom that restores flower HP.'
  },
  rock: {
    id: 'rock',
    name: 'Rock',
    baseDmg: 16,
    baseHp: 50,
    reload: 4.5,
    radius: 15,
    color: '#747d8c',
    shape: 'polygon',
    desc: 'Heavy armored stone that absorbs impacts.'
  },
  faster: {
    id: 'faster',
    name: 'Faster',
    baseDmg: 9,
    baseHp: 10,
    reload: 1.8,
    spinBonus: 0.28,
    radius: 9,
    color: '#eccc68',
    shape: 'wing',
    desc: 'Lightweight design boosting rotation speed.'
  },
  leaf: {
    id: 'leaf',
    name: 'Leaf',
    baseDmg: 14,
    baseHp: 18,
    reload: 2.4,
    regenBonus: 2.5,
    radius: 12,
    color: '#2ed573',
    shape: 'leaf',
    desc: 'Vibrant leaf providing steady passive regen.'
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
    shape: 'cluster',
    desc: 'Splits into a cluster of 3 orbiting pods.'
  }
};

window.PetalHelper = {
  getStats(petalId, rarityId) {
    const def = PetalDB[petalId] || PetalDB.basic;
    const rar = GameConfig.RARITIES[rarityId] || GameConfig.RARITIES[0];
    return {
      ...def,
      rarity: rar,
      dmg: Math.round(def.baseDmg * rar.mult),
      maxHp: Math.round(def.baseHp * rar.mult),
      heal: def.heal ? Math.round(def.heal * rar.mult) : 0,
      regenBonus: def.regenBonus ? +(def.regenBonus * rar.mult).toFixed(1) : 0
    };
  }
};

DebugLog.log('SYSTEM', 'Enhanced petals.js loaded with custom shapes.');
