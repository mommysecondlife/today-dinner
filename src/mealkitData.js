// ============================================
// 밀키트/간편식 데이터
// "요리하기 싫은 날"을 위한 냉동실 밀키트 목록
// 카테고리(일반명사) + 대표 예시(브랜드는 참고용)
// 출처: SNS 방학맘 밀키트 추천 리스트 기반 인기순
// ============================================

export const MEALKIT_CATEGORIES = [
  {
    category: "갈비탕·곰탕",
    emoji: "🍲",
    desc: "끓이기만 하면 든든한 한 상",
    items: [
      { name: "갈비탕", examples: "사미헌, 조선호텔 등" },
      { name: "곰탕·설농탕", examples: "나주곰탕, 거대곰탕 등" },
      { name: "갈비찜", examples: "코스트코 등" },
      { name: "삼계탕", examples: "조선호텔, 평양옥 등" },
    ],
  },
  {
    category: "떡갈비·고기",
    emoji: "🥩",
    desc: "에어프라이어에 데우면 끝",
    items: [
      { name: "떡갈비", examples: "조선호텔, 피코크 등" },
      { name: "불고기", examples: "컬리, 코스트코 등" },
      { name: "LA갈비", examples: "모들식탁 등" },
      { name: "양념목살·삼겹", examples: "숭의가든, 컬리 대패목살 등" },
    ],
  },
  {
    category: "떡볶이",
    emoji: "🌶️",
    desc: "방학 간식 1순위",
    items: [
      { name: "떡볶이", examples: "미미네, 컬리, 오마뎅 등" },
      { name: "로제떡볶이", examples: "라비퀸, 서울마님 등" },
      { name: "짜장떡볶이", examples: "오마뎅, 똑이네 등" },
      { name: "춘천닭갈비떡볶이", examples: "올마레 등" },
    ],
  },
  {
    category: "만두",
    emoji: "🥟",
    desc: "국·찜·구이 다 되는 만능",
    items: [
      { name: "물만두", examples: "비비고, 오아시스 등" },
      { name: "왕만두·교자", examples: "노브랜드, 한만두 등" },
      { name: "갈비만두", examples: "노브랜드, 담두 등" },
      { name: "샤오롱바오", examples: "노브랜드 등" },
    ],
  },
  {
    category: "돈까스·튀김",
    emoji: "🍤",
    desc: "아이들 최애",
    items: [
      { name: "치즈돈까스", examples: "컬리, KF365 등" },
      { name: "미니돈까스", examples: "컬리, KF365 등" },
      { name: "생선까스·새우까스", examples: "가시제거연구소 등" },
      { name: "치킨텐더·너겟", examples: "하림, 오아시스 등" },
    ],
  },
  {
    category: "국·탕·찌개",
    emoji: "🥘",
    desc: "데우면 바로 국 한 그릇",
    items: [
      { name: "부대찌개", examples: "송탄최네집, 놀부 등" },
      { name: "마라탕", examples: "쿠팡 프로즌, 프로즌원팩 등" },
      { name: "순대국밥·돼지국밥", examples: "극소수, 대건명가 등" },
      { name: "육개장", examples: "금강만두, 장순필 등" },
      { name: "김치찌개", examples: "오모가리, 카우스토리 등" },
    ],
  },
  {
    category: "면·국수",
    emoji: "🍜",
    desc: "후루룩 한 끼",
    items: [
      { name: "칼국수", examples: "공항칼국수, 컬리 베테랑 등" },
      { name: "막국수·냉면", examples: "봉피양 평양냉면, 풍국면 등" },
      { name: "쌀국수", examples: "에머이, 마이하노이 등" },
      { name: "우동", examples: "휴게소우동, 정호영 카덴 등" },
    ],
  },
  {
    category: "밥·볶음밥",
    emoji: "🍚",
    desc: "냉동실 비상식량",
    items: [
      { name: "볶음밥 세트", examples: "에슐리, 쿠팡 곰곰 등" },
      { name: "주먹밥", examples: "한끼통살, 햇반 시리즈 등" },
      { name: "곤드레나물밥", examples: "트레이더스 등" },
      { name: "유부초밥", examples: "풀무원, 롤유부김밥 등" },
    ],
  },
  {
    category: "쭈꾸미·해물",
    emoji: "🦑",
    desc: "매콤하게 입맛 살리기",
    items: [
      { name: "쭈꾸미", examples: "딩동, 장순필, 부탁해 등" },
      { name: "낙곱새", examples: "프로즌 원팩, 일상식탁 등" },
      { name: "고등어구이", examples: "쿠팡 곰곰, 오아시스 순살 등" },
    ],
  },
  {
    category: "양식",
    emoji: "🍝",
    desc: "가끔 별미로",
    items: [
      { name: "파스타", examples: "애슐리, 고메, 면사랑 등" },
      { name: "스테이크", examples: "쿠팡 최현석, 리틀넥 키트 등" },
      { name: "피자", examples: "닥터오트커, 코스트코 등" },
      { name: "그라탕·뇨끼", examples: "초이닷 등" },
    ],
  },
];

// 사용자가 등록한 밀키트는 localStorage에 저장 (selected와 별도)
// 식단 생성 시 "요리 안 하는 날"로 가끔 삽입 (외식 day와 유사하나, 밀키트명 표시)
