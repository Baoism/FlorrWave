window.Progression = {
  level: 1,
  xp: 0,
  xpNext: 50,
  talentPoints: 0,

  talents: {
    petalSlots:   { name: 'Extra Petal Slot', desc: '+1 equipped petal slot', level: 0, max: 5 },
    spinSpeed:    { name: 'Rotation Speed',   desc: '+15% petal spin speed',  level: 0, max: 8 },
    reach:        { name: 'Petal Reach',      desc: '+10% attack radius',     level: 0, max: 8 },
    maxHp:        { name: 'Flower Vitality',  desc: '+25% max flower HP',     level: 0, max: 8 },
    reloadSpeed:  { name: 'Quick Reload',     desc: '+12% petal recharge',    level: 0, max: 8 }
  },

  // Key format: "petalId_rarityId" -> count
  inventory: {
    'basic_0': 5,
    'rose_0': 2,
    'stinger_0': 2
  },

  // Array of { petalId, rarityId } or null
  equipped: [
    { petalId: 'basic', rarityId: 0 },
    { petalId: 'basic', rarityId: 0 },
    { petalId: 'rose',  rarityId: 0 },
    { petalId: 'stinger', rarityId: 0 },
    null
  ],

  getSlotCount() {
    return Math.min(GameConfig.MAX_SLOTS, GameConfig.BASE_SLOTS + this.talents.petalSlots.level);
  },

  addXp(amount) {
    this.xp += amount;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.talentPoints++;
      this.xpNext = Math.round(this.xpNext * 1.35);
      DebugLog.log('LEVEL', `Reached Level ${this.level}! +1 Talent Point`);
      UI.toast(`Level Up! Lvl ${this.level} (+1 Talent Point)`);
    }
    UI.updateHUD();
  },

  addPetal(petalId, rarityId, count = 1) {
    const key = `${petalId}_${rarityId}`;
    this.inventory[key] = (this.inventory[key] || 0) + count;
  },

  equip(petalId, rarityId) {
    const key = `${petalId}_${rarityId}`;
    if (!this.inventory[key] || this.inventory[key] <= 0) return;

    // Ensure equipped array matches current slot count
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
    if (count < 5 || !rar || rarityId >= 5) return false;

    this.inventory[key] -= 5;
    if (this.inventory[key] <= 0) delete this.inventory[key];

    if (Math.random() < rar.craftChance) {
      this.addPetal(petalId, rarityId + 1, 1);
      DebugLog.log('CRAFT', `SUCCESS: 5x ${PetalDB[petalId].name} (${rar.name}) -> ${GameConfig.RARITIES[rarityId + 1].name}`);
      if (!silent) UI.toast(`Crafted ${GameConfig.RARITIES[rarityId + 1].name} ${PetalDB[petalId].name}!`);
      return true;
    } else {
      const refunded = Math.floor(Math.random() * 2) + 1;
      this.addPetal(petalId, rarityId, refunded);
      DebugLog.log('CRAFT', `FAILED: ${PetalDB[petalId].name} (${rar.name}), refunded ${refunded}`);
      if (!silent) UI.toast(`Craft failed! ${refunded} returned.`);
      return false;
    }
  },

  craftAll() {
    let successes = 0;
    let attempts = 0;
    for (let r = 0; r < 5; r++) {
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
    if (!t || this.talentPoints <= 0 || t.level >= t.max) return;
    this.talentPoints--;
    t.level++;
    if (key === 'petalSlots') {
      while (this.equipped.length < this.getSlotCount()) this.equipped.push(null);
      UI.renderLoadout();
    }
    if (window.Game) Game.recalcPlayerStats();
    DebugLog.log('TALENT', `Upgraded ${t.name} to Lv.${t.level}`);
    UI.renderTalents();
    UI.updateHUD();
  }
};
