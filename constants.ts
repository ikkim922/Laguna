import { NavItem, HomeData, Club, UsefulLink } from './types';

// Image Assets (From Phase 1 Plan)
export const IMAGES = {
  HERO_BG: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop", // Warm community gathering
  NEWS_THUMB_1: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=1000&auto=format&fit=crop", // Meeting
  NEWS_THUMB_2: "https://images.unsplash.com/photo-1511632765486-a01980968a0c?q=80&w=1000&auto=format&fit=crop", // Cultural/Festival
  NEWS_THUMB_3: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1000&auto=format&fit=crop", // Volunteers
  ABOUT_PRESIDENT: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop", // Elder portrait
  ABOUT_TEAM: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2000&auto=format&fit=crop", // Group
  CONTACT_MAP: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop", // Map placeholder
  BOARD_HEADER: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2000&auto=format&fit=crop", // Notes/Paper
  CLUB_HEADER: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2000&auto=format&fit=crop", // Social Group
  RESOURCES_HEADER: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2000&auto=format&fit=crop", // Laptop/Work
};

// Navigation Structure
export const NAV_ITEMS: NavItem[] = [
  { label: "홈", path: "/" },
  { label: "한인들 소개", path: "/about" },
  { label: "동아리 활동", path: "/clubs" },
  { label: "회원 명단/관리", path: "/members" },
  { label: "소식과 나눔", path: "/board" },
  { label: "문의하기", path: "/contact" },
];

export const INITIAL_HOME_DATA: HomeData = {
  hero: {
    titlePrefix: "따뜻한 정을 나누는",
    titleHighlight: "라구나 한인들",
    titleSuffix: "에 오신 것을 환영합니다",
    description: "서로 돕고 소통하며 함께 성장하는 커뮤니티입니다.\n지금 바로 회원으로 등록하세요.",
    bgImage: IMAGES.HERO_BG
  },
  shortcuts: {
    box1: { title: "회원 검색", desc: "함께하는 이웃을 찾아보세요." },
    box2: { title: "최신 소식", desc: "한인들의 새로운 소식을 전합니다." },
    box3: { title: "행사 일정", desc: "다양한 모임과 행사에 참여하세요." },
    box4: { title: "생활정보", desc: "유용한 웹사이트 모음" }
  },
  newsletter: {
    title: "한인들 소식 받기",
    description: "이메일 주소를 입력하시면 주요 행사와 공지사항을 보내드립니다."
  }
};

export const INITIAL_CLUBS: Club[] = [
  { 
    id: 1, 
    name: "골프 동호회", 
    description: "푸른 잔디 위에서 나누는 건강한 교류",
    leader: "박골프",
    phone: "010-1234-5678",
    email: "golf@example.com",
    schedule: "매월 셋째 주 토요일 오전 8시",
    location: "라구나 우즈 골프 코스",
    photoUrl: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000&auto=format&fit=crop",
    content: "골프를 사랑하는 회원들의 모임입니다. 초보자부터 상급자까지 누구나 환영합니다. 정기 라운딩과 월례회를 통해 친목을 다지고 있습니다."
  },
  { 
    id: 2, 
    name: "등산 클럽", 
    description: "자연과 함께하는 힐링 산행",
    leader: "이산행",
    phone: "010-2345-6789",
    schedule: "매주 토요일 오전 7시",
    location: "클럽하우스 3 주차장 집결",
    photoUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1000&auto=format&fit=crop",
    content: "라구나 인근의 아름다운 트레일을 함께 걷습니다. 건강도 챙기고 담소도 나누는 즐거운 산행에 함께하세요."
  },
  { 
    id: 3, 
    name: "탁구 교실", 
    description: "남녀노소 누구나 즐기는 탁구",
    leader: "최탁구",
    phone: "010-3456-7890",
    schedule: "매주 화/목 오후 2시",
    location: "커뮤니티 센터 다목적실",
    photoUrl: "https://images.unsplash.com/photo-1534158914592-062992bbe900?q=80&w=1000&auto=format&fit=crop",
    content: "실내에서 날씨 걱정 없이 운동하세요. 초보자를 위한 레슨도 준비되어 있습니다."
  },
  { 
    id: 4, 
    name: "라인 댄스", 
    description: "신나는 음악에 맞춰 춤추는 즐거움",
    leader: "김댄스",
    phone: "010-4567-8901",
    schedule: "매주 월/수 오전 10시",
    location: "클럽하우스 1 무도회장",
    photoUrl: "https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=1000&auto=format&fit=crop",
    content: "경쾌한 음악과 함께 라인 댄스를 배워보세요. 스트레스 해소와 체력 증진에 최고입니다."
  },
  { 
    id: 5, 
    name: "합창단", 
    description: "아름다운 화음으로 하나되는 우리",
    leader: "정지휘",
    phone: "010-5678-9012",
    schedule: "매주 금요일 오후 7시",
    location: "한인회 강당",
    photoUrl: "https://images.unsplash.com/photo-1525926477800-7a3be5802322?q=80&w=1000&auto=format&fit=crop",
    content: "음악을 사랑하는 분들이 모여 아름다운 하모니를 만듭니다. 정기 공연 및 지역 봉사 활동도 진행합니다."
  },
  { 
    id: 6, 
    name: "바둑/장기", 
    description: "수담을 나누며 깊어지는 우정",
    leader: "강기사",
    phone: "010-6789-0123",
    schedule: "매일 오후 1시 ~ 5시",
    location: "노인회관 사랑방",
    photoUrl: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=1000&auto=format&fit=crop",
    content: "바둑과 장기를 두며 세상 사는 이야기를 나눕니다. 급수에 상관없이 누구나 오셔서 즐기실 수 있습니다."
  }
];

export const INITIAL_USEFUL_LINKS: UsefulLink[] = [
  { 
    id: 1, 
    title: "주 로스앤젤레스 대한민국 총영사관", 
    url: "https://overseas.mofa.go.kr/us-losangeles-ko/index.do", 
    description: "여권 발급, 비자, 영사 확인 등 민원 안내",
    category: "공공기관"
  },
  { 
    id: 2, 
    title: "Laguna Woods Village", 
    url: "https://www.lagunawoodsvillage.com/", 
    description: "라구나 우즈 빌리지 공식 홈페이지 (주민 정보)",
    category: "지역정보"
  },
  { 
    id: 3, 
    title: "미주 중앙일보", 
    url: "https://news.koreadaily.com/", 
    description: "미주 한인 사회 소식 및 한국 뉴스",
    category: "언론/뉴스"
  },
  { 
    id: 4, 
    title: "AI 타임즈", 
    url: "https://www.aitimes.com/", 
    description: "인공지능(AI) 관련 최신 뉴스 및 트렌드",
    category: "IT/기술"
  }
];