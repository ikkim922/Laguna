import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, UserPlus, Lock, Camera, X, Check, Loader2, Shield, User, AlertCircle, ChevronDown, Key, Edit3, Mail, Trash2, Database, FileDown, FileUp, Settings, LogOut, Users, PlusCircle, CreditCard } from 'lucide-react';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { Member, ROLE_LABELS, UserRole, Club } from '../types';
import { getMembers, saveMember, getCurrentUser, updateMemberRole, updateMemberPassword, updateMemberInfo, deleteMember, performBackup, exportMembersToCSV, importMembersFromCSV, logoutUser, getClubs, saveClub, deleteClub } from '../services/storage';

export const MemberPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'register'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  
  // State for member data
  const [members, setMembers] = useState<Member[]>([]);
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);

  // Registration / My Info Form State
  const [regName, setRegName] = useState('');
  const [regBusiness, setRegBusiness] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState(''); 
  const [regClubs, setRegClubs] = useState<string[]>([]); // Selected Clubs

  // Password Reset Modal State
  const [resetTarget, setResetTarget] = useState<Member | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');

  // Info Edit Modal State (Admin or Self from List)
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    business: '', 
    phone: '', 
    email: '', 
    address: '', 
    joinedClubs: [] as string[],
    role: 'member' as UserRole,
    feePaidDate: ''
  });
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null); 
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Admin Club Management Modal
  const [isClubManageOpen, setIsClubManageOpen] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');

  // State for photo upload (Registration / My Info)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // CSV Import Ref
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Load members using Service Layer
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getMembers();
      setMembers(data);
      const clubsData = await getClubs();
      setAvailableClubs(clubsData);
    } catch (error) {
      console.error("Failed to load members/clubs", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setCurrentUser(getCurrentUser());

    // Listen for auth changes from Layout
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
      loadData();
    };
    window.addEventListener('auth-state-change', handleAuthChange);

    return () => {
      window.removeEventListener('auth-state-change', handleAuthChange);
    };
  }, []);

  // Sync "My Info" form when switching tabs or user changes
  useEffect(() => {
    if (activeTab === 'register' && currentUser) {
      // Pre-fill form with current user data
      setRegName(currentUser.name);
      setRegBusiness(currentUser.business || '');
      setRegPhone(currentUser.phone);
      setRegEmail(currentUser.email || '');
      setRegAddress(currentUser.address || '');
      setRegClubs(currentUser.joinedClubs || []);
      setRegPassword(''); // Keep password empty unless changing
      setPreviewUrl(currentUser.photoUrl || null);
    } else if (activeTab === 'register' && !currentUser) {
      // Clear form for new registration
      setRegName('');
      setRegBusiness('');
      setRegPhone('');
      setRegEmail('');
      setRegAddress('');
      setRegClubs([]);
      setRegPassword('');
      setPreviewUrl(null);
    }
  }, [activeTab, currentUser]);

  const handleClubSelection = (clubName: string, isEditingModal: boolean = false) => {
    const currentList = isEditingModal ? editForm.joinedClubs : regClubs;
    const setList = isEditingModal 
      ? (list: string[]) => setEditForm({...editForm, joinedClubs: list}) 
      : setRegClubs;

    if (currentList.includes(clubName)) {
      setList(currentList.filter(c => c !== clubName));
    } else {
      if (currentList.length >= 3) {
        alert("동아리는 최대 3개까지 가입할 수 있습니다.");
        return;
      }
      setList([...currentList, clubName]);
    }
  };

  const handleRegisterOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentUser) {
       // Update existing user (My Info)
       if (!regName || !regPhone) {
         alert("이름과 연락처는 필수 입력 항목입니다.");
         return;
       }
       setIsLoading(true);
       try {
         await updateMemberInfo(currentUser.id, {
           name: regName,
           business: regBusiness,
           phone: regPhone,
           email: regEmail,
           address: regAddress,
           joinedClubs: regClubs,
           photoUrl: previewUrl || undefined
         });
         
         if (regPassword) {
            await updateMemberPassword(currentUser.id, regPassword);
         }
         
         alert("회원 정보가 수정되었습니다.");
         await loadData();
       } catch(error) {
         console.error(error);
         alert("정보 수정 중 오류가 발생했습니다. (연결 상태를 확인해주세요)");
       } finally {
         setIsLoading(false);
       }
       
    } else {
      // New Registration
      if (!regName || !regPhone || !regPassword || !regEmail) {
        alert("이름, 연락처, 이메일, 비밀번호는 필수 입력 항목입니다.");
        return;
      }

      setIsLoading(true);
      try {
        await saveMember({
          name: regName,
          business: regBusiness || "일반 회원",
          phone: regPhone,
          email: regEmail,
          address: regAddress,
          joinedClubs: regClubs,
          password: regPassword, 
          photoUrl: previewUrl || undefined
        });

        // Clear Form
        setRegName('');
        setRegBusiness('');
        setRegPhone('');
        setRegEmail('');
        setRegAddress('');
        setRegClubs([]);
        setRegPassword('');
        setPreviewUrl(null);
        alert(`${regName}님, 회원 등록이 완료되었습니다! 로그인 해주세요.`);
        
        // Reload Data & Switch Tab
        await loadData();
        setActiveTab('search');
      } catch (error) {
        console.error(error);
        alert("회원 등록 중 오류가 발생했습니다. (연결 상태를 확인해주세요)");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelfDelete = async () => {
    if (!currentUser) return;
    
    const confirmMsg = `${currentUser.name}님, 정말로 탈퇴하시겠습니까?\n\n탈퇴 시 회원 정보가 삭제되며, 재가입 전까지 복구할 수 없습니다.`;
    if (!window.confirm(confirmMsg)) return;

    setIsLoading(true);
    try {
      await deleteMember(currentUser.id);
      
      // Perform logout
      logoutUser();
      
      // Update local state and notify layout
      setCurrentUser(null);
      window.dispatchEvent(new Event('auth-state-change'));
      
      alert("회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.");
      
      // Switch tab to search and reload data
      setActiveTab('search');
      await loadData();
      
    } catch (error) {
      console.error(error);
      alert("탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleUpdate = async (id: number, newRole: UserRole) => {
    setIsLoading(true);
    try {
      await updateMemberRole(id, newRole);
      await loadData();
      alert(`해당 회원의 권한이 '${ROLE_LABELS[newRole]}'(으)로 변경되었습니다.`);
    } catch (error) {
      alert("권한 변경 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Club Management Functions (Admin Only)
  const handleAddClub = async () => {
    if (!newClubName) return alert("동아리 이름을 입력하세요.");
    if (availableClubs.some(c => c.name === newClubName)) return alert("이미 존재하는 동아리입니다.");

    try {
      await saveClub({ name: newClubName, description: newClubDesc });
      setNewClubName('');
      setNewClubDesc('');
      const updatedClubs = await getClubs();
      setAvailableClubs(updatedClubs);
      alert("동아리가 성공적으로 추가되었습니다.");
    } catch(e) {
      alert("동아리 추가 실패");
    }
  };

  const handleDeleteClub = async (id: number) => {
    if (!confirm("이 동아리를 삭제하시겠습니까?")) return;
    try {
      await deleteClub(id);
      const updatedClubs = await getClubs();
      setAvailableClubs(updatedClubs);
      alert("동아리가 삭제되었습니다.");
    } catch(e) {
      alert("삭제 실패");
    }
  };

  // Password Reset Logic
  const openResetModal = (member: Member) => {
    setResetTarget(member);
    setNewResetPassword('');
  };

  const handlePasswordResetSave = async () => {
    if (!resetTarget || !newResetPassword) {
      alert("새로운 비밀번호를 입력해주세요.");
      return;
    }
    
    setIsLoading(true);
    try {
      await updateMemberPassword(resetTarget.id, newResetPassword);
      alert(`${resetTarget.name}님의 비밀번호가 변경되었습니다.`);
      setResetTarget(null);
      setNewResetPassword('');
    } catch (error) {
      alert("비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Info Edit Modal Logic (Admin or Self via list)
  const openEditModal = (member: Member) => {
    setEditTarget(member);
    setEditForm({
      name: member.name,
      business: member.business || '',
      phone: member.phone,
      email: member.email || '',
      address: member.address || '',
      joinedClubs: member.joinedClubs || [],
      role: member.role || 'member',
      feePaidDate: member.feePaidDate || ''
    });
    setEditPreviewUrl(member.photoUrl || null);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!editForm.name || !editForm.phone) {
      alert("이름과 연락처는 필수입니다.");
      return;
    }

    setIsLoading(true);
    try {
      await updateMemberInfo(editTarget.id, {
        name: editForm.name,
        business: editForm.business,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        joinedClubs: editForm.joinedClubs,
        role: editForm.role,
        feePaidDate: editForm.feePaidDate,
        photoUrl: editPreviewUrl || undefined
      });
      alert("정보가 수정되었습니다.");
      setEditTarget(null);
      await loadData();
    } catch (error) {
      alert("정보 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handling file changes inside Edit Modal
  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete Member Logic (Admin)
  const handleDeleteMember = async (member: Member) => {
    if (!confirm(`${member.name} 님의 정보를 삭제하시겠습니까?\n삭제된 정보는 보관함(Archive)으로 이동되며 목록에서 사라집니다.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteMember(member.id);
      alert("회원 정보가 삭제 및 보관되었습니다.");
      await loadData();
    } catch (error) {
      alert("회원 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackup = () => {
    const success = performBackup();
    if (success) {
      alert("데이터베이스 백업 파일이 다운로드 되었습니다.\n안전한 곳에 보관하세요.");
    } else {
      alert("백업 생성 중 오류가 발생했습니다.");
    }
  };

  // CSV Export
  const handleCSVExport = async () => {
    const success = await exportMembersToCSV();
    if (!success) {
      alert("CSV 내보내기에 실패했습니다.");
    }
  };

  // CSV Import
  const handleCSVImportClick = () => {
    csvInputRef.current?.click();
  };

  const handleCSVFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert("CSV 파일만 업로드 가능합니다.");
      return;
    }

    if (!confirm("선택한 CSV 파일의 회원 정보를 가져오시겠습니까?\n기존 명단에 추가됩니다.")) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (text) {
        setIsLoading(true);
        try {
          const count = await importMembersFromCSV(text);
          alert(`${count}명의 회원 정보가 성공적으로 추가되었습니다.`);
          await loadData();
        } catch (error) {
          alert("CSV 가져오기 중 오류가 발생했습니다. 파일 형식을 확인해주세요.");
        } finally {
          setIsLoading(false);
          if (csvInputRef.current) csvInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file); 
  };

  // Filter and SORT members alphabetically
  const filteredMembers = members
    .filter(m => 
      m.name.includes(searchTerm) || (m.business && m.business.includes(searchTerm))
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const canViewDetails = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role !== 'reader';
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="bg-softWhite min-h-screen pb-20">
      <div className="bg-royalBlue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">회원 명단 / 정보 관리</h1>
          <p className="text-xl md:text-2xl opacity-90">
            소중한 이웃을 찾고, 나의 정보를 등록하세요.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-8">
        {/* Tabs */}
        <div className="flex rounded-t-xl overflow-hidden shadow-lg bg-white">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-6 text-xl font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'search' 
                ? 'bg-white text-royalBlue border-b-4 border-royalBlue' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Search size={24} />
            회원 검색
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-6 text-xl font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'register' 
                ? 'bg-white text-royalBlue border-b-4 border-royalBlue' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {currentUser ? <Settings size={24} /> : <UserPlus size={24} />}
            {currentUser ? "내 정보 등록/수정" : "내 정보 등록"}
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white p-8 md:p-12 shadow-lg rounded-b-xl min-h-[500px] relative">
          
          {isLoading && !resetTarget && !editTarget && (
            <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-sm rounded-b-xl">
              <div className="flex flex-col items-center">
                <Loader2 size={48} className="text-royalBlue animate-spin mb-4" />
                <p className="text-xl font-bold text-gray-600">데이터를 처리 중입니다...</p>
              </div>
            </div>
          )}

          {/* SEARCH TAB */}
          {activeTab === 'search' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4 mb-10">
                <div className="flex-grow relative">
                  <input
                    type="text"
                    placeholder="이름 또는 업종을 입력하세요"
                    className="w-full pl-12 pr-4 py-4 text-xl border-2 border-gray-300 rounded-lg focus:border-royalBlue outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                </div>
                <div className="flex flex-wrap gap-2">
                   <Button onClick={loadData}>새로고침</Button>
                   {isAdmin && (
                     <>
                        <Button 
                          variant="secondary" 
                          onClick={() => setIsClubManageOpen(true)}
                          className="px-4"
                          title="동아리 목록 추가/수정"
                        >
                          <Users size={20} className="mr-2"/> 동아리 관리
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={handleBackup}
                          title="데이터베이스 백업 다운로드"
                          className="px-4"
                        >
                          <Database size={20} className="mr-2"/> DB 백업
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleCSVExport}
                          title="회원 명단을 엑셀(CSV) 파일로 저장"
                          className="px-3"
                        >
                          <FileDown size={20} className="mr-1"/> CSV 내보내기
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleCSVImportClick}
                          title="CSV 파일에서 회원 불러오기"
                          className="px-3"
                        >
                          <FileUp size={20} className="mr-1"/> CSV 가져오기
                        </Button>
                        {/* Hidden CSV Input */}
                        <input 
                          type="file" 
                          accept=".csv" 
                          ref={csvInputRef} 
                          className="hidden" 
                          onChange={handleCSVFileChange} 
                        />
                     </>
                   )}
                </div>
              </div>

              {/* Login/Permission Notice */}
              {!canViewDetails && (
                <div className={`border rounded-lg p-6 mb-8 flex items-start gap-4 ${currentUser ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                  {currentUser ? (
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={28} />
                  ) : (
                    <Lock className="text-warmOrange flex-shrink-0 mt-1" size={28} />
                  )}
                  <div>
                    <h3 className={`text-xl font-bold mb-1 ${currentUser ? 'text-red-600' : 'text-warmOrange'}`}>
                      {!currentUser ? "로그인이 필요합니다" : "권한이 부족합니다"}
                    </h3>
                    <p className="text-lg text-gray-700">
                      {!currentUser 
                        ? "상세한 연락처와 정보는 정회원 로그인 후에만 확인하실 수 있습니다."
                        : "현재 회원님의 등급은 '독자(Reader)'입니다. 상세 정보를 열람하려면 관리자에게 등급 조정을 요청하세요."}
                    </p>
                  </div>
                </div>
              )}

              {/* List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMembers.map(member => (
                  <div key={member.id} className="border-2 border-gray-100 p-6 rounded-xl hover:border-blue-200 transition-colors relative">
                    <div className="flex items-center gap-4 mb-4">
                      {/* Photo or Icon Display */}
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-sm">
                         {member.photoUrl ? (
                           <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                         ) : (
                           member.role === 'admin' ? <Shield size={30} className="text-royalBlue"/> : <User size={30} className="text-gray-500" />
                         )}
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                           <h4 className="text-2xl font-bold text-gray-900">{member.name}</h4>
                           
                           {/* Role Badge */}
                           {member.role && (
                                 <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                   member.role === 'admin' ? 'bg-black text-white' :
                                   member.role === 'officer' ? 'bg-royalBlue text-white' :
                                   member.role === 'editor' ? 'bg-purple-100 text-purple-700' :
                                   member.role === 'reader' ? 'bg-gray-100 text-gray-500' :
                                   'bg-green-100 text-green-700'
                                 }`}>
                                   {ROLE_LABELS[member.role] || member.role}
                                 </span>
                           )}
                           
                           <div className="flex items-center gap-2 ml-auto sm:ml-2">
                               {/* Action Buttons: Admin OR Self */}
                               {(isAdmin || currentUser?.id === member.id) && (
                                 <div className="flex items-center gap-2">
                                   {/* Edit Member Info Button */}
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); openEditModal(member); }}
                                     className="bg-gray-100 p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-royalBlue transition-colors border border-gray-200"
                                     title="정보 수정"
                                   >
                                     <Edit3 size={16} />
                                   </button>
                                   
                                   {/* Password Reset Button */}
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); openResetModal(member); }}
                                     className="bg-gray-100 p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-royalBlue transition-colors border border-gray-200"
                                     title="비밀번호 변경"
                                   >
                                     <Key size={16} />
                                   </button>

                                   {/* Delete Member Button */}
                                   {isAdmin && (
                                     <button 
                                       onClick={(e) => { 
                                          e.stopPropagation(); 
                                          if (currentUser.id === member.id) {
                                             handleSelfDelete();
                                          } else {
                                             handleDeleteMember(member); 
                                          }
                                       }}
                                       className="bg-red-50 p-1.5 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors border border-red-100"
                                       title={currentUser.id === member.id ? "회원 탈퇴" : "회원 삭제 (보관함 이동)"}
                                     >
                                       <Trash2 size={16} />
                                     </button>
                                   )}
                                 </div>
                               )}
                           </div>
                        </div>
                        <p className="text-xl text-royalBlue font-medium">{member.business || "일반 회원"}</p>
                      </div>
                    </div>
                    
                    {/* Fee Payment Status (Visible for Admins or Self) */}
                    {(isAdmin || currentUser?.id === member.id) && member.feePaidDate && (
                      <div className="mb-4 flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded border border-green-100">
                         <CreditCard size={14} /> 회비 납부일: {member.feePaidDate}
                      </div>
                    )}

                    {/* Display Joined Clubs */}
                    {member.joinedClubs && member.joinedClubs.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                             {member.joinedClubs.map((club, idx) => (
                                 <span key={idx} className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-bold border border-purple-100">
                                   {club}
                                 </span>
                             ))}
                        </div>
                    )}

                    <div className="text-lg text-gray-500 border-t pt-4">
                      {canViewDetails ? (
                         <div className="space-y-1">
                           <div className="flex items-center gap-2">
                             <span className="font-bold text-gray-700 w-16">연락처:</span> {member.phone}
                           </div>
                           {member.email && (
                             <div className="flex items-center gap-2">
                               <span className="font-bold text-gray-700 w-16">이메일:</span> {member.email}
                             </div>
                           )}
                            {member.address && (
                             <div className="flex items-center gap-2">
                               <span className="font-bold text-gray-700 w-16">주소:</span> {member.address}
                             </div>
                           )}
                           {isAdmin && member.createdAt && (
                             <div className="flex items-center gap-2 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                               <span>가입일: {new Date(member.createdAt).toLocaleDateString()}</span>
                             </div>
                           )}
                         </div>
                      ) : (
                         <span className="flex items-center gap-2 text-gray-400">
                           <Lock size={16} /> 연락처 비공개
                         </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredMembers.length === 0 && !isLoading && (
                  <div className="col-span-1 md:col-span-2 text-center py-12 text-gray-500">
                    검색 결과가 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REGISTER / MY INFO TAB */}
          {activeTab === 'register' && (
            <div className="animate-fade-in max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">{currentUser ? "내 정보 수정" : "내 정보 등록"}</h2>
              
              {currentUser && (
                 <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 text-center">
                   회원님의 현재 등록된 정보를 불러왔습니다. 수정 후 저장 버튼을 눌러주세요.
                 </div>
              )}

              <form className="space-y-2" onSubmit={handleRegisterOrUpdate}>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                     <InputField 
                       label="이름 (한글) *" 
                       placeholder="예: 홍길동" 
                       value={regName}
                       onChange={(e) => setRegName(e.target.value)}
                       required
                     />
                  </div>
                  <div className="flex-1">
                     <InputField 
                       label={currentUser ? "비밀번호 변경 (선택)" : "비밀번호 설정 *"} 
                       placeholder={currentUser ? "변경시에만 입력하세요" : "비밀번호"} 
                       type="password" 
                       value={regPassword}
                       onChange={(e) => setRegPassword(e.target.value)}
                       required={!currentUser}
                     />
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <InputField 
                      label="업종/직업" 
                      placeholder="예: 부동산, 식당, 은퇴" 
                      value={regBusiness}
                      onChange={(e) => setRegBusiness(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <InputField 
                      label="연락처 *" 
                      placeholder="010-0000-0000" 
                      type="tel" 
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                
                <InputField 
                  label="이메일 주소 *" 
                  placeholder="example@email.com (로그인 ID로 사용됩니다)" 
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
                
                <div>
                  <InputField 
                    label="주소" 
                    placeholder="도시, 주 (예: Laguna Woods, CA 92637)" 
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                  />
                  <p className="text-sm text-royalBlue -mt-4 mb-6 ml-1 font-bold">
                    ※ Laguna Woods (92637) 거주 시 정회원으로 등급이 조정됩니다.
                  </p>
                </div>
                
                {/* Club Selection Section */}
                <div className="mb-6">
                   <label className="block mb-2 text-xl font-bold text-gray-800">
                      관심 동아리 가입 (최대 3개)
                   </label>
                   <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {availableClubs.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                           {availableClubs.map(club => {
                             const isSelected = regClubs.includes(club.name);
                             return (
                               <button
                                 key={club.id}
                                 type="button"
                                 onClick={() => handleClubSelection(club.name)}
                                 className={`px-3 py-2 rounded-full text-sm font-bold transition-colors border ${
                                   isSelected 
                                    ? 'bg-royalBlue text-white border-royalBlue shadow-sm' 
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-royalBlue'
                                 }`}
                               >
                                 {club.name} {isSelected && <Check size={14} className="inline ml-1"/>}
                               </button>
                             );
                           })}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">등록된 동아리가 없습니다.</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2 text-right">
                         선택됨: {regClubs.length} / 3
                      </p>
                   </div>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 text-xl font-bold text-gray-800">
                    프로필 사진
                  </label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div 
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center ${previewUrl ? 'border-royalBlue bg-blue-50' : ''}`}
                  >
                    {previewUrl ? (
                      <div className="relative group">
                        <img 
                          src={previewUrl} 
                          alt="Profile Preview" 
                          className="w-40 h-40 object-cover rounded-full shadow-md border-4 border-white" 
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 focus:outline-none"
                          title="사진 삭제"
                        >
                          <X size={20} />
                        </button>
                        <p className="mt-4 text-royalBlue font-medium">사진을 변경하려면 클릭하세요</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                          <Camera size={40} className="text-gray-400" />
                        </div>
                        <p className="text-lg text-gray-500 font-medium">
                          여기를 클릭하여 사진을 올려주세요.
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          (JPG, PNG 파일 지원)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <InputField label="간단한 자기소개" isTextArea placeholder="이웃들에게 하고 싶은 말을 적어주세요." rows={4} />

                <div className="pt-6 space-y-4">
                  <Button size="lg" className="w-full flex items-center justify-center gap-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Check size={24} />}
                    {currentUser ? "수정 내용 저장하기" : "정보 저장하기"}
                  </Button>
                  
                  {currentUser && (
                    <button 
                      type="button"
                      onClick={handleSelfDelete}
                      className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <Trash2 size={20} />
                      회원 탈퇴 (계정 삭제)
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ADMIN CLUB MANAGEMENT MODAL */}
      {isClubManageOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
              <div className="p-6 bg-royalBlue text-white flex justify-between items-center">
                 <h2 className="text-xl font-bold flex items-center gap-2">
                   <Users size={20} /> 동아리 목록 관리
                 </h2>
                 <button 
                   onClick={() => setIsClubManageOpen(false)}
                   className="p-2 hover:bg-white/20 rounded-full transition-colors"
                 >
                   <X size={24} />
                 </button>
              </div>
              <div className="p-6">
                 {/* Add New */}
                 <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                       <PlusCircle size={16}/> 새 동아리 추가
                    </h3>
                    <div className="flex gap-2 mb-2">
                       <input 
                         className="flex-1 p-2 border border-gray-300 rounded focus:border-royalBlue outline-none"
                         placeholder="동아리 이름 (예: 바둑)"
                         value={newClubName}
                         onChange={(e) => setNewClubName(e.target.value)}
                       />
                       <Button size="md" className="py-2 px-4" onClick={handleAddClub}>추가</Button>
                    </div>
                    <input 
                       className="w-full p-2 border border-gray-300 rounded focus:border-royalBlue outline-none text-sm"
                       placeholder="설명 (선택사항)"
                       value={newClubDesc}
                       onChange={(e) => setNewClubDesc(e.target.value)}
                    />
                 </div>

                 {/* List */}
                 <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {availableClubs.map(club => (
                       <div key={club.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded shadow-sm">
                          <div>
                             <p className="font-bold text-gray-800">{club.name}</p>
                             {club.description && <p className="text-xs text-gray-500">{club.description}</p>}
                          </div>
                          <button 
                            onClick={() => handleDeleteClub(club.id)}
                            className="text-red-400 hover:text-red-600 p-2"
                            title="삭제"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    ))}
                    {availableClubs.length === 0 && <p className="text-center text-gray-500 py-4">등록된 동아리가 없습니다.</p>}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {resetTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 bg-royalBlue text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Key size={20} /> 비밀번호 변경
              </h2>
              <button 
                onClick={() => setResetTarget(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8">
              <p className="text-gray-600 text-lg mb-6">
                <span className="font-bold text-royalBlue">{resetTarget.name}</span> 님의 새로운 비밀번호를 입력해주세요.
              </p>

              <InputField 
                label="새 비밀번호" 
                placeholder="새로운 비밀번호 입력"
                type="password"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
              />

              <div className="flex gap-4 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setResetTarget(null)}
                >
                  취소
                </Button>
                <Button 
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={handlePasswordResetSave}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                  변경 저장
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEMBER INFO MODAL */}
      {editTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            <div className="p-6 bg-royalBlue text-white flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit3 size={20} /> 정보 수정
              </h2>
              <button 
                onClick={() => setEditTarget(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-4 overflow-y-auto">
              {isAdmin && currentUser?.id !== editTarget.id && (
                 <p className="text-gray-600 mb-4 bg-gray-100 p-2 rounded text-sm font-bold border-l-4 border-royalBlue">
                   관리자 권한으로 회원 정보를 수정합니다.
                 </p>
              )}
              
              {/* Photo Upload in Edit Modal */}
              <div className="flex justify-center mb-6">
                 <input 
                    type="file" 
                    ref={editFileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleEditFileChange}
                  />
                  <div 
                    onClick={() => editFileInputRef.current?.click()}
                    className="relative cursor-pointer group"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-md">
                       {editPreviewUrl ? (
                         <img src={editPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                           <Camera size={32} />
                         </div>
                       )}
                    </div>
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white" size={24} />
                    </div>
                  </div>
              </div>

              {/* Core Info Group */}
              <div className="grid grid-cols-2 gap-4">
                 <InputField 
                    label="이름" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                 />
                 <InputField 
                    label="업종/직업" 
                    value={editForm.business}
                    onChange={(e) => setEditForm({...editForm, business: e.target.value})}
                 />
              </div>

              {/* Admin-only Section: Role and Fee */}
              <div className="bg-softWhite p-4 rounded-xl space-y-4 border border-gray-200 shadow-inner">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block mb-2 text-lg font-bold text-gray-800 flex items-center gap-1">
                           <Shield size={16} className="text-royalBlue"/> 회원 등급
                        </label>
                        <select 
                           value={editForm.role}
                           onChange={(e) => setEditForm({...editForm, role: e.target.value as UserRole})}
                           disabled={!isAdmin}
                           className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-royalBlue outline-none bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400 font-bold"
                        >
                           {Object.entries(ROLE_LABELS).map(([key, label]) => (
                             <option key={key} value={key}>{label}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="block mb-2 text-lg font-bold text-gray-800 flex items-center gap-1">
                           <CreditCard size={16} className="text-royalBlue"/> 회비 납부일
                        </label>
                        <input 
                           type="date"
                           value={editForm.feePaidDate}
                           onChange={(e) => setEditForm({...editForm, feePaidDate: e.target.value})}
                           disabled={!isAdmin}
                           className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-royalBlue outline-none bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400 font-bold"
                        />
                     </div>
                  </div>
              </div>

              <InputField 
                label="연락처" 
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
              />
              <InputField 
                label="이메일" 
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
              <InputField 
                label="주소" 
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
              />

              {/* Edit Clubs */}
              <div>
                  <label className="block mb-2 text-lg font-bold text-gray-800">동아리 가입 현황</label>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 flex flex-wrap gap-2">
                       {availableClubs.map(club => {
                         const isSelected = editForm.joinedClubs.includes(club.name);
                         return (
                           <button
                             key={club.id}
                             type="button"
                             onClick={() => handleClubSelection(club.name, true)}
                             className={`px-2 py-1 rounded text-xs font-bold transition-colors border ${
                               isSelected 
                                ? 'bg-royalBlue text-white border-royalBlue' 
                                : 'bg-white text-gray-600 border-gray-300'
                             }`}
                           >
                             {club.name}
                           </button>
                         );
                       })}
                  </div>
              </div>

              <div className="flex gap-4 mt-8 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setEditTarget(null)}
                >
                  취소
                </Button>
                <Button 
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={handleEditSave}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                  수정 완료
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};