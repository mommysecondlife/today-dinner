import React, { useState, useMemo, useEffect } from "react";
import { ChefHat, ShoppingCart, Coffee, Check, CalendarDays, Sparkles, X, Timer, Hand, RefreshCw } from "lucide-react";

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
  "잡곡밥": [["씻기", "쌀·잡곡 슥슥 헹구기"], ["불리기", "30분 불리면 더 부드럽게"], ["짓기", "물 맞춰 밥 짓기"]],
  "배추김치": [["꺼내기", "통에서 한 포기 꺼내기"], ["썰기", "먹기 좋게 쭉쭉"], ["담기", "종지에 가지런히"]],
  // 별미(원플레이트)
  "토마토 스파게티": [["삶기", "면 8~9분, 소금 넣고"], ["볶기", "마늘·토마토소스 데우기"], ["버무리기", "면 넣고 면수 살짝"]],
  "크림 스파게티": [["삶기", "면 삶고 면수 남기기"], ["소스", "생크림·마늘·치즈 끓이기"], ["버무리기", "면 넣고 꾸덕하게"]],
  "돈까스": [["옷", "고기에 밀가루·계란·빵가루"], ["튀기기", "180도 노릇하게"], ["곁들이기", "소스·양배추 듬뿍"]],
  "함박스테이크": [["반죽", "다짐육·양파·빵가루 치대기"], ["굽기", "양면 노릇 + 속까지"], ["소스", "데미그라스 끼얹기"]],
  "카레라이스": [["볶기", "고기·감자·당근·양파"], ["끓이기", "물 붓고 푹"], ["풀기", "카레가루 넣고 걸쭉하게"]],
  "김치볶음밥": [["볶기", "김치·기름에 달달"], ["넣기", "밥·간장 넣고 볶기"], ["올리기", "계란후라이 + 김가루"]],
  "오므라이스": [["볶음밥", "밥·케첩·채소 볶기"], ["지단", "계란 얇게 부치기"], ["덮기", "밥 위에 덮고 케첩"]],
  "잡채": [["불리기", "당면 삶아 헹구기"], ["볶기", "채소·고기 따로 볶기"], ["버무리기", "간장·참기름에 다 같이"]],
  "비빔국수": [["삶기", "소면 삶아 찬물 헹구기"], ["양념", "고추장·식초·설탕"], ["비비기", "오이·계란 올려 쓱쓱"]],
  "떡볶이": [["끓이기", "물·고추장·설탕"], ["넣기", "떡·어묵 넣고 졸이기"], ["마무리", "대파·삶은계란"]],
};

// 메뉴 풀 확장 — 재료마다 국/메인/반찬을 더 추가 (겹침 방지용)
const EXTRA_MENUS = {
  "닭고기": ["닭갈비", "닭미역국", "데리야키치킨", "닭가슴살냉채"],
  "돼지 다짐육": ["돼지고기김치찌개", "미트볼조림", "다짐육두부볶음", "고기완자전"],
  "계란": ["계란장조림", "토마토계란볶음", "계란파국", "계란감자전"],
  "두부": ["두부된장국", "두부스테이크", "두부계란전"],
  "팽이버섯": ["팽이버섯국", "팽이굴소스볶음", "팽이버섯튀김"],
  "소고기 불고기용": ["소고기미역국", "소고기장조림", "소고기버섯볶음", "소고기숙주볶음"],
  "냉동 생선살": ["생선매운탕", "생선완자국", "생선강정"],
  "햄/소시지": ["햄김치볶음", "소시지감자볶음", "햄계란말이"],
  "감자/고구마": ["감자국", "감자채전", "알감자버터구이", "고구마전"],
  "어묵": ["어묵야채볶음", "매운어묵조림", "어묵계란탕"],
  "무": ["뭇국", "무나물볶음", "무피클"],
  "콩나물": ["콩나물냉국", "콩나물파무침", "콩나물잡채"],
  "파프리카": ["파프리카계란볶음", "파프리카멸치볶음", "파프리카무침"],
  "양배추": ["양배추된장국", "양배추볶음", "양배추참치볶음"],
  "브로콜리": ["브로콜리된장국", "브로콜리달걀볶음", "브로콜리초무침"],
  "오이": ["오이냉국", "오이볶음", "오이부추무침"],
};
Object.entries(EXTRA_MENUS).forEach(([k, arr]) => {
  if (MAIN[k]) MAIN[k] = [...MAIN[k], ...arr];
  else if (SIDE[k]) SIDE[k] = [...SIDE[k], ...arr];
});

