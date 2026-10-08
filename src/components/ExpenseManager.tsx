import React, { useState, useMemo } from 'react';
import { EventRecord, AttendanceRecord, ExpenseItem, ExpenseCategory } from '../types';
import {
  loadEvents,
  saveEvents,
  getActiveEventId,
  setActiveEventId,
  loadExpenses,
  saveExpenses,
  getExpenseMenuPin,
} from '../utils/storage';
import { AuditReportModal } from './AuditReportModal';
import { EventSummaryReportModal } from './EventSummaryReportModal';
import {
  Calendar,
  Plus,
  Printer,
  FileSpreadsheet,
  Receipt,
  Search,
  Filter,
  Trash2,
  Edit2,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  User,
  CreditCard,
  X,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  Settings,
  Users,
  FileText,
  Car,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TravelFeeReportModal } from './TravelFeeReportModal';

interface ExpenseManagerProps {
  attendanceRecords: AttendanceRecord[];
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ attendanceRecords }) => {
  // 0. 관리자 인증 잠금 상태 (기본 PIN: 1234, sessionStorage로 브라우저 세션 동안 유지)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('gosung_expense_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // 1. 행사 목록 및 활성 행사 상태
  const [events, setEvents] = useState<EventRecord[]>(loadEvents);
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return localStorage.getItem('gosung_expense_selected_event_id') || getActiveEventId();
  });

  // 2. 지출 항목 목록
  const [expenses, setExpenses] = useState<ExpenseItem[]>(loadExpenses);

  // 3. UI 모달 제어 상태
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [isEventSettingsModalOpen, setIsEventSettingsModalOpen] = useState<boolean>(false);
  const [eventModalMode, setEventModalMode] = useState<'create' | 'edit'>('create');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isEventSummaryModalOpen, setIsEventSummaryModalOpen] = useState<boolean>(false);
  const [isTravelFeeModalOpen, setIsTravelFeeModalOpen] = useState<boolean>(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // 4. 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 현재 선택된 행사 객체
  const currentEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  // 행사 변경 시 상태 저장
  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    setActiveEventId(id);
    localStorage.setItem('gosung_expense_selected_event_id', id);
  };

  // 현재 행사의 수입 내역 (출석/회비 데이터에서 자동 연동)
  const currentEventAttendance = useMemo(() => {
    if (!currentEvent) return [];
    return attendanceRecords.filter(
      (r) => r.eventName === currentEvent.name || r.year === currentEvent.year
    );
  }, [attendanceRecords, currentEvent]);

  // 수입 합계
  const regularIncome = currentEventAttendance
    .filter((r) => (r.feeAmount || 0) < 100000)
    .reduce((sum, r) => sum + (r.feeAmount || 0), 0);

  const sponsorIncome = currentEventAttendance
    .filter((r) => (r.feeAmount || 0) >= 100000)
    .reduce((sum, r) => sum + (r.feeAmount || 0), 0);

  const totalIncome = regularIncome + sponsorIncome;

  // 현재 행사의 지출 내역
  const currentEventExpenses = useMemo(() => {
    if (!currentEvent) return [];
    return expenses.filter((e) => e.eventId === currentEvent.id);
  }, [expenses, currentEvent]);

  // 교통비 지급 행사일 때 자동 연동되는 교통비 합계
  const autoTravelFeeCount = useMemo(() => {
    if (!currentEvent || !currentEvent.isTravelFeeEvent) return 0;
    return currentEventAttendance.filter((r) => r.travelFeePaid !== false).length;
  }, [currentEvent, currentEventAttendance]);

  const autoTravelFeeAmount = autoTravelFeeCount * (currentEvent?.travelFeeAmount || 50000);

  // 총 지출액 (일반 등록 지출 + 자동 교통비 집행액)
  const totalExpense = currentEventExpenses.reduce((sum, e) => sum + (e.amount || 0), 0) + autoTravelFeeAmount;

  // 수지 차인 잔액
  const balance = totalIncome - totalExpense;

  // 영수증 첨부율
  const receiptCount = currentEventExpenses.filter((e) => e.receiptImage).length;
  const receiptRate = currentEventExpenses.length > 0
    ? Math.round((receiptCount / currentEventExpenses.length) * 100)
    : 100;

  // 필터링된 지출 목록
  const filteredExpenses = useMemo(() => {
    return currentEventExpenses.filter((e) => {
      if (selectedCategory !== '전체' && e.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.payer.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    });
  }, [currentEventExpenses, selectedCategory, searchQuery]);

  // 지출 삭제
  const handleDeleteExpense = (id: string) => {
    if (window.confirm('이 지출 내역을 삭제하시겠습니까?')) {
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      saveExpenses(updated);
    }
  };

  // 엑셀 내보내기
  const handleExportExcel = () => {
    if (!currentEvent) return;

    const data = currentEventExpenses.map((e, idx) => ({
      번호: idx + 1,
      행사명: e.eventName,
      일자: e.date,
      비목: e.category,
      지출내역: e.title,
      '금액(원)': e.amount,
      결제방식: e.paymentMethod,
      집행자: e.payer,
      영수증첨부여부: e.receiptImage ? '첨부완료' : '미첨부',
      비고: e.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '지출내역');
    XLSX.writeFile(wb, `${currentEvent.name}_지출내역서.xlsx`);
  };

  // 비밀번호 인증 핸들러 (기본: 1234)
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getExpenseMenuPin();
    if (pinInput.trim() === correctPin) {
      setIsUnlocked(true);
      try {
        sessionStorage.setItem('gosung_expense_unlocked', 'true');
      } catch (err) {
        console.error(err);
      }
      setPinInput('');
      setPinError('');
    } else {
      setPinError('비밀번호가 일치하지 않습니다. 다시 입력해 주세요.');
    }
  };

  const handleLockMenu = () => {
    setIsUnlocked(false);
    try {
      sessionStorage.removeItem('gosung_expense_unlocked');
    } catch (err) {
      console.error(err);
    }
  };

  // 행사 저장(개설 또는 수정) 핸들러
  const handleSaveEvent = (savedEvent: EventRecord, isEdit: boolean) => {
    if (isEdit) {
      const updated = events.map((ev) => (ev.id === savedEvent.id ? savedEvent : ev));
      setEvents(updated);
      saveEvents(updated);
    } else {
      const updated = [savedEvent, ...events];
      setEvents(updated);
      saveEvents(updated);
      handleSelectEvent(savedEvent.id);
    }
    setIsEventSettingsModalOpen(false);
  };

  // 미인증 시 관리자 인증 잠금 화면 렌더링
  if (!isUnlocked) {
    return (
      <div className="py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-8 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-black tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase">
              종친회 재정 보안 구역
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              행사 지출·수지 결산 관리자 인증
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              지출 증빙 영수증, 행사 수지 결산 총괄표, 감사보고서는<br />
              종친회 재정 보호를 위해 관계자 전용으로 보호되어 있습니다.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError('');
                  }}
                  placeholder="관리자 비밀번호 입력"
                  className="w-full px-4 py-3 text-center text-lg font-black tracking-widest border border-slate-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50 font-mono"
                  autoFocus
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {pinError && (
                <p className="text-xs text-red-600 font-bold mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {pinError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>관리자 잠금 해제</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            종친회 임원 및 지정된 관계자만 접근할 수 있습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. 상단 행사 선택 & 메인 액션 바 */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 행사 선택기 */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">진행 및 조회 행사 선택</span>
              <div className="relative">
                <select
                  value={selectedEventId}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-900 font-black text-base sm:text-lg rounded-xl pl-3.5 pr-9 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} {ev.status === 'active' ? '(진행 중)' : '(보관됨)'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEventModalMode('create');
              setIsEventSettingsModalOpen(true);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>새 행사 개설하기</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEventModalMode('edit');
              setIsEventSettingsModalOpen(true);
            }}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
            title="현재 행사의 회장, 감사진, 일시 및 장소 변경"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-600" />
            <span>행사 설정·임원 수정</span>
          </button>

          <button
            type="button"
            onClick={handleLockMenu}
            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1 transition-all cursor-pointer"
            title="자리를 비울 때 재정 화면을 즉시 잠급니다"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>잠그기</span>
          </button>
        </div>

        {/* 감사보고서 & 엑셀 버튼 */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>엑셀 다운로드</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500"
            title="회계 적법성 검토 및 감사위원 날인 감사보고서 출력"
          >
            <Printer className="w-4 h-4" />
            <span>📜 A4 감사보고서</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEventSummaryModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-500"
            title="참석 인원 통계, 문파별 분포, 수지 결산 총괄 및 특별 찬조자 명단 종합보고서 출력"
          >
            <FileText className="w-4 h-4" />
            <span>📋 행사 종합보고서 (결과보고)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTravelFeeModalOpen(true)}
            className={`px-4 py-2.5 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer border ${
              currentEvent.isTravelFeeEvent
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500 ring-2 ring-amber-300'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
            }`}
            title="A4 공식 참석 종친 여비(교통비) 지급대장 서명부 및 엑셀 저장"
          >
            <Car className={`w-4 h-4 ${currentEvent.isTravelFeeEvent ? 'text-amber-200' : 'text-amber-600'}`} />
            <span>🚗 A4 교통비 수령대장</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>지출 & 영수증 등록</span>
          </button>
        </div>
      </div>

      {/* 2. 실시간 수지 결산 대시보드 (KPI 4단 카드) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 총 수입 카드 */}
        <div className="bg-white p-5 rounded-2xl border border-sky-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-sky-600" /> 총 수입 (회비+찬조금)
            </span>
            <span className="text-[10px] bg-sky-100 text-sky-800 font-extrabold px-2 py-0.5 rounded-full">
              접수대 자동연동
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-sky-950 font-mono tracking-tight">
              {totalIncome.toLocaleString()} <span className="text-sm font-bold text-slate-500">원</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>일반회비: {regularIncome.toLocaleString()}원</span>
              <span>찬조금: {sponsorIncome.toLocaleString()}원</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            총 {currentEventAttendance.length}명 종친 수납 완료
          </div>
        </div>

        {/* 총 지출 카드 */}
        <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-red-600" /> 총 지출 집행액
            </span>
            <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-full">
              {currentEventExpenses.length}건 집행
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-red-950 font-mono tracking-tight">
              {totalExpense.toLocaleString()} <span className="text-sm font-bold text-slate-500">원</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>최대비목: 식대·다과</span>
              <span>평균: {currentEventExpenses.length > 0 ? Math.round(totalExpense / currentEventExpenses.length).toLocaleString() : 0}원</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            등록된 영수증 및 집행 총액
          </div>
        </div>

        {/* 차인 잔액 (결산) 카드 */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" /> 차인 잔액 (결산)
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${balance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {balance >= 0 ? '흑자 (이월)' : '초과 지출'}
            </span>
          </div>
          <div className="my-3">
            <div className={`text-2xl font-black font-mono tracking-tight ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString()} <span className="text-sm font-bold text-slate-500">원</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              수입총액 - 지출총액 = 차기 이월금
            </div>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            종친회 통장 입금 잔액
          </div>
        </div>

        {/* 영수증 증빙율 카드 */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-amber-600" /> 영수증 증빙 첨부율
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
              감사 대비
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-amber-950 font-mono tracking-tight">
              {receiptRate}% <span className="text-xs font-bold text-slate-500">({receiptCount}/{currentEventExpenses.length}건)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${receiptRate}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>영수증 첨부 완료</span>
            <span className="text-amber-700 font-bold">{receiptCount}건 완료</span>
          </div>
        </div>
      </div>

      {/* 🚗 교통비 지급 행사 모드 지출 자동 연동 배너 */}
      {currentEvent.isTravelFeeEvent && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
              <Car className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-black text-amber-950 flex items-center gap-2">
                <span>[교통비 지급 행사 모드] 자동 지출 연동 중</span>
                <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-extrabold shadow-2xs">
                  1인당 {(currentEvent.travelFeeAmount || 50000).toLocaleString()}원
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                현장 접수된 <strong>{autoTravelFeeCount}명</strong> 종친께 총{' '}
                <strong>{autoTravelFeeAmount.toLocaleString()}원</strong>의 교통비가 지급 집행되어 지출 총액에 자동 합산되었습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsTravelFeeModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>A4 교통비 수령대장 인쇄</span>
          </button>
        </div>
      )}

      {/* 3. 비목 필터 & 검색 바 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {['전체', '식대·다과', '제물·시제', '인쇄·홍보', '기념품·답례', '대관·장소', '교통·운임', '진행·잡비'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="지출 항목, 집행자 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 4. 지출 내역 목록 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-800">
              {currentEvent?.name} 지출 명세 ({filteredExpenses.length}건)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            선택 비목 합계: {filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}원
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold">등록된 지출 내역이 없습니다.</p>
            <p className="text-xs mt-1">상단의 [지출 & 영수증 등록] 버튼을 눌러 새 지출을 추가해 보세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4 text-center w-12">No</th>
                  <th className="py-3 px-4 w-24">일자</th>
                  <th className="py-3 px-4 w-28">비목</th>
                  <th className="py-3 px-4">지출 내역 (항목)</th>
                  <th className="py-3 px-4 text-right w-32">금액</th>
                  <th className="py-3 px-4 w-28">결제방식</th>
                  <th className="py-3 px-4 w-28">집행자</th>
                  <th className="py-3 px-4 text-center w-28">영수증 증빙</th>
                  <th className="py-3 px-4 text-center w-24">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredExpenses.map((e, idx) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3.5 px-4 text-slate-600">{e.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{e.title}</div>
                      {e.notes && <div className="text-[11px] text-slate-400 font-normal mt-0.5">{e.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black font-mono text-sm text-slate-900">
                      {e.amount.toLocaleString()} <span className="text-xs font-normal text-slate-500">원</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{e.paymentMethod}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{e.payer}</td>
                    <td className="py-3.5 px-4 text-center">
                      {e.receiptImage ? (
                        <button
                          type="button"
                          onClick={() => setViewingReceipt(e.receiptImage!)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-3 h-3 text-amber-600" />
                          <span>영수증 보기</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-normal">미첨부</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingExpense(e);
                            setIsExpenseModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 5. 모달들: 지출 등록/수정, 신규 행사 개설, 영수증 팝업, 감사보고서 */}
      {/* ========================================== */}

      {/* 5-1. 지출 및 영수증 등록/수정 모달 */}
      {isExpenseModalOpen && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
          }}
          event={currentEvent}
          initialData={editingExpense}
          onSave={(item) => {
            let updated: ExpenseItem[];
            if (editingExpense) {
              updated = expenses.map((e) => (e.id === item.id ? item : e));
            } else {
              updated = [item, ...expenses];
            }
            setExpenses(updated);
            saveExpenses(updated);
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
          }}
        />
      )}

      {/* 5-2. 행사 개설 및 설정/임원 수정 모달 */}
      {isEventSettingsModalOpen && (
        <EventSettingsModal
          isOpen={isEventSettingsModalOpen}
          mode={eventModalMode}
          currentEvent={currentEvent}
          onClose={() => setIsEventSettingsModalOpen(false)}
          onSaveEvent={handleSaveEvent}
        />
      )}

      {/* 5-3. 영수증 원본 확대 팝업 */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setViewingReceipt(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-400" />
                지출 증빙 영수증 원본
              </span>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto bg-slate-100">
              <img
                src={viewingReceipt}
                alt="영수증 원본"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5-4. A4 감사보고서 모달 */}
      <AuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        event={currentEvent}
        attendanceRecords={attendanceRecords}
        expenses={expenses}
      />

      {/* 5-5. 행사 종합 결과보고서 모달 */}
      <EventSummaryReportModal
        isOpen={isEventSummaryModalOpen}
        onClose={() => setIsEventSummaryModalOpen(false)}
        event={currentEvent}
        attendanceRecords={attendanceRecords}
        expenses={expenses}
      />

      {/* 5-6. 🚗 A4 참석 종친 여비(교통비) 지급대장 서명부 모달 */}
      <TravelFeeReportModal
        isOpen={isTravelFeeModalOpen}
        onClose={() => setIsTravelFeeModalOpen(false)}
        settings={{
          eventName: currentEvent.name,
          eventYear: currentEvent.year,
          isTravelFeeEvent: currentEvent.isTravelFeeEvent,
          travelFeeAmount: currentEvent.travelFeeAmount || 50000,
        } as any}
        attendanceRecords={attendanceRecords}
        presidentName={currentEvent.presidentName || '이 기 석'}
      />
    </div>
  );
};

// =========================================================================
// 지출 등록 & 영수증 첨부 모달 컴포넌트
// =========================================================================
interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventRecord;
  initialData?: ExpenseItem | null;
  onSave: (item: ExpenseItem) => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  event,
  initialData,
  onSave,
}) => {
  const [date, setDate] = useState<string>(
    initialData?.date || new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState<ExpenseCategory>(
    initialData?.category || '식대·다과'
  );
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [amount, setAmount] = useState<number>(initialData?.amount || 0);
  const [paymentMethod, setPaymentMethod] = useState<
    '종친회카드' | '개인선결제(영수)' | '계좌이체' | '현금'
  >(initialData?.paymentMethod || '종친회카드');
  const [payer, setPayer] = useState<string>(initialData?.payer || '총무이사 이진우');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(
    initialData?.receiptImage
  );

  if (!isOpen) return null;

  // 영수증 사진 업로드 & 자동 리사이징(Base64)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 최대 너비 1200px으로 리사이징하여 용량 압축 (300KB 수준)
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        setReceiptImage(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) {
      alert('지출 내역과 금액을 올바르게 입력해 주세요.');
      return;
    }

    const item: ExpenseItem = {
      id: initialData?.id || `exp_${Date.now()}`,
      eventId: event.id,
      eventName: event.name,
      date,
      category,
      title: title.trim(),
      amount,
      paymentMethod,
      payer: payer.trim(),
      receiptImage,
      notes: notes.trim(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onSave(item);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold">
              {initialData ? '지출 내역 수정' : '새 지출 및 영수증 등록'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="text-xs text-slate-500 font-bold">
            행사: <strong className="text-slate-900">{event.name}</strong>
          </div>

          {/* 일자 및 비목 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">지출 일자</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">비목 분류</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {['식대·다과', '제물·시제', '인쇄·홍보', '기념품·답례', '대관·장소', '교통·운임', '진행·잡비'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* 지출 내역 (항목명) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              지출 내역 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="예: 만수정 연회 뷔페 중식대 80명"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 금액 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              지출 금액 (원) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1000"
                placeholder="0"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full pl-3 pr-8 py-2 text-base font-black text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                원
              </span>
            </div>
          </div>

          {/* 결제 방식 & 집행자 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">결제 방식</label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as any)
                }
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="종친회카드">종친회카드</option>
                <option value="개인선결제(영수)">개인선결제(영수)</option>
                <option value="계좌이체">계좌이체</option>
                <option value="현금">현금</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">집행자 (영수인)</label>
              <input
                type="text"
                placeholder="예: 총무이사 이진우"
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 영수증 사진 업로드 & 카메라 촬영 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>영수증 사진 첨부 (스마트폰 카메라 / 파일)</span>
              {receiptImage && (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 첨부 완료
                </span>
              )}
            </label>

            {receiptImage ? (
              <div className="relative rounded-xl border border-slate-300 p-2 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={receiptImage}
                    alt="영수증 미리보기"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="text-xs text-slate-600 font-bold">
                    <div>영수증 사진 첨부됨</div>
                    <label className="text-[11px] text-indigo-600 underline cursor-pointer mt-1 block">
                      사진 다시 변경하기
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptImage(undefined)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                  title="영수증 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all">
                <Camera className="w-6 h-6 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">
                  영수증 사진 촬영 또는 갤러리 업로드
                </span>
                <span className="text-[10px] text-slate-400">
                  JPG, PNG (자동 압축되어 안전하게 보관됩니다)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 비고 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">비고 (선택)</label>
            <input
              type="text"
              placeholder="예: 1인당 4만원 x 80명 영수증"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {initialData ? '수정 내용 저장' : '지출 내역 등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 행사 개설 및 설정/임원 수정 모달 컴포넌트
// =========================================================================
interface EventSettingsModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  currentEvent?: EventRecord;
  onClose: () => void;
  onSaveEvent: (event: EventRecord, isEdit: boolean) => void;
}

const EventSettingsModal: React.FC<EventSettingsModalProps> = ({
  isOpen,
  mode,
  currentEvent,
  onClose,
  onSaveEvent,
}) => {
  const [name, setName] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState<string>('서울 종친회관 대강당');
  const [presidentName, setPresidentName] = useState<string>('이 기 석');
  const [auditors, setAuditors] = useState<string[]>(['이 종 춘', '이 원 구']);
  const [isTravelFeeEvent, setIsTravelFeeEvent] = useState<boolean>(false);
  const [travelFeeAmount, setTravelFeeAmount] = useState<number>(50000);

  // 모달 열릴 때 초기값 동기화
  React.useEffect(() => {
    if (mode === 'edit' && currentEvent) {
      setName(currentEvent.name);
      setYear(currentEvent.year);
      setDate(currentEvent.date);
      setLocation(currentEvent.location || '서울 종친회관 대강당');
      setPresidentName(currentEvent.presidentName || '이 기 석');
      setAuditors(
        currentEvent.auditors && currentEvent.auditors.length > 0
          ? currentEvent.auditors
          : ['이 종 춘', '이 원 구']
      );
      setIsTravelFeeEvent(currentEvent.isTravelFeeEvent || false);
      setTravelFeeAmount(currentEvent.travelFeeAmount || 50000);
    } else {
      setName('');
      setYear(new Date().getFullYear());
      setDate(new Date().toISOString().split('T')[0]);
      setLocation('서울 종친회관 대강당');
      setPresidentName('이 기 석');
      setAuditors(['이 종 춘', '이 원 구']);
      setIsTravelFeeEvent(false);
      setTravelFeeAmount(50000);
    }
  }, [isOpen, mode, currentEvent]);

  if (!isOpen) return null;

  const handleAddAuditor = () => {
    setAuditors((prev) => [...prev, '']);
  };

  const handleRemoveAuditor = (idx: number) => {
    if (auditors.length <= 1) {
      alert('감사는 최소 1명 이상이어야 합니다.');
      return;
    }
    setAuditors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAuditorChange = (idx: number, val: string) => {
    setAuditors((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('행사명을 입력해 주세요.');
      return;
    }

    const filteredAuditors = auditors.map((a) => a.trim()).filter((a) => a !== '');
    if (filteredAuditors.length === 0) {
      alert('최소 1명 이상의 감사 성명을 입력해 주세요.');
      return;
    }

    const targetId = mode === 'edit' && currentEvent ? currentEvent.id : `event_${year}_${Date.now().toString(36)}`;
    const eventData: EventRecord = {
      id: targetId,
      name: name.trim(),
      year,
      date,
      location: location.trim(),
      presidentName: presidentName.trim() || '이 기 석',
      auditors: filteredAuditors,
      isTravelFeeEvent,
      travelFeeAmount: Number(travelFeeAmount) || 50000,
      status: mode === 'edit' && currentEvent ? currentEvent.status : 'active',
      createdAt: mode === 'edit' && currentEvent ? currentEvent.createdAt : new Date().toISOString(),
    };

    onSaveEvent(eventData, mode === 'edit');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'create' ? (
              <Plus className="w-5 h-5 text-indigo-400" />
            ) : (
              <Settings className="w-5 h-5 text-indigo-400" />
            )}
            <h3 className="text-base font-bold">
              {mode === 'create' ? '새 종친회 행사 개설' : '종친회 행사 정보 및 임원 설정 수정'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <p className="text-xs text-slate-500 leading-relaxed">
            {mode === 'create'
              ? '새 행사를 개설하면 기존 행사의 자료는 영구 보관되며, 새 행사의 접수 회비 및 지출 내역이 새롭게 시작됩니다.'
              : '현재 행사의 행사명, 일자, 장소 및 감사보고서에 날인될 회장·감사진 성명을 수정합니다.'}
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              행사명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="예: 2026년 가을 정기시제"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">행사 연도</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">행사 일자</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">행사 장소</label>
            <input
              type="text"
              placeholder="예: 선영 제실 및 시제터"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 🚗 참석 종친 교통비 지급 행사 모드 */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isTravelFeeEvent
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                <span>🚗 참석 종친 교통비(거마비) 지급 행사</span>
              </label>
              <input
                type="checkbox"
                checked={isTravelFeeEvent}
                onChange={(e) => setIsTravelFeeEvent(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              체크 시 접수대에서 <strong>회비가 0원으로 자동 설정</strong>되고 1인당 교통비 지급 및 A4 수령대장이 연동됩니다.
            </p>
            {isTravelFeeEvent && (
              <div className="mt-2.5 pt-2.5 border-t border-amber-200 flex items-center justify-between gap-2 animate-in fade-in">
                <span className="text-xs text-amber-950 font-bold">1인당 지급 기준액:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="10000"
                    value={travelFeeAmount}
                    onChange={(e) => setTravelFeeAmount(Number(e.target.value) || 0)}
                    className="w-28 px-2 py-1 text-xs font-bold text-right border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <span className="text-xs text-amber-900 font-bold">원</span>
                </div>
              </div>
            )}
          </div>

          {/* 회장 성명 (기본: 이기석) */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>회장 성명</span>
              <span className="text-[11px] text-slate-400 font-normal">감사보고서 서명란 기본 표기</span>
            </label>
            <input
              type="text"
              placeholder="회장 성명 (예: 이 기 석)"
              value={presidentName}
              onChange={(e) => setPresidentName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 감사진 성명 (동적 추가/삭제) */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>감사진 성명 ({auditors.length}명)</span>
              </label>
              <button
                type="button"
                onClick={handleAddAuditor}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>감사 추가</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              감사가 1명이면 1명, 2명이면 2명, 필요 시 3인 이상도 추가할 수 있으며 A4 감사보고서에 서명란이 자동 생성됩니다.
            </p>

            <div className="space-y-2 pt-1">
              {auditors.map((auditor, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 w-14 shrink-0">
                    감사 {idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`감사 ${idx + 1} 성명`}
                    value={auditor}
                    onChange={(e) => handleAuditorChange(idx, e.target.value)}
                    required
                    className="flex-1 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  {auditors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAuditor(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="감사 삭제"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {mode === 'create' ? '새 행사 개설하기' : '행사 설정 저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
