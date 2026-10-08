import React, { useState, useMemo, useEffect } from 'react';
import { Member, AttendanceRecord, LabelSettings } from '../types';
import { parseExcelToMembers } from '../utils/excel';
import { matchKorean } from '../utils/hangul';
import {
  Users,
  Upload,
  Download,
  RefreshCw,
  Edit3,
  CheckSquare,
  Square,
  Printer,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Crown,
  MapPin,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface MemberListProps {
  members: Member[];
  attendanceRecords?: AttendanceRecord[];
  settings?: LabelSettings;
  onUpdateMembers: (newMembers: Member[]) => void;
  onResetToDefault: () => void;
  onEditMember: (member: Member) => void;
  onBatchPrint?: (records: AttendanceRecord[]) => void;
  onAddToQueue?: (records: AttendanceRecord[]) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  attendanceRecords = [],
  settings,
  onUpdateMembers,
  onResetToDefault,
  onEditMember,
  onBatchPrint,
  onAddToQueue,
}) => {
  // 필터 상태들
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    return localStorage.getItem('gosung_member_branch') || '전체';
  });
  const [attendanceStatus, setAttendanceStatus] = useState<'all' | 'attended' | 'not_attended'>(() => {
    return (localStorage.getItem('gosung_member_attendance') as any) || 'all';
  });
  const [printStatus, setPrintStatus] = useState<'all' | 'not_printed' | 'printed'>(() => {
    return (localStorage.getItem('gosung_member_print') as any) || 'all';
  });
  const [generationFilter, setGenerationFilter] = useState<string>(() => {
    return localStorage.getItem('gosung_member_generation') || 'all';
  });
  const [roleFilter, setRoleFilter] = useState<'all' | 'executives' | 'regular'>(() => {
    return (localStorage.getItem('gosung_member_role') as any) || 'all';
  });
  const [regionFilter, setRegionFilter] = useState<'all' | 'seoul' | 'gyeonggi' | 'other' | 'none'>(() => {
    return (localStorage.getItem('gosung_member_region') as any) || 'all';
  });

  useEffect(() => {
    localStorage.setItem('gosung_member_branch', selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    localStorage.setItem('gosung_member_attendance', attendanceStatus);
  }, [attendanceStatus]);

  useEffect(() => {
    localStorage.setItem('gosung_member_print', printStatus);
  }, [printStatus]);

  useEffect(() => {
    localStorage.setItem('gosung_member_generation', generationFilter);
  }, [generationFilter]);

  useEffect(() => {
    localStorage.setItem('gosung_member_role', roleFilter);
  }, [roleFilter]);

  useEffect(() => {
    localStorage.setItem('gosung_member_region', regionFilter);
  }, [regionFilter]);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());

  // 출석 및 인쇄 맵 (memberId -> AttendanceRecord)
  const attendanceMap = useMemo(() => {
    const map = new Map<number, AttendanceRecord>();
    attendanceRecords.forEach((r) => {
      map.set(r.memberId, r);
    });
    return map;
  }, [attendanceRecords]);

  // 파별 인원수 계산
  const branchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      const b = m.branch ? m.branch.trim() : '미지정';
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [members]);

  // 존재하는 모든 파 목록 (인원수 내림차순 정렬)
  const branchList = useMemo(() => {
    return Object.keys(branchCounts).sort((a, b) => branchCounts[b] - branchCounts[a]);
  }, [branchCounts]);

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBranch('전체');
    setAttendanceStatus('all');
    setPrintStatus('all');
    setGenerationFilter('all');
    setRoleFilter('all');
    setRegionFilter('all');
  };

  const isFilterActive =
    searchQuery !== '' ||
    selectedBranch !== '전체' ||
    attendanceStatus !== 'all' ||
    printStatus !== 'all' ||
    generationFilter !== 'all' ||
    roleFilter !== 'all' ||
    regionFilter !== 'all';

  // 다중 필터링 적용
  const filtered = useMemo(() => {
    const q = searchQuery.trim();
    return members.filter((m) => {
      // 1. 공파 필터
      if (selectedBranch !== '전체') {
        if ((m.branch || '').trim() !== selectedBranch) return false;
      }

      // 2. 출석/접수 상태 필터
      const record = attendanceMap.get(m.id);
      if (attendanceStatus === 'attended' && !record) return false;
      if (attendanceStatus === 'not_attended' && record) return false;

      // 3. 명찰 인쇄 상태 필터
      if (printStatus === 'not_printed') {
        if (record && (record.printedCount || 0) > 0) return false;
      } else if (printStatus === 'printed') {
        if (!record || (record.printedCount || 0) === 0) return false;
      }

      // 4. 세수(항렬) 필터
      const gen = Number(m.generation);
      if (generationFilter === 'elder') {
        if (!gen || gen > 29) return false; // 27~29세 원로
      } else if (generationFilter === 'mid') {
        if (!gen || gen < 30 || gen > 32) return false; // 30~32세 중진
      } else if (generationFilter === 'youth') {
        if (!gen || gen < 33) return false; // 33세 이상 청장년
      } else if (generationFilter !== 'all') {
        if (String(m.generation) !== generationFilter) return false;
      }

      // 5. 직책/임원 필터
      const hasRole = Boolean(m.role && m.role.trim() && m.role !== '-');
      if (roleFilter === 'executives' && !hasRole) return false;
      if (roleFilter === 'regular' && hasRole) return false;

      // 6. 거주 지역(권역) 필터
      const addr = m.address || '';
      if (regionFilter === 'seoul' && !addr.includes('서울')) return false;
      if (regionFilter === 'gyeonggi' && !(addr.includes('경기') || addr.includes('인천'))) return false;
      if (regionFilter === 'other' && (!addr || addr.includes('서울') || addr.includes('경기') || addr.includes('인천'))) return false;
      if (regionFilter === 'none' && addr.trim() !== '') return false;

      // 7. 검색어 (이름, 한글 초성, 전화번호 뒷자리, 직업, 직책, 주소)
      if (!q) return true;
      if (matchKorean(m.name, q)) return true;
      const cleanPhone = (m.mobile || m.phone || '').replace(/[^0-9]/g, '');
      const cleanQuery = q.replace(/[^0-9]/g, '');
      if (cleanQuery && cleanPhone.includes(cleanQuery)) return true;
      if (m.branch && m.branch.includes(q)) return true;
      if (m.role && m.role.includes(q)) return true;
      if (m.job && m.job.includes(q)) return true;
      if (m.address && m.address.includes(q)) return true;

      return false;
    });
  }, [
    members,
    searchQuery,
    selectedBranch,
    attendanceStatus,
    printStatus,
    generationFilter,
    roleFilter,
    regionFilter,
    attendanceMap,
  ]);

  const displayedMembers = filtered.slice(0, 200);

  const isAllSelected =
    displayedMembers.length > 0 &&
    displayedMembers.every((m) => selectedMemberIds.has(m.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(displayedMembers.map((m) => m.id)));
    }
  };

  const toggleSelectMember = (id: number) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchPrintClick = () => {
    if (!onBatchPrint || selectedMemberIds.size === 0) return;
    const records: AttendanceRecord[] = Array.from(selectedMemberIds).map((id) => {
      const m = members.find((mem) => mem.id === id);
      const existing = attendanceMap.get(id);
      return {
        id: existing?.id || `sel-mem-${id}-${Date.now()}`,
        memberId: id,
        name: m?.name || '',
        branch: m?.branch || '고성이씨',
        generation: m?.generation || '',
        role: m?.role || '',
        job: m?.job || '',
        feeAmount: existing?.feeAmount || 0,
        paymentMethod: existing?.paymentMethod || '현금',
        notes: existing?.notes || '',
        timestamp: existing?.timestamp || new Date().toISOString(),
        year: settings?.eventYear || 2026,
        eventName: settings?.eventName || '',
        isNewMember: existing?.isNewMember || false,
        printedCount: existing?.printedCount || 0,
        printSlot: existing?.printSlot || 1,
      };
    });
    onBatchPrint(records);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const parsed = await parseExcelToMembers(file);
      if (parsed.length === 0) {
        alert('엑셀 파일에서 회원 데이터를 찾을 수 없습니다.');
        return;
      }
      onUpdateMembers(parsed);
      alert(`총 ${parsed.length}명의 회원 주소록을 성공적으로 불러왔습니다.`);
    } catch (err) {
      console.error(err);
      alert('엑셀 파일 읽기 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportFullList = () => {
    const data = filtered.map((m, idx) => {
      const att = attendanceMap.get(m.id);
      return {
        '순번': idx + 1,
        '성명': m.name,
        '파명': m.branch,
        '세수': m.generation ? `${m.generation}세` : '',
        '직책': m.role || '',
        '출석상태': att ? '출석(접수완료)' : '미출석',
        '회비납부': att ? `${att.feeAmount.toLocaleString()}원 (${att.paymentMethod})` : '-',
        '명찰출력': att ? `${att.printedCount}회` : '-',
        '연락처': m.mobile || m.phone || '',
        '거주지/주소': m.address || '',
        '직업': m.job || '',
        '등록유형': m.isCustom ? '현장신규' : '기존원부',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '고성이씨_주소록');
    XLSX.writeFile(wb, `고성이씨_주소록_${filtered.length}명.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* 1. 상단 타이틀 및 백업/업로드 바 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            종친회 마스터 주소록 관리 (총 {members.length}명)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            서울종친회, 용헌종중, 대종회 및 각 공파별 통합 주소록입니다. 필터링 후 명찰 일괄 인쇄 및 엑셀 추출이 가능합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 엑셀 파일 새로 업로드 */}
          <label className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 transition-all">
            <Upload className="w-4 h-4 text-slate-500" />
            {isUploading ? '분석 중...' : '엑셀(.xlsx) 새로 올리기'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* 전체/조회 목록 엑셀 다운로드 */}
          <button
            onClick={handleExportFullList}
            className="px-3.5 py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all flex items-center gap-1.5"
            title="현재 필터링된 목록을 엑셀로 저장"
          >
            <Download className="w-4 h-4" />
            {isFilterActive ? `조회 목록 (${filtered.length}명) 엑셀 저장` : '전체 주소록 엑셀 백업'}
          </button>

          {/* 원본 기본값 복원 */}
          <button
            onClick={onResetToDefault}
            className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 flex items-center gap-1"
            title="초기 구글 시트 1,168명 데이터로 복원"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            초기 복원
          </button>
        </div>
      </div>

      {/* 2. 공파(파계)별 가로 스크롤 탭 바 */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <span className="font-bold text-slate-500 shrink-0 flex items-center gap-1 pl-1 pr-2 border-r border-slate-200">
            <Filter className="w-3.5 h-3.5 text-sky-600" /> 공파별
          </span>
          <button
            type="button"
            onClick={() => setSelectedBranch('전체')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              selectedBranch === '전체'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedBranch === '전체' ? 'bg-slate-700 text-sky-200' : 'bg-slate-200 text-slate-700'
            }`}>
              {members.length}
            </span>
          </button>

          {branchList.map((branch) => {
            const count = branchCounts[branch] || 0;
            const isSelected = selectedBranch === branch;
            return (
              <button
                key={branch}
                type="button"
                onClick={() => setSelectedBranch(branch)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300'
                }`}
              >
                {branch}
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 다차원 상세 필터링 컨트롤 바 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1) 검색어 입력 (성명, 초성, 전화번호 뒷자리) */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="성명(초성: ㅇㄱㅇ), 전화 뒷자리, 직책..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>

          {/* 2) 출석 / 접수 상태 */}
          <div>
            <select
              value={attendanceStatus}
              onChange={(e) => setAttendanceStatus(e.target.value as any)}
              className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-700"
            >
              <option value="all">전체 출석현황</option>
              <option value="attended">🟢 접수(출석) 완료</option>
              <option value="not_attended">⚪ 미접수 (미출석)</option>
            </select>
          </div>

          {/* 3) 명찰 인쇄 상태 */}
          <div>
            <select
              value={printStatus}
              onChange={(e) => setPrintStatus(e.target.value as any)}
              className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-700"
            >
              <option value="all">전체 인쇄상태</option>
              <option value="not_printed">🖨️ 명찰 미출력자만</option>
              <option value="printed">✅ 명찰 인쇄완료</option>
            </select>
          </div>

          {/* 4) 세수(항렬) 필터 */}
          <div>
            <select
              value={generationFilter}
              onChange={(e) => setGenerationFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-700"
            >
              <option value="all">전체 세수(항렬)</option>
              <option value="elder">원로 어르신 (27~29세)</option>
              <option value="mid">중진 종친 (30~32세)</option>
              <option value="youth">청장년 종친 (33세 이상)</option>
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

          {/* 5) 직책 / 임원 필터 */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-2.5 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-700"
            >
              <option value="all">전체 직책구분</option>
              <option value="executives">👑 임원 / 직책자만</option>
              <option value="regular">일반 종친</option>
            </select>
          </div>
        </div>

        {/* 2번째 필터 보조 줄: 지역 + 초기화 버튼 + 결과 카운트 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> 지역:
            </span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value as any)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="all">전체 권역</option>
              <option value="seoul">서울 권역</option>
              <option value="gyeonggi">경기 / 인천</option>
              <option value="other">지방 (강원/충청/영호남)</option>
              <option value="none">주소 미기재</option>
            </select>

            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg font-bold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> 필터 전체 초기화
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">
              총 <strong className="text-sky-600 font-black">{filtered.length}명</strong> 검색됨
              {filtered.length > displayedMembers.length && (
                <span className="text-slate-400 font-normal ml-1">
                  (상위 {displayedMembers.length}명 표시 중)
                </span>
              )}
            </span>

            {/* 선택 일괄 인쇄 버튼 */}
            {selectedMemberIds.size > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-xs font-black text-sky-800 bg-sky-100 px-2.5 py-1 rounded-lg">
                  {selectedMemberIds.size}명 선택
                </span>
                {onBatchPrint && (
                  <button
                    type="button"
                    onClick={handleBatchPrintClick}
                    className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Printer className="w-4 h-4 text-slate-950" />
                    선택한 {selectedMemberIds.size}명 명찰 일괄 인쇄
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedMemberIds(new Set())}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-slate-700"
                >
                  선택 해제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. 종친 목록 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">
              <tr>
                <th className="px-3 py-2.5 text-center w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="p-1 rounded hover:bg-slate-200 transition-colors"
                    title={isAllSelected ? '전체 선택 해제' : '전체 선택'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-sky-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="px-3.5 py-2.5 text-center">ID</th>
                <th className="px-3.5 py-2.5">성명</th>
                <th className="px-3.5 py-2.5">공파</th>
                <th className="px-3.5 py-2.5 text-center">세수</th>
                <th className="px-3.5 py-2.5">직책</th>
                <th className="px-3.5 py-2.5 text-center">출석 / 명찰</th>
                <th className="px-3.5 py-2.5">연락처</th>
                <th className="px-3.5 py-2.5">거주지 주소 / 생업</th>
                <th className="px-3.5 py-2.5 text-center">구분</th>
                <th className="px-3.5 py-2.5 text-center">수정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedMembers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    선택하신 필터 조건에 해당하는 종친이 없습니다.
                  </td>
                </tr>
              ) : (
                displayedMembers.map((m) => {
                  const isSelected = selectedMemberIds.has(m.id);
                  const att = attendanceMap.get(m.id);
                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-sky-50/80 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectMember(m.id)}
                          className="p-1 rounded hover:bg-slate-200/50 text-slate-400 hover:text-sky-600 transition-colors"
                          title={isSelected ? '선택 해제' : '선택'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-3.5 py-2 text-center text-slate-400 font-mono">{m.id}</td>
                      <td className="px-3.5 py-2 font-bold text-slate-900 text-sm">{m.name}</td>
                      <td className="px-3.5 py-2 text-sky-800 font-semibold">{m.branch || '-'}</td>
                      <td className="px-3.5 py-2 text-center font-bold text-slate-700">
                        {m.generation ? `${m.generation}세` : '-'}
                      </td>
                      <td className="px-3.5 py-2">
                        {m.role ? (
                          <span className="font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 w-fit shadow-2xs">
                            <Crown className="w-3 h-3 text-amber-600" />
                            {m.role}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2 text-center">
                        {att ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 출석
                            </span>
                            <span className="text-[9px] text-slate-400">
                              인쇄 {att.printedCount || 0}회
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            미접수
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-[11px]">{m.mobile || m.phone || '-'}</td>
                      <td className="px-3.5 py-2 max-w-[220px]">
                        <div className="truncate text-slate-700" title={m.address || ''}>
                          {m.address || '-'}
                        </div>
                        {m.job && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5" title={m.job}>
                            생업: {m.job.replace(/\n/g, ' ')}
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-2 text-center">
                        {m.isCustom ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                            현장신규
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            원부
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2 text-center">
                        <button
                          onClick={() => onEditMember(m)}
                          className="px-2.5 py-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg font-semibold flex items-center gap-1 mx-auto transition-colors"
                          title="회원 정보(전화번호/주소 등) 수정"
                        >
                          <Edit3 className="w-3 h-3 text-amber-600" />
                          수정
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
