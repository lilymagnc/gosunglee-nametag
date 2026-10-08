import React from 'react';
import { UserCheck, Printer, FileSpreadsheet, Users, Download, Sparkles, Settings } from 'lucide-react';
import { LabelSettings } from '../types';

interface HeaderProps {
  activeTab: 'checkin' | 'print' | 'dashboard' | 'members';
  setActiveTab: (tab: 'checkin' | 'print' | 'dashboard' | 'members') => void;
  queueCount: number;
  totalAttendance: number;
  totalFee: number;
  settings: LabelSettings;
  onOpenSettings: () => void;
  onQuickExport: () => void;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  queueCount,
  totalAttendance,
  totalFee,
  settings,
  onOpenSettings,
  onQuickExport,
  isCloudSynced = false,
}) => {
  return (
    <header className="no-print bg-slate-900 text-white sticky top-0 z-40 shadow-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          {/* 타이틀 로고 영역 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center font-bold text-white shadow-md text-lg font-serif">
              固
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-sky-300 hover:text-white font-extrabold flex items-center gap-1.5 hover:bg-slate-800/80 px-1.5 py-0.5 rounded-lg transition-all group"
                  title="클릭하여 행사명, 연도, 하단문구 변경"
                >
                  <span>[{settings.eventName || '2026년 정기총회 및 시제'}]</span>
                  <Settings className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-45 transition-transform" />
                </button>
                <span>명찰 라벨 & 회비 수납</span>
                {isCloudSynced ? (
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    클라우드 실시간 연동
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                    현장 전용
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-slate-400">
                1,168명 원부 연동 • {settings.paperSize === 'formtec_3114' ? '폼텍 8칸' : settings.paperSize === 'label_90x60' ? '90×60 감열' : '80×60 감열'} • 하단: {settings.footerText || '固 城 李 氏 서 울 宗 親 會'}
              </p>
            </div>
          </div>

          {/* 우측 수납 현황 요약 및 설정/엑셀 버튼 */}
          <div className="flex items-center gap-2.5 self-end md:self-center">
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400">당일 접수:</span>
              <strong className="text-white font-extrabold">{totalAttendance}명</strong>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">수납액:</span>
              <strong className="text-emerald-400 font-extrabold">{totalFee.toLocaleString()}원</strong>
            </div>

            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 text-xs font-bold text-sky-200 bg-sky-950/70 hover:bg-sky-900 border border-sky-600/40 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              title="행사명, 연도, 하단문구 등 환경설정 변경"
            >
              <Settings className="w-3.5 h-3.5 text-sky-400" />
              행사/문구 설정
            </button>

            <button
              onClick={onQuickExport}
              className="px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/40 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              title="현재까지 접수된 명부 엑셀로 내려받기"
            >
              <Download className="w-3.5 h-3.5" />
              정산 엑셀
            </button>
          </div>
        </div>

        {/* 내비게이션 탭 */}
        <nav className="flex space-x-2 border-t border-slate-800/80 pt-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'checkin'
                ? 'bg-slate-50 text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-sky-500" />
            현장 접수 & 검색
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 relative ${
              activeTab === 'print'
                ? 'bg-slate-50 text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Printer className="w-4 h-4 text-sky-500" />
            라벨 인쇄 센터
            {queueCount > 0 && (
              <span className="bg-sky-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-sm">
                {queueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-slate-50 text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            회비 수납 대장 & 정산
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'members'
                ? 'bg-slate-50 text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-amber-500" />
            주소록 원부 관리
          </button>
        </nav>
      </div>
    </header>
  );
};
