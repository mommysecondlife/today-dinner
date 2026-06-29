import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ChefHat, ShoppingCart, Check, CalendarDays, Sparkles, X, Timer, Hand, RefreshCw, ChevronDown, Search, Share2 } from "lucide-react";
import * as htmlToImage from "html-to-image";
import { INGREDIENT_CATEGORIES, SEASONAL, SEASONAL_INFO, MENUS } from "./mealData.js";
import { generateWeekPlan } from "./generateWeekPlan.js";
import { parseReceiptText } from "./receiptParser.js";
import Tesseract, { PSM } from "tesseract.js";

/* ------------------------------------------------------------------ *
 *  오늘 뭐 먹지? (현실 집밥 편)
 *  화이트 & 마블 톤 · 워킹맘 가성비 식단 루틴
 * ------------------------------------------------------------------ */

// 팔레트 (마블 화이트 + 웜 골드 + 세이지)
// 따뜻한 집밥 톤 — 버터 크림 바탕 + 고추장/파프리카 레드 + 쪽파 그린
const C = {
  canvas: "#FBF3E9",   // 따뜻한 버터 크림
  card: "#FFFDF8",     // 살짝 데운 화이트
  ink: "#3A2A20",      // 간장빛 진한 브라운
  sub: "#9A8472",      // 토스트 토프
  line: "#EEDFCC",     // 부드러운 크러스트 라인
  gold: "#D9603F",     // 파프리카/고추장 레드 (식욕 포인트)
  goldSoft: "#FCE4D7", // 토마토 크림 (선택 배경)
  sage: "#6E8B4F",     // 쪽파/허브 그린
  sageSoft: "#EAF0DC", // 연한 새싹 배경
  yolk: "#E8A33D",     // 노른자 옐로 (보조 강조)
};

// 식단표 하단 액션 버튼 — 하나의 위계로 통일 (메인=코랄 솔리드 / 보조=흰 배경+코랄 아웃라인)
//  크기·둥글기·아이콘·여백 동일. 코랄 + 흰색, 두 색 안에서만.
const ACTION_BTN = "flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-3.5 text-[14px] font-bold transition-all";
const ACTION_MAIN = { background: C.gold, color: "#fff", boxShadow: "0 14px 28px -16px rgba(217,96,63,0.9)" };
const ACTION_SUB = { background: "#fff", color: C.gold, border: `1px solid ${C.gold}66` };

// 쿠팡파트너스 추적 코드 — 나중에 채우면 자동으로 추적 링크가 됨 (비어있으면 일반 검색)
const COUPANG_PARTNER_ID = "";

// 쿠팡 검색 링크 생성 (+ 파트너스 추적)
const buildCoupangLink = (재료명) => {
  const base = `https://www.coupang.com/np/search?q=${encodeURIComponent(재료명)}`;
  if (!COUPANG_PARTNER_ID) return base; // 코드 없으면 일반 검색 URL
  // ⚠️ 추적 파라미터(lptag 등) 형식은 쿠팡파트너스 정책에 따라 달라질 수 있음.
  //    정확한 파라미터는 쿠팡파트너스 도움말에서 확인 필요.
  return `${base}&lptag=${encodeURIComponent(COUPANG_PARTNER_ID)}`;
};


// mealData.js의 MENUS를 데이터 소스로 — 이름별 인덱스
const MENU_BY_NAME = Object.fromEntries(MENUS.map((m) => [m.name, m]));

// 레시피 (mealData의 recipe 사용, 없으면 기본 안내)
const getRecipe = (menu) =>
  (MENU_BY_NAME[menu] && MENU_BY_NAME[menu].recipe) || [
    ["손질", "재료 먹기 좋게 손질"],
    ["양념", "기본 양념 슥슥"],
    ["조리", "익혀서 완성!"],
  ];

const STEP_ICONS = [Hand, Sparkles, Timer]; // 손질 · 양념 · 조리

// 메뉴 → 썸네일 이모지 (키워드 우선순위)
const EMOJI_RULES = [
  ["스크램블", "🍳"], ["계란말이", "🍳"], ["계란찜", "🍳"], ["계란국", "🍳"], ["후라이", "🍳"],
  ["만두", "🥟"], ["맛탕", "🍠"], ["고구마", "🍠"],
  ["찌개", "🍲"], ["국", "🍲"], ["탕", "🍲"], ["곰탕", "🍲"],
  ["볶음밥", "🍚"], ["덮밥", "🍚"], ["밥", "🍚"],
  ["전", "🥞"],
  ["샐러드", "🥗"], ["무침", "🥗"], ["생채", "🥗"],
  ["너겟", "🍗"], ["까스", "🍤"], ["닭", "🍗"],
  ["제육", "🥓"], ["베이컨", "🥓"], ["돼지", "🥩"],
  ["불고기", "🥩"], ["소고기", "🥩"], ["소불고기", "🥩"],
  ["생선", "🐟"],
  ["스팸", "🌭"], ["소시지", "🌭"], ["햄", "🌭"], ["부대", "🍜"],
  ["어묵", "🍢"],
  ["감자", "🥔"],
  ["콩나물", "🌱"],
  ["파프리카", "🫑"], ["브로콜리", "🥦"], ["오이", "🥒"],
  ["양배추", "🥬"], ["무", "🥬"],
  ["팽이", "🍄"], ["버섯", "🍄"],
  ["두부", "🍱"], ["김치", "🥬"],
];
const getEmoji = (menu) => {
  for (const [k, e] of EMOJI_RULES) if (menu.includes(k)) return e;
  return "🍽️";
};

// 색다른 메뉴(별미) 카테고리 — needShopping 메뉴를 tag별로 묶어 전부 보여줌
const SPECIAL_CATS = [
  { cat: "양식", icon: "🍽️" },
  { cat: "면류", icon: "🍜" },
  { cat: "밥·덮밥", icon: "🍚" },
  { cat: "별미", icon: "✨" },
];

// 메뉴 → 카드 배경 색조 (먹음직스러운 따뜻한 톤)
const HUE_RULES = [
  ["국", "#F7E3C2"], ["탕", "#F7E3C2"], ["찌개", "#F6D9C0"], ["곰탕", "#F7E3C2"],
  ["전", "#F9E7BC"], ["볶음", "#FAD7C2"], ["조림", "#F0D8B6"], ["구이", "#F6D9B4"],
  ["밥", "#F4E7CE"], ["맛탕", "#F8DDB0"],
  ["샐러드", "#E5EFCF"], ["무침", "#E5EFCF"], ["생채", "#E5EFCF"],
];
const getHue = (menu) => {
  for (const [k, c] of HUE_RULES) if (menu.includes(k)) return c;
  return "#F6E6CB";
};

// 메뉴 → 시간/인분/난이도 (mealData에서)
const getMeta = (menu) => {
  const m = MENU_BY_NAME[menu];
  if (m) return { min: m.time, servings: m.servings, level: m.level };
  return { min: 15, servings: 2, level: "쉬움" };
};
// 재료 → 냉장고 속 이모지
const INGREDIENT_EMOJI = {
  "닭고기": "🍗", "돼지 다짐육": "🍖", "돼지고기": "🥓", "소고기 불고기용": "🥩", "소고기": "🥩",
  "냉동 생선살": "🐟", "고등어": "🐟", "갈치": "🐟", "오징어": "🦑", "새우": "🦐", "굴": "🦪", "바지락": "🐚", "멸치": "🐟", "북어": "🐟", "어묵": "🍢",
  "계란": "🥚", "두부": "🧈", "우유": "🥛", "치즈": "🧀",
  "햄/소시지": "🌭", "스팸": "🥫", "베이컨": "🥓",
  "무": "🥬", "배추": "🥬", "콩나물": "🌱", "시금치": "🥬", "애호박": "🥒", "가지": "🍆", "오이": "🥒", "양배추": "🥬", "파프리카": "🫑",
  "브로콜리": "🥦", "양파": "🧅", "대파": "🌿", "부추": "🌿", "깻잎": "🍃", "당근": "🥕", "열무": "🥬", "미나리": "🌿", "냉이": "🌿", "달래": "🌿", "연근": "🪷", "우엉": "🌱",
  "팽이버섯": "🍄", "느타리버섯": "🍄", "표고버섯": "🍄", "새송이버섯": "🍄",
  "감자": "🥔", "고구마": "🍠", "옥수수": "🌽", "단호박": "🎃", "도라지": "🌱",
};

// 재료 카테고리 — mealData의 INGREDIENT_CATEGORIES(객체)를 시트용 배열로 변환
const CATEGORY_ICON = {
  "고기": "🥩", "해물": "🐟", "유제품·계란": "🥚", "가공식품": "🌭", "채소": "🥬", "버섯": "🍄", "곡류·뿌리": "🥔",
};
const CATEGORY_LIST = Object.entries(INGREDIENT_CATEGORIES).map(([label, items]) => ({
  key: label,
  label,
  icon: CATEGORY_ICON[label] || "🧺",
  items,
}));
// 냉장고에 담을 수 있는 재료(=재료 설정 시트에 있는 것). 제철 재료 중 여기 없는 건 담기 대신 정보/메뉴를 보여줌
const FRIDGE_INGREDIENTS = new Set(Object.values(INGREDIENT_CATEGORIES).flat());

// 특정 재료가 실제로 들어간 메뉴 찾기 — req 또는 allIngredients에 그 재료명이 포함된 것만 (별미 우선)
const menusWithIngredient = (name) => {
  const out = [];
  for (const m of MENUS) {
    const all = m.allIngredients || [...(m.ingredients || []), ...(m.shoppingItems || [])];
    if ((all.includes(name) || (m.req || []).includes(name)) && !out.some((x) => x.menu === m.name))
      out.push({ menu: m.name, role: m.role });
  }
  return out.sort((a, b) => (a.role === "specialty" ? 0 : 1) - (b.role === "specialty" ? 0 : 1));
};

// 실제 사진 경로 슬롯 — 프로덕션에선 여기에 사진 URL/경로만 넣으면 자동으로 사진이 보임
// 예) "닭고기": "/ingredients/chicken.jpg"
const INGREDIENT_IMG = {
  // "닭고기": "/ingredients/chicken.jpg",
};

// 재료 → 타일 배경 톤 (사진 없을 때 또렷하게)
const INGREDIENT_TINT = {
  "닭고기": "#FAD9C4", "돼지 다짐육": "#FAD2C2", "소고기 불고기용": "#F6C9BC", "햄/소시지": "#FBDAC9",
  "냉동 생선살": "#DCEAF1", "어묵": "#E6EBF0",
  "계란": "#FBEFCF", "두부": "#F4ECDD", "팽이버섯": "#EFE6D6", "감자/고구마": "#F1E2C2",
  "무": "#EAF0DD", "콩나물": "#E6EFD3", "파프리카": "#FBDFCE", "양배추": "#E6EFD6",
  "브로콜리": "#E2EDCE", "오이": "#E4EFD8",
};
const getTint = (name) => INGREDIENT_TINT[name] || "#F6E6CB";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
// 끼니 (다중선택, 기본 저녁)
const MEALS = ["아침", "점심", "저녁"];
const MEAL_STYLE = {
  "아침": { bg: "#FBEFCF", fg: "#B6831E", icon: "🌅" },
  "점심": { bg: "#EAF0DC", fg: "#5E7A41", icon: "🍱" },
  "저녁": { bg: "#FCE4D7", fg: "#C2502F", icon: "🌙" },
};

// 하단 탭 — 홈 / 재료 설정 / 식단표 / 추천메뉴
const TABS = [
  { key: "home", label: "홈", emoji: "🏠" },
  { key: "ingredients", label: "재료 설정", emoji: "🧺" },
  { key: "plan", label: "식단표", emoji: "📅" },
  { key: "menu", label: "추천메뉴", emoji: "✨" },
  { key: "find", label: "메뉴찾기", emoji: "🔎" },
];
const TAB_SUBTITLE = {
  home: "일주일 식단을 짜볼까요? 🍀",
  ingredients: "냉장고에 있는 재료를 담아두세요",
  plan: "이번 주 식단표 · 장보기 리스트",
  menu: "이번 달 제철·색다른 메뉴 추천",
  find: "재료로 만들 수 있는 메뉴 찾기",
};

/* ------------------------------------------------------------------ *
 *  식단표 생성 로직 (1순위 = 재료 안 버리기)
 * ------------------------------------------------------------------ */

// 늘 있다고 보는 기본 식재료 — 매칭에서 항상 충족으로 간주
const PANTRY = new Set(["쌀", "김치", "미역", "다시마", "멸치", "양파", "대파", "마늘", "당근"]);

// 메뉴에서 장보기 필요한 특별재료 (데이터의 shoppingItems 사용)
const getShoppingItems = (menu) => (menu && menu.shoppingItems) || [];

