import { Member, AttendanceRecord, LabelSettings, EventRecord, ExpenseItem } from '../types';
import { DEFAULT_MEMBERS } from '../data/defaultMembers';

const STORAGE_KEYS = {
  MEMBERS: 'gosung_members_v1',
  ATTENDANCE: 'gosung_attendance_v1',
  HISTORY: 'gosung_attendance_history_v1',
  SETTINGS: 'gosung_settings_v1',
  PRINT_QUEUE: 'gosung_print_queue_v1',
  EVENTS: 'gosung_events_v1',
  EXPENSES: 'gosung_expenses_v1',
  ACTIVE_EVENT_ID: 'gosung_active_event_id_v1',
};

export const CURRENT_EVENT = {
  year: 2026,
  name: '2026년 정기총회 및 시제',
};

export const DEFAULT_SETTINGS: LabelSettings = {
  paperSize: 'formtec_3114',
  footerText: '固 城 李 氏 서 울 宗 親 會',
  showFooter: true,
  headerBgColor: '#8cc0ec', // 실물 샘플 사진과 동일한 고유 하늘색
  fontFamily: 'gungsuh',
  offsetXmm: 0,
  offsetYmm: 0,
  thermalMode: 'color',
  formtecStartSlot: 1, // 1~8번 슬롯 중 1번부터 시작
  eventName: '2026년 정기총회 및 시제',
  eventYear: 2026,
  showWatermark: true,
  isTravelFeeEvent: false,
  travelFeeAmount: 50000,
};

// 역대 시제/총회 샘플 출석 이력 시드 데이터 (과거 2024년, 2025년 기록)
const SEED_HISTORY: AttendanceRecord[] = [
  {
    id: 'hist_1_2025',
    memberId: 1, // 이관식 (안정공파 28세)
    name: '이관식',
    branch: '안정공파',
    generation: 28,
    role: '',
    mobile: '016-274-9629',
    address: '서울 중구 퇴계로 330(광희동2가)',
    feeAmount: 20000,
    paymentMethod: '현금',
    notes: '2025년 정기 시제 참석',
    timestamp: '2025-10-19 10:15',
    year: 2025,
    eventName: '2025년 가을 정기시제',
    isNewMember: false,
    printedCount: 1,
  },
  {
    id: 'hist_1_2024',
    memberId: 1,
    name: '이관식',
    branch: '안정공파',
    generation: 28,
    role: '',
    mobile: '016-274-9629',
    address: '서울 중구 퇴계로 330(광희동2가)',
    feeAmount: 20000,
    paymentMethod: '현금',
    notes: '2024년 정기 총회 참석',
    timestamp: '2024-03-24 11:00',
    year: 2024,
    eventName: '2024년 정기총회',
    isNewMember: false,
    printedCount: 1,
  },
  {
    id: 'hist_2_2025',
    memberId: 2, // 이가열 (안정공파 29세)
    name: '이가열',
    branch: '안정공파',
    generation: 29,
    role: '',
    mobile: '011-376-1069',
    address: '서울 관악구 쑥고개로2가길 33 (신림동)',
    feeAmount: 20000,
    paymentMethod: '현금',
    notes: '2025년 시제 참석',
    timestamp: '2025-10-19 10:40',
    year: 2025,
    eventName: '2025년 가을 정기시제',
    isNewMember: false,
    printedCount: 1,
  },
  {
    id: 'hist_372_2025',
    memberId: 372, // 이성원 (둔재공파 33세)
    name: '이성원',
    branch: '둔재공파',
    generation: 33,
    role: '',
    mobile: '010-3911-8206',
    address: '서울 양천구 남부순환로60길 10, 101호 (신월동, 자이)',
    feeAmount: 30000,
    paymentMethod: '계좌이체',
    notes: '2025년 시제 찬조금 포함',
    timestamp: '2025-10-19 09:50',
    year: 2025,
    eventName: '2025년 가을 정기시제',
    isNewMember: false,
    printedCount: 1,
  },
  {
    id: 'hist_372_2024',
    memberId: 372,
    name: '이성원',
    branch: '둔재공파',
    generation: 33,
    role: '',
    mobile: '010-3911-8206',
    address: '서울 양천구 남부순환로60길 10, 101호 (신월동, 자이)',
    feeAmount: 20000,
    paymentMethod: '현금',
    notes: '',
    timestamp: '2024-10-20 10:20',
    year: 2024,
    eventName: '2024년 가을 정기시제',
    isNewMember: false,
    printedCount: 1,
  },
  {
    id: 'hist_exec_1_2025',
    memberId: 9001, // 이병직 (사무총장)
    name: '이병직',
    branch: '호군공파',
    generation: 33,
    role: '사무총장',
    mobile: '010-1234-5678',
    feeAmount: 100000,
    paymentMethod: '현금',
    notes: '임원 특별 찬조',
    timestamp: '2025-10-19 08:30',
    year: 2025,
    eventName: '2025년 가을 정기시제',
    isNewMember: false,
    printedCount: 1,
  },
  {
    id: 'hist_exec_1_2024',
    memberId: 9001,
    name: '이병직',
    branch: '호군공파',
    generation: 33,
    role: '사무총장',
    mobile: '010-1234-5678',
    feeAmount: 100000,
    paymentMethod: '현금',
    notes: '임원 특별 찬조',
    timestamp: '2024-10-20 08:30',
    year: 2024,
    eventName: '2024년 가을 정기시제',
    isNewMember: false,
    printedCount: 1,
  },
];

