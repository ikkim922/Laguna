import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Send, Edit3, Check, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { ContactData, Member } from '../types';
import { getContactData, saveContactData, getCurrentUser } from '../services/storage';

export const Contact: React.FC = () => {
  const [data, setData] = useState<ContactData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ContactData | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);

  useEffect(() => {
    loadData();
    setCurrentUser(getCurrentUser());
    const handleAuthChange = () => setCurrentUser(getCurrentUser());
    window.addEventListener('auth-state-change', handleAuthChange);
    return () => window.removeEventListener('auth-state-change', handleAuthChange);
  }, []);

  const loadData = async () => {
    const fetchedData = await getContactData();
    setData(fetchedData);
    setEditForm(fetchedData);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm(data);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editForm) return;
    if (confirm("연락처 정보를 저장하시겠습니까?")) {
      setIsLoading(true);
      try {
        await saveContactData(editForm);
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

  const handleChange = (field: keyof ContactData, value: string) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { handleChange('mapImageUrl', reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name.trim() || !inquiryForm.message.trim()) {
      alert("성함과 문의 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/email/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inquiryForm,
          admin_email: data?.email
        })
      });

      if (response.ok) {
        alert(`문의가 성공적으로 접수되었습니다.\n\n빠른 시일 내에 답변 드리겠습니다.`);
        setInquiryForm({ name: '', email: '', phone: '', message: '' });
      } else {
        throw new Error("Failed to send inquiry");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      alert(`문의 전송 중 오류가 발생했습니다. 관리자에게 직접 연락 부탁드립니다.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!data || !editForm) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-royalBlue" size={40}/></div>;

  return (
    <div className="bg-softWhite pb-20 relative">
      <div className="bg-gray-800 text-white py-16 relative">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">문의하기</h1>
          <p className="text-xl md:text-2xl opacity-90">궁금한 점이 있으시면 언제든 연락주세요.</p>
        </div>
        {currentUser?.role === 'admin' && (
          <div className="absolute top-4 right-4 md:top-8 md:right-8">
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
              <button onClick={handleEditToggle} className="bg-white text-royalBlue px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-50 flex items-center gap-2">
                <Edit3 size={18} /> 정보 수정
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-12">
            <div className={`bg-white p-8 rounded-xl shadow-md ${isEditing ? 'border-2 border-royalBlue border-dashed' : ''}`}>
              <h2 className="text-2xl font-bold mb-8 text-royalBlue border-b pb-4">연락처 정보</h2>
              <ul className="space-y-8">
                <li className="flex items-start gap-6">
                  <div className="bg-blue-100 p-3 rounded-full shrink-0"><MapPin size={32} className="text-royalBlue" /></div>
                  <div className="w-full">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">주소</h3>
                    {isEditing ? <textarea className="w-full p-2 border border-gray-300 rounded text-lg focus:border-royalBlue outline-none" value={editForm.address} onChange={(e) => handleChange('address', e.target.value)} rows={3} /> : <p className="text-xl text-gray-600 whitespace-pre-wrap">{data.address}</p>}
                  </div>
                </li>
                <li className="flex items-start gap-6">
                  <div className="bg-orange-100 p-3 rounded-full shrink-0"><Phone size={32} className="text-warmOrange" /></div>
                  <div className="w-full">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">전화번호</h3>
                    {isEditing ? <input className="w-full p-2 border border-gray-300 rounded text-lg focus:border-royalBlue outline-none" value={editForm.phone} onChange={(e) => handleChange('phone', e.target.value)} /> : <p className="text-xl text-gray-600">{data.phone}</p>}
                  </div>
                </li>
                <li className="flex items-start gap-6">
                  <div className="bg-green-100 p-3 rounded-full shrink-0"><Mail size={32} className="text-green-600" /></div>
                  <div className="w-full">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">이메일</h3>
                    {isEditing ? <input className="w-full p-2 border border-gray-300 rounded text-lg focus:border-royalBlue outline-none" value={editForm.email} onChange={(e) => handleChange('email', e.target.value)} /> : <p className="text-xl text-gray-600">{data.email}</p>}
                  </div>
                </li>
              </ul>
            </div>
            <div className={`bg-white p-2 rounded-xl shadow-md overflow-hidden relative group ${isEditing ? 'border-2 border-royalBlue border-dashed pb-14' : 'h-80'}`}>
               {isEditing && (
                 <div className="p-4 bg-gray-50 border-b border-gray-200 mb-2 space-y-3">
                   <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-300 px-3 py-1 rounded shadow-sm hover:bg-gray-50">
                     <ImageIcon size={18} className="text-royalBlue" /> <span className="text-sm font-bold">지도 이미지 업로드</span>
                     <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                   </label>
                   <input className="w-full p-2 border border-gray-300 rounded text-sm focus:border-royalBlue outline-none" value={editForm.mapImageUrl} onChange={(e) => handleChange('mapImageUrl', e.target.value)} placeholder="또는 이미지 URL 입력..." />
                 </div>
               )}
               <div className={isEditing ? 'h-64' : 'h-full'}><img src={editForm.mapImageUrl} alt="Map Location" className="w-full h-full object-cover rounded-lg" /></div>
            </div>
          </div>
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">문의 내용 보내기</h2>
            <p className="text-lg text-gray-600 mb-8">아래 양식을 작성해 주시면 확인 후 빠른 시일 내에 답변 드리겠습니다.</p>
            <form className="space-y-2" onSubmit={handleContactSubmit}>
              <InputField label="성함 *" placeholder="홍길동" value={inquiryForm.name} onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})} />
              <InputField label="이메일" placeholder="contact@email.com" type="email" value={inquiryForm.email} onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})} />
              <InputField label="연락처" placeholder="010-0000-0000" type="tel" value={inquiryForm.phone} onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})} />
              <InputField label="문의 내용 *" isTextArea placeholder="궁금하신 내용을 자세히 적어주세요." rows={6} value={inquiryForm.message} onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})} />
              <div className="pt-4">
                <Button size="lg" className="w-full flex justify-center items-center gap-2" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={24} className="animate-spin" /> 전송 중...</> : <><Send size={24} /> 보내기</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};