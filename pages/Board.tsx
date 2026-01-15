
import React, { useState, useEffect, useMemo } from 'react';
import { Edit3, FileText, X, Check, Trash2, Loader2, Lock, RefreshCw, Database, Cloud } from 'lucide-react';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { BoardPost, Member } from '../types';
import { IMAGES } from '../constants';
import { getPosts, savePost, deletePost, getCurrentUser } from '../services/storage';
import { isSupabaseConfigured } from '../supabase';

export const BoardPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('자유게시판');
  const [newPostAuthor, setNewPostAuthor] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getPosts();
      setPosts(data || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Board refresh failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setCurrentUser(getCurrentUser());
    const handleAuthChange = () => setCurrentUser(getCurrentUser());
    window.addEventListener('auth-state-change', handleAuthChange);
    return () => window.removeEventListener('auth-state-change', handleAuthChange);
  }, []);

  const canWrite = useMemo(() => currentUser && currentUser.role !== 'reader', [currentUser]);
  const canManageAll = useMemo(() => currentUser?.role === 'admin', [currentUser]);

  const openWriteModal = () => {
    if (!currentUser) return alert("로그인이 필요한 서비스입니다.");
    if (!canWrite) return alert("글쓰기 권한이 없습니다.");
    setEditingId(null);
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostAuthor(currentUser.name);
    setNewPostCategory('자유게시판');
    setIsWriteModalOpen(true);
  };

  const handleEditClick = (post: BoardPost) => {
    if (!canManageAll && currentUser?.name !== post.author) return alert("수정 권한이 없습니다.");
    setEditingId(post.id);
    setNewPostTitle(post.title);
    setNewPostContent(post.content || '');
    setNewPostAuthor(post.author);
    setNewPostCategory(post.category);
    setSelectedPost(null);
    setIsWriteModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return alert("제목과 내용을 입력해주세요.");

    setIsLoading(true);
    try {
      const today = new Date().toLocaleDateString('ko-KR').replace(/\.$/, "");
      const postPayload = {
        title: newPostTitle,
        author: newPostAuthor,
        category: newPostCategory as any,
        content: newPostContent,
        date: editingId 
          ? (posts.find(p => p.id === editingId)?.date || today)
          : today
      };

      await savePost(editingId ? { ...postPayload, id: editingId } : postPayload);

      setIsWriteModalOpen(false);
      // Data is already updated locally by savePost, but we refresh to ensure consistency
      await loadData();
      alert("글이 성공적으로 등록되었습니다.");
    } catch (error) {
      console.error("Save Error:", error);
      alert("글 저장 중 문제가 발생했습니다. 브라우저 로컬 저장소에 우선 저장되었습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    setIsLoading(true);
    try {
      await deletePost(id);
      setSelectedPost(null);
      await loadData();
    } catch (error) {
      alert("삭제 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const sortedPosts = useMemo(() => {
    const filtered = activeCategory === '전체' ? posts : posts.filter(p => p.category === activeCategory);
    return [...filtered].sort((a, b) => b.id - a.id);
  }, [posts, activeCategory]);

  const categories = ['전체', '공지사항', '자유게시판', '행사뉴스', '창작', '생활정보'];

  return (
    <div className="bg-softWhite min-h-screen pb-20">
      <div className="h-64 relative flex items-center justify-center" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${IMAGES.BOARD_HEADER})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <h1 className="text-5xl font-bold text-white">소식과 나눔</h1>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`px-6 py-3 rounded-full text-lg font-bold transition-all ${activeCategory === cat ? 'bg-royalBlue text-white shadow-md' : 'bg-white text-gray-600 border'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end text-xs text-gray-400 font-bold">
               <div className="flex items-center gap-1.5 mb-1">
                 {isSupabaseConfigured ? <><Cloud size={14} className="text-green-500" /> <span>클라우드 연결됨</span></> : <><Database size={14} className="text-orange-500" /> <span>로컬 저장소 모드</span></>}
               </div>
               {lastUpdated && <span>최종 갱신: {lastUpdated}</span>}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={loadData} 
                disabled={isLoading} 
                className="flex items-center gap-2 group"
              >
                <RefreshCw size={20} className={`${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> 
                {isLoading ? "로딩..." : "새로고침"}
              </Button>
              <Button variant="secondary" className="flex items-center gap-2 shadow-lg" onClick={openWriteModal}>
                <Edit3 size={20} /> 글쓰기
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden min-h-[500px] relative border border-gray-100">
          {isLoading && posts.length === 0 && (
             <div className="absolute inset-0 bg-white/50 flex flex-col items-center justify-center z-10 backdrop-blur-[2px]">
                <Loader2 size={48} className="text-royalBlue animate-spin mb-4" />
                <p className="text-xl font-bold text-gray-600">소식을 불러오고 있습니다...</p>
             </div>
          )}
          
          <div className="divide-y">
            {sortedPosts.map(post => (
              <div key={post.id} className="grid grid-cols-12 p-6 items-center hover:bg-blue-50 cursor-pointer group transition-colors" onClick={() => setSelectedPost(post)}>
                <div className="col-span-2"><span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-600">{post.category}</span></div>
                <div className="col-span-7">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-royalBlue flex items-center gap-2">
                    {post.title}
                    {(post.date && post.date.includes(new Date().toLocaleDateString('ko-KR').replace(/\.$/, ""))) && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-black animate-pulse">NEW</span>
                    )}
                  </h3>
                </div>
                <div className="col-span-2 text-center text-gray-600 font-medium">{post.author}</div>
                <div className="col-span-1 text-right text-gray-400 font-medium whitespace-nowrap">{post.date}</div>
              </div>
            ))}
          </div>
          
          {sortedPosts.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-40 animate-fade-in">
               <FileText size={64} className="text-gray-200 mb-4" />
               <p className="text-xl text-gray-400 font-bold">등록된 소식이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
             <div className="p-6 bg-royalBlue text-white flex justify-between items-start">
               <div><span className="px-2 py-1 bg-white/20 rounded mb-2 text-sm font-bold">{selectedPost.category}</span><h2 className="text-2xl font-bold">{selectedPost.title}</h2></div>
               <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={28} /></button>
             </div>
             <div className="p-8 overflow-y-auto text-lg leading-relaxed whitespace-pre-wrap text-gray-800">{selectedPost.content}</div>
             <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
               {(canManageAll || currentUser?.name === selectedPost.author) && (
                 <><Button variant="secondary" onClick={() => handleEditClick(selectedPost)}>수정</Button><Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeletePost(selectedPost.id)}>삭제</Button></>
               )}
               <Button onClick={() => setSelectedPost(null)}>닫기</Button>
             </div>
          </div>
        </div>
      )}

      {isWriteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
            <div className="p-6 bg-royalBlue text-white flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Edit3 /> {editingId ? '글 수정' : '새 글 쓰기'}</h2>
              <button onClick={() => setIsWriteModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <form onSubmit={handleSavePost} className="space-y-6">
                <div>
                  <label className="block mb-2 text-xl font-bold text-gray-800">게시판 선택</label>
                  <select className="w-full p-4 border-2 border-gray-200 rounded-lg outline-none focus:border-royalBlue bg-white font-bold text-gray-900" value={newPostCategory} onChange={(e) => setNewPostCategory(e.target.value)}>
                    {categories.filter(c => c !== '전체').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <InputField label="제목" placeholder="제목을 입력하세요" value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} />
                <InputField label="내용" isTextArea rows={10} placeholder="내용을 입력하세요" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsWriteModalOpen(false)}>취소</Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : <Check size={24} />} {editingId ? '수정 완료' : '등록하기'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