// 메뉴를 담은 재료로 만들 수 있나? — req(필요재료 전체)가 전부 (담은 재료 ∪ PANTRY)에 있어야 함
//  req가 빈 배열이면 특별히 필요한 재료가 없는 것(예: 잡곡밥) → 항상 만들 수 있음
const canMake = (menu, selectedSet) => {
  const req = menu.req || menu.ingredients || [];
  return req.every((i) => PANTRY.has(i) || selectedSet.has(i));
};

// 한 메뉴를 만들려고 사면 되는 재료 = allIngredients(전체) 중 (담은 재료 ∪ PANTRY)에 없는 것 전부
const missingIngredients = (menu, selectedSet) => {
  if (!menu) return [];
  const all = menu.allIngredients || [...(menu.ingredients || []), ...(menu.shoppingItems || [])];
  const out = [];
  all.forEach((i) => {
    if (!PANTRY.has(i) && !selectedSet.has(i) && !out.includes(i)) out.push(i);
  });
  return out;
};

// 역할 태그 색 (별미 강조에 사용)
const ROLE_STYLE = {
  "별미": { bg: "#EDE3F3", fg: "#7A5AA6" },
};


const LOADING_MSGS = ["냉장고 재료 확인 중… 🧺", "일주일 식단 짜는 중… 🍳"];

