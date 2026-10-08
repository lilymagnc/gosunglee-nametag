import React, { useState } from 'react';
import { Member, AttendanceRecord, LabelSettings } from '../types';
import { parseExcelToMembers } from '../utils/excel';
import {
  Users,
  Upload,
  Download,
  RefreshCw,
  FileText,
  CheckCircle2,
  Edit3,
  CheckSquare,
  Square,
  Printer,
  ListPlus,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface MemberListProps {
  members: Member[];
  settings?: LabelSettings;
  onUpdateMembers: (newMembers: Member[]) => void;
  onResetToDefault: () => void;
  onEditMember: (member: Member) => void;
  onBatchPrint?: (records: AttendanceRecord[]) => void;
  onAddToQueue?: (records: AttendanceRecord[]) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  settings,
  onUpdateMembers,
  onResetToDefault,
  onEditMember,
  onBatchPrint,
  onAddToQueue,
}) => {
  const [filter, setFilter] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
    const data = members.map((m, idx) => ({
      '순번': idx + 1,
      '성명': m.name,
      '파명': m.branch,
      '세수': m.generation ? `${m.generation}세` : '',
      '직책': m.role || '',
      '연락처': m.mobile || m.phone || '',
      '거주지/주소': m.address || '',
      '직업': m.job || '',
      '본향/생년': m.birthOrigin || '',
      '등록유형': m.isCustom ? '현장신규' : '기존원부',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '고성이씨_전체주소록');
    XLSX.writeFile(wb, `고성이씨_전체주소록_${members.length}명.xlsx`);
  };

  const filtered = members.filter(
    (m) =>
      m.name.includes(filter) ||
      m.branch.includes(filter) ||
      (m.mobile && m.mobile.includes(filter))
  );

  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());

  const displayedMembers = filtered.slice(0, 150);

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
      return {
        id: `sel-mem-${id}-${Date.now()}`,
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
        year: settings?.eventYear || 2026,
        eventName: settings?.eventName || '',
        isNewMember: false,
        printedCount: 0,
        printSlot: 1,
      };
    });
    onBatchPrint(records);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            종친회 마스터 주소록 관리 (총 {members.length}명)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            구글 시트에서 내려받은 원본 1,168명 및 당일 현장 추가된 종친 명단을 관리합니다.
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

          {/* 전체 주소록 엑셀 다운로드 */}
          <button
            onClick={handleExportFullList}
            className="px-3.5 py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            전체 주소록 엑셀 백업
          </button>

          {/* 원본 기본값 복원 */}
          <button
            onClick={onResetToDefault}
            className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 flex items-center gap-1"
            title="초기 구글 시트 1,168명 데이터로 복원"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            초기 데이터 복원
          </button>
        </div>
      </div>

      {/* 목록 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="이름, 파명, 연락처 필터링..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3.5 py-2 text-xs border border-slate-300 rounded-lg w-72 bg-white"
            />
            <span className="text-xs text-slate-500 font-semibold">
              {filtered.length}명 조회됨
            </span>
          </div>

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
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
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

        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
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
                <th className="px-3.5 py-2.5">직책/직업</th>
                <th className="px-3.5 py-2.5">연락처</th>
                <th className="px-3.5 py-2.5">주소</th>
                <th className="px-3.5 py-2.5 text-center">구분</th>
                <th className="px-3.5 py-2.5 text-center">수정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedMembers.map((m) => {
                const isSelected = selectedMemberIds.has(m.id);
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
                    <td className="px-3.5 py-2 text-center text-slate-400">{m.id}</td>
                    <td className="px-3.5 py-2 font-bold text-slate-900">{m.name}</td>
                    <td className="px-3.5 py-2 text-sky-800 font-semibold">{m.branch}</td>
                    <td className="px-3.5 py-2 text-center font-bold text-slate-700">
                      {m.generation ? `${m.generation}세` : '-'}
                    </td>
                    <td className="px-3.5 py-2">
                      {m.role && m.job ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded text-[11px] w-fit">
                            {m.role}
                          </span>
                          <span className="text-slate-500 text-[11px] whitespace-pre-line">
                            {m.job.replace('\n', ' ')}
                          </span>
                        </div>
                      ) : m.role ? (
                        <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded text-[11px]">
                          {m.role}
                        </span>
                      ) : m.job ? (
                        <span className="text-slate-600 text-[11px] whitespace-pre-line">
                          {m.job.replace('\n', ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2">{m.mobile || m.phone || '-'}</td>
                    <td className="px-3.5 py-2 truncate max-w-[200px]">{m.address || '-'}</td>
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
