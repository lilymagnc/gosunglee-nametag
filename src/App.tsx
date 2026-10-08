import React, { useState, useEffect } from 'react';
import { Member, AttendanceRecord, LabelSettings } from './types';
import {
  loadMembers,
  saveMembers,
  loadAttendance,
  saveAttendance,
  loadAttendanceHistory,
  saveAttendanceHistory,
  loadSettings,
  saveSettings,
  loadPrintQueue,
  savePrintQueue,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { DEFAULT_MEMBERS } from './data/defaultMembers';
import { exportAttendanceToExcel } from './utils/excel';
import {
  loadMembersFromSupabase,
  saveMemberToSupabase,
  loadAttendanceFromSupabase,
  saveAttendanceToSupabase,
  deleteAttendanceFromSupabase,
  clearAllAttendanceFromSupabase,
  loadSettingsFromSupabase,
  saveSettingsToSupabase,
  supabase,
} from './supabase';
import { Header } from './components/Header';
import { CheckinDesk } from './components/CheckinDesk';
import { CheckinModal } from './components/CheckinModal';
import { NewMemberModal } from './components/NewMemberModal';
import { EditMemberModal } from './components/EditMemberModal';
import { PrintCenter } from './components/PrintCenter';
import { Dashboard } from './components/Dashboard';
import { MemberList } from './components/MemberList';
import { PrintSingleLabel } from './components/PrintSingleLabel';
import { PrintSheetFormtec } from './components/PrintSheetFormtec';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  // 상태 변수들
  const [members, setMembers] = useState<Member[]>(loadMembers);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(loadAttendance);
  const [settings, setSettings] = useState<LabelSettings>(loadSettings);
  const [printQueue, setPrintQueue] = useState<AttendanceRecord[]>(loadPrintQueue);
  const [activeTab, setActiveTab] = useState<'checkin' | 'print' | 'dashboard' | 'members'>('checkin');
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // 모달 제어
  const [checkinTarget, setCheckinTarget] = useState<Member | null>(null);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 즉시 1건 인쇄용 상태
  const [singlePrintItem, setSinglePrintItem] = useState<AttendanceRecord | null>(null);
  // 즉시 다중 일괄 인쇄용 상태
  const [batchPrintItems, setBatchPrintItems] = useState<AttendanceRecord[] | null>(null);

  // [클라우드 실시간 동기화 & 초기 데이터 로드]
  useEffect(() => {
    let isMounted = true;

    // 1. 초기 Supabase 최신 데이터 로드
    Promise.all([
      loadMembersFromSupabase(),
      loadAttendanceFromSupabase(),
      loadSettingsFromSupabase(),
    ]).then(([cloudMembers, cloudAttendance, cloudSettings]) => {
      if (!isMounted) return;
      if (cloudMembers && cloudMembers.length > 0) {
        setMembers(cloudMembers);
        saveMembers(cloudMembers);
      }
      if (cloudAttendance) {
        setAttendance(cloudAttendance);
        saveAttendance(cloudAttendance);
      }
      if (cloudSettings) {
        setSettings(cloudSettings);
        saveSettings(cloudSettings);
      }
      setIsCloudSynced(true);
    });

    // 2. 다른 컴퓨터(클라이언트)와의 실시간 Realtime 동기화 채널 (이벤트 페이로드 단위 초절전 동기화)
    const channel = supabase
      .channel('gosunglee_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gosunglee_attendance' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new;
          const rec: AttendanceRecord = {
            id: row.id,
            memberId: Number(row.member_id),
            name: row.name,
            branch: row.branch,
            generation: row.generation,
            role: row.role || '',
            job: row.job || '',
            feeAmount: Number(row.fee_amount || 0),
            paymentMethod: row.payment_method || '현금',
            notes: row.notes || '',
            timestamp: row.timestamp,
            year: Number(row.year),
            eventName: row.event_name,
            isNewMember: Boolean(row.is_new_member),
            printedCount: Number(row.printed_count || 0),
            printSlot: Number(row.print_slot || 1),
          };
          setAttendance((prev) => [rec, ...prev.filter((r) => r.id !== rec.id)]);
        } else if (payload.eventType === 'UPDATE') {
          const row = payload.new;
          setAttendance((prev) =>
            prev.map((r) =>
              r.id === row.id
                ? {
                    ...r,
                    name: row.name,
                    branch: row.branch,
                    generation: row.generation,
                    role: row.role || '',
                    job: row.job || '',
                    feeAmount: Number(row.fee_amount || 0),
                    paymentMethod: row.payment_method || '현금',
                    notes: row.notes || '',
                    timestamp: row.timestamp,
                    year: Number(row.year),
                    eventName: row.event_name,
                    printedCount: Number(row.printed_count || 0),
                    printSlot: Number(row.print_slot || 1),
                  }
                : r
            )
          );
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          if (oldId) {
            setAttendance((prev) => prev.filter((r) => r.id !== oldId));
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gosunglee_members' }, (payload: any) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new;
          const mem: Member = {
            id: Number(row.id),
            branch: row.branch || '',
            generation: row.generation ?? '',
            name: row.name,
            address: row.address || '',
            phone: row.phone || '',
            mobile: row.mobile || '',
            notes: row.notes || '',
            role: row.role || '',
            job: row.job || '',
          };
          setMembers((prev) => {
            const exists = prev.some((m) => m.id === mem.id);
            if (exists) {
              return prev.map((m) => (m.id === mem.id ? mem : m));
            }
            return [mem, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gosunglee_settings' }, (payload: any) => {
        if (payload.new && payload.new.settings) {
          setSettings((prev) => ({ ...prev, ...payload.new.settings }));
          saveSettings({ ...settings, ...payload.new.settings });
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // 변경 시 로컬스토리지 백업 저장
  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveAttendance(attendance);
  }, [attendance]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    savePrintQueue(printQueue);
  }, [printQueue]);

  // 단일 즉시 인쇄 트리거
  useEffect(() => {
    if (singlePrintItem) {
      const timer = setTimeout(() => {
        const cleanup = () => {
          setSinglePrintItem(null);
          window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
        setTimeout(cleanup, 3000);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [singlePrintItem]);

  // 다중 일괄 즉시 인쇄 트리거
  useEffect(() => {
    if (batchPrintItems && batchPrintItems.length > 0) {
      const timer = setTimeout(() => {
        const cleanup = () => {
          setBatchPrintItems(null);
          window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
        setTimeout(cleanup, 3000);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [batchPrintItems]);

  // 통계 계산
  const totalAttendance = attendance.length;
  const totalFee = attendance.reduce((sum, r) => sum + (r.feeAmount || 0), 0);

  // [1] 현장 접수 완료 핸들러 (모달 내 실시간 수정 반영 + 슬롯 및 용지 동기화)
  const handleCompleteCheckin = (
    record: AttendanceRecord,
    printNow: boolean,
    updatedMember?: Member,
    customSettings?: LabelSettings
  ) => {
    // 용지 설정 동기화
    if (customSettings) {
      setSettings(customSettings);
      saveSettings(customSettings);
    }

    // 모달 안에서 회원 정보가 수정된 경우 원부 동기화 저장
    if (updatedMember) {
      setMembers((prev) =>
        prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
      );
      saveMemberToSupabase(updatedMember);
    }

    const isExisting = attendance.some((r) => r.memberId === record.memberId || r.id === record.id);

    // Supabase 클라우드 실시간 저장
    saveAttendanceToSupabase(record);

    // 기존에 접수된 기록이 있으면 업데이트, 없으면 추가
    setAttendance((prev) => {
      const existingIdx = prev.findIndex((r) => r.memberId === record.memberId);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = record;
        return copy;
      }
      return [record, ...prev];
    });

    // 역대 전체 출석 및 수납 이력(다년도)에도 즉시 영구 저장
    try {
      const history = loadAttendanceHistory();
      const existingHistIdx = history.findIndex(
        (h) => h.id === record.id || (h.memberId === record.memberId && h.year === record.year)
      );
      if (existingHistIdx >= 0) {
        history[existingHistIdx] = record;
      } else {
        history.unshift(record);
      }
      saveAttendanceHistory(history);
    } catch (e) {
      console.error('Failed to sync attendance history', e);
    }

    if (printNow) {
      setSinglePrintItem(record);
      // 폼텍 8칸 인쇄 후 다음 번 슬롯으로 자동 이동 (+1)
      if (record.printSlot) {
        const nextSlot = (record.printSlot % 8) + 1;
        setSettings((prev) => ({
          ...prev,
          formtecStartSlot: nextSlot,
        }));
      }
    } else {
      // 대기열 처리: 수정 저장 시 기존 대기열에 있었으면 정보 갱신, 신규 등록일 때만 대기열 추가
      setPrintQueue((prev) => {
        const existsInQueue = prev.some((p) => p.id === record.id || p.memberId === record.memberId);
        if (existsInQueue) {
          return prev.map((p) =>
            p.id === record.id || p.memberId === record.memberId ? record : p
          );
        }
        if (!isExisting) {
          return [...prev, record];
        }
        return prev;
      });
    }
  };

  // [2] 현장 신규 종친 등록 완료 핸들러
  const handleRegisterNewMember = (
    newMember: Member,
    record: AttendanceRecord,
    printNow: boolean,
    customSettings?: LabelSettings
  ) => {
    if (customSettings) {
      setSettings(customSettings);
      saveSettings(customSettings);
    }

    setMembers((prev) => [newMember, ...prev]);
    setAttendance((prev) => [record, ...prev]);

    // Supabase 클라우드 실시간 저장
    saveMemberToSupabase(newMember);
    saveAttendanceToSupabase(record);

    // 역대 출석 이력에 동기화
    try {
      const history = loadAttendanceHistory();
      history.unshift(record);
      saveAttendanceHistory(history);
    } catch (e) {
      console.error('Failed to sync history for new member', e);
    }

    if (printNow) {
      setSinglePrintItem(record);
      if (record.printSlot) {
        const nextSlot = (record.printSlot % 8) + 1;
        setSettings((prev) => ({
          ...prev,
          formtecStartSlot: nextSlot,
        }));
      }
    } else {
      setPrintQueue((prev) => [...prev, record]);
    }
  };

  // [3] 회원 정보 수정 핸들러 (연락처, 주소 등 수정 시 즉시 영구 저장)
  const handleSaveUpdatedMember = (updatedMember: Member) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
    );
    saveMemberToSupabase(updatedMember);

    // 당일 출석 기록에도 연락처/주소 동기화
    setAttendance((prev) =>
      prev.map((r) =>
        r.memberId === updatedMember.id
          ? {
              ...r,
              name: updatedMember.name,
              branch: updatedMember.branch,
              generation: updatedMember.generation,
              role: updatedMember.role,
              job: updatedMember.job,
              mobile: updatedMember.mobile,
              address: updatedMember.address,
            }
          : r
      )
    );
    // 대기열에도 동기화
    setPrintQueue((prev) =>
      prev.map((q) =>
        q.memberId === updatedMember.id
          ? {
              ...q,
              name: updatedMember.name,
              branch: updatedMember.branch,
              generation: updatedMember.generation,
              role: updatedMember.role,
              job: updatedMember.job,
              mobile: updatedMember.mobile,
              address: updatedMember.address,
            }
          : q
      )
    );
  };

  // [4] 단일 라벨 빠른 재인쇄
  const handleQuickPrint = (record: AttendanceRecord) => {
    setSinglePrintItem(record);
  };

  // [4-1] 다중 라벨 일괄 즉시 인쇄
  const handleBatchPrint = (records: AttendanceRecord[]) => {
    if (records.length === 0) return;
    setBatchPrintItems(records);
  };

  // [4-2] 다중 라벨 대기열 일괄 담기
  const handleAddToQueue = (records: AttendanceRecord[]) => {
    if (records.length === 0) return;
    setPrintQueue((prev) => {
      const existingMemberIds = new Set(prev.map((p) => p.memberId));
      const newItems = records.filter((r) => !existingMemberIds.has(r.memberId));
      return [...newItems, ...prev];
    });
    alert(`선택하신 ${records.length}명이 [명찰 인쇄 센터] 대기열에 추가되었습니다.`);
  };

  // [4] 대기열 관리
  const handleRemoveFromQueue = (id: string) => {
    setPrintQueue((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearQueue = () => {
    if (confirm('인쇄 대기열을 모두 비우시겠습니까?')) {
      setPrintQueue([]);
    }
  };

  const handleMarkPrinted = (ids: string[]) => {
    // 인쇄 완료 시 카운트 증가
    setAttendance((prev) =>
      prev.map((r) => (ids.includes(r.id) ? { ...r, printedCount: r.printedCount + 1 } : r))
    );
  };

  // [6] 대장 항목 삭제
  const handleDeleteAttendanceRecord = (id: string) => {
    if (confirm('해당 회원의 접수 및 회비 수납 기록을 삭제하시겠습니까?')) {
      setAttendance((prev) => prev.filter((r) => r.id !== id));
      setPrintQueue((prev) => prev.filter((p) => p.id !== id));
      deleteAttendanceFromSupabase(id);
    }
  };

  const handleClearAllAttendance = () => {
    if (
      confirm(
        '⚠️ 경고: 당일의 모든 접수 및 회비 수납 기록이 초기화됩니다. 계속하시겠습니까?\n(사전에 엑셀 다운로드를 권장합니다)'
      )
    ) {
      setAttendance([]);
      setPrintQueue([]);
      clearAllAttendanceFromSupabase();
    }
  };

  // [7] 주소록 원부 초기화
  const handleResetMembersToDefault = () => {
    if (confirm('주소록을 초기 구글 시트 원본(1,168명)으로 되돌리시겠습니까?')) {
      setMembers(DEFAULT_MEMBERS);
      saveMembers(DEFAULT_MEMBERS);
      alert('초기 주소록 데이터로 복원되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 선택한 용지 규격에 따른 동적 @page 크기 주입 */}
      <style>{`
        @media print {
          @page {
            size: ${
              settings.paperSize === 'formtec_3114'
                ? 'A4 portrait'
                : settings.paperSize === 'label_90x60'
                ? '90mm 60mm'
                : '80mm 60mm'
            };
            margin: 0;
          }
        }
      `}</style>

      {/* 상단 공통 헤더 */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={printQueue.length}
        totalAttendance={totalAttendance}
        totalFee={totalFee}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onQuickExport={() =>
          exportAttendanceToExcel(
            attendance,
            settings.eventName ? settings.eventName.replace(/\s+/g, '_') : undefined
          )
        }
        isCloudSynced={isCloudSynced}
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'checkin' && (
          <CheckinDesk
            members={members}
            attendanceRecords={attendance}
            settings={settings}
            onOpenCheckin={(member) => setCheckinTarget(member)}
            onOpenNewMember={() => setIsNewMemberOpen(true)}
            onQuickPrint={handleQuickPrint}
            onBatchPrint={handleBatchPrint}
            onAddToQueue={handleAddToQueue}
            onEditMember={(member) => setEditTarget(member)}
          />
        )}

        {activeTab === 'print' && (
          <PrintCenter
            queue={printQueue}
            allRecords={attendance}
            settings={settings}
            onUpdateSettings={setSettings}
            onRemoveFromQueue={handleRemoveFromQueue}
            onClearQueue={handleClearQueue}
            onMarkPrinted={handleMarkPrinted}
            onBatchPrint={handleBatchPrint}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            records={attendance}
            eventName={settings.eventName}
            onDeleteRecord={handleDeleteAttendanceRecord}
            onPrintRecord={handleQuickPrint}
            onClearAll={handleClearAllAttendance}
            onEditRecord={(record) => {
              const target = members.find((m) => m.id === record.memberId) || {
                id: record.memberId,
                name: record.name,
                branch: record.branch,
                generation: record.generation,
                role: record.role,
                mobile: record.mobile,
                phone: '',
                address: record.address || '',
                job: '',
              };
              setCheckinTarget(target);
            }}
          />
        )}

        {activeTab === 'members' && (
          <MemberList
            members={members}
            settings={settings}
            onUpdateMembers={setMembers}
            onResetToDefault={handleResetMembersToDefault}
            onEditMember={(member) => setEditTarget(member)}
            onBatchPrint={handleBatchPrint}
            onAddToQueue={handleAddToQueue}
          />
        )}
      </main>

      {/* 현장 접수 & 회비 수정 모달 */}
      {checkinTarget && (
        <CheckinModal
          member={checkinTarget}
          settings={settings}
          isOpen={!!checkinTarget}
          onClose={() => setCheckinTarget(null)}
          onComplete={handleCompleteCheckin}
          existingRecord={attendance.find((r) => r.memberId === checkinTarget.id)}
          onOpenEditModal={(m) => {
            setCheckinTarget(null);
            setEditTarget(m);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            saveSettings(newSettings);
          }}
        />
      )}

      {/* 현장 신규 종친 등록 모달 */}
      <NewMemberModal
        settings={settings}
        isOpen={isNewMemberOpen}
        onClose={() => setIsNewMemberOpen(false)}
        onRegister={handleRegisterNewMember}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          saveSettings(newSettings);
        }}
      />

      {/* 회원 정보 수정 모달 */}
      {editTarget && (
        <EditMemberModal
          member={editTarget}
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveUpdatedMember}
        />
      )}

      {/* 행사명 및 명찰 종합 환경설정 모달 */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(newSettings) => {
          setSettings(newSettings);
          saveSettings(newSettings);
        }}
      />

      {/* 즉시 단일 또는 다중 일괄 인쇄 전용 숨김 컨테이너 */}
      {(singlePrintItem || (batchPrintItems && batchPrintItems.length > 0)) && (
        <div className="hidden print:block print:w-full">
          {settings.paperSize === 'formtec_3114' ? (
            <PrintSheetFormtec
              items={singlePrintItem ? [singlePrintItem] : (batchPrintItems || [])}
              settings={settings}
            />
          ) : (
            <PrintSingleLabel
              items={singlePrintItem ? [singlePrintItem] : (batchPrintItems || [])}
              settings={settings}
            />
          )}
        </div>
      )}
    </div>
  );
};
