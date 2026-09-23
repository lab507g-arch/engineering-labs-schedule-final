import type { LabSession, Holiday, TermConfig } from './types';

/**
 * Google Sheets published CSV link.
 *
 * The spreadsheet can have any number of tabs. The app discovers all tabs
 * dynamically from the published HTML page, then classifies each tab by name:
 *   - Tabs named "Vacations"/"Holidays"/"إجازات" → holiday data
 *   - Tabs named "Terms"/"ترم" → term config
 *   - All other tabs → room timetables (tab name used as room/lab name)
 *
 * Each room tab should have columns: day, startTime, endTime, course, instructor, group, note
 * The room/lab name is taken from the tab name unless a "lab" column is present.
 */

export const SHEET_CSV_BASE_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhVkElXCaxr356sWv710urFr1WW9eqkMWleBubadCdu6SRPchszFWwkkBAIcouCeXl6Pk0psvfgwEH/pub?output=csv';

export const SHEET_PUBHTML_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhVkElXCaxr356sWv710urFr1WW9eqkMWleBubadCdu6SRPchszFWwkkBAIcouCeXl6Pk0psvfgwEH/pubhtml';

// Maximum number of tabs to probe if pubhtml parsing fails
export const MAX_TAB_PROBE = 20;

// Default term durations
export const TERM_DURATIONS: Record<string, number> = {
  first: 16,
  second: 16,
  summer: 4,
};

// Fallback term config — defaults to "first" term starting today
export const FALLBACK_TERM: TermConfig = {
  type: 'first',
  startDate: '2026-09-19',
  weeks: 16,
};

// Fallback timetable data for initial demo / offline
export const FALLBACK_TIMETABLE: LabSession[] = [
  { id: 's1', day: 'sunday', startTime: '08:00', endTime: '10:00', course: 'هندسة القوى', instructor: 'د. أحمد محمد', lab: 'Lab 328 ME', group: 'ميكانيكا A' },
  { id: 's2', day: 'sunday', startTime: '10:00', endTime: '12:00', course: 'ديناميكا الموائع', instructor: 'د. سارة علي', lab: 'Lab 312 ME', group: 'ميكانيكا B' },
  { id: 's3', day: 'sunday', startTime: '12:00', endTime: '14:00', course: 'مختبر قياسات', instructor: 'م. خالد إبراهيم', lab: 'Lab 330 ME', group: 'ميكانيكا A' },
  { id: 's4', day: 'sunday', startTime: '14:00', endTime: '16:00', course: 'تصميم هندسي', instructor: 'د. منى حسن', lab: 'Lab G507', group: 'كهرباء A' },
  { id: 'm1', day: 'monday', startTime: '08:00', endTime: '10:00', course: 'الإلكترونيات', instructor: 'د. عمر فاروق', lab: 'Lab G408', group: 'كهرباء B' },
  { id: 'm2', day: 'monday', startTime: '10:00', endTime: '12:00', course: 'استعادة المواد', instructor: 'د. أحمد محمد', lab: 'Lab 339 ME', group: 'ميكانيكا A' },
  { id: 'm3', day: 'monday', startTime: '12:00', endTime: '14:00', course: 'أنظمة التحكم', instructor: 'د. سارة علي', lab: 'Lab 328 ME', group: 'كهرباء A' },
  { id: 'm4', day: 'monday', startTime: '14:00', endTime: '16:00', course: 'مختبر حركة', instructor: 'م. خالد إبراهيم', lab: 'Lab 312 ME', group: 'ميكانيكا B' },
  { id: 't1', day: 'tuesday', startTime: '08:00', endTime: '10:00', course: 'الديناميكا الحرارية', instructor: 'د. منى حسن', lab: 'Lab 330 ME', group: 'ميكانيكا A' },
  { id: 't2', day: 'tuesday', startTime: '10:00', endTime: '12:00', course: 'برمجة الحاسب', instructor: 'د. عمر فاروق', lab: 'Lab G507', group: 'كهرباء B' },
  { id: 't3', day: 'tuesday', startTime: '12:00', endTime: '14:00', course: 'مختبر موائع', instructor: 'م. خالد إبراهيم', lab: 'Lab G408', group: 'ميكانيكا A' },
  { id: 't4', day: 'tuesday', startTime: '14:00', endTime: '16:00', course: 'تصميم آليات', instructor: 'د. أحمد محمد', lab: 'Lab 339 ME', group: 'ميكانيكا B' },
  { id: 'w1', day: 'wednesday', startTime: '08:00', endTime: '10:00', course: 'هندسة الإنتاج', instructor: 'د. سارة علي', lab: 'Lab 328 ME', group: 'ميكانيكا A' },
  { id: 'w2', day: 'wednesday', startTime: '10:00', endTime: '12:00', course: 'ماكينات كهربائية', instructor: 'د. منى حسن', lab: 'Lab 312 ME', group: 'كهرباء A' },
  { id: 'w3', day: 'wednesday', startTime: '12:00', endTime: '14:00', course: 'مختبر إلكترونيات', instructor: 'د. عمر فاروق', lab: 'Lab G507', group: 'كهرباء B' },
  { id: 'w4', day: 'wednesday', startTime: '14:00', endTime: '16:00', course: 'قوة المواد', instructor: 'م. خالد إبراهيم', lab: 'Lab 330 ME', group: 'ميكانيكا B' },
  { id: 'th1', day: 'thursday', startTime: '08:00', endTime: '10:00', course: 'مشروع تخرج', instructor: 'د. أحمد محمد', lab: 'Lab 339 ME', group: 'جميع المجموعات' },
  { id: 'th2', day: 'thursday', startTime: '10:00', endTime: '12:00', course: 'مختبر تحكم', instructor: 'د. سارة علي', lab: 'Lab G408', group: 'كهرباء A' },
  { id: 'th3', day: 'thursday', startTime: '12:00', endTime: '14:00', course: 'هندسة عكسية', instructor: 'د. منى حسن', lab: 'Lab 328 ME', group: 'ميكانيكا A' },
  { id: 'th4', day: 'thursday', startTime: '14:00', endTime: '16:00', course: 'أنظمة طاقة', instructor: 'د. عمر فاروق', lab: 'Lab 312 ME', group: 'كهرباء B' },
];

