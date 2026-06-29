// ============================================
// 일주일 식단 생성 — 골고루 안 겹치게 뽑는 함수
// 기존 "식단 짜기" 생성 로직을 이 함수로 교체하세요.
// ============================================

const PANTRY = new Set(['쌀','김치','미역','다시마','멸치','양파','대파','마늘','당근']);
const WEEKDAYS = ['월','화','수','목','금','토','일'];
const RICE = ['잡곡밥','흰쌀밥','현미밥','보리밥'];

// 배열을 무작위로 섞기 (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 로테이터: 후보를 다 쓸 때까지 안 겹치게 하나씩 꺼내고, 다 쓰면 다시 섞어서 채움.
// avoid: 직전에 쓴 메뉴(연속 방지). 같은 날 이미 쓴 것도 제외(exclude).
function makeRotator(items) {
  let queue = shuffle(items);
  return function next(avoidNames = []) {
    if (items.length === 0) return null;
    // 큐에서 avoid에 없는 첫 메뉴 찾기
    let idx = queue.findIndex(m => !avoidNames.includes(m.name));
    if (idx === -1) {
      // 큐가 비었거나 다 avoid면 → 다시 채우기
      queue = shuffle(items);
      idx = queue.findIndex(m => !avoidNames.includes(m.name));
      if (idx === -1) idx = 0; // 후보가 1개뿐이면 어쩔 수 없이 사용
    }
    return queue.splice(idx, 1)[0];
  };
}

// 메뉴가 지금 냉장고 재료로 만들 수 있는지
function isMakeable(menu, fridgeSet) {
  if (menu.needShopping) return false;
  if (!menu.req || menu.req.length === 0) return false;
  return menu.req.every(i => fridgeSet.has(i) || PANTRY.has(i));
}

// 아침 간단식 가능 여부 — needShopping(식빵 등)이어도 req만 충족되면 OK(사면 되니까). req 비어도 OK(누룽지 등).
function breakfastMakeable(menu, fridgeSet) {
  if (!menu.req || menu.req.length === 0) return true;
  return menu.req.every(i => fridgeSet.has(i) || PANTRY.has(i));
}

// 메뉴 이름에서 조리법 추출 (위에서부터 먼저 매칭되는 것 사용) — 같은 날 반찬 조리법 다양화용
function getMethod(name) {
  if (/무침|겉절이|생채|나물/.test(name)) return '무침';
  if (/볶음|볶이/.test(name)) return '볶음';
  if (/조림|장조림/.test(name)) return '조림';
  if (/구이/.test(name)) return '구이';
  if (/찜/.test(name)) return '찜';
  if (/튀김|커틀릿|까스/.test(name)) return '튀김';
  if (/전|부침|적/.test(name)) return '부침';
  if (/말이/.test(name)) return '계란';
  return '기타';
}

/**
 * 일주일 식단 생성
 * @param {Array} menus - 전체 MENUS
 * @param {Array} fridge - 사용자가 담은 재료 이름 배열
 * @param {Object} opts - { eatOutDays: ['수','토'], excludeSpicy: false }
 * @returns {Array} 7일 식단
 */
