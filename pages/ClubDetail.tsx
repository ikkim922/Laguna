import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Check, X, Camera, Phone, Mail, MapPin, Calendar, User, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Club, Member } from '../types';
import { getClubById, saveClub, getCurrentUser } from '../services/storage';

export const ClubDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Club | null>(null);
  
  // Image Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    setCurrentUser(getCurrentUser());
    const handleAuthChange = () => setCurrentUser(getCurrentUser());
    window.addEventListener('auth-state-change', handleAuthChange);
    return () => window.removeEventListener('auth-state-change', handleAuthChange);
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getClubById(parseInt(id));
      if (data) {
        setClub(data);
        setEditForm(data);
      } else {
        alert("존재하지 않는 동아리입니다.");
        navigate('/clubs');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm(club); // Revert
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!editForm) return;

    // Validation Feedback
    if (!editForm.name.trim()) {
      window.alert("동아리 이름은 필수 입력 항목입니다.");
      return;
    }

    if (!window.confirm("변경 사항을 저장하시겠습니까?")) return;

    setIsLoading(true);
    try {
      const savedData = await saveClub(editForm);
      setClub(savedData);
      setEditForm(savedData);
      setIsEditing(false);
      window.alert("동아리 정보가 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("Save error:", error);
      window.alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateField = (field: keyof Club, value: string) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  if (!club || !editForm) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-royalBlue" size={40}/></div>;

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="bg-softWhite min-h-screen pb-20">
      {/* Hero / Header Image */}
      <div className="relative h-80 bg-gray-900 group">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: `url(${editForm.photoUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=2000&auto=format&fit=crop'})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <Link to="/clubs" className="text-white/80 hover:text-white flex items-center gap-2 mb-4 transition-colors">
            <ArrowLeft size={20} /> 목록으로 돌아가기
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
             <div>
                {isEditing ? (
                  <input 
                    className="text-4xl md:text-5xl font-bold text-white bg-transparent border-b border-white/50 focus:border-white outline-none w-full md:w-[600px] mb-2"
                    value={editForm.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="동아리 이름 *"
                  />
                ) : (
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{club.name}</h1>
                )}
                
                {isEditing ? (
                   <input 
                     className="text-xl text-gray-200 bg-transparent border-b border-white/30 focus:border-white outline-none w-full"
                     value={editForm.description || ''}
                     onChange={(e) => updateField('description', e.target.value)}
                     placeholder="한줄 소개 입력"
                   />
                ) : (
                   <p className="text-xl text-gray-200">{club.description}</p>
                )}
             </div>

             {isAdmin && (
               <div className="mb-2">
                 {isEditing ? (
                   <div className="flex gap-2">
                      <Button onClick={handleSave} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} 저장
                      </Button>
                      <Button onClick={handleEditToggle} variant="secondary" className="bg-gray-600 hover:bg-gray-700">
                        <X size={18} /> 취소
                      </Button>
                   </div>
                 ) : (
                   <Button onClick={handleEditToggle} className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-none">
                     <Edit3 size={18} className="mr-2"/> 정보 수정
                   </Button>
                 )}
               </div>
             )}
          </div>
        </div>

        {/* Photo Upload Overlay */}
        {isEditing && (
           <label className="absolute top-8 right-8 cursor-pointer bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-colors">
             <Camera size={24} />
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
           </label>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`bg-white p-6 rounded-xl shadow-md ${isEditing ? 'border-2 border-royalBlue border-dashed' : ''}`}>
             <h3 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">동아리 정보</h3>
             
             <div className="space-y-6">
               <div className="flex gap-4">
                  <div className="bg-blue-100 p-2 rounded-full h-fit"><User size={20} className="text-royalBlue"/></div>
                  <div className="flex-1">
                     <p className="text-sm text-gray-500 font-bold mb-1">회장(Leader)</p>
                     {isEditing ? (
                       <input 
                         className="w-full p-2 border rounded focus:border-royalBlue outline-none"
                         value={editForm.leader || ''}
                         onChange={(e) => updateField('leader', e.target.value)}
                         placeholder="이름 입력"
                       />
                     ) : (
                       <p className="text-lg text-gray-800 font-medium">{club.leader || "정보 없음"}</p>
                     )}
                  </div>
               </div>

               <div className="flex gap-4">
                  <div className="bg-orange-100 p-2 rounded-full h-fit"><Phone size={20} className="text-warmOrange"/></div>
                  <div className="flex-1">
                     <p className="text-sm text-gray-500 font-bold mb-1">연락처</p>
                     {isEditing ? (
                       <input 
                         className="w-full p-2 border rounded focus:border-royalBlue outline-none"
                         value={editForm.phone || ''}
                         onChange={(e) => updateField('phone', e.target.value)}
                         placeholder="000-0000-0000"
                       />
                     ) : (
                       <p className="text-lg text-gray-800 font-medium">{club.phone || "정보 없음"}</p>
                     )}
                  </div>
               </div>

               <div className="flex gap-4">
                  <div className="bg-green-100 p-2 rounded-full h-fit"><Mail size={20} className="text-green-600"/></div>
                  <div className="flex-1">
                     <p className="text-sm text-gray-500 font-bold mb-1">이메일</p>
                     {isEditing ? (
                       <input 
                         className="w-full p-2 border rounded focus:border-royalBlue outline-none"
                         value={editForm.email || ''}
                         onChange={(e) => updateField('email', e.target.value)}
                         placeholder="email@example.com"
                       />
                     ) : (
                       <p className="text-lg text-gray-800 font-medium">{club.email || "정보 없음"}</p>
                     )}
                  </div>
               </div>

               <div className="flex gap-4">
                  <div className="bg-purple-100 p-2 rounded-full h-fit"><Calendar size={20} className="text-purple-600"/></div>
                  <div className="flex-1">
                     <p className="text-sm text-gray-500 font-bold mb-1">정기 모임</p>
                     {isEditing ? (
                       <input 
                         className="w-full p-2 border rounded focus:border-royalBlue outline-none"
                         value={editForm.schedule || ''}
                         onChange={(e) => updateField('schedule', e.target.value)}
                         placeholder="예: 매주 토요일 오전 10시"
                       />
                     ) : (
                       <p className="text-lg text-gray-800 font-medium">{club.schedule || "정보 없음"}</p>
                     )}
                  </div>
               </div>

               <div className="flex gap-4">
                  <div className="bg-gray-100 p-2 rounded-full h-fit"><MapPin size={20} className="text-gray-600"/></div>
                  <div className="flex-1">
                     <p className="text-sm text-gray-500 font-bold mb-1">모임 장소</p>
                     {isEditing ? (
                       <input 
                         className="w-full p-2 border rounded focus:border-royalBlue outline-none"
                         value={editForm.location || ''}
                         onChange={(e) => updateField('location', e.target.value)}
                         placeholder="장소 입력"
                       />
                     ) : (
                       <p className="text-lg text-gray-800 font-medium">{club.location || "정보 없음"}</p>
                     )}
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
           <div className={`bg-white p-8 rounded-xl shadow-md min-h-[400px] ${isEditing ? 'border-2 border-royalBlue border-dashed' : ''}`}>
             <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">동아리 소개</h3>
             {isEditing ? (
                <textarea 
                  className="w-full h-[400px] p-4 border border-gray-300 rounded-lg text-lg leading-relaxed focus:border-royalBlue outline-none resize-none"
                  value={editForm.content || ''}
                  onChange={(e) => updateField('content', e.target.value)}
                  placeholder="동아리에 대한 자세한 소개글을 작성해주세요."
                />
             ) : (
                <div className="prose max-w-none text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                   {club.content || "등록된 소개글이 없습니다."}
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};