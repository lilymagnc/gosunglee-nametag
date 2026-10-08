import React, { useState } from 'react';
import { Member, AttendanceRecord, LabelSettings, PaperSize } from '../types';
import { BRANCHES, ROLE_PRESETS } from '../data/defaultMembers';
import { CURRENT_EVENT } from '../utils/storage';
import { LabelCard } from './LabelCard';
import { UserPlus, Printer, Clock, X, DollarSign, Layers, Check } from 'lucide-react';

interface NewMemberModalProps {
  settings: LabelSettings;
  isOpen: boolean;
  onClose: () => void;
  onRegister: (
    member: Member,
    record: AttendanceRecord,
    printNow: boolean,
    customSettings?: LabelSettings
  ) => void;
  onOpenSettings?: () => void;
  onUpdateSettings?: (settings: LabelSettings) => void;
}

export const NewMemberModal: React.FC<NewMemberModalProps> = ({
  settings,
  isOpen,
  onClose,
  onRegister,
  onOpenSettings,
  onUpdateSettings,
}) => {
  const [name, setName] = useState('');
  const [branch, setBranch] = useState<string>('사암공파');
  const [customBranch, setCustomBranch] = useState('');
  const [generation, setGeneration] = useState<string>('31');
  const [role, setRole] = useState('');
  const [job, setJob] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [feeAmount, setFeeAmount] = useState<number>(20000);
  const [paymentMethod, setPaymentMethod] = useState<'현금' | '계좌이체' | '카드' | '기타' | '미납'>('현금');
  const [notes, setNotes] = useState('');

  // 용지 및 슬롯 선택 상태 (직전 전역 설정 100% 기억)
  const [paperSize, setPaperSize] = useState<PaperSize>(settings.paperSize || 'formtec_3114');
  const [selectedSlot, setSelectedSlot] = useState<number>(settings.formtecStartSlot || 1);
  const [previewThermal, setPreviewThermal] = useState<'color' | 'outline' | 'inverted' | 'textOnly'>(
    settings.thermalMode || (settings.paperSize === 'formtec_3114' ? 'color' : 'inverted')
  );

  React.useEffect(() => {
    setPaperSize(settings.paperSize || 'formtec_3114');
    setPreviewThermal(settings.thermalMode || (settings.paperSize === 'formtec_3114' ? 'color' : 'inverted'));
  }, [settings, isOpen]);

  const handlePaperSizeChange = (newSize: PaperSize) => {
    setPaperSize(newSize);
    let newThermal = previewThermal;
    if (newSize !== 'formtec_3114' && previewThermal === 'color') {
      newThermal = 'inverted';
      setPreviewThermal('inverted');
    }
    const updated: LabelSettings = {
      ...settings,
      paperSize: newSize,
      thermalMode: newThermal,
    };
    onUpdateSettings?.(updated);
  };

  const handleThermalModeChange = (newMode: 'color' | 'outline' | 'inverted') => {
    setPreviewThermal(newMode);
    const updated: LabelSettings = {
      ...settings,
      thermalMode: newMode,
    };
    onUpdateSettings?.(updated);
  };

  const effectiveBranch = branch === '직접입력' ? customBranch.trim() || '미지정' : branch;

  const handleSubmit = (printNow: boolean) => {
    if (!name.trim()) {
      alert('성함을 입력해 주세요.');
      return;
    }

    const memberId = Date.now();
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMember: Member = {
      id: memberId,
      name: name.trim(),
      branch: effectiveBranch,
      generation: generation.trim() ? parseInt(generation, 10) || generation.trim() : '',
      role: role.trim(),
      job: job.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      isCustom: true,
    };

    const newRecord: AttendanceRecord = {
      id: `new_${memberId}`,
      memberId,
      name: name.trim(),
      branch: effectiveBranch,
      generation: newMember.generation,
      role: role.trim(),
      job: job.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      feeAmount,
      paymentMethod,
      notes: notes.trim(),
      timestamp: timeStr,
      year: settings.eventYear || CURRENT_EVENT.year,
      eventName: settings.eventName || CURRENT_EVENT.name,
      isNewMember: true,
      printedCount: printNow ? 1 : 0,
      printSlot: paperSize === 'formtec_3114' ? selectedSlot : undefined,
    };

    const customSettings: LabelSettings = {
      ...settings,
      paperSize,
      thermalMode: paperSize === 'formtec_3114' ? 'color' : previewThermal,
      formtecStartSlot: selectedSlot,
    };

    onRegister(newMember, newRecord, printNow, customSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* 헤더 */}
        <div className="bg-emerald-800 text-white px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-300" />
            <h3 className="text-base sm:text-lg font-bold">
              현장 신규 종친 등록 & 명찰 발행
            </h3>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-xs bg-emerald-900 hover:bg-emerald-950 text-emerald-200 hover:text-white px-2.5 py-1 rounded-full border border-emerald-700 flex items-center gap-1 transition-all cursor-pointer"
              title="클릭하여 행사명 변경"
            >
              <span>{settings.eventName || CURRENT_EVENT.name}</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white transition-colors p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto flex-1">
          {/* 좌측 입력 폼 (7 cols) */}
          <div className="md:col-span-7 space-y-3.5">
            {/* 1. 성명 및 세수 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  성명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 이동광"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  세수 (대)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="예: 31"
                    value={generation}
                    onChange={(e) => setGeneration(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-500 font-bold shrink-0">세</span>
                </div>
              </div>
            </div>

            {/* 2. 파명 선택 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                공파 구분 <span className="text-red-500">*</span>
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {branch === '직접입력' && (
                <input
                  type="text"
                  placeholder="공파명 직접 입력 (예: 판서공파)"
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  className="mt-2 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            {/* 3. 직책 (선택) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                명찰 표기 직책 (선택)
              </label>
              <div className="flex gap-2">
                <select
                  value={ROLE_PRESETS.includes(role) ? role : '직접입력'}
                  onChange={(e) => {
                    if (e.target.value !== '직접입력') setRole(e.target.value);
                  }}
                  className="w-1/2 px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">(직책 없음 / 종원)</option>
                  {ROLE_PRESETS.filter((r) => r).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="직접입력">직접입력</option>
                </select>
                <input
                  type="text"
                  placeholder="직책 직접 입력 (예: 감사)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* 3-1. 직업 (생업 / 회사) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                사회 직업 또는 회사 (생업)
              </label>
              <input
                type="text"
                placeholder="예: 공인회계사, 자영업, ㈜대한물산 등"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            {/* 4. 연락처 및 주소 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  휴대폰 번호
                </label>
                <input
                  type="text"
                  placeholder="예: 010-1234-5678"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  거주지 / 주소
                </label>
                <input
                  type="text"
                  placeholder="예: 서울 송파구 잠실동"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* 5. 회비 금액 & 납부 방식 */}
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <label className="block text-xs font-bold text-emerald-900 mb-2 flex items-center justify-between">
                <span>당일 납부 회비</span>
                <span className="text-emerald-700 font-extrabold text-sm">
                  {feeAmount.toLocaleString()}원
                </span>
              </label>

              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[10000, 20000, 30000, 50000, 100000, 0].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFeeAmount(amt)}
                    className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                      feeAmount === amt
                        ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-100'
                    }`}
                  >
                    {amt === 0 ? '면제 (0원)' : `${amt.toLocaleString()}원`}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {(['현금', '계좌이체', '카드', '기타'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                      paymentMethod === method
                        ? 'bg-slate-800 text-white border-slate-800 font-bold'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. 찬조 메모 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                찬조금 또는 비고 (선택)
              </label>
              <input
                type="text"
                placeholder="예: 찬조금 20만원, 기념품 수령 등"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* 우측 명찰 미리보기 & 8칸 선택기 (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">명찰 실시간 미리보기</span>
                {/* 컬러 / 감열 흑백선 / 감열 블랙반전 3종 통일 탭 */}
                <div className="inline-flex p-0.5 bg-slate-200 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => handleThermalModeChange('color')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      previewThermal === 'color'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="연하늘색 컬러 바탕 (폼텍 8칸 및 레이저/잉크젯 전용)"
                  >
                    🔵 컬러
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThermalModeChange('outline')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      previewThermal === 'outline'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="흰 바탕 + 검정 실선 테두리 (감열지 절약형)"
                  >
                    🖨️ 감열 흑백선
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThermalModeChange('inverted')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      previewThermal === 'inverted'
                        ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="검정 바탕 + 흰 글씨 (실물 감열 라벨과 100% 동일한 블랙반전)"
                  >
                    ⬛ 감열 블랙반전
                  </button>
                </div>
              </div>

              {/* 라벨 카드 실물 비례 미리보기 박스 */}
              <div className="w-full bg-slate-100 p-3 sm:p-4 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center min-h-[250px]">
                {/* 실물 규격 안내 배지 */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      paperSize === 'formtec_3114' ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  />
                  <span>
                    {paperSize === 'formtec_3114'
                      ? '실물 규격: 폼텍 3114 (99.1 × 67.7 mm · 8칸 A4)'
                      : paperSize === 'label_90x60'
                      ? '실물 규격: 감열 롤 라벨 (90 × 60 mm)'
                      : '실물 규격: 감열 롤 라벨 (80 × 60 mm · 폭 80mm 슬림형)'}
                  </span>
                </div>

                <div className="flex items-center justify-center w-full transition-all duration-200">
                  <LabelCard
                    name={name.trim() || '홍 길 동'}
                    branch={effectiveBranch}
                    generation={generation}
                    role={role}
                    settings={{
                      ...settings,
                      paperSize,
                      thermalMode: previewThermal,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 용지 선택 바 */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                출력 용지 선택
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handlePaperSizeChange('formtec_3114')}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    paperSize === 'formtec_3114'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  폼텍 8칸 (A4)
                </button>
                <button
                  type="button"
                  onClick={() => handlePaperSizeChange('label_90x60')}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    paperSize === 'label_90x60'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  90×60 감열
                </button>
                <button
                  type="button"
                  onClick={() => handlePaperSizeChange('label_80x60')}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    paperSize === 'label_80x60'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  80×60 감열
                </button>
              </div>
            </div>

            {/* ⭐⭐⭐ 폼텍 8칸 직관적 2열 x 4행 시각적 칸 선택기 */}
            {paperSize === 'formtec_3114' ? (
              <div className="bg-white p-3 rounded-xl border-2 border-emerald-200 shadow-xs animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-emerald-900">
                    🎯 인쇄할 라벨 위치 (1~8번)
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    현재: {selectedSlot}번 칸
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-lg border border-slate-200">
                  {[
                    [1, 2],
                    [3, 4],
                    [5, 6],
                    [7, 8],
                  ].map((row, rowIdx) => (
                    <React.Fragment key={`new-row-${rowIdx}`}>
                      {row.map((slotNum) => {
                        const isSelected = selectedSlot === slotNum;
                        return (
                          <button
                            key={slotNum}
                            type="button"
                            onClick={() => setSelectedSlot(slotNum)}
                            className={`h-10 rounded-md border flex items-center justify-between px-2.5 transition-all text-xs font-bold ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300'
                            }`}
                          >
                            <span className="text-sm font-black">{slotNum}번</span>
                            {isSelected ? (
                              <span className="text-[10px] bg-white text-emerald-800 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5 stroke-[3]" /> 인쇄칸
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">클릭</span>
                            )}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-tight">
                🖨️ 감열 프린터: 연속 롤 라벨로 즉시 1장이 출력됩니다.
              </div>
            )}
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div className="bg-slate-100 px-6 py-3.5 flex flex-col sm:flex-row gap-2 justify-end border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
          >
            취소
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm flex items-center justify-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            등록 후 대기열 담기
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-5 py-2.5 text-sm font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {paperSize === 'formtec_3114'
              ? `등록 & [${selectedSlot}번 칸] 즉시 인쇄`
              : '등록 및 즉시 명찰 인쇄'}
          </button>
        </div>
      </div>
    </div>
  );
};