export default function RealHomeMeal() {
  const [selected, setSelected] = useState(["계란", "두부", "콩나물", "감자"]);
  const [meals, setMeals] = useState(["저녁"]); // 끼니 다중선택 (기본 저녁)
  const [restDays, setRestDays] = useState(["수", "토"]); // 외식하는 요일
  const [specialFreq, setSpecialFreq] = useState("sometimes"); // 색다른 메뉴: none | sometimes | often | veryOften
  const [excludeSpicy, setExcludeSpicy] = useState(false); // 🌶️ 고춧가루 제외 (아이용)
  const [hasPlan, setHasPlan] = useState(false); // 식단을 한 번이라도 짰는지
  const [regen, setRegen] = useState(0); // 다시 짜기 카운터
  const [activeMenu, setActiveMenu] = useState(null); // 레시피 모달
  const [tab, setTab] = useState("home"); // home | ingredients | plan | menu
  const [sheetOpen, setSheetOpen] = useState(false); // 재료 바꾸기 시트
  const [receiptOpen, setReceiptOpen] = useState(false); // 📝 영수증/주문내역 담기 시트
  const [customIngredients, setCustomIngredients] = useState([]); // 직접 추가 [{name, cat}]
  const [findQuery, setFindQuery] = useState(""); // 🔎 메뉴찾기 탭 재료 검색어
  const [generating, setGenerating] = useState(false); // 식단 짜는 중 (로딩 연출)
  const [loadingStep, setLoadingStep] = useState(0); // 로딩 메시지 인덱스
  const [imgBusy, setImgBusy] = useState(null); // 이미지 작업 중: null | "save" | "share"
  const genTimer = useRef(null);
  const captureRef = useRef(null); // 식단표 캡처 영역
  const reducedMotion = useReducedMotion();

  // 📷 식단표 캡처 — 저장/공유 공용 (보여주기 전용, 식단 데이터/생성 로직은 안 건드림)
  //  캡처 영역·워터마크·크림 배경 채우기·oklch 보정은 기존 그대로
  const CAPTURE_FONT = "'Pretendard Variable','Pretendard','Noto Sans KR',system-ui,sans-serif";
  const capturePlanBlob = async () => {
    const node = captureRef.current;
    if (!node) throw new Error("캡처 영역 없음");
    // 폰트가 다 준비된 뒤 캡처 (한글 깨짐 방지) — Variable 1개 파일이 모든 굵기 커버
    try {
      if (document.fonts && document.fonts.load) {
        await Promise.all([
          document.fonts.load("400 16px 'Pretendard Variable'"),
          document.fonts.load("700 16px 'Pretendard Variable'"),
        ]);
      }
      await document.fonts.ready;
    } catch { /* 폰트 API 미지원 환경은 무시 */ }
    // html-to-image — 웹폰트를 임베드해 네이티브 렌더 → 한글이 굵기 상관없이 안 깨짐
    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 2, // 고해상도
      backgroundColor: "#FCF7F0", // 앱 크림 배경
      style: { fontFamily: CAPTURE_FONT }, // 캡처 영역 폰트 명시
    });
    const blob = await (await fetch(dataUrl)).blob();
    if (!blob) throw new Error("이미지 생성 실패");
    return blob;
  };

  // png 파일 다운로드
  const downloadBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "이번주_식단표.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // 💾 저장하기 — 공유 시트 없이 무조건 다운로드
  const savePlanImage = async () => {
    if (imgBusy) return;
    setImgBusy("save");
    try {
      downloadBlob(await capturePlanBlob());
    } catch (e) {
      console.error("save image failed:", e);
      alert("이미지를 만들지 못했어요. 다시 시도해 주세요 🙏");
    } finally {
      setImgBusy(null);
    }
  };

  // 📤 공유하기 — Web Share API로 공유 시트. 미지원(주로 PC)이면 저장으로 폴백 + 안내
  const sharePlanImage = async () => {
    if (imgBusy) return;
    setImgBusy("share");
    try {
      const blob = await capturePlanBlob();
      const file = new File([blob], "이번주_식단표.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "이번 주 식단표", text: "오늘 뭐 먹지? · 이번 주 우리집 식단표 🍚" });
      } else {
        downloadBlob(blob);
        alert("이 브라우저에서는 저장으로 대신할게요 💾");
      }
    } catch (e) {
      if (!(e && e.name === "AbortError")) {
        // 공유 시트 취소(AbortError)는 조용히 넘어감
        console.error("share image failed:", e);
        alert("이미지를 만들지 못했어요. 다시 시도해 주세요 🙏");
      }
    } finally {
      setImgBusy(null);
    }
  };

  // 식단 짜기 → 약 1.2초 로딩 후 결과 등장
  const runGenerate = ({ goToPlan = false } = {}) => {
    setRegen((r) => r + 1);
    if (goToPlan) {
      setHasPlan(true);
      setTab("plan");
    }
    setGenerating(true);
    if (genTimer.current) clearTimeout(genTimer.current);
    genTimer.current = setTimeout(() => setGenerating(false), 1200);
  };
  useEffect(() => () => clearTimeout(genTimer.current), []);

  // 로딩 메시지 번갈아 표시
  useEffect(() => {
    if (!generating) return;
    setLoadingStep(0);
    const t = setInterval(() => setLoadingStep((s) => s + 1), 600);
    return () => clearInterval(t);
  }, [generating]);

  // ESC로 모달 닫기
  useEffect(() => {
    if (!activeMenu) return;
    const onKey = (e) => e.key === "Escape" && setActiveMenu(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeMenu]);

  const toggleIngredient = (name) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  // 📝 영수증/주문내역으로 인식한 재료를 한 번에 selected에 추가 (중복 제외)
  const addIngredientsBulk = (names) => {
    setSelected((prev) => {
      const set = new Set(prev);
      names.forEach((n) => n && set.add(n));
      return [...set];
    });
  };

  // 직접 추가 재료 (selected·장보기엔 반영, 메뉴 데이터 없을 수 있으니 식단표는 데이터 있는 재료 위주)
  const addCustomIngredient = (cat, rawName) => {
    const name = rawName.trim();
    if (!name) return;
    setCustomIngredients((prev) => (prev.some((c) => c.name === name) ? prev : [...prev, { name, cat }]));
    setSelected((prev) => (prev.includes(name) ? prev : [...prev, name])); // 바로 담김
  };
  const deleteCustomIngredient = (name) => {
    setCustomIngredients((prev) => prev.filter((c) => c.name !== name));
    setSelected((prev) => prev.filter((n) => n !== name));
  };

  // 끼니 토글 (최소 1개 유지, 항상 아침→점심→저녁 순서)
  const toggleMeal = (m) =>
    setMeals((prev) => {
      const next = prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m];
      const ordered = MEALS.filter((x) => next.includes(x));
      return ordered.length ? ordered : prev;
    });
  const orderedMeals = MEALS.filter((m) => meals.includes(m));

  // 외식하는 요일 토글 (다중 선택)
  const toggleRestDay = (d) =>
    setRestDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  // 이번 달 제철 재료 (식단·추천 우선순위 + 식단표 화면의 제철 추천 섹션)
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  // 🧺 내 재료로 할 수 있는 메뉴 — 핵심재료가 담은 재료에 다 있는 것(needShopping 제외)
  const myMenus = useMemo(() => {
    const sel = new Set(selected);
    if (!sel.size) return [];
    return MENUS
      .filter((m) => m.role !== "bap" && !m.needShopping && canMake(m, sel))
      .map((m) => ({ menu: m.name, ingredients: m.ingredients }));
  }, [selected]);

  // 만들 수 있는 한 상 메뉴가 적으면(반복 불가피) 안내
  const fewMenus = myMenus.length < 20;

  // 🔎 메뉴찾기 — 입력 재료(부분일치)가 req에 든 메뉴. needShopping 제외.
  //  "입력재료 + PANTRY + 담을수있는재료(INGREDIENT_CATEGORIES)"로 완성 가능한 것만 노출(특수재료 메뉴는 제외).
  //  매칭은 식단표와 동일한 canMake 재사용 — 담을수있는재료 전체를 가진 셈 치고 검사.
  const findResults = useMemo(() => {
    const q = findQuery.trim();
    if (!q) return null;
    // 입력 재료 = 담을 수 있는 재료 중 검색어 부분일치
    const inputSet = new Set([...FRIDGE_INGREDIENTS].filter((ing) => ing.includes(q)));
    const have = (i) => inputSet.has(i) || PANTRY.has(i); // 입력재료 ∪ PANTRY
    const out = [];
    for (const m of MENUS) {
      if (m.needShopping) continue;
      const req = m.req || [];
      if (!req.some((i) => inputSet.has(i))) continue; // 검색 재료가 req에 들어야 함
      if (!canMake(m, FRIDGE_INGREDIENTS)) continue; // 담을수있는재료+PANTRY로 완성 가능한 것만
      const missing = req.filter((i) => !have(i)); // 부족 재료 (전부 담을 수 있는 재료)
      out.push({ name: m.name, missing, ready: missing.length === 0 });
    }
    // 바로 가능 먼저, 그다음 부족 재료 적은 순
    out.sort((a, b) => (a.ready === b.ready ? a.missing.length - b.missing.length : a.ready ? -1 : 1));
    return out;
  }, [findQuery]);

  // ✨ 색다른 메뉴(별미) 전체 — needShopping 메뉴를 카테고리(양식/면류/밥·덮밥/별미)별로 그룹 (랜덤·제한 없이 전부)
  const specialtyGroups = useMemo(
    () =>
      SPECIAL_CATS.map(({ cat, icon }) => ({
        cat,
        icon,
        items: MENUS.filter((m) => m.needShopping && m.tag === cat).map((m) => m.name),
      })).filter((g) => g.items.length),
    []
  );

  // 일주일 식단표 생성 — 기본 한 상은 generateWeekPlan이 처리
  //  (안 겹치게 + 무작위 섞기 + 어제와 안 겹치게 + 풀 부족하면 골고루 번갈아).
  //  색다른(별미) 슬라이더는 이 함수 밖에서 별도 처리. "다시 짜기"(regen)마다 새로 섞임.
  const baseWeekPlan = useMemo(() => {
    const base = generateWeekPlan(MENUS, selected, { eatOutDays: restDays, excludeSpicy });

    // 색다른(별미) — needShopping 단품. 슬라이더 빈도만큼 집밥 날에 분산.
    const selSet = new Set(selected);
    const cookingList = base.filter((d) => !d.eatOut).map((d) => d.day);
    const wantDanpum =
      specialFreq === "none" ? 0
      : specialFreq === "sometimes" ? 1
      : specialFreq === "often" ? 2
      : 3 + Math.floor(Math.random() * 2); // veryOften: 3~4
    const danpumPool = MENUS.filter((m) => m.needShopping && m.role !== "banchan" && (!excludeSpicy || !m.spicy));
    for (let i = danpumPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [danpumPool[i], danpumPool[j]] = [danpumPool[j], danpumPool[i]];
    }
    const danpumCount = Math.min(wantDanpum, cookingList.length, danpumPool.length);
    const danpumDays = new Set();
    for (let i = 0; i < danpumCount; i++) {
      let idx = Math.round(((i + 0.5) / Math.max(1, danpumCount)) * cookingList.length - 0.5);
      idx = ((idx % cookingList.length) + cookingList.length) % cookingList.length;
      danpumDays.add(cookingList[idx]);
    }
    let dpos = 0;
    const usedDanpum = new Set();
    const pickDanpum = () => {
      for (let t = 0; t < danpumPool.length; t++) {
        const m = danpumPool[(dpos + t) % danpumPool.length];
        if (!usedDanpum.has(m.name)) { dpos = (dpos + t + 1) % danpumPool.length; usedDanpum.add(m.name); return m; }
      }
      return null;
    };
    const primaryMeal = meals.includes("저녁") ? "저녁" : MEALS.filter((x) => meals.includes(x)).slice(-1)[0] || "저녁";

    // generateWeekPlan 결과 → 렌더용 구조로 변환 (+ 별미 덮어쓰기)
    return base.map((d) => {
      if (d.eatOut) return { day: d.day, rest: true };
      if (danpumDays.has(d.day)) {
        const m = pickDanpum();
        if (m) {
          return {
            day: d.day,
            special: true,
            mealName: primaryMeal,
            sp: { menu: m.name, emoji: getEmoji(m.name), tag: m.tag, shop: missingIngredients(m, selSet), min: getMeta(m.name).min },
          };
        }
      }
      // 일반 한 상 — 밥/국/메인/반찬을 칩 렌더용 items 배열로 (김치는 강제로 넣지 않음)
      const items = [];
      if (d.bap) items.push({ role: "밥", menu: d.bap.name });
      if (d.gukEmpty) items.push({ role: "국", placeholder: true, menu: "재료를 더 담으면 국이 늘어나요 🍲" });
      else if (d.guk) items.push({ role: "국", menu: d.guk.name });
      if (d.mainEmpty) items.push({ role: "메인", placeholder: true, menu: "재료를 더 담으면 메인이 늘어나요 🍖" });
      else if (d.main) items.push({ role: "메인", menu: d.main.name });
      (d.banchan || []).forEach((b) => items.push({ role: "반찬", menu: b.name }));
      const cook = items.filter((it) => !it.placeholder);
      const totalMin = cook.length ? Math.max(...cook.map((it) => getMeta(it.menu).min)) + (cook.length - 1) * 3 : 0;
      return { day: d.day, mealName: primaryMeal, items, totalMin };
    });
  }, [selected, meals, restDays, specialFreq, excludeSpicy, regen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 칸별 "바꾸기" — 이미 짜인 식단표에서 메뉴 한 칸만 같은 역할의 다른 메뉴로 교체 ───
  //  generateWeekPlan/매칭/데이터는 건드리지 않고, baseWeekPlan 위에 override만 덮어씌운다.
  const SWAP_RICE = ["잡곡밥", "흰쌀밥", "현미밥", "보리밥"]; // 밥은 데이터가 아니라 고정 밥 종류에서 교체

  // 역할별 "지금 재료로 만들 수 있는" 후보 풀 (밥은 고정 밥 종류)
  const swapPools = useMemo(() => {
    const sel = new Set(selected);
    const byRole = (role) =>
      MENUS.filter((m) => m.role === role && !m.needShopping && canMake(m, sel)).map((m) => m.name);
    return { 밥: SWAP_RICE, 국: byRole("guk"), 메인: byRole("main"), 반찬: byRole("banchan") };
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  // 칸 교체 override: { "요일|아이템index": 새메뉴이름 }. 식단 다시 짜면(=base가 바뀌면) 초기화.
  const [cellSwaps, setCellSwaps] = useState({});
  useEffect(() => {
    setCellSwaps({});
  }, [selected, meals, restDays, specialFreq, excludeSpicy, regen]);

  // baseWeekPlan + cellSwaps → 실제로 렌더/장보기/추천에 쓰는 weekPlan
  const weekPlan = useMemo(() => {
    return baseWeekPlan.map((d) => {
      if (d.rest || d.special || !d.items) return d;
      let changed = false;
      const items = d.items.map((it, i) => {
        const sw = cellSwaps[`${d.day}|${i}`];
        if (sw && !it.placeholder && sw !== it.menu) {
          changed = true;
          return { ...it, menu: sw };
        }
        return it;
      });
      if (!changed) return d;
      const cook = items.filter((it) => !it.placeholder);
      const totalMin = cook.length ? Math.max(...cook.map((it) => getMeta(it.menu).min)) + (cook.length - 1) * 3 : 0;
      return { ...d, items, totalMin };
    });
  }, [baseWeekPlan, cellSwaps]);

  // 🔄 버튼 핸들러 — 같은 역할의 다른 메뉴로 교체 (이번 주 다른 칸에 안 나온 메뉴 우선)
  const swapCell = useCallback(
    (dayName, itemIndex, role, currentMenu) => {
      const pool = swapPools[role] || [];
      const others = pool.filter((n) => n !== currentMenu);
      if (others.length === 0) return; // 후보 없음 (버튼이 숨겨져 있어 사실상 안 불림)

      // 이번 주 다른 칸에 이미 쓰인 메뉴 (지금 보이는 weekPlan 기준) — 다양성 유지용
      const used = new Set();
      weekPlan.forEach((d) => {
        if (d.rest) return;
        if (d.special) { used.add(d.sp.menu); return; }
        (d.items || []).forEach((it, i) => {
          if (!it.placeholder && !(d.day === dayName && i === itemIndex)) used.add(it.menu);
        });
      });
      const fresh = others.filter((n) => !used.has(n));
      const cands = fresh.length ? fresh : others; // 다 쓰였으면 그냥 후보 전체에서

      let next = cands[Math.floor(Math.random() * cands.length)];
      for (let g = 0; g < 8 && cands.length > 1 && next === currentMenu; g++) {
        next = cands[Math.floor(Math.random() * cands.length)];
      }
      setCellSwaps((prev) => ({ ...prev, [`${dayName}|${itemIndex}`]: next }));
    },
    [swapPools, weekPlan]
  );

  const cookingDays = weekPlan.filter((d) => !d.rest).length;

  // 이번 주(월~일) 실제 날짜 — 앱 여는 시점(new Date()) 기준, 월요일 시작. { 월: "6/29", 화: "6/30", ... }
  const weekDates = useMemo(() => {
    const today = new Date();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
    const map = {};
    ["월", "화", "수", "목", "금", "토", "일"].forEach((d, i) => {
      const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      map[d] = `${dt.getMonth() + 1}/${dt.getDate()}`;
    });
    return map;
  }, []);

  // 이번 주 장보기 리스트 — 한 주 식단의 각 메뉴에 필요한 재료 중 담은 재료·PANTRY에 없는 것 전부 (중복 제거)
  const shoppingList = useMemo(() => {
    const sel = new Set(selected);
    const need = [];
    const add = (name) => missingIngredients(MENU_BY_NAME[name], sel).forEach((i) => { if (!need.includes(i)) need.push(i); });
    weekPlan.forEach((d) => {
      if (d.rest) return;
      if (d.special) { add(d.sp.menu); return; }
      d.items.forEach((it) => { if (!it.placeholder) add(it.menu); });
    });
    return need;
  }, [weekPlan, selected]);

  // 🛒 재료 하나만 더 사면 — 담은 재료 + PANTRY로 "딱 하나"만 부족한 메뉴들 (부족재료별로 묶음)
  //  부족재료가 재료설정에 담을 수 있는 것(INGREDIENT_CATEGORIES)일 때만. 기존 req/PANTRY 규칙 재사용.
  const oneMoreGroups = useMemo(() => {
    const fridge = new Set(selected);
    if (!fridge.size) return [];
    const have = (i) => fridge.has(i) || PANTRY.has(i);
    const byMissing = new Map(); // 부족재료 → [메뉴이름]
    for (const m of MENUS) {
      if (m.needShopping) continue; // 장보기 메뉴 제외
      const missing = (m.req || []).filter((i) => !have(i));
      if (missing.length !== 1) continue; // 딱 1개만 부족
      const miss = missing[0];
      if (!FRIDGE_INGREDIENTS.has(miss)) continue; // 담을 수 있는 재료만(특수재료 제외)
      if (!byMissing.has(miss)) byMissing.set(miss, []);
      byMissing.get(miss).push(m.name);
    }
    // 흔한 부족재료(메뉴 많은 것) 위주, 그룹당 최대 4개·전체 최대 8개
    const groups = [...byMissing.entries()].map(([ing, menus]) => ({ ing, menus })).sort((a, b) => b.menus.length - a.menus.length);
    const out = [];
    let total = 0;
    for (const g of groups) {
      const room = 8 - total;
      if (room <= 0) break;
      const menus = g.menus.slice(0, Math.min(4, room));
      out.push({ ing: g.ing, menus });
      total += menus.length;
    }
    return out;
  }, [selected]);


  return (
    <div
      style={{
        background: "radial-gradient(120% 90% at 50% 0%, #FCF2E8 0%, #F3E7D7 100%)",
        color: C.ink,
        fontFamily: "'Paperlogy','Inter','Pretendard',system-ui,sans-serif",
      }}
      className="flex min-h-screen w-full justify-center"
    >
      {/* 폰 셸 — 모바일은 꽉 차게, 큰 화면은 가운데 480px 폰 모양 */}
      <div
        className="relative flex min-h-screen w-full max-w-[480px] flex-col"
        style={{ background: "#FCF7F0", boxShadow: "0 0 0 1px rgba(58,42,32,0.06), 0 0 60px -16px rgba(58,42,32,0.28)" }}
      >
        {/* 상단 앱바 (sticky) */}
        <header
          className="sticky top-0 z-30 px-5 pb-3 pt-4"
          style={{
            background: `linear-gradient(180deg, #FFF4E3 0%, ${C.canvas} 100%)`,
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div className="flex items-center justify-between">
            <h1 className="text-[19px] font-bold tracking-tight" style={{ color: C.ink }}>
              🍳 오늘 뭐 먹지?
            </h1>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: C.goldSoft, color: C.gold }}
            >
              현실 집밥 편
            </span>
          </div>
          <p className="mt-1 text-[12px]" style={{ color: C.sub }}>
            {TAB_SUBTITLE[tab]}
          </p>
        </header>

        {/* 콘텐츠 (스크롤) */}
        <main className="flex-1 px-5 pb-28 pt-4">
          {/* 🏠 홈 — 시작 */}
          {/* 🏠 홈 — 시작 */}
          {tab === "home" && (
            <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: "62vh" }}>
              <div className="text-[64px] leading-none">🍳</div>
              <h2 className="mt-4 text-[26px] font-bold tracking-tight" style={{ color: C.ink }}>오늘 뭐 먹지?</h2>
              <p className="mt-2 text-[15px]" style={{ color: C.sub }}>일주일 식단을 짜볼까요? 🍀</p>
              <button
                onClick={() => setTab("ingredients")}
                className="mt-8 flex items-center justify-center gap-2 rounded-2xl px-10 py-4 text-[16px] font-bold transition-all"
                style={{ background: C.gold, color: "#fff", boxShadow: "0 18px 34px -16px rgba(217,96,63,0.9)" }}
              >
                <Sparkles size={18} strokeWidth={2.3} /> 시작하기
              </button>
            </div>
          )}

          {/* 🧺 재료 설정 — 냉장고 재료 + 식단 설정 */}
          {tab === "ingredients" && (
            <div className="space-y-4">
              {/* 섹션 1 — 냉장고 재료 */}
              <Card>
                <div className="flex items-center justify-between">
                  <SectionTitle icon={<span className="text-[15px]">🧺</span>} label="냉장고 재료" noMargin />
                  <span className="text-[12px]" style={{ color: C.sub }}>{selected.length}개 담음</span>
                </div>
                {selected.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selected.map((name) => (
                      <button
                        key={name}
                        onClick={() => toggleIngredient(name)}
                        aria-label={`${name} 빼기`}
                        className="inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1.5 text-[12px] font-semibold"
                        style={{ background: C.gold, color: "#fff", boxShadow: "0 4px 10px -6px rgba(217,96,63,0.9)" }}
                      >
                        {name}
                        <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.28)" }}>
                          <X size={10} strokeWidth={3.2} />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-[12.5px]" style={{ color: C.sub }}>아직 담은 재료가 없어요. 아래에서 담아보세요.</p>
                )}
                <button
                  onClick={() => setSheetOpen(true)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-[14px] font-bold"
                  style={{ background: C.goldSoft, color: C.gold, border: `1px solid ${C.gold}55` }}
                >
                  🧺 재료 바꾸기 · 담기
                </button>
                <button
                  onClick={() => setReceiptOpen(true)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-[14px] font-bold"
                  style={{ background: "#fff", color: C.ink, border: `1px solid ${C.line}` }}
                >
                  📝 영수증/주문내역으로 한 번에 담기
                </button>
              </Card>

              {/* 섹션 2 — 식단 설정 */}
              <Card>
                <SectionTitle icon={<span className="text-[15px]">⚙️</span>} label="식단 설정" />
                <PlanControls
                  meals={meals}
                  onToggleMeal={toggleMeal}
                  restDays={restDays}
                  onToggleRestDay={toggleRestDay}
                  specialFreq={specialFreq}
                  onSetSpecialFreq={setSpecialFreq}
                  excludeSpicy={excludeSpicy}
                  onToggleSpicy={() => setExcludeSpicy((v) => !v)}
                  bare
                />
              </Card>

              {/* 식단 짜기 — 바로 생성하고 식단표 탭으로 */}
              <button
                onClick={() => runGenerate({ goToPlan: true })}
                disabled={selected.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold transition-all"
                style={{
                  background: selected.length === 0 ? C.line : C.gold,
                  color: selected.length === 0 ? C.sub : "#fff",
                  boxShadow: selected.length === 0 ? "none" : "0 16px 30px -16px rgba(217,96,63,0.9)",
                }}
              >
                <Sparkles size={18} strokeWidth={2.3} /> 식단 짜기
              </button>
            </div>
          )}

          {/* 📅 식단표 */}
          {tab === "plan" && (generating ? (
            <LoadingScreen msg={LOADING_MSGS[loadingStep % LOADING_MSGS.length]} />
          ) : selected.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: "55vh" }}>
              <div className="text-[46px] leading-none">🧺</div>
              <p className="mt-3 text-[14.5px] font-bold" style={{ color: C.ink }}>먼저 재료를 설정해주세요</p>
              <p className="mt-1 text-[12.5px]" style={{ color: C.sub }}>냉장고에 있는 재료를 담아야 식단을 짤 수 있어요</p>
              <button
                onClick={() => setTab("ingredients")}
                className="mt-5 flex items-center justify-center gap-1.5 rounded-2xl px-6 py-3 text-[14px] font-bold"
                style={{ background: C.gold, color: "#fff" }}
              >
                🧺 재료 설정하러 가기
              </button>
            </div>
          ) : hasPlan ? (
            <div className="space-y-4 plan-in" key={regen}>
              {/* 메인/국 빈자리 안내 — 액자(캡처) 밖이라 이미지엔 안 들어감 */}
              {weekPlan.some((d) => !d.rest && !d.special && (d.items || []).some((it) => it.placeholder)) && (
                <p
                  className="rounded-xl px-3 py-2 text-[11.5px] font-medium leading-snug"
                  style={{ background: C.canvas, color: C.sub, border: `1px solid ${C.line}` }}
                >
                  🍖 재료를 더 담으면 비어 있는 메인·국 자리가 채워져요
                </p>
              )}

              {/* 📷 액자 프레임 = 캡처 영역 — 저장/공유 시 프레임까지 한 장에 담김
                  한글 웹폰트(Pretendard) 명시 + 종이 플래너 느낌의 이중 테두리 */}
              <div
                ref={captureRef}
                style={{
                  background: "#FCF7F0",
                  borderRadius: 22,
                  padding: 9,
                  border: `1.5px solid ${C.gold}55`,
                  boxShadow: "0 12px 34px -18px rgba(120,72,48,0.40)",
                  fontFamily: CAPTURE_FONT,
                }}
              >
                {/* 안쪽 점선 프레임 (이중 테두리) */}
                <div style={{ borderRadius: 15, border: `1.5px dashed ${C.gold}40`, padding: 12, background: "#FFFDF8" }}>
                  <div className="flex items-center justify-between px-0.5">
                    <SectionTitle icon={<CalendarDays size={16} />} label="이번 주 식단표" noMargin />
                    <span className="text-[12px]" style={{ color: C.sub }}>
                      집밥 {cookingDays}일 · 외식 {restDays.length}일
                    </span>
                  </div>
                  {/* 위클리 플래너 — 요일별 가로 줄(월~일 세로로 쌓임) + 맨 아래 MEMO */}
                  <div className="mt-3 space-y-2">
                    {weekPlan.map((d) => (
                      <DayCell key={d.day} day={d} dateNum={weekDates[d.day]} onOpen={setActiveMenu} onSwap={swapCell} swapPools={swapPools} />
                    ))}
                    <MemoCell />
                  </div>
                  {/* 워터마크 */}
                  <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[10.5px] font-semibold">
                    <span style={{ color: C.gold }}>🍳 오늘 뭐 먹지?</span>
                    <span style={{ color: C.sub }}>· @mommysecondlife</span>
                  </div>
                </div>
              </div>

              {/* 저장하기 / 공유하기 — 보조(아웃라인) */}
              <div className="flex gap-2">
                <button
                  onClick={savePlanImage}
                  disabled={!!imgBusy}
                  className={ACTION_BTN}
                  style={{ ...ACTION_SUB, opacity: imgBusy && imgBusy !== "save" ? 0.55 : 1 }}
                >
                  <span className="text-[15px] leading-none">💾</span>
                  {imgBusy === "save" ? "저장 중…" : "저장하기"}
                </button>
                <button
                  onClick={sharePlanImage}
                  disabled={!!imgBusy}
                  className={ACTION_BTN}
                  style={{ ...ACTION_SUB, opacity: imgBusy && imgBusy !== "share" ? 0.55 : 1 }}
                >
                  <Share2 size={16} strokeWidth={2.4} />
                  {imgBusy === "share" ? "준비 중…" : "공유하기"}
                </button>
              </div>

              {fewMenus && (
                <button
                  onClick={() => setTab("ingredients")}
                  className="w-full rounded-2xl px-4 py-3 text-center text-[12.5px] font-semibold"
                  style={{ background: C.sageSoft, color: C.sage, border: `1px solid ${C.sage}33` }}
                >
                  🧺 재료를 더 담으면 메뉴가 늘어나요 · 재료 설정에서 추가 ›
                </button>
              )}

              {/* 다시 짜기(메인) / 설정 바꾸기(보조) */}
              <div className="flex gap-2">
                <button onClick={() => runGenerate()} className={ACTION_BTN} style={ACTION_MAIN}>
                  <RefreshCw size={16} strokeWidth={2.4} /> 다시 짜기
                </button>
                <button onClick={() => setTab("ingredients")} className={ACTION_BTN} style={ACTION_SUB}>
                  <span className="text-[15px] leading-none">⚙️</span> 설정 바꾸기
                </button>
              </div>

              {/* 재료 하나만 더 사면 — 딱 하나 부족한 메뉴 (문제→해결책 흐름: 메인 없음 다음에 바로) */}
              <OneMoreSection groups={oneMoreGroups} onOpen={setActiveMenu} />

              {/* 이번 주 장보기 리스트 (해결책 다음 → 실제 살 것) */}
              <ShoppingListSection items={shoppingList} />

              <p className="pb-1 text-center text-[12px]" style={{ color: C.sub }}>엄마도 매일 잘 해내고 있어요 🍀</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: "55vh" }}>
              <div className="text-[52px] leading-none">📅</div>
              <p className="mt-3 text-[15px] font-bold" style={{ color: C.ink }}>준비됐어요!</p>
              <p className="mt-1 text-[12.5px]" style={{ color: C.sub }}>
                담은 재료 {selected.length}개 · 끼니 {orderedMeals.join("·")} · 외식 {restDays.length}일
              </p>
              <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
                설정은 ‘재료 설정’ 탭에서 바꿀 수 있어요
              </p>
              <button
                onClick={() => runGenerate({ goToPlan: true })}
                className="mt-6 flex items-center justify-center gap-2 rounded-2xl px-10 py-4 text-[16px] font-bold transition-all"
                style={{ background: C.gold, color: "#fff", boxShadow: "0 18px 34px -16px rgba(217,96,63,0.9)" }}
              >
                <Sparkles size={18} strokeWidth={2.3} /> 식단 짜기
              </button>
            </div>
          ))}

          {/* ✨ 추천메뉴 — 제철 메뉴 + 색다른 메뉴 + 내 재료로 할 수 있는 메뉴 */}
          {tab === "menu" && (
            <div className="space-y-4">
              {/* 섹션 1 — 이번 달 제철 메뉴 (월 이동) */}
              <SeasonalSection
                currentMonth={currentMonth}
                selected={selected}
                onToggle={toggleIngredient}
                onOpenMenu={setActiveMenu}
              />

              {/* 섹션 2 — 색다른 메뉴(별미): 카테고리 아코디언 */}
              <SpecialtySection groups={specialtyGroups} onOpenMenu={setActiveMenu} />
            </div>
          )}

          {/* 🔎 메뉴찾기 — 재료로 만들 수 있는 메뉴 검색 (부족 재료 표시) */}
          {tab === "find" && (
            <div className="space-y-4">
              {/* 큰 검색칸 */}
              <div
                className="flex items-center gap-2 rounded-2xl px-4 py-3.5"
                style={{ background: "#fff", border: `1px solid ${C.line}`, boxShadow: "0 6px 16px -10px rgba(120,72,48,0.25)" }}
              >
                <Search size={19} strokeWidth={2.4} style={{ color: C.gold }} />
                <input
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  placeholder="재료를 입력해보세요 (예: 두부, 닭고기, 애호박)"
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none"
                  style={{ color: C.ink }}
                />
                {findQuery && (
                  <button onClick={() => setFindQuery("")} aria-label="검색 지우기" style={{ color: C.sub }}>
                    <X size={17} strokeWidth={2.4} />
                  </button>
                )}
              </div>

              {!findResults ? (
                <p className="px-1 pt-1 text-[12.5px] leading-relaxed" style={{ color: C.sub }}>
                  재료 이름을 입력하면, 그 재료로 만들 수 있는 메뉴를 찾아드려요 🧺
                  <br />한 글자만 쳐도 돼요 (예: ‘두’ → 두부 메뉴).
                </p>
              ) : findResults.length > 0 ? (
                <Card>
                  <div className="flex items-center justify-between">
                    <SectionTitle icon={<Search size={15} strokeWidth={2.4} />} label={`‘${findQuery.trim()}’ (으)로 만드는 메뉴`} noMargin />
                    <span className="text-[12px]" style={{ color: C.sub }}>{findResults.length}개</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {findResults.map((r) => (
                      <FindMenuCard key={r.name} result={r} onOpen={setActiveMenu} />
                    ))}
                  </div>
                </Card>
              ) : (
                <Empty text={`‘${findQuery.trim()}’ (으)로 지금 담을 수 있는 재료만으로 만들 메뉴가 없어요 🔍`} />
              )}
            </div>
          )}
        </main>

        {/* 하단 탭바 */}
        <nav
          className="sticky bottom-0 z-30 flex"
          style={{ background: C.card, borderTop: `1px solid ${C.line}`, boxShadow: "0 -8px 24px -20px rgba(58,42,32,0.5)" }}
        >
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex flex-1 flex-col items-center gap-0.5 py-2 pb-2.5 transition-colors"
                style={{ color: on ? C.gold : C.sub }}
              >
                <span className="text-[19px] leading-none" style={{ filter: on ? "none" : "grayscale(0.4) opacity(0.7)" }}>
                  {t.emoji}
                </span>
                <span className="text-[10.5px]" style={{ fontWeight: on ? 700 : 500 }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 재료 바꾸기 시트 (닫으면 식단표 자동 재생성) */}
      <AddSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        selected={selected}
        onToggle={toggleIngredient}
        custom={customIngredients}
        onAddCustom={addCustomIngredient}
        onDeleteCustom={deleteCustomIngredient}
        reduced={reducedMotion}
      />

      {/* 📝 영수증/주문내역으로 재료 담기 시트 */}
      <ReceiptSheet
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        selected={selected}
        onAdd={addIngredientsBulk}
        reduced={reducedMotion}
      />

      {activeMenu && <RecipeModal menu={activeMenu} onClose={() => setActiveMenu(null)} />}
    </div>
  );
}

