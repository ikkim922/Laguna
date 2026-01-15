import React, { useState } from 'react';
import { X, Lock, LogIn } from 'lucide-react';
import { Button } from './Button';
import { InputField } from './InputField';
import { loginUser } from '../services/storage';
import { Member } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Member) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await loginUser(email, password);
      if (user) {
        onLoginSuccess(user);
        onClose();
      } else {
        alert("이메일이 등록되지 않았거나 비밀번호가 틀렸습니다.");
      }
    } catch (error) {
      alert("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="p-6 bg-royalBlue text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lock size={24} /> 로그인
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 text-lg">이메일 주소와 비밀번호를<br/>입력해주세요.</p>
          </div>

          <InputField 
            label="이메일" 
            placeholder="이메일을 입력해주세요"
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <InputField 
            label="비밀번호" 
            type="password" 
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button className="w-full flex justify-center items-center gap-2 text-lg" disabled={isLoading}>
            <LogIn size={20} />
            {isLoading ? '확인 중...' : '로그인하기'}
          </Button>
        </form>
      </div>
    </div>
  );
};