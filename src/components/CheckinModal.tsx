import React, { useState, useEffect, useMemo } from 'react';
import { Member, AttendanceRecord, LabelSettings, PaperSize } from '../types';
import { BRANCHES, ROLE_PRESETS } from '../data/defaultMembers';
import { getMemberHistory, CURRENT_EVENT } from '../utils/storage';
import { LabelCard } from './LabelCard';
import {
  Check,
  Printer,
  Clock,
  X,
  DollarSign,
  UserCheck,
  Edit3,
  Phone,
  MapPin,
  Briefcase,
  ExternalLink,
  Save,
  Calendar,
  History,
  Award,
  Layers,
  ChevronRight,
  Crown,
  Sparkles,
} from 'lucide-react';

interface CheckinModalProps {
  member: Member;
  settings: LabelSettings;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (
    record: AttendanceRecord,
    printNow: boolean,
    updatedMember?: Member,
    customSettings?: LabelSettings
  ) => void;
  existingRecord?: AttendanceRecord;
  onOpenEditModal?: (member: Member) => void;
  onOpenSettings?: () => void;
  onUpdateSettings?: (settings: LabelSettings) => void;
}

export const CheckinModal: React.FC<CheckinModalProps> = ({
  member,
  settings,
  isOpen,
  onClose,
  onComplete,
  existingRecord,
  onOpenEditModal,
  onOpenSettings,
  onUpdateSettings,
}) => {
  const [role, setRole] = useState(existingRecord?.role || member.role || '');
  const [feeAmount, setFeeAmount] = useState<number>(
    existingRecord !== undefined ? existingRecord.feeAmount : 20000
  );
  const [paymentMethod, setPaymentMethod] = useState<'현금' | '계좌이체' | '카드' | '기타' | '미납'>(
    existingRecord?.paymentMethod || '현금'
  );
  const [notes, setNotes] = useState(existingRecord?.notes || '');

  // 용지 및 슬롯 선택 상태 (직전 전역 설정 100% 기억 및 연동)
  const [paperSize, setPaperSize] = useState<PaperSize>(settings.paperSize || 'formtec_3114');
  const [selectedSlot, setSelectedSlot] = useState<number>(
    existingRecord?.printSlot || settings.formtecStartSlot || 1
  );
  const [previewThermal, setPreviewThermal] = useState<'color' | 'outline' | 'inverted' | 'textOnly'>(
    settings.thermalMode || (settings.paperSize === 'formtec_3114' ? 'color' : 'inverted')
  );

  // 현장 인라인 회원 정보 수정 상태
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(member.name);
  const [editBranch, setEditBranch] = useState(member.branch);
  const [editGeneration, setEditGeneration] = useState(String(member.generation || ''));
  const [editMobile, setEditMobile] = useState(member.mobile || member.phone || '');
  const [editAddress, setEditAddress] = useState(member.address || '');
  const [editJob, setEditJob] = useState(member.job || '');

  // 과거 출석 이력 조회
  const memberHistory = useMemo(() => {
    return getMemberHistory(member.id);
  }, [member.id]);

  // 1. 회원이 바뀔 때만 폼 입력 필드 초기화 (settings 변경 시 입력 중이던 직책/회비 초기화 원천 방지!)
  useEffect(() => {
    if (existingRecord) {
      setRole(existingRecord.role || member.role || '');
      setFeeAmount(existingRecord.feeAmount);
      setPaymentMethod(existingRecord.paymentMethod);
      setNotes(existingRecord.notes || '');
      if (existingRecord.printSlot) {
        setSelectedSlot(existingRecord.printSlot);
      }
    } else {
      setRole(member.role || '');
      setFeeAmount(20000);
      setPaymentMethod('현금');
      setNotes('');
      setSelectedSlot(settings.formtecStartSlot || 1);
    }
    setEditName(member.name);
    setEditBranch(member.branch);
    setEditGeneration(String(member.generation || ''));
    setEditMobile(member.mobile || member.phone || '');
    setEditAddress(member.address || '');
    setEditJob(member.job || '');
    setIsEditingInfo(false);
  }, [member.id, existingRecord?.id]);

  // 2. 모달이 새로 열릴 때만 전역 용지 설정 동기화
  useEffect(() => {
    if (isOpen) {
      setPaperSize(settings.paperSize || 'formtec_3114');
      setPreviewThermal(settings.thermalMode || (settings.paperSize === 'formtec_3114' ? 'color' : 'inverted'));
    }
  }, [isOpen]);

  // 용지 변경 시 즉시 기억 및 전역 설정 저장
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

  // 모드 변경 시 즉시 기억 및 전역 설정 저장
  const handleThermalModeChange = (newMode: 'color' | 'outline' | 'inverted') => {
    setPreviewThermal(newMode);
    const updated: LabelSettings = {
      ...settings,
      thermalMode: newMode,
    };
    onUpdateSettings?.(updated);
  };

  // 빠른 회비 금액 버튼 리스트
  const quickAmounts = [10000, 20000, 30000, 50000, 100000, 0];

  const handleSave = (printNow: boolean) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 수정된 정보 반영
    const finalName = editName.trim() || member.name;
    const finalBranch = editBranch.trim() || member.branch;
    const finalGen = editGeneration.trim() ? parseInt(editGeneration, 10) || editGeneration.trim() : member.generation;
    const finalMobile = editMobile.trim();
    const finalAddress = editAddress.trim();

    const record: AttendanceRecord = {
      id: existingRecord ? existingRecord.id : `${member.id}_${Date.now()}`,
      memberId: member.id,
      name: finalName,
      branch: finalBranch,
      generation: finalGen,
      role: role.trim(),
      job: editJob.trim(),
      mobile: finalMobile,
      address: finalAddress,
      feeAmount,
      paymentMethod,
      notes: notes.trim(),
      timestamp: existingRecord ? existingRecord.timestamp : timeStr,
      year: existingRecord?.year || settings.eventYear || CURRENT_EVENT.year,
      eventName: existingRecord?.eventName || settings.eventName || CURRENT_EVENT.name,
      isNewMember: existingRecord?.isNewMember ?? false,
      printedCount: printNow
        ? (existingRecord?.printedCount || 0) + 1
        : existingRecord?.printedCount || 0,
      printSlot: paperSize === 'formtec_3114' ? selectedSlot : undefined,
    };

    // 회원 정보가 변경되었으면 원부 업데이트용 객체 전달
    const updatedMember: Member = {
      ...member,
      name: finalName,
      branch: finalBranch,
      generation: finalGen,
      role: role.trim(),
      job: editJob.trim(),
      mobile: finalMobile,
      address: finalAddress,
    };

    const customSettings: LabelSettings = {
      ...settings,
      paperSize,
      thermalMode: previewThermal,
      formtecStartSlot: selectedSlot,
    };

    onComplete(record, printNow, updatedMember, customSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* 모달 헤더 (수정 모드 시 호박색 헤더로 즉시 구분) */}
        <div
          className={`px-6 py-3.5 flex items-center justify-between shrink-0 text-white ${
            existingRecord ? 'bg-amber-900 border-b border-amber-700' : 'bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {existingRecord ? (
              <Edit3 className="w-5 h-5 text-amber-300" />
            ) : (
              <UserCheck className="w-5 h-5 text-sky-400" />
            )}
            <h3 className="text-base sm:text-lg font-bold">
              {existingRecord ? '당일 접수 내역 & 회비 수정 (수정 모드)' : '당일 현장 접수 & 회비 입력'}
            </h3>
            {existingRecord ? (
              <span className="text-xs bg-amber-800 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-600 font-extrabold flex items-center gap-1">
                기존 납부: {existingRecord.feeAmount.toLocaleString()}원 ({existingRecord.paymentMethod})
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="클릭하여 행사명 및 환경설정 변경"
              >
                <span>{settings.eventName || CURRENT_EVENT.name}</span>
                <Edit3 className="w-3 h-3 text-sky-400" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto flex-1">
          {/* ========================================================================= */}
          {/* 좌측: 정보 입력 & 역대 출석 이력 (7 cols) */}
          {/* ========================================================================= */}
          <div className="md:col-span-7 space-y-4">
            {/* 기본 회원 정보 및 인라인 즉시 수정 카드 */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isEditingInfo
                  ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* 상단 이름 및 수정 토글 버튼 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-slate-900">{editName}</span>
                  <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">
                    {editBranch} {editGeneration ? `${editGeneration}세` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(!isEditingInfo)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-sm ${
                      isEditingInfo
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isEditingInfo ? '수정 완료 (접기)' : '이 화면에서 바로 수정'}
                  </button>

                  {onOpenEditModal && (
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(member)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-sm"
                      title="별도 팝업창으로 상세 수정"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 1) 인라인 수정 모드일 때 */}
              {isEditingInfo ? (
                <div className="space-y-3 pt-3 border-t border-amber-200 animate-in fade-in">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">성명</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">공파</label>
                      <select
                        value={BRANCHES.includes(editBranch as any) ? editBranch : '기타'}
                        onChange={(e) => setEditBranch(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
                      >
                        {BRANCHES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">세수</label>
                      <input
                        type="number"
                        value={editGeneration}
                        onChange={(e) => setEditGeneration(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-amber-600" /> 연락처 (휴대폰 번호)
                      </label>
                      <input
                        type="text"
                        value={editMobile}
                        onChange={(e) => setEditMobile(e.target.value)}
                        placeholder="예: 010-3911-8206"
                        className="w-full px-2.5 py-1.5 text-xs font-bold border-2 border-amber-400 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> 거주지 / 주소
                      </label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="주소 입력"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-400" /> 직업 (회사 / 생업)
                    </label>
                    <input
                      type="text"
                      value={editJob}
                      onChange={(e) => setEditJob(e.target.value)}
                      placeholder="예: ㈜라이프메디칼 관리과장, 자영업, 건축 등"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="text-[11px] text-emerald-800 font-bold bg-emerald-100/70 px-2.5 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>수정한 정보는 접수 완료 시 원부 주소록에도 즉시 영구 저장됩니다!</span>
                  </div>
                </div>
              ) : (
                /* 2) 평상시 보기 모드 */
                <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      연락처: <strong className="text-slate-900 text-sm">{editMobile || '미등록'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingInfo(true)}
                      className="text-xs text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                    >
                      정보 수정
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      직업(생업):{' '}
                      <strong className="text-slate-900">
                        {editJob ? editJob.replace(/\n/g, ' ') : '미등록 (아래에서 직책 입력 가능)'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">주소: {editAddress || '미등록'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ⭐ 역대 출석 및 회비 납부 이력 카드 (연도별 출석 저장 & 조회) */}
            <div className="p-3.5 bg-sky-50/70 rounded-xl border border-sky-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <History className="w-4 h-4 text-sky-700" />
                  <span className="text-xs font-bold text-sky-900">
                    역대 출석 및 회비 납부 이력
                  </span>
                </div>
                {memberHistory.length > 0 ? (
                  <span className="text-[11px] font-extrabold text-sky-700 bg-sky-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3 text-sky-600" />
                    과거 {memberHistory.length}회 참석
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    🌱 첫 참석 종친
                  </span>
                )}
              </div>

              {memberHistory.length > 0 ? (
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {memberHistory.map((h, idx) => (
                    <div
                      key={h.id || idx}
                      className="bg-white p-2 rounded-lg border border-sky-100 text-xs flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded text-[11px]">
                          {h.year}년
                        </span>
                        <span className="font-semibold text-slate-800 text-[11.5px]">
                          {h.eventName || '정기시제'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700 text-xs">
                          {h.feeAmount?.toLocaleString()}원
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({h.paymentMethod || '현금'})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 py-1">
                  과거 전산 등록된 출석 이력이 없습니다. 오늘 첫 발걸음을 환영해 주세요!
                </p>
              )}
            </div>

            {/* 직책 설정 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  직책 (명찰 표기)
                </label>
                {editJob && (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    직업/생업: {editJob.replace(/\n/g, ' ')}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mb-1.5">
                💡 명찰에 표기할 직책(이사, 회장, 부회장, 감사 등)을 선택하거나 입력합니다.
              </p>
              <div className="flex gap-2">
                <select
                  value={ROLE_PRESETS.includes(role) ? role : '직접입력'}
                  onChange={(e) => {
                    if (e.target.value !== '직접입력') {
                      setRole(e.target.value);
                    }
                  }}
                  className="w-1/2 px-2.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
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
                  placeholder="직책 직접 입력 (예: 청년이사)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* 회비 금액 선택 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>당일 회비 / 참가비</span>
                <span className="text-sky-600 font-extrabold text-sm">
                  {feeAmount.toLocaleString()}원
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFeeAmount(amt)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      feeAmount === amt
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm font-bold'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {amt === 0 ? '면제 (0원)' : `${amt.toLocaleString()}원`}
                  </button>
                ))}
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="5000"
                  placeholder="직접 금액 입력 (원)"
                  value={feeAmount === 0 ? '' : feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                />
              </div>
              {feeAmount >= 100000 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-1.5 text-xs text-amber-900 font-bold animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>10만원 이상 납부: 접수 완료 후 2번 프린터로 [📜 80mm 협찬금 리본] 출력이 가능합니다.</span>
                </div>
              )}
            </div>

            {/* 납부 방식 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                납부 방식
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['현금', '계좌이체', '카드', '기타'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
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

            {/* 비고 / 찬조 메모 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                비고 / 찬조 물품 (선택)
              </label>
              <input
                type="text"
                placeholder="예: 찬조금 50만원, 떡 협찬, 기념품 수령 등"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 우측: 명찰 실시간 미리보기 + 폼텍 8칸 직관적 시각 선택기 (5 cols) */}
          {/* ========================================================================= */}
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
                        ? 'bg-white text-sky-700 shadow-sm'
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
                      paperSize === 'formtec_3114' ? 'bg-sky-500' : 'bg-slate-700'
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
                    name={editName}
                    branch={editBranch}
                    generation={editGeneration}
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

            {/* ⭐ 용지 규격 선택 바 */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                출력 용지 선택
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handlePaperSizeChange('formtec_3114')}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    paperSize === 'formtec_3114'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
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

            {/* ⭐⭐⭐ 폼텍 8칸 직관적 시각적 칸 선택기 (2열 x 4행 실물 시트 그래픽) */}
            {paperSize === 'formtec_3114' ? (
              <div className="bg-white p-3 rounded-xl border-2 border-sky-200 shadow-xs animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-sky-900 flex items-center gap-1">
                    🎯 인쇄할 라벨 위치 (1~8번 선택)
                  </span>
                  <span className="text-xs font-extrabold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-300">
                    현재: {selectedSlot}번 칸
                  </span>
                </div>

                {/* 2열 x 4행 실물 폼텍 라벨 배치 그래픽 */}
                <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-lg border border-slate-200">
                  {[
                    [1, 2],
                    [3, 4],
                    [5, 6],
                    [7, 8],
                  ].map((row, rowIdx) => (
                    <React.Fragment key={`row-${rowIdx}`}>
                      {row.map((slotNum) => {
                        const isSelected = selectedSlot === slotNum;
                        return (
                          <button
                            key={slotNum}
                            type="button"
                            onClick={() => setSelectedSlot(slotNum)}
                            className={`h-10 rounded-md border flex items-center justify-between px-2.5 transition-all text-xs font-bold ${
                              isSelected
                                ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-50 hover:border-sky-300'
                            }`}
                          >
                            <span className="text-sm font-black">{slotNum}번</span>
                            {isSelected ? (
                              <span className="text-[10px] bg-white text-sky-800 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
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

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>💡 이미 뜯어낸 빈 칸은 건너뛰고 클릭!</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSlot((prev) => (prev % 8) + 1)}
                    className="text-sky-700 font-bold hover:underline"
                  >
                    다음 칸 이동 (+1)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-tight">
                🖨️ <strong>감열 롤 프린터 모드:</strong> 낱장씩 연속 출력되므로 칸 번호 지정 없이 즉시 1장이 출력됩니다.
              </div>
            )}
          </div>
        </div>

        {/* 모달 푸터 액션 버튼 */}
        <div className="bg-slate-100 px-6 py-3.5 flex flex-col sm:flex-row gap-2 justify-end border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all"
          >
            {existingRecord ? '닫기 (변경 취소)' : '취소'}
          </button>

          {existingRecord ? (
            <>
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="px-5 py-2.5 text-xs font-extrabold text-slate-800 bg-white border-2 border-emerald-500 hover:bg-emerald-50 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Save className="w-4 h-4 text-emerald-600" />
                💾 수정 내용만 저장 (인쇄 안 함)
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-5 py-2.5 text-sm font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Printer className="w-4 h-4" />
                {paperSize === 'formtec_3114'
                  ? `수정 저장 & [${selectedSlot}번 칸] 라벨 재인쇄`
                  : '수정 저장 & 라벨 재인쇄'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <Clock className="w-4 h-4 text-amber-500" />
                대기열에 담기 (나중에 모아찍기)
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-5 py-2.5 text-sm font-extrabold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Printer className="w-4 h-4" />
                {paperSize === 'formtec_3114'
                  ? `접수 완료 & [${selectedSlot}번 칸] 즉시 인쇄`
                  : '접수 완료 & 즉시 라벨 인쇄'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
