import React, { useState, useMemo, useEffect } from "react";
import { ChefHat, ShoppingCart, Coffee, Check, Wallet, CalendarDays, Sparkles, X, Timer, Hand } from "lucide-react";
import fridgeDoorImg from "./assets/fridge-door.png";
import fridgeInImg from "./assets/fridge-in.png";

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

// 자주 쓰는 재료 BEST 10 (메인)
const MAIN = {
  "닭고기": ["닭볶음탕", "간장찜닭", "닭곰탕", "치킨너겟"],
  "돼지 다짐육": ["제육볶음", "동그랑땡", "마파두부", "김치만두소"],
  "계란": ["계란말이", "계란찜", "계란국", "스크램블"],
  "두부": ["두부조림", "두부부침", "두부김치", "순두부찌개"],
  "팽이버섯": ["팽이볶음", "팽이된장국", "계란팽이전", "베이컨팽이말이"],
  "소고기 불고기용": ["소불고기", "소고기무국", "불고기덮밥", "소고기볶음"],
  "냉동 생선살": ["생선전", "생선까스", "생선조림", "생선구이"],
  "햄/소시지": ["소시지야채볶음", "햄전", "부대찌개", "소시지구이"],
  "감자/고구마": ["감자조림", "감자볶음", "고구마맛탕", "감자샐러드"],
  "어묵": ["어묵볶음", "어묵국", "어묵조림", "어묵탕"],
};

// 제철·자투리 채소 (사이드)
const SIDE = {
  "무": ["무생채", "소고기무국", "무조림"],
  "콩나물": ["콩나물전", "콩나물무침", "콩나물국", "콩나물밥"],
  "파프리카": ["파프리카볶음밥", "파프리카샐러드", "생파프리카"],
  "양배추": ["양배추샐러드", "양배추쌈", "계란양배추전"],
  "브로콜리": ["두부브로콜리무침", "브로콜리양파볶음"],
  "오이": ["오이고추장무침", "오이사과샐러드", "오이탕탕이"],
};


