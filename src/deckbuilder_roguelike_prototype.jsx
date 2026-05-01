import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  CircleDot,
  Coins,
  Crown,
  DoorOpen,
  Hammer,
  Heart,
  Lock,
  RotateCcw,
  Shield,
  Skull,
  Sparkles,
  Sword,
  TowerControl,
  Trophy,
  Trash2,
  Zap,
} from "lucide-react";
import {
  DEFAULT_DICE_SHARD_UPGRADES,
  DOUBLE_MULTIPLIER,
  POTION_DROP_CHANCE,
} from "./config/gameConfig";
import { diceShardShopItems } from "./data/diceShardShopItems";

const imagePaths = {
  warrior: {
    character: "/images/warrior/character.png",
    cardBack: "/images/warrior/card-back.png",
    attack: "/images/warrior/slash-card.png",
    defense: "/images/warrior/defense-card.png",
  },
  mage: {
    character: "/images/wizard/character.png",
    cardBack: "/images/wizard/card-back.png",
    attack: "/images/wizard/magic-missile-card.png",
    defense: "/images/wizard/shield-card.png",
  },
  archer: {
    character: "/images/archer/character.png",
    cardBack: "/images/archer/card-back.png",
    attack: "/images/archer/attack-card.png",
    defense: "/images/archer/defense-card.png",
  },
};

const classCardBackImages = {
  warrior: imagePaths.warrior.cardBack,
  mage: imagePaths.mage.cardBack,
  archer: imagePaths.archer.cardBack,
};

const RAW_CARD_POOL = {
  "warrior-slash": {
    id: "warrior-slash",
    rarity: "common",
    cardClass: "warrior",
    name: "베기",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "피해 8, 취약 1",
    description: "적 하나에게 8의 피해를 줍니다. 취약 1을 부여합니다.",
    damage: 8,
    block: 0,
    fullImage: imagePaths.warrior.attack,
    animationType: "slash",
    upgradeOptions: [
      {
        id: "warrior_slash_power",
        name: "강한 베기",
        description: "단일 대상 피해가 크게 증가합니다.",
        resultCardId: "warrior-slash-power",
        cost: {
          gold: 50,
          materials: [{ id: "card_shard", name: "카드 조각", amount: 20 }],
        },
      },
      {
        id: "warrior_slash_wide",
        name: "횡베기",
        description: "선택한 적과 다른 적 하나를 함께 공격합니다.",
        resultCardId: "warrior-slash-wide",
        cost: {
          gold: 80,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 30 },
            { id: "rift_fragment", name: "균열 파편", amount: 1 },
          ],
        },
      },
      {
        id: "warrior_slash_bleed",
        name: "출혈 베기",
        description: "즉시 피해와 함께 출혈을 부여합니다.",
        resultCardId: "warrior-slash-bleed",
        cost: {
          gold: 80,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 25 },
            { id: "red_fang", name: "붉은 송곳니", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(8, player, enemy)),
        vulnerable: enemy.vulnerable + 1,
      },
    }),
  },
  "warrior-slash-power": {
    id: "warrior-slash-power",
    rarity: "rare",
    starLevel: 2,
    cardClass: "warrior",
    name: "강한 베기",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "피해 22, 취약 1",
    description: "적 하나에게 22의 피해를 줍니다. 취약 1을 부여합니다.",
    damage: 22,
    block: 0,
    fullImage: imagePaths.warrior.attack,
    animationType: "impact",
    upgradeOptions: [
      {
        id: "warrior_slash_crimson",
        name: "응혈 베기",
        description: "피해를 유지하면서 출혈을 추가합니다.",
        resultCardId: "warrior-slash-crimson",
        cost: {
          gold: 110,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 45 },
            { id: "red_fang", name: "붉은 송곳니", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(22, player, enemy)),
        vulnerable: enemy.vulnerable + 1,
      },
    }),
  },
  "warrior-slash-wide": {
    id: "warrior-slash-wide",
    rarity: "rare",
    starLevel: 2,
    cardClass: "warrior",
    name: "횡베기",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "적 2명에게 피해 18",
    description: "선택한 적과 다른 적 하나에게 각각 18의 피해를 줍니다.",
    damage: 18,
    block: 0,
    fullImage: imagePaths.warrior.attack,
    animationType: "slash",
    maxTargets: 2,
    upgradeOptions: [
      {
        id: "warrior_slash_inferno_arc",
        name: "폭열 횡베기",
        description: "2명의 적에게 더 큰 피해와 출혈을 부여합니다.",
        resultCardId: "warrior-slash-inferno-arc",
        cost: {
          gold: 160,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 60 },
            { id: "black_iron_heart", name: "흑철 심장", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemies = [], targetIndex = 0 }) => {
      const targets = enemies
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => isEnemyTargetable(entry));
      const orderedTargets = [
        ...targets.filter(({ index }) => index === targetIndex),
        ...targets.filter(({ index }) => index !== targetIndex),
      ].slice(0, 2);
      const nextEnemies = enemies.map((entry) => ({ ...entry }));
      orderedTargets.forEach(({ index }) => {
        const target = nextEnemies[index];
        nextEnemies[index] = { ...target, hp: Math.max(0, target.hp - calcDamage(18, player, target)) };
      });
      return { enemies: nextEnemies };
    },
  },
  "warrior-slash-bleed": {
    id: "warrior-slash-bleed",
    rarity: "rare",
    starLevel: 2,
    cardClass: "warrior",
    name: "출혈 베기",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "피해 20, 출혈 6",
    description: "적 하나에게 20의 피해를 주고 출혈 6을 부여합니다.",
    damage: 20,
    block: 0,
    effect: "출혈 6",
    fullImage: imagePaths.warrior.attack,
    animationType: "slash",
    upgradeOptions: [
      {
        id: "warrior_slash_crimson",
        name: "응혈 베기",
        description: "피해와 출혈이 함께 강화됩니다.",
        resultCardId: "warrior-slash-crimson",
        cost: {
          gold: 110,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 45 },
            { id: "red_fang", name: "붉은 송곳니", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(20, player, enemy)),
        bleed: (enemy.bleed || 0) + 6,
      },
    }),
  },
  "warrior-slash-crimson": {
    id: "warrior-slash-crimson",
    rarity: "epic",
    starLevel: 3,
    cardClass: "warrior",
    name: "응혈 베기",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "피해 34, 출혈 10",
    description: "적 하나에게 34의 피해를 주고 출혈 10을 부여합니다.",
    damage: 34,
    block: 0,
    effect: "출혈 10",
    fullImage: imagePaths.warrior.attack,
    animationType: "slash",
    upgradeOptions: [
      {
        id: "warrior_slash_inferno_arc",
        name: "폭열 횡베기",
        description: "베기가 폭발하며 2명의 적을 가릅니다.",
        resultCardId: "warrior-slash-inferno-arc",
        cost: {
          gold: 160,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 60 },
            { id: "black_iron_heart", name: "흑철 심장", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(34, player, enemy)),
        bleed: (enemy.bleed || 0) + 10,
      },
    }),
  },
  "warrior-slash-inferno-arc": {
    id: "warrior-slash-inferno-arc",
    rarity: "epic",
    starLevel: 4,
    cardClass: "warrior",
    name: "폭열 횡베기",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "적 2명에게 피해 48, 출혈 12, 약한 적에게 2배",
    description: "적 2명에게 각각 48의 피해와 출혈 12를 부여합니다. HP 35% 이하 적에게는 피해가 2배가 됩니다.",
    damage: 48,
    block: 0,
    effect: "출혈 12 / 처형",
    fullImage: imagePaths.warrior.attack,
    animationType: "fire",
    maxTargets: 2,
    upgradeOptions: [
      {
        id: "warrior_slash_golden_cleave",
        name: "황금 참격",
        description: "최고 성급의 참격. 2명을 크게 베고 처치 시 카드를 뽑습니다.",
        resultCardId: "warrior-slash-golden-cleave",
        cost: {
          gold: 260,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 90 },
            { id: "dragon_scale", name: "용의 비늘", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemies = [], targetIndex = 0 }) => {
      const targets = enemies
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => isEnemyTargetable(entry));
      const orderedTargets = [
        ...targets.filter(({ index }) => index === targetIndex),
        ...targets.filter(({ index }) => index !== targetIndex),
      ].slice(0, 2);
      const nextEnemies = enemies.map((entry) => ({ ...entry }));
      orderedTargets.forEach(({ index }) => {
        const target = nextEnemies[index];
        nextEnemies[index] = {
          ...target,
          hp: Math.max(0, target.hp - calcDamage((target.hp / Math.max(1, target.maxHp)) <= 0.35 ? 96 : 48, player, target)),
          bleed: (target.bleed || 0) + 12,
        };
      });
      return { enemies: nextEnemies };
    },
  },
  "warrior-slash-golden-cleave": {
    id: "warrior-slash-golden-cleave",
    rarity: "legendary",
    starLevel: 5,
    cardClass: "warrior",
    name: "황금 참격",
    type: "attack",
    typeLabel: "공격",
    cost: 2,
    desc: "적 2명에게 피해 84, 출혈 24, 처치 시 드로우 2/에너지 +1",
    description: "적 2명에게 각각 84의 피해와 출혈 24를 부여합니다. 처치 시 카드 2장, 에너지 +1, 턴 게이지 +40을 얻고 이번 턴 공격 카드 피해가 +12 누적됩니다.",
    damage: 84,
    block: 0,
    effect: "출혈 24 / 처치 시 드로우·에너지·게이지 / 공격 피해 누적",
    fullImage: imagePaths.warrior.attack,
    animationType: "lightning",
    maxTargets: 2,
    play: ({ player, enemies = [], targetIndex = 0, drawCards }) => {
      const targets = enemies
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => isEnemyTargetable(entry));
      const orderedTargets = [
        ...targets.filter(({ index }) => index === targetIndex),
        ...targets.filter(({ index }) => index !== targetIndex),
      ].slice(0, 2);
      const nextEnemies = enemies.map((entry) => ({ ...entry }));
      let defeatedAny = false;
      orderedTargets.forEach(({ index }) => {
        const target = nextEnemies[index];
        const nextHp = Math.max(0, target.hp - calcDamage(84, player, target));
        defeatedAny = defeatedAny || (target.hp > 0 && nextHp <= 0);
        nextEnemies[index] = {
          ...target,
          hp: nextHp,
          bleed: (target.bleed || 0) + 24,
        };
      });
      return {
        player: {
          ...player,
          energy: Math.min(player.maxEnergy || 3, (player.energy || 0) + (defeatedAny ? 1 : 0)),
          attackCardBonus: (player.attackCardBonus || 0) + 12,
        },
        enemies: nextEnemies,
        draw: defeatedAny ? drawCards?.(2) : null,
        speedGaugeBonus: defeatedAny ? 40 : 0,
      };
    },
  },
  "warrior-defense": {
    id: "warrior-defense",
    rarity: "common",
    cardClass: "warrior",
    name: "방어",
    type: "defense",
    typeLabel: "방어",
    cost: 1,
    desc: "방어도 8",
    description: "방어도 8을 얻습니다.",
    damage: 0,
    block: 8,
    fullImage: imagePaths.warrior.defense,
    animationType: "shield",
    upgradeOptions: [
      {
        id: "defense_guard_plus",
        name: "강화 방어",
        description: "기본 방어 수치가 크게 증가합니다.",
        resultCardId: "guard-plus",
        cost: {
          gold: 45,
          materials: [{ id: "card_shard", name: "카드 조각", amount: 18 }],
        },
      },
      {
        id: "defense_guard_thorn",
        name: "가시 방패",
        description: "방어하면서 공격받을 때마다 고정 피해를 반사합니다.",
        resultCardId: "thorn-shield",
        cost: {
          gold: 90,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 35 },
            { id: "rift_fragment", name: "균열 파편", amount: 1 },
          ],
        },
      },
      {
        id: "defense_guard_recovery",
        name: "수호 태세",
        description: "방어도와 함께 체력을 회복합니다.",
        resultCardId: "guardian-stance",
        cost: {
          gold: 80,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 30 },
            { id: "red_fang", name: "붉은 송곳니", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player }) => ({ player: { ...player, block: player.block + 8 } }),
  },
  "guard-plus": {
    id: "guard-plus",
    rarity: "rare",
    starLevel: 2,
    cardClass: "common",
    name: "강화 방어",
    type: "defense",
    typeLabel: "방어",
    cost: 1,
    desc: "방어도 14",
    description: "방어도 14를 얻습니다.",
    damage: 0,
    block: 14,
    fullImage: imagePaths.warrior.defense,
    animationType: "shield",
    upgradeOptions: [
      {
        id: "defense_guardian_stance",
        name: "수호 태세",
        description: "방어도와 회복을 함께 얻습니다.",
        resultCardId: "guardian-stance",
        cost: {
          gold: 90,
          materials: [{ id: "card_shard", name: "카드 조각", amount: 38 }],
        },
      },
    ],
    play: ({ player }) => ({ player: { ...player, block: player.block + 14 } }),
  },
  "guardian-stance": {
    id: "guardian-stance",
    rarity: "epic",
    starLevel: 3,
    cardClass: "common",
    name: "수호 태세",
    type: "defense",
    typeLabel: "방어",
    cost: 1,
    desc: "방어도 22, 체력 8 회복",
    description: "방어도 22를 얻고 체력 8을 회복합니다.",
    damage: 0,
    block: 22,
    effect: "체력 8 회복",
    fullImage: imagePaths.warrior.defense,
    animationType: "shield",
    upgradeOptions: [
      {
        id: "defense_iron_fortress",
        name: "반격 요새",
        description: "고효율 방어와 피해 감소, 반사를 동시에 얻습니다.",
        resultCardId: "counter-fortress",
        cost: {
          gold: 150,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 62 },
            { id: "black_iron_heart", name: "흑철 심장", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player }) => ({ player: { ...applyFlatHeal(player, 8), block: player.block + 22 } }),
  },
  "thorn-shield": {
    id: "thorn-shield",
    rarity: "rare",
    starLevel: 2,
    cardClass: "common",
    name: "가시 방패",
    type: "defense",
    typeLabel: "방어",
    cost: 1,
    desc: "방어도 13, 고정 반사 6",
    description: "방어도 13을 얻습니다. 이번 턴 공격받을 때마다 6 피해를 반사합니다.",
    damage: 0,
    block: 13,
    effect: "고정 반사 6",
    fullImage: imagePaths.warrior.defense,
    animationType: "shield",
    upgradeOptions: [
      {
        id: "defense_iron_fortress",
        name: "반격 요새",
        description: "반사와 피해 감소를 핵심 전술로 강화합니다.",
        resultCardId: "counter-fortress",
        cost: {
          gold: 150,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 62 },
            { id: "black_iron_heart", name: "흑철 심장", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player }) => ({
      player: {
        ...player,
        block: player.block + 13,
        reflectFlat: (player.reflectFlat || 0) + 6,
      },
    }),
  },
  "counter-fortress": {
    id: "counter-fortress",
    rarity: "epic",
    starLevel: 4,
    cardClass: "common",
    name: "반격 요새",
    type: "defense",
    typeLabel: "방어",
    cost: 2,
    desc: "방어도 32, 피해 30% 감소, 반사 25%",
    description: "방어도 32를 얻습니다. 이번 턴 받는 피해가 30% 감소하고 받은 피해의 25%를 반사합니다.",
    damage: 0,
    block: 32,
    effect: "피해 감소 30% / 반사 25%",
    fullImage: imagePaths.warrior.defense,
    animationType: "shield",
    upgradeOptions: [
      {
        id: "defense_absolute_bulwark",
        name: "절대 방벽",
        description: "피해를 무력화하고 반격으로 전투를 뒤집습니다.",
        resultCardId: "absolute-bulwark",
        cost: {
          gold: 260,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 95 },
            { id: "dragon_scale", name: "용의 비늘", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player }) => ({
      player: {
        ...player,
        block: player.block + 32,
        turnDamageReduction: Math.min(0.75, (player.turnDamageReduction || 0) + 0.3),
        reflectPercent: (player.reflectPercent || 0) + 0.25,
      },
    }),
  },
  "absolute-bulwark": {
    id: "absolute-bulwark",
    rarity: "legendary",
    starLevel: 5,
    cardClass: "common",
    name: "절대 방벽",
    type: "defense",
    typeLabel: "방어",
    cost: 3,
    desc: "방어도 60, 피해 65% 감소, 반사 50%, 사망 방지",
    description: "방어도 60을 얻습니다. 이번 턴 받는 피해가 65% 감소하고 받은 피해의 50%와 고정 12 피해를 반사합니다. 한 번 사망을 방지하고 다음 공격 피해 +12.",
    damage: 0,
    block: 60,
    effect: "피해 감소 65% / 반사 50%+12 / 사망 방지 / 공격 피해 +12",
    fullImage: imagePaths.warrior.defense,
    animationType: "shield",
    play: ({ player }) => ({
      player: {
        ...player,
        block: player.block + 60,
        turnDamageReduction: Math.min(0.85, (player.turnDamageReduction || 0) + 0.65),
        reflectPercent: (player.reflectPercent || 0) + 0.5,
        reflectFlat: (player.reflectFlat || 0) + 12,
        deathPrevent: (player.deathPrevent || 0) + 1,
        attackCardBonus: (player.attackCardBonus || 0) + 12,
      },
    }),
  },
  "mage-magic-missile": {
    id: "mage-magic-missile",
    rarity: "common",
    cardClass: "mage",
    name: "매직 미사일",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "피해 7, 취약 1",
    description: "적 하나에게 7의 피해를 줍니다. 취약 1을 부여합니다.",
    damage: 7,
    block: 0,
    fullImage: imagePaths.mage.attack,
    animationType: "magic",
    upgradeOptions: [
      {
        id: "mage_missile_arcane_bolt",
        name: "비전 탄환",
        description: "피해가 크게 증가하고 취약을 더 부여합니다.",
        resultCardId: "arcane-bolt",
        cost: {
          gold: 50,
          materials: [{ id: "card_shard", name: "카드 조각", amount: 20 }],
        },
      },
      {
        id: "mage_missile_frost_lance",
        name: "빙결 미사일",
        description: "피해와 함께 턴 게이지를 당기는 냉기 마법으로 바뀝니다.",
        resultCardId: "frost-missile",
        cost: {
          gold: 80,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 30 },
            { id: "rift_fragment", name: "균열 파편", amount: 1 },
          ],
        },
      },
      {
        id: "mage_missile_barrage",
        name: "비전 난사",
        description: "다중 타격과 드로우가 붙은 전략 카드로 발전합니다.",
        resultCardId: "arcane-barrage",
        cost: {
          gold: 95,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 34 },
            { id: "red_fang", name: "붉은 송곳니", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(7, player, enemy)),
        vulnerable: enemy.vulnerable + 1,
      },
    }),
  },
  "mage-shield": {
    id: "mage-shield",
    rarity: "common",
    cardClass: "mage",
    name: "마법 보호막",
    type: "defense",
    typeLabel: "방어",
    cost: 1,
    desc: "방어도 6",
    description: "방어도 6을 얻습니다.",
    damage: 0,
    block: 6,
    fullImage: imagePaths.mage.defense,
    animationType: "shield",
    upgradeOptions: [
      {
        id: "mage_shield_guard_plus",
        name: "강화 방어",
        description: "기본 방어 수치가 크게 증가합니다.",
        resultCardId: "guard-plus",
        cost: {
          gold: 45,
          materials: [{ id: "card_shard", name: "카드 조각", amount: 18 }],
        },
      },
      {
        id: "mage_shield_guardian",
        name: "수호 태세",
        description: "방어도와 함께 체력을 회복합니다.",
        resultCardId: "guardian-stance",
        cost: {
          gold: 80,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 30 },
            { id: "red_fang", name: "붉은 송곳니", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player }) => ({ player: { ...player, block: player.block + 6 } }),
  },
  "arcane-bolt": {
    id: "arcane-bolt",
    rarity: "rare",
    starLevel: 2,
    cardClass: "mage",
    name: "비전 탄환",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "피해 20, 취약 2",
    description: "적 하나에게 20의 피해를 주고 취약 2를 부여합니다.",
    damage: 20,
    block: 0,
    fullImage: imagePaths.mage.attack,
    animationType: "magic",
    upgradeOptions: [
      {
        id: "mage_arcane_barrage",
        name: "비전 난사",
        description: "다중 타격과 드로우를 얻습니다.",
        resultCardId: "arcane-barrage",
        cost: {
          gold: 105,
          materials: [{ id: "card_shard", name: "카드 조각", amount: 42 }],
        },
      },
    ],
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(20, player, enemy)),
        vulnerable: enemy.vulnerable + 2,
      },
    }),
  },
  "frost-missile": {
    id: "frost-missile",
    rarity: "rare",
    starLevel: 2,
    cardClass: "mage",
    name: "빙결 미사일",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "피해 18, 취약 1, 턴 게이지 +15",
    description: "적 하나에게 18의 피해와 취약 1을 부여하고 턴 게이지를 15 얻습니다.",
    damage: 18,
    block: 0,
    effect: "턴 게이지 +15",
    fullImage: imagePaths.mage.attack,
    animationType: "ice",
    upgradeOptions: [
      {
        id: "mage_glacial_prison",
        name: "빙하 감옥",
        description: "큰 피해와 함께 다음 행동을 더 빠르게 만듭니다.",
        resultCardId: "glacial-prison",
        cost: {
          gold: 125,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 48 },
            { id: "black_iron_heart", name: "흑철 심장", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(18, player, enemy)),
        vulnerable: enemy.vulnerable + 1,
      },
      player,
      speedGaugeBonus: 15,
    }),
  },
  "arcane-barrage": {
    id: "arcane-barrage",
    rarity: "epic",
    starLevel: 3,
    cardClass: "mage",
    name: "비전 난사",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "피해 16을 3회, 카드 1장",
    description: "적 하나에게 16의 피해를 3회 주고 카드 1장을 뽑습니다.",
    damage: 48,
    block: 0,
    effect: "카드 1장",
    fullImage: imagePaths.mage.attack,
    animationType: "magic",
    upgradeOptions: [
      {
        id: "mage_rift_nova",
        name: "균열 폭발",
        description: "단일 마법이 광역 핵심 카드로 변합니다.",
        resultCardId: "rift-nova",
        cost: {
          gold: 170,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 65 },
            { id: "black_iron_heart", name: "흑철 심장", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy, drawCards }) => ({
      enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(16, player, enemy) * 3) },
      player,
      draw: drawCards(1),
    }),
  },
  "glacial-prison": {
    id: "glacial-prison",
    rarity: "epic",
    starLevel: 3,
    cardClass: "mage",
    name: "빙하 감옥",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "피해 34, 취약 3, 턴 게이지 +25",
    description: "적 하나에게 34의 피해와 취약 3을 부여하고 턴 게이지를 25 얻습니다.",
    damage: 34,
    block: 0,
    effect: "취약 3 / 턴 게이지 +25",
    fullImage: imagePaths.mage.attack,
    animationType: "ice",
    upgradeOptions: [
      {
        id: "mage_absolute_zero",
        name: "절대 영도",
        description: "적 전체를 얼리고 전투 흐름을 장악합니다.",
        resultCardId: "absolute-zero",
        cost: {
          gold: 175,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 68 },
            { id: "black_iron_heart", name: "흑철 심장", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(34, player, enemy)),
        vulnerable: enemy.vulnerable + 3,
      },
      player,
      speedGaugeBonus: 25,
    }),
  },
  "rift-nova": {
    id: "rift-nova",
    rarity: "epic",
    starLevel: 4,
    cardClass: "mage",
    name: "균열 폭발",
    type: "attack",
    typeLabel: "공격",
    cost: 2,
    desc: "적 전체 피해 58, 취약 3, 카드 1장",
    description: "모든 적에게 58의 피해와 취약 3을 부여하고 카드 1장을 뽑습니다.",
    damage: 58,
    block: 0,
    effect: "전체 공격 / 취약 3 / 카드 1장",
    fullImage: imagePaths.mage.attack,
    animationType: "magic",
    upgradeOptions: [
      {
        id: "mage_astral_judgment",
        name: "성좌 심판",
        description: "광역 폭발, 드로우, 에너지, 턴 게이지가 결합된 5성 마법입니다.",
        resultCardId: "astral-judgment",
        cost: {
          gold: 290,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 105 },
            { id: "dragon_scale", name: "용의 비늘", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemies = [], drawCards }) => ({
      enemies: enemies.map((entry) =>
        isEnemyTargetable(entry)
          ? { ...entry, hp: Math.max(0, entry.hp - calcDamage(58, player, entry)), vulnerable: entry.vulnerable + 3 }
          : entry,
      ),
      player,
      draw: drawCards(1),
    }),
  },
  "absolute-zero": {
    id: "absolute-zero",
    rarity: "epic",
    starLevel: 4,
    cardClass: "mage",
    name: "절대 영도",
    type: "attack",
    typeLabel: "공격",
    cost: 2,
    desc: "적 전체 피해 50, 취약 5, 턴 게이지 +35",
    description: "모든 적에게 50의 피해와 취약 5를 부여하고 턴 게이지를 35 얻습니다.",
    damage: 50,
    block: 0,
    effect: "전체 공격 / 취약 5 / 턴 게이지 +35",
    fullImage: imagePaths.mage.attack,
    animationType: "ice",
    upgradeOptions: [
      {
        id: "mage_time_fracture",
        name: "시간 동결",
        description: "피해와 턴 게이지를 폭발적으로 얻는 5성 냉기 마법입니다.",
        resultCardId: "time-fracture",
        cost: {
          gold: 290,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 105 },
            { id: "dragon_scale", name: "용의 비늘", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemies = [] }) => ({
      enemies: enemies.map((entry) =>
        isEnemyTargetable(entry)
          ? { ...entry, hp: Math.max(0, entry.hp - calcDamage(50, player, entry)), vulnerable: entry.vulnerable + 5 }
          : entry,
      ),
      player,
      speedGaugeBonus: 35,
    }),
  },
  "astral-judgment": {
    id: "astral-judgment",
    rarity: "legendary",
    starLevel: 5,
    cardClass: "mage",
    name: "성좌 심판",
    type: "attack",
    typeLabel: "공격",
    cost: 3,
    desc: "적 전체 피해 120, 취약 8, 처치 시 드로우/에너지",
    description: "모든 적에게 120의 피해와 취약 8을 부여합니다. 처치 시 카드 3장, 에너지 +2, 턴 게이지 +60, 이번 턴 공격 피해 +18.",
    damage: 120,
    block: 0,
    effect: "전체 공격 / 처치 snowball / 공격 피해 +18",
    fullImage: imagePaths.mage.attack,
    animationType: "lightning",
    play: ({ player, enemies = [], drawCards }) => {
      let defeatedAny = false;
      const nextEnemies = enemies.map((entry) => {
        if (!isEnemyTargetable(entry)) return entry;
        const nextHp = Math.max(0, entry.hp - calcDamage(120, player, entry));
        defeatedAny = defeatedAny || (entry.hp > 0 && nextHp <= 0);
        return { ...entry, hp: nextHp, vulnerable: entry.vulnerable + 8 };
      });
      return {
        enemies: nextEnemies,
        player: {
          ...player,
          energy: Math.min(player.maxEnergy || 3, (player.energy || 0) + (defeatedAny ? 2 : 0)),
          attackCardBonus: (player.attackCardBonus || 0) + 18,
        },
        draw: defeatedAny ? drawCards?.(3) : null,
        speedGaugeBonus: defeatedAny ? 60 : 30,
      };
    },
  },
  "time-fracture": {
    id: "time-fracture",
    rarity: "legendary",
    starLevel: 5,
    cardClass: "mage",
    name: "시간 동결",
    type: "attack",
    typeLabel: "공격",
    cost: 2,
    desc: "적 전체 피해 96, 취약 10, 턴 게이지 +80",
    description: "모든 적에게 96의 피해와 취약 10을 부여합니다. 턴 게이지 +80, 카드 2장, 이번 턴 공격 피해 +14.",
    damage: 96,
    block: 0,
    effect: "전체 공격 / 턴 게이지 +80 / 카드 2장",
    fullImage: imagePaths.mage.attack,
    animationType: "ice",
    play: ({ player, enemies = [], drawCards }) => ({
      enemies: enemies.map((entry) =>
        isEnemyTargetable(entry)
          ? { ...entry, hp: Math.max(0, entry.hp - calcDamage(96, player, entry)), vulnerable: entry.vulnerable + 10 }
          : entry,
      ),
      player: { ...player, attackCardBonus: (player.attackCardBonus || 0) + 14 },
      draw: drawCards(2),
      speedGaugeBonus: 80,
    }),
  },
  "archer-attack": {
    id: "archer-attack",
    rarity: "common",
    cardClass: "archer",
    name: "기본 사격",
    type: "attack",
    typeLabel: "공격",
    cost: 1,
    desc: "피해 4",
    description: "적 하나에게 4의 피해를 줍니다.",
    damage: 4,
    block: 0,
    fullImage: imagePaths.archer.attack,
    animationType: "arrow",
    play: ({ player, enemy }) => ({ enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(4, player, enemy)) } }),
  },
  "archer-defense": {
    id: "archer-defense",
    rarity: "common",
    cardClass: "archer",
    name: "회피",
    type: "defense",
    typeLabel: "방어",
    cost: 1,
    desc: "방어도 6",
    description: "방어도 6을 얻습니다.",
    damage: 0,
    block: 6,
    fullImage: imagePaths.archer.defense,
    animationType: "shield",
    upgradeOptions: [
      {
        id: "archer_defense_guard_plus",
        name: "강화 방어",
        description: "기본 방어 수치가 크게 증가합니다.",
        resultCardId: "guard-plus",
        cost: {
          gold: 45,
          materials: [{ id: "card_shard", name: "카드 조각", amount: 18 }],
        },
      },
      {
        id: "archer_defense_thorn",
        name: "가시 방패",
        description: "방어하면서 공격받을 때마다 고정 피해를 반사합니다.",
        resultCardId: "thorn-shield",
        cost: {
          gold: 90,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 35 },
            { id: "rift_fragment", name: "균열 파편", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player }) => ({ player: { ...player, block: player.block + 6 } }),
  },
  strike: {
    id: "strike",
    rarity: "common",
    cardClass: "common",
    name: "베기",
    type: "attack",
    cost: 1,
    desc: "피해 7",
    play: ({ player, enemy }) => ({ enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(7, player, enemy)) } }),
  },
  defend: {
    id: "defend",
    rarity: "common",
    cardClass: "common",
    name: "방어",
    type: "skill",
    cost: 1,
    desc: "방어도 6",
    play: ({ player }) => ({ player: { ...player, block: player.block + 6 } }),
  },
  bash: {
    id: "bash",
    rarity: "common",
    cardClass: "warrior",
    name: "강타",
    type: "attack",
    cost: 2,
    desc: "피해 9, 취약 2",
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(9, player, enemy)),
        vulnerable: enemy.vulnerable + 2,
      },
    }),
  },
  quickCut: {
    id: "quickCut",
    rarity: "common",
    cardClass: "archer",
    name: "속공",
    type: "attack",
    cost: 0,
    desc: "피해 4",
    play: ({ player, enemy }) => ({ enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(4, player, enemy)) } }),
  },
  heavyBlow: {
    id: "heavyBlow",
    rarity: "rare",
    cardClass: "warrior",
    name: "무거운 일격",
    type: "attack",
    cost: 2,
    desc: "피해 15",
    play: ({ player, enemy }) => ({ enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(15, player, enemy)) } }),
  },
  guardUp: {
    id: "guardUp",
    rarity: "common",
    cardClass: "warrior",
    name: "수비 태세",
    type: "skill",
    cost: 2,
    desc: "방어도 14",
    play: ({ player }) => ({ player: { ...player, block: player.block + 14 } }),
  },
  focus: {
    id: "focus",
    rarity: "rare",
    cardClass: "mage",
    name: "집중",
    type: "skill",
    cost: 0,
    desc: "카드 2장 뽑기",
    upgradeOptions: [
      {
        id: "mage_deep_focus",
        name: "심화 집중",
        description: "드로우와 에너지 순환을 함께 얻습니다.",
        resultCardId: "deep-focus",
        cost: {
          gold: 90,
          materials: [{ id: "card_shard", name: "카드 조각", amount: 35 }],
        },
      },
    ],
    play: ({ player, drawCards }) => ({ player, draw: drawCards(2) }),
  },
  overclock: {
    id: "overclock",
    rarity: "legendary",
    cardClass: "mage",
    name: "Overclock",
    type: "power",
    cost: 1,
    desc: "힘 +2, 체력 2 감소",
    upgradeOptions: [
      {
        id: "mage_singularity_overclock",
        name: "특이점 가속",
        description: "체력 리스크 대신 압도적인 마력과 턴 흐름을 얻습니다.",
        resultCardId: "singularity-overclock",
        cost: {
          gold: 300,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 110 },
            { id: "dragon_scale", name: "용의 비늘", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player }) => ({ player: { ...player, strength: player.strength + 2, hp: Math.max(1, player.hp - 2) } }),
  },
  healPulse: {
    id: "healPulse",
    rarity: "common",
    cardClass: "common",
    name: "치유 파동",
    type: "skill",
    cost: 1,
    desc: "체력 5 회복",
    play: ({ player }) => ({ player: applyFlatHeal(player, 5) }),
  },
  doubleTap: {
    id: "doubleTap",
    rarity: "rare",
    cardClass: "archer",
    name: "연속 베기",
    type: "attack",
    cost: 1,
    desc: "피해 4를 2회",
    play: ({ player, enemy }) => {
      const dmg = calcDamage(4, player, enemy) * 2;
      return { enemy: { ...enemy, hp: Math.max(0, enemy.hp - dmg) } };
    },
  },
  meteorStrike: {
    id: "meteorStrike",
    rarity: "epic",
    cardClass: "mage",
    name: "유성 강타",
    type: "attack",
    cost: 2,
    desc: "피해 24",
    upgradeOptions: [
      {
        id: "mage_meteor_cataclysm",
        name: "대재앙 유성",
        description: "단일 유성이 적 전체를 불태우는 핵심 카드로 변합니다.",
        resultCardId: "cataclysm-meteor",
        cost: {
          gold: 190,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 72 },
            { id: "black_iron_heart", name: "흑철 심장", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy }) => ({ enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(24, player, enemy)) } }),
  },
  guardianField: {
    id: "guardianField",
    rarity: "epic",
    cardClass: "warrior",
    name: "수호 장막",
    type: "skill",
    cost: 1,
    desc: "방어도 18 획득",
    play: ({ player }) => ({ player: { ...player, block: player.block + 18 } }),
  },
  kingsbane: {
    id: "kingsbane",
    rarity: "legendary",
    cardClass: "warrior",
    name: "왕살자",
    type: "attack",
    cost: 2,
    desc: "피해 34, 취약 2",
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(34, player, enemy)),
        vulnerable: enemy.vulnerable + 2,
      },
    }),
  },
  aegisCore: {
    id: "aegisCore",
    rarity: "legendary",
    cardClass: "warrior",
    name: "이지스 코어",
    type: "skill",
    cost: 2,
    desc: "방어도 30 획득, 힘 +1",
    play: ({ player }) => ({ player: { ...player, block: player.block + 30, strength: player.strength + 1 } }),
  },
  shieldBash: {
    id: "shieldBash",
    rarity: "rare",
    cardClass: "warrior",
    name: "방패 강타",
    type: "attack",
    cost: 2,
    desc: "피해 8 + 현재 방어도 70%",
    play: ({ player, enemy }) => {
      const bonus = Math.floor((player.block || 0) * 0.7);
      return { enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(8 + bonus, player, enemy)) } };
    },
  },
  ironWill: {
    id: "ironWill",
    rarity: "epic",
    cardClass: "warrior",
    name: "강철 의지",
    type: "skill",
    cost: 1,
    desc: "방어도 12, 취약 1 감소",
    play: ({ player }) => ({ player: { ...player, block: player.block + 12, vulnerable: Math.max(0, player.vulnerable - 1) } }),
  },
  earthSplitter: {
    id: "earthSplitter",
    rarity: "legendary",
    cardClass: "warrior",
    name: "대지 분쇄",
    type: "attack",
    cost: 3,
    desc: "피해 28 + 방어도 절반",
    play: ({ player, enemy }) => {
      const bonus = Math.floor((player.block || 0) * 0.5);
      return { enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(28 + bonus, player, enemy)) } };
    },
  },
  fireball: {
    id: "fireball",
    rarity: "rare",
    cardClass: "mage",
    name: "파이어볼",
    type: "attack",
    cost: 2,
    desc: "피해 16",
    upgradeOptions: [
      {
        id: "mage_greater_fireball",
        name: "대화염구",
        description: "화염 피해와 출혈을 크게 강화합니다.",
        resultCardId: "greater-fireball",
        cost: {
          gold: 100,
          materials: [{ id: "card_shard", name: "카드 조각", amount: 40 }],
        },
      },
    ],
    play: ({ player, enemy }) => ({ enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(16, player, enemy)) } }),
  },
  frostLance: {
    id: "frostLance",
    rarity: "common",
    cardClass: "mage",
    name: "얼음창",
    type: "attack",
    cost: 1,
    desc: "피해 7, 취약 1",
    upgradeOptions: [
      {
        id: "mage_frost_missile",
        name: "빙결 미사일",
        description: "피해와 턴 게이지를 함께 얻는 냉기 마법으로 발전합니다.",
        resultCardId: "frost-missile",
        cost: {
          gold: 80,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 30 },
            { id: "rift_fragment", name: "균열 파편", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(7, player, enemy)),
        vulnerable: enemy.vulnerable + 1,
      },
    }),
  },
  chainLightning: {
    id: "chainLightning",
    rarity: "epic",
    cardClass: "mage",
    name: "연쇄 번개",
    type: "attack",
    cost: 2,
    desc: "피해 9, 카드 1장 뽑기",
    upgradeOptions: [
      {
        id: "mage_storm_conduit",
        name: "폭풍 도관",
        description: "번개가 적 전체로 확장되고 에너지를 되돌려줍니다.",
        resultCardId: "storm-conduit",
        cost: {
          gold: 180,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 70 },
            { id: "black_iron_heart", name: "흑철 심장", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy, drawCards }) => ({
      enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(9, player, enemy)) },
      player,
      draw: drawCards(1),
    }),
  },
  manaBurst: {
    id: "manaBurst",
    rarity: "legendary",
    cardClass: "mage",
    name: "마나 폭발",
    type: "power",
    cost: 1,
    desc: "힘 +1, 카드 2장 뽑기, 체력 1 감소",
    upgradeOptions: [
      {
        id: "mage_mana_singularity",
        name: "마나 특이점",
        description: "마력, 드로우, 에너지, 턴 게이지를 동시에 폭발시킵니다.",
        resultCardId: "mana-singularity",
        cost: {
          gold: 300,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 110 },
            { id: "dragon_scale", name: "용의 비늘", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, drawCards }) => ({
      player: { ...player, strength: player.strength + 1, hp: Math.max(1, player.hp - 1) },
      draw: drawCards(2),
    }),
  },
  "deep-focus": {
    id: "deep-focus",
    rarity: "rare",
    starLevel: 2,
    cardClass: "mage",
    name: "심화 집중",
    type: "skill",
    typeLabel: "기술",
    cost: 0,
    desc: "카드 3장, 에너지 +1",
    description: "카드 3장을 뽑고 에너지 1을 얻습니다.",
    effect: "카드 3장 / 에너지 +1",
    animationType: "magic",
    upgradeOptions: [
      {
        id: "mage_mana_flow",
        name: "마나 흐름",
        description: "드로우, 에너지, 공격 피해 누적을 동시에 얻습니다.",
        resultCardId: "mana-flow",
        cost: {
          gold: 120,
          materials: [{ id: "card_shard", name: "카드 조각", amount: 48 }],
        },
      },
    ],
    play: ({ player, drawCards }) => ({
      player: { ...player, energy: Math.min(player.maxEnergy || 3, (player.energy || 0) + 1) },
      draw: drawCards(3),
    }),
  },
  "mana-flow": {
    id: "mana-flow",
    rarity: "epic",
    starLevel: 3,
    cardClass: "mage",
    name: "마나 흐름",
    type: "skill",
    typeLabel: "기술",
    cost: 0,
    desc: "카드 4장, 에너지 +1, 공격 피해 +8",
    description: "카드 4장을 뽑고 에너지 1과 이번 턴 공격 피해 +8을 얻습니다.",
    effect: "카드 4장 / 에너지 +1 / 공격 피해 +8",
    animationType: "magic",
    upgradeOptions: [
      {
        id: "mage_arcane_overdrive",
        name: "비전 과부하",
        description: "마법사의 턴을 크게 늘리는 4성 핵심 카드입니다.",
        resultCardId: "arcane-overdrive",
        cost: {
          gold: 175,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 70 },
            { id: "black_iron_heart", name: "흑철 심장", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, drawCards }) => ({
      player: {
        ...player,
        energy: Math.min(player.maxEnergy || 3, (player.energy || 0) + 1),
        attackCardBonus: (player.attackCardBonus || 0) + 8,
      },
      draw: drawCards(4),
    }),
  },
  "arcane-overdrive": {
    id: "arcane-overdrive",
    rarity: "epic",
    starLevel: 4,
    cardClass: "mage",
    name: "비전 과부하",
    type: "skill",
    typeLabel: "기술",
    cost: 1,
    desc: "카드 5장, 에너지 +2, 턴 게이지 +35, 공격 피해 +14",
    description: "카드 5장을 뽑고 에너지 2, 턴 게이지 35, 이번 턴 공격 피해 +14를 얻습니다.",
    effect: "카드 5장 / 에너지 +2 / 게이지 +35",
    animationType: "magic",
    upgradeOptions: [
      {
        id: "mage_infinite_circuit",
        name: "무한 회로",
        description: "드로우와 에너지로 턴을 폭발시키는 5성 순환 카드입니다.",
        resultCardId: "infinite-circuit",
        cost: {
          gold: 285,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 105 },
            { id: "dragon_scale", name: "용의 비늘", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, drawCards }) => ({
      player: {
        ...player,
        energy: Math.min(player.maxEnergy || 3, (player.energy || 0) + 2),
        attackCardBonus: (player.attackCardBonus || 0) + 14,
      },
      draw: drawCards(5),
      speedGaugeBonus: 35,
    }),
  },
  "infinite-circuit": {
    id: "infinite-circuit",
    rarity: "legendary",
    starLevel: 5,
    cardClass: "mage",
    name: "무한 회로",
    type: "skill",
    typeLabel: "기술",
    cost: 1,
    desc: "카드 7장, 에너지 +3, 턴 게이지 +80, 공격 피해 +28",
    description: "카드 7장을 뽑고 에너지 3, 턴 게이지 80, 이번 턴 공격 피해 +28을 얻습니다.",
    effect: "카드 7장 / 에너지 +3 / 게이지 +80 / 공격 피해 +28",
    animationType: "lightning",
    play: ({ player, drawCards }) => ({
      player: {
        ...player,
        energy: Math.min(player.maxEnergy || 3, (player.energy || 0) + 3),
        attackCardBonus: (player.attackCardBonus || 0) + 28,
      },
      draw: drawCards(7),
      speedGaugeBonus: 80,
    }),
  },
  "greater-fireball": {
    id: "greater-fireball",
    rarity: "rare",
    starLevel: 2,
    cardClass: "mage",
    name: "대화염구",
    type: "attack",
    typeLabel: "공격",
    cost: 2,
    desc: "피해 42, 출혈 8",
    description: "적 하나에게 42의 피해와 출혈 8을 부여합니다.",
    damage: 42,
    effect: "출혈 8",
    animationType: "fire",
    upgradeOptions: [
      {
        id: "mage_hellfire_orb",
        name: "지옥 화구",
        description: "화염 피해가 폭발적으로 증가하고 처형 피해가 붙습니다.",
        resultCardId: "hellfire-orb",
        cost: {
          gold: 135,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 52 },
            { id: "red_fang", name: "붉은 송곳니", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy }) => ({
      enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(42, player, enemy)), bleed: (enemy.bleed || 0) + 8 },
    }),
  },
  "hellfire-orb": {
    id: "hellfire-orb",
    rarity: "epic",
    starLevel: 3,
    cardClass: "mage",
    name: "지옥 화구",
    type: "attack",
    typeLabel: "공격",
    cost: 2,
    desc: "피해 72, 출혈 14, 약한 적 2배",
    description: "적 하나에게 72의 피해와 출혈 14를 부여합니다. HP 35% 이하 적에게는 피해가 2배가 됩니다.",
    damage: 72,
    effect: "출혈 14 / 처형",
    animationType: "fire",
    upgradeOptions: [
      {
        id: "mage_cataclysm_meteor",
        name: "대재앙 유성",
        description: "화염이 적 전체를 집어삼키는 4성 핵심 카드가 됩니다.",
        resultCardId: "cataclysm-meteor",
        cost: {
          gold: 190,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 72 },
            { id: "black_iron_heart", name: "흑철 심장", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemy }) => {
      const base = (enemy.hp / Math.max(1, enemy.maxHp)) <= 0.35 ? 144 : 72;
      return { enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(base, player, enemy)), bleed: (enemy.bleed || 0) + 14 } };
    },
  },
  "cataclysm-meteor": {
    id: "cataclysm-meteor",
    rarity: "epic",
    starLevel: 4,
    cardClass: "mage",
    name: "대재앙 유성",
    type: "attack",
    typeLabel: "공격",
    cost: 3,
    desc: "적 전체 피해 100, 출혈 20",
    description: "모든 적에게 100의 피해와 출혈 20을 부여합니다.",
    damage: 100,
    effect: "전체 공격 / 출혈 20",
    animationType: "fire",
    upgradeOptions: [
      {
        id: "mage_solar_apocalypse",
        name: "태양 종말",
        description: "5성 화염 마법. 처치 시 전투 흐름을 불태웁니다.",
        resultCardId: "solar-apocalypse",
        cost: {
          gold: 320,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 120 },
            { id: "dragon_scale", name: "용의 비늘", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemies = [] }) => ({
      enemies: enemies.map((entry) =>
        isEnemyTargetable(entry)
          ? { ...entry, hp: Math.max(0, entry.hp - calcDamage(100, player, entry)), bleed: (entry.bleed || 0) + 20 }
          : entry,
      ),
      player,
    }),
  },
  "solar-apocalypse": {
    id: "solar-apocalypse",
    rarity: "legendary",
    starLevel: 5,
    cardClass: "mage",
    name: "태양 종말",
    type: "attack",
    typeLabel: "공격",
    cost: 4,
    desc: "적 전체 피해 180, 출혈 36, 처치 시 에너지/드로우",
    description: "모든 적에게 180의 피해와 출혈 36을 부여합니다. 처치 시 카드 3장, 에너지 +2, 턴 게이지 +60, 공격 피해 +24.",
    damage: 180,
    effect: "전체 공격 / 출혈 36 / 처치 snowball",
    animationType: "fire",
    play: ({ player, enemies = [], drawCards }) => {
      let defeatedAny = false;
      const nextEnemies = enemies.map((entry) => {
        if (!isEnemyTargetable(entry)) return entry;
        const nextHp = Math.max(0, entry.hp - calcDamage(180, player, entry));
        defeatedAny = defeatedAny || (entry.hp > 0 && nextHp <= 0);
        return { ...entry, hp: nextHp, bleed: (entry.bleed || 0) + 36 };
      });
      return {
        enemies: nextEnemies,
        player: {
          ...player,
          energy: Math.min(player.maxEnergy || 3, (player.energy || 0) + (defeatedAny ? 2 : 0)),
          attackCardBonus: (player.attackCardBonus || 0) + 24,
        },
        draw: defeatedAny ? drawCards?.(3) : null,
        speedGaugeBonus: defeatedAny ? 60 : 20,
      };
    },
  },
  "storm-conduit": {
    id: "storm-conduit",
    rarity: "epic",
    starLevel: 4,
    cardClass: "mage",
    name: "폭풍 도관",
    type: "attack",
    typeLabel: "공격",
    cost: 2,
    desc: "적 전체 피해 70, 카드 2장, 에너지 +1",
    description: "모든 적에게 70의 피해를 주고 카드 2장과 에너지 1을 얻습니다.",
    damage: 70,
    effect: "전체 공격 / 카드 2장 / 에너지 +1",
    animationType: "lightning",
    upgradeOptions: [
      {
        id: "mage_thunder_god",
        name: "뇌신 강림",
        description: "번개로 턴을 다시 열어젖히는 5성 마법입니다.",
        resultCardId: "thunder-god",
        cost: {
          gold: 310,
          materials: [
            { id: "card_shard", name: "카드 조각", amount: 115 },
            { id: "dragon_scale", name: "용의 비늘", amount: 1 },
          ],
        },
      },
    ],
    play: ({ player, enemies = [], drawCards }) => ({
      enemies: enemies.map((entry) => (isEnemyTargetable(entry) ? { ...entry, hp: Math.max(0, entry.hp - calcDamage(70, player, entry)) } : entry)),
      player: { ...player, energy: Math.min(player.maxEnergy || 3, (player.energy || 0) + 1) },
      draw: drawCards(2),
    }),
  },
  "thunder-god": {
    id: "thunder-god",
    rarity: "legendary",
    starLevel: 5,
    cardClass: "mage",
    name: "뇌신 강림",
    type: "attack",
    typeLabel: "공격",
    cost: 3,
    desc: "적 전체 피해 135, 카드 3장, 에너지 +2, 게이지 +70",
    description: "모든 적에게 135의 피해를 줍니다. 카드 3장, 에너지 2, 턴 게이지 70, 공격 피해 +20을 얻습니다.",
    damage: 135,
    effect: "전체 공격 / 드로우·에너지·게이지",
    animationType: "lightning",
    play: ({ player, enemies = [], drawCards }) => ({
      enemies: enemies.map((entry) => (isEnemyTargetable(entry) ? { ...entry, hp: Math.max(0, entry.hp - calcDamage(135, player, entry)) } : entry)),
      player: {
        ...player,
        energy: Math.min(player.maxEnergy || 3, (player.energy || 0) + 2),
        attackCardBonus: (player.attackCardBonus || 0) + 20,
      },
      draw: drawCards(3),
      speedGaugeBonus: 70,
    }),
  },
  "mana-singularity": {
    id: "mana-singularity",
    rarity: "legendary",
    starLevel: 5,
    cardClass: "mage",
    name: "마나 특이점",
    type: "power",
    typeLabel: "능력",
    cost: 2,
    desc: "힘 +5, 카드 5장, 에너지 +3, 게이지 +80",
    description: "힘 +5, 카드 5장, 에너지 +3, 턴 게이지 +80, 이번 턴 공격 피해 +30을 얻습니다.",
    effect: "힘 +5 / 카드 5장 / 에너지 +3 / 게이지 +80",
    animationType: "lightning",
    play: ({ player, drawCards }) => ({
      player: {
        ...player,
        strength: player.strength + 5,
        energy: Math.min(player.maxEnergy || 3, (player.energy || 0) + 3),
        attackCardBonus: (player.attackCardBonus || 0) + 30,
      },
      draw: drawCards(5),
      speedGaugeBonus: 80,
    }),
  },
  "singularity-overclock": {
    id: "singularity-overclock",
    rarity: "legendary",
    starLevel: 5,
    cardClass: "mage",
    name: "특이점 가속",
    type: "power",
    typeLabel: "능력",
    cost: 2,
    desc: "힘 +6, 카드 4장, 에너지 +2, 게이지 +80",
    description: "힘 +6, 카드 4장, 에너지 +2, 턴 게이지 +80을 얻고 체력 4를 소모합니다.",
    effect: "힘 +6 / 카드 4장 / 에너지 +2 / 게이지 +80",
    animationType: "lightning",
    play: ({ player, drawCards }) => ({
      player: {
        ...player,
        strength: player.strength + 6,
        hp: Math.max(1, player.hp - 4),
        energy: Math.min(player.maxEnergy || 3, (player.energy || 0) + 2),
      },
      draw: drawCards(4),
      speedGaugeBonus: 80,
    }),
  },
  rapidVolley: {
    id: "rapidVolley",
    rarity: "common",
    cardClass: "archer",
    name: "연속 사격",
    type: "attack",
    cost: 0,
    desc: "피해 3, 카드 1장 뽑기",
    play: ({ player, enemy, drawCards }) => ({
      enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(3, player, enemy)) },
      player,
      draw: drawCards(1),
    }),
  },
  multiShot: {
    id: "multiShot",
    rarity: "rare",
    cardClass: "archer",
    name: "멀티샷",
    type: "attack",
    cost: 1,
    desc: "피해 5를 2회",
    play: ({ player, enemy }) => {
      const dmg = calcDamage(5, player, enemy) * 2;
      return { enemy: { ...enemy, hp: Math.max(0, enemy.hp - dmg) } };
    },
  },
  evasiveShot: {
    id: "evasiveShot",
    rarity: "rare",
    cardClass: "archer",
    name: "회피 사격",
    type: "skill",
    cost: 1,
    desc: "방어도 6, 피해 6",
    play: ({ player, enemy }) => ({
      player: { ...player, block: player.block + 6 },
      enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(6, player, enemy)) },
    }),
  },
  piercingShot: {
    id: "piercingShot",
    rarity: "epic",
    cardClass: "archer",
    name: "피어싱 샷",
    type: "attack",
    cost: 2,
    desc: "피해 12, 적 방어도 절반 관통",
    play: ({ player, enemy }) => {
      const reducedBlock = Math.max(0, enemy.block - Math.floor(enemy.block / 2));
      const nextEnemy = { ...enemy, block: reducedBlock };
      return { enemy: { ...nextEnemy, hp: Math.max(0, nextEnemy.hp - calcDamage(12, player, nextEnemy)) } };
    },
  },
  stormArrow: {
    id: "stormArrow",
    rarity: "legendary",
    cardClass: "archer",
    name: "폭풍의 화살",
    type: "attack",
    cost: 2,
    desc: "피해 20, 속도가 더 높으면 추가 피해 8",
    play: ({ player, enemy }) => {
      const bonus = (player.speed || 0) > (enemy.speed || 0) ? 8 : 0;
      return { enemy: { ...enemy, hp: Math.max(0, enemy.hp - calcDamage(20 + bonus, player, enemy)) } };
    },
  },
};

const TYPE_LABELS = {
  attack: "공격",
  skill: "기술",
  defense: "방어",
  power: "능력",
};

const CARD_IMAGE_BY_ID = {
  "warrior-slash-power": "sword",
  "warrior-slash-wide": "daggers",
  "warrior-slash-bleed": "blade",
  "warrior-slash-crimson": "blade",
  "warrior-slash-inferno-arc": "fire",
  "warrior-slash-golden-cleave": "crownBlade",
  "guard-plus": "shield",
  "guardian-stance": "barrier",
  "thorn-shield": "shieldHammer",
  "counter-fortress": "fortress",
  "absolute-bulwark": "aegis",
  "arcane-bolt": "arcane",
  "frost-missile": "ice",
  "arcane-barrage": "arcane",
  "glacial-prison": "ice",
  "rift-nova": "arcane",
  "absolute-zero": "ice",
  "astral-judgment": "crownBlade",
  "time-fracture": "storm",
  "deep-focus": "focus",
  "mana-flow": "arcane",
  "arcane-overdrive": "lightning",
  "infinite-circuit": "aegis",
  "greater-fireball": "fire",
  "hellfire-orb": "meteor",
  "cataclysm-meteor": "meteor",
  "solar-apocalypse": "crownBlade",
  "storm-conduit": "lightning",
  "thunder-god": "storm",
  "mana-singularity": "arcane",
  "singularity-overclock": "arcane",
  strike: "sword",
  defend: "shield",
  bash: "hammer",
  quickCut: "dagger",
  heavyBlow: "hammer",
  guardUp: "shield",
  focus: "focus",
  overclock: "arcane",
  healPulse: "heal",
  doubleTap: "daggers",
  meteorStrike: "meteor",
  guardianField: "barrier",
  kingsbane: "crownBlade",
  aegisCore: "aegis",
  shieldBash: "shieldHammer",
  ironWill: "fortress",
  earthSplitter: "quake",
  fireball: "fire",
  frostLance: "ice",
  chainLightning: "lightning",
  manaBurst: "arcane",
  rapidVolley: "arrows",
  multiShot: "fanShot",
  evasiveShot: "wind",
  piercingShot: "pierce",
  stormArrow: "storm",
};

const CARD_ANIMATION_BY_ID = {
  "warrior-slash-power": "impact",
  "warrior-slash-wide": "slash",
  "warrior-slash-bleed": "slash",
  "warrior-slash-crimson": "slash",
  "warrior-slash-inferno-arc": "fire",
  "warrior-slash-golden-cleave": "lightning",
  "guard-plus": "shield",
  "guardian-stance": "shield",
  "thorn-shield": "impact",
  "counter-fortress": "impact",
  "absolute-bulwark": "shield",
  "arcane-bolt": "magic",
  "frost-missile": "ice",
  "arcane-barrage": "magic",
  "glacial-prison": "ice",
  "rift-nova": "magic",
  "absolute-zero": "ice",
  "astral-judgment": "lightning",
  "time-fracture": "ice",
  "deep-focus": "magic",
  "mana-flow": "magic",
  "arcane-overdrive": "lightning",
  "infinite-circuit": "lightning",
  "greater-fireball": "fire",
  "hellfire-orb": "fire",
  "cataclysm-meteor": "fire",
  "solar-apocalypse": "fire",
  "storm-conduit": "lightning",
  "thunder-god": "lightning",
  "mana-singularity": "lightning",
  "singularity-overclock": "lightning",
  strike: "slash",
  bash: "impact",
  quickCut: "slash",
  heavyBlow: "impact",
  doubleTap: "slash",
  meteorStrike: "fire",
  kingsbane: "slash",
  shieldBash: "impact",
  earthSplitter: "impact",
  fireball: "fire",
  frostLance: "ice",
  chainLightning: "lightning",
  rapidVolley: "arrow",
  multiShot: "arrow",
  evasiveShot: "arrow",
  piercingShot: "arrow",
  stormArrow: "lightning",
};

const DEFAULT_IMAGE_BY_TYPE = {
  attack: "sword",
  skill: "shield",
  power: "arcane",
};

function readCardNumber(text, label) {
  const match = String(text || "").match(new RegExp(`${label}\\s*(\\d+)`));
  return match ? Number(match[1]) : 0;
}

const CARD_POOL = Object.fromEntries(
  Object.entries(RAW_CARD_POOL).map(([id, card]) => [
    id,
    {
      ...card,
      id: card.id || id,
      typeLabel: card.typeLabel || TYPE_LABELS[card.type] || card.type,
      imageType: card.imageType || CARD_IMAGE_BY_ID[id] || DEFAULT_IMAGE_BY_TYPE[card.type] || "arcane",
      animationType: card.animationType || CARD_ANIMATION_BY_ID[id] || (card.type === "attack" ? "impact" : "support"),
      description: card.description || card.desc || "",
      damage: card.damage ?? readCardNumber(card.desc, "피해"),
      block: card.block ?? readCardNumber(card.desc, "방어도"),
      effect: card.effect ?? null,
      starLevel: clampNumber(Number(card.starLevel || 1), 1, 5),
    },
  ]),
);

const REWARD_RARITY_WEIGHTS = [
  { rarity: "common", weight: 60 },
  { rarity: "rare", weight: 25 },
  { rarity: "epic", weight: 10 },
  { rarity: "legendary", weight: 5 },
];

const RARITY_META = {
  common: { label: "일반", className: "bg-slate-200 text-slate-700" },
  rare: { label: "희귀", className: "bg-sky-200 text-sky-800" },
  epic: { label: "에픽", className: "bg-violet-200 text-violet-800" },
  legendary: { label: "전설", className: "bg-amber-200 text-amber-900" },
};

const RARITY_HOVER_FX = {
  common: {
    edge: "#999999",
    glow: "rgba(153, 153, 153, 0.62)",
    wave: "rgba(210, 210, 210, 0.55)",
    spark: "rgba(240, 240, 240, 0.96)",
    sheen: "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.32) 48%, rgba(255,255,255,0) 100%)",
  },
  rare: {
    edge: "#3aa0ff",
    glow: "rgba(58, 160, 255, 0.66)",
    wave: "rgba(97, 191, 255, 0.58)",
    spark: "rgba(180, 228, 255, 0.96)",
    sheen: "linear-gradient(120deg, rgba(58,160,255,0) 0%, rgba(148,214,255,0.4) 50%, rgba(58,160,255,0) 100%)",
  },
  epic: {
    edge: "#a64dff",
    glow: "rgba(166, 77, 255, 0.7)",
    wave: "rgba(198, 132, 255, 0.6)",
    spark: "rgba(232, 208, 255, 0.98)",
    sheen: "linear-gradient(120deg, rgba(166,77,255,0) 0%, rgba(218,176,255,0.45) 50%, rgba(166,77,255,0) 100%)",
  },
  legendary: {
    edge: "#ff9c2a",
    glow: "rgba(255, 156, 42, 0.78)",
    wave: "rgba(255, 194, 104, 0.65)",
    spark: "rgba(255, 238, 196, 0.98)",
    sheen: "linear-gradient(120deg, rgba(255,156,42,0) 0%, rgba(255,224,166,0.5) 50%, rgba(255,156,42,0) 100%)",
  },
};

const FLIP_REVEAL_META = {
  common: { duration: 0.55, peakAt: 0.45, burstAt: 0.7, burstScale: 1.25, burstCount: 4, flash: 0.25, linger: 0.35 },
  rare: { duration: 0.85, peakAt: 0.52, burstAt: 0.78, burstScale: 1.45, burstCount: 8, flash: 0.4, linger: 0.5 },
  epic: { duration: 1.2, peakAt: 0.58, burstAt: 0.82, burstScale: 1.7, burstCount: 12, flash: 0.55, linger: 0.65 },
  legendary: { duration: 1.5, peakAt: 0.6, burstAt: 0.84, burstScale: 2, burstCount: 18, flash: 0.72, linger: 0.9 },
};

const RARITY_FRAME = {
  common: {
    border: "rgba(203,213,225,0.95)",
    inner: "rgba(248,250,252,0.86)",
    glow: "rgba(226,232,240,0.34)",
    surface: "linear-gradient(160deg, #f8fafc 0%, #e2e8f0 52%, #ffffff 100%)",
    art: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(148,163,184,0.36))",
  },
  rare: {
    border: "rgba(56,189,248,0.95)",
    inner: "rgba(186,230,253,0.82)",
    glow: "rgba(56,189,248,0.42)",
    surface: "linear-gradient(160deg, #eff6ff 0%, #bfdbfe 54%, #f8fbff 100%)",
    art: "linear-gradient(135deg, rgba(239,246,255,0.96), rgba(59,130,246,0.38))",
  },
  epic: {
    border: "rgba(168,85,247,0.95)",
    inner: "rgba(221,214,254,0.86)",
    glow: "rgba(168,85,247,0.46)",
    surface: "linear-gradient(160deg, #faf5ff 0%, #ddd6fe 54%, #fdf4ff 100%)",
    art: "linear-gradient(135deg, rgba(250,245,255,0.96), rgba(147,51,234,0.38))",
  },
  legendary: {
    border: "rgba(245,158,11,0.98)",
    inner: "rgba(253,230,138,0.9)",
    glow: "rgba(245,158,11,0.54)",
    surface: "linear-gradient(160deg, #fffbeb 0%, #fde68a 52%, #fff7ed 100%)",
    art: "linear-gradient(135deg, rgba(255,251,235,0.98), rgba(217,119,6,0.38))",
  },
};

const TYPE_THEME = {
  attack: { bg: "bg-red-50", sigilBg: "rgba(239,68,68,0.14)", sigilStroke: "#b91c1c", accent: "#ef4444", label: "공격" },
  skill: { bg: "bg-blue-50", sigilBg: "rgba(59,130,246,0.14)", sigilStroke: "#1d4ed8", accent: "#2563eb", label: "기술" },
  defense: { bg: "bg-blue-50", sigilBg: "rgba(59,130,246,0.14)", sigilStroke: "#1d4ed8", accent: "#2563eb", label: "방어" },
  power: { bg: "bg-violet-50", sigilBg: "rgba(139,92,246,0.16)", sigilStroke: "#6d28d9", accent: "#7c3aed", label: "능력" },
};

const CARD_STAR_EFFECTS = {
  1: { label: "1성", primary: "#94a3b8", secondary: "#e2e8f0", glow: "rgba(148, 163, 184, 0.2)", particleCount: 0 },
  2: { label: "2성", primary: "#3BA7FF", secondary: "#5CCBFF", glow: "rgba(59, 167, 255, 0.56)", particleCount: 5 },
  3: { label: "3성", primary: "#9B5CFF", secondary: "#D26BFF", glow: "rgba(155, 92, 255, 0.68)", particleCount: 7 },
  4: { label: "4성", primary: "#FF3B3B", secondary: "#FF7A1A", glow: "rgba(255, 59, 59, 0.78)", particleCount: 10 },
  5: { label: "5성", primary: "#FFD700", secondary: "#FFF2A0", glow: "rgba(255, 215, 0, 0.9)", particleCount: 14 },
};

const CHARACTER_CLASSES = {
  warrior: {
    id: "warrior",
    name: "전사",
    icon: "⚔️",
    color: "from-red-500/30 to-orange-500/20",
    image: imagePaths.warrior.character,
    cardBack: imagePaths.warrior.cardBack,
    hp: 120,
    energy: 3,
    maxEnergy: 3,
    attack: 12,
    defense: 8,
    speed: 6,
    passive: "피해를 받을 때 분노 스택 +1, 3스택마다 힘 +1",
    style: "맞으면서 버티고 강한 한 방으로 반격",
    starter: Array(5).fill("warrior-slash").concat(Array(5).fill("warrior-defense")),
  },
  mage: {
    id: "mage",
    name: "마법사",
    icon: "🔮",
    color: "from-violet-500/30 to-fuchsia-500/20",
    image: imagePaths.mage.character,
    cardBack: imagePaths.mage.cardBack,
    hp: 70,
    energy: 4,
    maxEnergy: 4,
    attack: 18,
    defense: 3,
    speed: 10,
    passive: "공격 카드를 연속 사용하면 연계 피해 증가",
    style: "폭딜 중심, 빠른 처치가 핵심인 유리몸",
    starter: Array(5).fill("mage-magic-missile").concat(Array(5).fill("mage-shield")),
  },
  archer: {
    id: "archer",
    name: "궁수",
    icon: "🏹",
    color: "from-emerald-500/30 to-cyan-500/20",
    image: imagePaths.archer.character,
    cardBack: imagePaths.archer.cardBack,
    hp: 90,
    energy: 3,
    maxEnergy: 3,
    attack: 100,
    defense: 5,
    speed: 15,
    passive: "피격 시 25% 확률 회피, 성공하면 반격 피해 4",
    style: "기동성과 지속 딜 중심의 안정적인 운영",
    starter: Array(5).fill("archer-attack").concat(Array(5).fill("archer-defense")),
  },
};

const TRAIT_DEFINITIONS = [
  { id: "attack_power_up", category: "attack", name: "공격력 증가", icon: Sword, maxLevel: 5, perLevelText: "공격 피해 +3% / 레벨" },
  { id: "attack_crit_rate_up", category: "attack", name: "치명타 확률 증가", icon: Sparkles, maxLevel: 5, perLevelText: "치명타 확률 +2% / 레벨" },
  { id: "attack_crit_damage_up", category: "attack", name: "치명타 피해 증가", icon: Crown, maxLevel: 5, perLevelText: "치명타 피해 +5% / 레벨" },
  { id: "attack_boss_damage_up", category: "attack", name: "보스 피해 증가", icon: Skull, maxLevel: 5, perLevelText: "보스 피해 +4% / 레벨" },
  { id: "defense_hp_up", category: "defense", name: "최대 체력 증가", icon: Heart, maxLevel: 5, perLevelText: "최대 체력 +5% / 레벨" },
  { id: "defense_armor_up", category: "defense", name: "방어력 증가", icon: Shield, maxLevel: 5, perLevelText: "방어력 +3% / 레벨" },
  { id: "defense_damage_reduce", category: "defense", name: "피해 감소", icon: Shield, maxLevel: 5, perLevelText: "받는 피해 -2% / 레벨" },
  { id: "defense_heal_up", category: "defense", name: "회복량 증가", icon: Heart, maxLevel: 5, perLevelText: "회복 효과 +4% / 레벨" },
  { id: "resource_max_energy_up", category: "resource", name: "최대 에너지 증가", icon: Zap, maxLevel: 3, perLevelText: "Lv1 최대 +1 / Lv2 최대 +1 시작 +1 / Lv3 최대 +2 시작 +1" },
  { id: "resource_gold_up", category: "resource", name: "골드 획득량 증가", icon: Coins, maxLevel: 5, perLevelText: "골드 획득량 +5% / 레벨" },
  { id: "resource_card_reward_up", category: "resource", name: "카드 보상 확률 증가", icon: Trophy, maxLevel: 5, perLevelText: "추가 카드 보상 확률 +3% / 레벨" },
  { id: "resource_rare_card_up", category: "resource", name: "희귀 카드 확률 증가", icon: Sparkles, maxLevel: 5, perLevelText: "희귀 이상 카드 등장 확률 +2% / 레벨" },
  { id: "resource_shop_discount", category: "resource", name: "상점 할인", icon: Coins, maxLevel: 5, perLevelText: "상점 가격 -3% / 레벨" },
];

const TRAIT_CATEGORIES = [
  { id: "attack", title: "공격", subtitle: "피해와 치명타 강화", className: "attack" },
  { id: "defense", title: "수비", subtitle: "체력, 방어, 회복 안정성", className: "defense" },
  { id: "resource", title: "자원", subtitle: "에너지, 골드, 보상 효율", className: "resource" },
];

const TRAIT_BY_ID = Object.fromEntries(TRAIT_DEFINITIONS.map((trait) => [trait.id, trait]));
const DEFAULT_TRAITS = Object.fromEntries(TRAIT_DEFINITIONS.map((trait) => [trait.id, 0]));
const SAVE_VERSION = 1;
const PERMANENT_SAVE_KEY = "permanentSaveData";
const RUN_SAVE_KEY = "runSaveData";
const RUN_CLEARED_KEY = "runSaveDataCleared";
const LEGACY_SAVE_KEY = "deck-spire-prototype-save-v2";

const INITIAL_PLAYER = {
  hp: 0,
  maxHp: 0,
  baseMaxHp: 0,
  gold: 0,
  resources: {},
  block: 0,
  energy: 3,
  maxEnergy: 3,
  attackCardBonus: 0,
  turnDamageReduction: 0,
  reflectFlat: 0,
  reflectPercent: 0,
  deathPrevent: 0,
  baseMaxEnergy: 3,
  startEnergy: 3,
  strength: 0,
  vulnerable: 0,
  classId: null,
  attack: 10,
  baseAttack: 10,
  defense: 0,
  baseDefense: 0,
  speed: 0,
  attackMultiplier: 1,
  critRate: 0,
  critDamageMultiplier: 1.5,
  bossDamageMultiplier: 1,
  damageReduction: 0,
  healMultiplier: 1,
  goldMultiplier: 1,
  cardRewardChance: 0,
  rareCardChance: 0,
  shopPriceMultiplier: 1,
};

function createDefaultPermanentData() {
  return {
    saveVersion: SAVE_VERSION,
    traitPoint: 0,
    clearedBossFloors: [],
    traits: { ...DEFAULT_TRAITS },
    unlockedCharacters: Object.keys(CHARACTER_CLASSES),
    totalGoldEarned: 0,
  };
}

function createDefaultPlayerData() {
  return createDefaultPermanentData();
}

function normalizePermanentData(data) {
  const fallback = createDefaultPermanentData();
  const traits = { ...fallback.traits };
  Object.keys(traits).forEach((id) => {
    const maxLevel = TRAIT_BY_ID[id]?.maxLevel || 0;
    traits[id] = clampNumber(Number(data?.traits?.[id] || 0), 0, maxLevel);
  });

  return {
    saveVersion: SAVE_VERSION,
    traitPoint: Math.max(0, Number(data?.traitPoint || 0)),
    clearedBossFloors: Array.isArray(data?.clearedBossFloors)
      ? Array.from(new Set(data.clearedBossFloors.map((floor) => Number(floor)).filter((floor) => Number.isFinite(floor))))
      : [],
    traits,
    unlockedCharacters: Array.isArray(data?.unlockedCharacters) && data.unlockedCharacters.length > 0 ? data.unlockedCharacters : fallback.unlockedCharacters,
    totalGoldEarned: Math.max(0, Number(data?.totalGoldEarned || 0)),
  };
}

function normalizePlayerData(data) {
  return normalizePermanentData(data);
}

function getTraitLevel(playerData, traitId) {
  return clampNumber(Number(playerData?.traits?.[traitId] || 0), 0, TRAIT_BY_ID[traitId]?.maxLevel || 0);
}

function getTraitEffects(playerData) {
  const data = normalizePlayerData(playerData);
  const energyLevel = getTraitLevel(data, "resource_max_energy_up");
  const energyBonus = energyLevel >= 3 ? { max: 2, start: 1 } : energyLevel >= 2 ? { max: 1, start: 1 } : energyLevel >= 1 ? { max: 1, start: 0 } : { max: 0, start: 0 };

  return {
    attackMultiplier: 1 + getTraitLevel(data, "attack_power_up") * 0.03,
    critRate: getTraitLevel(data, "attack_crit_rate_up") * 0.02,
    critDamageMultiplier: 1.5 + getTraitLevel(data, "attack_crit_damage_up") * 0.05,
    bossDamageMultiplier: 1 + getTraitLevel(data, "attack_boss_damage_up") * 0.04,
    hpMultiplier: 1 + getTraitLevel(data, "defense_hp_up") * 0.05,
    armorMultiplier: 1 + getTraitLevel(data, "defense_armor_up") * 0.03,
    damageReduction: getTraitLevel(data, "defense_damage_reduce") * 0.02,
    healMultiplier: 1 + getTraitLevel(data, "defense_heal_up") * 0.04,
    goldMultiplier: 1 + getTraitLevel(data, "resource_gold_up") * 0.05,
    cardRewardChance: getTraitLevel(data, "resource_card_reward_up") * 0.03,
    rareCardChance: getTraitLevel(data, "resource_rare_card_up") * 0.02,
    shopPriceMultiplier: Math.max(0.1, 1 - getTraitLevel(data, "resource_shop_discount") * 0.03),
    maxEnergyBonus: energyBonus.max,
    startEnergyBonus: energyBonus.start,
  };
}

function applyTraitEffectsToPlayer(player, playerData, options = {}) {
  if (!player?.classId) return { ...INITIAL_PLAYER, ...player };

  const profile = CHARACTER_CLASSES[player.classId] || CHARACTER_CLASSES.warrior;
  const effects = getTraitEffects(playerData);
  const baseMaxHp = Number(player.baseMaxHp || profile.hp);
  const baseAttack = Number(player.baseAttack || profile.attack);
  const baseDefense = Number(player.baseDefense || profile.defense);
  const baseMaxEnergy = Number(player.baseMaxEnergy || profile.maxEnergy || profile.energy || 3);
  const previousMaxHp = Math.max(1, Number(player.maxHp || baseMaxHp));
  const maxHp = Math.max(1, Math.round(baseMaxHp * effects.hpMultiplier));
  const maxEnergy = Math.max(1, baseMaxEnergy + effects.maxEnergyBonus);
  const startEnergy = Math.min(maxEnergy, Math.max(1, baseMaxEnergy + effects.startEnergyBonus));
  const preservedHp = options.preserveHp === false ? maxHp : clampNumber(Number(player.hp || maxHp) + Math.max(0, maxHp - previousMaxHp), 1, maxHp);

  return {
    ...player,
    baseMaxHp,
    baseAttack,
    baseDefense,
    baseMaxEnergy,
    hp: preservedHp,
    maxHp,
    attack: baseAttack,
    defense: Math.max(0, Math.round(baseDefense * effects.armorMultiplier)),
    maxEnergy,
    startEnergy,
    energy: options.resetEnergy ? startEnergy : Math.min(maxEnergy, Number(player.energy || startEnergy)),
    attackMultiplier: effects.attackMultiplier,
    critRate: effects.critRate,
    critDamageMultiplier: effects.critDamageMultiplier,
    bossDamageMultiplier: effects.bossDamageMultiplier,
    damageReduction: effects.damageReduction,
    healMultiplier: effects.healMultiplier,
    goldMultiplier: effects.goldMultiplier,
    cardRewardChance: effects.cardRewardChance,
    rareCardChance: effects.rareCardChance,
    shopPriceMultiplier: effects.shopPriceMultiplier,
  };
}

function getTraitEffectText(traitId, level) {
  const clamped = clampNumber(level, 0, TRAIT_BY_ID[traitId]?.maxLevel || 0);
  if (traitId === "resource_max_energy_up") {
    if (clamped <= 0) return "효과 없음";
    if (clamped === 1) return "최대 에너지 +1";
    if (clamped === 2) return "최대 에너지 +1, 시작 에너지 +1";
    return "최대 에너지 +2, 시작 에너지 +1";
  }

  const effectTexts = {
    attack_power_up: `공격 피해 +${clamped * 3}%`,
    attack_crit_rate_up: `치명타 확률 +${clamped * 2}%`,
    attack_crit_damage_up: `치명타 피해 +${clamped * 5}%`,
    attack_boss_damage_up: `보스 피해 +${clamped * 4}%`,
    defense_hp_up: `최대 체력 +${clamped * 5}%`,
    defense_armor_up: `방어력 +${clamped * 3}%`,
    defense_damage_reduce: `받는 피해 -${clamped * 2}%`,
    defense_heal_up: `회복 효과 +${clamped * 4}%`,
    resource_gold_up: `골드 획득량 +${clamped * 5}%`,
    resource_card_reward_up: `추가 카드 보상 확률 +${clamped * 3}%`,
    resource_rare_card_up: `희귀 이상 카드 확률 +${clamped * 2}%`,
    resource_shop_discount: `상점 가격 -${clamped * 3}%`,
  };

  return clamped <= 0 ? "효과 없음" : effectTexts[traitId];
}

function loadJsonSave(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to load ${key}`, error);
    return null;
  }
}

function saveJsonData(key, data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save ${key}`, error);
  }
}

function loadPermanentData() {
  const current = loadJsonSave(PERMANENT_SAVE_KEY);
  if (current?.permanentData) return normalizePermanentData(current.permanentData);
  if (current) return normalizePermanentData(current);

  const legacy = loadJsonSave(LEGACY_SAVE_KEY);
  return normalizePermanentData(legacy?.permanentData || legacy?.playerData);
}

function savePermanentData(permanentData) {
  const normalized = normalizePermanentData(permanentData);
  saveJsonData(PERMANENT_SAVE_KEY, {
    saveVersion: SAVE_VERSION,
    permanentData: normalized,
  });
}

function shouldPersistRunData(runData) {
  if (!runData?.player?.classId) return false;
  return !["start", "character-select", "how-to-play", "defeat", "gameOver", "victory"].includes(runData.phase);
}

function loadRunData() {
  const current = loadJsonSave(RUN_SAVE_KEY);
  const runData = current?.runData || current;
  if (runData?.hasActiveRun && shouldPersistRunData(runData)) {
    return {
      ...runData,
      saveVersion: SAVE_VERSION,
      player: { ...INITIAL_PLAYER, ...(runData.player || {}) },
      hasActiveRun: true,
    };
  }

  if (typeof window !== "undefined" && window.localStorage.getItem(RUN_CLEARED_KEY) === "true") {
    return { saveVersion: SAVE_VERSION, hasActiveRun: false };
  }

  const legacy = loadJsonSave(LEGACY_SAVE_KEY);
  if (legacy?.player?.classId && shouldPersistRunData(legacy)) {
    return {
      ...legacy,
      saveVersion: SAVE_VERSION,
      player: { ...INITIAL_PLAYER, ...(legacy.player || {}) },
      hasActiveRun: true,
    };
  }

  return { saveVersion: SAVE_VERSION, hasActiveRun: false };
}

function saveRunData(runData) {
  const normalizedRunData = {
    ...runData,
    saveVersion: SAVE_VERSION,
    hasActiveRun: shouldPersistRunData(runData),
  };

  if (!normalizedRunData.hasActiveRun) {
    clearRunData();
    return;
  }

  saveJsonData(RUN_SAVE_KEY, {
    saveVersion: SAVE_VERSION,
    runData: normalizedRunData,
  });
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(RUN_CLEARED_KEY);
  }
}

function clearRunData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RUN_SAVE_KEY);
  window.localStorage.setItem(RUN_CLEARED_KEY, "true");
}

function CardTypeSigil({ type, stroke, className = "h-5 w-5" }) {
  if (type === "attack") {
    return (
      <svg viewBox="0 0 28 28" className={className} fill="none" aria-hidden="true">
        <path d="M5 22L12 6" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M12 22L19 8" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M18 22L24 12" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "skill" || type === "defense") {
    return (
      <svg viewBox="0 0 28 28" className={className} fill="none" aria-hidden="true">
        <path d="M14 4L22 8V14C22 18.8 18.8 22.8 14 24C9.2 22.8 6 18.8 6 14V8L14 4Z" stroke={stroke} strokeWidth="2.3" />
        <path d="M10 14H18" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 28 28" className={className} fill="none" aria-hidden="true">
      <path d="M14 4L17.2 9.2L23 10.1L19 14.2L20 20L14 17L8 20L9 14.2L5 10.1L10.8 9.2L14 4Z" stroke={stroke} strokeWidth="2.1" />
      <circle cx="14" cy="14" r="2.3" fill={stroke} />
    </svg>
  );
}

function CardFrameOrnament({ type, rarityFrame }) {
  const isAttack = type === "attack";
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className={`absolute left-1/2 top-[-8px] -translate-x-1/2 ${isAttack ? "h-5 w-16" : "h-4 w-14"} rounded-b-xl border-b-2`}
        style={{
          borderColor: rarityFrame.border,
          background: isAttack
            ? `linear-gradient(180deg, ${rarityFrame.inner}, rgba(255,255,255,0))`
            : `radial-gradient(circle at 50% -20%, ${rarityFrame.inner} 0%, rgba(255,255,255,0) 72%)`,
          clipPath: isAttack ? "polygon(8% 0, 92% 0, 100% 100%, 0 100%)" : "none",
        }}
      />
      <div
        className={`absolute bottom-[-8px] left-1/2 -translate-x-1/2 ${isAttack ? "h-5 w-14" : "h-4 w-12"} rounded-t-xl border-t-2`}
        style={{
          borderColor: rarityFrame.border,
          background: isAttack
            ? `linear-gradient(0deg, ${rarityFrame.inner}, rgba(255,255,255,0))`
            : `radial-gradient(circle at 50% 120%, ${rarityFrame.inner} 0%, rgba(255,255,255,0) 72%)`,
          clipPath: isAttack ? "polygon(12% 100%, 88% 100%, 100% 0, 0 0)" : "none",
        }}
      />
    </div>
  );
}

function CardEnergyCore({ type, rarityFx, active }) {
  const isAttack = type === "attack";
  const isSkill = type === "skill" || type === "defense";

  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute left-1/2 top-[43%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        animate={
          isAttack
            ? { opacity: active ? [0.18, 0.55, 0.3] : [0.12, 0.2, 0.12], scale: active ? [0.9, 1.35, 1.08] : [0.9, 1.02, 0.95] }
            : isSkill
              ? { opacity: active ? [0.24, 0.4, 0.24] : [0.14, 0.24, 0.14], scale: active ? [1.1, 0.96, 1.06] : [1.05, 0.98, 1.02] }
              : { opacity: active ? [0.2, 0.48, 0.24] : [0.14, 0.22, 0.16], scale: active ? [0.95, 1.22, 1.02] : [0.92, 1.02, 0.95] }
        }
        transition={{ duration: isAttack ? 0.9 : 1.4, ease: [0.22, 1, 0.36, 1], repeat: Number.POSITIVE_INFINITY }}
        style={{ background: `radial-gradient(circle, ${rarityFx.wave} 0%, rgba(255,255,255,0) 70%)` }}
      />
      <motion.div
        className="absolute left-1/2 top-[43%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={isAttack ? { opacity: [0.35, 0.78, 0.48] } : { opacity: [0.28, 0.56, 0.28] }}
        transition={{ duration: isAttack ? 0.8 : 1.5, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
        style={{
          boxShadow: `0 0 20px ${rarityFx.glow}, inset 0 0 14px ${rarityFx.wave}`,
          background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 70%)`,
        }}
      />
      <motion.div
        className="absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2 rounded-full p-2"
        animate={
          isAttack
            ? { scale: active ? [1, 1.2, 1.05] : [1, 1.06, 1], rotate: active ? [0, -6, 3, 0] : [0, -1, 0] }
            : isSkill
              ? { scale: [1, 1.03, 1], opacity: [0.82, 1, 0.82] }
              : { scale: active ? [1, 1.1, 1.02] : [1, 1.04, 1], rotate: [0, 3, 0] }
        }
        transition={{ duration: isAttack ? 0.8 : 1.5, ease: [0.22, 1, 0.36, 1], repeat: Number.POSITIVE_INFINITY }}
        style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
      >
        <CardTypeSigil type={type} stroke={isAttack ? "#991b1b" : isSkill ? "#1e40af" : "#6d28d9"} className="h-9 w-9" />
      </motion.div>
    </div>
  );
}

const ENEMIES = [
  {
    name: "녹슨 정찰병",
    maxHp: 32,
    speed: 8,
    image: "🪲",
    actions: [
      { type: "attack", value: 6, text: "공격 6" },
      { type: "block", value: 5, text: "방어 5" },
    ],
  },
  {
    name: "오염 슬라임",
    maxHp: 42,
    speed: 10,
    image: "🧪",
    actions: [
      { type: "attack", value: 8, text: "공격 8" },
      { type: "debuff", value: 1, text: "취약 1 부여" },
      { type: "attack", value: 5, text: "공격 5" },
    ],
  },
  {
    name: "맹독 마녀",
    maxHp: 52,
    speed: 12,
    image: "🧙",
    actions: [
      { type: "attack", value: 10, text: "공격 10" },
      { type: "buff", value: 2, text: "힘 +2" },
      { type: "block", value: 8, text: "방어 8" },
    ],
  },
  {
    name: "다크 보스",
    maxHp: 85,
    speed: 11,
    image: "🐉",
    boss: true,
    actions: [
      { type: "attack", value: 14, text: "강공격 14" },
      { type: "block", value: 12, text: "방어 12" },
      { type: "buff", value: 3, text: "힘 +3" },
      { type: "attack", value: 9, text: "공격 9" },
    ],
  },
];

const TOTAL_FLOORS = 100;
const TOWER_PREVIEW_FLOORS = 5;
const DEFAULT_MAX_DUNGEON_DEPTH = 10;
const TOWER_DICE_GAME_VERSION = 3;
const MAX_TOWER_FLOOR = 10;
const DEFAULT_PLAYER_DICE = { count: 2, sides: 6, min: 1 };
const DICE_UPGRADE_LIMITS = { count: 4, sides: 8, min: 3 };
const UPGRADE_MATERIAL_ID = "manaShard";
const DICE_UPGRADE_MATERIAL_ID = "diceCore";
const DIFFICULTY_LABELS = {
  roguelike: "로그라이크",
  hardcore: "하드코어",
};

const DEFAULT_PLAYER_EQUIPMENT = {
  weapon: {
    id: "basic_sword",
    name: "기본 검",
    slot: "weapon",
    description: "등반자가 처음부터 들고 있는 검입니다. 무기 강화로 기본 공격력이 오릅니다.",
  },
  armor: {
    id: "basic_armor",
    name: "기본 갑옷",
    slot: "armor",
    description: "등반자가 처음부터 입고 있는 갑옷입니다. 방어구 강화로 기본 방어력이 오릅니다.",
  },
  accessory: null,
};

const ACCESSORIES = [
  {
    id: "lucky_charm",
    name: "행운의 부적",
    slot: "accessory",
    description: "공격과 방어 주사위 합계가 +2 증가합니다.",
    diceTotalBonus: 2,
  },
  {
    id: "steady_ring",
    name: "안정의 반지",
    slot: "accessory",
    description: "주사위 최소값이 +1 증가합니다.",
    diceMinBonus: 1,
  },
  {
    id: "sharp_dice_stone",
    name: "날카로운 주사위석",
    slot: "accessory",
    description: "공격력 +1, 주사위 합계 +1",
    attackBonus: 1,
    diceTotalBonus: 1,
  },
];

const TOWER_FLOOR_ENEMIES = {
  1: { id: "slime", monsterId: "slime", name: "슬라임", floor: 1, maxHp: 40, baseAttack: 2, diceCount: 2, diceSides: 6, goldReward: 20, materialReward: 0 },
  2: { id: "mushroom", monsterId: "mushroom", name: "버섯", floor: 2, maxHp: 58, baseAttack: 3, diceCount: 2, diceSides: 6, goldReward: 28, materialReward: 0 },
  3: { id: "goblin", monsterId: "goblin", name: "고블린", floor: 3, maxHp: 82, baseAttack: 4, diceCount: 2, diceSides: 6, goldReward: 38, materialReward: 1 },
  4: { id: "orc", monsterId: "orc", name: "오크", floor: 4, maxHp: 115, baseAttack: 5, diceCount: 2, diceSides: 6, goldReward: 52, materialReward: 1 },
  5: { id: "mid_boss", monsterId: "gatekeeper", name: "탑 수문장", floor: 5, maxHp: 180, baseAttack: 6, diceCount: 2, diceSides: 6, goldReward: 100, materialReward: 2 },
  6: { id: "wolf", monsterId: "wolf", name: "늑대", floor: 6, maxHp: 155, baseAttack: 7, diceCount: 2, diceSides: 6, goldReward: 92, materialReward: 1 },
  7: { id: "dark_knight", monsterId: "dark_knight", name: "암흑기사", floor: 7, maxHp: 205, baseAttack: 7, diceCount: 2, diceSides: 7, goldReward: 115, materialReward: 2 },
  8: { id: "rift_mage", monsterId: "rift_mage", name: "균열 마도사", floor: 8, maxHp: 230, baseAttack: 8, diceCount: 2, diceSides: 7, goldReward: 135, materialReward: 2 },
  9: { id: "black_iron_watcher", monsterId: "black_iron_watcher", name: "흑철감시자", floor: 9, maxHp: 285, baseAttack: 8, diceCount: 2, diceSides: 8, goldReward: 160, materialReward: 2 },
  10: { id: "dragon_boss", monsterId: "dragon_boss", name: "드래곤 보스", floor: 10, maxHp: 350, baseAttack: 9, diceCount: 2, diceSides: 8, goldReward: 200, materialReward: 0 },
};

function createTowerEnemyForFloor(floor) {
  const template = TOWER_FLOOR_ENEMIES[floor] || TOWER_FLOOR_ENEMIES[MAX_TOWER_FLOOR];
  const overflow = Math.max(0, floor - MAX_TOWER_FLOOR);
  const scaled = {
    ...template,
    floor,
    maxHp: template.maxHp + overflow * 45,
    baseAttack: template.baseAttack + overflow,
    imagePath: MONSTER_IMAGE_PATHS[template.monsterId],
  };
  return { ...scaled, hp: scaled.maxHp };
}

function getAccessoryById(accessoryId) {
  return ACCESSORIES.find((item) => item.id === accessoryId) || null;
}

function getEquipmentBonuses(equipment = DEFAULT_PLAYER_EQUIPMENT) {
  const items = Object.values(equipment || {}).filter(Boolean);
  return items.reduce(
    (total, item) => ({
      attackBonus: total.attackBonus + (item.attackBonus || 0),
      defenseBonus: total.defenseBonus + (item.defenseBonus || 0),
      maxHpBonus: total.maxHpBonus + (item.maxHpBonus || 0),
      diceTotalBonus: total.diceTotalBonus + (item.diceTotalBonus || 0),
      diceMinBonus: total.diceMinBonus + (item.diceMinBonus || 0),
      diceMaxBonus: total.diceMaxBonus + (item.diceMaxBonus || 0),
    }),
    {
      attackBonus: 0,
      defenseBonus: 0,
      maxHpBonus: 0,
      diceTotalBonus: 0,
      diceMinBonus: 0,
      diceMaxBonus: 0,
    }
  );
}

function getBossReward(floor) {
  if (floor === 5) return { diceUpgradeMaterial: 1, accessoryId: "lucky_charm" };
  if (floor === 10) return { diceUpgradeMaterial: 2, accessoryId: "steady_ring" };
  return null;
}

function isBossFloor(floor) {
  return floor === 5 || floor === 10;
}

function getBossFloorLabel(floor) {
  if (floor === 5) return "중간보스";
  if (floor === 10) return "최종 보스";
  return "";
}

function getAccessoryEffectText(item) {
  if (!item) return "효과 없음";
  const parts = [];
  if (item.attackBonus) parts.push(`공격력 +${item.attackBonus}`);
  if (item.defenseBonus) parts.push(`방어력 +${item.defenseBonus}`);
  if (item.maxHpBonus) parts.push(`최대 HP +${item.maxHpBonus}`);
  if (item.diceTotalBonus) parts.push(`주사위 합계 +${item.diceTotalBonus}`);
  if (item.diceMinBonus) parts.push(`주사위 최소값 +${item.diceMinBonus}`);
  if (item.diceMaxBonus) parts.push(`주사위 최대 눈금 +${item.diceMaxBonus}`);
  return parts.join(" / ") || item.description || "효과 없음";
}

function calculateDiceShardReward(reachedFloor) {
  return Math.min(5, Math.max(1, Math.floor(Number(reachedFloor || 0) / 2) + 1));
}

function createDefaultDiceShardUpgrades(overrides = {}) {
  return { ...DEFAULT_DICE_SHARD_UPGRADES, ...(overrides || {}) };
}

function getDiceShardUpgradeBonuses(upgrades = DEFAULT_DICE_SHARD_UPGRADES) {
  const safeUpgrades = createDefaultDiceShardUpgrades(upgrades);
  return {
    attack: safeUpgrades.baseAttackLevel,
    defense: safeUpgrades.baseDefenseLevel,
    maxHp: safeUpgrades.maxHpLevel * 10,
  };
}

function createTowerBasePlayer({ difficultyMode, diceShardUpgrades } = {}) {
  const shardBonuses = difficultyMode === "roguelike" ? getDiceShardUpgradeBonuses(diceShardUpgrades) : { attack: 0, defense: 0, maxHp: 0 };
  const maxHp = 100 + shardBonuses.maxHp;
  const baseAttack = 3 + shardBonuses.attack;
  const baseDefense = 2 + shardBonuses.defense;
  return {
    ...INITIAL_PLAYER,
    hp: maxHp,
    maxHp,
    baseMaxHp: maxHp,
    gold: difficultyMode === "roguelike" ? 0 : 80,
    resources: { [UPGRADE_MATERIAL_ID]: difficultyMode === "roguelike" ? 0 : 1 },
    energy: 0,
    maxEnergy: 0,
    classId: "warrior",
    attack: baseAttack,
    baseAttack,
    defense: baseDefense,
    baseDefense,
    speed: 0,
  };
}

function calculateAttackDamage(baseAttack, diceTotal, isDouble) {
  return Math.floor(Number(baseAttack || 0) * Number(diceTotal || 0) * (isDouble ? DOUBLE_MULTIPLIER : 1));
}

function calculateDefenseValue(baseDefense, diceTotal, isDouble) {
  return Math.floor(Number(baseDefense || 0) * Number(diceTotal || 0) * (isDouble ? DOUBLE_MULTIPLIER : 1));
}

function rollPotionDrop() {
  return Math.random() < POTION_DROP_CHANCE;
}

function rollDice(count, sides, min = 1) {
  const safeCount = Math.max(1, Number(count || 1));
  const safeSides = Math.max(min, Number(sides || 6));
  const safeMin = Math.max(1, Number(min || 1));
  const dice = Array.from({ length: safeCount }, () => Math.floor(Math.random() * (safeSides - safeMin + 1)) + safeMin);
  return {
    dice,
    total: dice.reduce((sum, value) => sum + value, 0),
  };
}

function formatDice(dice) {
  if (!dice) return "2D6";
  return `${dice.count}D${dice.sides}`;
}

function createBattleLogId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `battle-log-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isDoubleRoll(roll) {
  const dice = Array.isArray(roll) ? roll : roll?.dice;
  return Array.isArray(dice) && dice.length >= 2 && dice.every((value) => value === dice[0]);
}

const ROOM_TYPE_LABELS = {
  normalBattle: "일반 전투방",
  eliteBattle: "중간보스방",
  bossBattle: "보스방",
  rest: "휴식방",
  shop: "상점방",
};

const ROOM_TYPE_TO_STAGE_TYPE = {
  normalBattle: "normal",
  eliteBattle: "elite",
  bossBattle: "boss",
  rest: "rest",
  shop: "shop",
};

function getRoomTypeByDepth(depth, maxDepth = DEFAULT_MAX_DUNGEON_DEPTH) {
  if (depth === maxDepth) return "bossBattle";
  if (depth === 4 || depth === 7) return "eliteBattle";
  if (depth === 3 || depth === 6) return "rest";
  if (depth === 5 || depth === 8) return "shop";
  return "normalBattle";
}

function getRoomTypeLabel(roomType) {
  return ROOM_TYPE_LABELS[roomType] || ROOM_TYPE_LABELS.normalBattle;
}

const ROOM_TYPE_META = {
  normal: { label: "일반 전투 방", shortLabel: "일반", icon: Sword },
  elite: { label: "정예 전투 방", shortLabel: "정예", icon: Shield },
  boss: { label: "보스방", shortLabel: "BOSS", icon: Crown },
  rest: { label: "휴식 방", shortLabel: "휴식", icon: Heart },
  event: { label: "이벤트 방", shortLabel: "이벤트", icon: Sparkles },
  shop: { label: "상점 방", shortLabel: "상점", icon: Coins },
  reward: { label: "보상 방", shortLabel: "보상", icon: Trophy },
};

const NON_COMBAT_ROOM_TYPES = new Set(["event", "rest", "shop"]);
const SHOP_CARD_VALUE_BY_RARITY = {
  common: 80,
  rare: 110,
  epic: 140,
  legendary: 150,
};
const MATERIAL_DEFINITIONS = {
  card_shard: { id: "card_shard", name: "카드 조각", description: "카드를 분해해 얻는 기본 강화 재료", icon: "◇", rarity: "common", source: "card_dismantle" },
  warrior_card_shard: { id: "warrior_card_shard", name: "전사 카드 조각", description: "전사 카드를 분해해 얻는 직업 조각", icon: "⚔", rarity: "common", source: "card_dismantle" },
  mage_card_shard: { id: "mage_card_shard", name: "마법사 카드 조각", description: "마법사 카드를 분해해 얻는 직업 조각", icon: "✦", rarity: "common", source: "card_dismantle" },
  archer_card_shard: { id: "archer_card_shard", name: "궁수 카드 조각", description: "궁수 카드를 분해해 얻는 직업 조각", icon: "➶", rarity: "common", source: "card_dismantle" },
  rift_fragment: { id: "rift_fragment", name: "균열 파편", description: "1층 보스가 남기는 특수 강화 재료", icon: "◆", rarity: "rare", source: "boss_drop" },
  black_iron_heart: { id: "black_iron_heart", name: "흑철 심장", description: "2층 보스가 남기는 묵직한 강화 재료", icon: "♥", rarity: "epic", source: "boss_drop" },
  dragon_scale: { id: "dragon_scale", name: "용의 비늘", description: "상층 보스가 남기는 전설급 강화 재료", icon: "▰", rarity: "legendary", source: "boss_drop" },
  red_fang: { id: "red_fang", name: "붉은 송곳니", description: "강력한 적에게서 얻는 출혈 강화 재료", icon: "♦", rarity: "rare", source: "boss_drop" },
  manaShard: { id: "manaShard", name: "마력 파편", description: "전투 보상으로 얻는 보조 재료", icon: "🔷", rarity: "common", source: "battle_reward" },
  orichalcum: { id: "orichalcum", name: "오리하르콘", description: "보스전에서 발견되는 희귀 금속", icon: "💎", rarity: "epic", source: "boss_drop" },
  ancientRelicDust: { id: "ancientRelicDust", name: "고대 유물 가루", description: "오래된 유물에서 떨어지는 가루", icon: "✨", rarity: "rare", source: "boss_drop" },
};
const BATTLE_RESOURCE_REWARDS = MATERIAL_DEFINITIONS;
const DISMANTLE_REWARDS_BY_RARITY = {
  common: [{ id: "card_shard", name: "카드 조각", amount: 5 }],
  rare: [{ id: "card_shard", name: "카드 조각", amount: 15 }],
  epic: [{ id: "card_shard", name: "카드 조각", amount: 30 }],
  legendary: [{ id: "card_shard", name: "카드 조각", amount: 60 }],
};
const CLASS_SHARD_BY_CARD_CLASS = {
  warrior: { id: "warrior_card_shard", name: "전사 카드 조각" },
  mage: { id: "mage_card_shard", name: "마법사 카드 조각" },
  archer: { id: "archer_card_shard", name: "궁수 카드 조각" },
};
const BOSS_MATERIAL_BY_FLOOR = {
  1: { id: "rift_fragment", amount: 1 },
  2: { id: "black_iron_heart", amount: 1 },
};
const ENEMY_DEATH_ANIMATION_MS = 520;
const BOSS_STAT_MULTIPLIERS = {
  hp: 3,
  attack: 1.55,
  defense: 1.35,
};

const DEFAULT_MONSTER_IMAGE = "/images/monster/default_monster.png";
const MONSTER_IMAGE_PATHS = {
  snail: "/images/Monsters/1층/달팽이.png",
  slime: "/images/Monsters/1층/슬라임.png",
  mushroom: "/images/Monsters/1층/버섯.png",
  pig: "/images/Monsters/1층/돼지.png",
  gatekeeper: "/images/Monsters/1층/탑 수문병.png",
  kobold_boss: "/images/Monsters/1층/코볼트 보스.png",
  goblin: "/images/Monsters/2층/고블린.png",
  orc: "/images/Monsters/2층/오크.png",
  wolf: "/images/Monsters/2층/늑대.png",
  dark_knight: "/images/Monsters/2층/암흑기사.png",
  rift_mage: "/images/Monsters/2층/균열 마도사.png",
  black_iron_watcher: "/images/Monsters/2층/흑철감시자.png",
  dragon_boss: "/images/Monsters/2층/드래곤보스.png",
};

const MONSTER_IMAGE_BY_NAME = {
  달팽이: MONSTER_IMAGE_PATHS.snail,
  슬라임: MONSTER_IMAGE_PATHS.slime,
  버섯: MONSTER_IMAGE_PATHS.mushroom,
  돼지: MONSTER_IMAGE_PATHS.pig,
  "탑 수문병": MONSTER_IMAGE_PATHS.gatekeeper,
  "코볼트 보스": MONSTER_IMAGE_PATHS.kobold_boss,
  고블린: MONSTER_IMAGE_PATHS.goblin,
  오크: MONSTER_IMAGE_PATHS.orc,
  늑대: MONSTER_IMAGE_PATHS.wolf,
  암흑기사: MONSTER_IMAGE_PATHS.dark_knight,
  "균열 마도사": MONSTER_IMAGE_PATHS.rift_mage,
  흑철감시자: MONSTER_IMAGE_PATHS.black_iron_watcher,
  드래곤보스: MONSTER_IMAGE_PATHS.dragon_boss,
};

function getMonsterImagePath(monster) {
  if (!monster) return "";
  const baseName = String(monster.name || monster.enemy || "").replace(/\s+(부하|지원병)\s+\d+$/, "");
  return monster.imagePath || MONSTER_IMAGE_PATHS[monster.monsterId] || MONSTER_IMAGE_BY_NAME[baseName] || monster.imageSrc || "";
}

const FLOOR_ENEMY_TABLE = {
  1: {
    normal: [
      { monsterId: "snail", enemy: "달팽이", maxHp: 40, attack: 6, speed: 7, image: "🐌", imagePath: MONSTER_IMAGE_PATHS.snail },
      { monsterId: "slime", enemy: "슬라임", maxHp: 50, attack: 8, speed: 8, image: "🟢", imagePath: MONSTER_IMAGE_PATHS.slime },
      { monsterId: "mushroom", enemy: "버섯", maxHp: 60, attack: 9, speed: 9, image: "🍄", imagePath: MONSTER_IMAGE_PATHS.mushroom },
      { monsterId: "pig", enemy: "돼지", maxHp: 70, attack: 10, speed: 9, image: "🐖", imagePath: MONSTER_IMAGE_PATHS.pig },
      { monsterId: "gatekeeper", enemy: "탑 수문병", maxHp: 74, attack: 11, speed: 10, image: "🛡️", imagePath: MONSTER_IMAGE_PATHS.gatekeeper },
    ],
    elite: [{ monsterId: "gatekeeper", enemy: "탑 수문병", maxHp: 96, attack: 13, speed: 10, image: "🛡️", imagePath: MONSTER_IMAGE_PATHS.gatekeeper }],
    boss: [{ monsterId: "kobold_boss", enemy: "코볼트 보스", maxHp: 120, attack: 14, speed: 11, image: "👑", imagePath: MONSTER_IMAGE_PATHS.kobold_boss }],
  },
  2: {
    normal: [
      { monsterId: "goblin", enemy: "고블린", maxHp: 80, attack: 12, speed: 11, image: "🗡️", imagePath: MONSTER_IMAGE_PATHS.goblin },
      { monsterId: "orc", enemy: "오크", maxHp: 90, attack: 13, speed: 10, image: "🪓", imagePath: MONSTER_IMAGE_PATHS.orc },
      { monsterId: "wolf", enemy: "늑대", maxHp: 95, attack: 14, speed: 15, image: "🐺", imagePath: MONSTER_IMAGE_PATHS.wolf },
      { monsterId: "dark_knight", enemy: "암흑기사", maxHp: 110, attack: 16, speed: 12, image: "♞", imagePath: MONSTER_IMAGE_PATHS.dark_knight },
      { monsterId: "rift_mage", enemy: "균열 마도사", maxHp: 104, attack: 15, speed: 14, image: "🔮", imagePath: MONSTER_IMAGE_PATHS.rift_mage },
    ],
    elite: [{ monsterId: "black_iron_watcher", enemy: "흑철감시자", maxHp: 135, attack: 18, speed: 12, image: "🛡️", imagePath: MONSTER_IMAGE_PATHS.black_iron_watcher }],
    boss: [{ monsterId: "dragon_boss", enemy: "드래곤보스", maxHp: 180, attack: 22, speed: 13, image: "🐉", imagePath: MONSTER_IMAGE_PATHS.dragon_boss }],
  },
};

function scaleEnemyForFloor(enemy, floor) {
  const growth = Math.max(0, floor - 2);
  return {
    ...enemy,
    maxHp: enemy.maxHp + growth * 18,
    attack: enemy.attack + Math.floor(growth * 2.4),
    speed: enemy.speed + Math.floor(growth / 8),
  };
}

function pickEnemyTemplate(floor, type, index = 0) {
  const floorTable = FLOOR_ENEMY_TABLE[floor] || FLOOR_ENEMY_TABLE[2];
  const templates = floorTable[type] || floorTable.normal;
  return scaleEnemyForFloor(templates[index % templates.length], floor);
}

function buildFloorNodes(floor) {
  const outer = [0, 1, 2].map((index) => ({
    ...pickEnemyTemplate(floor, "normal", index),
    id: `${floor}-${index + 1}`,
    floor,
    label: `${floor}-${index + 1}`,
    ring: 3,
    ringLabel: "외곽 원",
    type: index === 1 ? "event" : "normal",
    typeLabel: index === 1 ? ROOM_TYPE_META.event.label : ROOM_TYPE_META.normal.label,
  }));
  const middle = [0, 1].map((index) => ({
    ...pickEnemyTemplate(floor, "normal", index + 3),
    id: `${floor}-${index + 4}`,
    floor,
    label: `${floor}-${index + 4}`,
    ring: 2,
    ringLabel: "중간 원",
    type: index === 0 ? "shop" : "rest",
    typeLabel: index === 0 ? ROOM_TYPE_META.shop.label : ROOM_TYPE_META.rest.label,
  }));
  const elite = {
    ...pickEnemyTemplate(floor, "elite"),
    id: `${floor}-elite`,
    floor,
    label: `${floor}-정예`,
    ring: 1,
    ringLabel: "안쪽 원",
    type: "elite",
    typeLabel: ROOM_TYPE_META.elite.label,
  };
  const boss = {
    ...pickEnemyTemplate(floor, "boss"),
    id: `${floor}-boss`,
    floor,
    label: `${floor}-BOSS`,
    ring: 0,
    ringLabel: "중앙 원",
    type: "boss",
    typeLabel: ROOM_TYPE_META.boss.label,
    finalBoss: floor >= TOTAL_FLOORS,
  };

  return [...outer, ...middle, elite, boss];
}

const STAGE_DATA = [1, 2].flatMap((floor) => buildFloorNodes(floor));

function getFloorNodes(floor) {
  return floor <= 2 ? STAGE_DATA.filter((stage) => stage.floor === floor) : buildFloorNodes(floor);
}

function buildStageEnemy(stage) {
  const isBoss = stage.type === "boss";
  const imagePath = getMonsterImagePath(stage);
  const bossHpMultiplier = stage.dungeonRun ? 1.35 : BOSS_STAT_MULTIPLIERS.hp;
  const bossAttackMultiplier = stage.dungeonRun ? 1.15 : BOSS_STAT_MULTIPLIERS.attack;
  const bossDefenseMultiplier = stage.dungeonRun ? 0.75 : BOSS_STAT_MULTIPLIERS.defense;
  const attack = isBoss ? Math.round(stage.attack * bossAttackMultiplier) : stage.attack;
  const maxHp = isBoss ? Math.round(stage.maxHp * bossHpMultiplier) : stage.maxHp;
  const defense = isBoss
    ? Math.max(1, Math.round((stage.defense || stage.attack * 0.45) * bossDefenseMultiplier))
    : Math.max(0, stage.defense || 0);
  return {
    monsterId: stage.monsterId,
    name: stage.enemy,
    maxHp,
    speed: stage.speed,
    image: stage.image,
    imagePath,
    imageSrc: imagePath,
    boss: isBoss,
    attack,
    defense,
    damageResistance: isBoss ? (stage.dungeonRun ? 0.08 : 0.18) : 0,
    statusResistance: isBoss ? (stage.dungeonRun ? 0.3 : 0.5) : 0,
    actions: isBoss
      ? [
          { type: "attack", value: attack, text: `공격 ${attack}` },
          { type: "block", value: Math.ceil(attack * 0.9), text: `방어 ${Math.ceil(attack * 0.9)} / 강공격 준비`, warning: "강공격 예고" },
          { type: "attack", value: Math.ceil(attack * 1.65), text: `광역 강공격 ${Math.ceil(attack * 1.65)}`, special: true, warning: "강공격 예고" },
        ]
      : [
          { type: "attack", value: attack, text: `공격 ${attack}` },
          { type: "block", value: Math.ceil(attack * 0.6), text: `방어 ${Math.ceil(attack * 0.6)}` },
        ],
  };
}

function calcDamage(base, player, enemy) {
  const attackBonus = Math.max(0, Math.floor(((player.attack || 10) - 10) / 2));
  const raw = base + player.strength + attackBonus + (player.attackCardBonus || 0);
  const attackAdjusted = raw * (player.attackMultiplier || 1);
  const bossAdjusted = enemy?.boss ? attackAdjusted * (player.bossDamageMultiplier || 1) : attackAdjusted;
  const critAdjusted = Math.random() < (player.critRate || 0) ? bossAdjusted * (player.critDamageMultiplier || 1.5) : bossAdjusted;
  const finalDamage = enemy.vulnerable > 0 ? critAdjusted * 1.5 : critAdjusted;
  const defenseReduction = Math.floor((enemy?.defense || 0) / 4);
  const resistedDamage = Math.ceil(Math.max(1, finalDamage - defenseReduction) * (1 - (enemy?.damageResistance || 0)));
  return Math.max(1, resistedDamage);
}

function shuffle(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function healByPercent(player, percent) {
  const amount = getModifiedHealAmount(player, Math.max(1, Math.ceil(player.maxHp * (percent / 100))));
  return {
    amount: Math.min(amount, Math.max(0, player.maxHp - player.hp)),
    rawAmount: amount,
  };
}

function getModifiedHealAmount(player, amount) {
  return Math.max(1, Math.ceil(amount * (player?.healMultiplier || 1)));
}

function applyFlatHeal(player, amount) {
  const healed = Math.min(Math.max(0, player.maxHp - player.hp), getModifiedHealAmount(player, amount));
  return { ...player, hp: Math.min(player.maxHp, player.hp + healed) };
}

function getModifiedGoldGain(player, amount) {
  return Math.max(0, Math.ceil(amount * (player?.goldMultiplier || 1)));
}

function damageByPercent(player, percent) {
  return Math.max(1, Math.ceil(player.maxHp * (percent / 100)));
}

function getCardBaseValue(card) {
  return SHOP_CARD_VALUE_BY_RARITY[card?.rarity] || SHOP_CARD_VALUE_BY_RARITY.common;
}

function getExplorationCardPool(classId) {
  return Object.keys(CARD_POOL).filter((id) => {
    const card = CARD_POOL[id];
    const cardClass = card.cardClass || "common";
    return id !== "strike" && id !== "defend" && (cardClass === "common" || cardClass === classId);
  });
}

function pickRandomExplorationCard(classId) {
  const pool = getExplorationCardPool(classId);
  return pool[randomInt(0, Math.max(0, pool.length - 1))] || Object.keys(CARD_POOL)[0];
}

function buildShopCards(classId, shopPriceMultiplier = 1) {
  const pool = shuffle(getExplorationCardPool(classId)).slice(0, 3);
  return pool.map((id, index) => ({
    id,
    stockId: `${id}-${Date.now()}-${index}-${randomInt(1000, 9999)}`,
    price: Math.max(1, Math.ceil(randomInt(50, 150) * shopPriceMultiplier)),
  }));
}

function findSellableCard(deck) {
  if (deck.length === 0) return null;
  const counts = deck.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});
  const duplicateId = deck.find((id) => counts[id] > 1);
  const cardId = duplicateId || [...deck].sort((a, b) => getCardBaseValue(CARD_POOL[a]) - getCardBaseValue(CARD_POOL[b]))[0];
  const card = CARD_POOL[cardId];
  return {
    id: cardId,
    card,
    value: Math.floor(getCardBaseValue(card) * 0.5),
  };
}

function getMaterialDefinition(id) {
  return MATERIAL_DEFINITIONS[id] || { id, name: id, icon: "◇", rarity: "common", source: "battle_reward" };
}

function createMaterialReward(id, amount = 1) {
  const material = getMaterialDefinition(id);
  return { id: material.id, name: material.name, icon: material.icon, amount };
}

function getBossMaterialReward(floor) {
  const special = BOSS_MATERIAL_BY_FLOOR[floor] || { id: "dragon_scale", amount: 1 };
  return createMaterialReward(special.id, special.amount);
}

function addMaterialRewards(resources = {}, rewards = []) {
  const nextResources = { ...resources };
  rewards.forEach((reward) => {
    nextResources[reward.id] = (nextResources[reward.id] || 0) + Math.max(0, Number(reward.amount || 0));
  });
  return nextResources;
}

function getDismantleRewards(card) {
  const rarity = card?.rarity || "common";
  const baseRewards = card?.dismantleReward || DISMANTLE_REWARDS_BY_RARITY[rarity] || DISMANTLE_REWARDS_BY_RARITY.common;
  const rewards = baseRewards.map((reward) => ({ ...createMaterialReward(reward.id, reward.amount), name: reward.name || getMaterialDefinition(reward.id).name }));
  const classShard = CLASS_SHARD_BY_CARD_CLASS[card?.cardClass];
  if (classShard) {
    const baseAmount = rewards.find((reward) => reward.id === "card_shard")?.amount || 5;
    rewards.push({ ...createMaterialReward(classShard.id, Math.max(1, Math.floor(baseAmount / 5))), name: classShard.name });
  }
  return rewards;
}

function canDismantleCard(deck, cardId, classId) {
  if (!cardId || deck.length <= 5) return false;
  const cardCount = deck.filter((id) => id === cardId).length;
  if (cardCount <= 0) return false;
  const starterCards = new Set(CHARACTER_CLASSES[classId]?.starter || []);
  if (starterCards.has(cardId) && cardCount <= 1) return false;
  return true;
}

function canUpgradeCard(option, playerInventory) {
  if (!option?.cost) return false;
  if ((playerInventory?.gold ?? 0) < (option.cost.gold ?? 0)) return false;
  return (option.cost.materials || []).every((material) => (playerInventory?.resources?.[material.id] ?? 0) >= material.amount);
}

function getUpgradeCostIssues(option, playerInventory) {
  const issues = [];
  const goldNeeded = option?.cost?.gold || 0;
  if ((playerInventory?.gold || 0) < goldNeeded) {
    issues.push(`골드 부족: ${playerInventory?.gold || 0} / ${goldNeeded}`);
  }
  (option?.cost?.materials || []).forEach((material) => {
    const owned = playerInventory?.resources?.[material.id] || 0;
    if (owned < material.amount) {
      issues.push(`${material.name || getMaterialDefinition(material.id).name} 부족: ${owned} / ${material.amount}`);
    }
  });
  return issues;
}

function consumeUpgradeCost(playerInventory, cost) {
  const nextResources = { ...(playerInventory.resources || {}) };
  (cost.materials || []).forEach((material) => {
    nextResources[material.id] = Math.max(0, (nextResources[material.id] || 0) - material.amount);
  });

  return {
    ...playerInventory,
    gold: Math.max(0, (playerInventory.gold || 0) - (cost.gold || 0)),
    resources: nextResources,
  };
}

function getRoomPreview(node) {
  if (!node) return "";
  if (node.type === "event") return "알 수 없는 사건이 기다립니다.";
  if (node.type === "rest") return "안전한 숨 돌릴 곳이 보입니다.";
  if (node.type === "shop") return "상인이 머무르는 작은 장터입니다.";
  return `${node.enemy} 출현 예상`;
}

function isNonCombatRoom(stage) {
  return NON_COMBAT_ROOM_TYPES.has(stage?.type);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function makeDeck() {
  return [...CHARACTER_CLASSES.warrior.starter];
}

function buildStarterDeck(characterId) {
  const profile = CHARACTER_CLASSES[characterId] || CHARACTER_CLASSES.warrior;
  return [...profile.starter];
}

function nextActorFromGauge(playerGauge, enemyGauge, playerSpeed, enemySpeed) {
  const threshold = 100;
  let nextPlayerGauge = playerGauge;
  let nextEnemyGauge = enemyGauge;

  while (true) {
    nextPlayerGauge += playerSpeed;
    nextEnemyGauge += enemySpeed;

    if (nextPlayerGauge >= threshold || nextEnemyGauge >= threshold) {
      if (nextEnemyGauge > nextPlayerGauge) {
        nextEnemyGauge -= threshold;
        return { actor: "enemy", playerGauge: nextPlayerGauge, enemyGauge: nextEnemyGauge };
      }

      nextPlayerGauge -= threshold;
      return { actor: "player", playerGauge: nextPlayerGauge, enemyGauge: nextEnemyGauge };
    }
  }
}

function buildTurnPreview(playerSpeed, enemySpeed, length = 6) {
  const preview = [];
  let playerGauge = 0;
  let enemyGauge = 0;

  for (let i = 0; i < length; i += 1) {
    const next = nextActorFromGauge(playerGauge, enemyGauge, playerSpeed, enemySpeed);
    preview.push(next.actor === "player" ? "플레이어" : "적");
    playerGauge = next.playerGauge;
    enemyGauge = next.enemyGauge;
  }

  return preview.join(" → ");
}

function normalizeSpeedGauge(gauge, enemies = []) {
  const legacyEnemyGauge = Number(gauge?.enemy || 0);
  const enemyGauges = Array.isArray(gauge?.enemies) ? gauge.enemies : enemies.map(() => legacyEnemyGauge);

  return {
    player: Number(gauge?.player || 0),
    enemies: enemies.map((_, index) => Number(enemyGauges[index] || 0)),
  };
}

function nextActorFromCombatGauge(gauge, playerSpeed, enemies) {
  const threshold = 100;
  const aliveEnemies = enemies
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => isEnemyAlive(entry));
  const nextGauge = normalizeSpeedGauge(gauge, enemies);

  if (aliveEnemies.length === 0) {
    return { actor: { type: "player" }, gauge: nextGauge };
  }

  let safety = 0;
  while (safety < 400) {
    safety += 1;
    nextGauge.player += Math.max(1, playerSpeed || 1);

    aliveEnemies.forEach(({ entry, index }) => {
      nextGauge.enemies[index] += Math.max(1, entry.speed || 1);
    });

    const candidates = [];
    if (nextGauge.player >= threshold) {
      candidates.push({ type: "player", gauge: nextGauge.player });
    }

    aliveEnemies.forEach(({ index }) => {
      if (nextGauge.enemies[index] >= threshold) {
        candidates.push({ type: "enemy", index, gauge: nextGauge.enemies[index] });
      }
    });

    if (candidates.length > 0) {
      const actor = candidates.sort((a, b) => b.gauge - a.gauge)[0];
      if (actor.type === "player") {
        nextGauge.player -= threshold;
      } else {
        nextGauge.enemies[actor.index] -= threshold;
      }
      return { actor, gauge: nextGauge };
    }
  }

  return { actor: { type: "player" }, gauge: nextGauge };
}

function buildCombatTimeline(gauge, player, enemies, length = 6) {
  const timeline = [];
  let previewGauge = normalizeSpeedGauge(gauge, enemies);

  for (let i = 0; i < length; i += 1) {
    const next = nextActorFromCombatGauge(previewGauge, player.speed, enemies);
    previewGauge = next.gauge;
    timeline.push(next.actor);
  }

  return timeline;
}

function createEnemy(indexOrStage = 0) {
  const template = typeof indexOrStage === "object" ? buildStageEnemy(indexOrStage) : ENEMIES[indexOrStage];
  return {
    ...template,
    hp: template.maxHp,
    block: 0,
    strength: 0,
    vulnerable: 0,
    bleed: 0,
    actionIndex: 0,
    status: "alive",
    targetable: true,
  };
}

function createStageEnemies(stage) {
  const monsterCount = stage.monsterCount || (stage.type === "boss" ? 1 : stage.type === "elite" ? 1 : 1);

  return Array.from({ length: monsterCount }, (_, index) => {
    const isMainBoss = stage.type === "boss" && index === 0;
    const variant =
      index === 0
        ? stage
        : {
            ...stage,
            type: "normal",
            enemy: stage.type === "boss" ? `${stage.enemy} 부하 ${index}` : `${stage.enemy} 지원병 ${index}`,
            maxHp: Math.max(24, Math.round(stage.maxHp * (stage.type === "boss" ? 0.36 + index * 0.06 : 0.72))),
            attack: Math.max(4, Math.round(stage.attack * (stage.type === "boss" ? 0.55 + index * 0.06 : 0.82))),
            speed: Math.max(5, stage.speed + index - 1),
            image: stage.type === "boss" ? (index === 1 ? "🛡️" : "🔥") : "🧬",
            imagePath: getMonsterImagePath(stage),
            imageSrc: getMonsterImagePath(stage),
          };

    return {
      ...createEnemy(variant),
      id: `${stage.id}-${index}`,
      boss: isMainBoss,
      finalBoss: isMainBoss && Boolean(stage.finalBoss),
    };
  });
}

function buildDungeonStage(depth, maxDepth = DEFAULT_MAX_DUNGEON_DEPTH) {
  const roomType = getRoomTypeByDepth(depth, maxDepth);
  const stageType = ROOM_TYPE_TO_STAGE_TYPE[roomType];

  if (stageType === "rest" || stageType === "shop") {
    return {
      id: `depth-${depth}-${stageType}`,
      floor: depth,
      depth,
      maxDepth,
      label: `${depth}깊이`,
      ring: maxDepth - depth,
      ringLabel: `던전 깊이 ${depth}/${maxDepth}`,
      type: stageType,
      roomType,
      typeLabel: getRoomTypeLabel(roomType),
      dungeonRun: true,
    };
  }

  const tableFloor = depth >= 6 ? 2 : 1;
  const templateType = stageType === "boss" ? "boss" : stageType === "elite" ? "elite" : "normal";
  const template = pickEnemyTemplate(tableFloor, templateType, depth);
  const depthBonus = Math.max(0, depth - 1);
  const isBoss = stageType === "boss";
  const isElite = stageType === "elite";

  return {
    ...template,
    id: `depth-${depth}-${stageType}`,
    floor: depth,
    depth,
    maxDepth,
    label: `${depth}깊이`,
    ring: maxDepth - depth,
    ringLabel: `던전 깊이 ${depth}/${maxDepth}`,
    type: stageType,
    roomType,
    typeLabel: getRoomTypeLabel(roomType),
    maxHp: Math.round(template.maxHp + depthBonus * (isBoss ? 8 : isElite ? 7 : 4)),
    attack: Math.round(template.attack + depthBonus * (isBoss ? 0.8 : isElite ? 0.65 : 0.45)),
    monsterCount: stageType === "normal" ? randomInt(1, 2) : 1,
    finalBoss: depth >= maxDepth,
    dungeonRun: true,
  };
}

function getEnemyDeathFx(enemy) {
  if (enemy?.boss) return "collapse";
  if (["slime", "snail", "mushroom"].includes(enemy?.monsterId)) return "dissolve";
  if (["rift_mage", "dragon_boss", "kobold_boss"].includes(enemy?.monsterId)) return "light";
  return "smoke";
}

function isEnemyAlive(enemy) {
  return Boolean(enemy && enemy.hp > 0 && enemy.status !== "dead");
}

function isEnemyTargetable(enemy) {
  return isEnemyAlive(enemy) && enemy.targetable !== false;
}

function applyEnemyStatusResistance(previousEnemy, nextEnemy) {
  if (!previousEnemy?.boss || !nextEnemy) return nextEnemy;
  const resistance = Math.max(0, Math.min(1, previousEnemy.statusResistance || 0));
  const vulnerableGain = Math.max(0, (nextEnemy.vulnerable || 0) - (previousEnemy.vulnerable || 0));
  const bleedGain = Math.max(0, (nextEnemy.bleed || 0) - (previousEnemy.bleed || 0));
  if (vulnerableGain <= 0 && bleedGain <= 0) return nextEnemy;

  return {
    ...nextEnemy,
    vulnerable: (previousEnemy.vulnerable || 0) + Math.max(0, Math.ceil(vulnerableGain * (1 - resistance))),
    bleed: (previousEnemy.bleed || 0) + Math.max(0, Math.ceil(bleedGain * (1 - resistance))),
  };
}

function markEnemyDead(enemy) {
  if (!enemy || enemy.status === "dead") return enemy;
  if (enemy.hp > 0) return enemy;
  return {
    ...enemy,
    hp: 0,
    block: 0,
    vulnerable: 0,
    bleed: 0,
    status: "dead",
    targetable: false,
    deathFx: enemy.deathFx || getEnemyDeathFx(enemy),
    deathKey: enemy.deathKey || `${enemy.id || enemy.name}-${Date.now()}`,
  };
}

function settleDefeatedEnemies(enemyList) {
  return enemyList.map((entry) => (entry?.hp <= 0 ? markEnemyDead(entry) : entry));
}

function getFirstAliveEnemyIndex(enemyList) {
  return Math.max(0, enemyList.findIndex((enemy) => isEnemyAlive(enemy)));
}

function areAllEnemiesDefeated(enemyList) {
  return enemyList.length > 0 && enemyList.every((enemy) => !isEnemyAlive(enemy));
}

function getRewardCards(deck, classId, playerDataOrEffects = null) {
  const effects = playerDataOrEffects?.traits ? getTraitEffects(playerDataOrEffects) : playerDataOrEffects || {};
  const ids = Object.keys(CARD_POOL).filter((id) => id !== "strike" && id !== "defend");
  const isClassCard = (id) => {
    const cardClass = CARD_POOL[id].cardClass || "common";
    return cardClass === classId;
  };

  const rarityPools = {
    common: {
      class: ids.filter((id) => CARD_POOL[id].rarity === "common" && isClassCard(id)),
      shared: ids.filter((id) => CARD_POOL[id].rarity === "common" && (CARD_POOL[id].cardClass || "common") === "common"),
    },
    rare: {
      class: ids.filter((id) => CARD_POOL[id].rarity === "rare" && isClassCard(id)),
      shared: ids.filter((id) => CARD_POOL[id].rarity === "rare" && (CARD_POOL[id].cardClass || "common") === "common"),
    },
    epic: {
      class: ids.filter((id) => CARD_POOL[id].rarity === "epic" && isClassCard(id)),
      shared: ids.filter((id) => CARD_POOL[id].rarity === "epic" && (CARD_POOL[id].cardClass || "common") === "common"),
    },
    legendary: {
      class: ids.filter((id) => CARD_POOL[id].rarity === "legendary" && isClassCard(id)),
      shared: ids.filter((id) => CARD_POOL[id].rarity === "legendary" && (CARD_POOL[id].cardClass || "common") === "common"),
    },
  };

  const rewardTarget = Math.min(4, 3 + (Math.random() < (effects.cardRewardChance || 0) ? 1 : 0));
  const selectedIds = [];
  while (selectedIds.length < rewardTarget) {
    const availableWeights = REWARD_RARITY_WEIGHTS.filter(({ rarity }) => {
      const pool = rarityPools[rarity];
      return pool.class.length > 0 || pool.shared.length > 0;
    });
    if (availableWeights.length === 0) break;

    const rareOrBetterWeights = availableWeights.filter(({ rarity }) => rarity !== "common");
    const weights = Math.random() < (effects.rareCardChance || 0) && rareOrBetterWeights.length > 0 ? rareOrBetterWeights : availableWeights;
    const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    let selectedRarity = weights[0].rarity;
    for (const item of weights) {
      roll -= item.weight;
      if (roll <= 0) {
        selectedRarity = item.rarity;
        break;
      }
    }

    const pickClassCard = Math.random() < 0.7;
    let pool = pickClassCard ? rarityPools[selectedRarity].class : rarityPools[selectedRarity].shared;
    if (pool.length === 0) {
      pool = pickClassCard ? rarityPools[selectedRarity].shared : rarityPools[selectedRarity].class;
    }
    if (pool.length === 0) continue;

    const pickIndex = Math.floor(Math.random() * pool.length);
    const [pickedId] = pool.splice(pickIndex, 1);
    rarityPools[selectedRarity].class = rarityPools[selectedRarity].class.filter((id) => id !== pickedId);
    rarityPools[selectedRarity].shared = rarityPools[selectedRarity].shared.filter((id) => id !== pickedId);
    selectedIds.push(pickedId);
  }

  return selectedIds.map((id) => CARD_POOL[id]);
}

function createResourceReward(id, amount = 1) {
  return createMaterialReward(id, amount);
}

function generateBattleReward(stage, gold, cardChoices) {
  const resources = [];
  if (stage?.type === "boss") {
    resources.push(getBossMaterialReward(stage.floor));
    resources.push(createResourceReward("red_fang", stage.floor === 1 ? 1 : 0));
    resources.push(createResourceReward("ancientRelicDust", 2));
  } else if (stage?.type === "elite") {
    resources.push(createResourceReward("manaShard", 3));
  } else {
    resources.push(createResourceReward("manaShard", 1));
  }

  return {
    gold: Math.max(0, Number(gold || 0)),
    resources: resources.filter((resource) => resource.amount > 0),
    cardChoices: (cardChoices || []).slice(0, 3),
  };
}

function hasBattleReward(reward) {
  return Boolean(
    reward &&
      ((reward.gold || 0) > 0 || (reward.resources || []).length > 0 || (reward.cardChoices || []).length > 0),
  );
}

function applyBattleRewardToPlayer(player, reward) {
  const nextResources = { ...(player.resources || {}) };
  (reward?.resources || []).forEach((resource) => {
    nextResources[resource.id] = (nextResources[resource.id] || 0) + Math.max(0, Number(resource.amount || 0));
  });

  return {
    ...player,
    gold: player.gold + Math.max(0, Number(reward?.gold || 0)),
    resources: nextResources,
  };
}

function buildRoomEncounter(stage, player, deck = []) {
  if (stage.type === "rest") {
    return {
      type: "rest",
      title: "휴식방",
      situation: "따뜻한 불빛이 바닥의 균열을 부드럽게 덮고 있다. 이곳에서는 잠시 무기를 내려놓아도 될 것 같다.",
      choices: [
        { id: "rest", label: "휴식하기", hint: "최대 체력의 30% 회복. 이 방에서 1번만 가능" },
        { id: "rest-leave", label: "나가기", hint: "아무 행동 없이 방 클리어" },
      ],
    };
  }

  if (stage.type === "shop") {
    const shopCards = buildShopCards(player.classId, player.shopPriceMultiplier || 1);
    const featured = shopCards.find((item) => item.price <= player.gold) || shopCards[0];
    const sellable = findSellableCard(deck);
    return {
      type: "shop",
      title: "상점 방",
      situation: "상인이 테이블 위에 여러 장의 카드를 펼쳐놓는다.",
      shopCards,
      featuredCardId: featured?.id,
      choices: [
        {
          id: "shop-buy",
          label: "카드 구매",
          hint: featured ? `${CARD_POOL[featured.id].name} ${featured.price} 골드` : "구매 가능한 카드가 없습니다",
        },
        {
          id: "shop-sell",
          label: "카드 판매",
          hint: sellable ? "카드 가치의 50% 획득" : "현재 덱에서 판매할 카드 선택",
        },
        { id: "shop-heal", label: "골드로 체력 회복", hint: "10골드당 최대 체력의 10% 회복" },
      ],
    };
  }

  const variants = [
    {
      title: "수상한 제단",
      situation: "수상한 제단이 있다. 희미한 빛이 손짓하듯 새어나오고, 금이 간 석판에는 오래된 맹세가 새겨져 있다.",
      choices: [
        { id: "event-touch-altar", label: "제단에 손을 올린다", hint: "체력 변화, 카드, 최대 체력 중 하나" },
        { id: "event-offer-gold", label: "골드를 바친다", hint: "10~50 골드 소비, 최대 체력 증가 가능" },
        { id: "event-ignore", label: "무시하고 지나간다", hint: "아무 일도 일어나지 않거나 작은 발견" },
      ],
    },
    {
      title: "그림자 도박꾼",
      situation: "망토를 뒤집어쓴 도박꾼이 낡은 카드 세 장을 펼친다. 카드 뒷면마다 다른 색의 불씨가 흔들린다.",
      choices: [
        { id: "event-gamble-gold", label: "30골드를 건다", hint: "확률 기반 보상 또는 손실" },
        { id: "event-draw-card", label: "표식 카드를 뽑는다", hint: "랜덤 카드 또는 체력 감소" },
        { id: "event-ignore", label: "상대를 지나친다", hint: "이벤트 종료" },
      ],
    },
    {
      title: "속삭이는 샘",
      situation: "푸른 샘물이 낮게 속삭인다. 물 위에는 금빛 동전과 검은 잎사귀가 함께 떠 있다.",
      choices: [
        { id: "event-drink-spring", label: "샘물을 마신다", hint: "체력 회복 또는 감소" },
        { id: "event-take-coins", label: "동전을 건져낸다", hint: "골드 획득 또는 도난" },
        { id: "event-rest-spring", label: "샘 옆에 앉는다", hint: "소량 회복 또는 최대 체력 증가" },
      ],
    },
  ];

  return {
    type: "event",
    ...variants[randomInt(0, variants.length - 1)],
  };
}

function CardIllustration({ card, rarityFrame, typeTheme }) {
  const motif = card.imageType || "arcane";
  const lineColor = typeTheme.sigilStroke;
  const accent = typeTheme.accent;
  const motifShape =
    motif.includes("shield") || motif.includes("aegis") || motif.includes("barrier") || motif.includes("fortress")
      ? "shield"
      : motif.includes("fire") || motif.includes("meteor")
        ? "burst"
        : motif.includes("lightning") || motif.includes("storm")
          ? "bolt"
          : motif.includes("heal")
            ? "cross"
            : motif.includes("focus") || motif.includes("arcane")
              ? "rune"
              : "blade";

  return (
    <div
      className="relative h-[104px] overflow-hidden rounded-xl border shadow-inner"
      style={{
        borderColor: rarityFrame.inner,
        background: rarityFrame.art,
      }}
    >
      <div
        className="absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.85) 0 2px, transparent 3px), radial-gradient(circle at 78% 70%, rgba(255,255,255,0.7) 0 1px, transparent 3px), linear-gradient(135deg, rgba(255,255,255,0.38), transparent 42%)",
        }}
      />
      <div className="absolute inset-x-5 top-4 h-16 rounded-full blur-xl" style={{ background: rarityFrame.glow }} />
      <svg viewBox="0 0 160 104" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
        <path d="M14 86C39 68 54 77 80 58C105 39 119 40 146 18" stroke={rarityFrame.inner} strokeWidth="2" opacity="0.7" />
        <path d="M18 18C41 35 59 28 80 48C103 70 121 65 142 87" stroke={rarityFrame.border} strokeWidth="1.6" opacity="0.32" />
        {motifShape === "shield" && (
          <>
            <path d="M80 20L111 34V57C111 76 99 89 80 94C61 89 49 76 49 57V34L80 20Z" fill="rgba(255,255,255,0.38)" stroke={lineColor} strokeWidth="5" />
            <path d="M64 57H96" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          </>
        )}
        {motifShape === "burst" && (
          <>
            <path d="M80 16C99 42 113 51 104 72C96 89 64 89 56 72C47 51 62 42 80 16Z" fill="rgba(255,255,255,0.42)" stroke={lineColor} strokeWidth="5" />
            <path d="M80 39C89 51 94 59 90 69C86 78 74 78 70 69C66 59 71 51 80 39Z" fill={accent} opacity="0.34" />
          </>
        )}
        {motifShape === "bolt" && <path d="M91 12L50 60H78L67 94L111 43H83L91 12Z" fill="rgba(255,255,255,0.42)" stroke={lineColor} strokeWidth="5" strokeLinejoin="round" />}
        {motifShape === "cross" && (
          <>
            <circle cx="80" cy="53" r="35" fill="rgba(255,255,255,0.34)" stroke={lineColor} strokeWidth="4" />
            <path d="M80 32V74M59 53H101" stroke={accent} strokeWidth="8" strokeLinecap="round" />
          </>
        )}
        {motifShape === "rune" && (
          <>
            <circle cx="80" cy="53" r="35" fill="rgba(255,255,255,0.3)" stroke={lineColor} strokeWidth="4" />
            <path d="M80 22L90 43L113 47L96 63L100 87L80 75L60 87L64 63L47 47L70 43L80 22Z" stroke={accent} strokeWidth="4" />
          </>
        )}
        {motifShape === "blade" && (
          <>
            <path d="M101 14L59 65L73 79L124 37L130 8L101 14Z" fill="rgba(255,255,255,0.44)" stroke={lineColor} strokeWidth="5" strokeLinejoin="round" />
            <path d="M58 66L43 81M67 76L52 91M50 74L60 84" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}

function CardDetailPanel({ card, targetName }) {
  if (!card) return null;
  const rarityMeta = RARITY_META[card.rarity] || RARITY_META.common;
  const rarityFrame = RARITY_FRAME[card.rarity] || RARITY_FRAME.common;
  const starLevel = getCardStarLevel(card);

  return (
    <div className="rounded-3xl border bg-slate-950/70 p-4 shadow-xl" style={{ borderColor: rarityFrame.border, boxShadow: `0 0 26px ${rarityFrame.glow}` }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-1 text-xs font-black ${rarityMeta.className}`}>{rarityMeta.label}</span>
        <span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-black text-amber-950">{"★".repeat(starLevel)} {starLevel}성</span>
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black text-slate-200">{card.typeLabel}</span>
        <span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-black text-slate-950">비용 {card.cost}</span>
        {card.type === "attack" && <span className="rounded-full bg-red-200 px-2 py-1 text-xs font-black text-red-950">연출 {card.animationType}</span>}
        {targetName && <span className="rounded-full bg-cyan-200 px-2 py-1 text-xs font-black text-slate-950">타깃 {targetName}</span>}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[90px_1fr] md:items-center">
        <div className="hidden md:block">
          {card.fullImage ? (
            <img src={card.fullImage} alt={card.name} className="card-detail-image" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          ) : (
            <CardIllustration card={card} rarityFrame={rarityFrame} typeTheme={TYPE_THEME[card.type] || TYPE_THEME.attack} />
          )}
        </div>
        <div>
          <h3 className="text-xl font-black text-white">{card.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{card.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
            {card.damage > 0 && <span className="rounded-lg bg-red-500/15 px-2 py-1 text-red-100">피해 {card.damage}</span>}
            {card.block > 0 && <span className="rounded-lg bg-blue-500/15 px-2 py-1 text-blue-100">방어 {card.block}</span>}
            {card.effect && <span className="rounded-lg bg-violet-500/15 px-2 py-1 text-violet-100">{card.effect}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCardStarLevel(card) {
  return clampNumber(Number(card?.starLevel || 1), 1, 5);
}

function CardStarBadge({ level, compact = false }) {
  const starLevel = clampNumber(Number(level || 1), 1, 5);
  const stars = "★★★★★".slice(0, starLevel);
  return (
    <div className={`card-star-badge ${compact ? "is-compact" : ""} ${starLevel >= 5 ? "is-legend" : ""}`}>
      <span>{stars}</span>
    </div>
  );
}

function CardEnhancementLayers({ level, active = false, compact = false }) {
  const starLevel = clampNumber(Number(level || 1), 1, 5);
  if (starLevel <= 1) return <CardStarBadge level={starLevel} compact={compact} />;

  const effect = CARD_STAR_EFFECTS[starLevel];
  const particleCount = compact ? Math.min(effect.particleCount, 6) : effect.particleCount;
  return (
    <>
      <div className="card-enhancement-aura" aria-hidden="true" />
      {starLevel >= 4 && <div className="card-enhancement-flame" aria-hidden="true" />}
      <div className="card-enhancement-frame" aria-hidden="true" />
      <div className="card-enhancement-sheen" aria-hidden="true" />
      {starLevel >= 5 && <div className={`card-legend-ring ${active ? "is-active" : ""}`} aria-hidden="true" />}
      <div className="card-enhancement-particles" aria-hidden="true">
        {Array.from({ length: particleCount }, (_, index) => (
          <span key={index} style={{ "--particle-index": index, "--particle-delay": `${index * 0.17}s` }} />
        ))}
      </div>
      <CardStarBadge level={starLevel} compact={compact} />
    </>
  );
}

function Card({ cardId, onClick, disabled, compact = false, onInspect, onInspectEnd, variant = "deck", isBack = false, classId = "warrior" }) {
  const card = CARD_POOL[cardId];
  const [isHovering, setIsHovering] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [backImageFailed, setBackImageFailed] = useState(false);
  const isHand = variant === "hand";
  const cardHeight = compact ? "min-h-[238px]" : isHand ? "min-h-[286px]" : "min-h-[276px]";
  const cardWidth = isHand ? "w-[174px] min-w-[174px]" : "w-full";
  const backImage = classCardBackImages[classId] || classCardBackImages.warrior;

  if (isBack) {
    return (
      <motion.button
        whileHover={{ y: disabled ? -4 : -12, scale: disabled ? 1.01 : 1.06, zIndex: 60 }}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onClick={(event) => {
          if (disabled) return;
          onClick?.(event);
        }}
        aria-disabled={disabled}
        className={`game-card image-card card-back ${cardHeight} ${cardWidth} ${disabled ? "card-disabled" : ""}`}
      >
        {!backImageFailed ? (
          <img
            src={backImage}
            alt="직업별 카드 뒷면"
            className="full-card-image"
            onError={() => setBackImageFailed(true)}
            draggable="false"
          />
        ) : (
          <CardBackFallback classId={classId} compact={compact} isHand={isHand} />
        )}
      </motion.button>
    );
  }

  if (!card) return null;

  const rarityMeta = RARITY_META[card.rarity] || RARITY_META.common;
  const rarityFrame = RARITY_FRAME[card.rarity] || RARITY_FRAME.common;
  const rarityFx = RARITY_HOVER_FX[card.rarity] || RARITY_HOVER_FX.common;
  const typeTheme = TYPE_THEME[card.type] || TYPE_THEME.attack;
  const starLevel = getCardStarLevel(card);
  const starEffect = CARD_STAR_EFFECTS[starLevel] || CARD_STAR_EFFECTS[1];
  const enhancementStyle = {
    "--star-primary": starEffect.primary,
    "--star-secondary": starEffect.secondary,
    "--star-glow": starEffect.glow,
  };

  if (card.fullImage && !imageFailed) {
    return (
      <motion.button
        whileHover={{ y: disabled ? -4 : -18, scale: disabled ? 1.015 : isHand ? 1.16 + starLevel * 0.006 : 1.075 + starLevel * 0.006, zIndex: 60 }}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onHoverStart={() => {
          setIsHovering(true);
          onInspect?.(cardId);
        }}
        onHoverEnd={() => {
          setIsHovering(false);
          onInspectEnd?.(cardId);
        }}
        onFocus={() => onInspect?.(cardId)}
        onBlur={() => onInspectEnd?.(cardId)}
        onClick={(event) => {
          if (disabled) return;
          onClick?.(event);
        }}
        aria-disabled={disabled}
        className={`game-card image-card rarity-${card.rarity} card-star-${starLevel} ${isHand ? "is-hand-card" : ""} ${compact ? "is-compact-card" : ""} ${cardHeight} ${cardWidth} ${disabled ? "card-disabled" : ""} ${isHovering ? "is-hovering" : ""}`}
        style={enhancementStyle}
      >
        <CardEnhancementLayers level={starLevel} active={isHovering || isHand} compact={compact} />
        <img
          src={card.fullImage}
          alt={card.name}
          className="full-card-image"
          onError={() => setImageFailed(true)}
          draggable="false"
        />
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ y: disabled ? -4 : -18, scale: disabled ? 1.015 : isHand ? 1.16 + starLevel * 0.006 : 1.075 + starLevel * 0.006, zIndex: 60 }}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onHoverStart={() => {
        setIsHovering(true);
        onInspect?.(cardId);
      }}
      onHoverEnd={() => {
        setIsHovering(false);
        onInspectEnd?.(cardId);
      }}
      onFocus={() => onInspect?.(cardId)}
      onBlur={() => onInspectEnd?.(cardId)}
      onClick={(event) => {
        if (disabled) return;
        onClick?.(event);
      }}
      aria-disabled={disabled}
      className={`game-card-enhanced card-star-${starLevel} ${isHand ? "is-hand-card" : ""} ${compact ? "is-compact-card" : ""} relative isolate flex ${cardHeight} ${cardWidth} flex-col overflow-hidden rounded-[18px] border-2 p-3 text-left shadow-[0_14px_30px_rgba(15,23,42,0.28)] transition ${
        disabled ? "cursor-not-allowed opacity-60 grayscale-[0.25]" : "cursor-pointer"
      }`}
      style={{
        ...enhancementStyle,
        borderColor: rarityFrame.border,
        background: rarityFrame.surface,
        boxShadow: isHovering
          ? `0 18px 36px rgba(15,23,42,0.36), 0 0 32px ${rarityFx.glow}, inset 0 0 16px ${rarityFrame.glow}`
          : `0 14px 30px rgba(15,23,42,0.26), inset 0 0 12px ${rarityFrame.glow}`,
        transformStyle: "preserve-3d",
      }}
    >
      <CardEnhancementLayers level={starLevel} active={isHovering || isHand} compact={compact} />
      <div className="pointer-events-none absolute inset-1 rounded-[14px] border" style={{ borderColor: rarityFrame.inner }} />
      <div className="pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 rounded-sm border-t-2 border-l-2" style={{ borderColor: rarityFrame.border }} />
      <div className="pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 rounded-sm border-t-2 border-r-2" style={{ borderColor: rarityFrame.border }} />
      <div className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 rounded-sm border-b-2 border-l-2" style={{ borderColor: rarityFrame.border }} />
      <div className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2" style={{ borderColor: rarityFrame.border }} />
      <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "linear-gradient(125deg, rgba(255,255,255,0.62), transparent 28%, rgba(255,255,255,0.36) 58%, transparent 72%)" }} />
      {card.rarity === "legendary" && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2"
          animate={{ x: isHovering ? ["0%", "320%"] : "0%" }}
          transition={{ duration: 1.55, repeat: isHovering ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
          style={{ background: rarityFx.sheen }}
        />
      )}
      <motion.div
        className="pointer-events-none absolute -inset-6 rounded-[28px] blur-2xl"
        animate={isHovering ? { opacity: [0.08, 0.34, 0.18], scale: [0.92, 1.08, 1] } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 1.4, repeat: isHovering ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }}
        style={{ background: `radial-gradient(circle, ${rarityFx.wave} 0%, rgba(255,255,255,0) 70%)` }}
      />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-full border-2 bg-white font-black text-slate-950 shadow-md" style={{ borderColor: rarityFrame.border }}>
          {card.cost}
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-black shadow-sm ${rarityMeta.className}`}>{rarityMeta.label}</span>
      </div>

      <div className="relative z-10 mt-2">
        <CardIllustration card={card} rarityFrame={rarityFrame} typeTheme={typeTheme} />
      </div>

      <div className="relative z-10 mt-2 flex justify-center">
        <div className="flex items-center gap-1 rounded-full border bg-white/80 px-2 py-1 text-[11px] font-black text-slate-700 shadow-sm" style={{ borderColor: rarityFrame.inner }}>
          <CardTypeSigil type={card.type} stroke={typeTheme.sigilStroke} className="h-4 w-4" />
          {card.typeLabel}
        </div>
      </div>

      <div className="relative z-10 mt-2 text-center text-base font-black leading-tight text-slate-950">{card.name}</div>

      <div className="relative z-10 mt-2 flex min-h-[58px] flex-1 items-center rounded-xl border bg-white/72 px-3 py-2 text-center text-[12px] font-semibold leading-relaxed text-slate-700 shadow-inner" style={{ borderColor: rarityFrame.inner }}>
        <span
          className="w-full overflow-hidden"
          style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
        >
          {card.description}
        </span>
      </div>

      <div className="relative z-10 mt-2 flex items-center justify-center gap-1 text-[10px] font-black uppercase text-slate-500">
        <span className="h-px flex-1 bg-slate-400/40" />
        <span>{card.rarity}</span>
        <span className="h-px flex-1 bg-slate-400/40" />
      </div>
    </motion.button>
  );
}

function UsedCardOverlay({ animation }) {
  if (!animation) return null;
  const card = CARD_POOL[animation.cardId];
  const starLevel = getCardStarLevel(card);
  const starEffect = CARD_STAR_EFFECTS[starLevel] || CARD_STAR_EFFECTS[1];

  return (
    <motion.div
      className={`pointer-events-none fixed z-[120] used-card-star-${starLevel}`}
      style={{
        left: animation.left,
        top: animation.top,
        width: animation.width,
        height: animation.height,
        transformOrigin: "50% 50%",
        "--star-primary": starEffect.primary,
        "--star-secondary": starEffect.secondary,
        "--star-glow": starEffect.glow,
      }}
      initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, filter: "brightness(1)" }}
      animate={{
        x: animation.path.x,
        y: animation.path.y,
        scale: [1, 1.28, 0.24],
        rotate: [0, -7, 18],
        opacity: [1, 1, 0.15],
        filter: ["brightness(1)", "brightness(1.25)", "brightness(0.9)"],
      }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.92,
        times: [0, 0.38, 1],
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="relative">
        {starLevel >= 2 && <div className="used-card-enhancement-trail" />}
        {starLevel >= 5 && <div className="used-card-legend-flash" />}
        <motion.div
          className="absolute -inset-5 rounded-[30px] blur-xl"
          animate={{ opacity: [0.25, 0.85, 0.1], scale: [0.9, 1.12, 0.8] }}
          transition={{ duration: 0.92, times: [0, 0.35, 1], ease: "easeOut" }}
          style={{
            background: `radial-gradient(circle, ${starLevel >= 2 ? starEffect.glow : (RARITY_HOVER_FX[card?.rarity] || RARITY_HOVER_FX.common).glow} 0%, rgba(255,255,255,0) 72%)`,
          }}
        />
        <Card cardId={animation.cardId} variant="hand" disabled={false} classId={animation.classId} />
      </div>
    </motion.div>
  );
}

function MonsterImage({ monster, className = "monster-image", fallbackClassName = "monster-image-fallback" }) {
  const primarySrc = getMonsterImagePath(monster);
  const [mode, setMode] = useState(primarySrc ? "primary" : "fallback");
  const src = mode === "primary" ? primarySrc : mode === "default" ? DEFAULT_MONSTER_IMAGE : "";

  useEffect(() => {
    setMode(primarySrc ? "primary" : "fallback");
  }, [primarySrc]);

  if (!src) {
    return <span className={fallbackClassName}>{monster?.image || "?"}</span>;
  }

  return (
    <img
      src={src}
      alt={monster?.name || "몬스터"}
      className={className}
      draggable="false"
      onError={() => {
        setMode((current) => (current === "primary" && primarySrc !== DEFAULT_MONSTER_IMAGE ? "default" : "fallback"));
      }}
    />
  );
}

function EnemyAttackOverlay({ animation }) {
  if (!animation) return null;

  const width = animation.width || 92;
  const height = animation.height || 92;
  const startLeft = animation.startX - width / 2;
  const startTop = animation.startY - height / 2;

  return (
    <motion.div
      className="enemy-attack-overlay"
      style={{
        left: startLeft,
        top: startTop,
        width,
        height,
      }}
      initial={{ x: 0, y: 0, scale: 0.85, rotate: 0, opacity: 0, filter: "brightness(1)" }}
      animate={{
        x: [0, animation.midX - animation.startX, animation.endX - animation.startX],
        y: [0, animation.midY - animation.startY, animation.endY - animation.startY],
        scale: [0.85, 1.08, 0.72],
        rotate: [0, -9, 13],
        opacity: [0, 1, 0],
        filter: ["brightness(1)", "brightness(1.35)", "brightness(1.8)"],
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.62, times: [0, 0.36, 1], ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="enemy-attack-trail" />
      <MonsterImage monster={animation} />
    </motion.div>
  );
}

function PlayerHitOverlay({ effect }) {
  if (!effect) return null;

  return (
    <motion.div
      key={effect.key}
      className="player-hit-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.62, ease: "easeOut" }}
    >
      <motion.div
        className="player-hit-flash"
        animate={{ opacity: [0, 0.8, 0], scale: [0.75, 1.1, 1.4] }}
        transition={{ duration: 0.38, ease: "easeOut" }}
      />
      <motion.div
        className="player-damage-number"
        initial={{ opacity: 0, y: 14, scale: 0.8 }}
        animate={{ opacity: [0, 1, 1, 0], y: [14, -10, -26, -40], scale: [0.8, 1.22, 1, 0.9] }}
        transition={{ duration: 0.72, ease: "easeOut" }}
      >
        -{effect.damage}
      </motion.div>
    </motion.div>
  );
}

function DiscardPileWidget({ drawCount, discardCount, pileRef, active, classId = "warrior" }) {
  const [backFailed, setBackFailed] = useState(false);
  const backImage = classCardBackImages[classId] || classCardBackImages.warrior;
  return (
    <motion.div
      ref={pileRef}
      animate={active ? { scale: [1, 1.08, 1], boxShadow: "0 0 36px rgba(34,211,238,0.32)" } : { scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="absolute bottom-4 right-4 z-40 rounded-2xl border border-cyan-200/30 bg-slate-950/85 p-3 text-xs font-black text-slate-100 shadow-2xl backdrop-blur"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12">
          {!backFailed ? (
            <>
              <img src={backImage} alt="드로우 더미" className="pile-card-back left-1 top-1 rotate-[-10deg]" onError={() => setBackFailed(true)} />
              <img src={backImage} alt="버린 더미" className="pile-card-back left-3 top-0 rotate-[6deg]" onError={() => setBackFailed(true)} />
            </>
          ) : (
            <>
              <div className="absolute left-1 top-1 h-10 w-8 rotate-[-10deg] rounded-md border border-white/30 bg-slate-700" />
              <div className="absolute left-3 top-0 h-10 w-8 rotate-[6deg] rounded-md border border-cyan-200/50 bg-slate-800" />
            </>
          )}
        </div>
        <div className="space-y-1">
          <div>덱: {drawCount}장</div>
          <div className="text-cyan-200">버림: {discardCount}장</div>
        </div>
      </div>
    </motion.div>
  );
}

function HitEffect({ effect }) {
  if (!effect) return null;

  const colorByType = {
    slash: "#f8fafc",
    fire: "#fb923c",
    arrow: "#bae6fd",
    poison: "#86efac",
    ice: "#bfdbfe",
    lightning: "#fde68a",
    magic: "#c4b5fd",
    impact: "#fecaca",
  };
  const starLevel = clampNumber(Number(effect.starLevel || 1), 1, 5);
  const starEffect = CARD_STAR_EFFECTS[starLevel] || CARD_STAR_EFFECTS[1];
  const color = starLevel >= 2 ? starEffect.primary : colorByType[effect.type] || colorByType.impact;

  return (
    <motion.div
      key={effect.key}
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.72, ease: "easeOut" }}
    >
      {starLevel >= 2 && (
        <motion.div
          className="absolute inset-[-18%] rounded-full"
          initial={{ opacity: 0, scale: 0.35, rotate: 0 }}
          animate={{ opacity: [0, 0.85, 0], scale: [0.35, 1.08 + starLevel * 0.08, 1.7], rotate: starLevel >= 5 ? 180 : 30 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{
            border: `2px solid ${starEffect.secondary}`,
            boxShadow: `0 0 ${12 + starLevel * 8}px ${starEffect.glow}, inset 0 0 ${8 + starLevel * 5}px ${starEffect.glow}`,
          }}
        />
      )}
      {starLevel >= 5 && (
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0, 1, 0], filter: ["blur(2px)", "blur(0px)", "blur(5px)"] }}
          transition={{ duration: 0.62, ease: "easeOut" }}
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.88), rgba(255,215,0,0.5) 24%, transparent 58%)",
          }}
        />
      )}
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundColor: ["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"] }}
        transition={{ duration: 0.28 }}
      />

      {effect.type === "slash" && (
        <>
          <motion.div
            className="absolute left-[-15%] top-[18%] h-2 w-[130%] rounded-full"
            initial={{ x: -80, y: 18, rotate: -24, opacity: 0 }}
            animate={{ x: 80, y: -18, rotate: -24, opacity: [0, 1, 0] }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 18px ${color}` }}
          />
          <motion.div
            className="absolute left-[-10%] top-[56%] h-1.5 w-[110%] rounded-full"
            initial={{ x: 70, y: -12, rotate: 21, opacity: 0 }}
            animate={{ x: -80, y: 12, rotate: 21, opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.42, ease: "easeOut", delay: 0.06 }}
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 14px ${color}` }}
          />
        </>
      )}

      {effect.type === "fire" && (
        <div className="absolute inset-0">
          {[...Array(9)].map((_, index) => (
            <motion.span
              key={index}
              className="absolute bottom-4 h-3 w-3 rounded-full"
              style={{ left: `${18 + index * 8}%`, backgroundColor: color, boxShadow: `0 0 16px ${color}` }}
              initial={{ opacity: 0, y: 22, scale: 0.45 }}
              animate={{ opacity: [0, 1, 0], y: [-4, -38 - (index % 3) * 14], scale: [0.45, 1.4, 0.2] }}
              transition={{ duration: 0.72, delay: index * 0.025, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      {effect.type === "arrow" && (
        <motion.div
          className="absolute left-[-30%] top-1/2 h-1.5 w-[85%] rounded-full"
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: 280, opacity: [0, 1, 0] }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          style={{ background: `linear-gradient(90deg, transparent, ${color} 35%, #ffffff 55%, transparent)`, boxShadow: `0 0 18px ${color}` }}
        />
      )}

      {effect.type === "ice" && (
        <motion.div
          className="absolute inset-2 rounded-2xl border-2"
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.75, 1.05, 1.18] }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          style={{ borderColor: color, boxShadow: `inset 0 0 18px ${color}, 0 0 22px ${color}` }}
        />
      )}

      {effect.type === "lightning" && (
        <motion.svg className="absolute inset-0 h-full w-full" viewBox="0 0 220 130" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.52 }}>
          <path d="M116 3L67 64H103L88 127L153 48H113L116 3Z" fill="rgba(255,255,255,0.35)" stroke={color} strokeWidth="7" strokeLinejoin="round" />
        </motion.svg>
      )}

      {(effect.type === "impact" || effect.type === "poison" || !["slash", "fire", "arrow", "ice", "lightning"].includes(effect.type)) && (
        <motion.div
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 0.85, 0], scale: [0.2, 1.2, 1.85] }}
          transition={{ duration: 0.58, ease: "easeOut" }}
          style={{ border: `3px solid ${color}`, boxShadow: `0 0 22px ${color}` }}
        />
      )}

      {effect.damage > 0 && (
        <motion.div
          className="absolute right-5 top-3 rounded-full bg-red-600 px-3 py-1 text-lg font-black text-white shadow-xl"
          initial={{ opacity: 0, y: 10, scale: 0.75 }}
          animate={{ opacity: [0, 1, 1, 0], y: [10, -12, -24, -34], scale: [0.75, 1.22, 1, 0.9] }}
          transition={{ duration: 0.82, ease: "easeOut" }}
        >
          -{effect.damage}
        </motion.div>
      )}
    </motion.div>
  );
}

function MonsterDeathEffect({ enemy }) {
  const fx = enemy?.deathFx || "smoke";
  const colors = {
    smoke: ["rgba(203,213,225,0.72)", "rgba(148,163,184,0.34)"],
    dissolve: ["rgba(134,239,172,0.72)", "rgba(45,212,191,0.28)"],
    light: ["rgba(253,224,71,0.78)", "rgba(125,211,252,0.36)"],
    collapse: ["rgba(251,191,36,0.88)", "rgba(248,113,113,0.4)"],
  };
  const [primary, secondary] = colors[fx] || colors.smoke;
  const particleCount = enemy?.boss ? 16 : 8;

  return (
    <motion.div
      className={`monster-death-fx death-${fx}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: [0, 1, 0], scale: [0.9, enemy?.boss ? 1.36 : 1.15, 1.62] }}
      transition={{ duration: ENEMY_DEATH_ANIMATION_MS / 1000, ease: "easeOut" }}
    >
      <motion.div
        className="monster-death-ring"
        animate={{ opacity: [0, 0.75, 0], scale: [0.55, 1.05, 1.55] }}
        transition={{ duration: ENEMY_DEATH_ANIMATION_MS / 1000, ease: "easeOut" }}
        style={{ borderColor: primary, boxShadow: `0 0 28px ${secondary}` }}
      />
      {Array.from({ length: particleCount }, (_, index) => {
        const angle = (Math.PI * 2 * index) / particleCount;
        const distance = enemy?.boss ? 92 + (index % 4) * 16 : 48 + (index % 3) * 10;
        return (
          <motion.span
            key={`${enemy?.deathKey || enemy?.id || enemy?.name}-${index}`}
            className="monster-death-particle"
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 1, 0],
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance + (fx === "collapse" ? 28 : -18),
              scale: [0.6, 1, 0.18],
            }}
            transition={{ duration: ENEMY_DEATH_ANIMATION_MS / 1000, ease: "easeOut", delay: index * 0.012 }}
            style={{ backgroundColor: index % 2 === 0 ? primary : secondary, boxShadow: `0 0 18px ${primary}` }}
          />
        );
      })}
    </motion.div>
  );
}

function RewardItem({ icon, title, detail, delay = 0, interactive = false, claimed = false, onClick }) {
  return (
    <motion.button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay, ease: "easeOut" }}
      whileHover={interactive ? { scale: 1.025 } : { scale: 1.01 }}
      className={`loot-reward-item ${interactive ? "is-interactive" : ""} ${claimed ? "is-claimed" : ""}`}
    >
      <span className="loot-reward-icon">{icon}</span>
      <span className="loot-reward-text">
        <strong>{title}</strong>
        {detail && <em>{detail}</em>}
      </span>
    </motion.button>
  );
}

function GoldRewardItem({ gold }) {
  if (!gold || gold <= 0) return null;
  return <RewardItem icon="🪙" title={`${gold} 골드`} detail="자동 획득" delay={0.1} />;
}

function ResourceRewardItem({ resource, index }) {
  if (!resource) return null;
  const amount = Number(resource.amount || 0);
  const label = amount > 1 ? `${resource.name} x${amount}` : resource.name;
  return <RewardItem icon={resource.icon || "💎"} title={label} detail="자동 획득" delay={0.2 + index * 0.05} />;
}

function CardChoiceRewardItem({ choices, claimedCardId, onOpen }) {
  if (!choices?.length) return null;
  const claimedCard = claimedCardId ? CARD_POOL[claimedCardId] : null;
  return (
    <RewardItem
      icon="🃏"
      title={claimedCard ? `선택 완료: ${claimedCard.name}` : "덱에 추가할 카드를 선택하세요"}
      detail={claimedCard ? "덱에 추가됨" : `${choices.length}장 중 1장 선택`}
      delay={0.3}
      interactive={!claimedCard}
      claimed={Boolean(claimedCard)}
      onClick={onOpen}
    />
  );
}

function BattleRewardModal({ reward, claimedCardId, onOpenCardChoice, onContinue, continueLabel = "계속" }) {
  if (!hasBattleReward(reward)) return null;
  const hasCardChoices = (reward.cardChoices || []).length > 0;
  const canContinue = !hasCardChoices || Boolean(claimedCardId);

  return (
    <motion.div className="loot-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        className="loot-panel"
        initial={{ opacity: 0, scale: 0.9, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="loot-ribbon">
          <span>전리품!</span>
        </div>
        <div className="loot-list">
          <GoldRewardItem gold={reward.gold} />
          {(reward.resources || []).map((resource, index) => (
            <ResourceRewardItem key={`${resource.id}-${index}`} resource={resource} index={index} />
          ))}
          <CardChoiceRewardItem choices={reward.cardChoices} claimedCardId={claimedCardId} onOpen={onOpenCardChoice} />
        </div>
        <button type="button" onClick={onContinue} disabled={!canContinue} className="loot-continue-button">
          {continueLabel}
        </button>
      </motion.section>
    </motion.div>
  );
}

function CardChoiceModal({ choices, classId, onSelect, onClose }) {
  if (!choices?.length) return null;

  return (
    <motion.div className="card-choice-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        className="card-choice-panel"
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        <div className="card-choice-head">
          <strong>카드 선택</strong>
          <span>덱에 추가할 카드 1장을 고르세요</span>
        </div>
        <div className="card-choice-grid">
          {choices.map((card) => (
            <div key={card.id} className="card-choice-card">
              <Card cardId={card.id} variant="deck" onInspect={() => {}} onClick={() => onSelect(card.id)} classId={classId} />
            </div>
          ))}
        </div>
        <button type="button" onClick={onClose} className="card-choice-cancel">
          돌아가기
        </button>
      </motion.section>
    </motion.div>
  );
}

function BattleEnemyCard({ entry, index, selected, hidden, defeated, hitEffect, disabled, onSelect }) {
  const intent = entry.actions[entry.actionIndex % entry.actions.length];
  const intentIcon = intent.type === "attack" ? <Sword size={18} /> : intent.type === "block" ? <Shield size={18} /> : <Zap size={18} />;
  const attackValue = intent.type === "attack" ? intent.value + entry.strength : entry.strength;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled || defeated}
      animate={
        hitEffect
          ? {
              x: [0, -8, 7, -4, 0],
              scale: [1, 1.05, 0.99, 1],
              filter: ["brightness(1)", "brightness(1.55)", "brightness(1)"],
            }
          : { x: 0, scale: selected ? 1.04 : 1, y: selected ? -10 : 0, filter: "brightness(1)" }
      }
      transition={{ duration: 0.38, ease: "easeOut" }}
      className={`voc-unit-card relative shrink-0 overflow-hidden text-left transition ${
        selected
          ? "is-selected"
          : ""
      } ${defeated ? "is-defeated" : ""}`}
    >
      <AnimatePresence>{hitEffect && <HitEffect effect={hitEffect} />}</AnimatePresence>
      {hidden ? (
        <div className="voc-card-back">
          <div className="voc-card-back-title">Unknown</div>
          <div className="voc-card-back-mark">?</div>
          <div className="voc-card-back-caption">분석 필요</div>
        </div>
      ) : (
        <div className="voc-card-face">
          <div className="voc-card-art">
            <MonsterImage monster={entry} className="voc-card-art-image" fallbackClassName="voc-card-fallback-icon" />
          </div>
          <div className="voc-card-name">{entry.name}</div>
          {entry.boss && <div className="voc-card-ribbon">BOSS</div>}
          {selected && <div className="voc-card-cursor" />}
          <div className="voc-card-intent">
            <span>{intentIcon}</span>
            <strong>{intent.text}</strong>
          </div>
          <div className="voc-stat-row">
            <span className="voc-stat-token attack">{attackValue}</span>
            <span className="voc-stat-token hp">{entry.hp}</span>
            <span className="voc-stat-token shield">{entry.block}</span>
          </div>
          <div className="voc-card-substats">
            <span>HP {entry.hp}/{entry.maxHp}</span>
            {entry.vulnerable > 0 && <span>취약 {entry.vulnerable}</span>}
            {entry.bleed > 0 && <span>출혈 {entry.bleed}</span>}
          </div>
        </div>
      )}
    </motion.button>
  );
}

function BattleAllyCard({ character, player, active, defeated, rageStacks, comboStacks }) {
  const status = character.id === player.classId ? player.vulnerable : 0;
  const supportLabel = character.id === "warrior" ? `분노 ${rageStacks}/3` : character.id === "mage" ? `연계 ${comboStacks}` : "회피";

  return (
    <motion.div
      animate={{ y: active ? -10 : 0, scale: active ? 1.035 : 1, opacity: defeated ? 0.38 : 1 }}
      className={`voc-unit-card voc-ally-card relative shrink-0 overflow-hidden text-slate-950 ${active ? "is-selected is-active" : ""} ${defeated ? "is-defeated" : ""}`}
    >
      <div className="voc-card-face">
        <div className="voc-card-art">
          <CharacterImage character={character} className="voc-card-art-image" fallbackClassName="!h-16 !w-16 !text-2xl" />
        </div>
        <div className="voc-card-name">{character.name}</div>
        {active && <div className="voc-card-ribbon">TURN</div>}
        <div className="voc-card-intent">
          <span>{active ? "행동 가능" : "지원 카드"}</span>
          <strong>{supportLabel}</strong>
        </div>
        <div className="voc-stat-row">
          <span className="voc-stat-token attack">{active ? player.attack : character.attack}</span>
          <span className="voc-stat-token hp">{active ? player.hp : character.hp}</span>
          <span className="voc-stat-token shield">{active ? player.block : character.defense}</span>
        </div>
        <div className="voc-card-substats">
          <span>{active ? `HP ${player.hp}/${player.maxHp}` : "대기"}</span>
          {status > 0 && <span>취약 {status}</span>}
        </div>
      </div>
    </motion.div>
  );
}

function ManaPanel({ current, max }) {
  return (
    <div className="rounded-2xl border border-sky-200/35 bg-sky-200/10 px-4 py-3 text-sky-50 shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-sky-200">
          <Sparkles size={16} /> Mana
        </div>
        <div className="text-2xl font-black">{current}/{max}</div>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: max }).map((_, index) => (
          <span
            key={index}
            className={`h-7 w-5 rounded-md border ${index < current ? "border-sky-100 bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.55)]" : "border-slate-500 bg-slate-800"}`}
          />
        ))}
      </div>
    </div>
  );
}

function CommandCardButton({ icon, label, active, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`voc-command-button flex min-h-[62px] items-center gap-3 rounded-2xl border px-4 py-3 text-left font-black shadow-lg transition disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? "border-amber-300 bg-amber-200 text-amber-950 shadow-[0_0_24px_rgba(251,191,36,0.22)]"
          : "border-white/10 bg-white/8 text-slate-100 hover:-translate-y-0.5 hover:border-cyan-200/45"
      }`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950/85 text-cyan-100">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function RewardFlipCard({ cardId, flipped, onFlip, onClaim, classId = "warrior" }) {
  const card = CARD_POOL[cardId];
  const rarityMeta = RARITY_META[card.rarity] || RARITY_META.common;
  const rarityFx = RARITY_HOVER_FX[card.rarity] || RARITY_HOVER_FX.common;
  const rarityFrame = RARITY_FRAME[card.rarity] || RARITY_FRAME.common;
  const flipMeta = FLIP_REVEAL_META[card.rarity] || FLIP_REVEAL_META.common;
  const totalFlipFxDuration = flipMeta.duration + flipMeta.linger;
  const [isHovering, setIsHovering] = useState(false);
  const isActiveFx = flipped && isHovering;
  const typeTheme = TYPE_THEME[card.type] || TYPE_THEME.attack;
  const isAttack = card.type === "attack";
  const flowForward = isAttack ? ["-18%", "185%"] : ["185%", "-18%"];
  const [rewardBackFailed, setRewardBackFailed] = useState(false);
  const [rewardFrontFailed, setRewardFrontFailed] = useState(false);
  const rewardBackImage = classCardBackImages[classId] || classCardBackImages.warrior;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileHover={!flipped ? { y: -8, scale: 1.02 } : { y: -6, scale: 1.055 }}
      whileTap={!flipped ? { scale: 0.97 } : {}}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      onClick={onFlip}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onFlip();
        }
      }}
      className="relative h-[260px] w-full cursor-pointer overflow-visible text-left"
      style={{ perspective: 1000, borderRadius: isAttack ? 14 : 18 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: flipMeta.duration, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 border-2 border-cyan-900/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-cyan-100 shadow-xl"
          style={{ backfaceVisibility: "hidden", borderRadius: isAttack ? 14 : 18 }}
        >
          {!rewardBackFailed ? (
            <img
              src={rewardBackImage}
              alt="보상 카드 뒷면"
              className="full-card-image reward-back-image"
              onError={() => setRewardBackFailed(true)}
              draggable="false"
            />
          ) : (
            <div className="flex h-full flex-col justify-between">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200/80">Reward</div>
              <div className="text-center">
                <div className="mb-3 text-5xl">?</div>
                <div className="text-lg font-black">Unknown Card</div>
                <div className="mt-2 text-sm text-cyan-100/70">Click to Reveal</div>
              </div>
              <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-center text-xs text-cyan-100/70">Battle Reward</div>
            </div>
          )}
        </div>

        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: isAttack ? 14 : 18 }}>
          <motion.div
            className="pointer-events-none absolute -inset-8 rounded-[28px] blur-2xl"
            animate={
              isActiveFx
                ? { opacity: [0, 0.45, 0.95], scale: [0.8, 1.06, 1.22] }
                : { opacity: 0, scale: 0.8 }
            }
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            style={{
              background: `radial-gradient(circle, ${rarityFx.wave} 0%, rgba(255,255,255,0) 72%)`,
            }}
          />

          <div className={`absolute inset-0 ${typeTheme.bg}`} style={{ borderRadius: isAttack ? 14 : 18 }} />

          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl border-2"
            animate={
              isActiveFx
                ? {
                    borderColor: rarityFx.edge,
                    boxShadow: [
                      `0 0 10px ${rarityFx.glow}, 0 0 25px rgba(255,255,255,0)`,
                      `0 0 10px ${rarityFx.glow}, 0 0 25px ${rarityFx.glow}, 0 0 50px ${rarityFx.wave}, inset 0 0 14px ${rarityFx.wave}`,
                    ],
                  }
                : { borderColor: "rgba(148, 163, 184, 0.45)", boxShadow: "0 0 0 rgba(0,0,0,0)" }
            }
            transition={{ duration: isAttack ? 0.4 : 0.75, ease: [0.22, 1, 0.36, 1], delay: 0 }}
          />

          <motion.div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
            animate={isActiveFx ? { opacity: [0, 0.4, 0.85] } : { opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <motion.div
              className="absolute inset-y-0 -left-1/3 w-1/2"
              animate={isActiveFx ? { x: flowForward } : { x: flowForward[0] }}
              transition={{ duration: isAttack ? 1.15 : 2.1, ease: "linear", repeat: isActiveFx ? Number.POSITIVE_INFINITY : 0 }}
              style={{ background: rarityFx.sheen }}
            />
          </motion.div>

          <motion.div
            className="pointer-events-none absolute inset-1 rounded-2xl blur-lg"
            animate={isActiveFx ? { opacity: [0, 0.35, 0.6] } : { opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{
              background: `radial-gradient(circle at 50% 48%, ${rarityFx.wave} 0%, rgba(255,255,255,0) 72%)`,
            }}
          />

          <AnimatePresence>
            {isActiveFx && (
              <motion.div
                key="rarity-particles"
                className="pointer-events-none absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
              >
                {[...Array(9)].map((_, index) => (
                  <motion.span
                    key={`rarity-hover-spark-${index}`}
                    initial={{ opacity: 0, y: 10, x: (index - 4) * 18, scale: 0.45 }}
                    animate={{
                      opacity: [0, 0.95, 0],
                      y: [10, -18 - (index % 4) * 7, -34 - (index % 4) * 7],
                      scale: [0.45, 1, 0.4],
                    }}
                    transition={{
                      duration: 1.15 + (index % 3) * 0.2,
                      ease: [0.22, 1, 0.36, 1],
                      repeat: Number.POSITIVE_INFINITY,
                      delay: 0.3 + index * 0.04,
                    }}
                    className="absolute left-1/2 top-[58%] h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: rarityFx.spark, boxShadow: `0 0 10px ${rarityFx.glow}` }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="pointer-events-none absolute inset-0 border-2"
            style={{ borderColor: rarityFrame.border, boxShadow: `0 0 14px ${rarityFrame.glow}, inset 0 0 10px ${rarityFrame.glow}` }}
          />
          <div className="pointer-events-none absolute inset-1 border" style={{ borderColor: rarityFrame.inner, borderRadius: isAttack ? 12 : 16 }} />
          <div className="pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 rounded-sm border-t-2 border-l-2" style={{ borderColor: rarityFrame.border }} />
          <div className="pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 rounded-sm border-t-2 border-r-2" style={{ borderColor: rarityFrame.border }} />
          <div className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 rounded-sm border-b-2 border-l-2" style={{ borderColor: rarityFrame.border }} />
          <div className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2" style={{ borderColor: rarityFrame.border }} />
          <CardFrameOrnament type={card.type} rarityFrame={rarityFrame} />
          <CardEnergyCore type={card.type} rarityFx={rarityFx} active={isActiveFx} />

          <div className="relative z-10 flex h-full min-h-[150px] w-full flex-col p-3 shadow-xl">
            {card.fullImage && !rewardFrontFailed ? (
              <div className="reward-front-image-wrap">
                <img
                  src={card.fullImage}
                  alt={card.name}
                  className="full-card-image"
                  onError={() => setRewardFrontFailed(true)}
                  draggable="false"
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClaim();
                  }}
                  className="reward-claim-button"
                >
                  획득
                </button>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-full border-2 bg-white font-black text-slate-950 shadow-md" style={{ borderColor: rarityFrame.border }}>
                    {card.cost}
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black shadow-sm ${rarityMeta.className}`}>{rarityMeta.label}</span>
                </div>
                <CardIllustration card={card} rarityFrame={rarityFrame} typeTheme={typeTheme} />
                <div className="mt-2 flex justify-center">
                  <div className="flex items-center gap-1 rounded-full border bg-white/80 px-2 py-1 text-[11px] font-black text-slate-700 shadow-sm" style={{ borderColor: rarityFrame.inner }}>
                    <CardTypeSigil type={card.type} stroke={typeTheme.sigilStroke} className="h-4 w-4" />
                    {card.typeLabel}
                  </div>
                </div>
                <div className="mt-2 text-center text-base font-black leading-tight text-slate-950">{card.name}</div>
                <div className="mt-2 rounded-xl border bg-white/75 px-3 py-2 text-center text-xs font-semibold leading-relaxed text-slate-700 shadow-inner" style={{ borderColor: rarityFrame.inner }}>
                  {card.description}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="text-[10px] font-black uppercase text-slate-500">{card.rarity}</div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onClaim();
                    }}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                  >
                    획득
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {flipped && (
          <motion.div
            key={`reward-flip-fx-${card.id}-${card.rarity}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0"
          >
            <motion.div
              initial={{ opacity: 0.06 }}
              animate={{ opacity: [0.06, 0.18, 0.34, 0.1] }}
              transition={{
                duration: totalFlipFxDuration,
                times: [0, 0.18, flipMeta.burstAt, 1],
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-2xl"
              style={{
                boxShadow: `inset 0 0 10px ${rarityFx.wave}, 0 0 16px ${rarityFx.glow}`,
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "brightness(1) blur(2px)" }}
              animate={{
                opacity: [0, 0.4, 1, 0],
                scale: [0.8, 1.05, 1.3, 1.6],
                filter: ["brightness(1) blur(2px)", "brightness(1.2) blur(4px)", "brightness(2) blur(10px)", "brightness(1) blur(0px)"],
              }}
              transition={{
                duration: totalFlipFxDuration,
                times: [0, flipMeta.peakAt - 0.18, flipMeta.peakAt, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-0 rounded-2xl"
              style={{ background: `radial-gradient(circle at 50% 45%, ${rarityFx.wave} 0%, rgba(255,255,255,0) 70%)` }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: [0, flipMeta.flash, 0], scale: [0.9, flipMeta.burstScale, 1.1] }}
              transition={{
                duration: totalFlipFxDuration,
                times: [flipMeta.burstAt - 0.08, flipMeta.burstAt, Math.min(0.99, flipMeta.burstAt + 0.12)],
                ease: "easeOut",
              }}
              className="absolute -inset-10 rounded-[30px] blur-2xl"
              style={{ background: `radial-gradient(circle, ${rarityFx.glow} 0%, rgba(255,255,255,0) 72%)` }}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.85, 0.2] }}
              transition={{
                duration: totalFlipFxDuration,
                times: [0, flipMeta.burstAt - 0.03, flipMeta.burstAt, 1],
                ease: "easeOut",
              }}
              className="absolute inset-0 rounded-2xl"
              style={{ background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 48%)` }}
            />

            {[...Array(flipMeta.burstCount)].map((_, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
                animate={{
                  opacity: [0, 0, 1, 0.2, 0],
                  x: [0, 0, (index - flipMeta.burstCount / 2) * 16, (index - flipMeta.burstCount / 2) * 24, (index - flipMeta.burstCount / 2) * 30],
                  y: [0, 0, -28 - (index % 4) * 10, -46 - (index % 4) * 12, -60 - (index % 4) * 14],
                  scale: [0.2, 0.2, 1, 0.6, 0.1],
                }}
                transition={{
                  duration: totalFlipFxDuration,
                  times: [0, flipMeta.burstAt - 0.02, flipMeta.burstAt, Math.min(0.99, flipMeta.burstAt + 0.14), 1],
                  ease: [0.22, 1, 0.36, 1],
                  delay: index * 0.006,
                }}
                className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_10px_2px_rgba(251,191,36,0.8)]"
                style={{ backgroundColor: rarityFx.spark, boxShadow: `0 0 12px ${rarityFx.glow}` }}
              />
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.45, 0.22] }}
              transition={{
                duration: totalFlipFxDuration,
                times: [flipMeta.burstAt, Math.min(0.99, flipMeta.burstAt + 0.18), 1],
                ease: "easeOut",
              }}
              className="absolute -inset-4 rounded-[22px] blur-lg"
              style={{ background: `radial-gradient(circle, ${rarityFx.wave} 0%, rgba(255,255,255,0) 72%)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!flipped && isHovering && (
          <motion.div
            key="reward-preflip-hover-fx"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.15, 0.45, 0.8], scale: [0.8, 1.06, 1.2] }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="absolute -inset-7 rounded-[28px] blur-2xl"
              style={{ background: `radial-gradient(circle, ${rarityFx.wave} 0%, rgba(255,255,255,0) 72%)` }}
            />
            <motion.div
              initial={{ borderColor: "rgba(148, 163, 184, 0.4)" }}
              animate={{
                borderColor: rarityFx.edge,
                boxShadow: [
                  `0 0 10px ${rarityFx.glow}, 0 0 25px rgba(255,255,255,0)`,
                  `0 0 10px ${rarityFx.glow}, 0 0 25px ${rarityFx.glow}, 0 0 50px ${rarityFx.wave}, inset 0 0 14px ${rarityFx.wave}`,
                ],
              }}
              transition={{ duration: isAttack ? 0.4 : 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 rounded-2xl border-2"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.4, 0.85] }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="absolute inset-0 overflow-hidden rounded-2xl"
            >
              <motion.div
                className="absolute inset-y-0 -left-1/3 w-1/2"
                animate={{ x: flowForward }}
                transition={{ duration: isAttack ? 1.15 : 2.1, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
                style={{ background: rarityFx.sheen }}
              />
            </motion.div>
            {[...Array(9)].map((_, index) => (
              <motion.span
                key={`preflip-hover-spark-${index}`}
                initial={{ opacity: 0, y: 10, x: (index - 4) * 18, scale: 0.45 }}
                animate={{
                  opacity: [0, 0.95, 0],
                  y: [10, -18 - (index % 4) * 7, -34 - (index % 4) * 7],
                  scale: [0.45, 1, 0.4],
                }}
                transition={{
                  duration: 1.15 + (index % 3) * 0.2,
                  ease: [0.22, 1, 0.36, 1],
                  repeat: Number.POSITIVE_INFINITY,
                  delay: 0.3 + index * 0.04,
                }}
                className="absolute left-1/2 top-[58%] h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: rarityFx.spark, boxShadow: `0 0 10px ${rarityFx.glow}` }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
function HpBar({ current, max }) {
  const width = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${width}%` }} />
    </div>
  );
}

function DungeonProgressPanel({ currentDepth, maxDepth, currentRoomType, isRoomCleared }) {
  const progress = Math.max(0, Math.min(100, (currentDepth / maxDepth) * 100));
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 text-slate-100 shadow-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Dungeon Run</div>
          <h2 className="mt-1 text-2xl font-black">던전 깊이 {currentDepth} / {maxDepth}</h2>
          <p className="mt-1 text-sm text-slate-300">현재 방: {getRoomTypeLabel(currentRoomType)}</p>
        </div>
        <span className={`rounded-2xl px-4 py-3 text-sm font-black ${isRoomCleared ? "bg-emerald-300 text-emerald-950" : "bg-white/10 text-slate-100"}`}>
          {isRoomCleared ? "방 클리어" : "진행 중"}
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} />
      </div>
      {currentRoomType === "bossBattle" && (
        <div className="mt-4 rounded-2xl border border-amber-200/25 bg-amber-200/10 p-4 text-sm font-bold text-amber-100">
          최종 보스방. 이 전투에서 승리하면 던전을 클리어합니다.
        </div>
      )}
    </section>
  );
}

function DiceRollDisplay({ title, roll, tone = "player" }) {
  const toneClass =
    tone === "enemy"
      ? "border-red-200 bg-red-50 text-red-950"
      : tone === "defense"
        ? "border-cyan-200 bg-cyan-50 text-cyan-950"
        : "border-amber-200 bg-amber-50 text-amber-950";
  const dice = roll?.dice || [];
  const double = isDoubleRoll(roll);

  return (
    <section className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black">{title}</h3>
        {double && <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-black text-white">더블!</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {dice.length > 0 ? (
          dice.map((value, index) => (
            <div
              key={`${title}-${index}-${value}`}
              className={`grid h-14 w-14 place-items-center rounded-2xl border-2 bg-white text-2xl font-black shadow-sm ${
                double ? "border-slate-950" : "border-white"
              }`}
            >
              {value}
            </div>
          ))
        ) : (
          <>
            <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 text-2xl font-black text-slate-400">-</div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 text-2xl font-black text-slate-400">-</div>
          </>
        )}
      </div>
      <div className="mt-3 text-sm font-black">합계 {roll?.total ?? "-"}</div>
    </section>
  );
}

function BattleHighlightPanel({ highlight }) {
  if (!highlight) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-100 shadow-xl">
        <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">최근 행동 결과</div>
        <p className="mt-2 text-sm text-slate-400">주사위를 굴리면 계산 결과가 여기에 표시됩니다.</p>
      </section>
    );
  }

  const toneClass = {
    attack: "border-amber-200/40 bg-amber-300/15 text-amber-50",
    defense: "border-cyan-200/40 bg-cyan-300/15 text-cyan-50",
    block: "border-cyan-200/40 bg-cyan-300/15 text-cyan-50",
    damage: "border-red-200/40 bg-red-400/15 text-red-50",
    critical: "border-fuchsia-200/40 bg-fuchsia-400/15 text-fuchsia-50",
    victory: "border-emerald-200/40 bg-emerald-400/15 text-emerald-50",
    defeat: "border-slate-300/30 bg-slate-950/70 text-slate-100",
  }[highlight.type] || "border-white/10 bg-white/5 text-slate-100";

  return (
    <section className={`rounded-3xl border p-5 shadow-xl ${toneClass}`}>
      <div className="text-sm font-black uppercase tracking-[0.18em] opacity-75">최근 행동 결과</div>
      <h2 className="mt-2 text-3xl font-black">{highlight.title}</h2>
      <p className="mt-2 text-base font-bold">{highlight.message}</p>
      {highlight.formula && <div className="mt-4 rounded-2xl bg-white/12 px-4 py-3 text-sm font-black">{highlight.formula}</div>}
    </section>
  );
}

function BattleLogPanel({ logs }) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <h2 className="text-xl font-black">전투 로그</h2>
      <div className="mt-3 max-h-[520px] space-y-2 overflow-auto pr-1">
        {logs.length > 0 ? (
          logs.map((entry) => (
            <article key={entry.id} className="rounded-2xl bg-white/10 p-3 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-white">{entry.turn ? `[${entry.turn}턴] ${entry.title}` : `[전투 종료] ${entry.title}`}</strong>
                {entry.isDouble && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black text-slate-950">더블!</span>}
              </div>
              {entry.dice?.length > 0 && <div className="mt-2">주사위: {entry.dice.join(" + ")} = {entry.diceTotal ?? entry.dice.reduce((sum, value) => sum + value, 0)}</div>}
              {entry.enemyDice?.length > 0 && <div className="mt-1">적 주사위: {entry.enemyDice.join(" + ")} = {entry.enemyDiceTotal}</div>}
              {entry.defenseDice?.length > 0 && <div className="mt-1">방어 주사위: {entry.defenseDice.join(" + ")} = {entry.defenseDiceTotal}</div>}
              {entry.formula && <div className="mt-1 text-slate-300">계산: {entry.formula}</div>}
              <div className="mt-1 font-bold">{entry.message}</div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl bg-white/10 p-4 text-sm text-slate-400">아직 전투 로그가 없습니다.</div>
        )}
      </div>
    </aside>
  );
}

function CharacterImage({ character, className = "character-image", fallbackClassName = "" }) {
  const [failed, setFailed] = useState(false);
  if (!character?.image || failed) {
    return <div className={`character-image-fallback ${fallbackClassName}`}>{character?.icon || "?"}</div>;
  }

  return (
    <img
      src={character.image}
      alt={character.name}
      className={className}
      onError={() => setFailed(true)}
      draggable="false"
    />
  );
}

function CardBackFallback({ classId = "warrior", compact = false, isHand = false }) {
  const character = CHARACTER_CLASSES[classId] || CHARACTER_CLASSES.warrior;
  return (
    <div className={`card-back-fallback ${compact ? "is-compact" : ""} ${isHand ? "is-hand" : ""}`}>
      <div className="card-back-fallback-sigil">{character.icon}</div>
      <div className="card-back-fallback-name">{character.name}</div>
    </div>
  );
}

function getClearedNodeIds(clearedNodesByFloor, floor) {
  return clearedNodesByFloor[floor] || [];
}

function isFloorUnlocked(unlockedFloors, floor) {
  return unlockedFloors.includes(floor);
}

function isNodeAvailable(node, floorNodes, clearedNodeIds, floorUnlocked, floorCleared) {
  if (!floorUnlocked || floorCleared || clearedNodeIds.includes(node.id)) return false;
  const unclearedRings = [...new Set(floorNodes.filter((entry) => !clearedNodeIds.includes(entry.id)).map((entry) => entry.ring))];
  const outermostOpenRing = Math.max(...unclearedRings);
  return node.ring === outermostOpenRing;
}

function getNextAvailableNode(floorNodes, clearedNodeIds, floorUnlocked, floorCleared) {
  return floorNodes.find((node) => isNodeAvailable(node, floorNodes, clearedNodeIds, floorUnlocked, floorCleared)) || null;
}

function getNodePosition(node, sameRingIndex, sameRingCount) {
  if (node.ring === 0) return { left: 50, top: 50 };
  const radiusByRing = { 1: 17, 2: 28, 3: 40 };
  const startAngleByRing = { 1: 90, 2: 210, 3: -90 };
  const angle = ((startAngleByRing[node.ring] || -90) + (360 / sameRingCount) * sameRingIndex) * (Math.PI / 180);
  const radius = radiusByRing[node.ring] || 35;
  return {
    left: 50 + Math.cos(angle) * radius,
    top: 50 + Math.sin(angle) * radius,
  };
}

function MaterialCostLine({ material, owned }) {
  const enough = owned >= material.amount;
  return (
    <div className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold ${enough ? "bg-emerald-500/10 text-emerald-100" : "bg-red-500/10 text-red-100"}`}>
      <span>{material.name || getMaterialDefinition(material.id).name}</span>
      <span>{owned} / {material.amount}</span>
    </div>
  );
}

function UpgradeOptionPanel({ option, player, onUpgrade }) {
  const resultCard = CARD_POOL[option.resultCardId];
  const available = canUpgradeCard(option, player);
  const issues = getUpgradeCostIssues(option, player);

  return (
    <article className={`rounded-2xl border p-4 ${available ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-white/5 opacity-70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-black text-white">{option.name}</h4>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{option.description}</p>
        </div>
        <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-black text-amber-200">강화</span>
      </div>
      {resultCard && (
        <div className="mt-3 rounded-xl bg-slate-950/55 p-3 text-sm text-slate-200">
          <div className="font-black text-cyan-100">{resultCard.name}</div>
          <div className="mt-1 text-slate-300">{resultCard.description || resultCard.desc}</div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-lg bg-yellow-200 px-2 py-1 text-yellow-950">{"★".repeat(getCardStarLevel(resultCard))} {getCardStarLevel(resultCard)}성</span>
            <span className="rounded-lg bg-amber-200 px-2 py-1 text-slate-950">비용 {resultCard.cost}</span>
            {resultCard.damage > 0 && <span className="rounded-lg bg-red-200 px-2 py-1 text-red-950">피해 {resultCard.damage}</span>}
            {resultCard.block > 0 && <span className="rounded-lg bg-blue-200 px-2 py-1 text-blue-950">방어 {resultCard.block}</span>}
            {resultCard.effect && <span className="rounded-lg bg-violet-200 px-2 py-1 text-violet-950">{resultCard.effect}</span>}
            {resultCard.maxTargets && <span className="rounded-lg bg-emerald-200 px-2 py-1 text-emerald-950">대상 {resultCard.maxTargets}</span>}
          </div>
        </div>
      )}
      <div className="mt-3 grid gap-2">
        {(option.cost.materials || []).map((material) => (
          <MaterialCostLine key={material.id} material={material} owned={player?.resources?.[material.id] || 0} />
        ))}
        {option.cost.gold > 0 && (
          <div className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold ${(player?.gold || 0) >= option.cost.gold ? "bg-amber-300/10 text-amber-100" : "bg-red-500/10 text-red-100"}`}>
            <span>골드</span>
            <span>{player?.gold || 0} / {option.cost.gold}</span>
          </div>
        )}
      </div>
      {issues.length > 0 && <div className="mt-2 text-xs font-bold text-red-200">{issues.join(" · ")}</div>}
      <button
        type="button"
        onClick={() => onUpgrade(option.id)}
        disabled={!available}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Hammer size={17} /> 선택 강화
      </button>
    </article>
  );
}

function UpgradeCelebrationOverlay({ celebration, classId }) {
  if (!celebration) return null;
  const card = CARD_POOL[celebration.cardId];
  const starLevel = getCardStarLevel(card);
  const effect = CARD_STAR_EFFECTS[starLevel] || CARD_STAR_EFFECTS[1];

  return (
    <motion.div
      className={`fixed inset-0 z-[140] grid place-items-center bg-slate-950/72 backdrop-blur-sm card-star-${starLevel}`}
      style={{ "--star-primary": effect.primary, "--star-secondary": effect.secondary, "--star-glow": effect.glow }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.1, times: [0, 0.16, 0.82, 1], ease: "easeOut" }}
    >
      <motion.div
        className="upgrade-success-burst"
        initial={{ opacity: 0, scale: 0.35, rotate: 0 }}
        animate={{ opacity: [0, 1, 0.75, 0], scale: [0.35, 1.1, 1.28, 1.6], rotate: starLevel >= 5 ? 240 : 70 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      <motion.div
        className="upgrade-success-card"
        initial={{ y: 34, scale: 0.78, opacity: 0, filter: "brightness(1)" }}
        animate={{ y: [34, -8, 0], scale: [0.78, 1.12, 1], opacity: [0, 1, 1], filter: ["brightness(1)", "brightness(1.9)", "brightness(1.15)"] }}
        transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card cardId={celebration.cardId} variant="deck" classId={classId} />
      </motion.div>
      <motion.div
        className="upgrade-success-text"
        initial={{ opacity: 0, y: 26, scale: 0.86 }}
        animate={{ opacity: [0, 1, 1, 0], y: [26, 0, 0, -18], scale: [0.86, 1.05, 1, 0.96] }}
        transition={{ duration: 2, times: [0, 0.24, 0.78, 1], ease: "easeOut" }}
      >
        <strong>강화 성공!</strong>
        <span>{card?.name} · {"★".repeat(starLevel)} {starLevel}성</span>
      </motion.div>
    </motion.div>
  );
}

function DeckManagementPanel({ deck, deckCount, inspectedCard, onInspectCard, classId, player, onDismantleCard, onUpgradeCard, upgradeCelebration }) {
  const selectedClass = CHARACTER_CLASSES[classId] || CHARACTER_CLASSES.warrior;
  const materialEntries = Object.entries(player?.resources || {})
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => ({ ...getMaterialDefinition(id), amount }));
  const selectedCardCount = inspectedCard ? deck.filter((id) => id === inspectedCard.id).length : 0;
  const selectedRewards = inspectedCard ? getDismantleRewards(inspectedCard) : [];
  const selectedCanDismantle = inspectedCard ? canDismantleCard(deck, inspectedCard.id, classId) : false;
  const upgradeOptions = inspectedCard?.upgradeOptions || [];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <AnimatePresence>
        {upgradeCelebration && <UpgradeCelebrationOverlay celebration={upgradeCelebration} classId={classId} />}
      </AnimatePresence>
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black">덱 관리</h2>
          <p className="text-sm text-slate-300">{selectedClass.name} 덱 {deck.length}장. 카드를 분해해 조각을 얻고, 보스 재료와 골드로 분기 강화합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-bold text-cyan-200">
          <span className="rounded-xl bg-white/10 px-3 py-2">골드 {player?.gold || 0}</span>
          <span className="rounded-xl bg-white/10 px-3 py-2">
            공격 {deckCount.filter((card) => card.type === "attack").reduce((sum, card) => sum + card.amount, 0)}장 / 방어·기술{" "}
            {deckCount.filter((card) => card.type !== "attack").reduce((sum, card) => sum + card.amount, 0)}장
          </span>
        </div>
      </div>
      <div className="mb-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
        <div className="mb-2 text-sm font-black text-amber-200">재료 인벤토리</div>
        {materialEntries.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {materialEntries.map((material) => (
              <span key={material.id} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-slate-100">
                {material.icon} {material.name} x{material.amount}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400">아직 보유한 강화 재료가 없습니다.</div>
        )}
      </div>
      <div className="mb-5 grid gap-4">
        {inspectedCard ? (
          <div>
            <CardDetailPanel card={inspectedCard} />
            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-red-100">카드 분해</div>
                  <div className="mt-1 text-xs text-slate-400">선택 카드 보유 {selectedCardCount}장</div>
                </div>
                <button
                  type="button"
                  onClick={() => onDismantleCard?.(inspectedCard.id)}
                  disabled={!selectedCanDismantle}
                  className="flex items-center gap-2 rounded-2xl bg-red-300 px-4 py-3 font-black text-red-950 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Trash2 size={17} /> 분해
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-200">
                {selectedRewards.map((reward) => (
                  <span key={reward.id} className="rounded-lg bg-white/10 px-2 py-1">
                    {reward.name} x{reward.amount}
                  </span>
                ))}
                {!selectedCanDismantle && <span className="rounded-lg bg-red-500/15 px-2 py-1 text-red-100">기본 카드 마지막 1장 또는 최소 덱은 분해 불가</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300 shadow-xl">
            선택한 카드 정보
          </div>
        )}
        <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 shadow-xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-cyan-200">
            <Hammer size={17} /> 강화 방향
          </div>
          {inspectedCard && upgradeOptions.length > 0 ? (
            <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-3">
              {upgradeOptions.map((option) => (
                <UpgradeOptionPanel key={option.id} option={option} player={player} onUpgrade={(optionId) => onUpgradeCard?.(inspectedCard.id, optionId)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 p-5 text-sm text-slate-400">
              {inspectedCard ? "이 카드는 이미 최종 강화 상태이거나 강화 옵션이 없습니다." : "카드를 선택하면 가능한 강화 방향이 표시됩니다."}
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-x-4 gap-y-7 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {deckCount.map((card) => (
          <div key={card.id} className="relative">
            <Card cardId={card.id} compact disabled={false} onInspect={onInspectCard} onClick={() => onInspectCard(card.id)} classId={classId} />
            <div className="absolute right-3 top-12 z-20 rounded-full bg-slate-950 px-2 py-1 text-xs font-black text-white shadow-lg">x{card.amount}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onInspectCard(card.id)}
                className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200"
              >
                강화
              </button>
              <button
                type="button"
                onClick={() => onDismantleCard?.(card.id)}
                disabled={!canDismantleCard(deck, card.id, classId)}
                className="rounded-xl bg-red-300 px-3 py-2 text-xs font-black text-red-950 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-45"
              >
                분해
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShopCardButton({ item, onBuy }) {
  const card = CARD_POOL[item.id];
  if (!card) return null;

  return (
    <motion.button
      type="button"
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onBuy(item)}
      className="group relative min-h-64 overflow-hidden rounded-2xl border border-amber-200/35 bg-white p-4 text-left text-slate-950 shadow-xl transition hover:border-amber-300 hover:shadow-[0_0_30px_rgba(251,191,36,0.22)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-cyan-50 opacity-95" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-black leading-tight">{card.name}</div>
            <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">{card.typeLabel || card.type}</div>
          </div>
          <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-black text-white">{card.rarity}</span>
        </div>
        <div className="my-4 h-px bg-slate-200" />
        <p className="min-h-16 text-sm font-semibold leading-relaxed text-slate-700">{card.description || card.desc}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="rounded-xl bg-amber-200 px-3 py-2 text-sm font-black text-amber-950">가격 {item.price}G</span>
          <span className="text-xs font-bold text-cyan-700 opacity-0 transition group-hover:opacity-100">클릭하여 구매</span>
        </div>
      </div>
    </motion.button>
  );
}

function ShopDeckCardButton({ entry, onSell }) {
  const value = Math.floor(getCardBaseValue(entry) * 0.5);
  return (
    <button
      type="button"
      onClick={() => onSell(entry.id)}
      className="rounded-2xl border border-white/10 bg-white p-4 text-left text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black">{entry.name}</div>
          <div className="mt-1 text-xs font-bold text-slate-500">{entry.typeLabel} / {entry.rarity}</div>
        </div>
        <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-black text-white">x{entry.amount}</span>
      </div>
      <p className="mt-3 min-h-10 text-sm text-slate-600">{entry.description || entry.desc}</p>
      <div className="mt-3 text-sm font-black text-amber-700">판매가 {value}G</div>
    </button>
  );
}

function ShopRoomPanel({ encounter, result, player, deck, onBuyCard, onSellCard, onHeal, onLeave, onUpgradeCard, onDismantleCard }) {
  const [view, setView] = useState("table");
  const [inspectedShopCardId, setInspectedShopCardId] = useState(null);
  const deckEntries = Object.entries(
    deck.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {}),
  ).map(([id, amount]) => ({ ...CARD_POOL[id], id, amount }));
  const inspectedShopCard = inspectedShopCardId ? CARD_POOL[inspectedShopCardId] : null;

  return (
    <motion.section
      key="shop-room"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 text-slate-100 shadow-2xl"
    >
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.18em] text-amber-200">상점 방</div>
          <h2 className="mt-1 text-3xl font-black">상인의 카드 테이블</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-200">
          <span className="rounded-xl bg-white/10 px-3 py-2">HP {player.hp}/{player.maxHp}</span>
          <span className="rounded-xl bg-white/10 px-3 py-2">골드 {player.gold}</span>
          <span className="rounded-xl bg-white/10 px-3 py-2">카드 {deck.length}장</span>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 text-slate-950">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">상황 설명</div>
        <p className="mt-2 text-base font-semibold leading-relaxed">{encounter.situation}</p>
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView((current) => (current === "deck" ? "table" : "deck"))}
          className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 hover:bg-cyan-200"
        >
          {view === "deck" ? "카드 테이블" : "덱 열기 / 카드 판매"}
        </button>
        <button
          type="button"
          onClick={() => setView((current) => (current === "upgrade" ? "table" : "upgrade"))}
          className="rounded-2xl bg-violet-300 px-4 py-3 font-black text-violet-950 hover:bg-violet-200"
        >
          카드 강화
        </button>
        <button type="button" onClick={onHeal} className="rounded-2xl bg-emerald-300 px-4 py-3 font-black text-emerald-950 hover:bg-emerald-200">
          체력 회복
        </button>
        <button type="button" onClick={onLeave} className="rounded-2xl bg-white px-4 py-3 font-black text-slate-950 hover:bg-cyan-100">
          상점 떠나기
        </button>
      </div>

      {view === "table" ? (
        <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-sm font-black text-amber-200">테이블 위 카드</div>
          {encounter.shopCards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {encounter.shopCards.map((item) => (
                <ShopCardButton key={item.stockId} item={item} onBuy={onBuyCard} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/10 p-5 text-sm text-slate-300">진열된 카드를 모두 구매했습니다.</div>
          )}
        </section>
      ) : view === "deck" ? (
        <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-sm font-black text-cyan-200">판매할 카드 선택</div>
          {deckEntries.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {deckEntries.map((entry) => (
                <ShopDeckCardButton key={entry.id} entry={entry} onSell={onSellCard} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/10 p-5 text-sm text-slate-300">판매할 카드가 없습니다.</div>
          )}
        </section>
      ) : (
        <div className="mt-4">
          <DeckManagementPanel
            deck={deck}
            deckCount={deckEntries}
            inspectedCard={inspectedShopCard}
            onInspectCard={setInspectedShopCardId}
            classId={player.classId}
            player={player}
            onDismantleCard={onDismantleCard}
            onUpgradeCard={onUpgradeCard}
            upgradeCelebration={null}
          />
        </div>
      )}

      <section className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <div className="mb-2 text-sm font-black text-amber-200">결과</div>
        {result ? (
          <div>
            <div className="text-lg font-black text-white">{result.summary}</div>
            <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
              {result.details.map((detail) => (
                <div key={detail} className="rounded-xl bg-white/5 px-3 py-2">{detail}</div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">카드를 클릭해 구매하거나 덱을 열어 판매할 수 있습니다.</p>
        )}
      </section>
    </motion.section>
  );
}

function RoomEncounterPanel({ encounter, result, player, deck, onChoose, onContinue, onShopBuyCard, onShopSellCard, onShopHeal, onShopLeave, onUpgradeCard, onDismantleCard }) {
  if (!encounter) return null;

  if (encounter.type === "shop") {
    return (
      <ShopRoomPanel
        encounter={encounter}
        result={result}
        player={player}
        deck={deck}
        onBuyCard={onShopBuyCard}
        onSellCard={onShopSellCard}
        onHeal={onShopHeal}
        onLeave={onShopLeave}
        onUpgradeCard={onUpgradeCard}
        onDismantleCard={onDismantleCard}
      />
    );
  }

  return (
    <motion.section
      key="room"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 text-slate-100 shadow-2xl"
    >
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">{ROOM_TYPE_META[encounter.type]?.label || encounter.title}</div>
          <h2 className="mt-1 text-3xl font-black">{encounter.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-200">
          <span className="rounded-xl bg-white/10 px-3 py-2">HP {player.hp}/{player.maxHp}</span>
          <span className="rounded-xl bg-white/10 px-3 py-2">골드 {player.gold}</span>
          <span className="rounded-xl bg-white/10 px-3 py-2">카드 {deck.length}장</span>
        </div>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl bg-white p-4 text-slate-950">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">상황 설명</div>
          <p className="mt-2 text-base font-semibold leading-relaxed">{encounter.situation}</p>
        </section>

        {encounter.type === "shop" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm font-black text-amber-200">상점 목록</div>
            <div className="grid gap-2 md:grid-cols-3">
              {encounter.shopCards.map((item) => {
                const card = CARD_POOL[item.id];
                return (
                  <div key={`${item.id}-${item.price}`} className="rounded-2xl bg-white/10 p-3">
                    <div className="font-black text-white">{card.name}</div>
                    <div className="mt-1 text-xs text-slate-300">{card.typeLabel} / {card.rarity}</div>
                    <div className="mt-2 text-sm font-black text-amber-200">{item.price} 골드</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-sm font-black text-cyan-200">선택지</div>
          <div className="grid gap-3 md:grid-cols-3">
            {encounter.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChoose(choice)}
                disabled={Boolean(result)}
                className="min-h-28 rounded-2xl border border-white/10 bg-white px-4 py-3 text-left text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <div className="text-base font-black">{choice.label}</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600">{choice.hint}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="mb-2 text-sm font-black text-amber-200">결과</div>
          {result ? (
            <div>
              <div className="text-lg font-black text-white">{result.summary}</div>
              <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                {result.details.map((detail) => (
                  <div key={detail} className="rounded-xl bg-white/5 px-3 py-2">{detail}</div>
                ))}
              </div>
              <button
                type="button"
                onClick={onContinue}
                className="mt-4 rounded-2xl bg-cyan-300 px-5 py-3 font-black text-slate-950 shadow-lg hover:bg-cyan-200"
              >
                다음 방으로 이동
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-400">선택하면 결과가 즉시 적용됩니다.</p>
          )}
        </section>
      </div>
    </motion.section>
  );
}

function TowerMapScreen({
  player,
  playerData,
  currentClassTheme,
  deck,
  selectedFloor,
  unlockedFloors,
  clearedFloors,
  currentFloor,
  onSelectFloor,
  onEnterFloor,
  onToggleDeck,
  onOpenTraits,
  onSave,
  onLoad,
  showDeckManager,
  onCharacterSelect,
  onRestart,
  deckCount,
  inspectedCard,
  onInspectCard,
  onDismantleCard,
  onUpgradeCard,
  upgradeCelebration,
}) {
  const highestUnlocked = Math.max(...unlockedFloors);
  const highestVisible = Math.min(TOTAL_FLOORS, Math.max(TOWER_PREVIEW_FLOORS, highestUnlocked + 2, selectedFloor + 1));
  const visibleFloors = Array.from({ length: highestVisible }, (_, index) => index + 1).slice(-TOWER_PREVIEW_FLOORS);
  const selectedUnlocked = isFloorUnlocked(unlockedFloors, selectedFloor);
  const selectedCleared = clearedFloors.includes(selectedFloor);
  const nextGoal = Math.min(TOTAL_FLOORS, clearedFloors.length + 1);

  return (
    <div className="tower-screen min-h-screen p-4 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="tower-header mb-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              <TowerControl size={18} /> Tower Dungeon
            </div>
            <h1 className="mt-1 text-4xl font-black">100층 고대탑</h1>
            <p className="mt-1 text-sm text-slate-300">
              현재 도전 층: 던전 {selectedFloor}층 / 현재 위치: {currentFloor}층 / 다음 목표: {nextGoal}층
            </p>
          </div>
          <div className="tower-stat-grid">
            <div>직업 <strong>{currentClassTheme.name}</strong></div>
            <div>체력 <strong>{player.hp}/{player.maxHp}</strong></div>
            <div>골드 <strong>{player.gold}</strong></div>
            <div>덱 <strong>{deck.length}장</strong></div>
            <div>특성 <strong>{normalizePlayerData(playerData).traitPoint}P</strong></div>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={onToggleDeck} className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 hover:bg-cyan-200">
            {showDeckManager ? "탑 보기" : "덱 관리"}
          </button>
          <button onClick={onCharacterSelect} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-black text-white hover:bg-white/15">
            직업 다시 선택
          </button>
          <button onClick={onOpenTraits} className="rounded-2xl bg-emerald-300 px-4 py-3 font-black text-emerald-950 hover:bg-emerald-200">
            특성 관리
          </button>
          <button onClick={onSave} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-black text-white hover:bg-white/15">
            저장
          </button>
          <button onClick={onLoad} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-black text-white hover:bg-white/15">
            불러오기
          </button>
          <button onClick={onRestart} className="rounded-2xl bg-white px-4 py-3 font-black text-slate-950 hover:bg-cyan-100">
            처음으로
          </button>
        </div>

        {showDeckManager ? (
          <DeckManagementPanel
            deck={deck}
            deckCount={deckCount}
            inspectedCard={inspectedCard}
            onInspectCard={onInspectCard}
            classId={player.classId}
            player={player}
            onDismantleCard={onDismantleCard}
            onUpgradeCard={onUpgradeCard}
            upgradeCelebration={upgradeCelebration}
          />
        ) : (
          <main className="tower-layout">
            <section className="tower-spine" aria-label="100층 탑 진행도">
              <div className="tower-spire-title">상층부로 상승</div>
              <div className="tower-floor-stack">
                {[...visibleFloors].reverse().map((floor) => {
                  const unlocked = isFloorUnlocked(unlockedFloors, floor);
                  const cleared = clearedFloors.includes(floor);
                  const selected = selectedFloor === floor;
                  return (
                    <motion.button
                      key={floor}
                      type="button"
                      whileHover={unlocked ? { x: 5, scale: 1.01 } : undefined}
                      whileTap={unlocked ? { scale: 0.98 } : undefined}
                      onClick={() => unlocked && onSelectFloor(floor)}
                      disabled={!unlocked}
                      className={`tower-floor-node ${selected ? "is-selected" : ""} ${cleared ? "is-cleared" : ""} ${!unlocked ? "is-locked" : ""}`}
                    >
                      <span className="tower-floor-index">던전 {floor}층</span>
                      <span className="tower-floor-state">
                        {cleared ? <CheckCircle2 size={18} /> : unlocked ? <CircleDot size={18} /> : <Lock size={18} />}
                        {cleared ? "공략 완료" : unlocked ? "도전 가능" : "잠김"}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <div className="tower-base-label">하층부 1층</div>
            </section>

            <aside className="tower-detail-panel">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-amber-200">Selected Floor</div>
              <h2 className="mt-2 text-3xl font-black">던전 {selectedFloor}층</h2>
              <p className="mt-2 text-sm text-slate-300">
                바깥 원의 방을 정리한 뒤 안쪽 원으로 진입하고, 중앙 보스방을 공략하면 다음 층이 열립니다.
              </p>
              <div className="mt-5 grid gap-3 text-sm">
                <div className="tower-detail-stat">
                  <span>상태</span>
                  <strong>{selectedCleared ? "공략 완료" : selectedUnlocked ? "도전 가능" : "잠김"}</strong>
                </div>
                <div className="tower-detail-stat">
                  <span>탑 진행도</span>
                  <strong>{clearedFloors.length}/{TOTAL_FLOORS}층</strong>
                </div>
                <div className="tower-detail-stat">
                  <span>내부 구조</span>
                  <strong>전투 2 / 이벤트 1 / 상점 1 / 휴식 1 / 정예 1 / 보스 1</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={onEnterFloor}
                disabled={!selectedUnlocked || selectedCleared}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-4 text-lg font-black text-slate-950 shadow-lg hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <DoorOpen size={21} /> 층에 도전하기
              </button>
            </aside>
          </main>
        )}
      </div>
    </div>
  );
}

function TraitManagementScreen({ playerData, onUpgradeTrait, onBack, feedback, lastUpgradedTraitId }) {
  const normalizedData = normalizePlayerData(playerData);

  return (
    <div className="trait-screen min-h-screen p-4 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="trait-header mb-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-amber-200">
              <Sparkles size={18} /> Trait Management
            </div>
            <h1 className="mt-1 text-4xl font-black">특성 관리</h1>
            <p className="mt-1 text-sm text-slate-300">최초 보스 처치로 얻은 포인트를 공격, 수비, 자원 특성에 투자합니다.</p>
          </div>
          <div className="trait-header-actions">
            <div className="trait-point-pill">
              <Sparkles size={18} />
              보유 특성 포인트 <strong>{normalizedData.traitPoint}</strong>
            </div>
            <button type="button" onClick={onBack} className="rounded-2xl bg-white px-4 py-3 font-black text-slate-950 hover:bg-cyan-100">
              뒤로가기
            </button>
          </div>
        </header>

        {feedback && <div className={`trait-feedback ${feedback.includes("부족") || feedback.includes("최대") ? "is-error" : "is-success"}`}>{feedback}</div>}

        <main className="trait-category-grid">
          {TRAIT_CATEGORIES.map((category) => (
            <section key={category.id} className={`trait-category-panel ${category.className}`}>
              <div className="trait-category-head">
                <div>
                  <h2>{category.title}</h2>
                  <p>{category.subtitle}</p>
                </div>
              </div>

              <div className="trait-node-list">
                {TRAIT_DEFINITIONS.filter((trait) => trait.category === category.id).map((trait) => {
                  const Icon = trait.icon;
                  const level = getTraitLevel(normalizedData, trait.id);
                  const isMax = level >= trait.maxLevel;
                  const canUpgrade = normalizedData.traitPoint > 0 && !isMax;
                  const upgraded = lastUpgradedTraitId === trait.id;
                  const locked = level <= 0;

                  return (
                    <motion.article
                      key={trait.id}
                      animate={upgraded ? { scale: [1, 1.03, 1], boxShadow: ["0 0 0 rgba(255,255,255,0)", "0 0 34px rgba(250,204,21,0.45)", "0 0 0 rgba(255,255,255,0)"] } : undefined}
                      className={`trait-node ${locked ? "is-locked" : "is-active"} ${upgraded ? "is-upgraded" : ""}`}
                    >
                      <div className="trait-node-top">
                        <span className="trait-node-icon"><Icon size={22} /></span>
                        <div>
                          <h3>{trait.name}</h3>
                          <p>Lv {level} / {trait.maxLevel}</p>
                        </div>
                      </div>
                      <div className="trait-node-effect">
                        <span>현재 효과</span>
                        <strong>{getTraitEffectText(trait.id, level)}</strong>
                      </div>
                      <div className="trait-node-effect">
                        <span>다음 레벨</span>
                        <strong>{isMax ? "최대 레벨" : getTraitEffectText(trait.id, level + 1)}</strong>
                      </div>
                      <p className="trait-node-desc">{trait.perLevelText}</p>
                      <button
                        type="button"
                        onClick={() => onUpgradeTrait(trait.id)}
                        disabled={!canUpgrade}
                        className="trait-upgrade-button"
                      >
                        {isMax ? "MAX" : "강화"}
                      </button>
                    </motion.article>
                  );
                })}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

function FloorMapScreen({
  floor,
  player,
  playerData,
  currentClassTheme,
  deck,
  floorNodes,
  clearedNodeIds,
  floorUnlocked,
  floorCleared,
  onEnterNode,
  onBackToTower,
  onToggleDeck,
  onOpenTraits,
  onSave,
  onLoad,
  showDeckManager,
  deckCount,
  inspectedCard,
  onInspectCard,
  onDismantleCard,
  onUpgradeCard,
  upgradeCelebration,
}) {
  const nextNode = getNextAvailableNode(floorNodes, clearedNodeIds, floorUnlocked, floorCleared);

  return (
    <div className="floor-screen min-h-screen p-4 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="floor-header mb-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              <CircleDot size={18} /> Floor Dungeon
            </div>
            <h1 className="mt-1 text-4xl font-black">던전 {floor}층 내부</h1>
            <p className="mt-1 text-sm text-slate-300">
              {currentClassTheme.name} / HP {player.hp}/{player.maxHp} / 골드 {player.gold} / 덱 {deck.length}장 / 현재 목표: {nextNode ? `${nextNode.ringLabel} ${ROOM_TYPE_META[nextNode.type].label}` : "중앙 보스 공략 완료"}
              {" "} / 특성 포인트 {normalizePlayerData(playerData).traitPoint}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onToggleDeck} className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 hover:bg-cyan-200">
              {showDeckManager ? "층 내부 보기" : "덱 관리"}
            </button>
            <button onClick={onOpenTraits} className="rounded-2xl bg-emerald-300 px-4 py-3 font-black text-emerald-950 hover:bg-emerald-200">
              특성 관리
            </button>
            <button onClick={onSave} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-black text-white hover:bg-white/15">
              저장
            </button>
            <button onClick={onLoad} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-black text-white hover:bg-white/15">
              불러오기
            </button>
            <button onClick={onBackToTower} className="rounded-2xl bg-white px-4 py-3 font-black text-slate-950 hover:bg-cyan-100">
              탑으로 돌아가기
            </button>
          </div>
        </header>

        {showDeckManager ? (
          <DeckManagementPanel
            deck={deck}
            deckCount={deckCount}
            inspectedCard={inspectedCard}
            onInspectCard={onInspectCard}
            classId={player.classId}
            player={player}
            onDismantleCard={onDismantleCard}
            onUpgradeCard={onUpgradeCard}
            upgradeCelebration={upgradeCelebration}
          />
        ) : (
          <main className="floor-layout">
            <section className="floor-magic-circle" aria-label={`던전 ${floor}층 방 지도`}>
              <div className="rune-ring rune-ring-outer" />
              <div className="rune-ring rune-ring-middle" />
              <div className="rune-ring rune-ring-inner" />
              <div className="floor-axis horizontal" />
              <div className="floor-axis vertical" />
              {floorNodes.map((node) => {
                const sameRingNodes = floorNodes.filter((entry) => entry.ring === node.ring);
                const sameRingIndex = sameRingNodes.findIndex((entry) => entry.id === node.id);
                const position = getNodePosition(node, sameRingIndex, sameRingNodes.length);
                const cleared = clearedNodeIds.includes(node.id);
                const available = isNodeAvailable(node, floorNodes, clearedNodeIds, floorUnlocked, floorCleared);
                const locked = !cleared && !available;
                const meta = ROOM_TYPE_META[node.type] || ROOM_TYPE_META.normal;
                const Icon = meta.icon;
                return (
                  <motion.button
                    key={node.id}
                    type="button"
                    onClick={() => available && onEnterNode(node)}
                    disabled={!available}
                    className={`floor-room-node type-${node.type} ${available ? "is-available" : ""} ${cleared ? "is-cleared" : ""} ${locked ? "is-locked" : ""}`}
                    style={{ left: `${position.left}%`, top: `${position.top}%` }}
                    title={`${node.label} ${meta.label}`}
                  >
                    <span className="room-icon">{cleared ? <CheckCircle2 size={22} /> : <Icon size={node.type === "boss" ? 30 : 22} />}</span>
                    <span className="room-label">{node.type === "boss" ? "보스방" : meta.shortLabel}</span>
                    {available && <span className="player-marker">현재 위치</span>}
                  </motion.button>
                );
              })}
            </section>

            <aside className="floor-detail-panel">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-amber-200">Inner Route</div>
              <h2 className="mt-2 text-3xl font-black">바깥 원에서 중앙 보스방으로</h2>
              <p className="mt-2 text-sm text-slate-300">
                가장 바깥 원의 방부터 열립니다. 같은 원의 방을 모두 클리어하면 다음 안쪽 원이 밝아집니다.
              </p>
              <div className="mt-5 space-y-3">
                {[3, 2, 1, 0].map((ring) => {
                  const ringNodes = floorNodes.filter((node) => node.ring === ring);
                  const done = ringNodes.filter((node) => clearedNodeIds.includes(node.id)).length;
                  const ringName = ring === 3 ? "외곽 원" : ring === 2 ? "중간 원" : ring === 1 ? "안쪽 원" : "중앙 원";
                  return (
                    <div key={ring} className="floor-ring-progress">
                      <span>{ringName}</span>
                      <strong>{done}/{ringNodes.length}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-300">
                {nextNode ? (
                  <>
                    다음 진입 가능 방: <strong className="text-white">{ROOM_TYPE_META[nextNode.type].label}</strong>
                    <div className="mt-1 text-xs text-slate-400">{getRoomPreview(nextNode)}</div>
                  </>
                ) : (
                  "이 층의 모든 방을 공략했습니다."
                )}
              </div>
            </aside>
          </main>
        )}
      </div>
    </div>
  );
}

export default function DeckbuilderRoguelikePrototype() {
  const [player, setPlayer] = useState(INITIAL_PLAYER);
  const [playerData, setPlayerData] = useState(() => createDefaultPlayerData());
  const [deck, setDeck] = useState([]);
  const [drawPile, setDrawPile] = useState([]);
  const [hand, setHand] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [exhaustPile, setExhaustPile] = useState([]);
  const [enemyIndex, setEnemyIndex] = useState(0);
  const [enemies, setEnemies] = useState(() => [createEnemy(0)]);
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState(0);
  const [turn, setTurn] = useState(1);
  const [phase, setPhase] = useState("title");
  const [highestClearedFloor, setHighestClearedFloor] = useState(0);
  const [highestUnlockedFloor, setHighestUnlockedFloor] = useState(1);
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [battlePhase, setBattlePhase] = useState("playerAttack");
  const [battleResult, setBattleResult] = useState(null);
  const [battleLogs, setBattleLogs] = useState([]);
  const [battleTurn, setBattleTurn] = useState(1);
  const [battleHighlight, setBattleHighlight] = useState(null);
  const [lastDiceResult, setLastDiceResult] = useState(null);
  const [lastDiceResults, setLastDiceResults] = useState({});
  const [lastPlayerAttackRoll, setLastPlayerAttackRoll] = useState(null);
  const [lastEnemyAttackRoll, setLastEnemyAttackRoll] = useState(null);
  const [lastPlayerDefenseRoll, setLastPlayerDefenseRoll] = useState(null);
  const [pendingEnemyAttack, setPendingEnemyAttack] = useState(null);
  const [isResolvingAction, setIsResolvingAction] = useState(false);
  const [battleRewardSummary, setBattleRewardSummary] = useState(null);
  const [playerDice, setPlayerDice] = useState(DEFAULT_PLAYER_DICE);
  const [nextBattleBuff, setNextBattleBuff] = useState({ attack: 0, defense: 0 });
  const [attemptedFloors, setAttemptedFloors] = useState([]);
  const [diceUpgradeMaterial, setDiceUpgradeMaterial] = useState(0);
  const [playerEquipment, setPlayerEquipment] = useState(DEFAULT_PLAYER_EQUIPMENT);
  const [ownedAccessories, setOwnedAccessories] = useState([]);
  const [difficultyMode, setDifficultyMode] = useState(null);
  const [diceShards, setDiceShards] = useState(0);
  const [diceShardUpgrades, setDiceShardUpgrades] = useState(DEFAULT_DICE_SHARD_UPGRADES);
  const [potions, setPotions] = useState(0);
  const [currentDepth, setCurrentDepth] = useState(1);
  const [maxDepth, setMaxDepth] = useState(DEFAULT_MAX_DUNGEON_DEPTH);
  const [currentRoomType, setCurrentRoomType] = useState(() => getRoomTypeByDepth(1, DEFAULT_MAX_DUNGEON_DEPTH));
  const [isRoomCleared, setIsRoomCleared] = useState(false);
  const [runCompleted, setRunCompleted] = useState(false);
  const [hasRestedInThisRoom, setHasRestedInThisRoom] = useState(false);
  const [selectedShopCardId, setSelectedShopCardId] = useState(null);
  const [selectedUpgradeCardId, setSelectedUpgradeCardId] = useState(null);
  const [log, setLog] = useState(["캐릭터를 선택하면 첫 전투가 시작됩니다."]);
  const [rewards, setRewards] = useState([]);
  const [flippedRewards, setFlippedRewards] = useState([]);
  const [battleReward, setBattleReward] = useState(null);
  const [cardChoiceOpen, setCardChoiceOpen] = useState(false);
  const [claimedRewardCardId, setClaimedRewardCardId] = useState(null);
  const [roomEncounter, setRoomEncounter] = useState(null);
  const [roomResult, setRoomResult] = useState(null);
  const [relics, setRelics] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [unlockedFloors, setUnlockedFloors] = useState([1]);
  const [clearedFloors, setClearedFloors] = useState([]);
  const [clearedNodesByFloor, setClearedNodesByFloor] = useState({});
  const [hoveredCharacterId, setHoveredCharacterId] = useState(null);
  const [speedGauge, setSpeedGauge] = useState({ player: 0, enemies: [] });
  const [rageStacks, setRageStacks] = useState(0);
  const [comboStacks, setComboStacks] = useState(0);
  const [showDeckManager, setShowDeckManager] = useState(false);
  const [inspectedCardId, setInspectedCardId] = useState(null);
  const [hoveredCombatCardId, setHoveredCombatCardId] = useState(null);
  const [selectedCommand, setSelectedCommand] = useState("attack");
  const [isCardAnimating, setIsCardAnimating] = useState(false);
  const [activeCardAnimation, setActiveCardAnimation] = useState(null);
  const [enemyAttackAnimation, setEnemyAttackAnimation] = useState(null);
  const [playerHitEffect, setPlayerHitEffect] = useState(null);
  const [hitEffects, setHitEffects] = useState({});
  const [initiativeReady, setInitiativeReady] = useState(false);
  const [currentActor, setCurrentActor] = useState({ type: "player" });
  const [traitReturnPhase, setTraitReturnPhase] = useState("towerMap");
  const [traitFeedback, setTraitFeedback] = useState("");
  const [lastUpgradedTraitId, setLastUpgradedTraitId] = useState(null);
  const [upgradeCelebration, setUpgradeCelebration] = useState(null);
  const [hasSavedRun, setHasSavedRun] = useState(() => loadRunData().hasActiveRun);
  const discardPileRef = useRef(null);
  const playerTargetRef = useRef(null);
  const enemyActorRefs = useRef([]);
  const saveReadyRef = useRef(false);
  const resolvingActionRef = useRef(false);

  const liveEnemyIndex = getFirstAliveEnemyIndex(enemies);
  const safeSelectedEnemyIndex =
    isEnemyTargetable(enemies[selectedEnemyIndex]) ? selectedEnemyIndex : liveEnemyIndex;
  const enemy = enemies[safeSelectedEnemyIndex] || enemies[0] || createEnemy(0);
  const aliveEnemies = enemies.filter((entry) => isEnemyAlive(entry));
  const enemySpeed = Math.max(1, ...aliveEnemies.map((entry) => entry.speed || 1));
  const enemyIntent = enemy.actions[enemy.actionIndex % enemy.actions.length];
  const activeCharacter = CHARACTER_CLASSES[hoveredCharacterId || selectedCharacterId || "warrior"];
  const speedPreview = buildTurnPreview(activeCharacter.speed, createEnemy(0).speed);
  const currentClassTheme = CHARACTER_CLASSES[player.classId || selectedCharacterId || "warrior"];
  const inspectedCard = inspectedCardId ? CARD_POOL[inspectedCardId] : null;
  const hoveredCombatCard = hoveredCombatCardId ? CARD_POOL[hoveredCombatCardId] : null;
  const currentFloorNodes = getFloorNodes(currentFloor);
  const currentClearedNodeIds = getClearedNodeIds(clearedNodesByFloor, currentFloor);
  const currentFloorUnlocked = isFloorUnlocked(unlockedFloors, currentFloor);
  const currentFloorCleared = clearedFloors.includes(currentFloor);

  useEffect(() => {
    const savedPermanentData = loadPermanentData();
    const savedRunData = loadRunData();
    setPlayerData(savedPermanentData);
    if (savedRunData.hasActiveRun && savedRunData.towerGameVersion === TOWER_DICE_GAME_VERSION) {
      restoreRunData(savedRunData, savedPermanentData, "저장된 진행상황을 불러왔습니다.");
    } else {
      if (savedRunData.hasActiveRun) clearRunData();
    }
    setHasSavedRun(Boolean(savedRunData.hasActiveRun && savedRunData.towerGameVersion === TOWER_DICE_GAME_VERSION));
    window.setTimeout(() => {
      saveReadyRef.current = true;
    }, 0);
  }, []);

  useEffect(() => {
    if (!saveReadyRef.current) return;
    savePermanentData(playerData);
    const runData = buildRunData();
    if (runData.hasActiveRun) {
      saveRunData(runData);
      setHasSavedRun(true);
    } else if (phase === "defeat" || phase === "gameOver" || phase === "victory") {
      clearRunData();
      setHasSavedRun(false);
    }
  }, [
    player,
    playerData,
    deck,
    drawPile,
    hand,
    discardPile,
    exhaustPile,
    enemyIndex,
    enemies,
    selectedEnemyIndex,
    turn,
    phase,
    highestClearedFloor,
    highestUnlockedFloor,
    currentEnemy,
    battlePhase,
    battleResult,
    battleLogs,
    battleTurn,
    battleHighlight,
    lastDiceResult,
    lastDiceResults,
    lastPlayerAttackRoll,
    lastEnemyAttackRoll,
    lastPlayerDefenseRoll,
    pendingEnemyAttack,
    isResolvingAction,
    battleRewardSummary,
    playerDice,
    nextBattleBuff,
    attemptedFloors,
    diceUpgradeMaterial,
    playerEquipment,
    ownedAccessories,
    difficultyMode,
    diceShards,
    diceShardUpgrades,
    potions,
    currentDepth,
    maxDepth,
    currentRoomType,
    isRoomCleared,
    runCompleted,
    hasRestedInThisRoom,
    selectedShopCardId,
    selectedUpgradeCardId,
    log,
    rewards,
    flippedRewards,
    battleReward,
    cardChoiceOpen,
    claimedRewardCardId,
    roomEncounter,
    roomResult,
    relics,
    selectedCharacterId,
    selectedStage,
    selectedFloor,
    currentFloor,
    unlockedFloors,
    clearedFloors,
    clearedNodesByFloor,
    speedGauge,
    rageStacks,
    comboStacks,
    traitReturnPhase,
  ]);

  useEffect(() => {
    if (phase !== "battle" || currentEnemy || initiativeReady || enemies.length === 0 || player.hp <= 0) return;

    const firstActor = nextActorFromCombatGauge(normalizeSpeedGauge(speedGauge, enemies), player.speed, enemies);
    if (firstActor.actor.type === "player") {
      setSpeedGauge(firstActor.gauge);
      setCurrentActor({ type: "player" });
      setInitiativeReady(true);
      pushLog(`${currentClassTheme.name}이 먼저 행동합니다.`);
      return;
    }

    setCurrentActor(firstActor.actor);
    setInitiativeReady(true);
    window.setTimeout(() => {
      enemyTurn({ opening: true, preserveHand: true, startingGauge: speedGauge });
    }, 160);
  }, [phase, initiativeReady]);

  function setEnemy(nextEnemyOrUpdater) {
    setEnemies((prev) => {
      const targetIndex = prev[selectedEnemyIndex] ? selectedEnemyIndex : getFirstAliveEnemyIndex(prev);
      const currentEnemy = prev[targetIndex] || createEnemy(0);
      const nextEnemy =
        typeof nextEnemyOrUpdater === "function" ? nextEnemyOrUpdater(currentEnemy) : nextEnemyOrUpdater;
      const next = [...prev];
      next[targetIndex] = nextEnemy;
      return next;
    });
  }

  function pushLog(text) {
    setLog((prev) => [text, ...prev].slice(0, 6));
  }

  function getUpgradeMaterial(playerState = player) {
    return playerState.resources?.[UPGRADE_MATERIAL_ID] || 0;
  }

  function getCurrentEquipmentBonuses() {
    return getEquipmentBonuses(playerEquipment);
  }

  function getFinalMaxHp() {
    const bonuses = getCurrentEquipmentBonuses();
    return Math.max(1, Number(player.maxHp || player.baseMaxHp || 100) + bonuses.maxHpBonus);
  }

  function getEffectivePlayerDice() {
    const bonuses = getCurrentEquipmentBonuses();
    const sides = Math.max(1, Number(playerDice.sides || 6) + bonuses.diceMaxBonus);
    const min = Math.min(sides, Math.max(1, Number(playerDice.min || 1) + bonuses.diceMinBonus));
    return {
      count: Math.max(1, Number(playerDice.count || 2)),
      sides,
      min,
      totalBonus: bonuses.diceTotalBonus,
    };
  }

  function getAdjustedDiceTotal(roll) {
    return Math.max(0, Number(roll?.total || 0) + getCurrentEquipmentBonuses().diceTotalBonus);
  }

  function getDiceFormulaTotalText(roll) {
    const totalBonus = getCurrentEquipmentBonuses().diceTotalBonus;
    if (!totalBonus) return `${roll.total}`;
    return `${roll.total} + 장신구 ${totalBonus} = ${roll.total + totalBonus}`;
  }

  function setUpgradeMaterialAmount(amount) {
    setPlayer((current) => ({
      ...current,
      resources: {
        ...(current.resources || {}),
        [UPGRADE_MATERIAL_ID]: Math.max(0, amount),
      },
    }));
  }

  function initializePlayerIfNeeded() {
    if (player.classId) return;
    setPlayer(createTowerBasePlayer({ difficultyMode: difficultyMode || "hardcore", diceShardUpgrades }));
    setPlayerEquipment(DEFAULT_PLAYER_EQUIPMENT);
  }

  function startGame() {
    initializePlayerIfNeeded();
    setPhase("difficultySelect");
  }

  function selectDifficulty(mode) {
    initializePlayerIfNeeded();
    setDifficultyMode(mode);
    startNewClimb(mode);
    setHasSavedRun(true);
  }

  function startNewClimb(mode = difficultyMode || "hardcore") {
    const basePlayer = createTowerBasePlayer({ difficultyMode: mode, diceShardUpgrades });
    setCurrentFloor(1);
    setSelectedFloor(1);
    setHighestClearedFloor(0);
    setHighestUnlockedFloor(1);
    setUnlockedFloors([1]);
    setAttemptedFloors([]);
    setClearedFloors([]);
    setClearedNodesByFloor({});
    setCurrentEnemy(null);
    setBattlePhase("playerAttack");
    setBattleResult(null);
    setBattleLogs([]);
    setBattleTurn(1);
    setBattleHighlight(null);
    setLastDiceResult(null);
    setLastDiceResults({});
    setLastPlayerAttackRoll(null);
    setLastEnemyAttackRoll(null);
    setLastPlayerDefenseRoll(null);
    setPendingEnemyAttack(null);
    setBattleRewardSummary(null);
    setNextBattleBuff({ attack: 0, defense: 0 });
    setIsResolvingAction(false);
    resolvingActionRef.current = false;
    setPlayer(basePlayer);
    setPlayerDice(DEFAULT_PLAYER_DICE);
    setDiceUpgradeMaterial(0);
    setPlayerEquipment(DEFAULT_PLAYER_EQUIPMENT);
    setOwnedAccessories([]);
    setPotions(0);
    setPhase("tower");
    setHasSavedRun(true);
  }

  function returnToTitle() {
    initializePlayerIfNeeded();
    setPhase("title");
  }

  function goToTower() {
    setCurrentEnemy(null);
    setBattleResult(null);
    setBattleRewardSummary(null);
    setLastDiceResult(null);
    setBattlePhase("playerAttack");
    setPlayer((current) => ({
      ...current,
      hp: Math.min(getFinalMaxHp(), Math.max(1, current.hp || 1)),
    }));
    setPhase("tower");
  }

  function isTowerFloorUnlocked(floor) {
    return floor <= highestUnlockedFloor;
  }

  function canChallengeFloor(floor) {
    return isTowerFloorUnlocked(floor) && !attemptedFloors.includes(floor) && !clearedFloors.includes(floor);
  }

  function markFloorAttempted(floor) {
    setAttemptedFloors((current) => (current.includes(floor) ? current : [...current, floor]));
  }

  function markFloorCleared(floor) {
    setClearedFloors((current) => (current.includes(floor) ? current : [...current, floor]));
  }

  function addAccessoryIfNotOwned(accessoryId) {
    const accessory = getAccessoryById(accessoryId);
    if (!accessory) return null;
    setOwnedAccessories((current) => (current.some((item) => item.id === accessory.id) ? current : [...current, accessory]));
    return accessory;
  }

  function equipAccessory(accessoryId) {
    const accessory = ownedAccessories.find((item) => item.id === accessoryId);
    if (!accessory) return;
    setPlayerEquipment((current) => ({ ...current, accessory }));
  }

  function unequipAccessory() {
    setPlayerEquipment((current) => ({ ...current, accessory: null }));
  }

  function restartClimb() {
    startNewClimb(difficultyMode || "hardcore");
  }

  function buyDiceShardShopItem(itemId) {
    if (difficultyMode !== "roguelike") return;
    const item = diceShardShopItems.find((entry) => entry.id === itemId);
    const currentLevel = diceShardUpgrades[item?.stat] || 0;
    if (!item || diceShards < item.cost || currentLevel >= item.maxLevel) return;
    setDiceShards((current) => current - item.cost);
    setDiceShardUpgrades((current) => ({
      ...createDefaultDiceShardUpgrades(current),
      [item.stat]: currentLevel + 1,
    }));
    setPlayer((current) => {
      if (item.stat === "baseAttackLevel") {
        const nextAttack = Number(current.baseAttack || current.attack || 3) + 1;
        return { ...current, baseAttack: nextAttack, attack: nextAttack };
      }
      if (item.stat === "baseDefenseLevel") {
        const nextDefense = Number(current.baseDefense || current.defense || 2) + 1;
        return { ...current, baseDefense: nextDefense, defense: nextDefense };
      }
      const nextMaxHp = Number(current.maxHp || current.baseMaxHp || 100) + 10;
      return { ...current, baseMaxHp: nextMaxHp, maxHp: nextMaxHp, hp: Math.min(nextMaxHp, (current.hp || 0) + 10) };
    });
  }

  function usePotion() {
    if (potions <= 0 || player.hp >= getFinalMaxHp()) return;
    setPotions((current) => Math.max(0, current - 1));
    setPlayer((current) => ({ ...current, hp: Math.min(getFinalMaxHp(), (current.hp || 0) + 30) }));
  }

  function getPlayerAttackValue() {
    return Math.max(
      1,
      Number(player.baseAttack || player.attack || 3) +
        Number(nextBattleBuff.attack || 0) +
        getCurrentEquipmentBonuses().attackBonus
    );
  }

  function getPlayerDefenseValue() {
    return Math.max(
      0,
      Number(player.baseDefense || player.defense || 2) +
        Number(nextBattleBuff.defense || 0) +
        getCurrentEquipmentBonuses().defenseBonus
    );
  }

  function addBattleLog(entry) {
    const newEntry = {
      ...entry,
      id: createBattleLogId(),
      createdAt: Date.now(),
    };
    setBattleLogs((current) => [newEntry, ...current].slice(0, 30));
  }

  function finishResolvingAction(delay = 180) {
    window.setTimeout(() => {
      resolvingActionRef.current = false;
      setIsResolvingAction(false);
    }, delay);
  }

  function createPendingEnemyAttack(enemyState = currentEnemy) {
    if (!enemyState) return null;
    const enemyRoll = rollDice(enemyState.diceCount, enemyState.diceSides, enemyState.diceMin || 1);
    const isDouble = isDoubleRoll(enemyRoll);
    const attackValue = enemyState.baseAttack * enemyRoll.total;
    return {
      rolls: enemyRoll.dice,
      dice: enemyRoll.dice,
      diceTotal: enemyRoll.total,
      total: enemyRoll.total,
      attackValue,
      isDouble,
    };
  }

  function startBattleForFloor(floor) {
    if (!canChallengeFloor(floor)) return;
    const enemy = createTowerEnemyForFloor(floor);
    setCurrentEnemy(enemy);
    setSelectedFloor(floor);
    setCurrentFloor(floor);
    markFloorAttempted(floor);
    setBattlePhase("playerAttack");
    setBattleResult(null);
    setBattleRewardSummary(null);
    setBattleTurn(1);
    setBattleHighlight(null);
    setLastDiceResult(null);
    setLastDiceResults({});
    setLastPlayerAttackRoll(null);
    setLastEnemyAttackRoll(null);
    setLastPlayerDefenseRoll(null);
    setPendingEnemyAttack(null);
    setBattleLogs([]);
    setIsResolvingAction(false);
    resolvingActionRef.current = false;
    addBattleLog({
      turn: 1,
      type: "playerAttack",
      title: "전투 시작",
      message: `${floor}층 ${getBossFloorLabel(floor) ? `${getBossFloorLabel(floor)} ` : ""}${enemy.name} 전투 시작`,
      formula: `${enemy.name}: HP ${enemy.maxHp}, 공격력 ${enemy.baseAttack}, 주사위 ${enemy.diceCount}D${enemy.diceSides}`,
      resultValue: enemy.maxHp,
    });
    setPhase("battle");
  }

  function handleBattleWin(enemySnapshot = currentEnemy) {
    if (!enemySnapshot || !selectedFloor) return;
    const nextCleared = Math.max(highestClearedFloor, selectedFloor);
    const unlockedFloor = Math.min(MAX_TOWER_FLOOR, Math.max(highestUnlockedFloor, selectedFloor + 1));
    const newlyUnlocked = unlockedFloor > highestUnlockedFloor ? unlockedFloor : null;
    const bossReward = getBossReward(selectedFloor);
    const bossAccessory = bossReward?.accessoryId ? getAccessoryById(bossReward.accessoryId) : null;
    const alreadyOwnedAccessory = bossAccessory ? ownedAccessories.some((item) => item.id === bossAccessory.id) : false;
    const potionDropped = rollPotionDrop();
    setPlayer((current) => ({
      ...current,
      gold: (current.gold || 0) + enemySnapshot.goldReward,
      resources: {
        ...(current.resources || {}),
        [UPGRADE_MATERIAL_ID]: (current.resources?.[UPGRADE_MATERIAL_ID] || 0) + enemySnapshot.materialReward,
      },
    }));
    if (bossReward?.diceUpgradeMaterial) {
      setDiceUpgradeMaterial((current) => current + bossReward.diceUpgradeMaterial);
    }
    if (bossReward?.accessoryId) {
      addAccessoryIfNotOwned(bossReward.accessoryId);
    }
    if (potionDropped) {
      setPotions((current) => current + 1);
    }
    setHighestClearedFloor(nextCleared);
    setHighestUnlockedFloor(unlockedFloor);
    setUnlockedFloors((current) => (current.includes(unlockedFloor) ? current : [...current, unlockedFloor]));
    markFloorCleared(selectedFloor);
    setNextBattleBuff({ attack: 0, defense: 0 });
    setBattleRewardSummary({
      result: "win",
      floor: selectedFloor,
      gold: enemySnapshot.goldReward,
      material: enemySnapshot.materialReward,
      diceMaterial: bossReward?.diceUpgradeMaterial || 0,
      accessory: bossAccessory,
      accessoryAlreadyOwned: alreadyOwnedAccessory,
      potionDropped,
      isBoss: isBossFloor(selectedFloor),
      newlyUnlocked,
    });
    setBattleHighlight({
      type: "victory",
      title: selectedFloor === 10 ? "탑 정복!" : selectedFloor === 5 ? "중간보스 처치!" : "승리!",
      message: `${enemySnapshot.name}을(를) 처치했습니다. 보상을 획득했습니다.`,
      formula: `보상: 골드 ${enemySnapshot.goldReward}, 장비 재료 ${enemySnapshot.materialReward}${
        bossReward?.diceUpgradeMaterial ? `, 주사위 재료 ${bossReward.diceUpgradeMaterial}` : ""
      }${potionDropped ? ", 회복 물약 1" : ""}`,
    });
    addBattleLog({
      turn: 0,
      type: "victory",
      title: selectedFloor === 10 ? "탑 정복" : selectedFloor === 5 ? "중간보스 처치" : "승리",
      message: `${enemySnapshot.name} 처치 / 골드 ${enemySnapshot.goldReward} 획득 / 장비 재료 ${enemySnapshot.materialReward} 획득${
        bossReward?.diceUpgradeMaterial ? ` / 주사위 재료 ${bossReward.diceUpgradeMaterial} 획득` : ""
      }${potionDropped ? " / 몬스터 처치 보너스: 회복 물약을 발견했습니다!" : ""}`,
      formula: newlyUnlocked ? `${newlyUnlocked}층 해금` : "추가 해금 없음",
      resultValue: enemySnapshot.goldReward,
    });
    setPendingEnemyAttack(null);
    setBattleResult("win");
    setBattlePhase("finished");
    setPhase("battleResult");
  }

  function handleBattleLose() {
    const reachedFloor = Math.max(1, Number(selectedFloor || currentFloor || highestClearedFloor || 1));
    const shardReward = difficultyMode === "roguelike" ? calculateDiceShardReward(reachedFloor) : 0;
    if (shardReward > 0) {
      setDiceShards((current) => current + shardReward);
    }
    setNextBattleBuff({ attack: 0, defense: 0 });
    setBattleRewardSummary({
      result: "lose",
      floor: selectedFloor,
      gold: 0,
      material: 0,
      diceMaterial: 0,
      diceShards: shardReward,
      difficultyMode,
      newlyUnlocked: null,
      climbFailed: true,
    });
    setBattleHighlight({
      type: "defeat",
      title: "등반 실패",
      message:
        difficultyMode === "roguelike"
          ? `플레이어가 쓰러졌습니다. 주사위 조각 ${shardReward}개를 획득했습니다.`
          : "하드코어 난이도에서는 패배 보상이 없습니다.",
    });
    addBattleLog({
      turn: 0,
      type: "defeat",
      title: "패배",
      message: shardReward > 0 ? `플레이어가 쓰러졌습니다. 주사위 조각 ${shardReward}개 획득` : "플레이어가 쓰러졌습니다. 패배 보상 없음",
      resultValue: shardReward,
    });
    setPendingEnemyAttack(null);
    if (difficultyMode === "roguelike") {
      setPlayer(createTowerBasePlayer({ difficultyMode: "roguelike", diceShardUpgrades }));
      setPlayerDice(DEFAULT_PLAYER_DICE);
      setDiceUpgradeMaterial(0);
      setPlayerEquipment(DEFAULT_PLAYER_EQUIPMENT);
      setOwnedAccessories([]);
      setPotions(0);
      setHighestClearedFloor(0);
      setHighestUnlockedFloor(1);
      setUnlockedFloors([1]);
      setAttemptedFloors([]);
      setClearedFloors([]);
      setClearedNodesByFloor({});
      setCurrentEnemy(null);
    }
    setBattleResult("lose");
    setBattlePhase("finished");
    setPhase("battleResult");
  }

  function rollPlayerAttackDice() {
    if (phase !== "battle" || battlePhase !== "playerAttack" || !currentEnemy || resolvingActionRef.current) return;
    resolvingActionRef.current = true;
    setIsResolvingAction(true);
    const effectiveDice = getEffectivePlayerDice();
    const playerRoll = rollDice(effectiveDice.count, effectiveDice.sides, effectiveDice.min);
    const adjustedTotal = getAdjustedDiceTotal(playerRoll);
    const attackValue = getPlayerAttackValue();
    const double = isDoubleRoll(playerRoll);
    const damage = calculateAttackDamage(attackValue, adjustedTotal, double);
    const nextEnemy = { ...currentEnemy, hp: Math.max(0, currentEnemy.hp - damage) };
    setCurrentEnemy(nextEnemy);
    setLastPlayerAttackRoll(playerRoll);
    setLastPlayerDefenseRoll(null);
    setLastDiceResult({
      type: "attack",
      playerRoll,
      formula: `공격 피해 = 공격력 ${attackValue} x 주사위 합계 ${getDiceFormulaTotalText(playerRoll)}${double ? ` x ${DOUBLE_MULTIPLIER}` : ""} = ${damage}`,
      damage,
      isDouble: double,
    });
    addBattleLog({
      turn: battleTurn,
      type: double ? "critical" : "playerAttack",
      title: double ? "더블 치명타!" : "플레이어 공격",
      message: `${currentEnemy.name}에게 ${damage} 피해${nextEnemy.hp <= 0 ? " / 처치" : ""}`,
      formula: `공격력 ${attackValue} x (${playerRoll.dice.join(" + ")}${
        effectiveDice.totalBonus ? ` + 장신구 ${effectiveDice.totalBonus}` : ""
      })${double ? ` x ${DOUBLE_MULTIPLIER}` : ""} = ${damage}`,
      dice: playerRoll.dice,
      diceTotal: adjustedTotal,
      resultValue: damage,
      isDouble: double,
    });
    if (nextEnemy.hp <= 0) {
      setLastEnemyAttackRoll(null);
      setLastDiceResults({
        playerAttack: {
          rolls: playerRoll.dice,
          diceTotal: adjustedTotal,
          isDouble: double,
          finalDamage: damage,
        },
      });
      handleBattleWin(nextEnemy);
      finishResolvingAction();
      return;
    }
    const enemyAttack = createPendingEnemyAttack(nextEnemy);
    setPendingEnemyAttack(enemyAttack);
    setLastEnemyAttackRoll(enemyAttack ? { dice: enemyAttack.rolls, total: enemyAttack.diceTotal } : null);
    setLastDiceResults({
      playerAttack: {
        rolls: playerRoll.dice,
        diceTotal: adjustedTotal,
        isDouble: double,
        finalDamage: damage,
      },
      enemyAttack: enemyAttack
        ? {
            rolls: enemyAttack.rolls,
            diceTotal: enemyAttack.diceTotal,
            isDouble: enemyAttack.isDouble,
            attackValue: enemyAttack.attackValue,
          }
        : null,
    });
    if (enemyAttack) {
      addBattleLog({
        turn: battleTurn,
        type: "enemyAttack",
        title: enemyAttack.isDouble ? "적 더블!" : "적 공격 준비",
        message: `${currentEnemy.name}이(가) 다음 공격을 준비합니다. 공격값 ${enemyAttack.attackValue}`,
        formula: `적 공격력 ${currentEnemy.baseAttack} x (${enemyAttack.rolls.join(" + ")}) = ${enemyAttack.attackValue}`,
        dice: enemyAttack.rolls,
        diceTotal: enemyAttack.diceTotal,
        resultValue: enemyAttack.attackValue,
        isDouble: enemyAttack.isDouble,
      });
    }
    setBattleHighlight({
      type: double ? "critical" : "attack",
      title: double ? "더블 치명타!" : "플레이어 공격!",
      message: `${currentEnemy.name}에게 ${damage} 피해를 입혔습니다.${enemyAttack ? ` 적 공격값 ${enemyAttack.attackValue}을(를) 수비턴에 막아야 합니다.` : ""}`,
      formula: `공격력 ${attackValue} x 주사위 합계 ${getDiceFormulaTotalText(playerRoll)}${double ? ` x ${DOUBLE_MULTIPLIER}` : ""} = ${damage}`,
    });
    setBattlePhase("playerDefense");
    finishResolvingAction();
  }

  function rollPlayerDefenseDice() {
    if (phase !== "battle" || battlePhase !== "playerDefense" || !currentEnemy || resolvingActionRef.current) return;
    resolvingActionRef.current = true;
    setIsResolvingAction(true);
    let enemyAttack = pendingEnemyAttack;
    if (!enemyAttack) {
      enemyAttack = createPendingEnemyAttack(currentEnemy);
      addBattleLog({
        turn: battleTurn,
        type: "enemyAttack",
        title: "적 공격 재계산",
        message: "적 공격 준비값이 없어 새로 계산합니다.",
        formula: enemyAttack ? `적 공격력 ${currentEnemy.baseAttack} x (${enemyAttack.rolls.join(" + ")}) = ${enemyAttack.attackValue}` : "",
        dice: enemyAttack?.rolls || [],
        diceTotal: enemyAttack?.diceTotal || 0,
        resultValue: enemyAttack?.attackValue || 0,
      });
    }
    if (!enemyAttack) {
      resolvingActionRef.current = false;
      setIsResolvingAction(false);
      return;
    }
    const effectiveDice = getEffectivePlayerDice();
    const playerRoll = rollDice(effectiveDice.count, effectiveDice.sides, effectiveDice.min);
    const playerDefense = getPlayerDefenseValue();
    const adjustedDefenseTotal = getAdjustedDiceTotal(playerRoll);
    const playerDefenseDouble = isDoubleRoll(playerRoll);
    const block = calculateDefenseValue(playerDefense, adjustedDefenseTotal, playerDefenseDouble);
    const damage = Math.max(0, enemyAttack.attackValue - block);
    const nextHp = Math.max(0, player.hp - damage);
    const double = enemyAttack.isDouble || playerDefenseDouble;
    setPlayer((current) => ({ ...current, hp: Math.max(0, current.hp - damage) }));
    setLastEnemyAttackRoll({ dice: enemyAttack.rolls, total: enemyAttack.diceTotal });
    setLastPlayerDefenseRoll(playerRoll);
    setLastDiceResult({
      type: "defense",
      enemyRoll: { dice: enemyAttack.rolls, total: enemyAttack.diceTotal },
      playerRoll,
      formula: `최종 피해 = max(0, 적 공격 ${enemyAttack.attackValue} - 방어 ${block}) = ${damage}`,
      damage,
      enemyAttack: enemyAttack.attackValue,
      block,
      isDouble: double,
    });
    setLastDiceResults({
      enemyAttack: {
        rolls: enemyAttack.rolls,
        diceTotal: enemyAttack.diceTotal,
        isDouble: enemyAttack.isDouble,
        attackValue: enemyAttack.attackValue,
      },
      playerDefense: {
        rolls: playerRoll.dice,
        diceTotal: adjustedDefenseTotal,
        isDouble: playerDefenseDouble,
        defenseValue: block,
        finalDamageTaken: damage,
      },
    });
    if (damage <= 0) {
      setBattleHighlight({
        type: "block",
        title: playerDefenseDouble ? "더블 강화 방어!" : "완전 방어!",
        message: "피해를 받지 않았습니다.",
        formula: `적 공격 ${enemyAttack.attackValue} - 방어 ${block} = 0`,
      });
    } else {
      setBattleHighlight({
        type: "damage",
        title: playerDefenseDouble ? "강화 방어 후 피해 발생" : "방어 실패",
        message: `플레이어가 ${damage} 피해를 받았습니다.`,
        formula: `적 공격 ${enemyAttack.attackValue} - 방어 ${block} = ${damage}`,
      });
    }
    addBattleLog({
      turn: battleTurn,
      type: playerDefenseDouble ? "block" : damage <= 0 ? "block" : "damage",
      title: playerDefenseDouble ? "더블 강화 방어!" : damage <= 0 ? "완전 방어" : "피해 발생",
      message: damage <= 0 ? "피해를 받지 않음" : `플레이어가 ${damage} 피해를 받음`,
      formula: `적 공격값: ${enemyAttack.attackValue} / 방어: ${playerDefense} x (${playerRoll.dice.join(" + ")}${
        effectiveDice.totalBonus ? ` + 장신구 ${effectiveDice.totalBonus}` : ""
      })${playerDefenseDouble ? ` x ${DOUBLE_MULTIPLIER}` : ""} = ${block} / 최종 피해: max(0, ${enemyAttack.attackValue} - ${block}) = ${damage}`,
      enemyDice: enemyAttack.rolls,
      enemyDiceTotal: enemyAttack.diceTotal,
      defenseDice: playerRoll.dice,
      defenseDiceTotal: adjustedDefenseTotal,
      resultValue: damage,
      isDouble: double,
    });
    setPendingEnemyAttack(null);
    if (nextHp <= 0) {
      handleBattleLose();
      finishResolvingAction();
      return;
    }
    setBattleTurn((current) => current + 1);
    setBattlePhase("playerAttack");
    finishResolvingAction();
  }

  function upgradeEquipment(kind) {
    const costs = {
      weapon: { gold: 50, material: 1 },
      armor: { gold: 50, material: 1 },
      hp: { gold: 40, material: 1 },
    };
    const cost = costs[kind];
    if (!cost || player.gold < cost.gold || getUpgradeMaterial() < cost.material) return;
    setPlayer((current) => {
      const nextResources = { ...(current.resources || {}) };
      nextResources[UPGRADE_MATERIAL_ID] = Math.max(0, (nextResources[UPGRADE_MATERIAL_ID] || 0) - cost.material);
      const base = { ...current, gold: current.gold - cost.gold, resources: nextResources };
      if (kind === "weapon") return { ...base, baseAttack: (base.baseAttack || base.attack || 3) + 1, attack: (base.baseAttack || base.attack || 3) + 1 };
      if (kind === "armor") return { ...base, baseDefense: (base.baseDefense || base.defense || 2) + 1, defense: (base.baseDefense || base.defense || 2) + 1 };
      return { ...base, baseMaxHp: (base.baseMaxHp || base.maxHp || 100) + 10, maxHp: (base.maxHp || 100) + 10, hp: (base.hp || 1) + 10 };
    });
  }

  function upgradeDice(kind) {
    const cost = { gold: 100, material: 1 };
    if (player.gold < cost.gold || diceUpgradeMaterial < cost.material) return;
    if (kind === "count" && playerDice.count >= DICE_UPGRADE_LIMITS.count) return;
    if (kind === "sides" && playerDice.sides >= DICE_UPGRADE_LIMITS.sides) return;
    if (kind === "min" && playerDice.min >= DICE_UPGRADE_LIMITS.min) return;
    setPlayer((current) => ({
      ...current,
      gold: current.gold - cost.gold,
    }));
    setDiceUpgradeMaterial((current) => Math.max(0, current - cost.material));
    setPlayerDice((current) => ({
      count: kind === "count" ? current.count + 1 : current.count,
      sides: kind === "sides" ? current.sides + 1 : current.sides,
      min: kind === "min" ? current.min + 1 : current.min,
    }));
  }

  function buyTowerShopItem(itemId) {
    const items = {
      heal30: { cost: 25, apply: (current) => ({ ...current, hp: Math.min(getFinalMaxHp(), current.hp + 30) }) },
      healHalf: { cost: 55, apply: (current) => ({ ...current, hp: Math.min(getFinalMaxHp(), current.hp + Math.ceil(getFinalMaxHp() * 0.5)) }) },
      attackBuff: { cost: 45, apply: (current) => current, buff: { attack: 2, defense: 0 } },
      defenseBuff: { cost: 45, apply: (current) => current, buff: { attack: 0, defense: 2 } },
    };
    const item = items[itemId];
    if (!item || player.gold < item.cost) return;
    setPlayer((current) => item.apply({ ...current, gold: current.gold - item.cost }));
    if (item.buff) {
      setNextBattleBuff((current) => ({
        attack: current.attack + item.buff.attack,
        defense: current.defense + item.buff.defense,
      }));
    }
  }

  function enterRoom(roomType = currentRoomType, depth = currentDepth) {
    const nextStage = buildDungeonStage(depth, maxDepth);
    setCurrentRoomType(roomType);
    setHasRestedInThisRoom(false);
    setIsRoomCleared(false);
    selectStage(nextStage);
  }

  function completeRun() {
    setRunCompleted(true);
    setIsRoomCleared(true);
    setBattleReward(null);
    setRewards([]);
    setFlippedRewards([]);
    setCardChoiceOpen(false);
    setClaimedRewardCardId(null);
    setSelectedStage(null);
    setPhase("runClear");
    pushLog("최종 보스를 처치했습니다. 던전 클리어!");
  }

  function goToNextRoom() {
    if (!isRoomCleared && phase !== "runClear") return;

    if (currentDepth >= maxDepth) {
      completeRun();
      return;
    }

    const nextDepth = currentDepth + 1;
    const nextRoomType = getRoomTypeByDepth(nextDepth, maxDepth);
    setCurrentDepth(nextDepth);
    setCurrentRoomType(nextRoomType);
    setIsRoomCleared(false);
    setHasRestedInThisRoom(false);
    setRoomResult(null);
    setRoomEncounter(null);
    setSelectedStage(null);
    pushLog(`던전 깊이 ${nextDepth}/${maxDepth}: ${getRoomTypeLabel(nextRoomType)}으로 이동합니다.`);
    enterRoom(nextRoomType, nextDepth);
  }

  function buildRunData(overrides = {}) {
    const clearedRooms = Object.values(clearedNodesByFloor).flat();
    const snapshot = {
      saveVersion: SAVE_VERSION,
      towerGameVersion: TOWER_DICE_GAME_VERSION,
      player,
      selectedCharacter: player.classId || selectedCharacterId,
      currentRoomId: selectedStage?.id || null,
      currentHp: player.hp,
      currentGold: player.gold,
      visitedRooms: Array.from(new Set([...(selectedStage?.id ? [selectedStage.id] : []), ...clearedRooms])),
      clearedRooms,
      deck,
      drawPile,
      hand,
      discardPile,
      exhaustPile,
      enemyIndex,
      enemies,
      selectedEnemyIndex,
      turn,
      phase,
      gameState: phase,
      currentDepth,
      maxDepth,
      currentRoomType,
      isRoomCleared,
      runCompleted,
      hasRestedInThisRoom,
      selectedShopCardId,
      selectedUpgradeCardId,
      upgradeMaterial: player.resources?.manaShard || 0,
      log,
      rewards,
      flippedRewards,
      battleReward,
      cardChoiceOpen,
      claimedRewardCardId,
      roomEncounter,
      roomResult,
      relics,
      selectedCharacterId,
      selectedStage,
      selectedFloor,
      highestClearedFloor,
      highestUnlockedFloor,
      currentEnemy,
      battlePhase,
      battleResult,
      battleLogs,
      battleTurn,
      battleHighlight,
      lastDiceResult,
      lastDiceResults,
      lastPlayerAttackRoll,
      lastEnemyAttackRoll,
      lastPlayerDefenseRoll,
      pendingEnemyAttack,
      isResolvingAction,
      battleRewardSummary,
      playerDice,
      nextBattleBuff,
      attemptedFloors,
      diceUpgradeMaterial,
      playerEquipment,
      ownedAccessories,
      difficultyMode,
      diceShards,
      diceShardUpgrades,
      potions,
      currentFloor,
      unlockedFloors,
      clearedFloors,
      clearedNodesByFloor,
      speedGauge,
      rageStacks,
      comboStacks,
      traitReturnPhase,
      ...overrides,
    };

    return {
      ...snapshot,
      hasActiveRun: shouldPersistRunData(snapshot),
    };
  }

  function restoreRunData(runData, permanentData = playerData, message = "") {
    const normalizedPermanentData = normalizePermanentData(permanentData);
    const restoredMaxDepth = Number(runData?.maxDepth || DEFAULT_MAX_DUNGEON_DEPTH);
    const restoredDepth = clampNumber(Number(runData?.currentDepth || 1), 1, restoredMaxDepth);
    const restoredRoomType = runData?.currentRoomType || getRoomTypeByDepth(restoredDepth, restoredMaxDepth);
    const restoredPhase =
      runData?.phase === "combat"
        ? "battle"
        : runData?.phase === "defeat"
          ? "gameOver"
          : runData?.phase === "victory"
            ? "runClear"
            : runData?.phase || "dungeon";
    setPlayer(applyTraitEffectsToPlayer({ ...INITIAL_PLAYER, ...(runData?.player || {}) }, normalizedPermanentData));
    setPlayerData(normalizedPermanentData);
    setDeck(runData?.deck || []);
    setDrawPile(runData?.drawPile || []);
    setHand(runData?.hand || []);
    setDiscardPile(runData?.discardPile || []);
    setExhaustPile(runData?.exhaustPile || []);
    setEnemyIndex(runData?.enemyIndex || 0);
    setEnemies(runData?.enemies || [createEnemy(0)]);
    setSelectedEnemyIndex(runData?.selectedEnemyIndex || 0);
    setTurn(runData?.turn || 1);
    setPhase(restoredPhase);
    setCurrentDepth(restoredDepth);
    setMaxDepth(restoredMaxDepth);
    setCurrentRoomType(restoredRoomType);
    setIsRoomCleared(Boolean(runData?.isRoomCleared));
    setRunCompleted(Boolean(runData?.runCompleted || restoredPhase === "runClear"));
    setHasRestedInThisRoom(Boolean(runData?.hasRestedInThisRoom));
    setSelectedShopCardId(runData?.selectedShopCardId || null);
    setSelectedUpgradeCardId(runData?.selectedUpgradeCardId || null);
    setRewards(runData?.rewards || []);
    setFlippedRewards(runData?.flippedRewards || []);
    setBattleReward(runData?.battleReward || null);
    setCardChoiceOpen(Boolean(runData?.cardChoiceOpen));
    setClaimedRewardCardId(runData?.claimedRewardCardId || null);
    setRoomEncounter(runData?.roomEncounter || null);
    setRoomResult(runData?.roomResult || null);
    setRelics(runData?.relics || []);
    setSelectedCharacterId(runData?.selectedCharacterId || runData?.player?.classId || null);
    setSelectedStage(runData?.selectedStage || null);
    setSelectedFloor(runData?.selectedFloor || 1);
    setHighestClearedFloor(Math.max(0, Number(runData?.highestClearedFloor || 0)));
    setHighestUnlockedFloor(Math.max(1, Number(runData?.highestUnlockedFloor || 1)));
    setCurrentEnemy(runData?.currentEnemy || null);
    setBattlePhase(runData?.battlePhase || "playerAttack");
    setBattleResult(runData?.battleResult || null);
    setBattleLogs(runData?.battleLogs || []);
    setBattleTurn(runData?.battleTurn || 1);
    setBattleHighlight(runData?.battleHighlight || null);
    setLastDiceResult(runData?.lastDiceResult || null);
    setLastDiceResults(runData?.lastDiceResults || {});
    setLastPlayerAttackRoll(runData?.lastPlayerAttackRoll || null);
    setLastEnemyAttackRoll(runData?.lastEnemyAttackRoll || null);
    setLastPlayerDefenseRoll(runData?.lastPlayerDefenseRoll || null);
    setPendingEnemyAttack(runData?.pendingEnemyAttack || null);
    setIsResolvingAction(false);
    resolvingActionRef.current = false;
    setBattleRewardSummary(runData?.battleRewardSummary || null);
    setPlayerDice(runData?.playerDice || DEFAULT_PLAYER_DICE);
    setNextBattleBuff(runData?.nextBattleBuff || { attack: 0, defense: 0 });
    setAttemptedFloors(runData?.attemptedFloors || []);
    setDiceUpgradeMaterial(Number(runData?.diceUpgradeMaterial || 0));
    setPlayerEquipment({ ...DEFAULT_PLAYER_EQUIPMENT, ...(runData?.playerEquipment || {}) });
    setOwnedAccessories(runData?.ownedAccessories || []);
    setDifficultyMode(runData?.difficultyMode || null);
    setDiceShards(Number(runData?.diceShards || 0));
    setDiceShardUpgrades(createDefaultDiceShardUpgrades(runData?.diceShardUpgrades));
    setPotions(Number(runData?.potions ?? runData?.emergencyPotions ?? 0));
    setCurrentFloor(runData?.currentFloor || 1);
    setUnlockedFloors(runData?.unlockedFloors || [1]);
    setClearedFloors(runData?.clearedFloors || []);
    setClearedNodesByFloor(runData?.clearedNodesByFloor || {});
    setSpeedGauge(runData?.speedGauge || { player: 0, enemies: [] });
    setRageStacks(runData?.rageStacks || 0);
    setComboStacks(runData?.comboStacks || 0);
    setTraitReturnPhase(runData?.traitReturnPhase || "towerMap");
    setHasSavedRun(true);
    setShowDeckManager(false);
    setInspectedCardId(null);
    setHoveredCombatCardId(null);
    setSelectedCommand("attack");
    setIsCardAnimating(false);
    setActiveCardAnimation(null);
    setEnemyAttackAnimation(null);
    setPlayerHitEffect(null);
    setHitEffects({});
    setInitiativeReady(false);
    setCurrentActor({ type: "player" });
    setUpgradeCelebration(null);
    setLog(message ? [message, ...(runData?.log || [])].slice(0, 6) : runData?.log || ["저장된 진행상황을 불러왔습니다."]);
  }

  function handleManualSave() {
    savePermanentData(playerData);
    const runData = buildRunData();
    if (runData.hasActiveRun) {
      saveRunData(runData);
      setHasSavedRun(true);
    }
    pushLog("게임을 저장했습니다.");
  }

  function handleManualLoad() {
    const savedPermanentData = loadPermanentData();
    const savedRunData = loadRunData();
    setPlayerData(savedPermanentData);
    if (!savedRunData.hasActiveRun) {
      pushLog("저장된 진행상황이 없습니다.");
      return;
    }
    restoreRunData(savedRunData, savedPermanentData, "저장된 진행상황을 불러왔습니다.");
  }

  function handleGameStart() {
    const savedPermanentData = loadPermanentData();
    const savedRunData = loadRunData();
    setPlayerData(savedPermanentData);
    if (savedRunData.hasActiveRun) {
      restoreRunData(savedRunData, savedPermanentData, "이어하기로 저장된 진행상황을 불러왔습니다.");
      return;
    }
    setPhase("character-select");
  }

  function resetRunState(nextPhase = "start", nextLog = ["게임 시작을 눌러 새 런을 시작하세요."]) {
    clearRunData();
    setHasSavedRun(false);
    setPlayer(INITIAL_PLAYER);
    setDeck([]);
    setDrawPile([]);
    setHand([]);
    setDiscardPile([]);
    setExhaustPile([]);
    setEnemyIndex(0);
    setEnemies([createEnemy(0)]);
    setSelectedEnemyIndex(0);
    setTurn(1);
    setPhase(nextPhase);
    setCurrentDepth(1);
    setMaxDepth(DEFAULT_MAX_DUNGEON_DEPTH);
    setCurrentRoomType(getRoomTypeByDepth(1, DEFAULT_MAX_DUNGEON_DEPTH));
    setIsRoomCleared(false);
    setRunCompleted(false);
    setHasRestedInThisRoom(false);
    setSelectedShopCardId(null);
    setSelectedUpgradeCardId(null);
    setRewards([]);
    setFlippedRewards([]);
    setBattleReward(null);
    setCardChoiceOpen(false);
    setClaimedRewardCardId(null);
    setRoomEncounter(null);
    setRoomResult(null);
    setRelics([]);
    setSelectedCharacterId(null);
    setSelectedStage(null);
    setSelectedFloor(1);
    setHighestClearedFloor(0);
    setHighestUnlockedFloor(1);
    setCurrentEnemy(null);
    setBattlePhase("playerAttack");
    setBattleResult(null);
    setBattleLogs([]);
    setBattleTurn(1);
    setBattleHighlight(null);
    setLastDiceResult(null);
    setLastDiceResults({});
    setLastPlayerAttackRoll(null);
    setLastEnemyAttackRoll(null);
    setLastPlayerDefenseRoll(null);
    setPendingEnemyAttack(null);
    setIsResolvingAction(false);
    resolvingActionRef.current = false;
    setBattleRewardSummary(null);
    setPlayerDice(DEFAULT_PLAYER_DICE);
    setNextBattleBuff({ attack: 0, defense: 0 });
    setAttemptedFloors([]);
    setDiceUpgradeMaterial(0);
    setPlayerEquipment(DEFAULT_PLAYER_EQUIPMENT);
    setOwnedAccessories([]);
    setDifficultyMode(null);
    setDiceShards(0);
    setDiceShardUpgrades(DEFAULT_DICE_SHARD_UPGRADES);
    setPotions(0);
    setCurrentFloor(1);
    setUnlockedFloors([1]);
    setClearedFloors([]);
    setClearedNodesByFloor({});
    setHoveredCharacterId(null);
    setShowDeckManager(false);
    setInspectedCardId(null);
    setHoveredCombatCardId(null);
    setSelectedCommand("attack");
    setIsCardAnimating(false);
    setActiveCardAnimation(null);
    setEnemyAttackAnimation(null);
    setPlayerHitEffect(null);
    setHitEffects({});
    setSpeedGauge({ player: 0, enemies: [] });
    setInitiativeReady(false);
    setCurrentActor({ type: "player" });
    setRageStacks(0);
    setComboStacks(0);
    setUpgradeCelebration(null);
    setLog(nextLog);
  }

  function handleClearRunProgress() {
    const confirmed = window.confirm("현재 진행 중인 던전 진행상황만 초기화됩니다.\n특성 포인트와 특성은 유지됩니다.\n정말 초기화하시겠습니까?");
    if (!confirmed) return;
    resetRunState("character-select", ["진행 중인 던전만 초기화했습니다. 특성 데이터는 유지됩니다."]);
  }

  function handlePlayerDeath(message = "패배했습니다. 덱 구성을 다시 조정해 보세요.") {
    clearRunData();
    setHasSavedRun(false);
    savePermanentData(playerData);
    setPhase("gameOver");
    pushLog(message);
  }

  function openTraitScreen(returnPhase = phase) {
    setTraitReturnPhase(returnPhase);
    setTraitFeedback("");
    setShowDeckManager(false);
    setPhase("traits");
  }

  function onBossDefeated(floor) {
    const completedFloor = Number(floor);
    if (!Number.isFinite(completedFloor)) return false;

    const current = normalizePlayerData(playerData);
    if (current.clearedBossFloors.includes(completedFloor)) return false;

    const nextPlayerData = {
      ...current,
      traitPoint: current.traitPoint + 1,
      clearedBossFloors: [...current.clearedBossFloors, completedFloor],
    };
    setPlayerData(nextPlayerData);
    savePermanentData(nextPlayerData);
    const runData = buildRunData();
    if (runData.hasActiveRun) saveRunData(runData);
    pushLog("특성 포인트를 1 획득했습니다!");
    return true;
  }

  function upgradeTrait(traitId) {
    const trait = TRAIT_BY_ID[traitId];
    if (!trait) return;

    const current = normalizePlayerData(playerData);
    const currentLevel = getTraitLevel(current, traitId);
    if (currentLevel >= trait.maxLevel) {
      setTraitFeedback("최대 레벨");
      return;
    }
    if (current.traitPoint <= 0) {
      setTraitFeedback("포인트 부족");
      return;
    }

    const nextPlayerData = {
      ...current,
      traitPoint: current.traitPoint - 1,
      traits: {
        ...current.traits,
        [traitId]: currentLevel + 1,
      },
    };

    setPlayerData(nextPlayerData);
    setPlayer((currentPlayer) => applyTraitEffectsToPlayer(currentPlayer, nextPlayerData));
    setTraitFeedback(`${trait.name} 강화 완료`);
    setLastUpgradedTraitId(traitId);
    savePermanentData(nextPlayerData);
  }

  function handleDismantleCard(cardId) {
    const card = CARD_POOL[cardId];
    if (!card) return;
    if (!canDismantleCard(deck, cardId, player.classId)) {
      pushLog("해당 카드는 현재 분해할 수 없습니다.");
      return;
    }

    const rewards = getDismantleRewards(card);
    const rewardText = rewards.map((reward) => `${reward.name} x${reward.amount}`).join(", ");
    const confirmed = window.confirm(`정말 이 카드를 분해하시겠습니까?\n\n${card.name}\n획득 재료: ${rewardText}\n\n분해한 카드는 복구할 수 없습니다.`);
    if (!confirmed) return;

    let removed = false;
    const nextDeck = deck.filter((id) => {
      if (!removed && id === cardId) {
        removed = true;
        return false;
      }
      return true;
    });
    if (!removed) return;

    setDeck(nextDeck);
    setPlayer((currentPlayer) => ({
      ...currentPlayer,
      resources: addMaterialRewards(currentPlayer.resources || {}, rewards),
    }));
    setInspectedCardId(cardId);
    pushLog(`${card.name} 분해 완료: ${rewardText}`);
  }

  function handleUpgradeCard(cardId, optionId) {
    const card = CARD_POOL[cardId];
    const option = card?.upgradeOptions?.find((item) => item.id === optionId);
    const upgradedCard = option ? CARD_POOL[option.resultCardId] : null;
    if (!card || !option || !upgradedCard) return;
    if (!deck.includes(cardId)) {
      pushLog("강화할 카드를 덱에서 찾지 못했습니다.");
      return;
    }
    if (!canUpgradeCard(option, player)) {
      pushLog(getUpgradeCostIssues(option, player).join(" / ") || "강화 재료가 부족합니다.");
      return;
    }

    const targetIndex = deck.findIndex((id) => id === cardId);
    if (targetIndex < 0) {
      pushLog("강화할 카드를 덱에서 찾지 못했습니다.");
      return;
    }
    const targetInstanceId = `${cardId}:${targetIndex}`;
    setSelectedUpgradeCardId(targetInstanceId);

    const confirmed = window.confirm(`${card.name} 카드를 ${option.name}(으)로 강화하시겠습니까?\n\n강화 후: ${upgradedCard.name}\n${upgradedCard.description || upgradedCard.desc}`);
    if (!confirmed) {
      setSelectedUpgradeCardId(null);
      return;
    }

    const nextDeck = deck.map((id, index) => {
      if (index === targetIndex && `${id}:${index}` === targetInstanceId) {
        return option.resultCardId;
      }
      return id;
    });

    setDeck(nextDeck);
    setPlayer((currentPlayer) => consumeUpgradeCost(currentPlayer, option.cost));
    setInspectedCardId(option.resultCardId);
    setSelectedUpgradeCardId(null);
    setUpgradeCelebration({ cardId: option.resultCardId, key: `${option.resultCardId}-${Date.now()}` });
    window.setTimeout(() => {
      setUpgradeCelebration((current) => (current?.cardId === option.resultCardId ? null : current));
    }, 2100);
    pushLog(`${card.name} → ${upgradedCard.name} 강화 완료`);
  }

  function drawFromPiles(count, currentDrawPile, currentDiscardPile) {
    let currentDraw = [...currentDrawPile];
    let currentDiscard = [...currentDiscardPile];
    const drawn = [];

    for (let i = 0; i < count; i += 1) {
      if (currentDraw.length === 0) {
        if (currentDiscard.length === 0) break;
        currentDraw = shuffle(currentDiscard);
        currentDiscard = [];
      }
      drawn.push(currentDraw.shift());
    }

    return { drawn, newDrawPile: currentDraw, newDiscardPile: currentDiscard };
  }

  function drawCards(count) {
    return drawFromPiles(count, drawPile, discardPile);
  }

  function initializeRun(characterId) {
    const profile = CHARACTER_CLASSES[characterId];
    if (!profile) return;

    const freshDeck = buildStarterDeck(characterId);
    const startDrawPile = shuffle(freshDeck);
    const drawResult = drawFromPiles(5, startDrawPile, []);
    const runMaxDepth = DEFAULT_MAX_DUNGEON_DEPTH;
    const firstDepth = 1;
    const firstRoomType = getRoomTypeByDepth(firstDepth, runMaxDepth);
    const firstStage = buildDungeonStage(firstDepth, runMaxDepth);

    setSelectedCharacterId(characterId);
    const basePlayer = {
      hp: profile.hp,
      maxHp: profile.hp,
      baseMaxHp: profile.hp,
      gold: 80,
      resources: {},
      block: 0,
      energy: profile.energy || 3,
      maxEnergy: profile.maxEnergy || profile.energy || 3,
      attackCardBonus: 0,
      turnDamageReduction: 0,
      reflectFlat: 0,
      reflectPercent: 0,
      deathPrevent: 0,
      baseMaxEnergy: profile.maxEnergy || profile.energy || 3,
      startEnergy: profile.energy || 3,
      strength: 0,
      vulnerable: 0,
      classId: characterId,
      attack: profile.attack,
      baseAttack: profile.attack,
      defense: profile.defense,
      baseDefense: profile.defense,
      speed: profile.speed,
    };
    setPlayer(applyTraitEffectsToPlayer(basePlayer, playerData, { resetEnergy: true, preserveHp: false }));
    setDeck(freshDeck);
    setDrawPile(drawResult.newDrawPile);
    setHand(drawResult.drawn);
    setDiscardPile(drawResult.newDiscardPile);
    setExhaustPile([]);
    setEnemyIndex(0);
    setEnemies(createStageEnemies(firstStage));
    setSelectedEnemyIndex(0);
    setSelectedStage(firstStage);
    setSelectedFloor(1);
    setCurrentFloor(1);
    setUnlockedFloors([1]);
    setClearedFloors([]);
    setClearedNodesByFloor({});
    setCurrentDepth(firstDepth);
    setMaxDepth(runMaxDepth);
    setCurrentRoomType(firstRoomType);
    setIsRoomCleared(false);
    setRunCompleted(false);
    setHasRestedInThisRoom(false);
    setSelectedShopCardId(null);
    setSelectedUpgradeCardId(null);
    setTurn(1);
    setRewards([]);
    setFlippedRewards([]);
    setBattleReward(null);
    setCardChoiceOpen(false);
    setClaimedRewardCardId(null);
    setRoomEncounter(null);
    setRoomResult(null);
    setRelics([]);
    setShowDeckManager(false);
    setInspectedCardId(null);
    setHoveredCombatCardId(null);
    setSelectedCommand("attack");
    setIsCardAnimating(false);
    setActiveCardAnimation(null);
    setEnemyAttackAnimation(null);
    setPlayerHitEffect(null);
    setHitEffects({});
    setInitiativeReady(false);
    setCurrentActor({ type: "player" });
    setRageStacks(0);
    setComboStacks(0);
    setSpeedGauge({ player: 0, enemies: [] });
    setPhase("battle");
    setHasSavedRun(true);
    setLog([
      `${profile.name} 선택 완료. 던전 깊이 1/${runMaxDepth} ${getRoomTypeLabel(firstRoomType)}에 진입했습니다.`,
      "최종 보스까지 이어지는 최소 플레이 루프가 시작됩니다.",
    ]);
  }

  function startPlayerTurn(currentDrawPile = drawPile, currentDiscardPile = discardPile) {
    const drawResult = drawFromPiles(5, currentDrawPile, currentDiscardPile);
    setHand(drawResult.drawn);
    setDrawPile(drawResult.newDrawPile);
    setDiscardPile(drawResult.newDiscardPile);
    setPlayer((p) => ({
      ...p,
      energy: p.maxEnergy,
      block: 0,
      attackCardBonus: 0,
      turnDamageReduction: 0,
      reflectFlat: 0,
      reflectPercent: 0,
      deathPrevent: 0,
      vulnerable: Math.max(0, p.vulnerable - 1),
    }));
    setEnemies((current) =>
      current.map((entry) =>
        isEnemyAlive(entry) ? { ...entry, block: 0, vulnerable: Math.max(0, entry.vulnerable - 1) } : entry,
      ),
    );
  }

  function enterSelectedFloor() {
    if (!player.classId) {
      setPhase("character-select");
      return;
    }
    if (!isFloorUnlocked(unlockedFloors, selectedFloor) || clearedFloors.includes(selectedFloor)) return;
    setCurrentFloor(selectedFloor);
    setSelectedStage(null);
    setShowDeckManager(false);
    setPhase("floorMap");
    pushLog(`던전 ${selectedFloor}층 내부로 진입했습니다. 바깥 원의 방부터 공략하세요.`);
  }

  function selectFloorNode(stage) {
    const floorNodes = getFloorNodes(stage.floor);
    const clearedNodeIds = getClearedNodeIds(clearedNodesByFloor, stage.floor);
    const available = isNodeAvailable(
      stage,
      floorNodes,
      clearedNodeIds,
      isFloorUnlocked(unlockedFloors, stage.floor),
      clearedFloors.includes(stage.floor),
    );
    if (!available) return;
    selectStage(stage);
  }

  function markStageCleared(stage) {
    if (!stage) return;
    setClearedNodesByFloor((prev) => {
      const floor = stage.floor;
      const nextFloorNodes = Array.from(new Set([...(prev[floor] || []), stage.id]));
      return { ...prev, [floor]: nextFloorNodes };
    });
  }

  function enterNonCombatRoom(stage) {
    const encounter = buildRoomEncounter(stage, player, deck);
    setSelectedStage(stage);
    setRoomEncounter(encounter);
    setRoomResult(null);
    setDrawPile([]);
    setHand([]);
    setDiscardPile([]);
    setExhaustPile([]);
    setRewards([]);
    setFlippedRewards([]);
    setBattleReward(null);
    setCardChoiceOpen(false);
    setClaimedRewardCardId(null);
    setShowDeckManager(false);
    setInspectedCardId(null);
    setHoveredCombatCardId(null);
    setPhase(encounter.type === "shop" ? "shop" : "rest");
    setLog([
      `상황: ${encounter.situation}`,
      encounter.type === "shop"
        ? "선택지: 카드 클릭 구매 / 덱 열기 판매 / 체력 회복 / 상점 떠나기"
        : `선택지: ${encounter.choices.map((choice) => choice.label).join(" / ")}`,
    ]);
  }

  function selectStage(stage) {
    if (!player.classId) {
      setPhase("character-select");
      return;
    }

    if (isNonCombatRoom(stage)) {
      enterNonCombatRoom(stage);
      return;
    }

    const startDrawPile = shuffle(deck);
    const drawResult = drawFromPiles(5, startDrawPile, []);

    setSelectedStage(stage);
    setEnemyIndex(Math.max(0, STAGE_DATA.findIndex((item) => item.id === stage.id)));
    setEnemies(createStageEnemies(stage));
    setSelectedEnemyIndex(0);
    setDrawPile(drawResult.newDrawPile);
    setHand(drawResult.drawn);
    setDiscardPile(drawResult.newDiscardPile);
    setExhaustPile([]);
    setRewards([]);
    setFlippedRewards([]);
    setBattleReward(null);
    setCardChoiceOpen(false);
    setClaimedRewardCardId(null);
    setRoomEncounter(null);
    setRoomResult(null);
    setShowDeckManager(false);
    setInspectedCardId(null);
    setHoveredCombatCardId(null);
    setSelectedCommand("attack");
    setIsCardAnimating(false);
    setActiveCardAnimation(null);
    setEnemyAttackAnimation(null);
    setPlayerHitEffect(null);
    setHitEffects({});
    setTurn(1);
    setSpeedGauge({ player: 0, enemies: [] });
    setInitiativeReady(false);
    setCurrentActor({ type: "player" });
    setComboStacks(0);
    setRageStacks(0);
    setPlayer((p) =>
      applyTraitEffectsToPlayer(
        {
          ...p,
          block: 0,
          vulnerable: 0,
          attackCardBonus: 0,
          turnDamageReduction: 0,
          reflectFlat: 0,
          reflectPercent: 0,
          deathPrevent: 0,
        },
        playerData,
        { resetEnergy: true },
      ),
    );
    setPhase("battle");
    const monsterCount = stage.type === "boss" ? 1 : stage.type === "elite" ? 2 : 1;
    setLog([
      `던전 ${stage.floor}층 ${stage.ringLabel} ${stage.typeLabel} 시작. 몬스터 ${monsterCount}마리가 등장했습니다.`,
      "카드를 사용해서 적을 처치하세요.",
    ]);
  }

  async function playCard(cardId, handIndex, event) {
    if (phase !== "battle" || isCardAnimating || !initiativeReady || currentActor.type !== "player") return;
    const card = CARD_POOL[cardId];
    if (player.energy < card.cost) return;
    if (aliveEnemies.length === 0) return;

    const targetIndex = isEnemyTargetable(enemies[safeSelectedEnemyIndex]) ? safeSelectedEnemyIndex : liveEnemyIndex;
    const targetEnemy = enemies[targetIndex];
    if (!isEnemyTargetable(targetEnemy)) return;

    const sourceRect = event?.currentTarget?.getBoundingClientRect?.();
    const targetRect = discardPileRef.current?.getBoundingClientRect?.();
    const fallbackRect = {
      left: window.innerWidth / 2 - 87,
      top: window.innerHeight - 330,
      width: 174,
      height: 286,
    };
    const startRect = sourceRect || fallbackRect;
    const startCenterX = startRect.left + startRect.width / 2;
    const startCenterY = startRect.top + startRect.height / 2;
    const endCenterX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth - 96;
    const endCenterY = targetRect ? targetRect.top + targetRect.height / 2 : window.innerHeight - 88;
    const midX = (window.innerWidth * 0.54 - startCenterX) * 0.72;
    const midY = Math.min(-140, window.innerHeight * 0.28 - startCenterY);

    setIsCardAnimating(true);
    setActiveCardAnimation({
      key: `${cardId}-${handIndex}-${Date.now()}`,
      cardId,
      classId: player.classId,
      handIndex,
      left: startRect.left,
      top: startRect.top,
      width: startRect.width,
      height: startRect.height,
      path: {
        x: [0, midX, endCenterX - startCenterX],
        y: [0, midY, endCenterY - startCenterY],
      },
    });
    setHoveredCombatCardId(null);

    let workingDrawPile = [...drawPile];
    let workingDiscardPile = [...discardPile];
    const extraDrawnCards = [];
    const drawHelper = (count) => {
      const result = drawFromPiles(count, workingDrawPile, workingDiscardPile);
      workingDrawPile = result.newDrawPile;
      workingDiscardPile = result.newDiscardPile;
      extraDrawnCards.push(...result.drawn);
      return result;
    };

    const effectivePlayer =
      player.classId === "mage" && card.type === "attack" ? { ...player, strength: player.strength + comboStacks } : player;
    const result = card.play({ player: effectivePlayer, enemy: targetEnemy, enemies, targetIndex, drawCards: drawHelper });
    const nextPlayer = { ...(result.player || player), energy: player.energy - card.cost };
    const rawNextEnemies = Array.isArray(result.enemies)
      ? result.enemies
      : enemies.map((entry, index) => (index === targetIndex ? result.enemy || targetEnemy : entry));
    const nextEnemies = settleDefeatedEnemies(
      rawNextEnemies.map((entry, index) => markEnemyDead(applyEnemyStatusResistance(enemies[index], entry || enemies[index]))),
    );
    const nextTargetEnemy = nextEnemies[targetIndex] || targetEnemy;
    const allDefeated = areAllEnemiesDefeated(nextEnemies);
    const damageDone = Math.max(0, targetEnemy.hp - nextTargetEnemy.hp);
    const defeatedIndexes = nextEnemies
      .map((entry, index) => (!isEnemyAlive(entry) && isEnemyAlive(enemies[index]) ? index : -1))
      .filter((index) => index >= 0);

    await wait(330);

    if (card.type === "attack") {
      const effectKey = `${cardId}-${targetIndex}-${Date.now()}`;
      setHitEffects((current) => ({
        ...current,
        [targetIndex]: {
          key: effectKey,
          type: card.animationType,
          damage: damageDone,
          starLevel: getCardStarLevel(card),
        },
      }));
      window.setTimeout(() => {
        setHitEffects((current) => {
          if (current[targetIndex]?.key !== effectKey) return current;
          const next = { ...current };
          delete next[targetIndex];
          return next;
        });
      }, 850);
    }

    if (player.classId === "mage") {
      if (card.type === "attack") {
        setComboStacks((prev) => Math.min(8, prev + 1));
      } else {
        setComboStacks(0);
      }
    }

    setPlayer(nextPlayer);
    setEnemies(nextEnemies);
    if (result.speedGaugeBonus) {
      setSpeedGauge((currentGauge) => ({
        ...normalizeSpeedGauge(currentGauge, nextEnemies),
        player: normalizeSpeedGauge(currentGauge, nextEnemies).player + result.speedGaugeBonus,
      }));
    }
    if (!isEnemyAlive(nextTargetEnemy) && !allDefeated) {
      setSelectedEnemyIndex(getFirstAliveEnemyIndex(nextEnemies));
    }

    if (getCardStarLevel(card) >= 5) {
      pushLog(`${card.name} 사용: 전설 효과 발동! 공격 피해 +12 누적${result.speedGaugeBonus ? `, 턴 게이지 +${result.speedGaugeBonus}` : ""}`);
    } else if (player.classId === "mage" && card.type === "attack" && comboStacks > 0) {
      pushLog(`${card.name} 사용: 연계 보너스 +${comboStacks}`);
    } else {
      pushLog(`${card.name} 사용: ${card.desc}`);
    }

    await wait(defeatedIndexes.length > 0 ? ENEMY_DEATH_ANIMATION_MS : 590);

    const postDeathEnemies = allDefeated ? nextEnemies : nextEnemies.filter((entry) => isEnemyAlive(entry));
    if (!allDefeated && defeatedIndexes.length > 0) {
      setEnemies(postDeathEnemies);
      setSelectedEnemyIndex(getFirstAliveEnemyIndex(postDeathEnemies));
      setSpeedGauge((currentGauge) => {
        const normalizedGauge = normalizeSpeedGauge(currentGauge, nextEnemies);
        return {
          ...normalizedGauge,
          enemies: normalizedGauge.enemies.filter((_, index) => isEnemyAlive(nextEnemies[index])),
        };
      });
    }

    setDrawPile(workingDrawPile);
    setHand((current) => [...current.filter((_, idx) => idx !== handIndex), ...extraDrawnCards]);
    setDiscardPile([...workingDiscardPile, cardId]);
    setActiveCardAnimation(null);
    setIsCardAnimating(false);

    if (allDefeated) {
      setEnemies([]);
      finishBattle(nextEnemies.some((entry) => entry.boss));
    }
  }

  function finishRoomChoice(result, nextPlayer = player, nextDeck = deck) {
    setPlayer(nextPlayer);
    setDeck(nextDeck);
    setRoomResult(result);
    markStageCleared(selectedStage);
    setIsRoomCleared(true);
    pushLog(`결과: ${result.summary}`);
  }

  function showShopFeedback(summary, details) {
    const feedback = { choiceLabel: "상점", summary, details };
    setRoomResult(feedback);
    pushLog(`결과: ${summary}`);
  }

  function handleShopBuyCard(item) {
    if (phase !== "shop" || roomEncounter?.type !== "shop") return;
    if (!item?.stockId) return;
    setSelectedShopCardId(item.stockId);
    const selectedStock = (roomEncounter.shopCards || []).find((stock) => stock.stockId === item.stockId);
    if (!selectedStock) {
      setSelectedShopCardId(null);
      return;
    }
    const card = CARD_POOL[selectedStock.id];
    if (!card) {
      setSelectedShopCardId(null);
      return;
    }

    if (player.gold < selectedStock.price) {
      showShopFeedback("골드가 부족합니다.", [`보유 골드: ${player.gold}`, `필요 골드: ${selectedStock.price}`, `${card.name} 구매 실패`]);
      setSelectedShopCardId(null);
      return;
    }

    const nextPlayer = { ...player, gold: player.gold - selectedStock.price };
    const nextDeck = [...deck, selectedStock.id];
    setPlayer(nextPlayer);
    setDeck(nextDeck);
    setRoomEncounter((current) => ({
      ...current,
      shopCards: (current?.shopCards || []).filter((stock) => stock.stockId !== selectedStock.stockId),
    }));
    setSelectedShopCardId(null);
    showShopFeedback(`${card.name} 카드를 구매했습니다.`, [
      `가격: ${selectedStock.price}G`,
      `골드: ${player.gold} → ${nextPlayer.gold}`,
      `카드 +1: ${card.name}`,
      `현재 덱: ${nextDeck.length}장`,
    ]);
  }

  function handleShopSellCard(cardId) {
    if (phase !== "shop" || roomEncounter?.type !== "shop") return;
    const card = CARD_POOL[cardId];
    if (!card) return;
    const value = Math.floor(getCardBaseValue(card) * 0.5);
    const confirmed = window.confirm(`${card.name} 카드를 ${value}G에 판매하시겠습니까?`);
    if (!confirmed) {
      showShopFeedback("카드 판매를 취소했습니다.", [`대상 카드: ${card.name}`, `판매 예정가: ${value}G`]);
      return;
    }

    let removed = false;
    const nextDeck = deck.filter((id) => {
      if (!removed && id === cardId) {
        removed = true;
        return false;
      }
      return true;
    });
    if (!removed) {
      showShopFeedback("판매할 카드를 찾지 못했습니다.", [`대상 카드: ${card.name}`]);
      return;
    }

    const nextPlayer = { ...player, gold: player.gold + value };
    setDeck(nextDeck);
    setPlayer(nextPlayer);
    showShopFeedback(`${card.name} 카드를 판매했습니다.`, [
      `판매가: ${value}G`,
      `골드: ${player.gold} → ${nextPlayer.gold}`,
      `현재 덱: ${nextDeck.length}장`,
    ]);
  }

  function handleShopHeal() {
    if (phase !== "shop" || roomEncounter?.type !== "shop") return;
    const missingHp = Math.max(0, player.maxHp - player.hp);
    const healUnit = getModifiedHealAmount(player, Math.max(1, Math.ceil(player.maxHp * 0.1)));
    const affordableUnits = Math.floor(player.gold / 10);
    const neededUnits = Math.ceil(missingHp / healUnit);
    const units = Math.min(affordableUnits, neededUnits);

    if (missingHp <= 0) {
      showShopFeedback("이미 체력이 가득 차 있어 회복약을 사지 않았습니다.", [`체력: ${player.hp}/${player.maxHp}`]);
      return;
    }

    if (units <= 0) {
      showShopFeedback("골드가 부족합니다.", [`보유 골드: ${player.gold}`, "필요 골드: 최소 10"]);
      return;
    }

    const cost = units * 10;
    const healed = Math.min(missingHp, units * healUnit);
    const nextPlayer = { ...player, gold: player.gold - cost, hp: player.hp + healed };
    setPlayer(nextPlayer);
    showShopFeedback(`체력 ${healed}을 회복했습니다.`, [
      `비용: ${cost}G`,
      `10G당 회복량: 최대 체력의 10%(${healUnit})`,
      `체력: ${player.hp}/${player.maxHp} → ${nextPlayer.hp}/${nextPlayer.maxHp}`,
      `골드: ${player.gold} → ${nextPlayer.gold}`,
    ]);
  }

  function leaveShopRoom() {
    if (phase !== "shop" || roomEncounter?.type !== "shop") return;
    markStageCleared(selectedStage);
    setIsRoomCleared(true);
    setRoomEncounter(null);
    setRoomResult(null);
    setSelectedStage(null);
    setTurn(1);
    setSelectedShopCardId(null);
    setPhase("dungeon");
    pushLog("상점방을 클리어했습니다. 다음 방으로 이동할 수 있습니다.");
  }

  function handleRoomChoice(choice) {
    if (!["rest", "shop"].includes(phase) || !roomEncounter || roomResult) return;

    let nextPlayer = { ...player };
    let nextDeck = [...deck];
    let summary = "";
    const details = [];

    const addCard = (cardId) => {
      const card = CARD_POOL[cardId];
      nextDeck = [...nextDeck, cardId];
      summary = `${card.name} 카드 1장을 획득했습니다.`;
      details.push(`카드 +1: ${card.name}`);
      details.push(`현재 덱: ${nextDeck.length}장`);
    };

    const applyHeal = (percent, sourceText) => {
      const heal = healByPercent(nextPlayer, percent);
      nextPlayer = { ...nextPlayer, hp: Math.min(nextPlayer.maxHp, nextPlayer.hp + heal.rawAmount) };
      summary = `${sourceText} 체력 ${heal.amount} 회복.`;
      details.push(`회복률: ${percent}%`);
      details.push(`체력: ${player.hp}/${player.maxHp} → ${nextPlayer.hp}/${nextPlayer.maxHp}`);
    };

    const applyDamage = (percent, sourceText) => {
      const damage = damageByPercent(nextPlayer, percent);
      nextPlayer = { ...nextPlayer, hp: Math.max(0, nextPlayer.hp - damage) };
      summary = `${sourceText} 체력 ${damage} 감소.`;
      details.push(`감소율: ${percent}%`);
      details.push(`체력: ${player.hp}/${player.maxHp} → ${nextPlayer.hp}/${nextPlayer.maxHp}`);
    };

    if (choice.id === "rest") {
      if (hasRestedInThisRoom) {
        summary = "이미 이 휴식방에서 쉬었습니다.";
        details.push("휴식은 방마다 1번만 가능합니다.");
      } else {
        applyHeal(30, "휴식으로 호흡이 안정되었습니다.");
        setHasRestedInThisRoom(true);
      }
    }

    if (choice.id === "rest-leave") {
      summary = "휴식 공간을 그대로 지나쳤습니다.";
      details.push(`체력 유지: ${nextPlayer.hp}/${nextPlayer.maxHp}`);
      details.push(`골드 유지: ${nextPlayer.gold}`);
    }

    if (choice.id === "shop-buy") {
      const affordable = (roomEncounter.shopCards || []).filter((item) => item.price <= nextPlayer.gold);
      const item = affordable[0] || (roomEncounter.shopCards || [])[0];
      if (!item) {
        summary = "상점 진열대가 비어 있어 아무것도 구매하지 못했습니다.";
        details.push("카드 변화 없음");
      } else if (item.price > nextPlayer.gold) {
        summary = `${CARD_POOL[item.id].name} 카드는 ${item.price} 골드라서 구매하지 못했습니다.`;
        details.push(`보유 골드: ${nextPlayer.gold}`);
        details.push(`필요 골드: ${item.price}`);
      } else {
        nextPlayer = { ...nextPlayer, gold: nextPlayer.gold - item.price };
        nextDeck = [...nextDeck, item.id];
        summary = `${CARD_POOL[item.id].name} 카드를 ${item.price} 골드에 구매했습니다.`;
        details.push(`골드: ${player.gold} → ${nextPlayer.gold}`);
        details.push(`카드 +1: ${CARD_POOL[item.id].name}`);
      }
    }

    if (choice.id === "shop-sell") {
      const sellable = findSellableCard(nextDeck);
      if (!sellable) {
        summary = "판매할 카드가 없어 거래를 마쳤습니다.";
        details.push("덱 변화 없음");
      } else {
        let removed = false;
        nextDeck = nextDeck.filter((id) => {
          if (!removed && id === sellable.id) {
            removed = true;
            return false;
          }
          return true;
        });
        nextPlayer = { ...nextPlayer, gold: nextPlayer.gold + sellable.value };
        summary = `${sellable.card.name} 카드를 팔아 ${sellable.value} 골드를 받았습니다.`;
        details.push(`판매 가격: 카드 가치 ${getCardBaseValue(sellable.card)}의 50%`);
        details.push(`골드: ${player.gold} → ${nextPlayer.gold}`);
        details.push(`현재 덱: ${nextDeck.length}장`);
      }
    }

    if (choice.id === "shop-heal") {
      const missingHp = Math.max(0, nextPlayer.maxHp - nextPlayer.hp);
      const healUnit = getModifiedHealAmount(nextPlayer, Math.max(1, Math.ceil(nextPlayer.maxHp * 0.1)));
      const affordableUnits = Math.floor(nextPlayer.gold / 10);
      const neededUnits = Math.ceil(missingHp / healUnit);
      const units = Math.min(affordableUnits, neededUnits);
      if (missingHp <= 0) {
        summary = "이미 체력이 가득 차 있어 회복약을 사지 않았습니다.";
        details.push(`체력: ${nextPlayer.hp}/${nextPlayer.maxHp}`);
      } else if (units <= 0) {
        summary = "골드가 부족해 회복약을 사지 못했습니다.";
        details.push(`보유 골드: ${nextPlayer.gold}`);
        details.push("필요 골드: 최소 10");
      } else {
        const cost = units * 10;
        const healed = Math.min(missingHp, units * healUnit);
        nextPlayer = { ...nextPlayer, gold: nextPlayer.gold - cost, hp: nextPlayer.hp + healed };
        summary = `${cost} 골드를 내고 체력 ${healed}을 회복했습니다.`;
        details.push(`10골드당 회복량: 최대 체력의 10%(${healUnit})`);
        details.push(`체력: ${player.hp}/${player.maxHp} → ${nextPlayer.hp}/${nextPlayer.maxHp}`);
        details.push(`골드: ${player.gold} → ${nextPlayer.gold}`);
      }
    }

    if (choice.id === "event-touch-altar") {
      const roll = randomInt(1, 5);
      if (roll === 1) addCard(pickRandomExplorationCard(nextPlayer.classId));
      if (roll === 2) applyHeal(randomInt(10, 50), "제단의 빛이 상처를 꿰맸습니다.");
      if (roll === 3) applyDamage(randomInt(5, 30), "제단의 열기가 피를 태웠습니다.");
      if (roll === 4) {
        const gain = randomInt(5, 20);
        nextPlayer = { ...nextPlayer, baseMaxHp: (nextPlayer.baseMaxHp || nextPlayer.maxHp) + gain, maxHp: nextPlayer.maxHp + gain, hp: nextPlayer.hp + gain };
        summary = `제단이 생명력을 새겨 최대 체력 ${gain}을 얻었습니다.`;
        details.push(`최대 체력: ${player.maxHp} → ${nextPlayer.maxHp}`);
        details.push(`체력: ${player.hp}/${player.maxHp} → ${nextPlayer.hp}/${nextPlayer.maxHp}`);
      }
      if (roll === 5) {
        const gold = getModifiedGoldGain(nextPlayer, randomInt(10, 100));
        nextPlayer = { ...nextPlayer, gold: nextPlayer.gold + gold };
        summary = `제단 아래에서 오래된 금화 ${gold} 골드를 발견했습니다.`;
        details.push(`골드: ${player.gold} → ${nextPlayer.gold}`);
      }
    }

    if (choice.id === "event-offer-gold") {
      const cost = randomInt(10, 50);
      if (nextPlayer.gold < cost) {
        summary = `제단은 ${cost} 골드를 요구했지만, 주머니가 가벼워 아무 일도 일어나지 않았습니다.`;
        details.push(`보유 골드: ${nextPlayer.gold}`);
      } else {
        nextPlayer = { ...nextPlayer, gold: nextPlayer.gold - cost };
        if (Math.random() < 0.7) {
          const gain = randomInt(5, 20);
          nextPlayer = { ...nextPlayer, baseMaxHp: (nextPlayer.baseMaxHp || nextPlayer.maxHp) + gain, maxHp: nextPlayer.maxHp + gain, hp: nextPlayer.hp + gain };
          summary = `${cost} 골드를 바치자 최대 체력 ${gain}이 증가했습니다.`;
          details.push(`골드: ${player.gold} → ${nextPlayer.gold}`);
          details.push(`최대 체력: ${player.maxHp} → ${nextPlayer.maxHp}`);
        } else {
          summary = `${cost} 골드를 바쳤지만 제단은 차갑게 침묵했습니다.`;
          details.push(`골드: ${player.gold} → ${nextPlayer.gold}`);
        }
      }
    }

    if (choice.id === "event-ignore") {
      if (Math.random() < 0.25) {
        const gold = getModifiedGoldGain(nextPlayer, randomInt(10, 30));
        nextPlayer = { ...nextPlayer, gold: nextPlayer.gold + gold };
        summary = `조용히 지나가던 중 바닥 틈에서 ${gold} 골드를 주웠습니다.`;
        details.push(`골드: ${player.gold} → ${nextPlayer.gold}`);
      } else {
        summary = "불길한 기척을 뒤로하고 조용히 지나갔습니다.";
        details.push(`체력 유지: ${nextPlayer.hp}/${nextPlayer.maxHp}`);
        details.push(`골드 유지: ${nextPlayer.gold}`);
      }
    }

    if (choice.id === "event-gamble-gold") {
      const stake = 30;
      if (nextPlayer.gold < stake) {
        summary = "도박꾼은 빈 주머니를 보고 웃더니 카드를 거두었습니다.";
        details.push(`보유 골드: ${nextPlayer.gold}`);
      } else {
        nextPlayer = { ...nextPlayer, gold: nextPlayer.gold - stake };
        if (Math.random() < 0.55) {
          const prize = getModifiedGoldGain(nextPlayer, randomInt(60, 100));
          nextPlayer = { ...nextPlayer, gold: nextPlayer.gold + prize };
          summary = `도박에서 이겨 ${prize} 골드를 따냈습니다.`;
          details.push(`베팅: ${stake} 골드`);
          details.push(`골드: ${player.gold} → ${nextPlayer.gold}`);
        } else {
          const damage = damageByPercent(nextPlayer, randomInt(5, 20));
          nextPlayer = { ...nextPlayer, hp: Math.max(0, nextPlayer.hp - damage) };
          summary = `도박에서 패배해 ${stake} 골드를 잃고 체력 ${damage}이 감소했습니다.`;
          details.push(`골드: ${player.gold} → ${nextPlayer.gold}`);
          details.push(`체력: ${player.hp}/${player.maxHp} → ${nextPlayer.hp}/${nextPlayer.maxHp}`);
        }
      }
    }

    if (choice.id === "event-draw-card") {
      if (Math.random() < 0.6) {
        addCard(pickRandomExplorationCard(nextPlayer.classId));
      } else {
        applyDamage(randomInt(5, 30), "표식 카드가 손바닥에 검은 문장을 남겼습니다.");
      }
    }

    if (choice.id === "event-drink-spring") {
      if (Math.random() < 0.7) applyHeal(randomInt(10, 50), "샘물이 몸속에서 은은하게 퍼졌습니다.");
      else applyDamage(randomInt(5, 20), "샘물에 섞인 독기가 목을 타고 번졌습니다.");
    }

    if (choice.id === "event-take-coins") {
      if (Math.random() < 0.65) {
        const gold = getModifiedGoldGain(nextPlayer, randomInt(10, 100));
        nextPlayer = { ...nextPlayer, gold: nextPlayer.gold + gold };
        summary = `샘 바닥에서 ${gold} 골드를 건져 올렸습니다.`;
        details.push(`골드: ${player.gold} → ${nextPlayer.gold}`);
      } else {
        const loss = Math.min(nextPlayer.gold, randomInt(10, 50));
        nextPlayer = { ...nextPlayer, gold: nextPlayer.gold - loss };
        summary = `물그림자가 주머니를 스쳐 ${loss} 골드를 훔쳐 갔습니다.`;
        details.push(`골드: ${player.gold} → ${nextPlayer.gold}`);
      }
    }

    if (choice.id === "event-rest-spring") {
      if (Math.random() < 0.5) {
        applyHeal(randomInt(10, 30), "샘가의 고요함이 상처를 누그러뜨렸습니다.");
      } else {
        const gain = randomInt(5, 12);
        nextPlayer = { ...nextPlayer, baseMaxHp: (nextPlayer.baseMaxHp || nextPlayer.maxHp) + gain, maxHp: nextPlayer.maxHp + gain, hp: nextPlayer.hp + gain };
        summary = `샘의 숨결이 몸에 남아 최대 체력 ${gain}이 증가했습니다.`;
        details.push(`최대 체력: ${player.maxHp} → ${nextPlayer.maxHp}`);
        details.push(`체력: ${player.hp}/${player.maxHp} → ${nextPlayer.hp}/${nextPlayer.maxHp}`);
      }
    }

    finishRoomChoice({ choiceLabel: choice.label, summary, details }, nextPlayer, nextDeck);
  }

  function continueAfterRoom() {
    if (!roomResult) return;
    setRoomEncounter(null);
    setRoomResult(null);
    setSelectedStage(null);
    setTurn(1);
    if (player.hp <= 0) {
      handlePlayerDeath("탐험 중 쓰러졌습니다. 다음 런에서는 위험한 선택을 조심하세요.");
      return;
    }
    pushLog("방을 클리어했습니다. 다음 방으로 이동합니다.");
    goToNextRoom();
  }

  function finishBattle(isBoss) {
    markStageCleared(selectedStage);
    setIsRoomCleared(true);

    const baseBattleGold = selectedStage?.type === "boss" ? randomInt(60, 100) : selectedStage?.type === "elite" ? randomInt(35, 65) : randomInt(15, 40);
    const battleGold = getModifiedGoldGain(player, baseBattleGold);

    if (selectedStage?.type === "boss") {
      const completedFloor = selectedStage.floor;
      onBossDefeated(completedFloor);
      setClearedFloors((prev) => Array.from(new Set([...prev, completedFloor])));
      setUnlockedFloors((prev) => {
        const nextFloor = Math.min(TOTAL_FLOORS, completedFloor + 1);
        return Array.from(new Set([...prev, nextFloor]));
      });
      setSelectedFloor(Math.min(TOTAL_FLOORS, completedFloor + 1));
      setCurrentFloor(completedFloor);
    }

    const rewardCards = getRewardCards(deck, player.classId, player).slice(0, 3);
    const reward = generateBattleReward(selectedStage, battleGold, rewardCards);
    if (!hasBattleReward(reward)) {
      continueAfterBattleReward({ skipRewardUi: true });
      return;
    }

    setPlayer((p) => applyBattleRewardToPlayer(p, reward));
    setBattleReward(reward);
    setRewards(rewardCards);
    setFlippedRewards([]);
    setCardChoiceOpen(false);
    setClaimedRewardCardId(null);
    setRoomEncounter(null);
    setRoomResult(null);
    setPhase("reward");
    pushLog(isBoss ? `던전 ${selectedStage?.floor}층 보스방 공략 성공! 전리품을 확인하세요.` : "전투 승리! 전리품을 확인하세요.");
  }

  function flipReward(index) {
    setFlippedRewards((prev) => {
      if (prev[index]) return prev;
      return prev.map((value, currentIndex) => (currentIndex === index ? true : value));
    });
  }

  async function playEnemyAttackAnimation(enemyActionIndex, actingEnemy, damage) {
    const sourceRect = enemyActorRefs.current[enemyActionIndex]?.getBoundingClientRect?.();
    const targetRect = playerTargetRef.current?.getBoundingClientRect?.();
    const startX = sourceRect ? sourceRect.left + sourceRect.width / 2 : window.innerWidth * 0.72;
    const startY = sourceRect ? sourceRect.top + sourceRect.height * 0.46 : window.innerHeight * 0.42;
    const endX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth * 0.24;
    const endY = targetRect ? targetRect.top + targetRect.height * 0.48 : window.innerHeight * 0.44;
    const key = `${actingEnemy.id || actingEnemy.name}-${Date.now()}`;

    setEnemyAttackAnimation({
      key,
      name: actingEnemy.name,
      image: actingEnemy.image,
      imagePath: getMonsterImagePath(actingEnemy),
      imageSrc: getMonsterImagePath(actingEnemy),
      startX,
      startY,
      midX: (startX + endX) / 2,
      midY: Math.min(startY, endY) - 72,
      endX,
      endY,
      width: Math.max(76, Math.min(130, (sourceRect?.width || 160) * 0.46)),
      height: Math.max(76, Math.min(130, (sourceRect?.height || 200) * 0.38)),
    });

    await wait(380);

    setPlayerHitEffect({ key, damage });
    await wait(280);
    setEnemyAttackAnimation(null);

    window.setTimeout(() => {
      setPlayerHitEffect((current) => (current?.key === key ? null : current));
    }, 360);
  }

  async function enemyTurn(options = {}) {
    if (phase !== "battle" || isCardAnimating) return;
    setIsCardAnimating(true);
    let nextPlayer = { ...player };
    let nextEnemies = enemies.map((entry) => ({ ...entry }));
    let nextGauge = normalizeSpeedGauge(options.startingGauge || speedGauge, nextEnemies);
    let nextRage = rageStacks;
    let safety = 0;
    let enemyActions = 0;

    while (safety < 12) {
      safety += 1;
      const nextActor = nextActorFromCombatGauge(nextGauge, player.speed, nextEnemies);
      nextGauge = nextActor.gauge;

      if (nextActor.actor.type === "player") {
        setCurrentActor({ type: "player" });
        break;
      }

      const enemyActionIndex = nextActor.actor.index;
      let actingEnemy = nextEnemies[enemyActionIndex];
      if (!isEnemyAlive(actingEnemy)) continue;

      if ((actingEnemy.bleed || 0) > 0) {
        const bleedDamage = actingEnemy.bleed;
        actingEnemy = markEnemyDead({
          ...actingEnemy,
          hp: Math.max(0, actingEnemy.hp - bleedDamage),
          bleed: Math.max(0, actingEnemy.bleed - 1),
        });
        nextEnemies[enemyActionIndex] = actingEnemy;
        setEnemies(settleDefeatedEnemies(nextEnemies));
        pushLog(`${actingEnemy.name} 출혈: ${bleedDamage} 피해`);
        await wait(220);
        if (!isEnemyAlive(actingEnemy)) {
          nextEnemies = settleDefeatedEnemies(nextEnemies);
          if (areAllEnemiesDefeated(nextEnemies)) break;
          continue;
        }
      }

      enemyActions += 1;
      const action = actingEnemy.actions[actingEnemy.actionIndex % actingEnemy.actions.length];
      setCurrentActor({ type: "enemy", index: enemyActionIndex, actionType: action.type });

      if (action.type === "attack") {
        const defenseMitigation = Math.floor((nextPlayer.defense || 0) / 4);
        const damage = Math.max(1, action.value + actingEnemy.strength - defenseMitigation);
        const finalDamage = nextPlayer.vulnerable > 0 ? Math.ceil(damage * 1.5) : damage;
        const totalReduction = Math.min(0.95, (nextPlayer.damageReduction || 0) + (nextPlayer.turnDamageReduction || 0));
        const reducedDamage = Math.max(1, Math.floor(finalDamage * (1 - totalReduction)));

        let taken = reducedDamage;
        let blocked = 0;
        let reflectDamage = 0;

        if (nextPlayer.classId === "archer" && Math.random() < 0.25) {
          taken = 0;
          actingEnemy = markEnemyDead({ ...actingEnemy, hp: Math.max(0, actingEnemy.hp - 4) });
          pushLog("궁수 패시브 발동: 회피 성공! 반격 피해 4");
        } else {
          blocked = Math.min(nextPlayer.block, reducedDamage);
          taken = reducedDamage - blocked;
          nextPlayer.block -= blocked;
          nextPlayer.hp = Math.max(0, nextPlayer.hp - taken);
        }

        reflectDamage = Math.max(0, Math.floor(reducedDamage * (nextPlayer.reflectPercent || 0)) + (nextPlayer.reflectFlat || 0));
        if (reflectDamage > 0) {
          actingEnemy = markEnemyDead({ ...actingEnemy, hp: Math.max(0, actingEnemy.hp - reflectDamage) });
          pushLog(`방어 반격: ${actingEnemy.name}에게 ${reflectDamage} 피해 반사`);
        }

        if (nextPlayer.hp <= 0 && (nextPlayer.deathPrevent || 0) > 0) {
          nextPlayer = { ...nextPlayer, hp: 1, deathPrevent: Math.max(0, (nextPlayer.deathPrevent || 0) - 1) };
          pushLog("절대 방벽 발동: 사망을 한 번 막았습니다.");
        }

        if (nextPlayer.classId === "warrior" && taken > 0) {
          nextRage += 1;
          if (nextRage >= 3) {
            nextRage -= 3;
            nextPlayer.strength += 1;
            pushLog("전사 패시브 발동: 분노 폭발! 힘 +1");
          }
        }

        await playEnemyAttackAnimation(enemyActionIndex, actingEnemy, taken);
        pushLog(`${actingEnemy.name}의 공격: ${taken} 피해`);
      }

      if (action.type === "block") {
        setEnemyAttackAnimation(null);
        actingEnemy = { ...actingEnemy, block: actingEnemy.block + action.value };
        await wait(280);
        pushLog(`${actingEnemy.name} 방어 ${action.value} 획득`);
      }

      if (action.type === "buff") {
        setEnemyAttackAnimation(null);
        actingEnemy = { ...actingEnemy, strength: actingEnemy.strength + action.value };
        await wait(280);
        pushLog(`${actingEnemy.name} 힘 +${action.value}`);
      }

      if (action.type === "debuff") {
        setEnemyAttackAnimation(null);
        nextPlayer.vulnerable += action.value;
        await wait(280);
        pushLog(`${actingEnemy.name}가 취약을 부여했습니다.`);
      }

      nextEnemies[enemyActionIndex] = markEnemyDead({ ...actingEnemy, actionIndex: actingEnemy.actionIndex + 1 });
      nextEnemies = settleDefeatedEnemies(nextEnemies);
      if (!isEnemyAlive(nextEnemies[enemyActionIndex]) && !areAllEnemiesDefeated(nextEnemies)) {
        setEnemies(nextEnemies);
        await wait(ENEMY_DEATH_ANIMATION_MS);
        const keepAlive = nextEnemies.map((entry) => isEnemyAlive(entry));
        nextEnemies = nextEnemies.filter((entry) => isEnemyAlive(entry));
        nextGauge = {
          ...nextGauge,
          enemies: normalizeSpeedGauge(nextGauge, keepAlive).enemies.filter((_, index) => keepAlive[index]),
        };
        setEnemies(nextEnemies);
      }

      if (nextPlayer.hp <= 0 || areAllEnemiesDefeated(nextEnemies)) break;
      await wait(140);
    }

    if (areAllEnemiesDefeated(nextEnemies)) {
      setPlayer(nextPlayer);
      setEnemies([]);
      setRageStacks(nextRage);
      setSpeedGauge(nextGauge);
      setIsCardAnimating(false);
      finishBattle(nextEnemies.some((entry) => entry.boss));
      return;
    }

    if (nextPlayer.hp <= 0) {
      setPlayer(nextPlayer);
      setEnemies(nextEnemies);
      setRageStacks(nextRage);
      setSpeedGauge(nextGauge);
      setIsCardAnimating(false);
      handlePlayerDeath("패배했습니다. 덱 구성을 다시 조정해 보세요.");
      return;
    }

    const discardAfterTurn = options.preserveHand ? discardPile : [...discardPile, ...hand];
    const drawResult = drawFromPiles(5, drawPile, discardAfterTurn);

    setPlayer({
      ...nextPlayer,
      energy: nextPlayer.maxEnergy,
      block: 0,
      attackCardBonus: 0,
      turnDamageReduction: 0,
      reflectFlat: 0,
      reflectPercent: 0,
      deathPrevent: 0,
      vulnerable: Math.max(0, nextPlayer.vulnerable - 1),
    });
    setEnemies(
      nextEnemies.map((entry) => ({
        ...entry,
        block: 0,
        vulnerable: isEnemyAlive(entry) ? Math.max(0, entry.vulnerable - 1) : entry.vulnerable,
      })),
    );
    setSelectedEnemyIndex(getFirstAliveEnemyIndex(nextEnemies));
    setRageStacks(nextRage);
    setSpeedGauge(nextGauge);
    if (!options.preserveHand) {
      setDiscardPile(drawResult.newDiscardPile);
      setDrawPile(drawResult.newDrawPile);
      setHand(drawResult.drawn);
      setTurn((t) => t + 1);
    }
    setComboStacks(0);
    setCurrentActor({ type: "player" });
    setIsCardAnimating(false);
    if (enemyActions > 1) {
      pushLog(`속도 차이로 적이 연속 행동 ${enemyActions}회 수행`);
    } else if (options.opening && enemyActions > 0) {
      pushLog("적이 더 빨라 선공했습니다.");
    }
  }

  function chooseReward(cardId) {
    const nextDeck = [...deck, cardId];
    setDeck(nextDeck);
    setClaimedRewardCardId(cardId);
    setCardChoiceOpen(false);
    pushLog(`${CARD_POOL[cardId].name} 카드를 덱에 추가했습니다.`);
  }

  function continueAfterBattleReward(options = {}) {
    if (!options.skipRewardUi && (battleReward?.cardChoices || []).length > 0 && !claimedRewardCardId) return;

    const completedBossRoom = selectedStage?.type === "boss";
    const completedFinalBoss = completedBossRoom && currentDepth >= maxDepth;

    if (completedFinalBoss || selectedStage?.finalBoss) {
      setBattleReward(null);
      setRewards([]);
      setFlippedRewards([]);
      setCardChoiceOpen(false);
      setClaimedRewardCardId(null);
      completeRun();
      return;
    }

    setDrawPile([]);
    setHand([]);
    setDiscardPile([]);
    setExhaustPile([]);
    setRewards([]);
    setFlippedRewards([]);
    setBattleReward(null);
    setCardChoiceOpen(false);
    setClaimedRewardCardId(null);
    setRoomEncounter(null);
    setRoomResult(null);
    setTurn(1);
    setPhase("dungeon");
    setComboStacks(0);
    setSelectedStage(null);
    setPlayer((p) => ({
      ...p,
      block: 0,
      energy: p.maxEnergy,
      attackCardBonus: 0,
      turnDamageReduction: 0,
      reflectFlat: 0,
      reflectPercent: 0,
      deathPrevent: 0,
      vulnerable: 0,
    }));
    setSpeedGauge((g) => ({ ...g }));
    pushLog("전리품 확인 완료. 다음 방으로 이동할 수 있습니다.");
  }

  function skipReward() {
    continueAfterBattleReward({ skipRewardUi: true });
  }

  function restart() {
    resetRunState("start", ["게임 시작을 눌러 새 런을 시작하세요. 특성 데이터는 유지됩니다."]);
  }

  function restartRun() {
    const characterId = player.classId || selectedCharacterId || "warrior";
    clearRunData();
    setHasSavedRun(false);
    initializeRun(characterId);
  }

  function clearHoveredCombatCard(cardId) {
    setHoveredCombatCardId((current) => (current === cardId ? null : current));
  }

  const deckCount = useMemo(() => {
    const count = {};
    deck.forEach((id) => {
      count[id] = (count[id] || 0) + 1;
    });
    return Object.entries(count).map(([id, amount]) => ({ ...CARD_POOL[id], amount }));
  }, [deck]);

  const upgradeMaterial = getUpgradeMaterial();
  const highestDisplayFloor = Math.min(MAX_TOWER_FLOOR, Math.max(1, highestUnlockedFloor + 2));
  const floorList = Array.from({ length: highestDisplayFloor }, (_, index) => index + 1);

  if (phase === "title") {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="w-full max-w-3xl text-center">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl border border-amber-200/40 bg-amber-200/10 text-4xl shadow-[0_0_50px_rgba(251,191,36,0.2)]">
            <TowerControl size={42} />
          </div>
          <div className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Tower Dice Battle</div>
          <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">주사위 탑 등반</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            장비와 주사위를 강화하고 해금된 층에 도전하는 탑 등반형 주사위 전투 게임입니다.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm font-bold text-slate-200">
            <span className="rounded-xl bg-white/10 px-3 py-2">최고 클리어 {highestClearedFloor}층</span>
            <span className="rounded-xl bg-white/10 px-3 py-2">해금 {highestUnlockedFloor}층</span>
            {hasSavedRun && <span className="rounded-xl bg-emerald-300/15 px-3 py-2 text-emerald-100">저장된 진행상황 있음</span>}
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={startGame} className="rounded-2xl bg-amber-300 px-8 py-4 text-lg font-black text-slate-950 shadow-lg hover:bg-amber-200">
              게임 시작
            </button>
            <button type="button" onClick={() => setPhase("how-to-play")} className="rounded-2xl border border-white/15 bg-white/10 px-8 py-4 text-lg font-black text-white hover:bg-white/15">
              게임 방법
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (phase === "difficultySelect") {
    const difficultyCards = [
      {
        id: "roguelike",
        title: "로그라이크 난이도",
        description: "죽으면 장비와 재화는 사라지지만, 주사위 조각은 남습니다. 조각으로 기본 능력치를 영구 강화해 다음 등반을 준비합니다.",
        features: [
          "패배 시 등반 진행도 초기화",
          "패배 시 주사위 조각 획득",
          "주사위 조각 상점 이용 가능",
          "기본 공격력/방어력/체력 영구 강화",
          "반복 플레이를 통해 조금씩 강해지는 모드",
        ],
        button: "로그라이크로 시작",
        tone: "from-cyan-300 to-emerald-300",
      },
      {
        id: "hardcore",
        title: "하드코어 난이도",
        description: "죽으면 모든 진행이 끝납니다. 패배 시 이번 등반에서 얻은 이점 없이 처음부터 다시 도전해야 합니다.",
        features: [
          "패배 시 등반 진행도 초기화",
          "패배 보상 없음",
          "주사위 조각 획득 없음",
          "주사위 조각 상점 사용 불가",
          "순수 실력과 운으로 클리어하는 모드",
        ],
        button: "하드코어로 시작",
        tone: "from-rose-300 to-amber-300",
      },
    ];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="mx-auto max-w-6xl">
          <header className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl">
            <div className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Climb Rule</div>
            <h1 className="mt-2 text-5xl font-black">난이도 선택</h1>
            <p className="mt-3 text-slate-300">이번 등반의 규칙을 선택하세요.</p>
            <p className="mt-2 text-sm font-bold text-amber-100">새 난이도로 시작하면 현재 등반 진행도가 초기화됩니다.</p>
          </header>
          <div className="grid gap-4 lg:grid-cols-2">
            {difficultyCards.map((card) => (
              <article key={card.id} className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
                <div className={`mb-5 h-2 rounded-full bg-gradient-to-r ${card.tone}`} />
                <h2 className="text-3xl font-black">{card.title}</h2>
                <p className="mt-3 min-h-20 text-sm font-bold leading-6 text-slate-600">{card.description}</p>
                <ul className="mt-5 grid gap-2 text-sm font-black text-slate-700">
                  {card.features.map((feature) => (
                    <li key={feature} className="rounded-xl bg-slate-100 px-3 py-2">{feature}</li>
                  ))}
                </ul>
                <button
                  onClick={() => selectDifficulty(card.id)}
                  className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 text-lg font-black text-white hover:bg-slate-700"
                >
                  {card.button}
                </button>
              </article>
            ))}
          </div>
          <button onClick={returnToTitle} className="mt-5 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-black text-white hover:bg-white/15">
            처음 화면으로
          </button>
        </section>
      </div>
    );
  }

  if (phase === "tower") {
    const effectiveDice = getEffectivePlayerDice();
    const equipmentBonuses = getCurrentEquipmentBonuses();
    const finalMaxHp = getFinalMaxHp();
    const shardBonuses = getDiceShardUpgradeBonuses(diceShardUpgrades);
    const shardBonusLabels = [
      `기본 공격력 +${shardBonuses.attack}`,
      `기본 방어력 +${shardBonuses.defense}`,
      `최대 체력 +${shardBonuses.maxHp}`,
    ];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
                  <TowerControl size={18} /> Tower Hub
                </div>
                <h1 className="mt-1 text-4xl font-black">탑 화면</h1>
                <p className="mt-1 text-sm text-slate-300">전투 전에 장비, 주사위, 상점 준비를 마치고 해금된 층에 도전합니다.</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-xl bg-white/10 px-3 py-2">현재 난이도: {DIFFICULTY_LABELS[difficultyMode] || "미선택"}</span>
                  {difficultyMode === "roguelike" ? (
                    <span className="rounded-xl bg-cyan-300/20 px-3 py-2 text-cyan-100">보유 주사위 조각: {diceShards}</span>
                  ) : (
                    <span className="rounded-xl bg-rose-300/20 px-3 py-2 text-rose-100">하드코어 모드: 패배 시 보상이 없습니다.</span>
                  )}
                </div>
              </div>
              <button onClick={returnToTitle} className="rounded-2xl bg-white px-4 py-3 font-black text-slate-950 hover:bg-cyan-100">
                처음 화면으로
              </button>
            </div>
          </header>

          <main className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <section className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-xl">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl bg-slate-100 p-4"><div className="text-sm font-bold text-slate-500">최고 클리어 층</div><strong className="text-3xl">{highestClearedFloor}</strong></div>
                <div className="rounded-2xl bg-slate-100 p-4"><div className="text-sm font-bold text-slate-500">도전 가능 최고 층</div><strong className="text-3xl">{highestUnlockedFloor}</strong></div>
                <div className="rounded-2xl bg-amber-100 p-4"><div className="text-sm font-bold text-amber-700">골드</div><strong className="text-3xl">{player.gold || 0}</strong></div>
                <div className="rounded-2xl bg-cyan-100 p-4"><div className="text-sm font-bold text-cyan-700">장비 강화 재료</div><strong className="text-3xl">{upgradeMaterial}</strong></div>
                <div className="rounded-2xl bg-indigo-100 p-4"><div className="text-sm font-bold text-indigo-700">주사위 강화 재료</div><strong className="text-3xl">{diceUpgradeMaterial}</strong></div>
                <div className="rounded-2xl bg-rose-100 p-4"><div className="text-sm font-bold text-rose-700">HP</div><strong className="text-3xl">{player.hp || 0}/{finalMaxHp}</strong></div>
                <div className="rounded-2xl bg-emerald-100 p-4"><div className="text-sm font-bold text-emerald-700">주사위</div><strong className="text-3xl">{formatDice(effectiveDice)}</strong><div className="text-sm font-bold">최소 {effectiveDice.min} / 합계 +{effectiveDice.totalBonus}</div></div>
                <div className="rounded-2xl bg-violet-100 p-4"><div className="text-sm font-bold text-violet-700">회복 물약</div><strong className="text-3xl">{potions}</strong><div className="text-sm font-bold">사용 시 HP 30 회복</div></div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-500"><Sword size={16} /> 기본 공격력</div>
                  <div className="mt-2 text-3xl font-black">{getPlayerAttackValue()}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">장신구 +{equipmentBonuses.attackBonus} / 버프 +{nextBattleBuff.attack}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-500"><Shield size={16} /> 기본 방어력</div>
                  <div className="mt-2 text-3xl font-black">{getPlayerDefenseValue()}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">장신구 +{equipmentBonuses.defenseBonus} / 버프 +{nextBattleBuff.defense}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-500"><Zap size={16} /> 다음 전투 버프</div>
                  <div className="mt-2 text-lg font-black">공격 +{nextBattleBuff.attack} / 방어 +{nextBattleBuff.defense}</div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <div className="text-sm font-black text-slate-500">주사위 조각 영구 강화</div>
                {difficultyMode === "roguelike" ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-black">
                    {shardBonusLabels.map((label) => <span key={label} className="rounded-xl bg-cyan-100 px-3 py-2 text-cyan-900">{label}</span>)}
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-bold text-slate-500">하드코어 난이도에서는 주사위 조각 영구 강화를 적용하지 않습니다.</p>
                )}
              </div>
            </section>

            <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <h2 className="text-xl font-black">메뉴</h2>
              <div className="mt-4 grid gap-3">
                <button onClick={() => setPhase("equipmentUpgrade")} className="rounded-2xl bg-amber-300 px-4 py-4 font-black text-slate-950 hover:bg-amber-200">장비 강화</button>
                <button onClick={() => setPhase("equipmentManage")} className="rounded-2xl bg-violet-300 px-4 py-4 font-black text-violet-950 hover:bg-violet-200">장비 관리</button>
                <button onClick={() => setPhase("diceUpgrade")} className="rounded-2xl bg-cyan-300 px-4 py-4 font-black text-slate-950 hover:bg-cyan-200">주사위 강화</button>
                <button onClick={() => setPhase("shop")} className="rounded-2xl bg-emerald-300 px-4 py-4 font-black text-emerald-950 hover:bg-emerald-200">상점</button>
                {difficultyMode === "roguelike" ? (
                  <button onClick={() => setPhase("diceShardShop")} className="rounded-2xl bg-indigo-300 px-4 py-4 font-black text-indigo-950 hover:bg-indigo-200">주사위 조각 상점</button>
                ) : (
                  <div className="rounded-2xl border border-white/15 px-4 py-4 text-sm font-black text-slate-300">하드코어 난이도에서는 사용할 수 없습니다.</div>
                )}
                <button onClick={usePotion} disabled={potions <= 0 || player.hp >= finalMaxHp} className="rounded-2xl bg-rose-300 px-4 py-4 font-black text-rose-950 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-45">회복 물약 사용</button>
                <button onClick={() => setPhase("floorSelect")} className="rounded-2xl bg-white px-4 py-4 font-black text-slate-950 hover:bg-cyan-100">층 선택</button>
                <button onClick={restartClimb} className="rounded-2xl border border-white/20 px-4 py-4 font-black text-white hover:bg-white/10">새 등반 시작</button>
              </div>
            </aside>
          </main>
        </div>
      </div>
    );
  }

  if (phase === "equipmentManage") {
    const effectiveDice = getEffectivePlayerDice();
    const equipmentBonuses = getCurrentEquipmentBonuses();
    const finalMaxHp = getFinalMaxHp();
    const equippedAccessory = playerEquipment.accessory;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black">장비 관리</h1>
              <p className="mt-2 text-slate-300">무기, 방어구, 장신구 슬롯과 최종 전투 능력치를 확인합니다.</p>
            </div>
            <button onClick={goToTower} className="rounded-2xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-cyan-100">탑으로 돌아가기</button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { slot: "weapon", label: "무기", item: playerEquipment.weapon, effect: "무기 강화로 기본 공격력 증가" },
                { slot: "armor", label: "방어구", item: playerEquipment.armor, effect: "방어구 강화로 기본 방어력 증가" },
                { slot: "accessory", label: "장신구", item: equippedAccessory, effect: getAccessoryEffectText(equippedAccessory) },
              ].map((entry) => (
                <article key={entry.slot} className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
                  <div className="text-sm font-black text-slate-500">{entry.label}</div>
                  <h2 className="mt-2 text-2xl font-black">{entry.item?.name || "비어 있음"}</h2>
                  <p className="mt-2 text-sm font-bold text-slate-600">{entry.item?.description || "장신구를 획득하면 이 슬롯에 장착할 수 있습니다."}</p>
                  <div className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black">{entry.effect}</div>
                  {entry.slot === "accessory" && equippedAccessory && (
                    <button onClick={unequipAccessory} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white hover:bg-slate-700">장신구 해제</button>
                  )}
                </article>
              ))}
            </div>

            <aside className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
              <h2 className="text-2xl font-black">최종 능력치</h2>
              <div className="mt-4 grid gap-2 text-sm font-black">
                <div className="rounded-xl bg-slate-100 p-3">공격력: {getPlayerAttackValue()}</div>
                <div className="rounded-xl bg-slate-100 p-3">방어력: {getPlayerDefenseValue()}</div>
                <div className="rounded-xl bg-slate-100 p-3">최대 HP: {finalMaxHp}</div>
                <div className="rounded-xl bg-slate-100 p-3">주사위: {formatDice(effectiveDice)}</div>
                <div className="rounded-xl bg-slate-100 p-3">주사위 최소값: {effectiveDice.min}</div>
                <div className="rounded-xl bg-slate-100 p-3">주사위 합계 보정: +{equipmentBonuses.diceTotalBonus}</div>
              </div>
            </aside>
          </div>

          <div className="mt-5 rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <h2 className="text-2xl font-black">보유 장신구</h2>
            {ownedAccessories.length === 0 ? (
              <p className="mt-3 font-bold text-slate-500">아직 획득한 장신구가 없습니다. 5층과 10층 보스를 처치해 보상을 얻으세요.</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {ownedAccessories.map((accessory) => {
                  const equipped = equippedAccessory?.id === accessory.id;
                  return (
                    <article key={accessory.id} className={`rounded-2xl border p-4 ${equipped ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white"}`}>
                      <h3 className="text-xl font-black">{accessory.name}</h3>
                      <p className="mt-2 text-sm font-bold text-slate-600">{accessory.description}</p>
                      <div className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black">{getAccessoryEffectText(accessory)}</div>
                      <button
                        onClick={() => equipAccessory(accessory.id)}
                        disabled={equipped}
                        className="mt-4 w-full rounded-2xl bg-violet-500 px-4 py-3 font-black text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {equipped ? "장착 중" : "장착"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (phase === "diceShardShop") {
    if (difficultyMode !== "roguelike") {
      return (
        <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
          <section className="w-full max-w-2xl rounded-3xl bg-white p-8 text-center text-slate-950 shadow-2xl">
            <h1 className="text-4xl font-black">주사위 조각 상점</h1>
            <p className="mt-3 font-bold text-slate-600">하드코어 난이도에서는 사용할 수 없습니다.</p>
            <button onClick={goToTower} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-700">탑으로 돌아가기</button>
          </section>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black">주사위 조각 상점</h1>
              <p className="mt-2 text-slate-300">로그라이크 전용 영구 강화 상점입니다. 보유 주사위 조각 {diceShards}개</p>
            </div>
            <button onClick={goToTower} className="rounded-2xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-cyan-100">탑으로 돌아가기</button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {diceShardShopItems.map((item) => {
              const currentLevel = diceShardUpgrades[item.stat] || 0;
              const maxed = currentLevel >= item.maxLevel;
              const canBuy = !maxed && diceShards >= item.cost;
              const currentEffect = item.stat === "maxHpLevel" ? currentLevel * item.effectValue : currentLevel;
              return (
                <article key={item.id} className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
                  <h2 className="text-2xl font-black">{item.name}</h2>
                  <p className="mt-2 min-h-12 text-sm font-bold text-slate-600">{item.description}</p>
                  <div className="mt-4 grid gap-2 text-sm font-black">
                    <div className="rounded-xl bg-slate-100 px-3 py-2">현재 레벨: {currentLevel} / {item.maxLevel}</div>
                    <div className="rounded-xl bg-slate-100 px-3 py-2">효과: {item.effectText} +{currentEffect}</div>
                    <div className="rounded-xl bg-slate-100 px-3 py-2">다음 구매 효과: {item.effectText} +{item.effectValue}</div>
                    <div className="rounded-xl bg-indigo-100 px-3 py-2 text-indigo-900">비용: 주사위 조각 {item.cost}개</div>
                  </div>
                  <button
                    onClick={() => buyDiceShardShopItem(item.id)}
                    disabled={!canBuy}
                    className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {maxed ? "최대 강화 완료" : "구매"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  if (phase === "equipmentUpgrade") {
    const baseAttack = Number(player.baseAttack || player.attack || 3);
    const baseDefense = Number(player.baseDefense || player.defense || 2);
    const baseMaxHp = Number(player.maxHp || player.baseMaxHp || 100);
    const rows = [
      { id: "weapon", title: "무기 강화", desc: `현재 공격력: ${baseAttack} / 강화 후 공격력: ${baseAttack + 1}`, cost: "50G / 장비 재료 1" },
      { id: "armor", title: "방어구 강화", desc: `현재 방어력: ${baseDefense} / 강화 후 방어력: ${baseDefense + 1}`, cost: "50G / 장비 재료 1" },
      { id: "hp", title: "체력 강화", desc: `현재 최대 체력: ${baseMaxHp} / 강화 후 최대 체력: ${baseMaxHp + 10}`, cost: "40G / 장비 재료 1" },
    ];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <h1 className="text-4xl font-black">장비 강화</h1>
          <p className="mt-2 text-slate-300">골드 {player.gold || 0} / 강화 재료 {upgradeMaterial}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {rows.map((row) => (
              <article key={row.id} className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
                <h2 className="text-2xl font-black">{row.title}</h2>
                <p className="mt-2 font-semibold text-slate-600">{row.desc}</p>
                <div className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black">{row.cost}</div>
                <button onClick={() => upgradeEquipment(row.id)} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white hover:bg-slate-700">강화</button>
              </article>
            ))}
          </div>
          <button onClick={goToTower} className="mt-5 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-cyan-100">탑으로 돌아가기</button>
        </section>
      </div>
    );
  }

  if (phase === "diceUpgrade") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <h1 className="text-4xl font-black">주사위 강화</h1>
          <p className="mt-2 text-slate-300">현재 주사위: {formatDice(playerDice)} / 최소 눈금 {playerDice.min} / 골드 {player.gold || 0} / 주사위 강화 재료 {diceUpgradeMaterial}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { id: "count", title: "주사위 개수 +1", value: `${playerDice.count}/${DICE_UPGRADE_LIMITS.count}` },
              { id: "sides", title: "주사위 최대 눈금 +1", value: `${playerDice.sides}/${DICE_UPGRADE_LIMITS.sides}` },
              { id: "min", title: "최소 주사위값 +1", value: `${playerDice.min}/${DICE_UPGRADE_LIMITS.min}` },
            ].map((item) => (
              <article key={item.id} className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
                <h2 className="text-2xl font-black">{item.title}</h2>
                <div className="mt-3 text-3xl font-black">{item.value}</div>
                <div className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black">100G / 주사위 재료 1</div>
                <button onClick={() => upgradeDice(item.id)} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white hover:bg-slate-700">강화</button>
              </article>
            ))}
          </div>
          <button onClick={goToTower} className="mt-5 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-cyan-100">탑으로 돌아가기</button>
        </section>
      </div>
    );
  }

  if (phase === "shop") {
    const items = [
      { id: "heal30", title: "체력 30 회복", cost: "25G" },
      { id: "healHalf", title: "최대 체력의 50% 회복", cost: "55G" },
      { id: "attackBuff", title: "다음 전투 공격력 +2", cost: "45G" },
      { id: "defenseBuff", title: "다음 전투 방어력 +2", cost: "45G" },
    ];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <h1 className="text-4xl font-black">상점</h1>
          <p className="mt-2 text-slate-300">카드 상점 대신 회복과 다음 전투 버프를 구매합니다. 골드 {player.gold || 0}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {items.map((item) => (
              <article key={item.id} className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
                <h2 className="text-xl font-black">{item.title}</h2>
                <div className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black">{item.cost}</div>
                <button onClick={() => buyTowerShopItem(item.id)} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white hover:bg-slate-700">구매</button>
              </article>
            ))}
          </div>
          <button onClick={goToTower} className="mt-5 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-cyan-100">탑으로 돌아가기</button>
        </section>
      </div>
    );
  }

  if (phase === "floorSelect") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black">층 선택</h1>
              <p className="mt-2 text-slate-300">이번 등반에서 각 층은 한 번만 도전할 수 있습니다. 패배하면 새 등반은 1층부터 시작합니다.</p>
            </div>
            <button onClick={goToTower} className="rounded-2xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-cyan-100">탑으로 돌아가기</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {floorList.map((floor) => {
              const enemy = createTowerEnemyForFloor(floor);
              const unlocked = isTowerFloorUnlocked(floor);
              const cleared = clearedFloors.includes(floor);
              const attempted = attemptedFloors.includes(floor) && !cleared;
              const challengeable = canChallengeFloor(floor);
              const boss = isBossFloor(floor);
              const statusLabel = cleared ? "클리어 완료" : attempted ? "재도전 불가" : !unlocked ? "잠김" : boss ? `${getBossFloorLabel(floor)} / 도전 가능` : "도전 가능";
              return (
                <button
                  key={floor}
                  type="button"
                  onClick={() => startBattleForFloor(floor)}
                  disabled={!challengeable}
                  className={`rounded-3xl p-5 text-left shadow-xl transition ${
                    challengeable
                      ? boss
                        ? "bg-amber-100 text-slate-950 hover:-translate-y-1"
                        : "bg-white text-slate-950 hover:-translate-y-1"
                      : "bg-white/10 text-slate-400"
                  } disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-2xl">{floor}층</strong>
                    {cleared ? <CheckCircle2 size={22} /> : !unlocked ? <Lock size={22} /> : boss ? <Crown size={22} /> : <Sword size={22} />}
                  </div>
                  <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${challengeable ? "bg-slate-950 text-white" : "bg-white/10 text-slate-300"}`}>{statusLabel}</div>
                  <div className="mt-3 font-black">{enemy.name}</div>
                  <div className="mt-2 text-sm">HP {enemy.maxHp} / 공격 {enemy.baseAttack}</div>
                  <div className="mt-1 text-sm">{enemy.diceCount}D{enemy.diceSides}</div>
                  {boss && (
                    <div className="mt-3 rounded-xl bg-amber-200/70 px-3 py-2 text-xs font-black text-amber-950">
                      보상: 주사위 강화 재료 + 장신구
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  if (phase === "battle") {
    const enemyHpPercent = currentEnemy ? Math.max(0, Math.min(100, (currentEnemy.hp / currentEnemy.maxHp) * 100)) : 0;
    const finalMaxHp = getFinalMaxHp();
    const effectiveDice = getEffectivePlayerDice();
    const playerHpPercent = Math.max(0, Math.min(100, ((player.hp || 0) / Math.max(1, finalMaxHp)) * 100));
    const isAttackTurn = battlePhase === "playerAttack";
    const isDefenseTurn = battlePhase === "playerDefense";
    const bossLabel = getBossFloorLabel(selectedFloor);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="mx-auto max-w-6xl">
          <header className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Dice Battle</div>
                <h1 className="text-4xl font-black">{selectedFloor}층 전투</h1>
                {bossLabel && (
                  <p className="mt-2 font-black text-amber-200">
                    {selectedFloor === 10 ? "최종 보스 층 - 드래곤을 쓰러뜨리면 이번 탑을 정복합니다." : "중간보스 층 - 탑 수문장이 길을 막고 있습니다."}
                  </p>
                )}
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm font-black ${isAttackTurn ? "bg-amber-300 text-slate-950" : "bg-cyan-300 text-cyan-950"}`}>
                {battleTurn}턴 · 현재 턴: {isAttackTurn ? "공격턴" : "수비턴"}
              </div>
            </div>
          </header>

          <main className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
              <div className="text-sm font-black text-slate-500">플레이어</div>
              <h2 className="mt-1 text-3xl font-black">등반자</h2>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-rose-500" style={{ width: `${playerHpPercent}%` }} /></div>
              <div className="mt-2 font-black">HP {player.hp}/{finalMaxHp}</div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-bold">
                <div className="rounded-xl bg-slate-100 p-3">공격 {getPlayerAttackValue()}</div>
                <div className="rounded-xl bg-slate-100 p-3">방어 {getPlayerDefenseValue()}</div>
                <div className="rounded-xl bg-slate-100 p-3">{formatDice(effectiveDice)} / 최소 {effectiveDice.min} / 합계 +{effectiveDice.totalBonus}</div>
              </div>
              <button
                onClick={usePotion}
                disabled={potions <= 0 || player.hp >= finalMaxHp || isResolvingAction}
                className="mt-4 rounded-2xl bg-rose-300 px-4 py-3 font-black text-rose-950 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-45"
              >
                회복 물약 사용 · 보유 {potions}개 · HP 30 회복
              </button>
            </article>

            <article className="rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
              <div className="text-sm font-black text-slate-500">적</div>
              <div className="mt-2 flex items-center gap-4">
                <span className="grid h-20 w-20 place-items-center rounded-2xl bg-slate-100">
                  <MonsterImage monster={currentEnemy} className="h-16 w-16 object-contain" fallbackClassName="text-4xl" />
                </span>
                <h2 className="text-3xl font-black">{currentEnemy?.name}</h2>
              </div>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-slate-950" style={{ width: `${enemyHpPercent}%` }} /></div>
              <div className="mt-2 font-black">HP {currentEnemy?.hp}/{currentEnemy?.maxHp}</div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-bold">
                <div className="rounded-xl bg-slate-100 p-3">공격 {currentEnemy?.baseAttack}</div>
                <div className="rounded-xl bg-slate-100 p-3">{currentEnemy?.diceCount}D{currentEnemy?.diceSides}</div>
                <div className="rounded-xl bg-slate-100 p-3">보상 {currentEnemy?.goldReward}G / 장비 재료 {currentEnemy?.materialReward}</div>
              </div>
            </article>
          </main>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <BattleHighlightPanel highlight={battleHighlight} />

              <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-black">최근 주사위 결과</h2>
                    <p className="mt-1 text-sm text-slate-400">플레이어 공격, 적 공격, 플레이어 방어 주사위를 구분해서 표시합니다.</p>
                  </div>
                  {lastDiceResult?.isDouble && <span className="rounded-2xl bg-amber-300 px-3 py-2 text-sm font-black text-slate-950">더블!</span>}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <DiceRollDisplay title="플레이어 공격 주사위" roll={lastPlayerAttackRoll} tone="player" />
                  <DiceRollDisplay title="적 공격 주사위" roll={lastEnemyAttackRoll} tone="enemy" />
                  <DiceRollDisplay title="플레이어 방어 주사위" roll={lastPlayerDefenseRoll} tone="defense" />
                </div>
                <div className="mt-4 grid gap-2 text-sm font-black md:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    공격 결과: {lastDiceResults.playerAttack ? `${lastDiceResults.playerAttack.finalDamage} 피해${lastDiceResults.playerAttack.isDouble ? " / 더블 치명타" : ""}` : "-"}
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    적 공격값: {lastDiceResults.enemyAttack ? `${lastDiceResults.enemyAttack.attackValue}${lastDiceResults.enemyAttack.isDouble ? " / 적 더블" : ""}` : "-"}
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    방어 결과: {lastDiceResults.playerDefense ? `${lastDiceResults.playerDefense.defenseValue} 방어 / 피해 ${lastDiceResults.playerDefense.finalDamageTaken}${lastDiceResults.playerDefense.isDouble ? " / 더블 강화 방어" : ""}` : "-"}
                  </div>
                </div>
              </section>

              <section className={`rounded-3xl border p-5 shadow-xl ${isAttackTurn ? "border-amber-200/40 bg-amber-300/15" : "border-cyan-200/40 bg-cyan-300/15"}`}>
                <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-200">
                  {isAttackTurn ? "공격턴" : "수비턴"}
                </div>
                <h2 className="mt-2 text-2xl font-black">
                  {isAttackTurn ? "공격 주사위를 굴려 적에게 피해를 줍니다." : "방어 주사위를 굴려 적 공격을 막습니다."}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-300">
                  {isAttackTurn
                    ? `공격 피해 = 기본공격력 ${getPlayerAttackValue()} x 주사위 합계${" / 더블 시 x 1.5"}`
                    : `적 공격값 ${pendingEnemyAttack?.attackValue ?? "-"}을(를) 방어합니다. 더블 방어 시 x 1.5`}
                </p>
                <button
                  onClick={isAttackTurn ? rollPlayerAttackDice : rollPlayerDefenseDice}
                  disabled={(isAttackTurn && battlePhase !== "playerAttack") || (isDefenseTurn && battlePhase !== "playerDefense") || isResolvingAction}
                  className={`mt-4 rounded-2xl px-5 py-4 text-lg font-black shadow-lg disabled:cursor-not-allowed disabled:opacity-45 ${
                    isAttackTurn ? "bg-amber-300 text-slate-950 hover:bg-amber-200" : "bg-cyan-300 text-cyan-950 hover:bg-cyan-200"
                  }`}
                >
                  {isResolvingAction ? "처리 중..." : isAttackTurn ? "공격 주사위 굴리기" : "방어 주사위 굴리기"}
                </button>
              </section>
            </div>

            <BattleLogPanel logs={battleLogs} />
          </section>
        </section>
      </div>
    );
  }

  if (phase === "battleResult") {
    const won = battleResult === "win";
    const resultFloor = battleRewardSummary?.floor || selectedFloor;
    const resultTitle = won
      ? resultFloor === 10
        ? "탑 정복!"
        : resultFloor === 5
          ? "중간보스 처치!"
          : "승리!"
      : "등반 실패";
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="w-full max-w-5xl">
          <div className="rounded-3xl bg-white p-8 text-center text-slate-950 shadow-2xl">
            {won ? <Trophy className="mx-auto mb-3 h-12 w-12 text-yellow-600" /> : <Skull className="mx-auto mb-3 h-12 w-12" />}
            <h1 className="text-4xl font-black">{resultTitle}</h1>
            <p className="mt-2 text-slate-600">{resultFloor}층 전투 결과</p>
            {won && (
              <div className="mt-5 grid gap-2 rounded-2xl bg-slate-100 p-4 text-left text-sm font-bold">
                <div>{resultFloor}층을 클리어했습니다.</div>
                <div>획득 골드: {battleRewardSummary?.gold || 0}</div>
                <div>획득 장비 강화 재료: {battleRewardSummary?.material || 0}</div>
                {(battleRewardSummary?.diceMaterial || 0) > 0 && <div>획득 주사위 강화 재료: {battleRewardSummary.diceMaterial}</div>}
                {battleRewardSummary?.potionDropped && <div>추가 보상: 회복 물약 1개 획득!</div>}
                {battleRewardSummary?.accessory && (
                  <div>
                    장신구 {battleRewardSummary.accessoryAlreadyOwned ? "이미 보유" : "획득"}: {battleRewardSummary.accessory.name}
                  </div>
                )}
                <div>새로 해금된 층: {battleRewardSummary?.newlyUnlocked ? `${battleRewardSummary.newlyUnlocked}층` : "없음"}</div>
              </div>
            )}
            {!won && (
              <div className="mt-5 grid gap-2 rounded-2xl bg-slate-100 p-4 text-left text-sm font-bold">
                {battleRewardSummary?.difficultyMode === "roguelike" ? (
                  <>
                    <div>하지만 경험은 남았습니다.</div>
                    <div>획득한 주사위 조각: {battleRewardSummary?.diceShards || 0}개</div>
                    <div>주사위 조각 상점에서 다음 등반을 준비할 수 있습니다.</div>
                  </>
                ) : (
                  <>
                    <div>하드코어 난이도에서는 패배 보상이 없습니다.</div>
                    <div>모든 진행은 처음부터 다시 시작됩니다.</div>
                  </>
                )}
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {won ? (
                <button onClick={goToTower} className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700">탑으로 돌아가기</button>
              ) : battleRewardSummary?.difficultyMode === "roguelike" ? (
                <>
                  <button onClick={() => startNewClimb(difficultyMode || "roguelike", { applyPendingBonuses: false })} className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700">탑으로 돌아가기</button>
                  <button onClick={restartClimb} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-950 hover:bg-slate-100">새 등반 시작</button>
                  <button onClick={() => setPhase("diceShardShop")} className="rounded-2xl bg-indigo-500 px-5 py-3 font-bold text-white hover:bg-indigo-400">주사위 조각 상점으로 이동</button>
                </>
              ) : (
                <>
                  <button onClick={restartClimb} className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700">새 등반 시작</button>
                  <button onClick={() => setPhase("difficultySelect")} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-950 hover:bg-slate-100">난이도 선택으로 돌아가기</button>
                  <button onClick={returnToTitle} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-950 hover:bg-slate-100">처음 화면으로</button>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
            <BattleHighlightPanel highlight={battleHighlight} />
            <BattleLogPanel logs={battleLogs} />
          </div>
        </section>
      </div>
    );
  }

  if (phase === "start") {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="w-full max-w-3xl text-center">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl border border-amber-200/40 bg-amber-200/10 text-4xl shadow-[0_0_50px_rgba(251,191,36,0.2)]">
            ✦
          </div>
          <div className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">test1 merged build</div>
          <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">Deck Spire Prototype</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            직업을 선택하고 10깊이 던전을 최종 보스까지 공략하는 카드 전투 로그라이크입니다.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm font-bold text-slate-200">
            <span className="rounded-xl bg-white/10 px-3 py-2">특성 포인트 {normalizePlayerData(playerData).traitPoint}</span>
            <span className="rounded-xl bg-white/10 px-3 py-2">보스 클리어 {normalizePlayerData(playerData).clearedBossFloors.length}층</span>
            {hasSavedRun && <span className="rounded-xl bg-emerald-300/15 px-3 py-2 text-emerald-100">저장된 진행상황 있음</span>}
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleGameStart}
              className="rounded-2xl bg-amber-300 px-8 py-4 text-lg font-black text-slate-950 shadow-lg hover:bg-amber-200"
            >
              {hasSavedRun ? "이어하기" : "게임 시작"}
            </button>
            <button
              type="button"
              onClick={() => setPhase("how-to-play")}
              className="rounded-2xl border border-white/15 bg-white/10 px-8 py-4 text-lg font-black text-white hover:bg-white/15"
            >
              게임 방법
            </button>
            {hasSavedRun && (
              <button
                type="button"
                onClick={handleClearRunProgress}
                className="rounded-2xl border border-white/15 bg-white/10 px-8 py-4 text-lg font-black text-white hover:bg-white/15"
              >
                진행 초기화
              </button>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (phase === "how-to-play") {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Guide</div>
          <h1 className="mt-2 text-4xl font-black">게임 방법</h1>
          <div className="mt-6 grid gap-3">
            {[
              "게임 시작을 누르면 바로 탑 화면으로 이동합니다.",
              "탑 화면에서 장비 강화, 주사위 강화, 상점, 층 선택을 고릅니다.",
              "해금된 층을 선택하면 해당 층의 적과 주사위 전투를 시작합니다.",
              "공격턴에는 기본공격력에 주사위 합계를 곱해 피해를 줍니다.",
              "수비턴에는 기본방어력에 주사위 합계를 곱해 적 공격을 막습니다.",
              "승리하면 골드와 재료를 얻고 다음 층이 해금됩니다.",
              "패배하면 해금은 늘어나지 않지만 탑으로 돌아가 다시 준비할 수 있습니다.",
            ].map((line, index) => (
              <div key={line} className="flex items-center gap-3 rounded-2xl bg-white/8 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-300 font-black text-slate-950">{index + 1}</span>
                <span className="font-bold text-slate-200">{line}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPhase("title")}
            className="mt-6 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-cyan-100"
          >
            시작 화면으로
          </button>
        </section>
      </div>
    );
  }

  if (phase === "character-select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Choose Class</div>
              <h1 className="text-4xl font-black">직업 선택</h1>
            </div>
            <button onClick={() => setPhase("start")} className="rounded-2xl bg-white px-4 py-3 font-black text-slate-950 hover:bg-cyan-100">
              시작 화면
            </button>
          </header>

          <div className="character-select-grid">
            {Object.values(CHARACTER_CLASSES).map((character) => {
              const selected = selectedCharacterId === character.id;
              return (
                <motion.button
                  key={character.id}
                  whileHover={{ y: -10, scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setHoveredCharacterId(character.id)}
                  onHoverEnd={() => setHoveredCharacterId(null)}
                  onClick={() => setSelectedCharacterId(character.id)}
                  className={`character-card ${character.id} ${selected ? "is-selected" : ""}`}
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${character.color}`} />
                  <div className="relative z-10">
                    <div className="character-image-wrap">
                      <CharacterImage character={character} />
                    </div>
                    <div className="text-2xl font-black">{character.name}</div>
                    <p className="mt-2 min-h-12 text-sm text-slate-200">{character.style}</p>
                    <div className="mt-5 grid grid-cols-2 gap-2 text-sm font-bold">
                      <div className="rounded-xl bg-white/80 px-3 py-2 text-slate-950">체력 {character.hp}</div>
                      <div className="rounded-xl bg-cyan-100 px-3 py-2 text-slate-950">에너지 {character.maxEnergy}</div>
                      <div className="rounded-xl bg-white/80 px-3 py-2 text-slate-950">공격 {character.attack}</div>
                      <div className="rounded-xl bg-white/80 px-3 py-2 text-slate-950">방어 {character.defense}</div>
                    </div>
                    <p className="mt-4 text-xs leading-relaxed text-slate-200">{character.passive}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-2xl">
            <div className="text-sm font-bold text-slate-500">선택 캐릭터 상세</div>
            <div className="mt-1 text-2xl font-black">
              {activeCharacter.icon} {activeCharacter.name}
            </div>
            <div className="mt-2 text-sm text-slate-600">턴 예시: {speedPreview}</div>
            <button
              type="button"
              onClick={() => initializeRun(selectedCharacterId || activeCharacter.id)}
              className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-700"
            >
              선택 확정 후 던전 입장
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "dungeon") {
    const nextDepth = Math.min(maxDepth, currentDepth + 1);
    const nextRoomType = currentDepth >= maxDepth ? null : getRoomTypeByDepth(nextDepth, maxDepth);
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <DungeonProgressPanel
            currentDepth={currentDepth}
            maxDepth={maxDepth}
            currentRoomType={currentRoomType}
            isRoomCleared={isRoomCleared}
          />
          <div className="mt-5 rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <div className="text-sm font-black text-slate-500">현재 상태</div>
            <h1 className="mt-1 text-3xl font-black">{getRoomTypeLabel(currentRoomType)} 클리어</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {nextRoomType ? `다음 깊이 ${nextDepth}/${maxDepth}: ${getRoomTypeLabel(nextRoomType)}` : "최종 보스 처치 결과를 확인하세요."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={goToNextRoom}
                disabled={!isRoomCleared}
                className="rounded-2xl bg-cyan-300 px-5 py-3 font-black text-slate-950 shadow-lg hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
              >
                다음 방으로 이동
              </button>
              <button
                type="button"
                onClick={restart}
                className="rounded-2xl border border-slate-200 px-5 py-3 font-black text-slate-950 hover:bg-slate-100"
              >
                처음 화면으로
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (phase === "runClear") {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="w-full max-w-2xl rounded-3xl bg-white p-8 text-center text-slate-950 shadow-2xl">
          <Trophy className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
          <h1 className="text-4xl font-black">던전 클리어</h1>
          <p className="mt-2 text-slate-600">최종 보스를 처치하고 깊이 {maxDepth}/{maxDepth}까지 한 판을 완료했습니다.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={restart} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-950 hover:bg-slate-100">처음 화면으로</button>
            <button onClick={restartRun} className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700">다시 시작</button>
          </div>
        </section>
      </div>
    );
  }

  if (phase === "gameOver") {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <section className="w-full max-w-2xl rounded-3xl bg-white p-8 text-center text-slate-950 shadow-2xl">
          <Skull className="mx-auto mb-3 h-12 w-12" />
          <h1 className="text-4xl font-black">게임 오버</h1>
          <p className="mt-2 text-slate-600">플레이어 체력이 0이 되어 던전 진행이 종료되었습니다. 특성 데이터는 유지됩니다.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={restart} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-950 hover:bg-slate-100">처음 화면으로</button>
            <button onClick={restartRun} className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700">다시 도전</button>
          </div>
        </section>
      </div>
    );
  }

  if (phase === "towerMap") {
    return (
      <TowerMapScreen
        player={player}
        playerData={playerData}
        currentClassTheme={currentClassTheme}
        deck={deck}
        selectedFloor={selectedFloor}
        unlockedFloors={unlockedFloors}
        clearedFloors={clearedFloors}
        currentFloor={currentFloor}
        onSelectFloor={setSelectedFloor}
        onEnterFloor={enterSelectedFloor}
        onToggleDeck={() => setShowDeckManager((value) => !value)}
        onOpenTraits={() => openTraitScreen("towerMap")}
        onSave={handleManualSave}
        onLoad={handleManualLoad}
        showDeckManager={showDeckManager}
        onCharacterSelect={() => setPhase("character-select")}
        onRestart={restart}
        deckCount={deckCount}
        inspectedCard={inspectedCard}
        onInspectCard={setInspectedCardId}
        onDismantleCard={handleDismantleCard}
        onUpgradeCard={handleUpgradeCard}
        upgradeCelebration={upgradeCelebration}
      />
    );
  }

  if (phase === "floorMap") {
    return (
      <FloorMapScreen
        floor={currentFloor}
        player={player}
        playerData={playerData}
        currentClassTheme={currentClassTheme}
        deck={deck}
        floorNodes={currentFloorNodes}
        clearedNodeIds={currentClearedNodeIds}
        floorUnlocked={currentFloorUnlocked}
        floorCleared={currentFloorCleared}
        onEnterNode={selectFloorNode}
        onBackToTower={() => {
          setShowDeckManager(false);
          setPhase("towerMap");
        }}
        onToggleDeck={() => setShowDeckManager((value) => !value)}
        onOpenTraits={() => openTraitScreen("floorMap")}
        onSave={handleManualSave}
        onLoad={handleManualLoad}
        showDeckManager={showDeckManager}
        deckCount={deckCount}
        inspectedCard={inspectedCard}
        onInspectCard={setInspectedCardId}
        onDismantleCard={handleDismantleCard}
        onUpgradeCard={handleUpgradeCard}
        upgradeCelebration={upgradeCelebration}
      />
    );
  }

  if (phase === "traits") {
    return (
      <TraitManagementScreen
        playerData={playerData}
        onUpgradeTrait={upgradeTrait}
        onBack={() => setPhase(traitReturnPhase)}
        feedback={traitFeedback}
        lastUpgradedTraitId={lastUpgradedTraitId}
      />
    );
  }

  if (phase === "battle") {
    const isPlayerTurn = initiativeReady && currentActor.type === "player" && !isCardAnimating;
    const canEndTurn = phase === "battle" && isPlayerTurn;
    const canPlayAnyCard = isPlayerTurn && hand.some((cardId) => player.energy >= CARD_POOL[cardId].cost);
    const stageLabel = `던전 깊이 ${currentDepth} / ${maxDepth} · 현재 방: ${getRoomTypeLabel(currentRoomType)}`;
    const combatGauge = normalizeSpeedGauge(speedGauge, enemies);
    const timelineActors = buildCombatTimeline(combatGauge, player, enemies, 6);
    const currentTimelineActor =
      currentActor.type === "enemy" && !isEnemyAlive(enemies[currentActor.index])
        ? null
        : { ...currentActor, current: true };
    const timelineItems = [currentTimelineActor, ...timelineActors].filter(Boolean);
    const enemyTotalHp = aliveEnemies.reduce((sum, entry) => sum + Math.max(0, entry.hp), 0);
    const enemyTotalMaxHp = aliveEnemies.reduce((sum, entry) => sum + entry.maxHp, 0) || 1;
    const commanderEnemy = enemies.find((entry) => isEnemyAlive(entry) && entry.boss) || enemy;
    const commanderIntent = commanderEnemy?.actions?.[commanderEnemy.actionIndex % commanderEnemy.actions.length];
    const encounterRank = selectedStage?.type === "boss" ? "보스" : selectedStage?.type === "elite" ? "정예" : "전투";
    const isBossEncounter = selectedStage?.type === "boss";
    const waveLabel = selectedStage ? (isBossEncounter ? "보스 1/1" : `몬스터 ${aliveEnemies.length}/${enemies.length}`) : "몬스터 1/1";
    const incomingDamage = aliveEnemies.reduce((sum, entry) => {
      const action = entry.actions[entry.actionIndex % entry.actions.length];
      if (action.type !== "attack") return sum;
      const defenseMitigation = Math.floor((player.defense || 0) / 4);
      const damage = Math.max(1, action.value + entry.strength - defenseMitigation);
      const finalDamage = player.vulnerable > 0 ? Math.ceil(damage * 1.5) : damage;
      return sum + Math.max(1, Math.floor(finalDamage * (1 - (player.damageReduction || 0))));
    }, 0);
    const predictedHpLoss = Math.max(0, incomingDamage - player.block);
    const getTimelineLabel = (actor) => {
      if (actor.type === "player") return currentClassTheme.name;
      return enemies[actor.index]?.name || "적";
    };
    const getTimelineSpeed = (actor) => {
      if (actor.type === "player") return player.speed || 0;
      return enemies[actor.index]?.speed || 0;
    };
    const getTimelineGauge = (actor) => {
      if (actor.type === "player") return combatGauge.player;
      return combatGauge.enemies[actor.index] || 0;
    };

    return (
      <div className={`sts-screen ${isBossEncounter ? "is-boss-combat" : ""}`}>
        <AnimatePresence>
          {activeCardAnimation && <UsedCardOverlay key={activeCardAnimation.key} animation={activeCardAnimation} />}
          {enemyAttackAnimation && <EnemyAttackOverlay key={enemyAttackAnimation.key} animation={enemyAttackAnimation} />}
        </AnimatePresence>

        <header className="sts-top-hud">
          <div className="sts-run-left">
            <span className="sts-name">모험대</span>
            <span>{currentClassTheme.name}</span>
            <span className="sts-hp-text"><Heart size={17} /> {player.hp}/{player.maxHp}</span>
            <span><Coins size={16} /> {player.gold}</span>
            <span><TowerControl size={16} /> {stageLabel}</span>
            {currentRoomType === "bossBattle" && <span className="text-amber-200">최종 보스방</span>}
          </div>
          <div className="sts-run-center">
            <button type="button">덱 {drawPile.length}</button>
            <button type="button">버림 {discardPile.length}</button>
            <button type="button">소멸 {exhaustPile.length}</button>
          </div>
          <div className="sts-run-right">
            <span>{turn}턴</span>
            <button type="button">지도</button>
            <button type="button" onClick={restart}><RotateCcw size={15} /> 처음</button>
          </div>
        </header>

        <main className="sts-combat-stage">
          <div className="sts-bg-layer">
            <div className="sts-bg-tower left" />
            <div className="sts-bg-tower mid" />
            <div className="sts-bg-tower right" />
            <div className="sts-floor-plate" />
          </div>

          <section className={`sts-encounter-panel ${isBossEncounter ? "is-boss" : ""}`}>
            <div className="sts-encounter-head">
              <span>{encounterRank}</span>
              <strong>{commanderEnemy?.name || "적"}</strong>
              <em>{waveLabel}</em>
            </div>
            {currentRoomType === "bossBattle" && (
              <div className="mt-2 rounded-xl bg-amber-200/15 px-3 py-2 text-xs font-black text-amber-100">
                이 전투에서 승리하면 던전을 클리어합니다.
              </div>
            )}
            {isBossEncounter && <div className="sts-boss-hp-label">BOSS</div>}
            <div className="sts-encounter-health">
              <i style={{ width: `${Math.max(0, Math.min(100, (enemyTotalHp / enemyTotalMaxHp) * 100))}%` }} />
              <span>{enemyTotalHp}/{enemyTotalMaxHp}</span>
            </div>
            <div className="sts-encounter-units">
              {enemies.map((entry, index) => (
                <button
                  key={`encounter-${entry.id || entry.name}-${index}`}
                  type="button"
                  disabled={!isEnemyTargetable(entry) || isCardAnimating}
                  onClick={() => {
                    if (isEnemyTargetable(entry) && !isCardAnimating) setSelectedEnemyIndex(index);
                  }}
                  className={`${index === safeSelectedEnemyIndex ? "is-selected" : ""} ${!isEnemyAlive(entry) ? "is-down" : ""}`}
                >
                  <span>{entry.name}</span>
                  <b>{entry.hp}/{entry.maxHp}</b>
                </button>
              ))}
            </div>
          </section>

          <aside className="sts-turn-timeline" aria-label="턴 순서">
            <div className="sts-turn-title">
              <Zap size={14} />
              턴 순서
            </div>
            <div className="sts-turn-list">
              {timelineItems.map((actor, index) => {
                const enemyEntry = actor.type === "enemy" ? enemies[actor.index] : null;
                const gaugePercent = Math.max(0, Math.min(100, getTimelineGauge(actor)));
                return (
                  <div
                    key={`${actor.type}-${actor.index ?? "player"}-${index}`}
                    className={`sts-turn-item ${actor.type === "player" ? "is-player" : "is-enemy"} ${actor.current ? "is-current" : ""}`}
                  >
                    <div className="sts-turn-marker">{actor.current ? "현재" : index}</div>
                    <div className="sts-turn-portrait">
                      {actor.type === "player" ? (
                        <CharacterImage character={player.classId ? currentClassTheme : null} className="sts-turn-image" />
                      ) : (
                        <MonsterImage monster={enemyEntry} className="sts-turn-image" fallbackClassName="sts-turn-fallback" />
                      )}
                    </div>
                    <div className="sts-turn-meta">
                      <strong>{getTimelineLabel(actor)}</strong>
                      <span>{actor.current ? "현재 턴" : "예정"} · SPD {getTimelineSpeed(actor)}</span>
                      <div className="sts-turn-gauge">
                        <i style={{ width: `${actor.current ? 100 : gaugePercent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <aside className="sts-target-panel" aria-label="타겟 정보">
            <div className="sts-target-kicker">타겟 정보</div>
            <strong>{enemy.name}</strong>
            <div className="sts-target-grid">
              <span><Heart size={13} /> {enemy.hp}/{enemy.maxHp}</span>
              <span><Zap size={13} /> 속도 {enemy.speed}</span>
              <span><Sword size={13} /> {enemy.attack || commanderIntent?.value || 0}</span>
              <span><Shield size={13} /> 방어 {enemy.defense || enemy.block || 0}</span>
            </div>
            <div className={`sts-target-intent type-${commanderIntent?.type || "attack"}`}>
              {commanderIntent?.type === "attack" ? <Sword size={16} /> : commanderIntent?.type === "block" ? <Shield size={16} /> : <Zap size={16} />}
              <span>{enemyIntent?.text || "행동 대기"}</span>
            </div>
            <div className={`sts-threat-meter ${predictedHpLoss > 0 ? "is-danger" : ""}`}>
              <i style={{ width: `${Math.max(6, Math.min(100, (predictedHpLoss / Math.max(1, player.maxHp)) * 100))}%` }} />
              <span>예상 피해 {predictedHpLoss}</span>
            </div>
          </aside>

          <section className="sts-actor-layer">
            <div ref={playerTargetRef} className={`sts-player-side ${currentActor.type === "player" ? "is-active-turn" : "is-taking-hit"}`}>
              <div className={`sts-damage-preview ${predictedHpLoss > 0 ? "is-danger" : ""}`}>
                받는 피해 {predictedHpLoss}
              </div>
              <motion.div
                animate={
                  playerHitEffect
                    ? { x: [0, -12, 10, -5, 0], rotate: [0, -3, 3, -1, 0], filter: ["brightness(1)", "brightness(1.65)", "brightness(1)"] }
                    : predictedHpLoss > 0
                      ? { filter: ["brightness(1)", "brightness(1.16)", "brightness(1)"] }
                      : { filter: "brightness(1)" }
                }
                transition={{ duration: playerHitEffect ? 0.44 : 1.2, repeat: !playerHitEffect && predictedHpLoss > 0 ? Number.POSITIVE_INFINITY : 0 }}
                className="sts-player-sprite"
              >
                  <CharacterImage character={player.classId ? CHARACTER_CLASSES[player.classId] : null} className="sts-player-image" />
                  <AnimatePresence>{playerHitEffect && <PlayerHitOverlay effect={playerHitEffect} />}</AnimatePresence>
                </motion.div>
              <div className="sts-player-stats">
                <div className="sts-block-badge"><Shield size={18} /> {player.block}</div>
                <div className="sts-health-bar">
                  <div className="sts-hp-fill" style={{ width: `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%` }} />
                  {predictedHpLoss > 0 && (
                    <div
                      className="sts-hp-loss"
                      style={{
                        width: `${Math.max(0, Math.min(100, (predictedHpLoss / player.maxHp) * 100))}%`,
                      }}
                    />
                  )}
                  <span>{player.hp}/{player.maxHp}</span>
                </div>
                <div className="sts-status-row">
                  {player.strength > 0 && <span><Sword size={13} /> 힘 {player.strength}</span>}
                  {player.vulnerable > 0 && <span>취약 {player.vulnerable}</span>}
                  {player.classId === "warrior" && <span>분노 {rageStacks}/3</span>}
                  {player.classId === "mage" && <span>연계 {comboStacks}</span>}
                  {player.classId === "archer" && <span>회피</span>}
                </div>
              </div>
            </div>

            <div className="sts-enemy-side">
              <AnimatePresence>
              {enemies.map((entry, index) => {
                const selected = index === safeSelectedEnemyIndex;
                const defeated = !isEnemyAlive(entry);
                const intent = entry.actions[entry.actionIndex % entry.actions.length];
                const intentIcon = intent.type === "attack" ? <Sword size={20} /> : intent.type === "block" ? <Shield size={20} /> : <Zap size={20} />;
                const intentValue = intent.type === "attack" ? Math.max(0, intent.value + entry.strength) : intent.text;
                return (
                  <motion.button
                    ref={(node) => {
                      enemyActorRefs.current[index] = node;
                    }}
                    key={entry.id || `${entry.name}-${index}`}
                    type="button"
                    disabled={!isEnemyTargetable(entry) || isCardAnimating}
                    onClick={() => {
                      if (isEnemyTargetable(entry) && !isCardAnimating) setSelectedEnemyIndex(index);
                    }}
                    exit={{ opacity: 0, y: 72, scale: 0.72, filter: "blur(5px) brightness(0.6)" }}
                    animate={
                      defeated
                        ? {
                            opacity: 0,
                            y: entry.boss ? 34 : 52,
                            scale: entry.boss ? 1.08 : 0.86,
                            filter: "grayscale(1) blur(2px) brightness(0.62)",
                          }
                        : hitEffects[index]
                        ? { x: [0, -10, 9, -5, 0], filter: ["brightness(1)", "brightness(1.7)", "brightness(1)"] }
                        : { y: selected ? -8 : 0, scale: selected ? (entry.boss ? 1.12 : 1.035) : entry.boss ? 1.08 : 1, opacity: 1 }
                    }
                    transition={{ duration: 0.42, ease: "easeOut" }}
                    className={`sts-enemy-actor ${selected ? "is-targeted" : ""} ${
                      entry.boss ? "is-boss" : ""
                    } ${
                      currentActor.type === "enemy" && currentActor.index === index && currentActor.actionType === "attack" ? "is-attacking" : ""
                    } ${
                      currentActor.type === "enemy" && currentActor.index === index && currentActor.actionType === "block" ? "is-guarding" : ""
                    } ${
                      currentActor.type === "enemy" && currentActor.index === index && ["buff", "debuff"].includes(currentActor.actionType) ? "is-casting" : ""
                    } ${defeated ? "is-defeated" : ""}`}
                  >
                    {entry.boss && intent.warning && <div className="sts-boss-warning">{intent.warning}</div>}
                    <div className={`sts-intent-badge type-${intent.type}`}>
                      {intentIcon}
                      <strong>{intentValue}</strong>
                    </div>
                    <div className="sts-enemy-sprite-wrap">
                      <MonsterImage monster={entry} className="sts-enemy-image" fallbackClassName="sts-enemy-fallback" />
                      {defeated && <MonsterDeathEffect enemy={entry} />}
                      <AnimatePresence>{hitEffects[index] && <HitEffect effect={hitEffects[index]} />}</AnimatePresence>
                    </div>
                    <div className="sts-enemy-name">{entry.name}</div>
                    <div className="sts-enemy-health">
                      <div className="sts-hp-fill" style={{ width: `${Math.max(0, Math.min(100, (entry.hp / entry.maxHp) * 100))}%` }} />
                      <span>{entry.hp}/{entry.maxHp}</span>
                    </div>
                    <div className="sts-status-row enemy">
                      {entry.block > 0 && <span><Shield size={13} /> {entry.block}</span>}
                      {entry.defense > 0 && <span><Shield size={13} /> DEF {entry.defense}</span>}
                      {entry.strength > 0 && <span><Sword size={13} /> {entry.strength}</span>}
                      {entry.vulnerable > 0 && <span>취약 {entry.vulnerable}</span>}
                    </div>
                  </motion.button>
                );
              })}
              </AnimatePresence>
            </div>
          </section>

          <section className="sts-vfx-layer">
            <AnimatePresence mode="wait">
              {hoveredCombatCard && (
                <motion.div
                  key={hoveredCombatCard.id}
                  initial={{ opacity: 0, y: 16, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.94 }}
                  className="sts-card-preview"
                >
                  <CardDetailPanel card={hoveredCombatCard} targetName={enemy.name} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="sts-log-strip">
            {log.slice(0, 2).map((item, index) => (
              <div key={`${item}-${index}`}>{item}</div>
            ))}
          </section>
        </main>

        <footer className="sts-bottom-bar">
          <button type="button" className="sts-pile-button">덱 <strong>{drawPile.length}</strong></button>
          <div className="sts-energy-orb">
            <span>{player.energy}/{player.maxEnergy}</span>
          </div>
          <section className="sts-hand-zone">
            {hand.map((cardId, index) => {
              const centerOffset = index - (hand.length - 1) / 2;
              const rotate = centerOffset * 4;
              const drop = Math.abs(centerOffset) * 5;
              const isAnimatingSource = activeCardAnimation?.handIndex === index && activeCardAnimation?.cardId === cardId;
              return (
                <div
                  key={`${cardId}-${index}-${turn}`}
                  className={`sts-hand-card ${index === 0 ? "" : "is-overlapped"}`}
                  style={{
                    zIndex: 30 + index,
                    transform: `translateY(${drop}px) rotate(${rotate}deg)`,
                    opacity: isAnimatingSource ? 0 : 1,
                  }}
                >
                  <Card
                    cardId={cardId}
                    variant="hand"
                    disabled={!isPlayerTurn || player.energy < CARD_POOL[cardId].cost}
                    onInspect={setHoveredCombatCardId}
                    onInspectEnd={clearHoveredCombatCard}
                    onClick={(clickEvent) => playCard(cardId, index, clickEvent)}
                    classId={player.classId}
                  />
                </div>
              );
            })}
            {hand.length === 0 && <div className="sts-empty-hand">손패가 없습니다.</div>}
          </section>
          <button type="button" className="sts-pile-button" ref={discardPileRef}>버림 <strong>{discardPile.length}</strong></button>
          <button type="button" className="sts-pile-button">소멸 <strong>{exhaustPile.length}</strong></button>
          <button
            type="button"
            onClick={enemyTurn}
            disabled={!canEndTurn}
            className={`sts-end-turn ${canPlayAnyCard ? "" : "is-recommended"}`}
          >
            턴 종료
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
      <AnimatePresence>
        {activeCardAnimation && <UsedCardOverlay key={activeCardAnimation.key} animation={activeCardAnimation} />}
      </AnimatePresence>
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <Sparkles size={16} /> Prototype MVP
            </div>
            <h1 className="text-2xl font-black tracking-tight md:text-4xl">Deck Spire Prototype</h1>
            <p className="mt-1 text-sm text-slate-300">카드 전투 후 보상을 선택하고 다음 전투로 이어지는 로그라이크 기본 구조</p>
          </div>
          <button onClick={restart} className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-bold text-slate-950 shadow-lg hover:bg-cyan-100">
            <RotateCcw size={18} /> 다시 시작
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr_280px]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl">
            <h2 className="mb-3 text-lg font-bold">플레이어</h2>
            <div className="rounded-2xl bg-white p-4 text-slate-900 shadow-lg">
              <div className="battle-character-portrait">
                <CharacterImage character={player.classId ? CHARACTER_CLASSES[player.classId] : null} className="battle-character-image" />
              </div>
              <div className="mb-3 flex items-center justify-between">
                <div className="font-black">{player.classId ? CHARACTER_CLASSES[player.classId].name : "캐릭터 미선택"}</div>
                <Heart size={20} />
              </div>
              <div className="mb-2 flex justify-between text-sm font-bold">
                <span>HP</span>
                <span>{player.hp}/{player.maxHp}</span>
              </div>
              <HpBar current={player.hp} max={player.maxHp} />
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-slate-100 p-3">
                  <div className="text-slate-500">방어(기본)</div>
                  <div className="flex items-center gap-1 text-lg font-black"><Shield size={16} /> {player.defense}</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-3">
                  <div className="text-slate-500">에너지</div>
                  <div className="flex items-center gap-1 text-lg font-black"><Zap size={16} /> {player.energy}/{player.maxEnergy}</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-3">
                  <div className="text-slate-500">공격(기본)</div>
                  <div className="text-lg font-black">{player.attack}</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-3">
                  <div className="text-slate-500">속도</div>
                  <div className="text-lg font-black">{player.speed} ⚡</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-3">
                  <div className="text-slate-500">골드</div>
                  <div className="flex items-center gap-1 text-lg font-black"><Coins size={16} /> {player.gold}</div>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-slate-100 p-3 text-xs text-slate-700">
                <div>현재 방어도: {player.block}</div>
                <div>덱 카드: {deck.length}</div>
                <div>손패 카드: {hand.length}</div>
                <div>힘 보너스: +{player.strength}</div>
                <div>취약: {player.vulnerable}</div>
                {player.classId === "warrior" && <div>분노 스택: {rageStacks}/3</div>}
                {player.classId === "mage" && <div>연계 스택: {comboStacks}</div>}
                {player.classId === "archer" && <div>패시브: 회피 성공 시 반격</div>}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <h3 className="mb-2 font-bold">덱 구성</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div>전체 카드: {deck.length}</div>
                <div>드로우 더미: {drawPile.length}</div>
                <div>버린 더미: {discardPile.length}</div>
              </div>
              <div className="mt-3 max-h-48 space-y-1 overflow-auto pr-1 text-sm">
                {deckCount.map((card) => (
                  <div key={card.id} className="flex justify-between rounded-xl bg-white/5 px-3 py-2">
                    <span>{card.name}</span>
                    <span className="font-bold">x{card.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="relative rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl">
            {phase === "battle" && (
              <DiscardPileWidget
                pileRef={discardPileRef}
                drawCount={drawPile.length}
                discardCount={discardPile.length}
                active={isCardAnimating}
                classId={player.classId}
              />
            )}
            {phase === "battle" && (
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-gradient-to-br from-slate-100 to-white p-5 text-slate-900 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-500">
                      현재 방 {selectedStage ? `던전 ${selectedStage.floor}층 / ${selectedStage.typeLabel}` : `${enemyIndex + 1}/${ENEMIES.length}`}
                    </div>
                    <h2 className="text-2xl font-black">몬스터 {aliveEnemies.length}/{enemies.length}</h2>
                  </div>
                  <div className="text-sm font-black text-slate-500">타깃: {enemy.name}</div>
                </div>

                <div className="grid gap-3">
                  {enemies.map((entry, index) => {
                    const intent = entry.actions[entry.actionIndex % entry.actions.length];
                    const selected = index === safeSelectedEnemyIndex;
                    const defeated = !isEnemyAlive(entry);
                    const hitEffect = hitEffects[index];
                    return (
                      <motion.button
                        key={entry.id || `${entry.name}-${index}`}
                        type="button"
                        onClick={() => {
                          if (!defeated && !isCardAnimating) setSelectedEnemyIndex(index);
                        }}
                        disabled={defeated || isCardAnimating}
                        animate={
                          hitEffect
                            ? {
                                x: [0, -8, 7, -4, 0],
                                scale: [1, 1.025, 0.99, 1],
                                filter: ["brightness(1)", "brightness(1.55)", "brightness(1)"],
                              }
                            : { x: 0, scale: 1, filter: "brightness(1)" }
                        }
                        transition={{ duration: 0.42, ease: "easeOut" }}
                        className={`relative overflow-hidden rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-cyan-400 bg-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.22)]"
                            : "border-slate-200 bg-white"
                        } ${defeated ? "opacity-45" : "hover:-translate-y-0.5 hover:border-cyan-300"}`}
                      >
                        <AnimatePresence>{hitEffect && <HitEffect effect={hitEffect} />}</AnimatePresence>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100">
                                <MonsterImage monster={entry} className="h-11 w-11 object-contain" fallbackClassName="text-2xl" />
                              </span>
                              <span className="font-black">{entry.name}</span>
                              {entry.boss && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-900">BOSS</span>}
                            </div>
                            <div className="mt-1 text-xs font-bold text-slate-500">
                              의도: {intent.text} / 속도 {entry.speed}
                            </div>
                          </div>
                          <div className="text-right text-xs font-black text-slate-500">
                            HP {entry.hp}/{entry.maxHp}
                          </div>
                        </div>
                        <div className="mt-2">
                          <HpBar current={entry.hp} max={entry.maxHp} />
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div className="rounded-lg bg-slate-100 px-2 py-1">방어 {entry.block}</div>
                          <div className="rounded-lg bg-slate-100 px-2 py-1">힘 +{entry.strength}</div>
                          <div className="rounded-lg bg-slate-100 px-2 py-1">취약 {entry.vulnerable}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 shadow-xl">
                <div className="mb-2 text-sm font-semibold text-cyan-200">Turn {turn}</div>
                <h2 className="mb-4 text-xl font-black">적 의도</h2>
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 text-slate-950">
                  {enemyIntent.type === "attack" ? <Sword /> : enemyIntent.type === "block" ? <Shield /> : <Zap />}
                  <div>
                    <div className="font-black">{enemy.name}: {enemyIntent.text}</div>
                    <div className="text-sm text-slate-500">턴 종료 시 살아있는 모든 몬스터가 행동합니다.</div>
                    {player.speed > 0 && <div className="mt-1 text-[11px] text-slate-500">턴 흐름 예시: {buildTurnPreview(player.speed, enemySpeed, 5)}</div>}
                  </div>
                </div>
                <button
                  onClick={enemyTurn}
                  disabled={phase !== "battle" || isCardAnimating}
                  className="mt-4 w-full rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 shadow-lg hover:bg-cyan-200 disabled:opacity-40"
                >
                  턴 종료
                </button>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {phase === "character-select" && (
                <motion.section
                  key="character-select"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="rounded-3xl bg-white p-5 text-slate-950 shadow-2xl"
                >
                  <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">런 시작 전 캐릭터 선택</div>
                  <h2 className="mb-5 text-2xl font-black">운명을 고르세요</h2>

                  <div className="grid gap-3 md:grid-cols-3">
                    {Object.values(CHARACTER_CLASSES).map((character) => {
                      const selected = selectedCharacterId === character.id;
                      return (
                        <motion.button
                          key={character.id}
                          whileHover={{ y: -7, scale: 1.06 }}
                          whileTap={{ scale: 0.98 }}
                          onHoverStart={() => setHoveredCharacterId(character.id)}
                          onHoverEnd={() => setHoveredCharacterId(null)}
                          onClick={() => setSelectedCharacterId(character.id)}
                          className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left shadow-md transition ${
                            selected ? "border-slate-900" : "border-slate-200"
                          }`}
                        >
                          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${character.color}`} />
                          <div className="relative z-10">
                            <div className="mb-3 text-4xl">{character.icon}</div>
                            <div className="text-lg font-black">{character.name}</div>
                            <div className="mt-1 text-xs text-slate-600">{character.style}</div>
                            <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold">
                              <div className="rounded-lg bg-white/75 px-2 py-1">HP {character.hp}</div>
                              <div className="rounded-lg bg-white/75 px-2 py-1">ATK {character.attack}</div>
                              <div className="rounded-lg bg-white/75 px-2 py-1">SPD {character.speed}⚡</div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="text-sm font-semibold text-slate-500">선택 캐릭터 상세</div>
                      <div className="mt-1 text-xl font-black">
                        {activeCharacter.icon} {activeCharacter.name}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">{activeCharacter.passive}</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold">
                        <span className="rounded-lg bg-white px-3 py-1">체력 {activeCharacter.hp}</span>
                        <span className="rounded-lg bg-white px-3 py-1">공격 {activeCharacter.attack}</span>
                        <span className="rounded-lg bg-white px-3 py-1">방어 {activeCharacter.defense}</span>
                        <span className="rounded-lg bg-yellow-100 px-3 py-1">속도 {activeCharacter.speed} ⚡</span>
                      </div>
                      <div className="mt-3 text-xs text-slate-600">턴 예시: {speedPreview}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => initializeRun(selectedCharacterId || activeCharacter.id)}
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white hover:bg-slate-700"
                    >
                      선택 확정 후 런 시작
                    </button>
                  </div>
                </motion.section>
              )}

              {(phase === "rest" || phase === "shop") && (
                <div className="space-y-4">
                  <DungeonProgressPanel
                    currentDepth={currentDepth}
                    maxDepth={maxDepth}
                    currentRoomType={currentRoomType}
                    isRoomCleared={isRoomCleared}
                  />
                  <RoomEncounterPanel
                    encounter={roomEncounter}
                    result={roomResult}
                    player={player}
                    deck={deck}
                    onChoose={handleRoomChoice}
                    onContinue={continueAfterRoom}
                    onShopBuyCard={handleShopBuyCard}
                    onShopSellCard={handleShopSellCard}
                    onShopHeal={handleShopHeal}
                    onShopLeave={leaveShopRoom}
                    onUpgradeCard={handleUpgradeCard}
                    onDismantleCard={handleDismantleCard}
                  />
                </div>
              )}

              {phase === "battle" && (
                <motion.section key="combat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xl font-black">핸드</h2>
                    <div className="text-sm text-slate-300">카드를 클릭하면 선택된 몬스터에게 사용됩니다.</div>
                  </div>
                  <div className="mb-4 min-h-[132px]">
                    {hoveredCombatCard ? (
                      <CardDetailPanel card={hoveredCombatCard} targetName={enemy.name} />
                    ) : (
                      <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300 shadow-xl">
                        전투 카드 상세
                      </div>
                    )}
                  </div>
                  <div className="relative min-h-[330px] overflow-visible rounded-[28px] border border-white/10 bg-gradient-to-b from-slate-950/20 to-slate-950/70 px-4 pb-5 pt-8 shadow-inner">
                    <div className="flex justify-center overflow-visible">
                      {hand.map((cardId, index) => {
                        const centerOffset = index - (hand.length - 1) / 2;
                        const rotate = centerOffset * 5;
                        const drop = Math.abs(centerOffset) * 9;
                        const isAnimatingSource = activeCardAnimation?.handIndex === index && activeCardAnimation?.cardId === cardId;
                        return (
                          <div
                            key={`${cardId}-${index}-${turn}`}
                            className={index === 0 ? "relative transition" : "relative -ml-10 transition"}
                            style={{
                              zIndex: 30 + index,
                              transform: `translateY(${drop}px) rotate(${rotate}deg)`,
                              transformOrigin: "50% 110%",
                              opacity: isAnimatingSource ? 0 : 1,
                            }}
                          >
                            <Card
                              cardId={cardId}
                              variant="hand"
                              disabled={isCardAnimating || player.energy < CARD_POOL[cardId].cost}
                              onInspect={setHoveredCombatCardId}
                              onInspectEnd={clearHoveredCombatCard}
                              onClick={(clickEvent) => playCard(cardId, index, clickEvent)}
                              classId={player.classId}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {hand.length === 0 && <div className="grid h-64 place-items-center text-sm text-slate-400">손패가 없습니다.</div>}
                  </div>
                </motion.section>
              )}

              {phase === "reward" && (
                <motion.section key="reward" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[560px]">
                  <BattleRewardModal
                    reward={battleReward || { cardChoices: rewards }}
                    claimedCardId={claimedRewardCardId}
                    onOpenCardChoice={() => setCardChoiceOpen(true)}
                    onContinue={continueAfterBattleReward}
                    continueLabel={currentDepth >= maxDepth && currentRoomType === "bossBattle" ? "던전 클리어" : "다음 방으로 이동"}
                  />
                  <AnimatePresence>
                    {cardChoiceOpen && (
                      <CardChoiceModal
                        choices={battleReward?.cardChoices || rewards}
                        classId={player.classId}
                        onSelect={chooseReward}
                        onClose={() => setCardChoiceOpen(false)}
                      />
                    )}
                  </AnimatePresence>
                </motion.section>
              )}

              {phase === "victory" && (
                <motion.section key="victory" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl bg-white p-8 text-center text-slate-950 shadow-2xl">
                  <Trophy className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
                  <h2 className="text-3xl font-black">프로토타입 클리어!</h2>
                  <p className="mt-2 text-slate-600">100층 탑의 마지막 보스방을 공략했습니다. 이제 카드, 유물, 이벤트 방을 확장하면 됩니다.</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button onClick={restartRun} className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700">새 런 시작</button>
                    <button onClick={restart} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-950 hover:bg-slate-100">메인으로</button>
                  </div>
                </motion.section>
              )}

              {phase === "defeat" && (
                <motion.section key="defeat" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl bg-white p-8 text-center text-slate-950 shadow-2xl">
                  <Skull className="mx-auto mb-3 h-12 w-12" />
                  <h2 className="text-3xl font-black">패배</h2>
                  <p className="mt-2 text-slate-600">던전 진행은 초기화됐지만 특성 포인트와 투자한 특성은 유지됩니다.</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button onClick={restartRun} className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700">다시 시작</button>
                    <button onClick={restart} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-950 hover:bg-slate-100">메인으로</button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </main>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl">
            <h2 className="mb-3 text-lg font-bold">전투 로그</h2>
            <div className="space-y-2">
              {log.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-2xl bg-white/5 p-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <h3 className="mb-2 font-bold">현재 구현된 기능</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>카드 비용 / 에너지 시스템</li>
                <li>드로우/버린 더미 순환</li>
                <li>공격, 방어, 드로우, 회복 카드</li>
                <li>적 의도 표시</li>
                <li>전투 후 카드 보상</li>
                <li>이벤트 / 휴식 / 상점 방</li>
                <li>골드 획득과 카드 거래</li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <h3 className="mb-2 font-bold">다음 확장 후보</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>유물 시스템</li>
                <li>카드 강화</li>
                <li>캐릭터 전용 카드</li>
                <li>방별 희귀 이벤트 체인</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