export const FALLBACK_HOLIDAYS: Holiday[] = [
  { id: 'h1', name: 'عيد القوات المسلحة', date: '2026-10-06', description: 'ذكرى نصر أكتوبر' },
  { id: 'h2', name: 'رأس السنة الميلادية', date: '2027-01-01' },
  { id: 'h3', name: 'عيد الميلاد المجيد', date: '2027-01-07' },
  { id: 'h4', name: 'عيد الشرطة - عيد الثورة', date: '2027-01-25' },
  { id: 'h5', name: 'إجازة منتصف العام', date: '2027-01-23', description: 'تبدأ من 23 يناير 2027' },
  { id: 'h6', name: 'عيد الفطر المبارك', date: '2027-03-05' },
  { id: 'h7', name: 'عيد جامعة الدول العربية', date: '2027-03-21' },
  { id: 'h8', name: 'عيد تحرير سيناء', date: '2027-04-25' },
  { id: 'h9', name: 'عيد العمال', date: '2027-05-01' },
  { id: 'h10', name: 'عيد القيامة المجيد وعيد شم النسيم', date: '2027-05-02' },
  { id: 'h11', name: 'أجازة عيد الأضحى المبارك', date: '2027-05-14' },
  { id: 'h12', name: 'رأس السنة الهجرية', date: '2027-06-06' },
  { id: 'h13', name: 'عيد ثورة 30 يونيو', date: '2027-06-30' },
  { id: 'h14', name: 'عيد ثورة 23 يوليو', date: '2027-07-23' },
  { id: 'h15', name: 'أجازة المولد النبوي الشريف', date: '2027-08-14' },
  { id: 'h16', name: 'أجازة نهاية العام الدراسي', date: '2027-08-27' },
];

/**
 * Known tab names for this sheet.
 * Used as last-resort fallback when pubhtml discovery fails.
 * The app will probe CSV for gid=0,1,2... and assign these names in order.
 */
export const KNOWN_TAB_NAMES = ['312', '328', '330', '339', '408', '507', 'Vacations', 'Terms'];