// 추가 메뉴 3줄 레시피 + 매번 다른 밥을 위한 잡곡밥 종류
Object.assign(RECIPES, {
  "닭갈비": [["손질", "닭 + 고추장양념 재우기"], ["볶기", "양배추·떡 넣고 볶기"], ["마무리", "깻잎·치즈 솔솔"]],
  "닭미역국": [["불리기", "미역 불려 헹구기"], ["볶기", "닭살·미역 참기름에"], ["끓이기", "물 붓고 푹"]],
  "데리야키치킨": [["굽기", "닭 노릇하게 굽기"], ["소스", "간장·물엿·맛술"], ["조리기", "윤기나게 졸이기"]],
  "닭가슴살냉채": [["삶기", "닭가슴살 삶아 찢기"], ["채썰기", "오이·양배추"], ["무치기", "겨자소스에"]],
  "돼지고기김치찌개": [["볶기", "고기·김치 볶기"], ["끓이기", "물·두부 넣고"], ["간", "국간장·파"]],
  "미트볼조림": [["반죽", "다짐육 동글동글"], ["굽기", "겉면 지지기"], ["조리기", "케첩·간장소스에"]],
  "다짐육두부볶음": [["으깨기", "두부 으깨 물기 빼기"], ["볶기", "고기와 함께"], ["양념", "굴소스·마늘"]],
  "고기완자전": [["반죽", "다짐육·두부·계란"], ["빚기", "납작하게"], ["굽기", "노릇하게 부치기"]],
  "계란장조림": [["삶기", "계란 삶아 까기"], ["양념", "간장·물·설탕"], ["조리기", "자작하게 졸이기"]],
  "토마토계란볶음": [["볶기", "계란 먼저 스크램블"], ["넣기", "토마토 넣고"], ["간", "소금·설탕 약간"]],
  "계란파국": [["끓이기", "멸치육수에 대파"], ["풀기", "계란 풀어 휘휘"], ["간", "소금·후추"]],
  "계란감자전": [["채썰기", "감자 곱게"], ["반죽", "계란·소금 섞기"], ["굽기", "노릇하게"]],
  "두부된장국": [["끓이기", "멸치육수 끓이기"], ["풀기", "된장 풀기"], ["넣기", "두부·애호박·파"]],
  "두부스테이크": [["으깨기", "두부 물기 꼭"], ["반죽", "다진채소·계란 섞기"], ["굽기", "겉바속촉 굽기"]],
  "두부계란전": [["썰기", "두부 도톰하게"], ["옷", "계란물 입히기"], ["굽기", "노릇하게"]],
  "팽이버섯국": [["끓이기", "멸치육수에"], ["넣기", "팽이·두부"], ["간", "국간장·파"]],
  "팽이굴소스볶음": [["손질", "팽이 가닥내기"], ["볶기", "마늘·기름에"], ["양념", "굴소스 살짝"]],
  "팽이버섯튀김": [["반죽", "튀김가루·물"], ["입히기", "팽이에 옷"], ["튀기기", "바삭하게"]],
  "소고기미역국": [["볶기", "소고기·미역 참기름"], ["끓이기", "물 붓고 푹"], ["간", "국간장"]],
  "소고기장조림": [["삶기", "소고기 결대로 찢기"], ["양념", "간장·마늘·꽈리고추"], ["조리기", "졸이기"]],
  "소고기버섯볶음": [["썰기", "소고기·버섯"], ["볶기", "센불에 빠르게"], ["양념", "간장·마늘"]],
  "소고기숙주볶음": [["볶기", "소고기 먼저"], ["넣기", "숙주 넣고 살짝"], ["양념", "간장·참기름"]],
  "생선매운탕": [["육수", "무·다시마 끓이기"], ["넣기", "생선·고춧가루"], ["마무리", "쑥갓·파"]],
  "생선완자국": [["반죽", "생선살 다져 완자"], ["끓이기", "맑은 육수에"], ["간", "소금·파"]],
  "생선강정": [["튀기기", "생선 노릇하게"], ["소스", "고추장·물엿"], ["버무리기", "바삭할 때"]],
  "햄김치볶음": [["볶기", "김치 볶다가"], ["넣기", "햄 넣고"], ["간", "설탕·참기름"]],
  "소시지감자볶음": [["썰기", "감자·소시지"], ["볶기", "기름에 익히기"], ["양념", "케첩·소금"]],
  "햄계란말이": [["풀기", "계란+다진햄"], ["굽기", "약불에 얇게"], ["말기", "도르르 말기"]],
  "감자국": [["볶기", "감자·양파 살짝"], ["끓이기", "멸치육수 붓고"], ["간", "국간장·파"]],
  "감자채전": [["채썰기", "감자 곱게 헹구기"], ["반죽", "전분·소금"], ["굽기", "바삭하게"]],
  "알감자버터구이": [["삶기", "알감자 삶기"], ["굽기", "버터에 굴리기"], ["마무리", "소금·파슬리"]],
  "고구마전": [["채썰기", "고구마 곱게"], ["반죽", "튀김가루·물"], ["굽기", "노릇하게"]],
  "어묵야채볶음": [["썰기", "어묵·당근·양파"], ["볶기", "기름에 볶기"], ["양념", "간장·물엿"]],
  "매운어묵조림": [["썰기", "어묵 썰기"], ["양념", "고추장·간장"], ["조리기", "자작하게"]],
  "어묵계란탕": [["끓이기", "멸치육수에 어묵"], ["풀기", "계란 풀기"], ["간", "소금·파"]],
  "뭇국": [["볶기", "무 채썰어 참기름"], ["끓이기", "물 붓고 푹"], ["간", "소금·다진마늘"]],
  "무나물볶음": [["채썰기", "무 곱게"], ["볶기", "들기름에 천천히"], ["간", "소금·깨"]],
  "무피클": [["썰기", "무 깍둑"], ["절임물", "식초·설탕·물"], ["숙성", "하루 두기"]],
  "콩나물냉국": [["데치기", "콩나물 살짝"], ["냉국물", "식초·간장·물"], ["담기", "얼음 동동"]],
  "콩나물파무침": [["데치기", "콩나물 삶기"], ["무치기", "파·고춧가루"], ["마무리", "참기름·깨"]],
  "콩나물잡채": [["볶기", "콩나물·당근"], ["넣기", "간장·설탕"], ["마무리", "참기름"]],
  "파프리카계란볶음": [["썰기", "파프리카 채"], ["볶기", "계란과 함께"], ["간", "소금·후추"]],
  "파프리카멸치볶음": [["볶기", "멸치 기름에"], ["넣기", "파프리카"], ["양념", "간장·물엿"]],
  "파프리카무침": [["썰기", "파프리카 채"], ["무치기", "초고추장"], ["마무리", "깨 솔솔"]],
  "양배추된장국": [["끓이기", "멸치육수"], ["풀기", "된장 풀기"], ["넣기", "양배추·두부"]],
  "양배추볶음": [["썰기", "양배추 큼직"], ["볶기", "기름에 숨죽이기"], ["간", "소금·마늘"]],
  "양배추참치볶음": [["볶기", "양배추 볶다"], ["넣기", "참치 넣고"], ["간", "간장·후추"]],
  "브로콜리된장국": [["데치기", "브로콜리 살짝"], ["끓이기", "된장 육수에"], ["넣기", "두부·파"]],
  "브로콜리달걀볶음": [["데치기", "브로콜리 데치기"], ["볶기", "계란과 볶기"], ["간", "소금·마늘"]],
  "브로콜리초무침": [["데치기", "브로콜리 데치기"], ["무치기", "초고추장"], ["마무리", "깨"]],
  "오이냉국": [["썰기", "오이 채썰기"], ["냉국물", "식초·설탕·간장"], ["담기", "얼음 넣기"]],
  "오이볶음": [["썰기", "오이 반달"], ["절이기", "소금 살짝"], ["볶기", "센불에 빠르게"]],
  "오이부추무침": [["썰기", "오이·부추"], ["무치기", "고춧가루·액젓"], ["마무리", "참기름"]],
  "흰쌀밥": [["씻기", "쌀 헹구기"], ["불리기", "20분"], ["짓기", "물 맞춰 짓기"]],
  "현미밥": [["씻기", "현미 박박"], ["불리기", "충분히 불리기"], ["짓기", "압력밥솥에"]],
  "보리밥": [["씻기", "보리·쌀 헹구기"], ["섞기", "함께 안치기"], ["짓기", "밥 짓기"]],
  "귀리밥": [["씻기", "귀리·쌀 헹구기"], ["섞기", "비율 맞춰"], ["짓기", "밥 짓기"]],
  "흑미밥": [["씻기", "흑미 조금 섞기"], ["불리기", "30분"], ["짓기", "밥 짓기"]],
  "수수밥": [["씻기", "수수·쌀 헹구기"], ["섞기", "함께 안치기"], ["짓기", "밥 짓기"]],
});

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

