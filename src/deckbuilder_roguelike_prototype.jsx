import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  CircleDot,
  Coins,
  Crown,
  DoorOpen,
  Heart,
  Lock,
  RotateCcw,
  Shield,
  Skull,
  Sparkles,
  Sword,
  TowerControl,
  Trophy,
  Zap,
} from "lucide-react";

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
    play: ({ player, enemy }) => ({
      enemy: {
        ...enemy,
        hp: Math.max(0, enemy.hp - calcDamage(8, player, enemy)),
        vulnerable: enemy.vulnerable + 1,
      },
    }),
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
    play: ({ player }) => ({ player: { ...player, block: player.block + 8 } }),
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
    play: ({ player }) => ({ player: { ...player, block: player.block + 6 } }),
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
    play: ({ player }) => ({ player: { ...player, hp: Math.min(player.maxHp, player.hp + 5) } }),
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
    play: ({ player, drawCards }) => ({
      player: { ...player, strength: player.strength + 1, hp: Math.max(1, player.hp - 1) },
      draw: drawCards(2),
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
    attack: 14,
    defense: 5,
    speed: 15,
    passive: "피격 시 25% 확률 회피, 성공하면 반격 피해 4",
    style: "기동성과 지속 딜 중심의 안정적인 운영",
    starter: Array(5).fill("archer-attack").concat(Array(5).fill("archer-defense")),
  },
};

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

const ROOM_TYPE_META = {
  normal: { label: "일반 전투 방", shortLabel: "일반", icon: Sword },
  elite: { label: "정예 전투 방", shortLabel: "정예", icon: Shield },
  boss: { label: "보스방", shortLabel: "BOSS", icon: Crown },
  rest: { label: "휴식 방", shortLabel: "휴식", icon: Heart },
  event: { label: "이벤트 방", shortLabel: "이벤트", icon: Sparkles },
  reward: { label: "보상 방", shortLabel: "보상", icon: Trophy },
};

const FLOOR_ENEMY_TABLE = {
  1: {
    normal: [
      { enemy: "달팽이", maxHp: 40, attack: 6, speed: 7, image: "🐌" },
      { enemy: "슬라임", maxHp: 50, attack: 8, speed: 8, image: "🟢" },
      { enemy: "버섯", maxHp: 60, attack: 9, speed: 9, image: "🍄" },
      { enemy: "돼지", maxHp: 70, attack: 10, speed: 9, image: "🐖" },
      { enemy: "탑 수문병", maxHp: 74, attack: 11, speed: 10, image: "🛡️" },
    ],
    elite: [{ enemy: "룬 갑옷 정예", maxHp: 96, attack: 13, speed: 10, image: "♞" }],
    boss: [{ enemy: "코볼트 보스", maxHp: 120, attack: 14, speed: 11, image: "👑" }],
  },
  2: {
    normal: [
      { enemy: "고블린", maxHp: 80, attack: 12, speed: 11, image: "🗡️" },
      { enemy: "오크", maxHp: 90, attack: 13, speed: 10, image: "🪓" },
      { enemy: "늑대", maxHp: 95, attack: 14, speed: 15, image: "🐺" },
      { enemy: "암흑 기사", maxHp: 110, attack: 16, speed: 12, image: "♞" },
      { enemy: "균열 마도사", maxHp: 104, attack: 15, speed: 14, image: "🔮" },
    ],
    elite: [{ enemy: "흑철 감시자", maxHp: 135, attack: 18, speed: 12, image: "🛡️" }],
    boss: [{ enemy: "드래곤 보스", maxHp: 180, attack: 22, speed: 13, image: "🐉" }],
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
    type: "normal",
    typeLabel: ROOM_TYPE_META.normal.label,
  }));
  const middle = [0, 1].map((index) => ({
    ...pickEnemyTemplate(floor, "normal", index + 3),
    id: `${floor}-${index + 4}`,
    floor,
    label: `${floor}-${index + 4}`,
    ring: 2,
    ringLabel: "중간 원",
    type: "normal",
    typeLabel: ROOM_TYPE_META.normal.label,
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
  return {
    name: stage.enemy,
    maxHp: stage.maxHp,
    speed: stage.speed,
    image: stage.image,
    boss: isBoss,
    actions: isBoss
      ? [
          { type: "attack", value: stage.attack, text: `강공격 ${stage.attack}` },
          { type: "block", value: Math.ceil(stage.attack * 0.8), text: `방어 ${Math.ceil(stage.attack * 0.8)}` },
          { type: "buff", value: 2, text: "힘 +2" },
          { type: "attack", value: Math.max(1, stage.attack - 5), text: `공격 ${Math.max(1, stage.attack - 5)}` },
        ]
      : [
          { type: "attack", value: stage.attack, text: `공격 ${stage.attack}` },
          { type: "block", value: Math.ceil(stage.attack * 0.6), text: `방어 ${Math.ceil(stage.attack * 0.6)}` },
        ],
  };
}

function calcDamage(base, player, enemy) {
  const attackBonus = Math.max(0, Math.floor(((player.attack || 10) - 10) / 2));
  const raw = base + player.strength + attackBonus;
  return enemy.vulnerable > 0 ? Math.ceil(raw * 1.5) : raw;
}

function shuffle(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
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

function createEnemy(indexOrStage = 0) {
  const template = typeof indexOrStage === "object" ? buildStageEnemy(indexOrStage) : ENEMIES[indexOrStage];
  return {
    ...template,
    hp: template.maxHp,
    block: 0,
    strength: 0,
    vulnerable: 0,
    actionIndex: 0,
  };
}

function createStageEnemies(stage) {
  const monsterCount = stage.type === "boss" ? 3 : stage.type === "elite" ? 2 : 1;

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
          };

    return {
      ...createEnemy(variant),
      id: `${stage.id}-${index}`,
      boss: isMainBoss,
      finalBoss: isMainBoss && Boolean(stage.finalBoss),
    };
  });
}

