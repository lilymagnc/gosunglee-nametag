import React, { useState } from 'react';
import { AttendanceRecord } from '../types';
import { exportAttendanceToExcel } from '../utils/excel';
import { FileSpreadsheet, Download, Copy, Users, DollarSign, Wallet, CreditCard, UserPlus, Printer, Trash2, CheckCircle2, Edit3 } from 'lucide-react';

interface DashboardProps {
  records: AttendanceRecord[];
  onDeleteRecord: (id: string) => void;
  onPrintRecord: (record: AttendanceRecord) => void;
  onClearAll: () => void;
  onEditRecord?: (record: AttendanceRecord) => void;
  eventName?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  records,
  onDeleteRecord,
  onPrintRecord,
  onClearAll,
  onEditRecord,
  eventName,
}) => {
  const [copied, setCopied] = useState(false);

  // 통계 계산
  const totalCount = records.length;
  const newMemberCount = records.filter(r => r.isNewMember).length;
  const totalFee = records.reduce((sum, r) => sum + (r.feeAmount || 0), 0);
  const cashFee = records.filter(r => r.paymentMethod === '현금').reduce((sum, r) => sum + (r.feeAmount || 0), 0);
  const transferFee = records.filter(r => r.paymentMethod === '계좌이체').reduce((sum, r) => sum + (r.feeAmount || 0), 0);
  const otherFee = totalFee - cashFee - transferFee;

  // 파별 참석 현황 집계
  const branchCounts: Record<string, number> = {};
  records.forEach(r => {
    branchCounts[r.branch] = (branchCounts[r.branch] || 0) + 1;
  });

  // 구글 스프레드시트용 TSV 클립보드 복사
  const handleCopyForSheet = () => {
    if (records.length === 0) return;

    const headers = ['순번', '접수시간', '성명', '파명', '세수', '직책', '직업', '회비금액', '납부방식', '연락처', '주소', '비고'];
    const rows = records.map((r, i) => [
      i + 1,
      r.timestamp,
      r.name,
      r.branch,
      r.generation ? `${r.generation}세` : '',
      r.role || '',
      r.job || '',
      r.feeAmount,
      r.paymentMethod,
      r.mobile || '',
      r.address || '',
      r.notes || '',
    ]);

    const tsv = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportExcel = () => {
    if (records.length === 0) {
      alert('내보낼 접수 내역이 없습니다.');
      return;
    }
    exportAttendanceToExcel(records, eventName ? eventName.replace(/\s+/g, '_') : undefined);
  };

  return (
    <div className="space-y-6">
      {/* 상단 통계 카드 4개 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. 총 참석자 수 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">총 참석 인원</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalCount}명</p>
            <p className="text-xs text-sky-600 font-semibold mt-1">
              신규 등록 {newMemberCount}명 포함
            </p>
          </div>
          <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* 2. 총 수납 회비 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">총 수납 회비</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {totalFee.toLocaleString()}원
            </p>
            <p className="text-xs text-slate-400 mt-1">
              1인 평균 {totalCount > 0 ? Math.round(totalFee / totalCount).toLocaleString() : 0}원
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* 3. 현금 수납액 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">현금 수납</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {cashFee.toLocaleString()}원
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {totalFee > 0 ? `${Math.round((cashFee / totalFee) * 100)}%` : '0%'}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* 4. 계좌이체 수납액 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">계좌이체 수납</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {transferFee.toLocaleString()}원
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {totalFee > 0 ? `${Math.round((transferFee / totalFee) * 100)}%` : '0%'}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 파별 참석 인원 바 */}
      {Object.keys(branchCounts).length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            공파(派)별 참석 현황
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(branchCounts).map(([branch, count]) => (
              <div
                key={branch}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <span className="text-slate-800">{branch}</span>
                <span className="bg-sky-600 text-white px-2 py-0.5 rounded-full text-[11px] font-bold">
                  {count}명
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 대장 테이블 & 내보내기 액션 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              당일 참석자 및 회비 수납 대장
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              접수된 모든 명단과 입금 금액을 엑셀로 내려받거나 구글 시트에 바로 붙여넣을 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyForSheet}
              disabled={records.length === 0}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
              title="구글 시트에 바로 Ctrl+V 할 수 있는 텍스트로 복사"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? '복사 완료!' : '구글 시트용 복사'}
            </button>

            <button
              onClick={handleExportExcel}
              disabled={records.length === 0}
              className="px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-300 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              엑셀(.xlsx) 다운로드
            </button>

            {records.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="전체 수납 대장 초기화"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 테이블 목록 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3 text-center">순번</th>
                <th className="px-3.5 py-3">접수일시</th>
                <th className="px-3.5 py-3">성명</th>
                <th className="px-3.5 py-3">공파</th>
                <th className="px-3.5 py-3 text-center">세수</th>
                <th className="px-3.5 py-3">직책 / 직업</th>
                <th className="px-3.5 py-3 text-right">납부 회비</th>
                <th className="px-3.5 py-3 text-center">납부방식</th>
                <th className="px-3.5 py-3">연락처</th>
                <th className="px-3.5 py-3">비고/찬조</th>
                <th className="px-3.5 py-3 text-center">인쇄/관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    접수된 회원이 아직 없습니다. [현장 접수] 탭에서 회원을 접수해 주세요.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3.5 py-2.5 text-center text-slate-400">{idx + 1}</td>
                    <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">{r.timestamp}</td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                      {r.name}
                      {r.isNewMember && (
                        <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                          신규
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-sky-800 font-semibold">{r.branch}</td>
                    <td className="px-3.5 py-2.5 text-center text-slate-700">
                      {r.generation ? `${r.generation}세` : '-'}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-800">
                      {r.role && r.job ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] w-fit">
                            {r.role}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                            {r.job.replace('\n', ' ')}
                          </span>
                        </div>
                      ) : r.role ? (
                        <span className="font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                          {r.role}
                        </span>
                      ) : r.job ? (
                        <span className="text-slate-600 text-[11px] truncate max-w-[150px] inline-block">
                          {r.job.replace('\n', ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      {r.feeAmount > 0 ? `${r.feeAmount.toLocaleString()}원` : '면제'}
                    </td>
                    <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.paymentMethod}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">{r.mobile || '-'}</td>
                    <td className="px-3.5 py-2.5 text-slate-500 truncate max-w-[150px]">{r.notes || '-'}</td>
                    <td className="px-3.5 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onEditRecord && (
                          <button
                            onClick={() => onEditRecord(r)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="회비 금액 및 접수 내역 수정"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onPrintRecord(r)}
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="명찰 바로 출력"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(r.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          title="접수 취소/삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
