import React, { useState } from 'react';
import { Member } from '../types';
import { BRANCHES, ROLE_PRESETS } from '../data/defaultMembers';
import { Edit3, X, Save, Phone, MapPin, User } from 'lucide-react';

interface EditMemberModalProps {
  member: Member;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMember: Member) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  member,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(member.name);
  const [branch, setBranch] = useState(member.branch);
  const [generation, setGeneration] = useState(String(member.generation || ''));
  const [role, setRole] = useState(member.role || '');
  const [mobile, setMobile] = useState(member.mobile || member.phone || '');
  const [address, setAddress] = useState(member.address || '');
  const [job, setJob] = useState(member.job || '');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('성함을 입력해 주세요.');
      return;
    }

    const updated: Member = {
      ...member,
      name: name.trim(),
      branch: branch.trim() || '미지정',
      generation: generation.trim() ? parseInt(generation, 10) || generation.trim() : '',
      role: role.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      job: job.trim(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* 모달 헤더 */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">회원 주소록 정보 수정</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 성명 & 세수 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                성명 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                세수 (XX 세)
              </label>
              <input
                type="number"
                value={generation}
                onChange={(e) => setGeneration(e.target.value)}
                placeholder="예: 33"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* 파명 선택 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              공파(派)
            </label>
            <select
              value={BRANCHES.includes(branch as any) ? branch : '기타'}
              onChange={(e) => {
                if (e.target.value !== '기타') {
                  setBranch(e.target.value);
                }
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value="기타">직접입력</option>
            </select>
          </div>

          {/* 직책 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              명찰 표기 직책
            </label>
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
                {ROLE_PRESETS.filter(r => r).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value="직접입력">직접입력</option>
              </select>
              <input
                type="text"
                placeholder="직책 직접 입력"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* 연락처 (휴대폰) - 문제의 8206 vs 9206 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              연락처 (휴대폰 번호) <span className="text-sky-600 text-[11px]">*수정 즉시 반영</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="예: 010-3911-8206"
                className="w-full pl-9 pr-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-amber-50/40"
              />
            </div>
          </div>

          {/* 거주지 주소 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              거주지 / 주소
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예: 서울 양천구 남부순환로60길 10, 101호"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* 직업 / 비고 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              직업 또는 비고
            </label>
            <input
              type="text"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              placeholder="예: 회사원, 자영업 등"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* 푸터 액션 */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              수정 사항 저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
