window.Progression = {
  level: 1,
  xp: 0,
  xpNext: 60,
  talentPoints: 0,

  // Tiered Talents with cumulative TP scaling
  talents: {
    health: {
      name: 'Health',
      desc: 'Increases base Flower Health (+25% Common up to +1,060% Eternal)',
      tier: 0,
      maxTier: 9,
      costs: [1, 2, 4, 7, 11, 16, 22, 27, 32], // Cumulative = 122 TP
      bonuses: [0.25, 0.65, 1.25, 2.10, 3.30, 4.80, 6.60, 8.50, 10.60]
    },
    petalHealth: {
      name: 'Petal Health',
      desc: 'Scales petal durability from 115% Common up to 404.56% Eternal',
      tier: 0,
      maxTier: 9,
      costs: [1, 2, 3, 5, 8, 12, 16, 20, 23], // Cumulative = 90 TP
      mults: [1.15, 1.32, 1.52, 1.75, 2.01, 2.31, 2.66, 3.06, 4.0456]
    },
    loadout: {
      name: 'Loadout',
      desc: 'Unlocks +1 equipped petal slot per tier (up to 10 slots)',
      tier: 0,
      maxTier: 5,
      costs: [1, 3, 6, 10, 15]
    },
    duplicator: {
      name: 'Duplicator',
      desc: 'Adds extra orbiting petal copies to single-petal slots',
      tier: 0,
      maxTier: 3,
      costs: [5, 15, 30]
    },
    rotationSpeed: {
      name: 'Rotation Speed',
      desc: '+15% petal spin speed per tier',
      tier: 0,
      maxTier: 6,
      costs: [1, 2, 4, 6, 9, 12]
    }
  },

  inventory: {
    'basic_0': 5,
    'rose_0': 2,
    'stinger_0': 2
  },

  equipped: [
    { petalId: 'basic', rarityId: 0 },
    { petalId: 'basic', rarityId: 0 },
    { petalId: 'rose',  rarityId: 0 },
    { petalId: 'stinger', rarityId: 0 },
    null
  ],

  runCollected: {},
  unlockedMobs: JSON.parse(localStorage.getItem('florr_unlocked_mobs') || '{}'),

  getSlotCount() {
    return Math.min(GameConfig.MAX_SLOTS, GameConfig.BASE_SLOTS + this.talents.loadout.tier);
  },

  getHealthBonus() {
    const t = this.talents.health;
    return t.tier > 0 ? t.bonuses[t.tier - 1] : 0;
  },

  getPetalHpMultiplier() {
    const t = this.talents.petalHealth;
    return t.tier > 0 ? t.mults[t.tier - 1] : 1.0;
  },

  resetRunCollection() {
    this.runCollected = {};
  },

  unlockMob(type, rarityId) {
    const key = `${type}_${rarityId}`;
    if (!this.unlockedMobs[key]) {
      this.unlockedMobs[key] = true;
      localStorage.setItem('florr_unlocked_mobs', JSON.stringify(this.unlockedMobs));
    }
  },

  addXp(amount) {
    this.xp += amount;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      // Grants 1-3 TP depending on milestone level
      const tpGain = this.level % 5 === 0 ? 2 : 1;
      this.talentPoints += tpGain;
      // Exponential XP cost curve
      this.xpNext = Math.round(this.xpNext * 1.48);
      if (window.Game) Game.recalcPlayerStats();
      DebugLog.log('LEVEL', `Reached Level ${this.level}! +${tpGain} TP`);
      UI.toast(`Level Up! Lvl ${this.level} (+${tpGain} TP)`);
    }
    UI.updateHUD();
  },

  addPetal(petalId, rarityId, count = 1) {
    const key = `${petalId}_${rarityId}`;
    this.inventory[key] = (this.inventory[key] || 0) + count;
    this.runCollected[key] = (this.runCollected[key] || 0) + count;
  },

  equip(petalId, rarityId) {
    const key = `${petalId}_${rarityId}`;
    if (!this.inventory[key] || this.inventory[key] <= 0) return;

    while (this.equipped.length < this.getSlotCount()) this.equipped.push(null);

    const emptyIdx = this.equipped.findIndex(s => s === null);
    if (emptyIdx === -1) {
      UI.toast('Loadout full! Click a bottom slot to unequip first.');
      return;
    }

    this.inventory[key]--;
    if (this.inventory[key] <= 0) delete this.inventory[key];
    this.equipped[emptyIdx] = { petalId, rarityId };

    if (window.Game) Game.rebuildActivePetals();
    UI.renderLoadout();
    UI.renderInventory();
  },

  unequip(slotIndex) {
    const item = this.equipped[slotIndex];
    if (!item) return;
    this.addPetal(item.petalId, item.rarityId, 1);
    this.equipped[slotIndex] = null;

    if (window.Game) Game.rebuildActivePetals();
    UI.renderLoadout();
    UI.renderInventory();
  },

  craft(petalId, rarityId, silent = false) {
    const key = `${petalId}_${rarityId}`;
    const count = this.inventory[key] || 0;
    const rar = GameConfig.RARITIES[rarityId];
    const maxTier = GameConfig.RARITIES.length - 1;
    if (count < 5 || !rar || rarityId >= maxTier) return false;

    this.inventory[key] -= 5;
    if (this.inventory[key] <= 0) delete this.inventory[key];

    if (Math.random() < rar.craftChance) {
      this.addPetal(petalId, rarityId + 1, 1);
      DebugLog.log('CRAFT', `SUCCESS: 5x ${PetalDB[petalId].name} (${rar.name}) -> ${GameConfig.RARITIES[rarityId + 1].name}`);
      if (!silent) UI.toast(`Crafted ${GameConfig.RARITIES[rarityId + 1].name} ${PetalDB[petalId].name}!`);
      return true;
    } else {
      // Destroys 1-4 petals on failure (refunds 1-4)
      const refunded = Math.floor(Math.random() * 4) + 1;
      this.addPetal(petalId, rarityId, refunded);
      DebugLog.log('CRAFT', `FAILED: ${PetalDB[petalId].name} (${rar.name}), ${5 - refunded} destroyed`);
      if (!silent) UI.toast(`Craft failed! ${5 - refunded} petals destroyed.`);
      return false;
    }
  },

  craftAll() {
    let successes = 0;
    let attempts = 0;
    const maxTier = GameConfig.RARITIES.length - 1;
    for (let r = 0; r < maxTier; r++) {
      Object.keys(PetalDB).forEach(pId => {
        const key = `${pId}_${r}`;
        while ((this.inventory[key] || 0) >= 5) {
          attempts++;
          if (this.craft(pId, r, true)) successes++;
        }
      });
    }
    UI.toast(attempts > 0 ? `Craft All: ${successes}/${attempts} succeeded!` : 'Need 5 identical petals to craft.');
  },

  upgradeTalent(key) {
    const t = this.talents[key];
    if (!t || t.tier >= t.maxTier) return;
    const cost = t.costs[t.tier];
    if (this.talentPoints < cost) return;

    this.talentPoints -= cost;
    t.tier++;

    if (key === 'loadout') {
      while (this.equipped.length < this.getSlotCount()) this.equipped.push(null);
      UI.renderLoadout();
    }
    if (window.Game) {
      Game.recalcPlayerStats();
      Game.rebuildActivePetals();
    }

    const tierName = GameConfig.RARITIES[t.tier - 1]?.name || `Tier ${t.tier}`;
    DebugLog.log('TALENT', `Upgraded ${t.name} to ${tierName} (Cost: ${cost} TP)`);
    UI.renderTalents();
    UI.updateHUD();
  }
};
