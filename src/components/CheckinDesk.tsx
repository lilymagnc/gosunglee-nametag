import React, { useState, useMemo } from 'react';
import { Member, AttendanceRecord, LabelSettings } from '../types';
import { BRANCHES } from '../data/defaultMembers';
import { matchKorean } from '../utils/hangul';
import { loadAttendanceHistory } from '../utils/storage';
import {
  Search,
  UserPlus,
  CheckCircle,
  Clock,
  Printer,
  Filter,
  Phone,
  MapPin,
  Briefcase,
  Edit3,
  Calendar,
  CheckSquare,
  Square,
  ListPlus,
  X,
  Crown,
} from 'lucide-react';

interface CheckinDeskProps {
  members: Member[];
  attendanceRecords: AttendanceRecord[];
  settings: LabelSettings;
  onOpenCheckin: (member: Member) => void;
  onOpenNewMember: () => void;
  onQuickPrint: (record: AttendanceRecord) => void;
  onBatchPrint: (records: AttendanceRecord[]) => void;
  onAddToQueue: (records: AttendanceRecord[]) => void;
  onEditMember: (member: Member) => void;
}

export const CheckinDesk: React.FC<CheckinDeskProps> = ({
  members,
  attendanceRecords,
  settings,
  onOpenCheckin,
  onOpenNewMember,
  onQuickPrint,
  onBatchPrint,
  onAddToQueue,
  onEditMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('전체');
  const [attendanceTab, setAttendanceTab] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');
  const [onlyUnprinted, setOnlyUnprinted] = useState<boolean>(false);
  const [onlyExecutives, setOnlyExecutives] = useState<boolean>(false);
  const [generationFilter, setGenerationFilter] = useState<string>('all');

  // 역대 출석 이력 맵 (memberId -> AttendanceRecord[])
  const historyMap = useMemo(() => {
    const all = loadAttendanceHistory();
    const map = new Map<number, AttendanceRecord[]>();
    all.forEach((h) => {
      const arr = map.get(h.memberId) || [];
      arr.push(h);
      map.set(h.memberId, arr);
    });
    return map;
  }, [attendanceRecords]);

  // 당일 접수된 회원 맵 (memberId -> AttendanceRecord)
  const checkedInMap = useMemo(() => {
    const map = new Map<number, AttendanceRecord>();
    attendanceRecords.forEach((r) => {
      map.set(r.memberId, r);
    });
    return map;
  }, [attendanceRecords]);

  // 파별 인원수 맵
  const branchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      const b = m.branch ? m.branch.trim() : '미지정';
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [members]);

  const dynamicBranchList = useMemo(() => {
    return Object.keys(branchCounts).sort((a, b) => branchCounts[b] - branchCounts[a]);
  }, [branchCounts]);

  // 검색 및 필터링
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim();
    return members.filter((m) => {
      const record = checkedInMap.get(m.id);

      // 1. 출석 상태 탭 (전체 / 접수완료 / 미접수)
      if (attendanceTab === 'checked_in' && !record) return false;
      if (attendanceTab === 'not_checked_in' && record) return false;

      // 2. 명찰 미출력자만 (접수했으나 printedCount가 0인 사람)
      if (onlyUnprinted) {
        if (!record || (record.printedCount || 0) > 0) return false;
      }

      // 3. 임원/직책자만
      if (onlyExecutives) {
        if (!m.role || !m.role.trim() || m.role === '-') return false;
      }

      // 4. 세수(항렬) 필터
      const gen = Number(m.generation);
      if (generationFilter === 'elder') {
        if (!gen || gen > 29) return false;
      } else if (generationFilter === 'mid') {
        if (!gen || gen < 30 || gen > 32) return false;
      } else if (generationFilter === 'youth') {
        if (!gen || gen < 33) return false;
      } else if (generationFilter !== 'all') {
        if (String(m.generation) !== generationFilter) return false;
      }

      // 5. 파별 필터
      if (selectedBranch !== '전체' && (m.branch || '').trim() !== selectedBranch) {
        return false;
      }

      // 6. 검색어 매칭
      if (!q) return true;
      if (matchKorean(m.name, q)) return true;
      const cleanPhone = (m.mobile || m.phone || '').replace(/[^0-9]/g, '');
      const cleanQuery = q.replace(/[^0-9]/g, '');
      if (cleanQuery && cleanPhone.includes(cleanQuery)) return true;
      if (m.branch && m.branch.includes(q)) return true;
      if (m.job && m.job.includes(q)) return true;
      if (m.role && m.role.includes(q)) return true;
      if (m.address && m.address.includes(q)) return true;

      return false;
    });
  }, [
    members,
    searchQuery,
    selectedBranch,
    attendanceTab,
    onlyUnprinted,
    onlyExecutives,
    generationFilter,
    checkedInMap,
  ]);

  const isFiltering = Boolean(
    searchQuery ||
    attendanceTab !== 'all' ||
    onlyUnprinted ||
    onlyExecutives ||
    generationFilter !== 'all' ||
    selectedBranch !== '전체'
  );

  // 화면 표시 개수 제한 (성능 최적화: 검색어/필터 있으면 150개, 없으면 기본 40개)
  const displayList = useMemo(() => {
    return filteredMembers.slice(0, isFiltering ? 150 : 40);
  }, [filteredMembers, isFiltering]);

  // 다중 선택 상태 (선택된 memberId Set)
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());

  // 현재 화면에 표시된 목록 전체 선택 여부
  const isAllSelected =
    displayList.length > 0 &&
    displayList.every((m) => selectedMemberIds.has(m.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(displayList.map((m) => m.id)));
    }
  };

  const toggleSelectMember = (id: number) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 선택된 종친들을 출력용 AttendanceRecord[] 로 변환 (접수 기록이 없으면 원부 정보로 임시 생성)
  const getSelectedRecords = (): AttendanceRecord[] => {
    return Array.from(selectedMemberIds).map((id) => {
      const checkedIn = checkedInMap.get(id);
      if (checkedIn) return checkedIn;
      const m = members.find((mem) => mem.id === id);
      return {
        id: `sel-${id}-${Date.now()}`,
        memberId: id,
        name: m?.name || '',
        branch: m?.branch || '고성이씨',
        generation: m?.generation || '',
        role: m?.role || '',
        job: m?.job || '',
        feeAmount: 0,
        paymentMethod: '현금',
        notes: '',
        timestamp: new Date().toISOString(),
        year: settings.eventYear || 2026,
        eventName: settings.eventName || '',
        isNewMember: false,
        printedCount: 0,
        printSlot: 1,
      };
    });
  };

  const handleBatchPrint = () => {
    const records = getSelectedRecords();
    if (records.length === 0) return;
    onBatchPrint(records);
  };

  const handleAddToQueue = () => {
    const records = getSelectedRecords();
    if (records.length === 0) return;
    onAddToQueue(records);
    setSelectedMemberIds(new Set());
  };

  return (
    <div className="space-y-6">
      {/* 1. 상단 현장 검색 & 신규 등록 바 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-sky-600" />
              현장 접수 및 회원 검색
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              성함, <strong>초성(예: ㅇㄷㄱ)</strong>, 휴대폰 번호 뒷자리로 즉시 찾아 회비를 입력하고 명찰을 인쇄합니다.
            </p>
          </div>

          {/* 신규 종친 등록 버튼 */}
          <button
            onClick={onOpenNewMember}
            className="px-5 py-2.5 text-sm font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            + 신규 종친 현장 등록
          </button>
        </div>

        {/* 검색 입력 필드 */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="성명 (예: 이동광), 초성 (예: ㅇㄷㄱ), 휴대폰 번호 뒷자리 (예: 2163) 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base border-2 border-sky-100 focus:border-sky-500 rounded-xl outline-none transition-all placeholder:text-slate-400 font-semibold"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded"
            >
              지우기
            </button>
          )}
        </div>

        {/* 파별 빠른 필터 탭 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> 파별:
          </span>
          <button
            onClick={() => setSelectedBranch('전체')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
              selectedBranch === '전체'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 ({members.length})
          </button>
          {dynamicBranchList.map((branch) => {
            const count = branchCounts[branch] || 0;
            return (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                  selectedBranch === branch
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {branch} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 검색 결과 목록 & 일괄 선택 인쇄 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* 상단 다중 선택 인쇄 액션 바 (1명 이상 선택 시 즉시 펼쳐짐) */}
        {selectedMemberIds.size > 0 && (
          <div className="p-3.5 bg-sky-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="bg-white text-sky-900 text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                {selectedMemberIds.size}명 선택됨
              </span>
              <span className="text-xs text-sky-100 font-medium hidden md:inline">
                원하는 종친을 체크하여 한 번에 폼텍/감열 라벨로 일괄 인쇄하거나 대기열에 담으세요.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBatchPrint}
                className="px-4 py-2 text-xs font-extrabold text-sky-950 bg-amber-300 hover:bg-amber-200 active:scale-95 rounded-xl shadow flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-4 h-4 text-sky-900" />
                선택한 {selectedMemberIds.size}명 바로 일괄 인쇄하기
              </button>

              <button
                type="button"
                onClick={handleAddToQueue}
                className="px-3.5 py-2 text-xs font-bold text-white bg-sky-800 hover:bg-sky-900 border border-sky-500 rounded-xl flex items-center gap-1.5 transition-all"
                title="인쇄 센터 대기열에 추가"
              >
                <ListPlus className="w-4 h-4 text-sky-200" />
                대기열에 담기
              </button>

              <button
                type="button"
                onClick={() => setSelectedMemberIds(new Set())}
                className="px-2.5 py-2 text-xs font-semibold text-sky-200 hover:text-white rounded-xl hover:bg-sky-800/60 transition-all flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                선택 해제
              </button>
            </div>
          </div>
        )}

        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-3">
            {/* 전체 선택 체크박스 버튼 */}
            <button
              type="button"
              onClick={toggleSelectAll}
              className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg border transition-all ${
                isAllSelected
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title={isAllSelected ? '전체 선택 해제' : '목록 전체 선택'}
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>전체 선택</span>
            </button>

            <span>
              검색 결과: <strong className="text-slate-900">{filteredMembers.length}</strong>명
              {filteredMembers.length > displayList.length && ` (상위 ${displayList.length}명 표시 중)`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 3단 출석 상태 토글 버튼 */}
            <div className="bg-slate-200 p-0.5 rounded-xl flex items-center">
              <button
                type="button"
                onClick={() => setAttendanceTab('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  attendanceTab === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setAttendanceTab('checked_in')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  attendanceTab === 'checked_in'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                <CheckCircle className="w-3 h-3" />
                출석 ({attendanceRecords.length}명)
              </button>
              <button
                type="button"
                onClick={() => setAttendanceTab('not_checked_in')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  attendanceTab === 'not_checked_in'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                미출석 ({Math.max(0, members.length - attendanceRecords.length)}명)
              </button>
            </div>

            {/* 명찰 미출력자만 토글 */}
            <button
              type="button"
              onClick={() => setOnlyUnprinted(!onlyUnprinted)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                onlyUnprinted
                  ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-400'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
              title="접수했으나 아직 명찰을 인쇄하지 않은 종친"
            >
              <Printer className="w-3 h-3" />
              미인쇄자만
            </button>

            {/* 임원진만 토글 */}
            <button
              type="button"
              onClick={() => setOnlyExecutives(!onlyExecutives)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                onlyExecutives
                  ? 'bg-sky-700 text-white shadow-sm ring-1 ring-sky-500'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
              title="직책이 기재된 임원 종친만 보기"
            >
              임원진만
            </button>

            {/* 세수 드롭다운 */}
            <select
              value={generationFilter}
              onChange={(e) => setGenerationFilter(e.target.value)}
              className="px-2 py-1 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-700"
            >
              <option value="all">전체 세수</option>
              <option value="elder">원로 (27~29세)</option>
              <option value="mid">중진 (30~32세)</option>
              <option value="youth">청장년 (33세+)</option>
              <option value="27">27세</option>
              <option value="28">28세</option>
              <option value="29">29세</option>
              <option value="30">30세</option>
              <option value="31">31세</option>
              <option value="32">32세</option>
              <option value="33">33세</option>
              <option value="34">34세</option>
              <option value="35">35세</option>
            </select>
          </div>
        </div>

        {displayList.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <Search className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">
              {attendanceTab === 'checked_in' ? '당일 접수된 회원이 없습니다.' : '검색 결과가 없습니다.'}
            </p>
            <p className="text-xs text-slate-400">
              주소록에 등록되지 않은 종친은 상단의 <strong>[+ 신규 종친 현장 등록]</strong> 버튼을 눌러 바로 접수해 주세요.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayList.map((member) => {
              const checkedIn = checkedInMap.get(member.id);
              const isSelected = selectedMemberIds.has(member.id);

              return (
                <div
                  key={member.id}
                  className={`p-4 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-sky-50/80 border-l-4 border-l-sky-500'
                      : checkedIn
                      ? 'bg-emerald-50/40'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start gap-3 w-full sm:w-auto">
                    {/* 종친 선택 체크박스 */}
                    <button
                      type="button"
                      onClick={() => toggleSelectMember(member.id)}
                      className="p-1 mt-0.5 rounded hover:bg-slate-200/50 text-slate-400 hover:text-sky-600 transition-colors shrink-0"
                      title={isSelected ? '선택 해제' : '인쇄 대상 선택'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-sky-600 fill-sky-100" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>

                    {/* 종친 기본 정보 */}
                    <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-lg font-black text-slate-900 tracking-wide">
                        {member.name}
                      </span>
                      <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">
                        {member.branch} {member.generation ? `${member.generation}세` : ''}
                      </span>
                      {member.role && (
                        <span className="text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <Crown className="w-3.5 h-3.5 text-amber-600" />
                          <span>종친회 직책: {member.role}</span>
                        </span>
                      )}
                      {member.isCustom && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          현장신규
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {(member.mobile || member.phone) && (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {member.mobile || member.phone}
                        </span>
                      )}
                      {member.address && (
                        <span className="flex items-center gap-1 truncate max-w-[280px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {member.address}
                        </span>
                      )}
                      {member.job && (
                        <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          생업: {member.job.replace(/\n/g, ' ')}
                        </span>
                      )}
                    </div>

                    {/* 역대 출석 이력 배지 (클릭 시 몇년도 출석했는지 한눈에 파악) */}
                    {(() => {
                      const hist = historyMap.get(member.id) || [];
                      if (hist.length === 0) return null;
                      return (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[10px] font-bold text-sky-800 flex items-center gap-0.5">
                            <Calendar className="w-3 h-3 text-sky-600" /> 역대참석:
                          </span>
                          {hist.slice(0, 3).map((h, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded"
                            >
                              {h.year}년
                            </span>
                          ))}
                          {hist.length > 3 && (
                            <span className="text-[10px] text-slate-400">
                              외 {hist.length - 3}건
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 우측 접수 상태 및 액션 버튼 */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* 정보 수정 버튼 (연락처 8206 vs 9206 등 즉시 수정) */}
                    <button
                      type="button"
                      onClick={() => onEditMember(member)}
                      className="px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                      title="연락처, 주소, 세수 등 회원 정보 수정"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      정보 수정
                    </button>

                    {checkedIn ? (
                      <div className="flex items-center gap-2">
                        {/* 클릭 가능한 접수완료 & 회비 수정 버튼 */}
                        <button
                          type="button"
                          onClick={() => onOpenCheckin(member)}
                          className="px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 active:scale-95 border-2 border-emerald-400 rounded-xl shadow-sm flex items-center gap-1.5 transition-all group"
                          title="회비 금액 또는 결제 방식 바로 수정하기"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700 group-hover:hidden" />
                          <Edit3 className="w-3.5 h-3.5 text-emerald-800 hidden group-hover:inline" />
                          <span>접수완료 ({checkedIn.feeAmount.toLocaleString()}원)</span>
                          <span className="text-[11px] bg-emerald-700 text-white px-2 py-0.5 rounded font-black ml-1 shadow-2xs">
                            회비수정 ✏️
                          </span>
                        </button>

                        <button
                          onClick={() => onQuickPrint(checkedIn)}
                          className="px-3 py-2 text-xs font-bold text-sky-700 bg-white hover:bg-sky-50 border border-sky-300 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                          title="명찰 라벨 다시 인쇄하기"
                        >
                          <Printer className="w-3.5 h-3.5 text-sky-600" />
                          라벨 재발행
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenCheckin(member)}
                        className="px-5 py-2.5 text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        현장 접수 & 회비 입력
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 화면 하단 고정 플로팅 일괄 인쇄 바 (스크롤 중에도 1클릭 즉시 인쇄 가능) */}
      {selectedMemberIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700 flex flex-wrap items-center justify-center gap-3.5 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-xs">
              {selectedMemberIds.size}명
            </span>
            <span className="text-xs font-bold text-slate-200">선택 완료</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <button
            type="button"
            onClick={handleBatchPrint}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            선택한 {selectedMemberIds.size}명 바로 일괄 인쇄
          </button>

          <button
            type="button"
            onClick={handleAddToQueue}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-600 flex items-center gap-1.5 transition-all"
          >
            <ListPlus className="w-4 h-4 text-sky-300" />
            대기열 담기
          </button>

          <button
            type="button"
            onClick={() => setSelectedMemberIds(new Set())}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="선택 해제"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
