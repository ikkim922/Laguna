
import { Member, BoardPost, AboutData, ContactData, UserRole, HomeData, Club, UsefulLink } from '../types';
import { IMAGES, INITIAL_HOME_DATA, INITIAL_CLUBS, INITIAL_USEFUL_LINKS } from '../constants';
import { supabase, isSupabaseConfigured } from '../supabase';

// ==============================================================================
// Hybrid Storage Service (Supabase Cloud -> LocalStorage Fallback)
// ==============================================================================

const COLLECTIONS = {
  MEMBERS: 'members',
  POSTS: 'posts',
  CONTENT: 'content',
  SUBSCRIBERS: 'subscribers',
  CLUBS: 'clubs',
  LINKS: 'useful_links',
};

const STORAGE_KEYS = {
  CURRENT_USER: 'laguna_portal_auth_user', 
  BACKUP_DATE: 'laguna_portal_last_backup_date',
};

// RELATIVE PATH for Vercel/Production deployment
const API_NOTIFY_URL = '/api/notify'; 
// LOCAL FALLBACK (if not on Vercel and server.js is running)
const LOCAL_API_URL = 'http://localhost:3001/api/email/notify-new-post';

// --- Helper Functions ---

const getLocalItem = <T>(key: string, defaultVal: T): T => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultVal;
};

const setLocalItem = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// --- Board Services ---

export const getPosts = async (): Promise<BoardPost[]> => {
  const localCache = getLocalItem<BoardPost[]>(COLLECTIONS.POSTS, []);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from(COLLECTIONS.POSTS)
        .select('*')
        .order('id', { ascending: false });
        
      if (error) {
        if (error.code === '42P01') {
          console.error("Supabase Error: 'posts' table not found.");
        }
        throw error;
      }
      
      if (data) {
        setLocalItem(COLLECTIONS.POSTS, data);
        return data as BoardPost[];
      }
    } catch (error) {
      console.warn("Supabase fetch failed, using local cache:", error);
    }
  }
  
  return localCache;
};

export const savePost = async (postData: BoardPost | Omit<BoardPost, 'id'>): Promise<BoardPost> => {
  const localPosts = getLocalItem<BoardPost[]>(COLLECTIONS.POSTS, []);
  const currentUser = getCurrentUser();
  
  const nextId = localPosts.length > 0 ? Math.max(...localPosts.map(p => p.id)) + 1 : 1;
  const optimisticPost = ('id' in postData) ? (postData as BoardPost) : { ...postData, id: nextId } as BoardPost;

  // 1. Update LocalStorage Immediately
  const updatedLocal = ('id' in postData && postData.id)
    ? localPosts.map(p => p.id === postData.id ? optimisticPost : p)
    : [optimisticPost, ...localPosts];
  setLocalItem(COLLECTIONS.POSTS, updatedLocal);

  // 2. Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      let finalPost: BoardPost | null = null;
      if ('id' in postData && postData.id) {
        const { error } = await supabase.from(COLLECTIONS.POSTS).update(postData).eq('id', postData.id);
        if (error) throw error;
        finalPost = optimisticPost;
      } else {
        const { data, error } = await supabase.from(COLLECTIONS.POSTS).insert(postData).select().single();
        if (error) throw error;
        if (data) finalPost = data as BoardPost;
      }

      // 3. Trigger Email Notification (Background)
      if (finalPost && !('id' in postData)) {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const targetUrl = isLocal ? LOCAL_API_URL : API_NOTIFY_URL;

        console.log(`[Notification] Triggering email via: ${targetUrl}`);
        
        fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: finalPost.title,
            author: finalPost.author,
            category: finalPost.category,
            author_email: currentUser?.email
          })
        }).then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error(`[Notification] Server Error (${res.status}):`, errorData.message || errorData.error || "Unknown server error");
          } else {
            const successData = await res.json();
            if (successData.isTest) {
              console.info("%c[Notification Success] 메일이 가상 수신함(Mailtrap)으로 전송되었습니다. 실제 메일함이 아닙니다.", "color: #3b82f6; font-weight: bold;");
            } else {
              console.log("[Notification Success] Email delivered to recipients.");
            }
          }
        }).catch(err => {
          if (err instanceof TypeError && err.message === 'Failed to fetch') {
            console.info("%c[Notification Info] API endpoint not reachable. If you are in local dev, make sure 'node backend/server.js' is running.", "color: orange;");
          } else {
            console.error("[Notification Critical Error]:", err);
          }
        });
      }

      if (finalPost && !('id' in postData)) {
        const finalLocal = [finalPost, ...localPosts.filter(p => p.id !== optimisticPost.id)];
        setLocalItem(COLLECTIONS.POSTS, finalLocal);
        return finalPost;
      }
    } catch (error: any) {
      console.error("Supabase Sync Failed:", error.message || error);
    }
  }

  return optimisticPost;
};

