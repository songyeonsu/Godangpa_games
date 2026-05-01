export const ACCESSORY_RARITIES = ["common", "rare", "epic", "legendary"];

export const ACCESSORY_RARITY_LABELS = {
  common: "일반",
  rare: "희귀",
  epic: "영웅",
  legendary: "전설",
};

export const DUPLICATE_ACCESSORY_GOLD = {
  common: 20,
  rare: 50,
  epic: 100,
  legendary: 200,
};

export const ACCESSORY_EFFECT_LABELS = {
  attackBonus: "공격력",
  defenseBonus: "방어력",
  maxHpBonus: "최대 HP",
  diceTotalBonus: "주사위 합계",
  diceMinBonus: "주사위 최소값",
  doubleDamageBonus: "공격 더블 치명타 배율",
  doubleDefenseBonus: "방어 더블 강화 배율",
  potionDropBonus: "물약 드랍 확률",
  healAfterBattle: "전투 승리 후 HP 회복",
  firstTurnAttackBonus: "첫 공격턴 공격력",
  lowHpAttackBonus: "낮은 체력 공격력",
  perfectDefenseHeal: "완전 방어 회복",
  enemyAttackReduction: "적 공격 감소",
  goldBonus: "골드 획득량",
  bossDamageBonus: "보스 피해",
};

export const ACCESSORIES = [
  {
    id: "lucky_charm",
    name: "행운의 부적",
    rarity: "common",
    description: "공격과 방어 주사위 합계가 1 증가합니다.",
    effects: [{ type: "diceTotalBonus", value: 1 }],
  },
  {
    id: "rusty_ring",
    name: "낡은 반지",
    rarity: "common",
    description: "기본 공격력이 1 증가합니다.",
    effects: [{ type: "attackBonus", value: 1 }],
  },
  {
    id: "guard_badge",
    name: "수비대 배지",
    rarity: "common",
    description: "기본 방어력이 1 증가합니다.",
    effects: [{ type: "defenseBonus", value: 1 }],
  },
  {
    id: "small_life_stone",
    name: "작은 생명석",
    rarity: "common",
    description: "최대 체력이 10 증가합니다.",
    effects: [{ type: "maxHpBonus", value: 10 }],
  },
  {
    id: "steady_ring",
    name: "안정의 반지",
    rarity: "rare",
    description: "주사위 최소값이 1 증가합니다.",
    effects: [{ type: "diceMinBonus", value: 1 }],
  },
  {
    id: "sharp_dice_stone",
    name: "날카로운 주사위석",
    rarity: "rare",
    description: "기본 공격력이 1 증가하고 공격/방어 주사위 합계가 1 증가합니다.",
    effects: [
      { type: "attackBonus", value: 1 },
      { type: "diceTotalBonus", value: 1 },
    ],
  },
  {
    id: "thick_guard_plate",
    name: "두꺼운 수호판",
    rarity: "rare",
    description: "기본 방어력이 2 증가하지만 공격력이 1 감소합니다.",
    effects: [
      { type: "defenseBonus", value: 2 },
      { type: "attackBonus", value: -1 },
    ],
  },
  {
    id: "hunter_coin",
    name: "사냥꾼의 동전",
    rarity: "rare",
    description: "몬스터 처치 시 회복 물약 드랍 확률이 10% 증가합니다.",
    effects: [{ type: "potionDropBonus", value: 0.1 }],
  },
  {
    id: "critical_dice_core",
    name: "치명 주사위 핵",
    rarity: "epic",
    description: "공격 더블 치명타 배율이 0.5 증가합니다.",
    effects: [{ type: "doubleDamageBonus", value: 0.5 }],
  },
  {
    id: "guardian_dice_core",
    name: "수호 주사위 핵",
    rarity: "epic",
    description: "방어 더블 강화 방어 배율이 0.5 증가합니다.",
    effects: [{ type: "doubleDefenseBonus", value: 0.5 }],
  },
  {
    id: "vampire_mark",
    name: "흡혈의 문장",
    rarity: "epic",
    description: "전투 승리 시 체력을 15 회복합니다.",
    effects: [{ type: "healAfterBattle", value: 15 }],
  },
  {
    id: "first_strike_feather",
    name: "선공의 깃털",
    rarity: "epic",
    description: "전투 첫 공격턴에 공격력이 3 증가합니다.",
    effects: [{ type: "firstTurnAttackBonus", value: 3 }],
  },
  {
    id: "berserker_eye",
    name: "광전사의 눈",
    rarity: "legendary",
    description: "현재 체력이 30% 이하일 때 공격력이 5 증가합니다.",
    effects: [{ type: "lowHpAttackBonus", value: 5 }],
  },
  {
    id: "holy_guardian_emblem",
    name: "성스러운 수호 문장",
    rarity: "legendary",
    description: "완전 방어 성공 시 체력을 10 회복합니다.",
    effects: [{ type: "perfectDefenseHeal", value: 10 }],
  },
  {
    id: "dragon_slayer_seal",
    name: "용살자의 인장",
    rarity: "legendary",
    description: "보스에게 주는 피해가 20% 증가합니다.",
    effects: [{ type: "bossDamageBonus", value: 0.2 }],
  },
  {
    id: "tower_king_crown",
    name: "탑왕의 왕관",
    rarity: "legendary",
    description: "기본 공격력, 기본 방어력, 주사위 합계가 모두 2 증가합니다.",
    effects: [
      { type: "attackBonus", value: 2 },
      { type: "defenseBonus", value: 2 },
      { type: "diceTotalBonus", value: 2 },
    ],
  },
];

