/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Google Sheet CSV Export URL
const SHEET_ID = '1QqSt9KQ4jpI-ERUEFPh03RaJ1ZO96_JejOKT-wQ3f18';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

const BUTTON_COLORS = [
  '#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', 
  '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF'
];

export default function App() {
  const [teachers, setTeachers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTeacher, setActiveTeacher] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock implementation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch teachers from Google Sheets
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error('데이터를 불러오지 못했습니다.');
        
        const csvText = await response.text();
        
        // Basic CSV parsing: split by lines, take first column, filter empty, start from A2 (skip first row)
        const rows = csvText.split(/\r?\n/);
        const parsedTeachers = rows
          .slice(1) // Start from row 2 (A2)
          .map(row => row.split(',')[0].replace(/"/g, '').trim())
          .filter(name => name); // Keep only non-empty cells

        setTeachers(parsedTeachers);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('선생님 목록을 불러오는 중 오류가 발생했습니다.');
        // Fallback or empty state is handled by UI
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Sort teachers alphabetically (가나다순)
  const sortedTeachers = useMemo(() => [...teachers].sort((a, b) => a.localeCompare(b, 'ko')), [teachers]);

  const callTeacher = useCallback((name: string) => {
    // 1. Set active state for visual feedback
    setActiveTeacher(name);

    // 2. TTS Logic using Web Speech API
    const message = `${name} 선생님! 학생 호출이 있습니다.`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);

    // 3. Clear feedback after 3.5 seconds to match theme
    setTimeout(() => {
      setActiveTeacher(null);
    }, 3500);
  }, []);

  const formatTime = (date: Date) => {
    return date.toTimeString().split(' ')[0];
  };

  return (
    <div className="h-screen w-full flex flex-col relative bg-vibrant-bg overflow-hidden select-none">
      {/* Header Section - Responsive Stack on Mobile */}
      <header className="min-h-[6rem] md:h-24 bg-vibrant-header flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-4 md:py-0 shadow-sm border-b-4 border-vibrant-header-border shrink-0 gap-4 md:gap-0">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center text-xl md:text-2xl shadow-inner shrink-0">🏢</div>
          <div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-[#444] leading-tight">화원고등학교 스마트 교무실</h1>
            <p className="text-[10px] md:text-sm font-bold text-[#8B732D]">방문을 환영합니다. 선생님 성함을 눌러주세요.</p>
          </div>
        </div>
        <div className="text-center md:text-right text-vibrant-text flex md:flex-col items-center md:items-end gap-4 md:gap-0 w-full md:w-auto justify-between md:justify-center border-t md:border-t-0 border-black/5 pt-2 md:pt-0">
          <div className="text-xl md:text-2xl font-mono font-bold leading-none">{formatTime(currentTime)}</div>
          <div className="text-[10px] md:text-xs font-bold opacity-70">교무실 입구 A단말기</div>
        </div>
      </header>

      {/* Main Content: Teacher Grid or Loading/Error */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-[#444] gap-4">
            <div className="w-12 h-12 border-4 border-vibrant-header border-t-vibrant-header-border rounded-full animate-spin"></div>
            <p className="font-bold">선생님 목록을 가져오는 중...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-[#444] gap-4">
            <div className="text-4xl">⚠️</div>
            <p className="font-bold text-red-500">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-vibrant-header rounded-full font-bold shadow-md active:scale-95 transition-transform"
            >
              다시 시 시도
            </button>
          </div>
        ) : sortedTeachers.length === 0 ? (
          <div className="h-full flex items-center justify-center font-bold text-[#444]">
            등록된 선생님이 없습니다.
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

      {/* Visual Feedback Toast (Overlay) */}
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

      {/* Footer */}
      <footer className="h-12 bg-vibrant-footer px-10 flex items-center justify-between text-xs font-bold text-[#666] shrink-0">
        <span>사용 문의: 화원고등학교 (내선 101)</span>
      </footer>
    </div>
  );
}