export function loadMembers(): Member[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (data) {
      const parsed: Member[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 이성원 종친 연락처 보정 마이그레이션
        parsed.forEach((m) => {
          if (m.name === '이성원' && m.mobile && m.mobile.includes('9206')) {
            m.mobile = '010-3911-8206';
          }
        });
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load members from localStorage', e);
  }
  return DEFAULT_MEMBERS;
}

export function saveMembers(members: Member[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Failed to save members to localStorage', e);
  }
}

// 당일 출석 목록 로드
export function loadAttendance(): AttendanceRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load attendance from localStorage', e);
  }
  return [];
}

// 당일 출석 목록 저장
export function saveAttendance(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save attendance to localStorage', e);
  }
}

// 역대 전체 출석 및 수납 이력 (연도별 누적 보관)
export function loadAttendanceHistory(): AttendanceRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load attendance history', e);
  }
  return SEED_HISTORY;
}

export function saveAttendanceHistory(history: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save attendance history', e);
  }
}

// 특정 종친의 역대 출석 및 회비 이력 조회 (최신순 정렬)
export function getMemberHistory(memberId: number, currentAttendance: AttendanceRecord[] = []): AttendanceRecord[] {
  const allHistory = loadAttendanceHistory();
  // 현재 행사 기록과 과거 기록을 합산하여 해당 회원의 기록만 추출
  const combined = [
    ...currentAttendance.filter((r) => r.memberId === memberId),
    ...allHistory.filter((r) => r.memberId === memberId && !currentAttendance.some(c => c.id === r.id)),
  ];

  return combined.sort((a, b) => (b.year || 0) - (a.year || 0) || b.timestamp.localeCompare(a.timestamp));
}

export function loadSettings(): LabelSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: LabelSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function loadPrintQueue(): AttendanceRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRINT_QUEUE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load print queue from localStorage', e);
  }
  return [];
}

export function savePrintQueue(queue: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRINT_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save print queue to localStorage', e);
  }
}

// ==========================================
// 역대 행사(Event) 관리 엔진
// ==========================================
export const SEED_EVENTS: EventRecord[] = [
  {
    id: 'event_2026_spring',
    name: '2026년 정기총회 및 시제',
    year: 2026,
    date: '2026-10-08',
    location: '서울 종친회관 대강당',
    presidentName: '이 기 석',
    auditors: ['이 종 춘', '이 원 구'],
    status: 'active',
    createdAt: '2026-01-01',
  },
  {
    id: 'event_2026_yongheon',
    name: '2026년 용헌공파종중 총회 및 시제',
    year: 2026,
    date: '2026-11-15',
    location: '용헌공파 선영 및 제실',
    presidentName: '이 삼 렬',
    auditors: ['이 종 춘', '이 원 구'],
    status: 'active',
    isTravelFeeEvent: true,
    travelFeeAmount: 50000,
    createdAt: '2026-10-08',
  },
  {
    id: 'event_2025_autumn',
    name: '2025년 가을 정기시제',
    year: 2025,
    date: '2025-10-19',
    location: '선영 제실 및 시제터',
    presidentName: '이 기 석',
    auditors: ['이 종 춘', '이 원 구'],
    status: 'archived',
    createdAt: '2025-10-01',
  },
  {
    id: 'event_2024_spring',
    name: '2024년 정기총회',
    year: 2024,
    date: '2024-03-24',
    location: '서울 종친회관 대강당',
    presidentName: '이 기 석',
    auditors: ['이 종 춘', '이 원 구'],
    status: 'archived',
    createdAt: '2024-03-01',
  },
];