// 워킹맘 맞춤 3줄 요약 조리법  { s: 스텝라벨, t: 내용 }
const RECIPES = {
  "닭볶음탕": [["손질", "닭 토막 데쳐 헹구기"], ["양념", "고추장·간장·다진마늘"], ["끓이기", "감자·당근 넣고 자작하게 졸이기"]],
  "간장찜닭": [["손질", "닭 + 당면 미리 불리기"], ["양념", "간장·물엿·마늘"], ["조리", "채소 넣고 윤기나게 졸이기"]],
  "닭곰탕": [["손질", "닭 한 마리 데치기"], ["끓이기", "대파·마늘 넣고 푹"], ["마무리", "소금·후추 간, 밥 말기"]],
  "치킨너겟": [["손질", "닭가슴살 한입 크기"], ["옷", "튀김가루·물 묻히기"], ["굽기", "기름 두르고 노릇하게"]],
  "제육볶음": [["썰기", "돼지고기·양파 채썰기"], ["양념", "고추장·간장·설탕"], ["볶기", "센불에 빠르게 볶기"]],
  "동그랑땡": [["반죽", "다짐육 + 두부 + 계란"], ["모양", "동글납작 빚기"], ["굽기", "계란물 입혀 노릇하게"]],
  "마파두부": [["썰기", "두부 깍둑 · 다짐육"], ["양념", "두반장·간장·물"], ["끓이기", "볶다 두부 넣고 졸이기"]],
  "김치만두소": [["다지기", "김치·두부·다짐육"], ["섞기", "참기름·마늘 넣고"], ["활용", "만두·전·볶음밥에"]],
  "계란말이": [["풀기", "계란 3개 + 소금"], ["굽기", "약불에 얇게 부치기"], ["말기", "도르르 말아 썰기"]],
  "계란찜": [["풀기", "계란 + 물 1:1"], ["간", "새우젓·파 넣기"], ["찌기", "약불 뚜껑덮고 부풀리기"]],
  "계란국": [["끓이기", "멸치육수 끓이기"], ["풀기", "계란 풀어 휘휘"], ["간", "소금·파·후추"]],
  "스크램블": [["풀기", "계란 + 우유 약간"], ["굽기", "약불 버터에"], ["저어주기", "몽글할 때 불 끄기"]],
  "두부조림": [["썰기", "두부 도톰하게"], ["굽기", "노릇하게 지지기"], ["양념", "간장·고춧가루 졸이기"]],
  "두부부침": [["썰기", "두부 도톰하게"], ["굽기", "기름에 노릇하게"], ["곁들이기", "양념간장 톡"]],
  "두부김치": [["볶기", "김치 + 돼지고기"], ["데우기", "두부 데치기"], ["담기", "두부 위에 김치 얹기"]],
  "순두부찌개": [["볶기", "김치·마늘 기름에"], ["끓이기", "순두부·물 넣고"], ["마무리", "계란 톡, 파"]],
  "팽이볶음": [["썰기", "팽이 밑동 자르기"], ["볶기", "기름에 마늘 향내기"], ["양념", "간장·참기름 살짝"]],
  "팽이된장국": [["끓이기", "멸치육수 끓이기"], ["풀기", "된장 풀기"], ["넣기", "팽이·두부·파"]],
  "계란팽이전": [["썰기", "팽이버섯 총총"], ["반죽", "계란 2개, 소금 섞기"], ["굽기", "팬에 올려 앞뒤로 끝!"]],
  "베이컨팽이말이": [["말기", "베이컨에 팽이 돌돌"], ["고정", "이쑤시개 꽂기"], ["굽기", "팬에 굴려 바삭하게"]],
  "소불고기": [["재우기", "고기 + 간장·설탕·마늘"], ["썰기", "양파·당근"], ["볶기", "센불에 자작하게"]],
  "소고기무국": [["볶기", "소고기 + 참기름"], ["넣기", "무 채썰어 넣기"], ["끓이기", "국간장·물 푹"]],
  "불고기덮밥": [["볶기", "양념 불고기"], ["올리기", "밥 위에 듬뿍"], ["마무리", "계란후라이·깨"]],
  "소고기볶음": [["썰기", "소고기·채소"], ["양념", "간장·마늘"], ["볶기", "센불에 빠르게"]],
  "생선전": [["썰기", "생선살 포 뜨기"], ["옷", "밀가루·계란물"], ["굽기", "노릇하게 부치기"]],
  "생선까스": [["옷", "밀가루·계란·빵가루"], ["튀기기", "기름에 노릇"], ["곁들이기", "소스 톡"]],
  "생선조림": [["깔기", "무 깔고 생선 올리기"], ["양념", "간장·고춧가루"], ["졸이기", "자작하게 끓이기"]],
  "생선구이": [["손질", "소금 솔솔"], ["굽기", "팬·에어프라이어"], ["마무리", "레몬 살짝"]],
  "소시지야채볶음": [["썰기", "소시지 칼집·채소"], ["볶기", "기름에 볶기"], ["양념", "케첩·간장"]],
  "햄전": [["썰기", "햄 도톰하게"], ["옷", "밀가루·계란물"], ["굽기", "노릇하게"]],
  "부대찌개": [["담기", "햄·소시지·김치"], ["양념", "고춧가루·육수"], ["끓이기", "라면사리 추가"]],
  "소시지구이": [["칼집", "소시지 칼집내기"], ["굽기", "팬에 굴려"], ["곁들이기", "케첩·머스타드"]],
  "감자조림": [["썰기", "감자 깍둑썰기"], ["볶기", "기름에 살짝"], ["졸이기", "간장·물엿 윤기나게"]],
  "감자볶음": [["썰기", "감자 채썰기"], ["헹구기", "전분 빼기"], ["볶기", "소금·기름에"]],
  "고구마맛탕": [["썰기", "고구마 한입 크기"], ["튀기기", "노릇하게"], ["버무리기", "설탕·물엿 시럽"]],
  "감자샐러드": [["삶기", "감자 푹 삶기"], ["으깨기", "따뜻할 때"], ["섞기", "마요·계란·오이"]],
  "어묵볶음": [["썰기", "어묵 채썰기"], ["볶기", "양파와 함께"], ["양념", "간장·물엿"]],
  "어묵국": [["끓이기", "멸치육수"], ["넣기", "어묵·무"], ["간", "국간장·파"]],
  "어묵조림": [["썰기", "어묵 썰기"], ["양념", "간장·고춧가루"], ["졸이기", "자작하게"]],
  "어묵탕": [["끓이기", "육수에 무·다시마"], ["넣기", "어묵꼬치"], ["마무리", "청양고추·파"]],
  "무생채": [["썰기", "무 채썰기"], ["절이기", "소금 살짝"], ["무치기", "고춧가루·식초·설탕"]],
  "무조림": [["썰기", "무 도톰하게"], ["양념", "간장·고춧가루"], ["졸이기", "푹 무르게"]],
  "콩나물전": [["섞기", "데친 콩나물 + 부침가루"], ["풀기", "물·계란"], ["굽기", "노릇 바삭하게"]],
  "콩나물무침": [["삶기", "콩나물 데치기"], ["헹구기", "찬물에 헹구기"], ["무치기", "소금·참기름·깨"]],
  "콩나물국": [["끓이기", "멸치육수"], ["넣기", "콩나물 뚜껑덮고"], ["간", "소금·다진마늘"]],
  "콩나물밥": [["안치기", "쌀 위에 콩나물"], ["짓기", "밥 짓기"], ["비비기", "양념장에 쓱쓱"]],
  "파프리카볶음밥": [["썰기", "파프리카 잘게"], ["볶기", "밥과 함께"], ["간", "간장·소금"]],
  "파프리카샐러드": [["썰기", "파프리카 채썰기"], ["담기", "채소와 함께"], ["드레싱", "올리브유·발사믹"]],
  "생파프리카": [["씻기", "깨끗이 씻기"], ["썰기", "먹기 좋게"], ["곁들이기", "쌈장·후무스 톡"]],
  "양배추샐러드": [["썰기", "양배추 채썰기"], ["헹구기", "찬물에 아삭하게"], ["드레싱", "마요·머스타드"]],
  "양배추쌈": [["찌기", "양배추 부드럽게"], ["곁들이기", "쌈장 준비"], ["싸기", "밥·고기 올려"]],
  "계란양배추전": [["썰기", "양배추 채썰기"], ["반죽", "계란·부침가루"], ["굽기", "노릇하게"]],
  "두부브로콜리무침": [["데치기", "브로콜리 살짝"], ["으깨기", "두부 으깨기"], ["무치기", "소금·참기름"]],
  "브로콜리양파볶음": [["썰기", "브로콜리·양파"], ["볶기", "기름에 볶기"], ["양념", "굴소스·마늘"]],
  "오이고추장무침": [["썰기", "오이 어슷하게"], ["양념", "고추장·식초·설탕"], ["무치기", "조물조물"]],
  "오이사과샐러드": [["썰기", "오이·사과"], ["담기", "함께 담기"], ["드레싱", "마요·요거트"]],
  "오이탕탕이": [["두드리기", "오이 탕탕"], ["썰기", "한입 크기"], ["양념", "간장·식초·마늘"]],
};

