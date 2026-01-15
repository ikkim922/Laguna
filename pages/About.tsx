import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Check, X, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { AboutData, OrganizationMember, MissionItem, Member } from '../types';
import { getAboutData, saveAboutData, getCurrentUser } from '../services/storage';

export const About: React.FC = () => {
  const [data, setData] = useState<AboutData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Edit State Form
  const [editForm, setEditForm] = useState<AboutData | null>(null);

  useEffect(() => {
    loadData();
    setCurrentUser(getCurrentUser());

    // Listen for auth changes from Layout
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('auth-state-change', handleAuthChange);

    return () => {
      window.removeEventListener('auth-state-change', handleAuthChange);
    };
  }, []);

  const loadData = async () => {
    const fetchedData = await getAboutData();
    setData(fetchedData);
    setEditForm(fetchedData);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit - reset form
      setEditForm(data);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editForm) return;

    if (confirm("변경 사항을 저장하시겠습니까?")) {
      setIsLoading(true);
      try {
        await saveAboutData(editForm);
        setData(editForm);
        setIsEditing(false);
        alert("저장되었습니다.");
      } catch (error) {
        alert("저장 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updatePresident = (field: keyof AboutData['president'], value: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      president: { ...editForm.president, [field]: value }
    });
  };

  const updateMission = (index: number, field: keyof MissionItem, value: string) => {
    if (!editForm) return;
    const newMissions = [...editForm.missions];
    newMissions[index] = { ...newMissions[index], [field]: value };
    setEditForm({ ...editForm, missions: newMissions });
  };

  const updateOrgMember = (index: number, field: keyof OrganizationMember, value: string) => {
    if (!editForm) return;
    const newOrg = [...editForm.organization];
    newOrg[index] = { ...newOrg[index], [field]: value };
    setEditForm({ ...editForm, organization: newOrg });
  };

  const addOrgMember = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      organization: [...editForm.organization, { role: "직책", name: "이름" }]
    });
  };

  const removeOrgMember = (index: number) => {
    if (!editForm) return;
    const newOrg = editForm.organization.filter((_, i) => i !== index);
    setEditForm({ ...editForm, organization: newOrg });
  };

  if (!data || !editForm) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-royalBlue" size={40}/></div>;

  // 권한 체크: 관리자(admin)만 수정 가능
  const canEdit = currentUser?.role === 'admin';

  return (
    <div className="bg-softWhite pb-20 relative">
      {/* Page Header */}
      <div className="bg-royalBlue text-white py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">한인들 소개</h1>
          <p className="text-xl md:text-2xl opacity-90">
            라구나 지역 한인들의 권익 신장과 화합을 위해 노력합니다.
          </p>
        </div>
        
        {/* Admin Edit Controls */}
        {canEdit && (
          <div className="absolute top-4 right-4 md:top-8 md:right-8">
            {isEditing ? (
              <div className="flex gap-2">
                <button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-green-600 flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  저장
                </button>
                <button 
                  onClick={handleEditToggle}
                  disabled={isLoading} 
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-gray-600 flex items-center gap-2"
                >
                  <X size={18} />
                  취소
                </button>
              </div>
            ) : (
              <button 
                onClick={handleEditToggle} 
                className="bg-white text-royalBlue px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-50 flex items-center gap-2"
              >
                <Edit3 size={18} />
                페이지 수정
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        
        {/* President Message */}
        <section className={`bg-white rounded-xl shadow-md p-8 md:p-12 flex flex-col md:flex-row gap-10 items-start ${isEditing ? 'border-2 border-royalBlue border-dashed' : ''}`}>
          <div className="w-full md:w-1/3">
            <div className="aspect-square rounded-full overflow-hidden border-4 border-gray-100 shadow-lg mx-auto max-w-[300px] relative bg-gray-100">
              <img src={editForm.president.imageUrl} alt="한인들 회장" className="w-full h-full object-cover" />
            </div>
            {isEditing && (
               <div className="mt-2">
                 <label className="text-sm font-bold text-gray-500">이미지 주소 (URL)</label>
                 <input 
                    type="text" 
                    className="w-full p-2 border rounded text-sm" 
                    value={editForm.president.imageUrl} 
                    onChange={(e) => updatePresident('imageUrl', e.target.value)}
                  />
               </div>
            )}
            <div className="text-center mt-6">
              {isEditing ? (
                <div className="space-y-2">
                   <input 
                     className="text-2xl font-bold text-center w-full border-b border-gray-300 focus:border-royalBlue outline-none pb-1"
                     value={editForm.president.name}
                     onChange={(e) => updatePresident('name', e.target.value)}
                   />
                   <input 
                     className="text-royalBlue font-medium text-lg text-center w-full border-b border-gray-300 focus:border-royalBlue outline-none pb-1"
                     value={editForm.president.title}
                     onChange={(e) => updatePresident('title', e.target.value)}
                   />
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900">{data.president.name}</h3>
                  <p className="text-royalBlue font-medium text-lg">{data.president.title}</p>
                </>
              )}
            </div>
          </div>
          <div className="w-full md:w-2/3">
            <h2 className="text-3xl font-bold mb-6 text-royalBlue">인사말</h2>
            {isEditing ? (
              <textarea 
                className="w-full min-h-[400px] p-4 text-xl border-2 border-gray-200 rounded-lg outline-none focus:border-royalBlue"
                value={editForm.president.message}
                onChange={(e) => updatePresident('message', e.target.value)}
              />
            ) : (
              <div className="space-y-4 text-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
                {data.president.message}
              </div>
            )}
          </div>
        </section>

        {/* Mission */}
        <section className={`text-center ${isEditing ? 'p-4 border-2 border-royalBlue border-dashed rounded-lg' : ''}`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-gray-900">설립 목적</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {editForm.missions.map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-lg shadow-md border-t-4 border-royalBlue">
                {isEditing ? (
                   <div className="space-y-4">
                     <div>
                       <label className="block text-left text-xs text-gray-400 mb-1">제목</label>
                       <input 
                          className="w-full text-2xl font-bold text-royalBlue text-center border-b border-gray-200 focus:border-royalBlue outline-none"
                          value={item.title}
                          onChange={(e) => updateMission(i, 'title', e.target.value)}
                       />
                     </div>
                     <div>
                        <label className="block text-left text-xs text-gray-400 mb-1">내용</label>
                        <textarea 
                          className="w-full text-xl text-gray-600 text-center border border-gray-200 rounded p-2 focus:border-royalBlue outline-none"
                          rows={3}
                          value={item.desc}
                          onChange={(e) => updateMission(i, 'desc', e.target.value)}
                        />
                     </div>
                   </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold mb-4 text-royalBlue">{item.title}</h3>
                    <p className="text-xl text-gray-600">{item.desc}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Organization Chart */}
        <section className={`${isEditing ? 'p-4 border-2 border-royalBlue border-dashed rounded-lg' : ''}`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-gray-900">조직도</h2>
          <div className="bg-white rounded-xl shadow-md p-8 md:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {editForm.organization.map((member, i) => (
                <div key={i} className="relative flex items-center p-4 border-2 border-gray-100 rounded-lg hover:border-blue-200 transition-colors group">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-royalBlue font-bold text-xl mr-4 shrink-0">
                    {member.name[0]}
                  </div>
                  <div className="flex-grow">
                    {isEditing ? (
                      <div className="space-y-1">
                        <input 
                           className="text-gray-500 text-lg w-full border-b border-gray-200 focus:border-royalBlue outline-none"
                           value={member.role}
                           onChange={(e) => updateOrgMember(i, 'role', e.target.value)}
                           placeholder="직책"
                        />
                        <input 
                           className="text-2xl font-bold text-gray-900 w-full border-b border-gray-200 focus:border-royalBlue outline-none"
                           value={member.name}
                           onChange={(e) => updateOrgMember(i, 'name', e.target.value)}
                           placeholder="이름"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-500 text-lg">{member.role}</p>
                        <p className="text-2xl font-bold text-gray-900">{member.name}</p>
                      </>
                    )}
                  </div>
                  
                  {isEditing && (
                    <button 
                      onClick={() => removeOrgMember(i)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              
              {isEditing && (
                <button 
                  onClick={addOrgMember}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-royalBlue hover:bg-blue-50 transition-colors text-gray-400 hover:text-royalBlue min-h-[100px]"
                >
                  <Plus size={32} />
                  <span className="font-bold mt-2">임원 추가</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold mb-6">한인들과 함께 하시겠습니까?</h3>
          <Link to="/members">
            <Button size="lg" variant="secondary" className="shadow-lg animate-pulse">
              회원 등록하러 가기
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
};