/* ----------------------------- 컴포넌트 ----------------------------- */

function Card({ children }) {
  return (
    <section
      className="rounded-3xl p-6 sm:p-7"
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        boxShadow: "0 18px 50px -36px rgba(58,42,32,0.28)",
      }}
    >
      {children}
    </section>
  );
}

function SectionTitle({ icon, label, noMargin }) {
  return (
    <div className={`flex items-center gap-2.5 ${noMargin ? "" : "mb-4"}`}>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-xl"
        style={{ background: C.goldSoft, color: C.gold }}
      >
        {icon}
      </span>
      <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: C.ink }}>
        {label}
      </h2>
    </div>
  );
}

// 설정 입력 컨트롤 — 끼니 / 외식하는 날 / 색다른 메뉴 / 고춧가루 제외
//  bare=true면 카드 래퍼 없이 내용만 (이미 Card 안에 들어갈 때)
function PlanControls({ meals, onToggleMeal, restDays, onToggleRestDay, specialFreq, onSetSpecialFreq, excludeSpicy, onToggleSpicy, bare }) {
  const FREQ_OPTIONS = [
    { key: "none", label: "없음" },
    { key: "sometimes", label: "가끔 (주1)" },
    { key: "often", label: "자주 (주2)" },
    { key: "veryOften", label: "매우 자주 (주3~4)" },
  ];
  const Wrapper = bare ? "div" : "section";
  const wrapStyle = bare
    ? {}
    : { background: C.card, border: `1px solid ${C.line}`, boxShadow: "0 18px 50px -36px rgba(58,42,32,0.28)" };
  return (
    <Wrapper className={bare ? "space-y-3" : "space-y-3 rounded-3xl p-4"} style={wrapStyle}>
      {/* 끼니 (다중선택) */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-semibold" style={{ color: C.sub }}>끼니</p>
        <div className="flex gap-2">
          {MEALS.map((m) => {
            const on = meals.includes(m);
            const s = MEAL_STYLE[m];
            return (
              <button
                key={m}
                onClick={() => onToggleMeal(m)}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all"
                style={{
                  background: on ? s.bg : "#fff",
                  color: on ? s.fg : C.sub,
                  border: `1px solid ${on ? s.fg + "55" : C.line}`,
                }}
              >
                {on && <Check size={12} strokeWidth={3} />}
                {s.icon} {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* 외식하는 날 (요일 선택, 다중) */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-semibold" style={{ color: C.sub }}>
          외식하는 날 <span style={{ color: C.line }}>·</span> 요일 선택
        </p>
        <div className="flex gap-1">
          {DAYS.map((d) => {
            const on = restDays.includes(d);
            return (
              <button
                key={d}
                onClick={() => onToggleRestDay(d)}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-all"
                style={{
                  background: on ? C.sage : "#fff",
                  color: on ? "#fff" : C.ink,
                  border: `1px solid ${on ? C.sage : C.line}`,
                  boxShadow: on ? "0 8px 18px -12px rgba(110,139,79,0.9)" : "none",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* 색다른 메뉴 빈도 */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-semibold" style={{ color: C.sub }}>
          색다른 메뉴 <span style={{ color: C.line }}>·</span> 일주일에
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {FREQ_OPTIONS.map((o) => {
            const on = specialFreq === o.key;
            return (
              <button
                key={o.key}
                onClick={() => onSetSpecialFreq(o.key)}
                className="rounded-xl py-2.5 text-[12.5px] font-semibold transition-all"
                style={{
                  background: on ? "#7A5AA6" : "#fff",
                  color: on ? "#fff" : C.ink,
                  border: `1px solid ${on ? "#7A5AA6" : C.line}`,
                  boxShadow: on ? "0 8px 18px -12px rgba(122,90,166,0.8)" : "none",
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌶️ 고춧가루 제외 (아이용) */}
      <button
        onClick={onToggleSpicy}
        className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-all"
        style={{
          background: excludeSpicy ? C.sageSoft : "#fff",
          border: `1px solid ${excludeSpicy ? C.sage : C.line}`,
        }}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
          style={{
            background: excludeSpicy ? C.sage : "#fff",
            border: `1.5px solid ${excludeSpicy ? C.sage : C.line}`,
          }}
        >
          {excludeSpicy && <Check size={13} strokeWidth={3.2} color="#fff" />}
        </span>
        <span className="text-[13px] font-semibold" style={{ color: excludeSpicy ? C.sage : C.ink }}>
          🌶️ 고춧가루 제외 <span style={{ color: C.sub, fontWeight: 500 }}>(아이용)</span>
        </span>
      </button>
    </Wrapper>
  );
}

// 🛒 이번 주 장보기 리스트 (다양하게 모드) — 부족 재료 + 쿠팡 검색 링크
function ShoppingListSection({ items }) {
  return (
    <section
      className="rounded-3xl p-5"
      style={{ background: C.card, border: `1px solid ${C.gold}40` }}
    >
      <div className="flex items-center gap-1.5">
        <span className="h-3.5 w-1 rounded-full" style={{ background: C.gold }} />
        <h2 className="text-[15px] font-bold tracking-tight" style={{ color: C.ink }}>
          🛒 이번 주 장보기 리스트
        </h2>
      </div>
      <p className="mb-2.5 mt-1 text-[11.5px]" style={{ color: C.sub }}>
        {items.length > 0
          ? "이번 주 식단에 필요한데 냉장고에 없는 재료예요 · 톡 누르면 쿠팡 검색"
          : "담은 재료로 다 되네요! 살 게 없어요 🎉"}
      </p>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((name) => (
            <button
              key={name}
              onClick={() => window.open(buildCoupangLink(name), "_blank", "noopener,noreferrer")}
              className="inline-flex items-center gap-1 rounded-full py-1.5 pl-3 pr-2.5 text-[12.5px] font-semibold transition-all"
              style={{ background: C.goldSoft, color: C.gold, border: `1px solid ${C.gold}55` }}
            >
              {name}
              <ShoppingCart size={12} strokeWidth={2.4} />
            </button>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <p className="mt-2.5 text-[10.5px] leading-snug" style={{ color: C.sub }}>
          쿠팡 파트너스 활동의 일환으로 수수료를 받을 수 있습니다
        </p>
      )}
    </section>
  );
}

// 🛒 재료 하나만 더 사면 — 딱 하나 부족한 메뉴를 부족재료별로 묶어 보여줌 (장보기 유도)
//  부족재료 칩 = 쿠팡 검색 링크(buildCoupangLink). 메뉴 칩 = 레시피 모달.
function OneMoreSection({ groups, onOpen }) {
  if (!groups.length) return null;
  return (
    <section className="rounded-3xl p-5" style={{ background: C.card, border: `1px solid ${C.gold}40` }}>
      <div className="flex items-center gap-1.5">
        <span className="h-3.5 w-1 rounded-full" style={{ background: C.gold }} />
        <h2 className="text-[15px] font-bold tracking-tight" style={{ color: C.ink }}>
          🛒 재료 하나만 더 사면, 이런 메뉴도 돼요!
        </h2>
      </div>
      <p className="mb-1 mt-1 text-[11.5px]" style={{ color: C.sub }}>
        딱 하나만 더 있으면 만들 수 있어요 · 재료를 톡 누르면 쿠팡 검색
      </p>
      <div className="mt-2 space-y-3">
        {groups.map((g) => (
          <div key={g.ing}>
            {/* 부족재료 (쿠팡 링크 자리 — 나중에 파트너스 링크 연결 가능) */}
            <button
              onClick={() => window.open(buildCoupangLink(g.ing), "_blank", "noopener,noreferrer")}
              className="inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-2 text-[12px] font-bold transition-all"
              style={{ background: C.goldSoft, color: C.gold, border: `1px solid ${C.gold}55` }}
            >
              🛒 {g.ing}만 더 있으면!
              <ShoppingCart size={11} strokeWidth={2.4} />
            </button>
            {/* 그 재료로 되는 메뉴들 */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {g.menus.map((menu) => (
                <button
                  key={menu}
                  onClick={() => onOpen(menu)}
                  className="inline-flex items-center gap-1 rounded-full bg-white py-1.5 px-3 text-[12.5px] font-medium transition-all"
                  style={{ color: C.ink, border: `1px solid ${C.line}` }}
                >
                  {getEmoji(menu)} {menu}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10.5px] leading-snug" style={{ color: C.sub }}>
        쿠팡 파트너스 활동의 일환으로 수수료를 받을 수 있습니다
      </p>
    </section>
  );
}

// 🌱 이번 달 제철 추천 (식단표 화면) — 재료 칩 + "이거 어때요?" 메뉴
//  · 냉장고에 담을 수 있는 재료(감자·오이 등) → 톡 누르면 담김
//  · 담을 수 없는 재료(매실·한치·두릅 등) → 톡 누르면 그 재료가 든 메뉴 or "제철이에요 🌱" 안내
function SeasonalSection({ currentMonth, selected, onToggle, onOpenMenu }) {
  const [viewMonth, setViewMonth] = useState(currentMonth); // 보고 있는 달 (1~12)
  const [infoFor, setInfoFor] = useState(null); // 정보를 펼친 제철 재료
  const seasonal = SEASONAL[viewMonth] || [];
  const goMonth = (delta) => {
    setViewMonth((m) => ((m - 1 + delta + 12) % 12) + 1); // 1↔12 순환
    setInfoFor(null); // 달 바뀌면 열린 정보 닫기 (재료가 달라짐)
  };
  if (!seasonal.length) return null;
  const infoCanStock = infoFor ? FRIDGE_INGREDIENTS.has(infoFor) : false;
  const infoOn = infoFor ? selected.includes(infoFor) : false;
  // "이거 어때요?"는 지금 보고 있는 제철 재료(누른 칩) 기준 — 그 재료가 실제로 든 메뉴만
  const focus = infoFor || seasonal.find((n) => selected.includes(n)) || seasonal[0];
  const focusPicks = focus ? menusWithIngredient(focus).slice(0, 8) : [];
  return (
    <section
      className="rounded-3xl p-5"
      style={{ background: C.sageSoft, border: `1px solid ${C.sage}33` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="self-center h-4 w-1 rounded-full" style={{ background: C.sage }} />
          <span className="text-[24px] font-extrabold leading-none tracking-tight" style={{ color: C.sage }}>
            {viewMonth}월
          </span>
          <h2 className="text-[14px] font-bold tracking-tight" style={{ color: C.sage }}>
            제철 추천{viewMonth === currentMonth && " · 이번 달"}
          </h2>
        </div>
        {/* 월 이동 ◀ ▶ */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goMonth(-1)}
            aria-label="이전 달"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            style={{ background: "#fff", color: C.sage, border: `1px solid ${C.sage}55` }}
          >
            <ChevronDown size={16} strokeWidth={2.6} style={{ transform: "rotate(90deg)" }} />
          </button>
          <button
            onClick={() => goMonth(1)}
            aria-label="다음 달"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            style={{ background: "#fff", color: C.sage, border: `1px solid ${C.sage}55` }}
          >
            <ChevronDown size={16} strokeWidth={2.6} style={{ transform: "rotate(-90deg)" }} />
          </button>
        </div>
      </div>
      <p className="mb-2.5 mt-1 text-[11.5px]" style={{ color: C.sub }}>
        톡 누르면 제철 정보가 보여요 · 담을 수 있는 재료는 냉장고에도 담겨요
      </p>

      {/* 제철 재료 칩 */}
      <div className="flex flex-wrap gap-1.5">
        {seasonal.map((name) => {
          const canStock = FRIDGE_INGREDIENTS.has(name);
          const on = selected.includes(name);
          const active = infoFor === name; // 안내 열린 상태
          return (
            <button
              key={name}
              onClick={() => {
                if (canStock) onToggle(name); // 담기 + 정보 둘 다
                setInfoFor((p) => (canStock ? name : p === name ? null : name));
              }}
              className="inline-flex items-center gap-1 rounded-full py-1.5 pl-2 pr-3 text-[12.5px] font-semibold transition-all"
              style={{
                background: on || active ? C.sage : "#fff",
                color: on || active ? "#fff" : C.sage,
                border: `1px ${on || active ? "solid" : "dashed"} ${on || active ? C.sage : C.sage + "88"}`,
              }}
            >
              {canStock ? (
                on ? <Check size={12} strokeWidth={3.2} /> : <span className="text-[14px] leading-none">＋</span>
              ) : (
                <span className="text-[12px] leading-none">🌱</span>
              )}
              {name}
            </button>
          );
        })}
      </div>

      {/* 제철 재료 정보 — SEASONAL_INFO 설명 (+ 못 담는 재료는 그 재료가 든 메뉴) */}
      {infoFor && (
        <div className="mt-3 rounded-2xl bg-white/80 p-3.5" style={{ border: `1px solid ${C.sage}44` }}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12.5px] font-bold" style={{ color: C.sage }}>
              🌱 지금 <span style={{ color: C.ink }}>{infoFor}</span> 제철이에요
            </p>
            <button onClick={() => setInfoFor(null)} aria-label="닫기" style={{ color: C.sub }}>
              <X size={14} strokeWidth={2.4} />
            </button>
          </div>

          {/* 제철 설명 */}
          {SEASONAL_INFO[infoFor] && (
            <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: C.ink }}>
              {SEASONAL_INFO[infoFor]}
            </p>
          )}

          {infoCanStock ? (
            <p className="mt-2 text-[11.5px] leading-snug" style={{ color: C.sage }}>
              {infoOn
                ? "냉장고에 담았어요 ✅ · 아래 ‘이거 어때요?’에서 메뉴를 추천해드려요 🍳"
                : "톡 누르면 냉장고에 담을 수 있어요 🧺"}
            </p>
          ) : (
            <p className="mt-2 text-[11.5px] leading-snug" style={{ color: C.sub }}>
              냉장고에 담을 수는 없지만 지금이 가장 맛있는 철이에요. 장 볼 때 한 번 챙겨보세요 🛒
            </p>
          )}
        </div>
      )}

      {/* 이거 어때요? — 지금 보고 있는 제철 재료(focus)가 실제로 든 메뉴만 */}
      {focus && (
        <div className="mt-3.5">
          <p className="mb-1.5 text-[12px] font-bold" style={{ color: C.ink }}>
            이거 어때요? <span style={{ color: C.sage }}>{focus}</span> 메뉴 🍳
          </p>
          {focusPicks.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {focusPicks.map((p) => (
                <button
                  key={p.menu}
                  onClick={() => onOpenMenu(p.menu)}
                  className="inline-flex items-center gap-1 rounded-full bg-white py-1.5 px-3 text-[12.5px] font-medium transition-all"
                  style={{ color: C.ink, border: `1px solid ${C.line}` }}
                >
                  {p.role === "specialty" && <span className="text-[10px] font-medium" style={{ color: C.sub }}>색다른</span>}
                  {p.menu}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11.5px] leading-snug" style={{ color: C.sub }}>
              이 재료로 등록된 메뉴가 아직 없어요
            </p>
          )}
        </div>
      )}
    </section>
  );
}

// 위클리 플래너 — 요일별 가로 줄
const ENG_DAY = { 월: "MON", 화: "TUE", 수: "WED", 목: "THU", 금: "FRI", 토: "SAT", 일: "SUN" };
const FAINT = "#B6A48C"; // 메인/국 없음
const MAIN_TXT = "#3A2A20"; // 메인 (조금 더 진하게)
const SUB_TXT = "#5A4636"; // 밥·국·반찬
// MEMO·외식 day 공통 색 — CSS 변수(index.css :root) 참조해서 둘이 항상 일치
const SOFT_GREEN = "var(--color-rest-day)";
const SOFT_GREEN_BD = "var(--color-rest-day-border)";
const REST_INK = "var(--color-rest-day-ink)";

// 가로 줄 레이아웃 공통 — 흰 카드 한 줄
const ROW = "flex items-stretch overflow-hidden rounded-xl";
const ROW_STYLE = { background: "#FFFFFF", border: `1px solid ${C.gold}33` };

// 📝 MEMO(장보기) 줄 — 가로 줄 레이아웃 맨 아래 메모 칸 (그대로 유지, 한 줄 형태로)
function MemoCell() {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: SOFT_GREEN, border: `1px dashed ${SOFT_GREEN_BD}` }}>
      <span className="text-[12px] font-extrabold tracking-wide" style={{ color: REST_INK }}>📝 MEMO</span>
      <span className="text-[10px] font-bold" style={{ color: C.sub }}>장보기 · 메모</span>
    </div>
  );
}

// 위클리 플래너 — 요일별 가로 줄. 왼쪽 요일 라벨 + 윗줄(밥·국) / 아랫줄(메인·반찬). 글자 잘림 없음.
function DayCell({ day, dateNum, onOpen, onSwap, swapPools }) {
  // 요일 라벨 색 — 달력 관습: 평일 검정(진한 회색) / 토 파랑 / 일 빨강 (외식 day도 동일 적용)
  const DOW_COLOR = day.day === "토" ? "#2563EB" : day.day === "일" ? "#DC2626" : "#333333";
  // 요일 라벨 (왼쪽 고정 블록) — 한글 요일 + 영문 요일 + 이번 주 실제 날짜(일 숫자)
  const label = () => (
    <div className="flex w-12 shrink-0 flex-col items-center justify-center self-stretch py-1.5" style={{ borderRight: `1px solid ${C.gold}22` }}>
      <span className="text-[15px] font-extrabold leading-none" style={{ color: DOW_COLOR }}>{day.day}</span>
      <span className="mt-0.5 text-[8px] font-bold tracking-[0.12em]" style={{ color: DOW_COLOR, opacity: 0.72 }}>{ENG_DAY[day.day] || ""}</span>
      {dateNum != null && (
        <span className="mt-0.5 text-[10px] font-bold leading-none" style={{ color: DOW_COLOR, opacity: 0.55 }}>{dateNum}</span>
      )}
    </div>
  );

  // 한 메뉴: 이름(탭→레시피) + 같은 역할에 다른 후보 있으면 작은 🔄(탭→교체)
  const dish = (it, idx) => {
    const strong = it.role === "메인";
    const base = strong ? MAIN_TXT : SUB_TXT;
    const canSwap = !!onSwap && (swapPools?.[it.role]?.length || 0) > 1;
    return (
      <span key={idx} className="inline-flex items-center gap-0.5">
        <button
          onClick={() => onOpen(it.menu)}
          title={it.menu}
          className="text-left leading-snug transition-colors"
          style={{ color: base, fontSize: strong ? "13px" : "12.5px", fontWeight: strong ? 800 : 600 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
          onMouseLeave={(e) => (e.currentTarget.style.color = base)}
        >
          {it.menu}
        </button>
        {canSwap && (
          <button
            onClick={() => onSwap(day.day, idx, it.role, it.menu)}
            title="다른 메뉴로 바꾸기"
            aria-label={`${it.menu} 다른 메뉴로 바꾸기`}
            className="shrink-0 leading-none opacity-35 transition-opacity hover:opacity-90"
            style={{ fontSize: "10px" }}
          >
            🔄
          </button>
        )}
      </span>
    );
  };

  // 외식 day — 한 줄로 간결하게
  if (day.rest) {
    return (
      <div className={ROW} style={{ ...ROW_STYLE, background: "#FFFCF6", border: `1px solid ${C.gold}22` }}>
        {label()}
        <div className="flex flex-1 items-center px-3 py-2.5">
          <span className="text-[12.5px] font-bold" style={{ color: C.sub }}>외식 day 🍴</span>
        </div>
      </div>
    );
  }

  // 별미 day — 한 줄로
  if (day.special) {
    const sp = day.sp;
    const bv = ROLE_STYLE["별미"];
    return (
      <div className={ROW} style={ROW_STYLE}>
        {label()}
        <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 px-3 py-2.5">
          <span className="text-[9px] font-bold" style={{ color: bv.fg }}>{sp.tag || "색다른"}</span>
          <button
            onClick={() => onOpen(sp.menu)}
            title={sp.menu}
            className="text-left text-[13px] font-extrabold leading-snug transition-opacity hover:opacity-70"
            style={{ color: bv.fg }}
          >
            {sp.emoji} {sp.menu}
          </button>
          {sp.shop && sp.shop.length > 0 && (
            <span className="text-[10px] leading-tight" style={{ color: C.sub }}>🛒 {sp.shop.join(", ")}</span>
          )}
        </div>
      </div>
    );
  }

  // 일반 한 상 — 윗줄: 밥+국 / 아랫줄: 메인+반찬 (items 순서 = 밥→국→메인→반찬)
  const items = (day.items || []).map((it, i) => ({ ...it, _i: i }));
  const topItems = items.filter((it) => it.role === "밥" || it.role === "국");
  const bottomItems = items.filter((it) => it.role === "메인" || it.role === "반찬");
  const renderItem = (it) =>
    it.placeholder ? (
      <span key={it._i} className="text-[12px] font-semibold" style={{ color: FAINT }}>
        {it.role === "메인" ? "메인 없음" : it.role === "국" ? "국 없음" : it.menu}
      </span>
    ) : (
      dish(it, it._i)
    );

  return (
    <div className={ROW} style={ROW_STYLE}>
      {label()}
      <div className="flex flex-1 flex-col justify-center gap-1 px-3 py-2.5">
        {/* 윗줄: 밥 + 국 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">{topItems.map(renderItem)}</div>
        {/* 아랫줄: 메인 + 반찬 */}
        {bottomItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">{bottomItems.map(renderItem)}</div>
        )}
      </div>
    </div>
  );
}

// prefers-reduced-motion 존중용 훅
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

// 바텀시트 안 재료 타일 (톡 누르면 담기/빼기 토글 + 담을 때 위로 떠오르는 피드백)
function SheetItem({ name, added, onToggle, reduced }) {
  const img = INGREDIENT_IMG[name];
  const [burst, setBurst] = useState(0); // 증가시켜 플로팅 애니메이션 재시작
  const handle = () => {
    const adding = !added;
    onToggle(name);
    if (adding && !reduced) setBurst((b) => b + 1);
  };
  return (
    <button
      onClick={handle}
      className="relative flex w-full flex-col items-center"
      style={{ transition: "transform 0.15s" }}
    >
      <div
        className="relative flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-[18px]"
        style={{
          background: img ? "#fff" : `radial-gradient(120% 120% at 30% 25%, #FFFFFF, ${getTint(name)})`,
          border: `2px solid ${added ? C.gold : C.line}`,
          transform: added ? "translateY(-3px)" : "none",
          boxShadow: added
            ? "0 10px 16px -8px rgba(217,96,63,0.8)"
            : "0 4px 8px -4px rgba(58,42,32,0.35)",
          transition: "all 0.18s cubic-bezier(0.22,1,0.36,1)",
          filter: added ? "none" : "saturate(0.96)",
        }}
      >
        {img ? (
          <img src={img} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span
            className="text-[32px] leading-none"
            style={{ filter: "drop-shadow(0 2px 3px rgba(58,42,32,0.28))" }}
          >
            {INGREDIENT_EMOJI[name] || "🍽️"}
          </span>
        )}
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0))" }}
        />
        {added && (
          <span
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-white"
            style={{ background: C.gold, boxShadow: "0 2px 4px -1px rgba(217,96,63,0.9)" }}
          >
            <Check size={12} strokeWidth={3.2} />
          </span>
        )}
        {/* 담길 때 위로 떠오르는 피드백 */}
        {burst > 0 && (
          <span
            key={burst}
            className="float-up pointer-events-none absolute text-[22px] leading-none"
            style={{ left: "50%", top: "6px" }}
          >
            {INGREDIENT_EMOJI[name] || "🍽️"}
          </span>
        )}
      </div>
      <span
        className="mt-1.5 max-w-[84px] truncate text-[11px] font-semibold"
        style={{ color: added ? C.gold : C.ink }}
      >
        {name}
      </span>
    </button>
  );
}

// 재료 바꾸기 바텀시트 (카테고리 탭 + 칩 그리드, 담기/빼기)
// 직접 추가한 재료 칩 (담기 토글 + X 삭제)
function CustomSheetItem({ name, added, onToggle, onDelete }) {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative">
        <button
          onClick={() => onToggle(name)}
          className="relative flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-[18px]"
          style={{
            background: `radial-gradient(120% 120% at 30% 25%, #FFFFFF, ${getTint(name)})`,
            border: `2px solid ${added ? C.gold : C.line}`,
            transform: added ? "translateY(-3px)" : "none",
            boxShadow: added ? "0 10px 16px -8px rgba(217,96,63,0.8)" : "0 4px 8px -4px rgba(58,42,32,0.35)",
            transition: "all 0.18s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <span className="text-[26px] leading-none">{INGREDIENT_EMOJI[name] || "🧺"}</span>
          {added && (
            <span
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-white"
              style={{ background: C.gold, boxShadow: "0 2px 4px -1px rgba(217,96,63,0.9)" }}
            >
              <Check size={12} strokeWidth={3.2} />
            </span>
          )}
        </button>
        {/* 삭제 (X) */}
        <button
          onClick={() => onDelete(name)}
          aria-label={`${name} 삭제`}
          className="absolute -left-1.5 -top-1.5 flex h-[20px] w-[20px] items-center justify-center rounded-full text-white"
          style={{ background: C.ink, border: "2px solid #fff", boxShadow: "0 2px 5px -1px rgba(58,42,32,0.6)" }}
        >
          <X size={10} strokeWidth={3.2} />
        </button>
      </div>
      <span className="mt-1.5 max-w-[84px] truncate text-[11px] font-semibold" style={{ color: added ? C.gold : C.ink }}>
        {name}
      </span>
    </div>
  );
}

function AddSheet({ open, onClose, selected, onToggle, custom = [], onAddCustom, onDeleteCustom, reduced }) {
  const [cat, setCat] = useState(CATEGORY_LIST[0].key);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const active = CATEGORY_LIST.find((c) => c.key === cat) || CATEGORY_LIST[0];
  const customForCat = custom.filter((c) => c.cat === active.key);

  const submitCustom = () => {
    if (!draft.trim()) return;
    onAddCustom(active.key, draft);
    setDraft("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 바깥 탭 → 닫기 */}
      <div
        onClick={onClose}
        className={`absolute inset-0 ${reduced ? "" : "fade-in"}`}
        style={{ background: "rgba(35,28,22,0.45)" }}
      />
      {/* 시트 */}
      <div
        className={`relative flex w-full max-w-[480px] flex-col ${reduced ? "" : "sheet-up"}`}
        style={{
          maxHeight: "82vh",
          background: C.canvas,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          boxShadow: "0 -18px 50px -20px rgba(58,42,32,0.5)",
          fontFamily: "'Paperlogy','Inter','Pretendard',system-ui,sans-serif",
        }}
      >
        {/* 그랩 핸들 */}
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full" style={{ background: C.line }} />
        </div>
        {/* 헤더 */}
        <div className="flex items-start justify-between px-5 pb-1 pt-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold tracking-tight" style={{ color: C.ink }}>
                🧺 재료 바꾸기
              </h3>
              {/* 담긴 개수 — 톡 누를 때마다 즉시 바뀜 */}
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ background: C.goldSoft, color: C.gold }}
              >
                재료 {selected.length}개 담음
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
              톡 누르면 담기고, 다시 누르면 빠져요
            </p>
          </div>
          {/* 닫기 (저장 아님 — 등록은 아래 완료 버튼) */}
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5"
            style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.sub }}
          >
            <X size={15} strokeWidth={2.6} />
            <span className="text-[12px] font-semibold">닫기</span>
          </button>
        </div>

        {/* 담은 재료 모음 (주황 = 담긴 상태, 칩 X로 빼기) */}
        <div className="px-5 pb-3 pt-1">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="h-3 w-1 rounded-full" style={{ background: C.gold }} />
            <p className="text-[13px] font-bold" style={{ color: C.ink }}>
              담은 재료 <span style={{ color: C.gold }}>({selected.length}개)</span>
            </p>
          </div>
          {selected.length > 0 ? (
            <div
              className="flex max-h-[88px] flex-wrap gap-1.5 overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {selected.map((name) => (
                <button
                  key={name}
                  onClick={() => onToggle(name)}
                  aria-label={`${name} 빼기`}
                  className="inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1.5 text-[12px] font-semibold transition-all"
                  style={{ background: C.gold, color: "#fff", boxShadow: "0 4px 10px -6px rgba(217,96,63,0.9)" }}
                >
                  {name}
                  <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.28)" }}>
                    <X size={10} strokeWidth={3.2} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12px]" style={{ color: C.sub }}>
              아직 담은 재료가 없어요. 아래에서 골라 담아보세요
            </p>
          )}
        </div>

        {/* 구분선 */}
        <div className="mx-5 mb-3" style={{ borderTop: `1px solid ${C.line}` }} />

        {/* 카테고리 탭 */}
        <div
          className="flex gap-2 overflow-x-auto px-5 pb-3"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {CATEGORY_LIST.map((c) => {
            const on = c.key === cat;
            return (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                className="shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all"
                style={{
                  background: on ? C.gold : "#fff",
                  color: on ? "#fff" : C.ink,
                  border: `1px solid ${on ? C.gold : C.line}`,
                  boxShadow: on ? "0 8px 18px -12px rgba(217,96,63,0.9)" : "none",
                }}
              >
                {c.icon} {c.label}
              </button>
            );
          })}
        </div>

        {/* 재료 그리드 + 직접 추가 (가운데만 스크롤) */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-1">
          <div className="grid grid-cols-4 gap-3">
            {active.items.map((name) => (
              <SheetItem
                key={name}
                name={name}
                added={selected.includes(name)}
                onToggle={onToggle}
                reduced={reduced}
              />
            ))}
            {customForCat.map((c) => (
              <CustomSheetItem
                key={c.name}
                name={c.name}
                added={selected.includes(c.name)}
                onToggle={onToggle}
                onDelete={onDeleteCustom}
              />
            ))}
          </div>

          {/* + 직접 추가 입력 */}
          <div className="mt-4 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCustom();
              }}
              placeholder={`${active.label}에 직접 추가 (예: 두릅)`}
              className="min-w-0 flex-1 rounded-2xl px-4 py-2.5 text-[13px] outline-none"
              style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.ink }}
            />
            <button
              onClick={submitCustom}
              className="shrink-0 rounded-2xl px-4 py-2.5 text-[13px] font-bold"
              style={{ background: C.gold, color: "#fff" }}
            >
              + 추가
            </button>
          </div>
        </div>

        {/* 하단 고정 완료 버튼 — 누르면 닫히고 이 재료로 식단 재생성 */}
        <div
          className="shrink-0 px-5 pb-5 pt-3"
          style={{ borderTop: `1px solid ${C.line}`, background: C.canvas }}
        >
          <button
            onClick={onClose}
            disabled={selected.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold transition-all"
            style={{
              background: selected.length === 0 ? C.line : C.gold,
              color: selected.length === 0 ? C.sub : "#fff",
              boxShadow: selected.length === 0 ? "none" : "0 14px 28px -16px rgba(217,96,63,0.9)",
            }}
          >
            <Check size={18} strokeWidth={2.6} />
            이 재료로 식단 짜기 ({selected.length}개 담음)
          </button>
        </div>
      </div>
    </div>
  );
}

// 📝 영수증/주문내역 → 재료 담기 시트
//  1) 텍스트 붙여넣기(나중에 OCR로 텍스트를 채우면 그대로 재사용 가능) → parseReceiptText
//  2) 인식 결과 체크박스 확인(오인식 해제 / 빠진 것 직접 추가) → selected에 담기
// 영수증 사진 전처리 — 흑백(그레이스케일) + 대비 강화 (작고 흐린 글자 인식률 ↑)
function preprocessReceiptImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxSide = Math.max(img.width, img.height);
      const scale = maxSide > 0 && maxSide < 1100 ? 1100 / maxSide : 1; // 작으면 키워 또렷하게
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * scale);
      cv.height = Math.round(img.height * scale);
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      try {
        const id = ctx.getImageData(0, 0, cv.width, cv.height);
        const d = id.data;
        const contrast = 1.7; // 대비 강화
        const intercept = 128 * (1 - contrast);
        for (let i = 0; i < d.length; i += 4) {
          let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; // grayscale
          g = g * contrast + intercept; // contrast
          g = g < 0 ? 0 : g > 255 ? 255 : g;
          d[i] = d[i + 1] = d[i + 2] = g;
        }
        ctx.putImageData(id, 0, 0);
      } catch { /* getImageData 실패 시 원본 그대로 사용 */ }
      try { URL.revokeObjectURL(img.src); } catch { /* noop */ }
      resolve(cv);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

function ReceiptSheet({ open, onClose, selected, onAdd, reduced }) {
  const [text, setText] = useState(""); // 원본 텍스트 (OCR/붙여넣기, 수정 가능)
  const [unchecked, setUnchecked] = useState({}); // 사용자가 체크 해제한 재료 { name: true }
  const [manualAdds, setManualAdds] = useState([]); // 직접 추가한 재료
  const [draft, setDraft] = useState(""); // 직접 추가 입력
  const [ocrBusy, setOcrBusy] = useState(false); // 사진 OCR 진행 중
  const [ocrPct, setOcrPct] = useState(0); // OCR 진행률 %
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (open) return;
    setText(""); setUnchecked({}); setManualAdds([]); setDraft(""); setOcrBusy(false); setOcrPct(0);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;

  // ⚡ 텍스트가 바뀔 때마다 즉시 다시 매칭 (사용자가 깨진 글자를 고치면 바로 반영)
  const parsed = parseReceiptText(text);
  const candidates = [...new Set([...parsed.matched, ...manualAdds])]; // 인식 + 직접 추가
  const isChecked = (name) => !unchecked[name];
  const checkedList = candidates.filter(isChecked);
  const hasText = text.trim().length > 0;
  // 폴백 안내 조건: 텍스트는 있는데 잡힌 재료가 없을 때
  const showFallback = hasText && candidates.length === 0;

  // 📷 사진 → 전처리(흑백·대비) → tesseract OCR(kor, PSM=단일 블록) → textarea에 채움
  const onPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setOcrBusy(true);
    setOcrPct(0);
    let worker;
    try {
      const pre = await preprocessReceiptImage(file);
      worker = await Tesseract.createWorker("kor", 1, {
        logger: (m) => { if (m.status === "recognizing text") setOcrPct(Math.round((m.progress || 0) * 100)); },
      });
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK }); // 영수증=한 블록 세로 텍스트
      const { data } = await worker.recognize(pre || file);
      const extracted = (data.text || "").trim();
      console.log("📷 [OCR 원본 텍스트]\n" + extracted);
      setText((prev) => (prev.trim() ? prev.trim() + "\n" + extracted : extracted));
    } catch (err) {
      console.error("OCR failed:", err);
      alert("사진을 읽지 못했어요. 다시 찍거나 텍스트로 붙여넣어 주세요 🙏");
    } finally {
      if (worker) { try { await worker.terminate(); } catch { /* noop */ } }
      setOcrBusy(false);
    }
  };

  const toggle = (name) => setUnchecked((p) => ({ ...p, [name]: !p[name] }));
  const addManual = () => {
    const name = draft.trim();
    if (!name) return;
    if (!candidates.includes(name)) setManualAdds((p) => [...p, name]);
    setUnchecked((p) => { const n = { ...p }; delete n[name]; return n; }); // 추가하면 체크 상태로
    setDraft("");
  };
  const confirmAdd = () => {
    onAdd(checkedList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div onClick={onClose} className={`absolute inset-0 ${reduced ? "" : "fade-in"}`} style={{ background: "rgba(35,28,22,0.45)" }} />
      <div
        className={`relative flex w-full max-w-[480px] flex-col ${reduced ? "" : "sheet-up"}`}
        style={{ maxHeight: "88vh", background: C.canvas, borderTopLeftRadius: 26, borderTopRightRadius: 26, boxShadow: "0 -18px 50px -20px rgba(58,42,32,0.5)", fontFamily: "'Paperlogy','Inter','Pretendard',system-ui,sans-serif" }}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full" style={{ background: C.line }} />
        </div>
        <div className="flex items-center justify-between px-5 pb-1 pt-2">
          <h3 className="text-[15px] font-bold tracking-tight" style={{ color: C.ink }}>
            📝 영수증/주문내역으로 담기
          </h3>
          <button onClick={onClose} aria-label="닫기" className="rounded-full p-1" style={{ color: C.sub }}>
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 pb-2 pt-2">
            {/* 안내 — 주문내역 캡처가 인식률이 가장 좋아 그쪽으로 유도 */}
            <p
              className="mb-3 rounded-2xl px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed"
              style={{ background: C.goldSoft, color: C.gold, border: `1px solid ${C.gold}44` }}
            >
              📱 쿠팡·마켓컬리 등 주문내역을 캡처해서 올리면 가장 잘 인식돼요!
              <span className="font-medium" style={{ color: C.sub }}> (종이 영수증은 흐릴 수 있어요)</span>
            </p>

            {/* 📷 사진 입구 — 갤러리(주문내역 캡처)가 메인, 카메라는 보조 */}
            <button
              onClick={() => galleryInputRef.current && galleryInputRef.current.click()}
              disabled={ocrBusy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold transition-all"
              style={{ background: ocrBusy ? C.line : C.gold, color: "#fff", boxShadow: ocrBusy ? "none" : "0 14px 28px -16px rgba(217,96,63,0.9)" }}
            >
              🖼️ 주문내역 캡처 올리기
            </button>
            <button
              onClick={() => cameraInputRef.current && cameraInputRef.current.click()}
              disabled={ocrBusy}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13px] font-bold transition-all"
              style={{ background: "#fff", color: C.gold, border: `1px solid ${C.gold}55`, opacity: ocrBusy ? 0.5 : 1 }}
            >
              📷 영수증 사진 찍기
            </button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
            <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />

            {ocrBusy && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl py-3 text-[13.5px] font-bold" style={{ background: C.goldSoft, color: C.gold }}>
                <span className={reduced ? "" : "bounce-food"}>🔍</span>
                영수증 읽는 중… {ocrPct > 0 ? `${ocrPct}%` : ""}
              </div>
            )}

            {/* 수정 가능한 텍스트 — OCR이 채우고, 사용자가 고치면 아래 재료가 즉시 갱신 */}
            <p className="mb-1.5 mt-3 text-[12px]" style={{ color: C.sub }}>
              읽은 글자예요. 깨진 글자는 고쳐주세요 — 고치는 즉시 재료가 다시 잡혀요.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"사진을 찍거나, 영수증/쿠팡 주문내역을 붙여넣으세요.\n예)\n돼지고기 앞다리 600g\n애호박 1개\n두부 2모\n계란 한판"}
              rows={6}
              className="w-full resize-none rounded-2xl px-3.5 py-3 text-[13.5px] leading-relaxed outline-none"
              style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.ink }}
            />

            {/* 인식된 재료 (실시간) */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12.5px] font-bold" style={{ color: C.ink }}>인식된 재료</span>
              <span className="text-[11.5px] font-semibold" style={{ color: C.sub }}>{checkedList.length}개 담을 예정</span>
            </div>
            {candidates.length > 0 ? (
              <div className="mt-1.5 flex flex-col gap-1.5">
                {candidates.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggle(name)}
                    className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-all"
                    style={{ background: isChecked(name) ? C.goldSoft : "#fff", border: `1px solid ${isChecked(name) ? C.gold + "66" : C.line}` }}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: isChecked(name) ? C.gold : "#fff", border: `1.5px solid ${isChecked(name) ? C.gold : C.line}` }}>
                      {isChecked(name) && <Check size={13} strokeWidth={3.2} color="#fff" />}
                    </span>
                    <span className="text-[14px] font-semibold" style={{ color: C.ink }}>{name}</span>
                    {selected.includes(name) && (
                      <span className="ml-auto text-[10.5px] font-bold" style={{ color: C.sage }}>이미 담음</span>
                    )}
                  </button>
                ))}
              </div>
            ) : showFallback ? (
              <p className="mt-1.5 rounded-2xl px-4 py-5 text-center text-[12.5px] leading-relaxed" style={{ background: "#FFF6F2", border: `1px dashed ${C.gold}66`, color: C.sub }}>
                사진이 잘 안 읽혔어요 🥲<br />
                위 텍스트에서 깨진 글자를 직접 고치거나,<br />
                쿠팡 주문내역을 붙여넣어 보세요.
              </p>
            ) : (
              <p className="mt-1.5 rounded-2xl px-4 py-5 text-center text-[12.5px]" style={{ background: "#fff", border: `1px dashed ${C.line}`, color: C.sub }}>
                사진을 찍거나 텍스트를 넣으면 재료를 찾아드려요 🧺
              </p>
            )}

            {/* 직접 추가 */}
            <div className="mt-3 flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManual()}
                placeholder="빠진 재료 직접 추가 (예: 양파)"
                className="min-w-0 flex-1 rounded-2xl px-3.5 py-2.5 text-[13.5px] outline-none"
                style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.ink }}
              />
              <button onClick={addManual} className="shrink-0 rounded-2xl px-4 py-2.5 text-[13px] font-bold" style={{ background: C.goldSoft, color: C.gold, border: `1px solid ${C.gold}55` }}>
                추가
              </button>
            </div>

            {parsed.ignored.length > 0 && (
              <p className="mt-3 text-[11px] leading-snug" style={{ color: C.sub }}>
                양념·기타 {parsed.ignored.length}줄은 제외했어요.
              </p>
            )}
          </div>

          <div className="border-t px-5 py-3" style={{ borderColor: C.line }}>
            <button
              onClick={confirmAdd}
              disabled={checkedList.length === 0}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl py-3.5 text-[15px] font-bold transition-all"
              style={{ background: checkedList.length ? C.gold : C.line, color: "#fff", boxShadow: checkedList.length ? "0 14px 28px -16px rgba(217,96,63,0.9)" : "none" }}
            >
              🧺 이 재료들 냉장고에 담기 {checkedList.length > 0 && `(${checkedList.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메뉴 사진 — /menu-images/[이름].png 있으면 사진, 없으면(로드 실패) 이모지로 자동 대체
// public 폴더라 경로에서 /public 제외, 한글 파일명은 encodeURIComponent 처리
function MenuPhoto({ menu, emoji, imgClass, imgStyle, fallbackClass, fallbackStyle }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [menu]); // 메뉴 바뀌면 사진 다시 시도
  if (failed) {
    return (
      <span className={fallbackClass} style={fallbackStyle}>
        {emoji}
      </span>
    );
  }
  return (
    <img
      src={`/menu-images/${encodeURIComponent(menu)}.png`}
      alt=""
      // 사진 없으면 이모지로. 404뿐 아니라 SPA 호스트가 200(text/html)을 돌려줘
      // 깨진 이미지(돋보기 아이콘)가 뜨는 경우까지 잡으려고 onLoad에서 naturalWidth도 확인
      onError={() => setFailed(true)}
      onLoad={(e) => { if (!e.currentTarget.naturalWidth) setFailed(true); }}
      className={imgClass}
      style={imgStyle}
    />
  );
}

// ✨ 색다른 메뉴(별미) — 카테고리별로 전부 보여주는 세로 카드 리스트 (사진 있으면 사진, 없으면 이모지)
function SpecialtySection({ groups, onOpenMenu }) {
  const [open, setOpen] = useState({}); // { [cat]: true } — 여러 개 동시에 펼침 허용
  if (!groups.length) return null;
  const toggle = (cat) => setOpen((prev) => ({ ...prev, [cat]: !prev[cat] }));
  return (
    <Card>
      <SectionTitle icon={<span className="text-[15px]">✨</span>} label="색다른 메뉴 (별미)" noMargin />
      <p className="mb-3 mt-1 text-[12px]" style={{ color: C.sub }}>
        장보기 한 번이면 만드는 별미예요 · 카테고리를 눌러 펼쳐보세요
      </p>
      <div className="space-y-2">
        {groups.map((g) => {
          const isOpen = !!open[g.cat];
          return (
            <div key={g.cat} className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${C.line}` }}>
              {/* 카테고리 헤더 — 클릭 시 펼침/접힘 */}
              <button
                onClick={() => toggle(g.cat)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between px-3.5 py-3 text-left transition-colors"
                style={{ background: isOpen ? C.goldSoft : "#fff" }}
              >
                <span className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                  {g.icon} {g.cat} <span style={{ color: C.sub }}>· {g.items.length}개</span>
                </span>
                <ChevronDown
                  size={18}
                  strokeWidth={2.4}
                  style={{
                    color: isOpen ? C.gold : C.sub,
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.22s ease",
                  }}
                />
              </button>

              {/* 펼쳐진 메뉴 리스트 */}
              {isOpen && (
                <div className="space-y-1.5 px-2.5 pb-2.5 pt-1" style={{ borderTop: `1px solid ${C.line}` }}>
                  {g.items.map((name) => (
                    <button
                      key={name}
                      onClick={() => onOpenMenu(name)}
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.canvas)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <MenuPhoto
                        menu={name}
                        emoji={getEmoji(name)}
                        imgClass="h-11 w-11 shrink-0 rounded-xl object-contain"
                        imgStyle={{ background: "#FBF4EA" }}
                        fallbackClass="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[24px] leading-none"
                        fallbackStyle={{ background: `radial-gradient(120% 120% at 30% 20%, #FFFFFF, ${getHue(name)})` }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold" style={{ color: C.ink }}>{name}</p>
                        <p className="mt-0.5 text-[11px]" style={{ color: C.sub }}>⏱ {getMeta(name).min}분 · {g.cat}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// 🔎 메뉴찾기 결과 카드 — 사진(없으면 emoji) + 이름 + 매칭 뱃지(바로 가능 / 부족 재료)
function FindMenuCard({ result, onOpen }) {
  const { name, missing, ready } = result;
  const meta = getMeta(name);
  return (
    <button
      onClick={() => onOpen(name)}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all"
      style={{ background: C.card, border: `1px solid ${C.line}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.gold)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}
    >
      <MenuPhoto
        menu={name}
        emoji={getEmoji(name)}
        imgClass="h-11 w-11 shrink-0 rounded-xl object-contain"
        imgStyle={{ background: "#FBF4EA" }}
        fallbackClass="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[26px] leading-none"
        fallbackStyle={{ background: `radial-gradient(120% 120% at 30% 20%, #FFFFFF, ${getHue(name)})` }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold" style={{ color: C.ink }}>{name}</p>
        <div className="mt-1">
          {ready ? (
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: C.sageSoft, color: C.sage, border: `1px solid ${C.sage}44` }}
            >
              ✅ 바로 가능
            </span>
          ) : (
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[11px] font-bold leading-snug"
              style={{ background: C.goldSoft, color: C.gold, border: `1px solid ${C.gold}44` }}
            >
              🛒 {missing.join(", ")} 더 있으면
            </span>
          )}
        </div>
      </div>
      <span className="shrink-0 text-[11px] font-medium" style={{ color: C.sub }}>⏱ {meta.min}분</span>
    </button>
  );
}

function RecipeModal({ menu, onClose }) {
  const steps = getRecipe(menu);
  const m = MENU_BY_NAME[menu];
  // 장보기 필요한 특별재료가 있으면 안내 섹션 표시 (별미·일반 메뉴 공통)
  const shop = getShoppingItems(m);
  const sp = shop.length
    ? { need: [...new Set([...(m && m.ingredients ? m.ingredients : []), ...shop])], shop }
    : null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(58,42,32,0.34)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
        style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          boxShadow: "0 40px 80px -30px rgba(58,42,32,0.5)",
          animation: "rm_up 0.28s cubic-bezier(0.16,1,0.3,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes rm_up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@media (prefers-reduced-motion: reduce){[style*="rm_up"]{animation:none!important}}`}</style>

        {/* 헤더 */}
        <div
          className="relative px-7 pb-5 pt-7"
          style={{ background: `radial-gradient(120% 140% at 0% 0%, #FFFFFF, ${C.goldSoft})` }}
        >
          <button
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ background: "#fff", color: C.sub, border: `1px solid ${C.line}` }}
          >
            <X size={16} strokeWidth={2.4} />
          </button>
          {/* 메뉴 사진 — 있으면 사진, 없으면 이모지 (목록 카드와 동일) */}
          <MenuPhoto
            menu={menu}
            emoji={getEmoji(menu)}
            imgClass="mb-4 block aspect-square w-full rounded-2xl object-contain"
            imgStyle={{ background: "#FBF4EA", border: `1px solid ${C.line}`, boxShadow: "0 12px 24px -16px rgba(58,42,32,0.5)" }}
            fallbackClass="mb-4 flex aspect-square w-full items-center justify-center rounded-2xl text-[72px] leading-none"
            fallbackStyle={{ background: `radial-gradient(120% 120% at 30% 20%, #FFFFFF, ${getHue(menu)})`, border: `1px solid ${C.line}` }}
          />
          <div className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide" style={{ color: C.gold }}>
            <ChefHat size={13} strokeWidth={2.2} /> 워킹맘 3줄 조리법
          </div>
          <h3 className="text-[24px] font-semibold tracking-tight" style={{ color: C.ink }}>
            {menu}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-[12px]" style={{ color: C.sub }}>
            <span className="rounded-full bg-white/70 px-2 py-0.5" style={{ border: `1px solid ${C.line}` }}>
              ⏱ {getMeta(menu).min}분
            </span>
            <span className="rounded-full bg-white/70 px-2 py-0.5" style={{ border: `1px solid ${C.line}` }}>
              👤 {getMeta(menu).servings}인분
            </span>
            <span className="rounded-full bg-white/70 px-2 py-0.5" style={{ border: `1px solid ${C.line}` }}>
              {getMeta(menu).level}
            </span>
          </div>
        </div>

        {/* 별미 필요 재료 */}
        {sp && (
          <div className="px-7 pt-5">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide" style={{ color: C.sage }}>
              🧺 필요 재료
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sp.need.map((ing) => {
                const shop = sp.shop.includes(ing);
                return (
                  <span
                    key={ing}
                    className="rounded-full px-2.5 py-1 text-[12px] font-medium"
                    style={{
                      background: shop ? C.goldSoft : "#fff",
                      color: shop ? C.gold : C.ink,
                      border: `1px solid ${shop ? C.gold + "55" : C.line}`,
                    }}
                  >
                    {shop ? "🛒 " : ""}{ing}
                  </span>
                );
              })}
            </div>
            {sp.shop.length > 0 && (
              <p className="mt-2 text-[11px]" style={{ color: C.sub }}>
                🛒 표시는 냉장고에 보통 없는 “장보기 필요” 재료예요
              </p>
            )}

            {/* 구매하러 가기 — 쿠팡 검색 (+파트너스 추적) */}
            <button
              onClick={() =>
                window.open(
                  buildCoupangLink(sp.shop.length ? sp.shop.join(" ") : menu),
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-bold transition-all"
              style={{ background: C.gold, color: "#fff", boxShadow: "0 12px 24px -16px rgba(217,96,63,0.9)" }}
            >
              <ShoppingCart size={16} strokeWidth={2.3} /> 구매하러 가기
            </button>
            {/* 파트너스 고지 문구 */}
            <p className="mt-2 text-[10.5px] leading-snug" style={{ color: C.sub }}>
              쿠팡 파트너스 활동의 일환으로 수수료를 받을 수 있습니다
            </p>
          </div>
        )}

        {/* 3줄 스텝 */}
        <div className="space-y-2.5 px-7 py-6">
          {steps.map(([label, text], i) => {
            const Icon = STEP_ICONS[i] || Sparkles;
            return (
              <div
                key={i}
                className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5"
                style={{ background: "#FBF4EA", border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold"
                  style={{ background: C.goldSoft, color: C.gold }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: C.gold }}>
                    <Icon size={12} strokeWidth={2.4} />
                    {label}
                  </div>
                  <p
                    className="mt-0.5 text-[15px] font-medium"
                    style={{ color: C.ink, wordBreak: "keep-all", overflowWrap: "break-word" }}
                  >
                    {text}
                  </p>
                </div>
              </div>
            );
          })}
          <p className="pt-1 text-center text-[12px]" style={{ color: C.sub }}>
            딱 3줄, 더는 안 봐도 돼요 🍀
          </p>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div
      className="mt-2 rounded-2xl px-5 py-8 text-center text-[13.5px]"
      style={{ background: "#FBF4EA", border: `1px dashed ${C.line}`, color: C.sub }}
    >
      {text}
    </div>
  );
}

// 식단 짜는 중 — 통통 튀는 음식 이모지 + 번갈아 보이는 문구
function LoadingScreen({ msg }) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: "60vh" }}>
      <div className="flex items-end gap-2.5">
        {["🍚", "🍲", "🍳"].map((e, i) => (
          <span
            key={e}
            className="bounce-food text-[36px] leading-none"
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            {e}
          </span>
        ))}
      </div>
      <p className="mt-7 text-[16px] font-bold" style={{ color: C.ink }}>
        오늘 뭐 먹지… 식단을 짜고 있어요 🍀
      </p>
      <p className="mt-2 text-[13px]" style={{ color: C.sub }}>{msg}</p>
    </div>
  );
}