export const deletePost = async (id: number): Promise<void> => {
  const localPosts = getLocalItem<BoardPost[]>(COLLECTIONS.POSTS, []);
  setLocalItem(COLLECTIONS.POSTS, localPosts.filter(p => p.id !== id));

  if (isSupabaseConfigured && supabase) {
    try { 
      const { error } = await supabase.from(COLLECTIONS.POSTS).delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      console.error("Supabase Delete Sync Failed:", e.message || e);
    }
  }
};

// --- Auth Services ---

export const loginUser = async (email: string, pw: string): Promise<Member | null> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
          .from(COLLECTIONS.MEMBERS)
          .select('*')
          .eq('email', email)
          .eq('password', pw)
          .maybeSingle();
      if (!error && data) {
          const user = data as Member;
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
          return user;
      }
    } catch (e) { }
  }
  const members = getLocalItem<Member[]>(COLLECTIONS.MEMBERS, []);
  const user = members.find(m => m.email === email && m.password === pw);
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const getCurrentUser = (): Member | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return stored ? JSON.parse(stored) : null;
};

// --- Initial Data and Content Services ---

export const initializeDefaultData = async () => {
  const usersToInit = [{
    name: "김익현", password: "8831", role: "admin",
    business: "시스템 관리자", phone: "000-0000-0000",
    email: "ikkim922@gmail.com", address: "Laguna Woods, CA 92637"
  }];
  try {
    if (isSupabaseConfigured && supabase) {
      for (const user of usersToInit) {
        const { data } = await supabase.from(COLLECTIONS.MEMBERS).select('id').eq('email', user.email).maybeSingle();
        if (!data) await supabase.from(COLLECTIONS.MEMBERS).insert({ ...user, createdAt: new Date().toISOString() });
      }
    } 
  } catch (error) { }
};

const INITIAL_ABOUT_DATA: AboutData = {
  president: { name: "김철수 회장", title: "제 17대 라구나 한인들 회장", imageUrl: IMAGES.ABOUT_PRESIDENT, message: "안녕하세요,\n라구나 한인들 회장 김철수입니다.\n\n우리 커뮤니티는 서로 돕고 의지하며 살아가는 따뜻한 공동체입니다.\n언제나 여러분의 곁에서 함께하겠습니다." },
  missions: [ { title: "상호 협력", desc: "회원 간의 친목 도모와 정보 교류를 통해 서로 돕는 문화를 만듭니다." }, { title: "지역 봉사", desc: "라구나 지역 사회를 위한 다양한 봉사 활동을 기획하고 실천합니다." }, { title: "문화 계승", desc: "한인 2세, 3세들에게 우리의 자랑스러운 문화를 알리고 계승합니다." } ],
  organization: [ { role: "회장", name: "김철수" }, { role: "부회장", name: "이영희" }, { role: "총무", name: "박민수" } ]
};

const INITIAL_CONTACT_DATA: ContactData = { address: "3183 Alta Vista #C, \nLaguna woods, CA 92653", phone: "949-229-3315", email: "ikkim922@gmail.com", mapImageUrl: IMAGES.CONTACT_MAP };

const getContent = async <T>(key: string, defaultData: T): Promise<T> => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from(COLLECTIONS.CONTENT).select('data').eq('key', key).maybeSingle(); 
      if (!error && data) return data.data as T;
    } 
  } catch (e) { }
  const stored = localStorage.getItem(`${COLLECTIONS.CONTENT}_${key}`);
  return stored ? JSON.parse(stored) : defaultData;
};

const saveContent = async <T>(key: string, contentData: T): Promise<T> => {
  if (isSupabaseConfigured && supabase) {
    try { await supabase.from(COLLECTIONS.CONTENT).upsert({ key, data: contentData }); } catch (e) { }
  }
  localStorage.setItem(`${COLLECTIONS.CONTENT}_${key}`, JSON.stringify(contentData));
  return contentData;
};