export function getAccessoryById(accessoryId) {
  return ACCESSORIES.find((item) => item.id === accessoryId) || null;
}

export function getAccessoryEffectValue(accessory, effectType) {
  if (!accessory) return 0;
  return (accessory.effects || [])
    .filter((effect) => effect.type === effectType)
    .reduce((sum, effect) => sum + Number(effect.value || 0), 0);
}

export function getAccessoriesByRarity(rarity) {
  return ACCESSORIES.filter((accessory) => accessory.rarity === rarity);
}

export function getRandomAccessoryByRarity(rarity) {
  const candidates = getAccessoriesByRarity(rarity);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function rollWeightedRarity(weights) {
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of weights) {
    roll -= entry.weight;
    if (roll <= 0) return entry.rarity;
  }
  return weights[weights.length - 1]?.rarity || "common";
}

export function rollAccessoryRarity(enemy) {
  const finalBoss = Number(enemy?.floor || 0) >= 10 || enemy?.id === "dragon_boss";
  const boss = Boolean(enemy?.isBoss || enemy?.boss);

  if (finalBoss) {
    return rollWeightedRarity([
      { rarity: "rare", weight: 40 },
      { rarity: "epic", weight: 40 },
      { rarity: "legendary", weight: 20 },
    ]);
  }

  if (boss) {
    return rollWeightedRarity([
      { rarity: "common", weight: 40 },
      { rarity: "rare", weight: 35 },
      { rarity: "epic", weight: 20 },
      { rarity: "legendary", weight: 5 },
    ]);
  }

  return rollWeightedRarity([
    { rarity: "common", weight: 75 },
    { rarity: "rare", weight: 20 },
    { rarity: "epic", weight: 5 },
  ]);
}

export function rollAccessoryDrop(enemy, chances) {
  const boss = Boolean(enemy?.isBoss || enemy?.boss);
  const dropChance = boss ? chances.boss : chances.normal;
  if (Math.random() >= dropChance) return null;
  return getRandomAccessoryByRarity(rollAccessoryRarity(enemy));
}

export function getDuplicateAccessoryGold(accessory) {
  return DUPLICATE_ACCESSORY_GOLD[accessory?.rarity] || 0;
}
