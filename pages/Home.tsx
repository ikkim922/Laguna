import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Newspaper, Calendar, Mail, Loader2, Edit3, Check, X, Camera, Globe } from 'lucide-react';
import { Button } from '../components/Button';
import { IMAGES } from '../constants';
import { saveSubscriber, getHomeData, saveHomeData, getCurrentUser, getPosts } from '../services/storage';
import { HomeData, Member, BoardPost } from '../types';

export const Home: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Content State
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [recentPosts, setRecentPosts] = useState<BoardPost[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<HomeData | null>(null);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
    setCurrentUser(getCurrentUser());
    
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('auth-state-change', handleAuthChange);
    return () => window.removeEventListener('auth-state-change', handleAuthChange);
  }, []);

  const loadData = async () => {
    const data = await getHomeData();
    if (!data.shortcuts.box4) {
      data.shortcuts.box4 = { title: "생활정보", desc: "유용한 웹사이트 모음" };
    }
    setHomeData(data);
    setEditForm(data);
    const posts = await getPosts();
    setRecentPosts(posts.sort((a, b) => b.id - a.id).slice(0, 5));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm(homeData);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editForm) return;
    if (confirm("메인 페이지 변경 사항을 저장하시겠습니까?")) {
      setIsLoading(true);
      try {
        await saveHomeData(editForm);
        setHomeData(editForm);
        setIsEditing(false);
        alert("저장되었습니다.");
      } catch (error) {
        alert("저장 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updateHero = (field: keyof HomeData['hero'], value: string) => {
    if (!editForm) return;
    setEditForm({ ...editForm, hero: { ...editForm.hero, [field]: value } });
  };

  const updateShortcut = (box: 'box1' | 'box2' | 'box3' | 'box4', field: 'title' | 'desc', value: string) => {
    if (!editForm) return;
    setEditForm({ 
      ...editForm, 
      shortcuts: { 
        ...editForm.shortcuts, 
        [box]: { ...editForm.shortcuts[box], [field]: value } 
      } 
    });
  };

  const updateNewsletter = (field: keyof HomeData['newsletter'], value: string) => {
    if (!editForm) return;
    setEditForm({ ...editForm, newsletter: { ...editForm.newsletter, [field]: value } });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("이메일 주소를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        alert(`구독해주셔서 감사합니다!\n\n입력하신 [${email}] 주소로 환영 메세지가 발송되었습니다.`);
        try {
          await saveSubscriber(email);
        } catch (dbError) {
          console.warn("Subscriber save to DB failed:", dbError);
        }
        setEmail('');
      } else {
        throw new Error("API request failed");
      }
    } catch (error) {
      console.error(error);
      alert("구독 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateHero('bgImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!homeData || !editForm) return <div className="p-40 text-center"><Loader2 className="animate-spin mx-auto text-royalBlue" size={48} /></div>;

  return (
    <div className="flex flex-col gap-12 pb-12 relative">
      <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-3">
        <div className="flex gap-2">
           <a 
              href="https://news.google.com/home?hl=ko&gl=KR&ceid=KR:ko" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/90 text-blue-600 px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold shadow-lg hover:bg-white flex items-center gap-2 backdrop-blur-sm transition-transform hover:scale-105 border border-white/20"
           >
              <Newspaper size={18} />
              <span className="hidden md:inline">구글 뉴스</span>
           </a>
           <a 
              href="https://gemini.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/90 text-gray-800 px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold shadow-lg hover:bg-white flex items-center gap-2 backdrop-blur-sm transition-transform hover:scale-105 border border-white/20"
           >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                <path d="M12 2C13.5 6.5 16 9 20.5 10.5C16 12 13.5 14.5 12 19C10.5 14.5 8 12 3.5 10.5C8 9 10.5 6.5 12 2Z" fill="url(#gemini-gradient)" />
                <path d="M18 18C18.5 19.5 19.5 20.5 21 21C19.5 21.5 18.5 22.5 18 24C17.5 22.5 16.5 21.5 15 21C16.5 20.5 17.5 19.5 18 18Z" fill="url(#gemini-gradient)" />
                <defs>
                  <linearGradient id="gemini-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4F86F7" />
                    <stop offset="100%" stopColor="#D276F5" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="hidden md:inline bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Gemini</span>
           </a>
        </div>
        {currentUser?.role === 'admin' && (
            <div>
              {isEditing ? (
                <div className="flex gap-2">
                  <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-green-600 flex items-center gap-2">
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} 저장
                  </button>
                  <button onClick={handleEditToggle} className="bg-gray-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-gray-600 flex items-center gap-2">
                    <X size={18} /> 취소
                  </button>
                </div>
              ) : (
                <button onClick={handleEditToggle} className="bg-white/90 text-royalBlue px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-white flex items-center gap-2 backdrop-blur-sm">
                  <Edit3 size={18} /> 메인 수정
                </button>
              )}
            </div>
        )}
      </div>

      <section 
        className="relative bg-gray-900 text-white py-24 lg:py-32"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${editForm.hero.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {isEditing && (
          <div className="absolute top-4 left-4 z-40 bg-black/70 p-4 rounded-lg backdrop-blur-sm">
             <label className="flex items-center gap-2 cursor-pointer text-white hover:text-warmOrange transition-colors">
               <Camera size={20} /> <span className="font-bold">배경 이미지 변경</span>
               <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
             </label>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {isEditing ? (
             <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20 mb-6 max-w-2xl mx-auto space-y-4">
               <input className="w-full p-2 bg-black/50 border border-gray-500 rounded text-white text-xl font-bold text-center" value={editForm.hero.titlePrefix} onChange={(e) => updateHero('titlePrefix', e.target.value)} />
               <input className="w-full p-2 bg-black/50 border border-gray-500 rounded text-warmOrange text-2xl font-bold text-center" value={editForm.hero.titleHighlight} onChange={(e) => updateHero('titleHighlight', e.target.value)} />
               <input className="w-full p-2 bg-black/50 border border-gray-500 rounded text-white text-xl font-bold text-center" value={editForm.hero.titleSuffix} onChange={(e) => updateHero('titleSuffix', e.target.value)} />
               <textarea className="w-full p-2 bg-black/50 border border-gray-500 rounded text-white text-lg text-center h-24" value={editForm.hero.description} onChange={(e) => updateHero('description', e.target.value)} />
             </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                {homeData.hero.titlePrefix}<br />
                <span className="text-warmOrange">{homeData.hero.titleHighlight}</span>{homeData.hero.titleSuffix}
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap">
                {homeData.hero.description}
              </p>
            </>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/members"><Button size="lg" variant="secondary">회원가입 / 내 정보 등록</Button></Link>
            <Link to="/about"><Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-royalBlue">한인들 소개 보기</Button></Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/members" className={`bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow flex flex-col items-center text-center group border border-gray-100 ${isEditing ? 'border-royalBlue border-dashed' : ''}`} onClick={e => isEditing && e.preventDefault()}>
            <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-200 transition-colors"><Users size={40} className="text-royalBlue" /></div>
            {isEditing ? (
              <div className="w-full space-y-2">
                 <input className="w-full text-center font-bold text-xl border-b border-gray-300 focus:border-royalBlue outline-none" value={editForm.shortcuts.box1.title} onChange={(e) => updateShortcut('box1', 'title', e.target.value)} />
                 <input className="w-full text-center text-gray-600 border-b border-gray-300 focus:border-royalBlue outline-none" value={editForm.shortcuts.box1.desc} onChange={(e) => updateShortcut('box1', 'desc', e.target.value)} />
              </div>
            ) : (
              <><h3 className="text-2xl font-bold mb-2 text-gray-900">{homeData.shortcuts.box1.title}</h3><p className="text-lg text-gray-600">{homeData.shortcuts.box1.desc}</p></>
            )}
          </Link>
          <Link to="/board" className={`bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow flex flex-col items-center text-center group border border-gray-100 ${isEditing ? 'border-royalBlue border-dashed' : ''}`} onClick={e => isEditing && e.preventDefault()}>
            <div className="bg-orange-100 p-4 rounded-full mb-4 group-hover:bg-orange-200 transition-colors"><Newspaper size={40} className="text-warmOrange" /></div>
            {isEditing ? (
              <div className="w-full space-y-2">
                 <input className="w-full text-center font-bold text-xl border-b border-gray-300 focus:border-royalBlue outline-none" value={editForm.shortcuts.box2.title} onChange={(e) => updateShortcut('box2', 'title', e.target.value)} />
                 <input className="w-full text-center text-gray-600 border-b border-gray-300 focus:border-royalBlue outline-none" value={editForm.shortcuts.box2.desc} onChange={(e) => updateShortcut('box2', 'desc', e.target.value)} />
              </div>
            ) : (
              <><h3 className="text-2xl font-bold mb-2 text-gray-900">{homeData.shortcuts.box2.title}</h3><p className="text-lg text-gray-600">{homeData.shortcuts.box2.desc}</p></>
            )}
          </Link>
          <Link to="/board" className={`bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow flex flex-col items-center text-center group border border-gray-100 ${isEditing ? 'border-royalBlue border-dashed' : ''}`} onClick={e => isEditing && e.preventDefault()}>
            <div className="bg-green-100 p-4 rounded-full mb-4 group-hover:bg-green-200 transition-colors"><Calendar size={40} className="text-green-600" /></div>
            {isEditing ? (
              <div className="w-full space-y-2">
                 <input className="w-full text-center font-bold text-xl border-b border-gray-300 focus:border-royalBlue outline-none" value={editForm.shortcuts.box3.title} onChange={(e) => updateShortcut('box3', 'title', e.target.value)} />
                 <input className="w-full text-center text-gray-600 border-b border-gray-300 focus:border-royalBlue outline-none" value={editForm.shortcuts.box3.desc} onChange={(e) => updateShortcut('box3', 'desc', e.target.value)} />
              </div>
            ) : (
              <><h3 className="text-2xl font-bold mb-2 text-gray-900">{homeData.shortcuts.box3.title}</h3><p className="text-lg text-gray-600">{homeData.shortcuts.box3.desc}</p></>
            )}
          </Link>
          <Link to="/resources" className={`bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-shadow flex flex-col items-center text-center group border border-gray-100 ${isEditing ? 'border-royalBlue border-dashed' : ''}`} onClick={e => isEditing && e.preventDefault()}>
            <div className="bg-purple-100 p-4 rounded-full mb-4 group-hover:bg-purple-200 transition-colors"><Globe size={40} className="text-purple-600" /></div>
            {isEditing ? (
              <div className="w-full space-y-2">
                 <input className="w-full text-center font-bold text-xl border-b border-gray-300 focus:border-royalBlue outline-none" value={editForm.shortcuts.box4 ? editForm.shortcuts.box4.title : '생활정보'} onChange={(e) => updateShortcut('box4', 'title', e.target.value)} />
                 <input className="w-full text-center text-gray-600 border-b border-gray-300 focus:border-royalBlue outline-none" value={editForm.shortcuts.box4 ? editForm.shortcuts.box4.desc : '유용한 웹사이트 모음'} onChange={(e) => updateShortcut('box4', 'desc', e.target.value)} />
              </div>
            ) : (
              <><h3 className="text-2xl font-bold mb-2 text-gray-900">{homeData.shortcuts.box4 ? homeData.shortcuts.box4.title : '생활정보'}</h3><p className="text-lg text-gray-600">{homeData.shortcuts.box4 ? homeData.shortcuts.box4.desc : '유용한 웹사이트 모음'}</p></>
            )}
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-royalBlue">최신 소식</h2>
          <Link to="/board" className="text-xl text-gray-600 hover:text-royalBlue font-medium flex items-center gap-1">전체보기 <ArrowRight size={20} /></Link>
        </div>
        {recentPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {recentPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200 flex flex-col h-full">
                <div className="h-40 overflow-hidden bg-gray-100 relative">
                  <img src={post.category === '공지사항' ? IMAGES.NEWS_THUMB_1 : post.category === '행사뉴스' ? IMAGES.NEWS_THUMB_2 : IMAGES.NEWS_THUMB_3} alt={post.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 left-2"><span className={`inline-block px-2 py-0.5 font-bold rounded-full text-xs shadow-sm ${post.category === '공지사항' ? 'bg-red-100 text-red-600' : post.category === '행사뉴스' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{post.category}</span></div>
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 leading-tight h-[3em]">{post.title}</h3>
                  <p className="text-gray-500 text-xs mb-3">{post.date} | {post.author}</p>
                  <Link to="/board" className="text-royalBlue font-bold hover:underline text-sm mt-auto">자세히 보기</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100"><p className="text-xl text-gray-500">등록된 소식이 없습니다.</p></div>
        )}
      </section>

      <section className={`bg-blue-50 py-16 ${isEditing ? 'border-2 border-royalBlue border-dashed' : ''}`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg">
            <Mail size={48} className="text-royalBlue mx-auto mb-4" />
            {isEditing ? (
              <div className="space-y-4 mb-8">
                 <input className="w-full text-center text-3xl font-bold border-b border-gray-300 focus:border-royalBlue outline-none" value={editForm.newsletter.title} onChange={(e) => updateNewsletter('title', e.target.value)} />
                 <input className="w-full text-center text-xl text-gray-600 border-b border-gray-300 focus:border-royalBlue outline-none" value={editForm.newsletter.description} onChange={(e) => updateNewsletter('description', e.target.value)} />
              </div>
            ) : (
              <><h2 className="text-3xl font-bold mb-4">{homeData.newsletter.title}</h2><p className="text-xl text-gray-600 mb-8">{homeData.newsletter.description}</p></>
            )}
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <input type="email" placeholder="이메일 주소를 입력해주세요" className="flex-grow p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-royalBlue outline-none disabled:bg-gray-100 disabled:text-gray-400" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting || isEditing} />
              <Button type="submit" size="lg" disabled={isSubmitting || isEditing} className="flex items-center justify-center min-w-[140px]">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                {isSubmitting ? "처리 중..." : "구독하기"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};