// 레시피 없으면 부드럽게 기본 안내
const getRecipe = (menu) =>
  RECIPES[menu] || [
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

// 메뉴 → 실제 완성요리 사진 경로 슬롯 (없으면 이모지 썸네일로 자동 대체)
const DISH_IMG = {
  // "계란팽이전": "/dishes/egg-enoki.jpg",
};

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

// 메뉴 → 시간/인분/난이도 (접미사 기반, 결정적)
const getMeta = (menu) => {
  let min = 15;
  if (/국|탕|찌개|곰탕/.test(menu)) min = 25;
  else if (/조림|찜/.test(menu)) min = 20;
  else if (/볶음|전|구이|말이/.test(menu)) min = 12;
  else if (/무침|생채|샐러드/.test(menu)) min = 8;
  else if (/밥/.test(menu)) min = 30;
  const easy = min <= 12 || /무침|생채|샐러드|구이|말이/.test(menu);
  return { min, servings: 2, level: easy ? "쉬움" : "보통" };
};
// 재료 → 냉장고 속 이모지
const INGREDIENT_EMOJI = {
  "닭고기": "🍗", "돼지 다짐육": "🍖", "계란": "🥚", "두부": "🧈", "팽이버섯": "🍄",
  "소고기 불고기용": "🥩", "냉동 생선살": "🐟", "햄/소시지": "🌭", "감자/고구마": "🥔", "어묵": "🍢",
  "무": "🥗", "콩나물": "🌱", "파프리카": "🫑", "양배추": "🥬", "브로콜리": "🥦", "오이": "🥒",
};

// 재료 카테고리 — "재료 담기" 바텀시트 탭 순서/구성
const INGREDIENT_CATEGORIES = [
  { key: "meat", label: "고기", icon: "🥩", items: ["닭고기", "돼지 다짐육", "소고기 불고기용"] },
  { key: "seafood", label: "해물", icon: "🐟", items: ["냉동 생선살", "어묵"] },
  { key: "dairy", label: "유제품·계란", icon: "🥚", items: ["계란", "두부"] },
  { key: "processed", label: "가공식품", icon: "🌭", items: ["햄/소시지"] },
  { key: "veg", label: "채소", icon: "🥬", items: ["무", "콩나물", "파프리카", "양배추", "브로콜리", "오이"] },
  { key: "mushroom", label: "버섯", icon: "🍄", items: ["팽이버섯"] },
  { key: "root", label: "곡류·뿌리", icon: "🥔", items: ["감자/고구마"] },
];

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

// 우리 가족 냉장고 — 닫힌 문 사진 / 열린 내부(LED) 사진
const FRIDGE_DOOR_IMG = fridgeDoorImg;
const FRIDGE_IN_IMG = fridgeInImg;

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
// 외식 요일 우선순위 (가운데/주말부터 자연스럽게 비움)
const REST_PRIORITY = ["수", "토", "금", "일", "목", "화", "월"];

// 하단 탭
const TABS = [
  { key: "fridge", label: "냉장고", icon: ChefHat },
  { key: "menu", label: "추천메뉴", icon: Sparkles },
  { key: "plan", label: "식단표", icon: CalendarDays },
];
const TAB_SUBTITLE = {
  fridge: "냉장고 속 재료만 고르면 끝나요",
  menu: "고른 재료로 오늘 뭐 먹을지 딱!",
  plan: "일주일 식단, 고민 없이 자동으로",
};

export default function RealHomeMeal() {
  const [selected, setSelected] = useState(["계란", "두부", "콩나물", "감자/고구마"]);
  const [diningOut, setDiningOut] = useState(2);
  const [budget, setBudget] = useState(6); // 만원
  const [activeMenu, setActiveMenu] = useState(null); // 레시피 모달
  const [tab, setTab] = useState("fridge"); // fridge | menu | plan

  // ESC로 모달 닫기
  useEffect(() => {
    if (!activeMenu) return;
    const onKey = (e) => e.key === "Escape" && setActiveMenu(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeMenu]);

  const addIngredient = (name) =>
    setSelected((prev) => (prev.includes(name) ? prev : [...prev, name]));
  const removeIngredient = (name) =>
    setSelected((prev) => prev.filter((n) => n !== name));

  // 선택한 재료 → 추천 메뉴 (재료별 그룹)
  const matched = useMemo(() => {
    return selected
      .map((name) => ({
        name,
        menus: MAIN[name] || SIDE[name] || [],
        kind: MAIN[name] ? "main" : "side",
      }))
      .filter((g) => g.menus.length);
  }, [selected]);

  // 사진 카드용 평면 리스트 (재료 순서대로, 중복 제거)
  const dishCards = useMemo(() => {
    const seen = new Set();
    const list = [];
    matched.forEach((g) =>
      g.menus.forEach((m) => {
        if (seen.has(m)) return;
        seen.add(m);
        list.push({ menu: m, from: g.name, kind: g.kind });
      })
    );
    return list;
  }, [matched]);

  // 메인/사이드 메뉴 풀
  const pools = useMemo(() => {
    const mains = [];
    const sides = [];
    selected.forEach((n) => {
      if (MAIN[n]) MAIN[n].forEach((m) => mains.push({ menu: m, from: n }));
      if (SIDE[n]) SIDE[n].forEach((m) => sides.push({ menu: m, from: n }));
    });
    return { mains, sides };
  }, [selected]);

  // 일주일 식단표 생성 (재료 로테이션)
  const weekPlan = useMemo(() => {
    const restDays = new Set(REST_PRIORITY.slice(0, Math.min(diningOut, 7)));
    const { mains, sides } = pools;
    let mi = 0;
    let si = 0;
    return DAYS.map((day) => {
      if (restDays.has(day)) return { day, rest: true };
      const a = mains.length ? mains[mi++ % mains.length] : null;
      const b = sides.length ? sides[si++ % sides.length] : null;
      let parts = [a, b].filter(Boolean);
      // 한쪽만 선택된 경우 같은 풀에서 2개 구성
      if (parts.length < 2) {
        const onlyPool = mains.length ? mains : sides;
        if (onlyPool.length >= 2) {
          parts = [onlyPool[mi % onlyPool.length], onlyPool[(mi + 1) % onlyPool.length]];
          mi += 2;
        }
      }
      return { day, rest: false, parts };
    });
  }, [pools, diningOut]);

  const cookingDays = weekPlan.filter((d) => !d.rest && d.parts && d.parts.length).length;

  // 예산 시각화
  const BUDGET_MIN = 5;
  const BUDGET_MAX = 8;
  const budgetPct = ((budget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;

  const copyList = () => {
    if (!selected.length) {
      alert("먼저 냉장고 속 재료를 골라주세요 🧺");
      return;
    }
    const lines = selected.map((n, i) => `${i + 1}. ${n}`).join("\n");
    alert(
      `🛒 쿠팡 장바구니 리스트 (복사 완료!)\n\n${lines}\n\n` +
        `💰 이번 주 목표 예산: ${budget}만원\n` +
        `🍳 집밥 ${cookingDays}일 · 외식 ${diningOut}일\n\n` +
        `엄마, 오늘도 잘 해내고 있어요 🍀`
    );
  };

  return (
    <div
      style={{ background: C.canvas, color: C.ink, fontFamily: "'Paperlogy','Inter','Pretendard',system-ui,sans-serif" }}
      className="flex min-h-screen w-full justify-center"
    >
      {/* 폰 셸 */}
      <div
        className="relative flex min-h-screen w-full max-w-[440px] flex-col"
        style={{ background: C.canvas, boxShadow: "0 0 80px -30px rgba(58,42,32,0.25)" }}
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
          {tab === "fridge" && (
            <div className="space-y-5">
              <div>
                <SectionTitle icon={<ChefHat size={16} />} label="냉장고 속 재료 선택" />
                <Fridge selected={selected} onAdd={addIngredient} onRemove={removeIngredient} />
                <p className="mt-2 text-center text-[11.5px]" style={{ color: C.sub }}>
                  냉장고에 담긴 재료로 메뉴를 추천해드려요 🧺
                </p>
              </div>

              <Card>
                <SectionTitle icon={<Coffee size={16} />} label="이번 주 외식 횟수" />
                <div className="mt-1 flex gap-2">
                  {[1, 2, 3, 4].map((n) => {
                    const on = diningOut === n;
                    return (
                      <button
                        key={n}
                        onClick={() => setDiningOut(n)}
                        className="flex-1 rounded-2xl py-3 text-[14px] font-medium transition-all"
                        style={{
                          background: on ? C.sage : C.card,
                          color: on ? "#fff" : C.ink,
                          border: `1px solid ${on ? C.sage : C.line}`,
                          boxShadow: on ? "0 10px 22px -14px rgba(110,139,79,0.9)" : "none",
                        }}
                      >
                        주 {n}회
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <SectionTitle icon={<Wallet size={16} />} label="주간 장보기 예산" />
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[30px] font-bold tracking-tight" style={{ color: C.gold }}>
                    {budget}
                  </span>
                  <span className="text-[14px] font-medium" style={{ color: C.sub }}>
                    만원
                  </span>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full" style={{ background: C.line }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${budgetPct}%`, background: `linear-gradient(90deg, ${C.yolk}, ${C.gold})` }}
                  />
                </div>
                <input
                  type="range"
                  min={5}
                  max={8}
                  step={1}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="mt-3 w-full cursor-pointer"
                  style={{ accentColor: C.gold }}
                />
                <div className="flex justify-between text-[11px]" style={{ color: C.sub }}>
                  <span>5만원</span>
                  <span>8만원</span>
                </div>
              </Card>

              {/* 다음 단계 유도 */}
              <button
                onClick={() => setTab("menu")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold"
                style={{ background: C.gold, color: "#fff", boxShadow: "0 16px 30px -16px rgba(217,96,63,0.9)" }}
              >
                <Sparkles size={18} strokeWidth={2.3} />
                추천 메뉴 {dishCards.length}개 보기
              </button>
            </div>
          )}

          {tab === "menu" && (
            <div className="space-y-4">
              <Card>
                <div className="flex items-center justify-between">
                  <SectionTitle icon={<Sparkles size={16} />} label="바로 만들 메뉴" noMargin />
                  {dishCards.length > 0 && (
                    <span className="text-[12px]" style={{ color: C.sub }}>
                      {dishCards.length}개
                    </span>
                  )}
                </div>
                {dishCards.length > 0 ? (
                  <>
                    <p className="mb-3 mt-1 text-[12px]" style={{ color: C.sub }}>
                      카드를 누르면 3줄 요약 조리법이 떠요 👆
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {dishCards.map((d) => (
                        <DishCard key={d.menu} dish={d} onOpen={setActiveMenu} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-2">
                    <Empty text="아직 고른 재료가 없어요. ‘냉장고’ 탭에서 재료를 골라주세요." />
                    <button
                      onClick={() => setTab("fridge")}
                      className="mt-3 w-full rounded-2xl py-3 text-[14px] font-semibold"
                      style={{ background: C.goldSoft, color: C.gold }}
                    >
                      냉장고 재료 고르러 가기
                    </button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {tab === "plan" && (
            <div className="space-y-4">
              <Card>
                <div className="flex items-center justify-between">
                  <SectionTitle icon={<CalendarDays size={16} />} label="일주일 식단표" noMargin />
                  <span className="text-[12px]" style={{ color: C.sub }}>
                    집밥 {cookingDays}일 · 외식 {diningOut}일
                  </span>
                </div>
                <div className="mt-4 space-y-2.5">
                  {weekPlan.map((d) => (
                    <DayCard key={d.day} data={d} onOpen={setActiveMenu} />
                  ))}
                </div>
              </Card>

              <button
                onClick={copyList}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-bold transition-all"
                style={{ background: C.ink, color: "#fff", boxShadow: "0 16px 30px -18px rgba(58,42,32,0.8)" }}
              >
                <ShoppingCart size={18} strokeWidth={2.2} />
                쿠팡 장바구니 리스트로 복사하기
              </button>
              <p className="pb-1 text-center text-[12px]" style={{ color: C.sub }}>
                엄마도 매일 잘 해내고 있어요 🍀
              </p>
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
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex flex-1 flex-col items-center gap-1 py-2.5 pb-3 transition-colors"
                style={{ color: on ? C.gold : C.sub }}
              >
                <Icon size={21} strokeWidth={on ? 2.5 : 2} />
                <span className="text-[11px]" style={{ fontWeight: on ? 700 : 500 }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

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

function ChipGroup({ keys, selected, onToggle, accent, softBg }) {
  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((name) => {
        const on = selected.includes(name);
        return (
          <button
            key={name}
            onClick={() => onToggle(name)}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all"
            style={{
              background: on ? softBg : "#fff",
              color: on ? accent : C.ink,
              border: `1px solid ${on ? accent : C.line}`,
            }}
          >
            {on && <Check size={13} strokeWidth={3} />}
            {name}
          </button>
        );
      })}
    </div>
  );
}

function DayCard({ data, onOpen }) {
  if (data.rest) {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
        style={{ background: C.sageSoft, border: `1px solid ${C.sage}33` }}
      >
        <DayBadge day={data.day} bg={C.sage} />
        <div className="flex items-center gap-1.5 text-[13.5px] font-medium" style={{ color: C.sage }}>
          엄마도 쉬는 외식 Day! <Coffee size={15} strokeWidth={2.2} />
        </div>
      </div>
    );
  }

  const parts = data.parts && data.parts.length ? data.parts : null;
  const totalMin = parts ? Math.max(...parts.map((p) => getMeta(p.menu).min)) + 5 : 0;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
      style={{ background: "#FBF4EA", border: `1px solid ${C.line}` }}
    >
      <DayBadge day={data.day} bg={C.ink} />
      <div className="min-w-0 flex-1">
        {parts ? (
          <>
            <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[14px] font-medium">
              {parts.map((p, i) => (
                <React.Fragment key={p.menu + i}>
                  {i > 0 && <span style={{ color: C.sub }}>&</span>}
                  <button
                    onClick={() => onOpen(p.menu)}
                    className="rounded-md underline-offset-2 transition-colors hover:underline"
                    style={{ color: C.ink }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.ink)}
                  >
                    {p.menu}
                  </button>
                </React.Fragment>
              ))}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px]" style={{ color: C.sub }}>
              <span>{[...new Set(parts.map((p) => p.from))].join(" · ")}</span>
              <span style={{ color: C.line }}>|</span>
              <span>⏱ 약 {totalMin}분</span>
            </p>
          </>
        ) : (
          <p className="text-[14px] font-medium" style={{ color: C.sub }}>
            재료를 더 골라주세요
          </p>
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

// 냉장고 선반에 담긴 재료 타일 (우상단 X로 빼기)
function FridgeShelfTile({ name, onRemove }) {
  const img = INGREDIENT_IMG[name];
  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative">
        <div
          className="relative flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-[18px]"
          style={{
            background: img ? "#fff" : `radial-gradient(120% 120% at 30% 25%, #FFFFFF, ${getTint(name)})`,
            border: `2px solid ${C.line}`,
            boxShadow: "0 4px 8px -4px rgba(58,42,32,0.35)",
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
          {/* 살짝 비치는 유리광 */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0))" }}
          />
        </div>
        {/* 빼기 버튼 */}
        <button
          onClick={() => onRemove(name)}
          aria-label={`${name} 빼기`}
          className="absolute -right-1.5 -top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full text-white"
          style={{ background: C.ink, boxShadow: "0 2px 5px -1px rgba(58,42,32,0.6)", border: "2px solid #fff" }}
        >
          <X size={11} strokeWidth={3.2} />
        </button>
      </div>
      <span
        className="mt-1.5 max-w-[84px] truncate text-[11px] font-semibold"
        style={{ color: C.ink }}
      >
        {name}
      </span>
    </div>
  );
}

// 바텀시트 안 재료 타일 (톡 누르면 담김 + 위로 떠오르는 피드백)
function SheetItem({ name, added, onAdd, reduced }) {
  const img = INGREDIENT_IMG[name];
  const [burst, setBurst] = useState(0); // 증가시켜 플로팅 애니메이션 재시작
  const handle = () => {
    if (added) return;
    onAdd(name);
    if (!reduced) setBurst((b) => b + 1);
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

// 재료 담기 바텀시트 (카테고리 탭 + 그리드)
function AddSheet({ open, onClose, selected, onAdd, reduced }) {
  const [cat, setCat] = useState(INGREDIENT_CATEGORIES[0].key);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const active = INGREDIENT_CATEGORIES.find((c) => c.key === cat) || INGREDIENT_CATEGORIES[0];
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
        className={`relative flex w-full max-w-[440px] flex-col ${reduced ? "" : "sheet-up"}`}
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
        <div className="flex items-center justify-between px-5 pb-2 pt-2">
          <h3 className="text-[15px] font-bold tracking-tight" style={{ color: C.ink }}>
            🧺 재료 담기
          </h3>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.sub }}
          >
            <X size={16} strokeWidth={2.6} />
          </button>
        </div>
        {/* 카테고리 탭 */}
        <div
          className="flex gap-2 overflow-x-auto px-5 pb-3"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {INGREDIENT_CATEGORIES.map((c) => {
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
        {/* 재료 그리드 */}
        <div className="grid grid-cols-4 gap-3 overflow-y-auto px-5 pb-8 pt-1">
          {active.items.map((name) => (
            <SheetItem
              key={name}
              name={name}
              added={selected.includes(name)}
              onAdd={onAdd}
              reduced={reduced}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Fridge({ selected, onAdd, onRemove }) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false); // 시작은 닫힘
  const [sheetOpen, setSheetOpen] = useState(false);

  const rows = [];
  for (let i = 0; i < selected.length; i += 3) rows.push(selected.slice(i, i + 3));
  const count = selected.length;

  const shelfBar = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(184,170,148,0.45) 100%)",
    boxShadow: "0 3px 5px -2px rgba(58,42,32,0.28)",
  };

  return (
    <div className="relative" style={{ perspective: "1500px", aspectRatio: "1003 / 1568" }}>
      {/* 냉장고 본체 — 세로로 긴 양문 냉장고 비율 */}
      <div
        className="h-full overflow-hidden rounded-[26px]"
        style={{ border: `1px solid ${C.line}`, boxShadow: "0 18px 40px -28px rgba(58,42,32,0.5)" }}
      >
        {/* 내부 */}
        <div
          className="relative flex h-full flex-col px-3.5 pb-4 pt-3.5"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #FBF6EE 100%)",
            boxShadow: "inset 0 14px 26px -18px rgba(232,163,61,0.45), inset 0 0 0 1px rgba(255,255,255,0.6)",
          }}
        >
          {/* 열린 냉장고 LED 내부 사진 + 가독성 오버레이 */}
          {open && (
            <>
              <img
                src={FRIDGE_IN_IMG}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
              />
              <span
                className="pointer-events-none absolute inset-0 z-0"
                style={{ background: "rgba(0,0,0,0.28)" }}
              />
            </>
          )}

          {/* 라이트 + 카운트 */}
          <div className="relative z-10 mb-3 flex items-center justify-between px-1">
            <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: C.sub }}>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#FBD96B", boxShadow: "0 0 6px 1px #FBD96B" }} />
              우리 가족 냉장고
            </span>
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{ background: C.goldSoft, color: C.gold }}
              >
                {count}개 담음
              </span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ color: C.sub, border: `1px solid ${C.line}` }}
              >
                문 닫기
              </button>
            </div>
          </div>

          {/* 선반 — 담긴 재료 (남는 세로 공간을 채워 냉장고 속처럼) */}
          <div className="relative z-10 flex flex-1 flex-col overflow-y-auto">
            {count > 0 ? (
              <div>
                {rows.map((row, ri) => (
                  <div key={ri}>
                    <div className="grid grid-cols-3 place-items-center gap-2 px-1">
                      {row.map((name) => (
                        <FridgeShelfTile key={name} name={name} onRemove={onRemove} />
                      ))}
                    </div>
                    <div className="mx-0.5 mb-3 mt-1.5 h-[6px] rounded-full" style={shelfBar} />
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="my-auto flex flex-col items-center justify-center rounded-2xl py-8 text-center"
                style={{ background: "rgba(255,255,255,0.6)", border: `1px dashed ${C.line}` }}
              >
                <span className="text-[30px]">🧺</span>
                <p className="mt-1.5 text-[12.5px] font-medium" style={{ color: C.sub }}>
                  냉장고가 비었어요.<br />아래에서 재료를 담아보세요.
                </p>
              </div>
            )}
          </div>

          {/* 재료 담기 버튼 — 냉장고 하단 고정 */}
          <button
            onClick={() => setSheetOpen(true)}
            className="relative z-10 mt-3 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-2xl py-3.5 text-[14px] font-bold"
            style={{
              background: C.goldSoft,
              color: C.gold,
              border: `1px solid ${C.gold}55`,
            }}
          >
            <span className="text-[16px] leading-none">＋</span> 재료 담기
          </button>
        </div>
      </div>

      {/* 재료 담기 바텀시트 */}
      <AddSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        selected={selected}
        onAdd={onAdd}
        reduced={reduced}
      />

      {/* 냉장고 양문 (가운데에서 양쪽으로 열림) */}
      <div
        className="absolute inset-0 z-20"
        style={{ perspective: "1600px", pointerEvents: open ? "none" : "auto" }}
        aria-hidden={open}
      >
        {/* 왼쪽 문짝 — fridge-door 사진의 왼쪽 절반 */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          tabIndex={open ? -1 : 0}
          aria-label="우리 가족 냉장고 열기"
          className="absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-[26px]"
          style={{
            transformOrigin: "left center",
            transform: open ? "rotateY(-115deg)" : "rotateY(0deg)",
            transition: reduced ? "none" : "transform 0.7s ease-out, opacity 0.7s ease-out",
            opacity: open ? 0 : 1,
            backfaceVisibility: "hidden",
            backgroundColor: "#EFE3D2",
            backgroundImage: `url(${FRIDGE_DOOR_IMG})`,
            backgroundSize: "200% 100%",
            backgroundPosition: "left center",
            borderTop: `1px solid ${C.line}`,
            borderBottom: `1px solid ${C.line}`,
            borderLeft: `1px solid ${C.line}`,
            boxShadow: "0 18px 40px -26px rgba(58,42,32,0.55)",
          }}
        >
          {/* 가운데 분리선 */}
          <span
            className="pointer-events-none absolute inset-y-0 right-0 w-px"
            style={{ background: "rgba(58,42,32,0.22)", boxShadow: "1px 0 2px rgba(255,255,255,0.35)" }}
          />
          {/* 상단 디스플레이 패널 */}
          <span
            className="absolute left-4 top-4 flex items-center gap-2 rounded-xl px-3 py-1.5"
            style={{ background: "rgba(35,28,22,0.82)", color: "#fff", boxShadow: "0 4px 10px -4px rgba(0,0,0,0.4)" }}
          >
            <span className="text-[11px] font-bold tracking-tight">우리 가족 냉장고</span>
            <span className="text-[10px]" style={{ color: "#9FE0C4" }}>❄ 3°C</span>
          </span>
        </button>

        {/* 오른쪽 문짝 — fridge-door 사진의 오른쪽 절반 */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          tabIndex={open ? -1 : 0}
          aria-label="우리 가족 냉장고 열기"
          className="absolute inset-y-0 right-0 w-1/2 overflow-hidden rounded-r-[26px]"
          style={{
            transformOrigin: "right center",
            transform: open ? "rotateY(115deg)" : "rotateY(0deg)",
            transition: reduced ? "none" : "transform 0.7s ease-out, opacity 0.7s ease-out",
            opacity: open ? 0 : 1,
            backfaceVisibility: "hidden",
            backgroundColor: "#EFE3D2",
            backgroundImage: `url(${FRIDGE_DOOR_IMG})`,
            backgroundSize: "200% 100%",
            backgroundPosition: "right center",
            borderTop: `1px solid ${C.line}`,
            borderBottom: `1px solid ${C.line}`,
            borderRight: `1px solid ${C.line}`,
            boxShadow: "0 18px 40px -26px rgba(58,42,32,0.55)",
          }}
        />

        {/* 열기 힌트 (양문 가운데, 닫힘일 때만 보임) */}
        <span
          className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
          style={{
            background: C.ink,
            color: "#fff",
            boxShadow: "0 6px 14px -6px rgba(58,42,32,0.6)",
            opacity: open ? 0 : 1,
            transition: reduced ? "none" : "opacity 0.3s ease-out",
          }}
        >
          톡 눌러서 냉장고 열기 👆
        </span>
      </div>
    </div>
  );
}

function DishCard({ dish, onOpen }) {
  const { menu, from, kind } = dish;
  const meta = getMeta(menu);
  return (
    <button
      onClick={() => onOpen(menu)}
      className="group flex flex-col overflow-hidden rounded-2xl text-left transition-all"
      style={{ background: C.card, border: `1px solid ${C.line}` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.gold;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 16px 30px -22px rgba(58,42,32,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.line;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* 썸네일 */}
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
        style={{ background: `radial-gradient(120% 120% at 30% 20%, #FFFFFF, ${getHue(menu)})` }}
      >
        {DISH_IMG[menu] ? (
          <img src={DISH_IMG[menu]} alt={menu} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <span className="text-[40px] leading-none transition-transform duration-300 group-hover:scale-110" style={{ filter: "drop-shadow(0 2px 3px rgba(58,42,32,0.25))" }}>
            {getEmoji(menu)}
          </span>
        )}
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: "rgba(255,255,255,0.85)",
            color: kind === "main" ? C.gold : C.sage,
            border: `1px solid ${C.line}`,
          }}
        >
          {from}
        </span>
        <span
          className="absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: C.ink, color: "#fff" }}
        >
          ⏱ {meta.min}분
        </span>
      </div>
      {/* 정보 */}
      <div className="px-3 py-2.5">
        <p className="truncate text-[13.5px] font-semibold" style={{ color: C.ink }}>
          {menu}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: C.sub }}>
          <span>👤 {meta.servings}인분</span>
          <span style={{ color: C.line }}>|</span>
          <span style={{ color: meta.level === "쉬움" ? C.sage : C.sub }}>{meta.level}</span>
        </div>
      </div>
    </button>
  );
}

function RecipeModal({ menu, onClose }) {
  const steps = getRecipe(menu);
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
                  <p className="mt-0.5 text-[15px] font-medium" style={{ color: C.ink }}>
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

function DayBadge({ day, bg }) {
  return (
    <span
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[14px] font-semibold text-white"
      style={{ background: bg }}
    >
      {day}
    </span>
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
