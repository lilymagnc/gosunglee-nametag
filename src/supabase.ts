import { createClient } from '@supabase/supabase-js';
import { Member, AttendanceRecord, LabelSettings } from './types';
import { DEFAULT_SETTINGS } from './utils/storage';
import { DEFAULT_MEMBERS } from './data/defaultMembers';

const meta = import.meta as any;
const SUPABASE_URL = meta.env?.VITE_SUPABASE_URL || 'https://ubroyskoxaixstgaralk.supabase.co';
const SUPABASE_ANON_KEY = meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_RlcLKqaolsJICII3RenSsw_tASy-txz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. 회원 명부 조회
export async function loadMembersFromSupabase(): Promise<Member[]> {
  try {
    // Supabase는 한 번에 최대 1000개 반환하므로 전체(1168명 이상) 페이징 조회
    let allMembers: Member[] = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('gosunglee_members')
        .select('*')
        .range(from, from + pageSize - 1)
        .order('id', { ascending: true });

      if (error) {
        console.warn('Supabase members fetch error, falling back to local:', error);
        break;
      }

      if (!data || data.length === 0) break;

      const mapped: Member[] = data.map((row: any) => ({
        id: Number(row.id),
        branch: row.branch || '',
        generation: row.generation ?? '',
        name: row.name,
        address: row.address || '',
        phone: row.phone || '',
        mobile: row.mobile || '',
        notes: row.notes || '',
        role: row.role || '',
        job: row.job || ''
      }));

      allMembers = allMembers.concat(mapped);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    if (allMembers.length > 0) {
      return allMembers;
    }
  } catch (err) {
    console.warn('Network error loading members from Supabase:', err);
  }

  // 폴백: 로컬 스토리지 또는 기본 데이터
  const saved = localStorage.getItem('gosunglee_members');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  return DEFAULT_MEMBERS;
}

// 2. 회원 저장/수정
export async function saveMemberToSupabase(member: Member): Promise<void> {
  try {
    const payload = {
      id: Number(member.id),
      branch: member.branch,
      generation: member.generation ? Number(member.generation) : null,
      name: member.name,
      address: member.address || '',
      phone: member.phone || '',
      mobile: member.mobile || '',
      notes: member.notes || '',
      role: member.role || '',
      job: member.job || ''
    };

    await supabase.from('gosunglee_members').upsert(payload);
  } catch (err) {
    console.warn('Failed to save member to Supabase:', err);
  }
}

// 3. 접수/수납 내역 조회
export async function loadAttendanceFromSupabase(): Promise<AttendanceRecord[]> {
  try {
    const { data, error } = await supabase
      .from('gosunglee_attendance')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((row: any) => ({
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
        printSlot: Number(row.print_slot || 1)
      }));
    }
  } catch (err) {
    console.warn('Network error loading attendance from Supabase:', err);
  }

  // 폴백: 로컬 스토리지
  const saved = localStorage.getItem('gosunglee_attendance');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  return [];
}

// 4. 접수 내역 저장
export async function saveAttendanceToSupabase(record: AttendanceRecord): Promise<void> {
  try {
    const payload = {
      id: record.id,
      member_id: Number(record.memberId),
      name: record.name,
      branch: record.branch,
      generation: record.generation ? Number(record.generation) : null,
      role: record.role || '',
      job: record.job || '',
      fee_amount: Number(record.feeAmount || 0),
      payment_method: record.paymentMethod || '현금',
      notes: record.notes || '',
      timestamp: record.timestamp,
      year: Number(record.year),
      event_name: record.eventName,
      is_new_member: Boolean(record.isNewMember),
      printed_count: Number(record.printedCount || 0),
      print_slot: Number(record.printSlot || 1)
    };

    await supabase.from('gosunglee_attendance').upsert(payload);
  } catch (err) {
    console.warn('Failed to save attendance to Supabase:', err);
  }
}

// 5. 접수 내역 삭제
export async function deleteAttendanceFromSupabase(id: string): Promise<void> {
  try {
    await supabase.from('gosunglee_attendance').delete().eq('id', id);
  } catch (err) {
    console.warn('Failed to delete attendance from Supabase:', err);
  }
}

// 6. 접수 내역 전체 초기화
export async function clearAllAttendanceFromSupabase(): Promise<void> {
  try {
    await supabase.from('gosunglee_attendance').delete().neq('id', '___non_existent___');
  } catch (err) {
    console.warn('Failed to clear all attendance from Supabase:', err);
  }
}

// 7. 설정 조회
export async function loadSettingsFromSupabase(): Promise<LabelSettings> {
  try {
    const { data, error } = await supabase
      .from('gosunglee_settings')
      .select('settings')
      .eq('id', 'current')
      .single();

    if (!error && data && data.settings) {
      return { ...DEFAULT_SETTINGS, ...data.settings };
    }
  } catch (err) {
    console.warn('Network error loading settings from Supabase:', err);
  }

  // 폴백: 로컬 스토리지
  const saved = localStorage.getItem('gosunglee_label_settings');
  if (saved) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
  }
  return DEFAULT_SETTINGS;
}

// 8. 설정 저장
export async function saveSettingsToSupabase(settings: LabelSettings): Promise<void> {
  try {
    await supabase.from('gosunglee_settings').upsert({
      id: 'current',
      settings,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to save settings to Supabase:', err);
  }
}