function getFirstAliveEnemyIndex(enemyList) {
  return Math.max(0, enemyList.findIndex((enemy) => enemy.hp > 0));
}

function areAllEnemiesDefeated(enemyList) {
  return enemyList.length > 0 && enemyList.every((enemy) => enemy.hp <= 0);
}

function getRewardCards(deck, classId) {
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

  const selectedIds = [];
  while (selectedIds.length < 3) {
    const availableWeights = REWARD_RARITY_WEIGHTS.filter(({ rarity }) => {
      const pool = rarityPools[rarity];
      return pool.class.length > 0 || pool.shared.length > 0;
    });
    if (availableWeights.length === 0) break;

    const totalWeight = availableWeights.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    let selectedRarity = availableWeights[0].rarity;
    for (const item of availableWeights) {
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

  return (
    <div className="rounded-3xl border bg-slate-950/70 p-4 shadow-xl" style={{ borderColor: rarityFrame.border, boxShadow: `0 0 26px ${rarityFrame.glow}` }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-1 text-xs font-black ${rarityMeta.className}`}>{rarityMeta.label}</span>
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

function Card({ cardId, onClick, disabled, compact = false, onInspect, variant = "deck", isBack = false, classId = "warrior" }) {
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

  if (card.fullImage && !imageFailed) {
    return (
      <motion.button
        whileHover={{ y: disabled ? -4 : -18, scale: disabled ? 1.015 : isHand ? 1.16 : 1.075, zIndex: 60 }}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onHoverStart={() => {
          setIsHovering(true);
          onInspect?.(cardId);
        }}
        onHoverEnd={() => setIsHovering(false)}
        onFocus={() => onInspect?.(cardId)}
        onClick={(event) => {
          onInspect?.(cardId);
          if (disabled) return;
          onClick?.(event);
        }}
        aria-disabled={disabled}
        className={`game-card image-card rarity-${card.rarity} ${cardHeight} ${cardWidth} ${disabled ? "card-disabled" : ""} ${isHovering ? "is-hovering" : ""}`}
      >
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
      whileHover={{ y: disabled ? -4 : -18, scale: disabled ? 1.015 : isHand ? 1.16 : 1.075, zIndex: 60 }}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onHoverStart={() => {
        setIsHovering(true);
        onInspect?.(cardId);
      }}
      onHoverEnd={() => setIsHovering(false)}
      onFocus={() => onInspect?.(cardId)}
      onClick={(event) => {
        onInspect?.(cardId);
        if (disabled) return;
        onClick?.(event);
      }}
      aria-disabled={disabled}
      className={`relative isolate flex ${cardHeight} ${cardWidth} flex-col overflow-hidden rounded-[18px] border-2 p-3 text-left shadow-[0_14px_30px_rgba(15,23,42,0.28)] transition ${
        disabled ? "cursor-not-allowed opacity-60 grayscale-[0.25]" : "cursor-pointer"
      }`}
      style={{
        borderColor: rarityFrame.border,
        background: rarityFrame.surface,
        boxShadow: isHovering
          ? `0 18px 36px rgba(15,23,42,0.36), 0 0 32px ${rarityFx.glow}, inset 0 0 16px ${rarityFrame.glow}`
          : `0 14px 30px rgba(15,23,42,0.26), inset 0 0 12px ${rarityFrame.glow}`,
        transformStyle: "preserve-3d",
      }}
    >
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

  return (
    <motion.div
      className="pointer-events-none fixed z-[120]"
      style={{
        left: animation.left,
        top: animation.top,
        width: animation.width,
        height: animation.height,
        transformOrigin: "50% 50%",
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
        <motion.div
          className="absolute -inset-5 rounded-[30px] blur-xl"
          animate={{ opacity: [0.25, 0.85, 0.1], scale: [0.9, 1.12, 0.8] }}
          transition={{ duration: 0.92, times: [0, 0.35, 1], ease: "easeOut" }}
          style={{
            background: `radial-gradient(circle, ${(RARITY_HOVER_FX[CARD_POOL[animation.cardId]?.rarity] || RARITY_HOVER_FX.common).glow} 0%, rgba(255,255,255,0) 72%)`,
          }}
        />
        <Card cardId={animation.cardId} variant="hand" disabled={false} classId={animation.classId} />
      </div>
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
  const color = colorByType[effect.type] || colorByType.impact;

  return (
    <motion.div
      key={effect.key}
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.72, ease: "easeOut" }}
    >
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

function DeckManagementPanel({ deck, deckCount, inspectedCard, onInspectCard, classId }) {
  const selectedClass = CHARACTER_CLASSES[classId] || CHARACTER_CLASSES.warrior;
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black">덱 관리</h2>
          <p className="text-sm text-slate-300">{selectedClass.name} 덱 {deck.length}장. 실제 카드 이미지가 우선 표시됩니다.</p>
        </div>
        <div className="text-sm font-bold text-cyan-200">
          공격 {deckCount.filter((card) => card.type === "attack").reduce((sum, card) => sum + card.amount, 0)}장 / 방어·기술{" "}
          {deckCount.filter((card) => card.type !== "attack").reduce((sum, card) => sum + card.amount, 0)}장
        </div>
      </div>
      <div className="mb-5 min-h-[132px]">
        {inspectedCard ? (
          <CardDetailPanel card={inspectedCard} />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300 shadow-xl">
            선택한 카드 정보
          </div>
        )}
      </div>
      <div className="grid gap-x-4 gap-y-7 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {deckCount.map((card) => (
          <div key={card.id} className="relative">
            <Card cardId={card.id} compact disabled={false} onInspect={onInspectCard} onClick={() => onInspectCard(card.id)} classId={classId} />
            <div className="absolute right-3 top-12 z-20 rounded-full bg-slate-950 px-2 py-1 text-xs font-black text-white shadow-lg">x{card.amount}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TowerMapScreen({
  player,
  currentClassTheme,
  deck,
  selectedFloor,
  unlockedFloors,
  clearedFloors,
  currentFloor,
  onSelectFloor,
  onEnterFloor,
  onToggleDeck,
  showDeckManager,
  onCharacterSelect,
  onRestart,
  deckCount,
  inspectedCard,
  onInspectCard,
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
            <div>골드 <strong>0</strong></div>
            <div>덱 <strong>{deck.length}장</strong></div>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={onToggleDeck} className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 hover:bg-cyan-200">
            {showDeckManager ? "탑 보기" : "덱 관리"}
          </button>
          <button onClick={onCharacterSelect} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-black text-white hover:bg-white/15">
            직업 다시 선택
          </button>
          <button onClick={onRestart} className="rounded-2xl bg-white px-4 py-3 font-black text-slate-950 hover:bg-cyan-100">
            처음으로
          </button>
        </div>

        {showDeckManager ? (
          <DeckManagementPanel deck={deck} deckCount={deckCount} inspectedCard={inspectedCard} onInspectCard={onInspectCard} classId={player.classId} />
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
                  <strong>외곽 3 / 중간 2 / 정예 1 / 보스 1</strong>
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

function FloorMapScreen({
  floor,
  player,
  currentClassTheme,
  deck,
  floorNodes,
  clearedNodeIds,
  floorUnlocked,
  floorCleared,
  onEnterNode,
  onBackToTower,
  onToggleDeck,
  showDeckManager,
  deckCount,
  inspectedCard,
  onInspectCard,
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
              {currentClassTheme.name} / HP {player.hp}/{player.maxHp} / 덱 {deck.length}장 / 현재 목표: {nextNode ? `${nextNode.ringLabel} ${ROOM_TYPE_META[nextNode.type].label}` : "중앙 보스 공략 완료"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onToggleDeck} className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 hover:bg-cyan-200">
              {showDeckManager ? "층 내부 보기" : "덱 관리"}
            </button>
            <button onClick={onBackToTower} className="rounded-2xl bg-white px-4 py-3 font-black text-slate-950 hover:bg-cyan-100">
              탑으로 돌아가기
            </button>
          </div>
        </header>

        {showDeckManager ? (
          <DeckManagementPanel deck={deck} deckCount={deckCount} inspectedCard={inspectedCard} onInspectCard={onInspectCard} classId={player.classId} />
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
                    whileHover={available ? { scale: node.type === "boss" ? 1.08 : 1.1 } : undefined}
                    whileTap={available ? { scale: 0.95 } : undefined}
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
                    <div className="mt-1 text-xs text-slate-400">{nextNode.enemy} 출현 예상</div>
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
  const [player, setPlayer] = useState({
    hp: 0,
    maxHp: 0,
    block: 0,
    energy: 3,
    maxEnergy: 3,
    strength: 0,
    vulnerable: 0,
    classId: null,
    attack: 10,
    defense: 0,
    speed: 0,
  });
  const [deck, setDeck] = useState([]);
  const [drawPile, setDrawPile] = useState([]);
  const [hand, setHand] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [exhaustPile, setExhaustPile] = useState([]);
  const [enemyIndex, setEnemyIndex] = useState(0);
  const [enemies, setEnemies] = useState(() => [createEnemy(0)]);
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState(0);
  const [turn, setTurn] = useState(1);
  const [phase, setPhase] = useState("start");
  const [log, setLog] = useState(["캐릭터를 선택하면 첫 전투가 시작됩니다."]);
  const [rewards, setRewards] = useState([]);
  const [flippedRewards, setFlippedRewards] = useState([]);
  const [relics, setRelics] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [unlockedFloors, setUnlockedFloors] = useState([1]);
  const [clearedFloors, setClearedFloors] = useState([]);
  const [clearedNodesByFloor, setClearedNodesByFloor] = useState({});
  const [hoveredCharacterId, setHoveredCharacterId] = useState(null);
  const [speedGauge, setSpeedGauge] = useState({ player: 0, enemy: 0 });
  const [rageStacks, setRageStacks] = useState(0);
  const [comboStacks, setComboStacks] = useState(0);
  const [showDeckManager, setShowDeckManager] = useState(false);
  const [inspectedCardId, setInspectedCardId] = useState(null);
  const [isCardAnimating, setIsCardAnimating] = useState(false);
  const [activeCardAnimation, setActiveCardAnimation] = useState(null);
  const [hitEffects, setHitEffects] = useState({});
  const discardPileRef = useRef(null);

  const liveEnemyIndex = getFirstAliveEnemyIndex(enemies);
  const safeSelectedEnemyIndex =
    enemies[selectedEnemyIndex]?.hp > 0 ? selectedEnemyIndex : liveEnemyIndex;
  const enemy = enemies[safeSelectedEnemyIndex] || enemies[0] || createEnemy(0);
  const aliveEnemies = enemies.filter((entry) => entry.hp > 0);
  const enemySpeed = Math.max(1, ...aliveEnemies.map((entry) => entry.speed || 1));
  const enemyIntent = enemy.actions[enemy.actionIndex % enemy.actions.length];
  const activeCharacter = CHARACTER_CLASSES[hoveredCharacterId || selectedCharacterId || "warrior"];
  const speedPreview = buildTurnPreview(activeCharacter.speed, createEnemy(0).speed);
  const currentClassTheme = CHARACTER_CLASSES[player.classId || selectedCharacterId || "warrior"];
  const inspectedCard = inspectedCardId ? CARD_POOL[inspectedCardId] : null;
  const currentFloorNodes = getFloorNodes(currentFloor);
  const currentClearedNodeIds = getClearedNodeIds(clearedNodesByFloor, currentFloor);
  const currentFloorUnlocked = isFloorUnlocked(unlockedFloors, currentFloor);
  const currentFloorCleared = clearedFloors.includes(currentFloor);

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

    setSelectedCharacterId(characterId);
    setPlayer({
      hp: profile.hp,
      maxHp: profile.hp,
      block: profile.defense,
      energy: profile.energy || 3,
      maxEnergy: profile.maxEnergy || profile.energy || 3,
      strength: 0,
      vulnerable: 0,
      classId: characterId,
      attack: profile.attack,
      defense: profile.defense,
      speed: profile.speed,
    });
    setDeck(freshDeck);
    setDrawPile(drawResult.newDrawPile);
    setHand(drawResult.drawn);
    setDiscardPile(drawResult.newDiscardPile);
    setExhaustPile([]);
    setEnemyIndex(0);
    setEnemies([createEnemy(0)]);
    setSelectedEnemyIndex(0);
    setSelectedStage(null);
    setSelectedFloor(1);
    setCurrentFloor(1);
    setUnlockedFloors([1]);
    setClearedFloors([]);
    setClearedNodesByFloor({});
    setTurn(1);
    setRewards([]);
    setFlippedRewards([]);
    setRelics([]);
    setShowDeckManager(false);
    setInspectedCardId(null);
    setIsCardAnimating(false);
    setActiveCardAnimation(null);
    setHitEffects({});
    setRageStacks(0);
    setComboStacks(0);
    setSpeedGauge({ player: 0, enemy: 0 });
    setPhase("towerMap");
    setLog([
      `${profile.name} 선택 완료. 100층 고대탑의 1층이 열렸습니다.`,
      "보상 카드, 희귀도, 속도 기반 전투가 적용됩니다.",
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
      vulnerable: Math.max(0, p.vulnerable - 1),
    }));
    setEnemies((current) =>
      current.map((entry) => ({ ...entry, block: 0, vulnerable: Math.max(0, entry.vulnerable - 1) })),
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

  function selectStage(stage) {
    if (!player.classId) {
      setPhase("character-select");
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
    setShowDeckManager(false);
    setInspectedCardId(null);
    setIsCardAnimating(false);
    setActiveCardAnimation(null);
    setHitEffects({});
    setTurn(1);
    setSpeedGauge({ player: 0, enemy: 0 });
    setComboStacks(0);
    setRageStacks(0);
    setPlayer((p) => ({
      ...p,
      energy: p.maxEnergy,
      block: p.defense,
      vulnerable: 0,
    }));
    setPhase("combat");
    setLog([
      `던전 ${stage.floor}층 ${stage.ringLabel} ${stage.typeLabel} 시작. 몬스터 ${stage.type === "boss" ? 3 : stage.type === "elite" ? 2 : 1}마리가 등장했습니다.`,
      "카드를 사용해서 적을 처치하세요.",
    ]);
  }

  async function playCard(cardId, handIndex, event) {
    if (phase !== "combat" || isCardAnimating) return;
    const card = CARD_POOL[cardId];
    if (player.energy < card.cost) return;
    if (aliveEnemies.length === 0) return;

    const targetIndex = enemies[safeSelectedEnemyIndex]?.hp > 0 ? safeSelectedEnemyIndex : liveEnemyIndex;
    const targetEnemy = enemies[targetIndex];
    if (!targetEnemy) return;

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
    setInspectedCardId(cardId);

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
    const result = card.play({ player: effectivePlayer, enemy: targetEnemy, drawCards: drawHelper });
    const nextPlayer = { ...(result.player || player), energy: player.energy - card.cost };
    const nextTargetEnemy = result.enemy || targetEnemy;
    const nextEnemies = enemies.map((entry, index) => (index === targetIndex ? nextTargetEnemy : entry));
    const allDefeated = areAllEnemiesDefeated(nextEnemies);
    const damageDone = Math.max(0, targetEnemy.hp - nextTargetEnemy.hp);

    await wait(330);

    if (card.type === "attack") {
      const effectKey = `${cardId}-${targetIndex}-${Date.now()}`;
      setHitEffects((current) => ({
        ...current,
        [targetIndex]: {
          key: effectKey,
          type: card.animationType,
          damage: damageDone,
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
    if (nextTargetEnemy.hp <= 0 && !allDefeated) {
      setSelectedEnemyIndex(getFirstAliveEnemyIndex(nextEnemies));
    }

    if (player.classId === "mage" && card.type === "attack" && comboStacks > 0) {
      pushLog(`${card.name} 사용: 연계 보너스 +${comboStacks}`);
    } else {
      pushLog(`${card.name} 사용: ${card.desc}`);
    }

    await wait(590);

    setDrawPile(workingDrawPile);
    setHand((current) => [...current.filter((_, idx) => idx !== handIndex), ...extraDrawnCards]);
    setDiscardPile([...workingDiscardPile, cardId]);
    setActiveCardAnimation(null);
    setIsCardAnimating(false);

    if (allDefeated) {
      finishBattle(nextEnemies.some((entry) => entry.boss));
    }
  }

  function finishBattle(isBoss) {
    if (selectedStage) {
      setClearedNodesByFloor((prev) => {
        const floor = selectedStage.floor;
        const nextFloorNodes = Array.from(new Set([...(prev[floor] || []), selectedStage.id]));
        return { ...prev, [floor]: nextFloorNodes };
      });
    }

    if (selectedStage?.type === "boss") {
      const completedFloor = selectedStage.floor;
      setClearedFloors((prev) => Array.from(new Set([...prev, completedFloor])));
      setUnlockedFloors((prev) => {
        const nextFloor = Math.min(TOTAL_FLOORS, completedFloor + 1);
        return Array.from(new Set([...prev, nextFloor]));
      });
      setSelectedFloor(Math.min(TOTAL_FLOORS, completedFloor + 1));
      setCurrentFloor(completedFloor);
    }

    if (selectedStage?.finalBoss) {
      setPhase("victory");
      pushLog("100층 중앙 보스방을 공략했습니다. 탑 정복 완료!");
      return;
    }

    const rewardCards = getRewardCards(deck, player.classId);
    setRewards(rewardCards);
    setFlippedRewards(rewardCards.map(() => false));
    setPhase("reward");
    pushLog(isBoss ? `던전 ${selectedStage?.floor}층 보스방 공략 성공! 다음 층이 열렸습니다.` : "전투 승리! 카드 보상을 선택하세요.");
  }

  function flipReward(index) {
    setFlippedRewards((prev) => {
      if (prev[index]) return prev;
      return prev.map((value, currentIndex) => (currentIndex === index ? true : value));
    });
  }

  function enemyTurn() {
    if (phase !== "combat" || isCardAnimating) return;
    let nextPlayer = { ...player };
    let nextEnemies = enemies.map((entry) => ({ ...entry }));
    let nextGauge = { ...speedGauge };
    let nextRage = rageStacks;
    let safety = 0;
    let enemyActions = 0;

    while (safety < 12) {
      safety += 1;
      const currentEnemySpeed = Math.max(1, ...nextEnemies.filter((entry) => entry.hp > 0).map((entry) => entry.speed || 1));
      const nextActor = nextActorFromGauge(nextGauge.player, nextGauge.enemy, Math.max(1, player.speed), currentEnemySpeed);
      nextGauge = { player: nextActor.playerGauge, enemy: nextActor.enemyGauge };

      if (nextActor.actor === "player") break;

      const actingIndexes = nextEnemies
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => entry.hp > 0)
        .map(({ index }) => index);

      for (const enemyActionIndex of actingIndexes) {
        let actingEnemy = nextEnemies[enemyActionIndex];
        enemyActions += 1;
        const action = actingEnemy.actions[actingEnemy.actionIndex % actingEnemy.actions.length];

        if (action.type === "attack") {
          const defenseMitigation = Math.floor((nextPlayer.defense || 0) / 4);
          const damage = Math.max(1, action.value + actingEnemy.strength - defenseMitigation);
          const finalDamage = nextPlayer.vulnerable > 0 ? Math.ceil(damage * 1.5) : damage;

          let taken = finalDamage;
          let blocked = 0;

          if (nextPlayer.classId === "archer" && Math.random() < 0.25) {
            taken = 0;
            actingEnemy = { ...actingEnemy, hp: Math.max(0, actingEnemy.hp - 4) };
            pushLog("궁수 패시브 발동: 회피 성공! 반격 피해 4");
          } else {
            blocked = Math.min(nextPlayer.block, finalDamage);
            taken = finalDamage - blocked;
            nextPlayer.block -= blocked;
            nextPlayer.hp = Math.max(0, nextPlayer.hp - taken);
          }

          if (nextPlayer.classId === "warrior" && taken > 0) {
            nextRage += 1;
            if (nextRage >= 3) {
              nextRage -= 3;
              nextPlayer.strength += 1;
              pushLog("전사 패시브 발동: 분노 폭발! 힘 +1");
            }
          }

          pushLog(`${actingEnemy.name}의 공격: ${taken} 피해`);
        }

        if (action.type === "block") {
          actingEnemy = { ...actingEnemy, block: actingEnemy.block + action.value };
          pushLog(`${actingEnemy.name} 방어 ${action.value} 획득`);
        }

        if (action.type === "buff") {
          actingEnemy = { ...actingEnemy, strength: actingEnemy.strength + action.value };
          pushLog(`${actingEnemy.name} 힘 +${action.value}`);
        }

        if (action.type === "debuff") {
          nextPlayer.vulnerable += action.value;
          pushLog(`${actingEnemy.name}가 취약을 부여했습니다.`);
        }

        nextEnemies[enemyActionIndex] = { ...actingEnemy, actionIndex: actingEnemy.actionIndex + 1 };

        if (nextPlayer.hp <= 0 || areAllEnemiesDefeated(nextEnemies)) break;
      }

      if (nextPlayer.hp <= 0 || areAllEnemiesDefeated(nextEnemies)) break;
    }

    if (areAllEnemiesDefeated(nextEnemies)) {
      setPlayer(nextPlayer);
      setEnemies(nextEnemies);
      setRageStacks(nextRage);
      setSpeedGauge(nextGauge);
      finishBattle(nextEnemies.some((entry) => entry.boss));
      return;
    }

    if (nextPlayer.hp <= 0) {
      setPlayer(nextPlayer);
      setEnemies(nextEnemies);
      setRageStacks(nextRage);
      setSpeedGauge(nextGauge);
      setPhase("defeat");
      pushLog("패배했습니다. 덱 구성을 다시 조정해 보세요.");
      return;
    }

    const discardAfterTurn = [...discardPile, ...hand];
    const drawResult = drawFromPiles(5, drawPile, discardAfterTurn);

    setPlayer({
      ...nextPlayer,
      energy: nextPlayer.maxEnergy,
      block: 0,
      vulnerable: Math.max(0, nextPlayer.vulnerable - 1),
    });
    setEnemies(
      nextEnemies.map((entry) => ({
        ...entry,
        block: 0,
        vulnerable: Math.max(0, entry.vulnerable - 1),
      })),
    );
    setSelectedEnemyIndex(getFirstAliveEnemyIndex(nextEnemies));
    setRageStacks(nextRage);
    setSpeedGauge(nextGauge);
    setDiscardPile(drawResult.newDiscardPile);
    setDrawPile(drawResult.newDrawPile);
    setHand(drawResult.drawn);
    setTurn((t) => t + 1);
    setComboStacks(0);
    if (enemyActions > 1) {
      pushLog(`속도 차이로 적이 연속 행동 ${enemyActions}회 수행`);
    }
  }

  function chooseReward(cardId) {
    const nextDeck = [...deck, cardId];
    const completedBossRoom = selectedStage?.type === "boss";
    const returnPhase = completedBossRoom ? "towerMap" : "floorMap";
    const returnLog = completedBossRoom
      ? `던전 ${selectedStage.floor}층 공략 완료. 던전 ${Math.min(TOTAL_FLOORS, selectedStage.floor + 1)}층이 해금되었습니다.`
      : `던전 ${selectedStage?.floor || currentFloor}층 내부 지도로 돌아갑니다. 다음 안쪽 방을 공략하세요.`;

    setDeck(nextDeck);
    setDrawPile([]);
    setHand([]);
    setDiscardPile([]);
    setExhaustPile([]);
    setRewards([]);
    setFlippedRewards([]);
    setTurn(1);
    setPhase(returnPhase);
    setComboStacks(0);
    setSelectedStage(null);
    setPlayer((p) => ({
      ...p,
      hp: Math.min(p.maxHp, p.hp + 8),
      block: 0,
      energy: p.maxEnergy,
      vulnerable: 0,
    }));
    setSpeedGauge((g) => ({ ...g }));
    pushLog(`${CARD_POOL[cardId].name} 카드를 획득했습니다. 체력 8 회복. ${returnLog}`);
  }

  function skipReward() {
    const completedBossRoom = selectedStage?.type === "boss";
    const returnPhase = completedBossRoom ? "towerMap" : "floorMap";
    setDrawPile([]);
    setHand([]);
    setDiscardPile([]);
    setExhaustPile([]);
    setRewards([]);
    setFlippedRewards([]);
    setTurn(1);
    setPhase(returnPhase);
    setComboStacks(0);
    setSelectedStage(null);
    setPlayer((p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + 12), block: 0, energy: p.maxEnergy, vulnerable: 0 }));
    setSpeedGauge((g) => ({ ...g }));
    pushLog(completedBossRoom ? "카드 보상을 건너뛰고 체력 12 회복. 탑 화면으로 돌아갑니다." : "카드 보상을 건너뛰고 체력 12 회복. 층 내부 지도로 돌아갑니다.");
  }

  function restart() {
    setPlayer({ hp: 0, maxHp: 0, block: 0, energy: 3, maxEnergy: 3, strength: 0, vulnerable: 0, classId: null, attack: 10, defense: 0, speed: 0 });
    setDeck([]);
    setDrawPile([]);
    setHand([]);
    setDiscardPile([]);
    setExhaustPile([]);
    setEnemyIndex(0);
    setEnemies([createEnemy(0)]);
    setSelectedEnemyIndex(0);
    setTurn(1);
    setPhase("start");
    setRewards([]);
    setFlippedRewards([]);
    setRelics([]);
    setSelectedCharacterId(null);
    setSelectedStage(null);
    setSelectedFloor(1);
    setCurrentFloor(1);
    setUnlockedFloors([1]);
    setClearedFloors([]);
    setClearedNodesByFloor({});
    setHoveredCharacterId(null);
    setShowDeckManager(false);
    setInspectedCardId(null);
    setIsCardAnimating(false);
    setActiveCardAnimation(null);
    setHitEffects({});
    setSpeedGauge({ player: 0, enemy: 0 });
    setRageStacks(0);
    setComboStacks(0);
    setLog(["게임 시작을 눌러 새 런을 시작하세요."]);
  }

  const deckCount = useMemo(() => {
    const count = {};
    deck.forEach((id) => {
      count[id] = (count[id] || 0) + 1;
    });
    return Object.entries(count).map(([id, amount]) => ({ ...CARD_POOL[id], amount }));
  }, [deck]);

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
            직업을 선택하고 100층 고대탑을 한 층씩 공략하는 카드 전투 로그라이크입니다.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setPhase("character-select")}
              className="rounded-2xl bg-amber-300 px-8 py-4 text-lg font-black text-slate-950 shadow-lg hover:bg-amber-200"
            >
              게임 시작
            </button>
            <button
              type="button"
              onClick={() => setPhase("how-to-play")}
              className="rounded-2xl border border-white/15 bg-white/10 px-8 py-4 text-lg font-black text-white hover:bg-white/15"
            >
              게임 방법
            </button>
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
              "직업을 선택합니다.",
              "탑 화면에서 도전 가능한 던전 층을 선택합니다.",
              "층에 도전하기를 눌러 해당 층 내부로 진입합니다.",
              "바깥 원의 방부터 클리어하며 중앙 보스방으로 들어갑니다.",
              "카드를 사용해 적과 전투하고 보상을 선택합니다.",
              "중앙 보스방을 공략하면 다음 층이 해금됩니다.",
            ].map((line, index) => (
              <div key={line} className="flex items-center gap-3 rounded-2xl bg-white/8 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-300 font-black text-slate-950">{index + 1}</span>
                <span className="font-bold text-slate-200">{line}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPhase("start")}
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
              선택 확정 후 탑으로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "towerMap") {
    return (
      <TowerMapScreen
        player={player}
        currentClassTheme={currentClassTheme}
        deck={deck}
        selectedFloor={selectedFloor}
        unlockedFloors={unlockedFloors}
        clearedFloors={clearedFloors}
        currentFloor={currentFloor}
        onSelectFloor={setSelectedFloor}
        onEnterFloor={enterSelectedFloor}
        onToggleDeck={() => setShowDeckManager((value) => !value)}
        showDeckManager={showDeckManager}
        onCharacterSelect={() => setPhase("character-select")}
        onRestart={restart}
        deckCount={deckCount}
        inspectedCard={inspectedCard}
        onInspectCard={setInspectedCardId}
      />
    );
  }

  if (phase === "floorMap") {
    return (
      <FloorMapScreen
        floor={currentFloor}
        player={player}
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
        showDeckManager={showDeckManager}
        deckCount={deckCount}
        inspectedCard={inspectedCard}
        onInspectCard={setInspectedCardId}
      />
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
            {phase === "combat" && (
              <DiscardPileWidget
                pileRef={discardPileRef}
                drawCount={drawPile.length}
                discardCount={discardPile.length}
                active={isCardAnimating}
                classId={player.classId}
              />
            )}
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
                    const defeated = entry.hp <= 0;
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
                              <span className="text-2xl">{entry.image}</span>
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
                  disabled={phase !== "combat" || isCardAnimating}
                  className="mt-4 w-full rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950 shadow-lg hover:bg-cyan-200 disabled:opacity-40"
                >
                  턴 종료
                </button>
              </div>
            </div>

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

              {phase === "combat" && (
                <motion.section key="combat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-xl font-black">핸드</h2>
                    <div className="text-sm text-slate-300">카드를 클릭하면 선택된 몬스터에게 사용됩니다.</div>
                  </div>
                  <div className="mb-4 min-h-[132px]">
                    {inspectedCard ? (
                      <CardDetailPanel card={inspectedCard} targetName={enemy.name} />
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
                              onInspect={setInspectedCardId}
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
                <motion.section
                  key="reward"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`rounded-3xl bg-gradient-to-br ${currentClassTheme.color} p-5 text-slate-950 shadow-2xl`}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Trophy className="text-yellow-600" />
                    <h2 className="text-2xl font-black">카드 보상 선택</h2>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {rewards.map((card, index) => (
                      <RewardFlipCard
                        key={`${card.id}-${index}`}
                        cardId={card.id}
                        flipped={Boolean(flippedRewards[index])}
                        onFlip={() => flipReward(index)}
                        onClaim={() => chooseReward(card.id)}
                        classId={player.classId}
                      />
                    ))}
                  </div>
                  <button onClick={skipReward} className="mt-4 rounded-2xl border border-slate-300 px-4 py-3 font-bold hover:bg-slate-100">
                    보상 건너뛰기 / 체력 12 회복
                  </button>
                </motion.section>
              )}

              {phase === "victory" && (
                <motion.section key="victory" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl bg-white p-8 text-center text-slate-950 shadow-2xl">
                  <Trophy className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
                  <h2 className="text-3xl font-black">프로토타입 클리어!</h2>
                  <p className="mt-2 text-slate-600">100층 탑의 마지막 보스방을 공략했습니다. 이제 카드, 유물, 이벤트 방을 확장하면 됩니다.</p>
                  <button onClick={restart} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700">새 런 시작</button>
                </motion.section>
              )}

              {phase === "defeat" && (
                <motion.section key="defeat" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl bg-white p-8 text-center text-slate-950 shadow-2xl">
                  <Skull className="mx-auto mb-3 h-12 w-12" />
                  <h2 className="text-3xl font-black">패배</h2>
                  <p className="mt-2 text-slate-600">공격/방어 카드 비율을 조절해서 다시 도전해 보세요.</p>
                  <button onClick={restart} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-700">다시 시작</button>
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
                <li>4연속 전투 + 최종 보스</li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <h3 className="mb-2 font-bold">다음 확장 후보</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>유물 시스템</li>
                <li>상점 / 휴식 노드</li>
                <li>카드 강화</li>
                <li>캐릭터 전용 카드</li>
                <li>층 내부 이벤트 방</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}


