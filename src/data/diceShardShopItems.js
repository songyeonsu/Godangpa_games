import { DICE_SHARD_UPGRADE_COSTS, DICE_SHARD_UPGRADE_MAX_LEVEL } from "../config/gameConfig";

export const diceShardShopItems = [
  {
    id: "base_attack_up",
    name: "기본 공격력 강화",
    description: "기본 공격력이 1 증가합니다.",
    cost: DICE_SHARD_UPGRADE_COSTS.baseAttackLevel,
    maxLevel: DICE_SHARD_UPGRADE_MAX_LEVEL,
    stat: "baseAttackLevel",
    effectText: "기본 공격력",
    effectValue: 1,
  },
  {
    id: "base_defense_up",
    name: "기본 방어력 강화",
    description: "기본 방어력이 1 증가합니다.",
    cost: DICE_SHARD_UPGRADE_COSTS.baseDefenseLevel,
    maxLevel: DICE_SHARD_UPGRADE_MAX_LEVEL,
    stat: "baseDefenseLevel",
    effectText: "기본 방어력",
    effectValue: 1,
  },
  {
    id: "max_hp_up",
    name: "기본 체력 강화",
    description: "기본 최대 체력이 10 증가합니다.",
    cost: DICE_SHARD_UPGRADE_COSTS.maxHpLevel,
    maxLevel: DICE_SHARD_UPGRADE_MAX_LEVEL,
    stat: "maxHpLevel",
    effectText: "최대 체력",
    effectValue: 10,
  },
];
