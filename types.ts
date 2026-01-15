export type UserRole = 'admin' | 'officer' | 'editor' | 'contributor' | 'member' | 'reader';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '관리자',
  officer: '임원',
  editor: '에디터',
  contributor: '콘트리뷰터',
  member: '정회원',
  reader: '독자',
};

export interface NavItem {
  label: string;
  path: string;
}

export interface BoardPost {
  id: number;
  title: string;
  author: string;
  date: string;
  category: '공지사항' | '자유게시판' | '행사뉴스' | '창작' | '생활정보';
  content?: string;
}

export interface Member {
  id: number;
  name: string;
  business?: string;
  phone: string;
  email?: string;
  address?: string; // 주소 필드 추가
  password?: string;
  role?: UserRole;
  photoUrl?: string;
  joinedClubs?: string[]; // 가입한 동아리 목록 (최대 3개)
  feePaidDate?: string;   // 회비 납부일자 (YYYY-MM-DD)
  createdAt?: string;
}

export interface Club {
  id: number;
  name: string;
  description?: string; // 한줄 소개
  leader?: string;      // 동아리 회장
  phone?: string;       // 연락처
  email?: string;       // 이메일
  schedule?: string;    // 정기 모임 일정
  location?: string;    // 모임 장소
  photoUrl?: string;    // 대표 이미지
  content?: string;     // 상세 소개 (HTML/Text)
}

export interface UsefulLink {
  id: number;
  title: string;
  url: string;
  description?: string;
  category?: string;
}

export interface ArchivedMember extends Member {
  deletedAt: string;
}

export interface OrganizationMember {
  role: string;
  name: string;
}

export interface MissionItem {
  title: string;
  desc: string;
}

export interface AboutData {
  president: {
    name: string;
    title: string;
    imageUrl: string;
    message: string;
  };
  missions: MissionItem[];
  organization: OrganizationMember[];
}

export interface ContactData {
  address: string;
  phone: string;
  email: string;
  mapImageUrl: string;
}

export interface HomeData {
  hero: {
    titlePrefix: string;
    titleHighlight: string;
    titleSuffix: string;
    description: string;
    bgImage: string;
  };
  shortcuts: {
    box1: { title: string; desc: string; };
    box2: { title: string; desc: string; };
    box3: { title: string; desc: string; };
    box4: { title: string; desc: string; };
  };
  newsletter: {
    title: string;
    description: string;
  };
}