// 별미(원플레이트) — 일주일에 1~2번 양념처럼 섞는 단품 요리
// shop: 냉장고에 보통 없어 "장보기 필요"로 표시될 재료
const SPECIALTIES = [
  { menu: "토마토 스파게티", emoji: "🍝", min: 20, servings: 2, level: "보통", need: ["스파게티면", "토마토소스", "마늘", "양파"], shop: ["스파게티면", "토마토소스"] },
  { menu: "크림 스파게티", emoji: "🍝", min: 20, servings: 2, level: "보통", need: ["스파게티면", "생크림", "마늘", "베이컨"], shop: ["스파게티면", "생크림"] },
  { menu: "돈까스", emoji: "🍱", min: 25, servings: 2, level: "보통", need: ["돈까스용 고기", "빵가루", "계란", "양배추"], shop: ["돈까스용 고기", "빵가루"] },
  { menu: "함박스테이크", emoji: "🍔", min: 30, servings: 2, level: "보통", need: ["다짐육", "양파", "빵가루", "데미그라스소스"], shop: ["데미그라스소스"] },
  { menu: "카레라이스", emoji: "🍛", min: 25, servings: 2, level: "쉬움", need: ["카레가루", "감자", "당근", "양파"], shop: ["카레가루"] },
  { menu: "김치볶음밥", emoji: "🍚", min: 15, servings: 2, level: "쉬움", need: ["김치", "밥", "계란", "참기름"], shop: [] },
  { menu: "오므라이스", emoji: "🍳", min: 20, servings: 2, level: "보통", need: ["계란", "밥", "케첩", "양파"], shop: ["케첩"] },
  { menu: "잡채", emoji: "🍜", min: 35, servings: 2, level: "보통", need: ["당면", "시금치", "당근", "양파"], shop: ["당면"] },
  { menu: "비빔국수", emoji: "🍜", min: 15, servings: 2, level: "쉬움", need: ["소면", "고추장", "오이", "계란"], shop: ["소면"] },
  { menu: "떡볶이", emoji: "🌶️", min: 20, servings: 2, level: "쉬움", need: ["떡볶이떡", "어묵", "고추장", "대파"], shop: ["떡볶이떡"] },
];
const SPECIALTY_MAP = Object.fromEntries(SPECIALTIES.map((s) => [s.menu, s]));
const SPECIALTY_MENUS = new Set(SPECIALTIES.map((s) => s.menu));

