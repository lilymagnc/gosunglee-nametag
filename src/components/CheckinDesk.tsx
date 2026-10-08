import React, { useState, useMemo } from 'react';
import { Member, AttendanceRecord, LabelSettings } from '../types';
import { BRANCHES } from '../data/defaultMembers';
import { matchKorean } from '../utils/hangul';
import { loadAttendanceHistory } from '../utils/storage';
import { Search, UserPlus, CheckCircle, Clock, Printer, Filter, Phone, MapPin, Briefcase, Edit3, Calendar } from 'lucide-react';

interface CheckinDeskProps {
  members: Member[];
  attendanceRecords: AttendanceRecord[];
  onOpenCheckin: (member: Member) => void;
  onOpenNewMember: () => void;
  onQuickPrint: (record: AttendanceRecord) => void;
  onEditMember: (member: Member) => void;
}

export const CheckinDesk: React.FC<CheckinDeskProps> = ({
  members,
  attendanceRecords,
  onOpenCheckin,
  onOpenNewMember,
  onQuickPrint,
  onEditMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('전체');
  const [onlyCheckedIn, setOnlyCheckedIn] = useState<boolean>(false);

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

  // 검색 및 필터링
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim();
    return members.filter((m) => {
      // 당일 접수자만 보기 필터
      if (onlyCheckedIn && !checkedInMap.has(m.id)) {
        return false;
      }

      // 파별 필터
      if (selectedBranch !== '전체' && m.branch !== selectedBranch) {
        return false;
      }

      // 검색어 없는 경우 기본 상위 50명 노출
      if (!q) return true;

      // 1. 성명 한글/초성 매칭
      if (matchKorean(m.name, q)) return true;

      // 2. 전화번호 매칭 (뒷 4자리 등)
      const cleanPhone = (m.mobile || m.phone || '').replace(/[^0-9]/g, '');
      const cleanQuery = q.replace(/[^0-9]/g, '');
      if (cleanQuery && cleanPhone.includes(cleanQuery)) return true;

      // 3. 직책/직업 매칭
      if (m.job && m.job.includes(q)) return true;
      if (m.role && m.role.includes(q)) return true;

      return false;
    });
  }, [members, searchQuery, selectedBranch, onlyCheckedIn, checkedInMap]);

  // 화면 표시 개수 제한 (성능 최적화: 검색어 없으면 40개, 검색어 있으면 최대 100개)
  const displayList = useMemo(() => {
    return filteredMembers.slice(0, searchQuery || onlyCheckedIn ? 100 : 40);
  }, [filteredMembers, searchQuery, onlyCheckedIn]);

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
          {BRANCHES.map((branch) => {
            const count = members.filter((m) => m.branch === branch).length;
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

      {/* 2. 검색 결과 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-3">
            <span>
              검색 결과: <strong className="text-slate-900">{filteredMembers.length}</strong>명
              {filteredMembers.length > displayList.length && ` (상위 ${displayList.length}명 표시 중)`}
            </span>
            {onlyCheckedIn && (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                접수 완료자만 필터링 중
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 당일 접수자만 보기 원클릭 토글 버튼 */}
            <button
              type="button"
              onClick={() => setOnlyCheckedIn(!onlyCheckedIn)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                onlyCheckedIn
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-300'
                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
              }`}
              title="오늘 접수한 회원만 모아보기"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              당일 접수자만 보기 ({attendanceRecords.length}명)
            </button>
          </div>
        </div>

        {displayList.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <Search className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">
              {onlyCheckedIn ? '당일 접수된 회원이 없습니다.' : '검색 결과가 없습니다.'}
            </p>
            <p className="text-xs text-slate-400">
              주소록에 등록되지 않은 종친은 상단의 <strong>[+ 신규 종친 현장 등록]</strong> 버튼을 눌러 바로 접수해 주세요.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayList.map((member) => {
              const checkedIn = checkedInMap.get(member.id);

              return (
                <div
                  key={member.id}
                  className={`p-4 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    checkedIn ? 'bg-emerald-50/40' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* 종친 기본 정보 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg font-black text-slate-900 tracking-wide">
                        {member.name}
                      </span>
                      <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">
                        {member.branch} {member.generation ? `${member.generation}세` : ''}
                      </span>
                      {member.role && (
                        <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span className="text-[10px] text-amber-700 font-normal">직책:</span>
                          {member.role}
                        </span>
                      )}
                      {member.job && (
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-500" />
                          <span className="text-[10px] text-slate-500 font-normal">직업:</span>
                          {member.job.replace(/\n/g, ' ')}
                        </span>
                      )}
                      {member.isCustom && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          현장등록
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {(member.mobile || member.phone) && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {member.mobile || member.phone}
                        </span>
                      )}
                      {member.address && (
                        <span className="flex items-center gap-1 truncate max-w-[300px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {member.address}
                        </span>
                      )}
                      {member.job && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Briefcase className="w-3.5 h-3.5" />
                          {member.job.replace('\n', ' ')}
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
    </div>
  );
};
