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