export const getAboutData = async (): Promise<AboutData> => getContent('about', INITIAL_ABOUT_DATA);
export const saveAboutData = async (data: AboutData) => saveContent('about', data);
export const getContactData = async (): Promise<ContactData> => getContent('contact', INITIAL_CONTACT_DATA);
export const saveContactData = async (data: ContactData) => saveContent('contact', data);
export const getHomeData = async (): Promise<HomeData> => getContent('home', INITIAL_HOME_DATA);
export const saveHomeData = async (data: HomeData) => saveContent('home', data);

export const getMembers = async (): Promise<Member[]> => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from(COLLECTIONS.MEMBERS).select('*').order('name', { ascending: true });
      if (!error && data) return data as Member[];
    }
  } catch (error) { }
  return getLocalItem<Member[]>(COLLECTIONS.MEMBERS, []);
};

export const getClubs = async (): Promise<Club[]> => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from(COLLECTIONS.CLUBS).select('*').order('name', { ascending: true });
      if (!error && data) return data as Club[];
    }
  } catch (error) { }
  return getLocalItem<Club[]>(COLLECTIONS.CLUBS, INITIAL_CLUBS);
};

export const saveClub = async (clubData: Club | Omit<Club, 'id'>): Promise<Club> => {
  if (isSupabaseConfigured && supabase) {
    try {
      if ('id' in clubData && clubData.id) {
        await supabase.from(COLLECTIONS.CLUBS).update(clubData).eq('id', clubData.id);
        return clubData as Club;
      } else {
        const { data } = await supabase.from(COLLECTIONS.CLUBS).insert(clubData).select().single();
        if (data) return data as Club;
      }
    } catch (e) { }
  }
  const clubs = getLocalItem<Club[]>(COLLECTIONS.CLUBS, INITIAL_CLUBS);
  let saved: Club;
  if ('id' in clubData && clubData.id) {
    const updated = clubs.map(c => c.id === clubData.id ? { ...c, ...clubData } : c);
    setLocalItem(COLLECTIONS.CLUBS, updated);
    saved = clubData as Club;
  } else {
    const newId = clubs.length > 0 ? Math.max(...clubs.map(c => c.id)) + 1 : 1;
    saved = { ...clubData, id: newId } as Club;
    setLocalItem(COLLECTIONS.CLUBS, [...clubs, saved]);
  }
  return saved;
};

export const deleteClub = async (id: number): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    try { await supabase.from(COLLECTIONS.CLUBS).delete().eq('id', id); } catch (e) { }
  }
  const clubs = getLocalItem<Club[]>(COLLECTIONS.CLUBS, INITIAL_CLUBS);
  setLocalItem(COLLECTIONS.CLUBS, clubs.filter(c => c.id !== id));
};

export const getClubById = async (id: number): Promise<Club | null> => {
  const clubs = await getClubs();
  return clubs.find(c => c.id === id) || null;
};

export const getUsefulLinks = async (): Promise<UsefulLink[]> => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from(COLLECTIONS.LINKS).select('*').order('title', { ascending: true });
      if (!error && data) return data as UsefulLink[];
    }
  } catch (error) { }
  return getLocalItem<UsefulLink[]>(COLLECTIONS.LINKS, INITIAL_USEFUL_LINKS);
};

export const saveUsefulLink = async (linkData: UsefulLink | Omit<UsefulLink, 'id'>): Promise<UsefulLink> => {
  if (isSupabaseConfigured && supabase) {
    try {
      if ('id' in linkData && linkData.id) {
        await supabase.from(COLLECTIONS.LINKS).update(linkData).eq('id', linkData.id);
        return linkData as UsefulLink;
      } else {
        const { data } = await supabase.from(COLLECTIONS.LINKS).insert(linkData).select().single();
        if (data) return data as UsefulLink;
      }
    } catch (e) { }
  }
  const links = getLocalItem<UsefulLink[]>(COLLECTIONS.LINKS, INITIAL_USEFUL_LINKS);
  let saved: UsefulLink;
  if ('id' in linkData && linkData.id) {
    const updated = links.map(l => l.id === linkData.id ? { ...l, ...linkData } : l);
    setLocalItem(COLLECTIONS.LINKS, updated);
    saved = linkData as UsefulLink;
  } else {
    const newId = links.length > 0 ? Math.max(...links.map(l => l.id)) + 1 : 1;
    saved = { ...linkData, id: newId } as UsefulLink;
    setLocalItem(COLLECTIONS.LINKS, [...links, saved]);
  }
  return saved;
};

