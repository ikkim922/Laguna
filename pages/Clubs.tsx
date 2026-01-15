import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Trash2, ArrowRight, Loader2, X } from 'lucide-react';
import { Button } from '../components/Button';
import { IMAGES } from '../constants';
import { Club, Member } from '../types';
import { getClubs, saveClub, deleteClub, getCurrentUser } from '../services/storage';

export const Clubs: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  
  // Add Club Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getClubs();
      setClubs(data);
    } catch (error) {
      console.error(error);
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

  const handleAddClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) return alert("동아리 이름을 입력해주세요.");
    
    setIsLoading(true);
    try {
      await saveClub({
        name: newClubName,
        description: newClubDesc
      });
      setNewClubName('');
      setNewClubDesc('');
      setIsAddModalOpen(false);
      alert("새 동아리가 성공적으로 개설되었습니다.");
      await loadData();
    } catch (error) {
      alert("동아리 추가 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClub = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    if (!confirm("정말로 이 동아리를 삭제하시겠습니까?\n모든 상세 정보가 삭제됩니다.")) return;
    
    setIsLoading(true);
    try {
      await deleteClub(id);
      alert("동아리가 삭제되었습니다.");
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
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${IMAGES.CLUB_HEADER})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <h1 className="text-5xl font-bold text-white shadow-sm">동아리 활동</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-3xl font-bold text-gray-900">우리들의 모임</h2>
           {isAdmin && (
             <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
               <Plus size={20} /> 동아리 개설
             </Button>
           )}
        </div>

        {isLoading && clubs.length === 0 ? (
           <div className="text-center py-20">
             <Loader2 size={48} className="animate-spin text-royalBlue mx-auto" />
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {clubs.map(club => (
              <Link 
                to={`/clubs/${club.id}`} 
                key={club.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full border border-gray-100 relative"
              >
                {isAdmin && (
                  <button 
                    onClick={(e) => handleDeleteClub(club.id, e)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-red-600 shadow-md"
                    title="동아리 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                
                <div className="h-36 overflow-hidden relative bg-gray-200">
                  <img 
                    src={club.photoUrl || "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=500&auto=format&fit=crop"} 
                    alt={club.name} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 relative z-10"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-20" />
                </div>
                
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-royalBlue transition-colors truncate">
                    {club.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-grow h-[3em]">
                    {club.description || "소개가 없습니다."}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                     <span className="flex items-center gap-1 truncate max-w-[80%]">
                       <Users size={12} className="shrink-0" /> <span className="truncate">{club.leader || "회장 미정"}</span>
                     </span>
                     <ArrowRight size={14} className="text-royalBlue opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-5px] group-hover:translate-x-0 shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
            
            {clubs.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                <p className="text-gray-500">등록된 동아리가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">새 동아리 개설</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddClub} className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">동아리 이름 *</label>
                 <input 
                   className="w-full p-3 border rounded-lg focus:border-royalBlue outline-none"
                   placeholder="예: 바둑 동호회"
                   value={newClubName}
                   onChange={(e) => setNewClubName(e.target.value)}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">한줄 소개</label>
                 <input 
                   className="w-full p-3 border rounded-lg focus:border-royalBlue outline-none"
                   placeholder="동아리에 대한 간단한 설명"
                   value={newClubDesc}
                   onChange={(e) => setNewClubDesc(e.target.value)}
                 />
               </div>
               
               <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                 {isLoading ? '처리 중...' : '개설하기'}
               </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};