export function loadEvents(): EventRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((ev) => {
          const isYongheon = ev.name?.includes('용헌');
          const defaultPres = isYongheon ? '이 삼 렬' : '이 기 석';
          return {
            ...ev,
            presidentName: ev.presidentName || defaultPres,
            auditors: ev.auditors && ev.auditors.length > 0 ? ev.auditors : ['이 종 춘', '이 원 구'],
            isTravelFeeEvent: !!ev.isTravelFeeEvent || isYongheon,
            travelFeeAmount: ev.travelFeeAmount || 50000,
          };
        });
      }
    }
  } catch (e) {
    console.error('Failed to load events from localStorage', e);
  }
  // 기본 시드 이벤트 저장 후 반환
  saveEvents(SEED_EVENTS);
  return SEED_EVENTS;
}

const SECURITY_PIN_KEY = 'gosung_expense_menu_pin';

export function getExpenseMenuPin(): string {
  try {
    return localStorage.getItem(SECURITY_PIN_KEY) || '1234';
  } catch {
    return '1234';
  }
}

export function setExpenseMenuPin(pin: string): void {
  try {
    localStorage.setItem(SECURITY_PIN_KEY, pin);
  } catch (e) {
    console.error('Failed to set expense menu pin', e);
  }
}

export function saveEvents(events: EventRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events to localStorage', e);
  }
}

export function getActiveEventId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_EVENT_ID);
    if (saved) return saved;
  } catch (e) {
    console.error('Failed to get active event id', e);
  }
  return 'event_2026_spring';
}

export function setActiveEventId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EVENT_ID, id);
  } catch (e) {
    console.error('Failed to set active event id', e);
  }
}

// ==========================================
// 행사 지출(Expenses) & 영수증 관리 엔진
// ==========================================
export const SEED_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp_2026_1',
    eventId: 'event_2026_spring',
    eventName: '2026년 정기총회 및 시제',
    date: '2026-10-08',
    category: '식대·다과',
    title: '만수정 연회 뷔페 중식대 (85명)',
    amount: 3400000,
    paymentMethod: '종친회카드',
    payer: '총무이사 이진우',
    notes: '1인 40,000원 x 85명',
    createdAt: '2026-10-08 13:30',
  },
  {
    id: 'exp_2026_2',
    eventId: 'event_2026_spring',
    eventName: '2026년 정기총회 및 시제',
    date: '2026-10-08',
    category: '제물·시제',
    title: '시제 제례용 과일·떡·어물 및 제수용품 일체',
    amount: 1250000,
    paymentMethod: '개인선결제(영수)',
    payer: '제례이사 이성원',
    notes: '가락시장 청과 및 맞춤 떡 영수',
    createdAt: '2026-10-08 09:15',
  },
  {
    id: 'exp_2026_3',
    eventId: 'event_2026_spring',
    eventName: '2026년 정기총회 및 시제',
    date: '2026-10-07',
    category: '인쇄·홍보',
    title: '정기총회 회보 책자(150부) 및 대형 현수막(2점)',
    amount: 880000,
    paymentMethod: '계좌이체',
    payer: '사무총장 이용식',
    notes: '충무로 기획인쇄소',
    createdAt: '2026-10-07 16:00',
  },
  {
    id: 'exp_2026_4',
    eventId: 'event_2026_spring',
    eventName: '2026년 정기총회 및 시제',
    date: '2026-10-08',
    category: '기념품·답례',
    title: '참석 종친 답례용 고급 송월타올 세트 (120개)',
    amount: 720000,
    paymentMethod: '종친회카드',
    payer: '재무이사 이강술',
    notes: '기념 자수 인쇄 포함',
    createdAt: '2026-10-08 08:40',
  },
];

export function loadExpenses(): ExpenseItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load expenses from localStorage', e);
  }
  // 기본 샘플 지출 저장 후 반환
  saveExpenses(SEED_EXPENSES);
  return SEED_EXPENSES;
}

export function saveExpenses(expenses: ExpenseItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save expenses to localStorage', e);
  }
}