export const deleteUsefulLink = async (id: number): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    try { await supabase.from(COLLECTIONS.LINKS).delete().eq('id', id); } catch (e) { }
  }
  const links = getLocalItem<UsefulLink[]>(COLLECTIONS.LINKS, INITIAL_USEFUL_LINKS);
  setLocalItem(COLLECTIONS.LINKS, links.filter(l => l.id !== id));
};

export const saveMember = async (memberData: Omit<Member, 'id' | 'role' | 'createdAt'>): Promise<Member> => {
  const isLaguna = (addr?: string) => addr?.toLowerCase().includes('92637') || addr?.toLowerCase().includes('laguna woods');
  const role: UserRole = isLaguna(memberData.address) ? 'member' : 'reader';
  const payload = { ...memberData, role, createdAt: new Date().toISOString() };
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from(COLLECTIONS.MEMBERS).insert(payload).select().single();
      if (!error && data) return data as Member;
    } catch (error) { }
  }
  const members = getLocalItem<Member[]>(COLLECTIONS.MEMBERS, []);
  const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
  const newMember: Member = { ...payload, id: newId };
  setLocalItem(COLLECTIONS.MEMBERS, [...members, newMember]);
  return newMember;
};

export const updateMemberRole = async (id: number, role: UserRole): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    try { await supabase.from(COLLECTIONS.MEMBERS).update({ role }).eq('id', id); } catch (e) { }
  }
  const members = getLocalItem<Member[]>(COLLECTIONS.MEMBERS, []);
  setLocalItem(COLLECTIONS.MEMBERS, members.map(m => m.id === id ? { ...m, role } : m));
};

export const updateMemberPassword = async (id: number, newPw: string): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    try { await supabase.from(COLLECTIONS.MEMBERS).update({ password: newPw }).eq('id', id); } catch (e) { }
  }
  const members = getLocalItem<Member[]>(COLLECTIONS.MEMBERS, []);
  setLocalItem(COLLECTIONS.MEMBERS, members.map(m => m.id === id ? { ...m, password: newPw } : m));
};

export const updateMemberInfo = async (id: number, info: Partial<Member>): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    try { await supabase.from(COLLECTIONS.MEMBERS).update(info).eq('id', id); } catch (e) { }
  }
  const members = getLocalItem<Member[]>(COLLECTIONS.MEMBERS, []);
  setLocalItem(COLLECTIONS.MEMBERS, members.map(m => m.id === id ? { ...m, ...info } : m));
};

export const deleteMember = async (id: number): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    try { await supabase.from(COLLECTIONS.MEMBERS).delete().eq('id', id); } catch (e) { }
  }
  const members = getLocalItem<Member[]>(COLLECTIONS.MEMBERS, []);
  setLocalItem(COLLECTIONS.MEMBERS, members.filter(m => m.id !== id));
};

export const saveSubscriber = async (email: string): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    try { await supabase.from(COLLECTIONS.SUBSCRIBERS).upsert({ email, joinedAt: new Date().toISOString() }); } catch (e) { }
  }
  const subs = getLocalItem<string[]>(COLLECTIONS.SUBSCRIBERS, []);
  if (!subs.includes(email)) setLocalItem(COLLECTIONS.SUBSCRIBERS, [...subs, email]);
};

export const exportMembersToCSV = async (): Promise<boolean> => {
  try {
    const members = await getMembers();
    const headers = ['이름', '업종/직업', '전화번호', '이메일', '주소', '권한', '가입일'];
    const rows = members.map(m => [m.name, m.business || '', m.phone, m.email || '', m.address || '', m.role || '', m.createdAt || '']);
    const csvContent = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `members_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    return true;
  } catch (e) { return false; }
};

export const importMembersFromCSV = async (text: string): Promise<number> => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return 0;
  const newMembers = lines.slice(1).map(line => {
    const [name, business, phone, email, address, role, createdAt] = line.split(',');
    return { name, business, phone, email, address, role: role as UserRole, createdAt };
  });
  for (const m of newMembers) { if (m.name && m.phone) await saveMember(m); }
  return newMembers.length;
};

export const needsAutoBackup = (): boolean => {
  const today = new Date();
  if (today.getDay() !== 0) return false;
  const lastBackup = localStorage.getItem(STORAGE_KEYS.BACKUP_DATE);
  return lastBackup !== today.toDateString();
};

export const performBackup = async () => {
  try {
    const members = await getMembers();
    const posts = await getPosts();
    const backupData = { timestamp: new Date().toISOString(), data: { members, posts } };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    localStorage.setItem(STORAGE_KEYS.BACKUP_DATE, new Date().toDateString());
    return true;
  } catch (e) { return false; }
};
