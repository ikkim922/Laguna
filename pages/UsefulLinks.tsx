import React, { useState, useEffect } from 'react';
import { ExternalLink, Plus, Trash2, Edit3, X, Loader2, Globe } from 'lucide-react';
import { Button } from '../components/Button';
import { IMAGES } from '../constants';
import { UsefulLink, Member } from '../types';
import { getUsefulLinks, saveUsefulLink, deleteUsefulLink, getCurrentUser } from '../services/storage';

export const UsefulLinks: React.FC = () => {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '', description: '', category: '' });

  useEffect(() => {
    loadData();
    setCurrentUser(getCurrentUser());
    const handleAuthChange = () => setCurrentUser(getCurrentUser());
    window.addEventListener('auth-state-change', handleAuthChange);
    return () => window.removeEventListener('auth-state-change', handleAuthChange);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getUsefulLinks();
      setLinks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({ title: '', url: '', description: '', category: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (link: UsefulLink) => {
    setEditId(link.id);
    setFormData({ 
      title: link.title, 
      url: link.url, 
      description: link.description || '', 
      category: link.category || '' 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) {
      alert("사이트 이름과 주소(URL)는 필수입니다.");
      return;
    }

    setIsLoading(true);
    try {
      await saveUsefulLink({
        id: editId || undefined,
        title: formData.title,
        url: formData.url,
        description: formData.description,
        category: formData.category
      });
      setIsModalOpen(false);
      alert("저장되었습니다.");
      await loadData();
    } catch (error) {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말로 이 사이트 링크를 삭제하시겠습니까?")) return;
    setIsLoading(true);
    try {
      await deleteUsefulLink(id);
      alert("삭제되었습니다.");
      await loadData();
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="bg-softWhite min-h-screen pb-20 relative">
      {/* Header Image */}
      <div 
        className="h-64 relative flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${IMAGES.HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white shadow-sm text-center px-4">
          생활정보 (유용한 웹사이트)
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl md:text-3xl font-bold text-gray-900">바로가기 모음</h2>
           {isAdmin && (
             <Button onClick={openAddModal} className="flex items-center gap-2">
               <Plus size={20} /> 사이트 추가
             </Button>
           )}
        </div>

        {isLoading && links.length === 0 ? (
           <div className="text-center py-20">
             <Loader2 size={48} className="animate-spin text-royalBlue mx-auto" />
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {links.map(link => (
              <div 
                key={link.id} 
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100 flex flex-col relative group"
              >
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(link)}
                      className="p-2 bg-gray-100 text-gray-600 hover:text-royalBlue rounded-full hover:bg-blue-50"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(link.id)}
                      className="p-2 bg-red-50 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                
                <div className="flex items-start gap-4 mb-4">
                   <div className="bg-blue-50 p-3 rounded-lg text-royalBlue">
                     <Globe size={28} />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{link.title}</h3>
                     {link.category && (
                       <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                         {link.category}
                       </span>
                     )}
                   </div>
                </div>
                
                <p className="text-gray-600 mb-6 flex-grow line-clamp-3 text-sm min-h-[40px]">
                  {link.description || "등록된 설명이 없습니다."}
                </p>

                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-auto w-full flex items-center justify-center gap-2 bg-royalBlue text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors"
                >
                  사이트 방문하기 <ExternalLink size={18} />
                </a>
              </div>
            ))}
            
            {links.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                <p className="text-gray-500">등록된 사이트가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editId ? '사이트 수정' : '새 사이트 추가'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">사이트 이름 *</label>
                 <input 
                   className="w-full p-3 border rounded-lg focus:border-royalBlue outline-none"
                   placeholder="예: 라구나 우즈 빌리지"
                   value={formData.title}
                   onChange={(e) => setFormData({...formData, title: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">주소 (URL) *</label>
                 <input 
                   className="w-full p-3 border rounded-lg focus:border-royalBlue outline-none font-mono text-sm"
                   placeholder="https://..."
                   value={formData.url}
                   onChange={(e) => setFormData({...formData, url: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">분류 (선택)</label>
                 <input 
                   className="w-full p-3 border rounded-lg focus:border-royalBlue outline-none"
                   placeholder="예: 공공기관, 뉴스"
                   value={formData.category}
                   onChange={(e) => setFormData({...formData, category: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">설명 (선택)</label>
                 <textarea 
                   className="w-full p-3 border rounded-lg focus:border-royalBlue outline-none resize-none"
                   rows={3}
                   placeholder="사이트에 대한 간단한 설명을 입력하세요."
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                 />
               </div>
               
               <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                 {isLoading ? '저장 중...' : '저장하기'}
               </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};