// 메뉴 → 시간/인분/난이도 (접미사 기반, 결정적)
const getMeta = (menu) => {
  const sp = SPECIALTY_MAP[menu];
  if (sp) return { min: sp.min, servings: sp.servings, level: sp.level };
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

// 이번 달 제철 재료 (한국 기준) — 정확한 표는 추후 채움. key는 1~12월.
const SEASONAL = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
  8: [],
  9: [],
  10: [],
  11: [],
  12: [],
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
// 외식 요일 우선순위 (가운데/주말부터 자연스럽게 비움)
const REST_PRIORITY = ["수", "토", "금", "일", "목", "화", "월"];

// 하단 탭 — 식단표 중심
const TABS = [
  { key: "plan", label: "식단표", icon: CalendarDays },
  { key: "menu", label: "추천메뉴", icon: Sparkles },
];
const TAB_SUBTITLE = {
  plan: "재료 안 버리게 짠 이번 주 식단표",
  menu: "냉장고 재료로 만들 수 있는 메뉴",
};

/* ------------------------------------------------------------------ *
 *  식단표 생성 로직 (1순위 = 재료 안 버리기)
 * ------------------------------------------------------------------ */

// 메뉴 조리법 카테고리 (연달아 비슷한 메뉴 방지용)
const menuCat = (menu) => {
  if (/찌개|곰탕|국|탕/.test(menu)) return "soup";
  if (/볶음|볶기/.test(menu)) return "stirfry";
  if (/조림/.test(menu)) return "braise";
  if (/찜/.test(menu)) return "steam";
  if (/구이/.test(menu)) return "grill";
  if (/전|동그랑땡|너겟|까스/.test(menu)) return "fry";
  if (/무침|생채|샐러드/.test(menu)) return "salad";
  if (/밥|덮밥/.test(menu)) return "rice";
  if (/말이|스크램블/.test(menu)) return "egg";
  return "etc";
};

// 메뉴 역할 분류: 밥 / 국 / 메인 / 반찬
// 단백질 중심의 "메인" 요리 (패턴으로 잘 안 잡히는 것 명시)
const MAIN_DISHES = new Set([
  "닭볶음탕", "간장찜닭", "치킨너겟", "닭갈비", "데리야키치킨",
  "제육볶음", "동그랑땡", "마파두부", "미트볼조림", "다짐육두부볶음",
  "소불고기", "소고기볶음", "소고기버섯볶음", "소고기숙주볶음",
  "생선까스", "생선구이", "생선전", "생선조림", "생선강정",
  "두부김치", "두부스테이크",
  "소시지야채볶음", "소시지구이", "햄전", "햄김치볶음",
]);
const menuRole = (menu) => {
  if (SPECIALTY_MENUS.has(menu)) return "별미";
  if (MAIN_DISHES.has(menu)) return "메인";
  if (/밥/.test(menu)) return "밥"; // 콩나물밥, 덮밥, 볶음밥
  if (/찌개|곰탕|된장/.test(menu)) return "국";
  if (/국/.test(menu)) return "국";
  if (/탕/.test(menu) && !/맛탕|볶음탕/.test(menu)) return "국"; // 어묵탕 등 (맛탕·볶음탕 제외)
  return "반찬"; // 무침·볶음·조림·전·샐러드·부침·쌈·맛탕 등
};

// 역할별로, 재료를 라운드로빈으로 엮어 골고루(주 2~3회) 돌려쓰는 시퀀스
const buildRoleSequence = (selected, role, offset = 0) => {
  const perIng = selected
    .map((name) => {
      const all = [...(MAIN[name] || []), ...(SIDE[name] || [])];
      return { name, menus: all.filter((m) => menuRole(m) === role) };
    })
    .filter((g) => g.menus.length);
  if (!perIng.length) return [];
  const seq = [];
  const maxLen = Math.max(...perIng.map((g) => g.menus.length));
  for (let r = 0; r < maxLen; r++) {
    perIng.forEach((g) => {
      if (r < g.menus.length) seq.push({ menu: g.menus[r], from: g.name });
    });
  }
  const k = seq.length ? offset % seq.length : 0;
  return seq.slice(k).concat(seq.slice(0, k));
};

// 한 끼 = 한 상 구성 (저녁 풀세트, 아침 가볍게)
const MEAL_COMPOSITION = {
  "아침": { rice: true, soup: true, main: 0, side: 1, kimchi: true },
  "점심": { rice: true, soup: true, main: 1, side: 1, kimchi: true },
  "저녁": { rice: true, soup: true, main: 1, side: 2, kimchi: true },
};

// 기본 제공 (재료와 무관하게 늘 깔리는 것)
// 밥은 매번 다르게 — 잡곡밥만 반복되지 않도록 종류 풀
const RICE_POOL = ["잡곡밥", "흰쌀밥", "현미밥", "보리밥", "귀리밥", "흑미밥", "수수밥"];
const DEFAULT_KIMCHI = { menu: "배추김치", from: "기본" };

// 역할 태그 색
const ROLE_STYLE = {
  "밥": { bg: "#F4E7CE", fg: "#9A7B33" },
  "국": { bg: "#EAF0DC", fg: "#5E7A41" },
  "메인": { bg: "#FCE4D7", fg: "#C2502F" },
  "반찬": { bg: "#F3ECE0", fg: "#9A8472" },
  "김치": { bg: "#FBD9CE", fg: "#C2502F" },
  "별미": { bg: "#EDE3F3", fg: "#7A5AA6" },
};

// 배열을 n칸 회전
const rotate = (arr, n) => {
  if (!arr.length) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
};

export default function RealHomeMeal() {
  const [selected, setSelected] = useState(["계란", "두부", "콩나물", "감자/고구마"]);
  const [meals, setMeals] = useState(["저녁"]); // 끼니 다중선택 (기본 저녁)
  const [diningOut, setDiningOut] = useState(2); // 외식 일수 (0~4)
  const [regen, setRegen] = useState(0); // 다시 짜기 카운터
  const [activeMenu, setActiveMenu] = useState(null); // 레시피 모달
  const [tab, setTab] = useState("plan"); // plan | menu
  const [sheetOpen, setSheetOpen] = useState(false); // 재료 바꾸기 시트
  const [customIngredients, setCustomIngredients] = useState([]); // 직접 추가 [{name, cat}]
  const reducedMotion = useReducedMotion();

  // ESC로 모달 닫기
  useEffect(() => {
    if (!activeMenu) return;
    const onKey = (e) => e.key === "Escape" && setActiveMenu(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeMenu]);

  const toggleIngredient = (name) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

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

  // 일주일 식단표 생성 — 한 상 차림 (재료 안 버리기 1순위)
  const weekPlan = useMemo(() => {
    // 외식 일수만큼 칸 비우기 (분산 배치, 다시 짜기 시 회전)
    const restDays = new Set(rotate(REST_PRIORITY, regen).slice(0, Math.min(diningOut, 7)));

    // 역할별 재료 순환 시퀀스 + 포인터
    const seqs = {
      "국": buildRoleSequence(selected, "국", regen),
      "메인": buildRoleSequence(selected, "메인", regen),
      "반찬": buildRoleSequence(selected, "반찬", regen),
    };
    const ptr = { "국": 0, "메인": 0, "반찬": 0 };

    // ⭐ 같은 메뉴는 일주일 전체에서 최대 1번 (전역 중복 방지)
    const usedMenus = new Set();

    // 직전 칸과 비슷한 국 안 나오게 (변화용)
    let lastSoupCat = null;

    // role 시퀀스에서 "아직 안 쓴" 후보 뽑기 — 없으면 null (중복보다 빈 게 나아)
    const pick = (role, { avoidCat } = {}) => {
      const seq = seqs[role];
      if (!seq || !seq.length) return null;
      let relaxed = null; // avoidCat만 걸린, 안 쓴 후보 (차선)
      for (let t = 0; t < seq.length; t++) {
        const cand = seq[(ptr[role] + t) % seq.length];
        if (usedMenus.has(cand.menu)) continue;
        if (avoidCat && menuCat(cand.menu) === avoidCat) {
          if (!relaxed) relaxed = { cand, t };
          continue;
        }
        ptr[role] = (ptr[role] + t + 1) % seq.length;
        usedMenus.add(cand.menu);
        return cand;
      }
      if (relaxed) {
        ptr[role] = (ptr[role] + relaxed.t + 1) % seq.length;
        usedMenus.add(relaxed.cand.menu);
        return relaxed.cand;
      }
      return null; // 풀 소진 → 빈 칸
    };

    // 밥 — 매 끼니 다른 종류 (잡곡밥만 반복 X)
    const riceList = rotate([...RICE_POOL, ...buildRoleSequence(selected, "밥", regen).map((r) => r.menu)], regen);
    let ricePtr = 0;
    const pickRice = () => {
      for (let t = 0; t < riceList.length; t++) {
        const menu = riceList[(ricePtr + t) % riceList.length];
        if (!usedMenus.has(menu)) {
          ricePtr = (ricePtr + t + 1) % riceList.length;
          usedMenus.add(menu);
          return { menu, from: "밥" };
        }
      }
      // 다 썼으면 밥은 반복 허용 (밥은 매 끼니 필요)
      const menu = riceList[ricePtr % riceList.length];
      ricePtr++;
      return { menu, from: "밥" };
    };

    // 별미(원플레이트) — 주 1~2회, 집밥 날 중 분산 배치 (외식 day와 안 겹침)
    const cookingList = DAYS.filter((d) => !restDays.has(d));
    const specialtyCount = cookingList.length >= 5 ? 2 : cookingList.length >= 2 ? 1 : 0;
    const specialtyDays = new Set();
    for (let i = 0; i < specialtyCount; i++) {
      let idx = Math.round(((i + 0.5) / specialtyCount) * cookingList.length - 0.5);
      idx = (((idx + regen) % cookingList.length) + cookingList.length) % cookingList.length;
      specialtyDays.add(cookingList[idx]);
    }
    const specialtySeq = rotate(SPECIALTIES, regen);
    let spPtr = 0;
    // 별미로 대체할 끼니 (저녁 우선, 없으면 마지막 끼니)
    const primaryMeal = orderedMeals.includes("저녁") ? "저녁" : orderedMeals[orderedMeals.length - 1];

    const plan = DAYS.map((day) => {
      if (restDays.has(day)) return { day, rest: true };
      const isSpecialtyDay = specialtyDays.has(day);
      const dayMeals = orderedMeals.map((m) => {
        // 별미 칸: 한 끼를 원플레이트 단품으로 대체 (국·반찬 없음)
        if (isSpecialtyDay && m === primaryMeal && specialtySeq.length) {
          const sp = specialtySeq[spPtr % specialtySeq.length];
          spPtr++;
          return {
            meal: m,
            special: true,
            items: [{ role: "별미", menu: sp.menu, from: "별미", emoji: sp.emoji, shop: sp.shop }],
          };
        }
        const comp = MEAL_COMPOSITION[m];
        const items = [];

        // 밥 — 매 끼니 다른 종류
        if (comp.rice) items.push({ role: "밥", ...pickRice() });
        // 국·찌개 — 안 쓴 것 중 직전과 다른 카테고리 우선
        if (comp.soup) {
          const s = pick("국", { avoidCat: lastSoupCat });
          if (s) {
            lastSoupCat = menuCat(s.menu);
            items.push({ role: "국", ...s });
          }
        }
        // 메인 — 안 쓴 것 (없으면 생략)
        if (comp.main) {
          const mn = pick("메인");
          if (mn) items.push({ role: "메인", ...mn });
        }
        // 반찬 — 안 쓴 것으로 N개 (모자라면 적게, 중복 X)
        for (let i = 0; i < comp.side; i++) {
          const sd = pick("반찬");
          if (sd) items.push({ role: "반찬", ...sd });
        }
        // 김치 — 기본 표시
        if (comp.kimchi) items.push({ role: "김치", ...DEFAULT_KIMCHI });

        return { meal: m, items };
      });
      return { day, rest: false, meals: dayMeals };
    });
    return plan;
  }, [selected, meals, diningOut, regen]); // eslint-disable-line react-hooks/exhaustive-deps

  const cookingDays = weekPlan.filter((d) => !d.rest).length;


  const copyList = () => {
    if (!selected.length) {
      alert("먼저 재료를 담아주세요 🧺");
      return;
    }
    const lines = selected.map((n, i) => `${i + 1}. ${n}`).join("\n");
    alert(
      `🛒 쿠팡 장바구니 리스트 (복사 완료!)\n\n${lines}\n\n` +
        `🍳 집밥 ${cookingDays}일 · 외식 ${diningOut}일\n` +
        `🥄 끼니: ${orderedMeals.join("·")}\n\n` +
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
          {tab === "plan" && (
            <div className="space-y-4">
              {/* 상단 컨트롤 바 */}
              <PlanControls
                ingredientCount={selected.length}
                meals={meals}
                onToggleMeal={toggleMeal}
                diningOut={diningOut}
                setDiningOut={setDiningOut}
                onOpenSheet={() => setSheetOpen(true)}
                onRegen={() => setRegen((r) => r + 1)}
              />

              {/* 식단표 */}
              <Card>
                <div className="flex items-center justify-between">
                  <SectionTitle icon={<CalendarDays size={16} />} label="이번 주 식단표" noMargin />
                  <span className="text-[12px]" style={{ color: C.sub }}>
                    집밥 {cookingDays}일 · 외식 {diningOut}일
                  </span>
                </div>
                {/* 가로 스크롤 식단 카드 */}
                <div
                  className="-mx-6 mt-4 flex snap-x gap-3 overflow-x-auto px-6 pb-2 sm:-mx-7 sm:px-7"
                  style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
                >
                  {weekPlan.map((d) => (
                    <MealCard key={d.day} day={d} onOpen={setActiveMenu} />
                  ))}
                </div>
                <p className="mt-1 text-center text-[11px]" style={{ color: C.sub }}>
                  ← 좌우로 밀어서 일주일 보기 →
                </p>
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
                    <Empty text="아직 담은 재료가 없어요. ‘재료 바꾸기’로 재료를 담아주세요." />
                    <button
                      onClick={() => setSheetOpen(true)}
                      className="mt-3 w-full rounded-2xl py-3 text-[14px] font-semibold"
                      style={{ background: C.goldSoft, color: C.gold }}
                    >
                      재료 담으러 가기
                    </button>
                  </div>
                )}
              </Card>
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

// 상단 컨트롤 바 — 재료 바꾸기 / 끼니 / 외식 횟수 / 다시 짜기
function PlanControls({ ingredientCount, meals, onToggleMeal, diningOut, setDiningOut, onOpenSheet, onRegen }) {
  return (
    <section
      className="space-y-3 rounded-3xl p-4"
      style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: "0 18px 50px -36px rgba(58,42,32,0.28)" }}
    >
      {/* 재료 바꾸기 + 다시 짜기 */}
      <div className="flex gap-2">
        <button
          onClick={onOpenSheet}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-3 text-[14px] font-bold"
          style={{ background: C.goldSoft, color: C.gold, border: `1px solid ${C.gold}55` }}
        >
          🧺 재료 바꾸기
          <span
            className="rounded-full px-1.5 text-[11px] font-bold"
            style={{ background: C.gold, color: "#fff" }}
          >
            {ingredientCount}
          </span>
        </button>
        <button
          onClick={onRegen}
          className="flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-[14px] font-bold"
          style={{ background: C.ink, color: "#fff" }}
        >
          <RefreshCw size={15} strokeWidth={2.4} /> 다시 짜기
        </button>
      </div>

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

      {/* 외식 횟수 (0~4) */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-semibold" style={{ color: C.sub }}>외식 횟수</p>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((n) => {
            const on = diningOut === n;
            return (
              <button
                key={n}
                onClick={() => setDiningOut(n)}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all"
                style={{
                  background: on ? C.sage : "#fff",
                  color: on ? "#fff" : C.ink,
                  border: `1px solid ${on ? C.sage : C.line}`,
                  boxShadow: on ? "0 8px 18px -12px rgba(110,139,79,0.9)" : "none",
                }}
              >
                {n}회
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// 가로 스크롤 식단 카드 (요일 1장 = 그날의 끼니들)
function MealCard({ day, onOpen }) {
  const COL = "w-[158px] shrink-0 snap-start overflow-hidden rounded-2xl flex flex-col";

  // 외식 day
  if (day.rest) {
    return (
      <div className={COL} style={{ background: C.sageSoft, border: `1px solid ${C.sage}33` }}>
        <div className="px-3 py-2.5 text-center" style={{ borderBottom: `1px solid ${C.sage}33` }}>
          <div className="text-[15px] font-bold" style={{ color: C.sage }}>{day.day}</div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-3 py-6 text-center">
          <Coffee size={22} strokeWidth={2} style={{ color: C.sage }} />
          <span className="text-[13px] font-bold" style={{ color: C.sage }}>외식 day ☕</span>
        </div>
      </div>
    );
  }

  return (
    <div className={COL} style={{ background: "#fff", border: `1px solid ${C.line}` }}>
      {/* 요일 */}
      <div className="px-3 py-2 text-center" style={{ borderBottom: `1px solid ${C.line}`, background: "#FBF4EA" }}>
        <div className="text-[15px] font-bold" style={{ color: C.ink }}>{day.day}</div>
      </div>

      {/* 끼니별 한 상 */}
      <div className="flex-1">
        {day.meals.map((m, mi) => {
          const s = MEAL_STYLE[m.meal];

          // 별미(원플레이트)
          if (m.special) {
            const sp = m.items[0];
            const meta = getMeta(sp.menu);
            const bv = ROLE_STYLE["별미"];
            return (
              <button
                key={m.meal}
                onClick={() => onOpen(sp.menu)}
                className="block w-full px-3 py-3 text-center transition-colors"
                style={{ borderTop: mi === 0 ? "none" : `1px solid ${C.line}`, background: bv.bg + "55" }}
              >
                <div className="text-[10.5px] font-bold" style={{ color: bv.fg }}>
                  {s.icon} {m.meal} · 별미 {sp.emoji}
                </div>
                <div className="mt-1.5 text-[28px] leading-none">{sp.emoji}</div>
                <div className="mt-1 text-[14px] font-bold" style={{ color: C.ink }}>{sp.menu}</div>
                <div className="mt-0.5 text-[10px]" style={{ color: C.sub }}>⏱ {meta.min}분</div>
                {sp.shop && sp.shop.length > 0 && (
                  <div className="mt-0.5 text-[10px] leading-tight" style={{ color: bv.fg }}>
                    🛒 {sp.shop.join(", ")}
                  </div>
                )}
              </button>
            );
          }

          // 한식 한 상 — 메뉴명만 세로로 (라벨 없이)
          const mins = m.items.map((it) => getMeta(it.menu).min);
          const totalMin = mins.length ? Math.max(...mins) + (m.items.length - 1) * 3 : 0;
          return (
            <div key={m.meal} style={{ borderTop: mi === 0 ? "none" : `1px solid ${C.line}` }}>
              <div className="px-3 pt-2 text-center text-[11px]" style={{ color: s.fg }}>
                {s.icon} {m.meal}
                {totalMin > 0 && <span style={{ color: C.sub }}> · ⏱ {totalMin}분</span>}
              </div>
              {m.items.length ? (
                <div className="px-2 py-1.5">
                  {m.items.map((it, i) => (
                    <button
                      key={it.role + i}
                      onClick={() => onOpen(it.menu)}
                      className="block w-full rounded-lg px-2 py-1.5 text-center text-[13.5px] font-medium transition-colors"
                      style={{ color: C.ink, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.ink)}
                    >
                      {it.menu}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-4 text-center text-[12px] font-medium" style={{ color: C.sub }}>
                  재료를 더 담아주세요
                </div>
              )}
            </div>
          );
        })}
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
  const [cat, setCat] = useState(INGREDIENT_CATEGORIES[0].key);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const active = INGREDIENT_CATEGORIES.find((c) => c.key === cat) || INGREDIENT_CATEGORIES[0];
  const customForCat = custom.filter((c) => c.cat === active.key);

  // 이번 달 제철 재료 (getMonth()는 0~11 → SEASONAL 키는 1~12)
  const month = new Date().getMonth() + 1;
  const seasonal = SEASONAL[month] || [];

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
        <div className="flex items-center justify-between px-5 pb-1 pt-2">
          <div>
            <h3 className="text-[15px] font-bold tracking-tight" style={{ color: C.ink }}>
              🧺 재료 바꾸기
            </h3>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
              톡 누르면 담기고, 다시 누르면 빠져요
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "#fff", border: `1px solid ${C.line}`, color: C.sub }}
          >
            <X size={16} strokeWidth={2.6} />
          </button>
        </div>

        {/* 🌱 이번 달 제철 재료 */}
        {seasonal.length > 0 && (
          <div className="px-5 pb-3 pt-1">
            <p className="mb-2 text-[12.5px] font-bold" style={{ color: C.sage }}>
              🌱 이번 달 제철 재료 ({month}월)
            </p>
            <ChipGroup keys={seasonal} selected={selected} onToggle={onToggle} accent={C.sage} softBg={C.sageSoft} />
          </div>
        )}

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

        {/* 재료 그리드 + 직접 추가 */}
        <div className="overflow-y-auto px-5 pb-8 pt-1">
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
  const sp = SPECIALTY_MAP[menu]; // 별미면 필요 재료 표시
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