export function generateWeekPlan(menus, fridge, opts = {}) {
  const { eatOutDays = [], excludeSpicy = false, meals = ['저녁'] } = opts;
  const fridgeSet = new Set(fridge);

  let makeable = menus.filter(m => isMakeable(m, fridgeSet));
  if (excludeSpicy) makeable = makeable.filter(m => !m.spicy);

  const pool = {
    guk: makeable.filter(m => m.role === 'guk'),
    main: makeable.filter(m => m.role === 'main'),
    banchan: makeable.filter(m => m.role === 'banchan'),
  };

  // 아침 풀 — meal:"아침" 메뉴. needShopping 아닌 것 우선, 부족하면(<4개) needShopping 포함.
  let breakfastAll = menus.filter(m => m.meal === '아침' && breakfastMakeable(m, fridgeSet));
  if (excludeSpicy) breakfastAll = breakfastAll.filter(m => !m.spicy);
  const breakfastNoShop = breakfastAll.filter(m => !m.needShopping);
  const breakfastPool = breakfastNoShop.length >= 4 ? breakfastNoShop : breakfastAll;

  const riceRot = makeRotator(RICE.map(n => ({ name: n, emoji: '🍚', role: 'bap' })));
  const gukRot = makeRotator(pool.guk);
  const mainRot = makeRotator(pool.main);
  const banchanRot = makeRotator(pool.banchan);
  const breakfastRot = makeRotator(breakfastPool);

  // 끼니 순서(아침→점심→저녁) 중 선택된 것만. 비면 저녁 기본.
  const order = ['아침', '점심', '저녁'].filter(m => meals.includes(m));
  const safeMeals = order.length ? order : ['저녁'];

  let prev = { bap: '', guk: '', main: '', banchan: [], breakfast: '' };

  const week = WEEKDAYS.map(day => {
    if (eatOutDays.includes(day)) return { day, eatOut: true };

    const usedToday = []; // 이 날 모든 끼니에서 쓴 메뉴 이름 (끼니 간 겹침 방지)
    const byMeal = {};

    for (const meal of safeMeals) {
      if (meal === '아침') {
        // 간단식 1개
        const b = breakfastRot([prev.breakfast, ...usedToday]);
        if (b) usedToday.push(b.name);
        byMeal['아침'] = { simple: b || null };
        prev.breakfast = b?.name || prev.breakfast;
      } else if (meal === '점심') {
        // 밥 + 메인 + 반찬 1개 (국 생략)
        const bap = riceRot([prev.bap, ...usedToday]);
        if (bap) usedToday.push(bap.name);
        const main = mainRot([prev.main, ...usedToday]);
        if (main) usedToday.push(main.name);
        const b1 = banchanRot([...prev.banchan, ...usedToday]);
        if (b1) usedToday.push(b1.name);
        byMeal['점심'] = { bap, main, banchan: b1 ? [b1] : [], mainEmpty: !main };
        prev.bap = bap?.name || prev.bap;
        prev.main = main?.name || prev.main;
        prev.banchan = b1 ? [b1.name] : prev.banchan;
      } else {
        // 저녁 — 밥 + 국 + 메인 + 반찬 2개 (풀세트, 기존 로직)
        const bap = riceRot([prev.bap, ...usedToday]);
        if (bap) usedToday.push(bap.name);
        const guk = gukRot([prev.guk, ...usedToday]);
        if (guk) usedToday.push(guk.name);
        const main = mainRot([prev.main, ...usedToday]);
        if (main) usedToday.push(main.name);
        const b1 = banchanRot([...prev.banchan, ...usedToday]);
        if (b1) usedToday.push(b1.name);
        const b1Method = b1 ? getMethod(b1.name) : null;
        const sameMethodNames =
          b1 && b1Method !== '기타'
            ? pool.banchan.filter(x => getMethod(x.name) === b1Method).map(x => x.name)
            : [];
        const b2 = banchanRot([...usedToday, ...prev.banchan, ...sameMethodNames]);
        if (b2) usedToday.push(b2.name);
        const banchan = [];
        for (const b of [b1, b2]) {
          if (b && !banchan.some(x => x.name === b.name)) banchan.push(b);
        }
        byMeal['저녁'] = { bap, guk, main, banchan, mainEmpty: !main, gukEmpty: !guk };
        prev.bap = bap?.name || prev.bap;
        prev.guk = guk?.name || prev.guk;
        prev.main = main?.name || prev.main;
        prev.banchan = banchan.map(b => b.name);
      }
    }

    return { day, eatOut: false, byMeal };
  });

  return week;
}

/* ── 사용 예시 ──
const week = generateWeekPlan(MENUS, fridgeIngredients, {
  eatOutDays: ['수','토'],
  excludeSpicy: childMode,
});
// week.map(...)로 렌더링.
// 색다른(별미) 메뉴는 기존 슬라이더 로직대로 별도 처리하세요.
*/
