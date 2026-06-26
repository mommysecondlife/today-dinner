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
  const { eatOutDays = [], excludeSpicy = false } = opts;
  const fridgeSet = new Set(fridge);

  let makeable = menus.filter(m => isMakeable(m, fridgeSet));
  if (excludeSpicy) makeable = makeable.filter(m => !m.spicy);

  const pool = {
    guk: makeable.filter(m => m.role === 'guk'),
    main: makeable.filter(m => m.role === 'main'),
    banchan: makeable.filter(m => m.role === 'banchan'),
  };

  const riceRot = makeRotator(RICE.map(n => ({ name: n, emoji: '🍚', role: 'bap' })));
  const gukRot = makeRotator(pool.guk);
  const mainRot = makeRotator(pool.main);
  const banchanRot = makeRotator(pool.banchan);

  let prev = { bap: '', guk: '', main: '', banchan: [] };
  const week = WEEKDAYS.map(day => {
    if (eatOutDays.includes(day)) {
      return { day, eatOut: true };
    }

    const bap = riceRot([prev.bap]);        // 어제 밥과 다르게
    const guk = gukRot([prev.guk]);         // 어제 국과 다르게
    const main = mainRot([prev.main]);      // 어제 메인과 다르게

    // 반찬 2개 — 서로 다르게 + 어제와 안 겹치게 + 가능하면 조리법도 다르게
    const b1 = banchanRot([...prev.banchan]);
    const usedToday = b1 ? [b1.name] : [];
    // b1과 조리법이 같은 반찬은 피함 ('기타'끼리는 겹쳐도 OK라 제약 안 검). 후보 부족하면 로테이터가 그래도 채움.
    const b1Method = b1 ? getMethod(b1.name) : null;
    const sameMethodNames =
      b1 && b1Method !== '기타'
        ? pool.banchan.filter(x => getMethod(x.name) === b1Method).map(x => x.name)
        : [];
    const b2 = banchanRot([...usedToday, ...prev.banchan, ...sameMethodNames]);

    // 후보가 1개뿐이라 b1·b2가 같은 반찬이면 → 하나만
    const banchan = [];
    for (const b of [b1, b2]) {
      if (b && !banchan.some(x => x.name === b.name)) banchan.push(b);
    }

    prev = {
      bap: bap?.name || '',
      guk: guk?.name || '',
      main: main?.name || '',
      banchan: banchan.map(b => b.name),
    };

    return {
      day,
      eatOut: false,
      bap,
      guk,
      main,
      banchan,
      mainEmpty: !main,
      gukEmpty: !guk,   // 추가: 국 빈칸도 알려줌
    };
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
