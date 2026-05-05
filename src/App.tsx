/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Save, Lock, Smartphone, ExternalLink } from 'lucide-react';

// 기본 시트 ID (사용자가 변경하기 전 초기값)
const DEFAULT_SHEET_ID = '1QqSt9KQ4jpI-ERUEFPh03RaJ1ZO96_JejOKT-wQ3f18';

const BUTTON_COLORS = [
  '#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', 
  '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF'
];

export default function App() {
  // 관리자 및 설정 관련 상태
  const [sheetId, setSheetId] = useState(() => {
    // 로컬 스토리지에서 저장된 ID가 있으면 가져오고, 없으면 기본값 사용
    if (typeof window !== 'undefined') {
      return localStorage.getItem('teacher_sheet_id') || DEFAULT_SHEET_ID;
    }
    return DEFAULT_SHEET_ID;
  });
  
  const [isPasswordInputOpen, setIsPasswordInputOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [tempSheetId, setTempSheetId] = useState(sheetId);
  const [passwordError, setPasswordError] = useState(false);

  // 데이터 로딩 관련 상태
  const [teachers, setTeachers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 기타 UI 상태
  const [activeTeacher, setActiveTeacher] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 시계 기능: 1초마다 시간 갱신
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 구글 시트에서 선생님 목록 가져오기 로직
  const fetchTeachers = useCallback(async (currentId: string) => {
    // 캐시 방지를 위해 타임스탬프 추가 (?t=Date.now())
    const SHEET_URL = `https://docs.google.com/spreadsheets/d/${currentId}/export?format=csv&t=${Date.now()}`;
    
    try {
      setIsLoading(true);
      const response = await fetch(SHEET_URL);
      if (!response.ok) throw new Error('데이터를 불러오지 못했습니다. 시트 ID를 확인해주세요.');
      
      const csvText = await response.text();
      
      // csv 텍스트 파싱: 줄바꿈으로 나누기 -> 첫 번째 열(A열) 가져오기 -> A2부터 시작(slice(1))
      const rows = csvText.split(/\r?\n/);
      const parsedTeachers = rows
        .slice(1) // 첫 줄은 제목이므로 제외
        .map(row => row.split(',')[0].replace(/"/g, '').trim())
        .filter(name => name); // 이름이 있는 것만 필터링

      setTeachers(parsedTeachers);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('목록을 불러오는 중 오류가 발생했습니다. 관리자 모드에서 시트 주소를 확인하세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 시트 ID가 바뀔 때마다 데이터를 다시 가져옵니다.
  useEffect(() => {
    fetchTeachers(sheetId);
  }, [sheetId, fetchTeachers]);

  // 선생님 이름 가나다순 정렬
  const sortedTeachers = useMemo(() => [...teachers].sort((a, b) => a.localeCompare(b, 'ko')), [teachers]);

  // 호출 버튼 클릭 처리
  const callTeacher = useCallback((name: string) => {
    setActiveTeacher(name);

    // 음성 안내 (TTS)
    const message = `${name} 선생님! 학생 호출이 있습니다.`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);

    // 3.5초 후 호출 알림창 닫기
    setTimeout(() => {
      setActiveTeacher(null);
    }, 3500);
  }, []);

  // 관리자 비밀번호 확인
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === '1234') {
      setIsPasswordInputOpen(false);
      setIsAdminPanelOpen(true);
      setPasswordError(false);
      setInputPassword('');
    } else {
      setPasswordError(true);
      setInputPassword('');
      // 2초 뒤 에러 보이기 상태 초기화
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  // 시트 ID 저장 및 데이터 강제 갱신
  const handleSaveConfig = () => {
    if (!tempSheetId.trim()) return;
    
    // 로컬 스토리지에 저장
    localStorage.setItem('teacher_sheet_id', tempSheetId.trim());
    setSheetId(tempSheetId.trim());
    
    // 상태가 같더라도 강제로 다시 데이터를 가져오기 위해 직접 호출
    fetchTeachers(tempSheetId.trim());
    
    setIsAdminPanelOpen(false);
  };

  const formatTime = (date: Date) => {
    return date.toTimeString().split(' ')[0];
  };

  return (
    <div className="h-screen w-full flex flex-col relative bg-vibrant-bg overflow-hidden select-none">
      {/* 헤더 섹션 */}
      <header className="min-h-[6rem] md:h-24 bg-vibrant-header flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-4 md:py-0 shadow-sm border-b-4 border-vibrant-header-border shrink-0 gap-4 md:gap-0">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center text-xl md:text-2xl shadow-inner shrink-0">🏢</div>
          <div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-[#444] leading-tight">화원고등학교 스마트 교무실</h1>
            <p className="text-[10px] md:text-sm font-bold text-[#8B732D]">방문을 환영합니다. 선생님 성함을 눌러주세요.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-center md:text-right text-vibrant-text flex md:flex-col items-center md:items-end gap-4 md:gap-0 w-full md:w-auto justify-between md:justify-center border-black/5">
             <div className="text-xl md:text-2xl font-mono font-bold leading-none">{formatTime(currentTime)}</div>
             <div className="text-[10px] md:text-xs font-bold opacity-70">교무실 입구 단말기</div>
          </div>
          
          {/* 관리자 버튼 */}
          <button 
            onClick={() => setIsPasswordInputOpen(true)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#444]/40 hover:text-[#444]"
            title="관리자 설정"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠: 그리드 또는 로딩/에러 화면 */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-[#444] gap-4">
            <div className="w-12 h-12 border-4 border-vibrant-header border-t-vibrant-header-border rounded-full animate-spin"></div>
            <p className="font-bold">선생님 목록을 가져오는 중...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-[#444] gap-4">
            <div className="text-4xl">⚠️</div>
            <p className="font-bold text-red-500 whitespace-pre-wrap text-center">{error}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-vibrant-header rounded-full font-bold shadow-md active:scale-95 transition-transform"
              >
                다시 시도
              </button>
              <button 
                onClick={() => setIsPasswordInputOpen(true)}
                className="px-6 py-2 bg-white border-2 border-vibrant-header rounded-full font-bold shadow-sm active:scale-95 transition-transform"
              >
                관리자 설정 이동
              </button>
            </div>
          </div>
        ) : sortedTeachers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center font-bold text-[#444] gap-4">
            <p>등록된 선생님이 없습니다.</p>
            <p className="text-sm font-normal opacity-60">구글 시트의 데이터가 비어 있거나 형식이 맞지 않을 수 있습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 auto-rows-fr">
            {sortedTeachers.map((name, index) => (
              <motion.button
                key={`${name}-${index}`}
                id={`teacher-btn-${index}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => callTeacher(name)}
                disabled={activeTeacher !== null}
                className="btn-active min-h-[120px] rounded-2xl flex flex-col items-center justify-center shadow-md border-b-4 border-black/10 transition-all text-center p-4"
                style={{ backgroundColor: BUTTON_COLORS[index % BUTTON_COLORS.length] }}
              >
                <span className="text-xs font-bold opacity-60 mb-1">선생님</span>
                <span className="text-2xl font-black">{name}</span>
              </motion.button>
            ))}
          </div>
        )}
      </main>

      {/* 호출 중 알림창 (Toast) */}
      <AnimatePresence>
        {activeTeacher && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-12 left-1/2 bg-white border-4 border-vibrant-accent px-10 py-4 rounded-full shadow-2xl flex items-center gap-4 z-50"
          >
            <span className="text-2xl animate-bounce">🔔</span>
            <span className="text-xl font-black text-vibrant-text">
              {activeTeacher} 선생님을 호출 중입니다...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 비번 입력 모달 */}
      <AnimatePresence>
        {isPasswordInputOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsPasswordInputOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-vibrant-header rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="text-[#444]" size={28} />
                </div>
                <h2 className="text-2xl font-black text-[#444]">관리자 비밀번호</h2>
                <p className="text-sm font-bold text-gray-500">비밀번호를 입력해 주세요.</p>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <input 
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className={`w-full text-center text-3xl font-mono tracking-widest border-4 rounded-2xl p-4 outline-none transition-all ${
                    passwordError ? 'border-red-400 bg-red-50' : 'border-[#EEE] focus:border-vibrant-header'
                  }`}
                  placeholder="****"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-500 text-sm font-bold mt-2 text-center">비밀번호가 틀렸습니다!</p>
                )}
                <button 
                  type="submit"
                  className="w-full mt-6 bg-vibrant-header text-vibrant-text font-black py-4 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  확인
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 관리자 설정 패널 */}
      <AnimatePresence>
        {isAdminPanelOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAdminPanelOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-vibrant-header rounded-full flex items-center justify-center">
                  <Smartphone className="text-[#444]" size={24} />
                </div>
                <h2 className="text-2xl font-black text-[#444]">단말기 설정 모드</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100">
                  <p className="text-sm font-bold text-blue-700 leading-relaxed">
                    💡 <strong>시트 관리 방법:</strong> 구글 시트 주소 전체가 아닌 <strong>ID 부분</strong>만 입력하세요.<br />
                    아래 '교사 명단 열기'를 눌러 연결된 시트를 직접 수정할 수 있습니다.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-black text-gray-700">교사 명단 시트 고유 ID</label>
                    <a 
                      href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-vibrant-accent flex items-center gap-1 hover:underline bg-vibrant-accent/10 px-2 py-1 rounded-md"
                    >
                      <ExternalLink size={14} />
                      교사 명단 열기 (Google Sheets)
                    </a>
                  </div>
                  <input 
                    type="text"
                    value={tempSheetId}
                    onChange={(e) => setTempSheetId(e.target.value)}
                    className="w-full border-4 border-[#EEE] focus:border-vibrant-header rounded-2xl p-4 outline-none transition-all font-mono text-sm"
                    placeholder="시트 ID 입력 (예: 1QqSt...)"
                  />
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-1">현재 연결된 전체 주소:</p>
                    <p className="text-[10px] font-mono text-gray-500 break-all select-all">
                      https://docs.google.com/spreadsheets/d/{sheetId}/edit
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setTempSheetId(DEFAULT_SHEET_ID);
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl transition-all hover:bg-gray-200"
                  >
                    기본값으로 복원
                  </button>
                  <button 
                    onClick={handleSaveConfig}
                    className="flex-1 bg-vibrant-accent text-white font-black py-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Save size={20} />
                    설정 저장 및 새로고침
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 푸터 */}
      <footer className="h-12 bg-vibrant-footer px-10 flex items-center justify-between text-xs font-bold text-[#666] shrink-0">
        <span>사용 문의: 화원고등학교 (내선 101)</span>
        <span className="opacity-40 select-none">관리자 모드: 상단 톱니바퀴 아이콘</span>
      </footer>
    </div>
  );
}
