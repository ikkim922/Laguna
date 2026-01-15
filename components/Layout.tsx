import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, User, LogIn, LogOut, Database, Cloud, HardDrive, Mail } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import { LoginModal } from './LoginModal';
import { getCurrentUser, logoutUser, needsAutoBackup, performBackup, initializeDefaultData } from '../services/storage';
import { Member } from '../types';
import { isSupabaseConfigured } from '../supabase'; 

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const isBackendActive = isSupabaseConfigured;

  useEffect(() => {
    // Initialize default admin if not exists
    initializeDefaultData();

    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Auto Backup Check for Admins on Sundays
    if (user?.role === 'admin' && needsAutoBackup()) {
      setTimeout(() => {
        if (confirm("📢 [자동 백업 알림]\n\n오늘은 일요일입니다. 정기 데이터 백업을 진행하시겠습니까?\n'확인'을 누르면 데이터 파일이 다운로드됩니다.")) {
          const success = performBackup();
          if (success) alert("백업이 완료되었습니다.");
        }
      }, 1000);
    }
    
    const handleAuthChange = () => {
      const updatedUser = getCurrentUser();
      setCurrentUser(updatedUser);
      if (updatedUser?.role === 'admin' && needsAutoBackup()) {
         if (confirm("📢 [자동 백업 알림]\n\n오늘은 일요일입니다. 정기 데이터 백업을 진행하시겠습니까?\n'확인'을 누르면 데이터 파일이 다운로드됩니다.")) {
            performBackup();
         }
      }
    };
    
    window.addEventListener('auth-state-change', handleAuthChange);

    return () => {
      window.removeEventListener('auth-state-change', handleAuthChange);
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLoginSuccess = (user: Member) => {
    setCurrentUser(user);
    window.dispatchEvent(new Event('auth-state-change'));
    alert(`${user.name}님, 환영합니다!`);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    window.dispatchEvent(new Event('auth-state-change'));
    setIsMenuOpen(false);
    alert("로그아웃 되었습니다.");
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-softWhite">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <NavLink to="/" className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-royalBlue">라구나 한인들</span>
              </NavLink>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `text-lg font-medium px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'text-royalBlue bg-blue-50 font-bold'
                        : 'text-gray-600 hover:text-royalBlue hover:bg-gray-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              
              <div className="pl-4 ml-4 border-l-2 border-gray-200">
                {currentUser ? (
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-bold transition-colors"
                  >
                    <User size={20} className="text-royalBlue" />
                    <span>{currentUser.name}님</span>
                    <LogOut size={20} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center gap-2 text-royalBlue hover:text-blue-800 font-bold transition-colors"
                  >
                    <LogIn size={20} />
                    로그인
                  </button>
                )}
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="p-3 rounded-md text-gray-600 hover:text-royalBlue hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-royalBlue"
                aria-expanded={isMenuOpen}
                aria-label="메뉴 열기"
              >
                {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-4 rounded-md text-xl font-medium ${
                      isActive
                        ? 'bg-blue-50 text-royalBlue font-bold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-royalBlue'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              
              <div className="border-t border-gray-100 mt-2 pt-2">
                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-4 text-red-600 text-xl font-bold hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={24} />
                    {currentUser.name}님 (로그아웃)
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsMenuOpen(false); setIsLoginModalOpen(true); }}
                    className="w-full text-left px-4 py-4 text-royalBlue text-xl font-bold hover:bg-blue-50 flex items-center gap-2"
                  >
                    <LogIn size={24} />
                    로그인
                  </button>
                )}
              </div>

              {!currentUser && (
                <div className="pt-2 pb-2 mt-2 px-2">
                  <NavLink
                    to="/members"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center px-4 py-4 bg-warmOrange text-white text-xl font-bold rounded-lg shadow-sm"
                  >
                    회원 가입하기
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-darkGray text-white pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="text-2xl font-bold mb-4">라구나 한인들</h3>
              <p className="text-gray-300 text-lg">
                지역 사회의 화합과 발전을 위해<br />
                언제나 여러분 곁에 있겠습니다.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">바로가기</h3>
              <ul className="space-y-3 text-lg">
                <li><NavLink to="/about" className="hover:text-warmOrange">한인들 소개</NavLink></li>
                <li><NavLink to="/board" className="hover:text-warmOrange">공지사항</NavLink></li>
                <li><NavLink to="/members" className="hover:text-warmOrange">회원 찾기</NavLink></li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">문의하기</h3>
              <ul className="space-y-3 text-lg text-gray-300">
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <Phone size={20} className="text-warmOrange" />
                  949-229-3315
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <Mail size={20} className="text-warmOrange" />
                  ikkim922@gmail.com
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <User size={20} className="text-warmOrange" />
                  Laguna Hills, CA 92653
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
            <div className="text-gray-400 text-base">
              &copy; {new Date().getFullYear()} Laguna Korean Association. All rights reserved.
            </div>
            
            {/* Database Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gray-800 border border-gray-700 shadow-inner">
               <Database size={14} className={isBackendActive ? "text-green-500" : "text-yellow-500"} />
               <span className="text-gray-400">Backend:</span>
               {isBackendActive ? (
                 <span className="flex items-center gap-1 text-green-400">
                   <Cloud size={12} /> Supabase (Live)
                 </span>
               ) : (
                 <span className="flex items-center gap-1 text-yellow-400">
                   <HardDrive size={12} /> Local Storage (Offline)
                 </span>
               )}
            </div>
          </div>
        </div>
      </footer>

      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};