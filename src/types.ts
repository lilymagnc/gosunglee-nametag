export interface Member {
  id: number;
  name: string;
  branch: string;       // e.g. "사암공파", "호군공파", "참판공파" 등
  branchHanja?: string;  // e.g. "思菴公派"
  generation: number | string; // e.g. 31 (세수)
  birthOrigin?: string;  // 본향/생년
  zipCode?: string;
  address?: string;
  job?: string;
  role?: string;         // 직책 (e.g. "재무이사", "회장", "사무총장")
  phone?: string;
  mobile?: string;
  email?: string;
  notes?: string;
  isCustom?: boolean;    // 현장에서 신규 등록된 종친 여부
}

export interface AttendanceRecord {
  id: string;            // 고유 식별자 (UUID or timestamp)
  memberId: number;
  name: string;
  branch: string;
  generation: number | string;
  role?: string;
  job?: string; // 사회 직업 (회사/생업)
  mobile?: string;
  address?: string;
  feeAmount: number;     // 납부 회비 (0원은 면제 또는 미납)
  paymentMethod: '현금' | '계좌이체' | '카드' | '기타' | '미납';
  notes?: string;        // 찬조금, 협찬 물품, 비고
  timestamp: string;     // 접수 일시 (e.g. 2026-10-08 09:30)
  year: number;          // 행사 연도 (e.g. 2026, 2025, 2024)
  eventName: string;     // 행사명 (e.g. "2026년 정기총회 및 시제")
  isNewMember: boolean;  // 당일 신규 등록 여부
  printedCount: number;  // 명찰 출력 횟수
  printSlot?: number;    // 폼텍 8칸 출력 시 사용된 슬롯 번호 (1~8)
}

export type PaperSize = 'formtec_3114' | 'label_90x60' | 'label_80x60';

export interface LabelSettings {
  paperSize: PaperSize;
  footerText: string;     // 기본값: "固 城 李 氏 서 울 宗 親 會"
  showFooter: boolean;
  footerType?: 'preset' | 'eventName' | 'none'; // 하단 인쇄 내용: 종파/종중명('preset') vs 공식행사명('eventName') vs 인쇄안함('none')
  headerBgColor: string;  // 기본값: "#8cc0ec" (실물 사진 속 연하늘색)
  fontFamily: 'gungsuh' | 'myeongjo';
  // 인쇄 미세 조정 (mm 단위)
  offsetXmm: number;      // 좌우 오프셋 (-5 ~ +5 mm)
  offsetYmm: number;      // 상하 오프셋 (-5 ~ +5 mm)
  // 감열식 프린터 전용 디자인 모드
  thermalMode?: 'color' | 'outline' | 'inverted' | 'textOnly';
  // 폼텍 8칸 인쇄 시 시작 칸 번호 (1 ~ 8)
  formtecStartSlot: number;
  // 행사 기본 정보 (사용자 화면에서 언제든 수정 가능)
  eventName: string;      // 행사명 (기본값: "2026년 정기총회 및 시제")
  eventYear: number;      // 행사 연도 (기본값: 2026)
  // 고성이씨 문양 워터마크 배경 표시 여부
  showWatermark?: boolean;
}

// ==========================================
// 행사 단위 재정 & 지출 관리 모델
// ==========================================
export interface EventRecord {
  id: string;              // 고유 식별자 (e.g. "event_2026_spring")
  name: string;            // 행사명 (e.g. "2026년 정기총회 및 시제")
  year: number;            // 연도 (e.g. 2026)
  date: string;            // 행사 일자 (e.g. "2026-10-08")
  location?: string;       // 장소 (e.g. "서울 종친회관 대강당")
  presidentName?: string;  // 행사 회장 성명 (기본값: "이 기 석")
  auditors?: string[];     // 행사 감사 성명 목록 (기본값: ["이 종 춘", "이 원 구"])
  status: 'active' | 'archived'; // 진행 중 vs 보관됨
  createdAt: string;
}

export type ExpenseCategory =
  | '식대·다과'
  | '제물·시제'
  | '인쇄·홍보'
  | '기념품·답례'
  | '대관·장소'
  | '교통·운임'
  | '진행·잡비';

export interface ExpenseItem {
  id: string;              // 고유 ID
  eventId: string;         // 연결된 행사 ID
  eventName: string;       // 행사명 (스냅샷)
  date: string;            // 지출 일자 (e.g. "2026-10-08")
  category: ExpenseCategory; // 비목 분류
  title: string;           // 지출 항목명 (e.g. "만수정 뷔페 중식대 75명")
  amount: number;          // 지출 금액 (원)
  paymentMethod: '종친회카드' | '개인선결제(영수)' | '계좌이체' | '현금';
  payer: string;           // 집행자 / 영수인 (e.g. "총무이사 이진우")
  receiptImage?: string;   // 영수증 사진 (Base64 or URL)
  notes?: string;          // 비고
  createdAt: string;
}

