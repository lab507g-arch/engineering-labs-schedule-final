export type Language = 'ar' | 'en';

export interface Translation {
  title: string;
  subtitle: string;
  liveClock: string;
  print: string;
  exportPDF: string;
  search: string;
  showAll: string;
  allDays: string;
  days: Record<string, string>;
  availableLabs: string;
  lectures: string;
  lecture: string;
  noLectures: string;
  noLecturesHoliday: string;
  noResults: string;
  noResultsHint: string;
  today: string;
  now: string;
  holidays: string;
  holidaysUpcoming: string;
  holidaysNone: string;
  allHolidays: string;
  todayHoliday: string;
  dayHoliday: string;
  rolledOver: string;
  rolledOverFrom: string;
  rolledFromMidweek: string;
  inDays: string;
  tomorrow: string;
  todayLabel: string;
  term: string;
  termCompleted: string;
  termArchived: string;
  weekOf: string;
  termStart: string;
  termEnd: string;
  termWeeks: string;
  currentWeek: string;
  loading: string;
  loadError: string;
  connectedSheets: string;
  fallbackData: string;
  refresh: string;
  footer: string;
  synced: string;
  deviceTime: string;
  room: string;
  course: string;
  instructor: string;
  group: string;
  note: string;
  time: string;
  busy: string;
  vacant: string;
  remaining: string;
  startingSoon: string;
  endingSoon: string;
  notificationStart: string;
  notificationEnd: string;
  enableNotifications: string;
  notificationsEnabled: string;
  selectRoom: string;
  allRooms: string;
  language: string;
}

export const translations: Record<Language, Translation> = {
  ar: {
    title: 'جدول مواعيد المعامل الهندسية',
    subtitle: 'نظام إدارة ومتابعة مواعيد المعامل',
    liveClock: 'الساعة الحية',
    print: 'طباعة',
    exportPDF: 'تصدير PDF',
    search: 'ابحث عن مقرر، مدرب، معمل أو وقت...',
    showAll: 'عرض الكل',
    allDays: 'الكل',
    days: {
      sunday: 'الأحد',
      monday: 'الإثنين',
      tuesday: 'الثلاثاء',
      wednesday: 'الأربعاء',
      thursday: 'الخميس',
      friday: 'الجمعة',
      saturday: 'السبت',
    },
    availableLabs: 'المعامل المتاحة',
    lectures: 'محاضرة',
    lecture: 'محاضرة',
    noLectures: 'لا توجد محاضرات في هذا اليوم',
    noLecturesHoliday: 'لا توجد محاضرات — يوم عطلة رسمية',
    noResults: 'لا توجد نتائج مطابقة',
    noResultsHint: 'جرّب تعديل البحث أو الفلاتر',
    today: 'اليوم',
    now: 'المحاضرة الآن',
    holidays: 'أيام العطل والإجازات الرسمية',
    holidaysUpcoming: 'إجازة قادمة خلال يومين',
    holidaysNone: 'لا توجد إجازات قريبة',
    allHolidays: 'قائمة جميع الإجازات الرسمية',
    todayHoliday: 'اليوم عطلة رسمية',
    dayHoliday: 'إجازة',
    rolledOver: 'مرحّل',
    rolledOverFrom: 'مرحّل من',
    rolledFromMidweek: 'منتصف الأسبوع → الخميس',
    inDays: 'بعد {n} أيام',
    tomorrow: 'غداً',
    todayLabel: 'اليوم',
    term: 'الترم',
    termCompleted: 'اكتمل الترم',
    termArchived: 'الترم منتهي — الجدول مؤرشف',
    weekOf: 'أسبوع {n}',
    termStart: 'بداية الترم',
    termEnd: 'نهاية الترم',
    termWeeks: 'أسابيع الترم',
    currentWeek: 'الأسبوع الحالي',
    loading: 'جاري تحميل البيانات...',
    loadError: 'تعذّر تحميل البيانات من Google Sheets — يتم استخدام البيانات الافتراضية',
    connectedSheets: 'متصل بـ Google Sheets',
    fallbackData: 'بيانات تجريبية',
    refresh: 'تحديث',
    footer: 'نظام إدارة مواعيد المعامل الهندسية',
    synced: 'متزامن',
    deviceTime: 'وقت الجهاز',
    room: 'المعمل',
    course: 'المقرر',
    instructor: 'المدرب',
    group: 'المجموعة',
    note: 'ملاحظة',
    time: 'الوقت',
    busy: 'مشغول',
    vacant: 'متاح',
    remaining: 'متبقي',
    startingSoon: 'تبدأ قريباً',
    endingSoon: 'تنتهي قريباً',
    notificationStart: 'بدأت محاضرة: {course} في {lab}',
    notificationEnd: 'انتهت محاضرة: {course} في {lab}',
    enableNotifications: 'تفعيل التنبيهات',
    notificationsEnabled: 'التنبيهات مفعّلة',
    selectRoom: 'اختر معملاً للتصدير',
    allRooms: 'جميع المعامل',
    language: 'English',
  },
  en: {
    title: 'Engineering Labs Schedule',
    subtitle: 'Lab Schedule Management System',
    liveClock: 'Live Clock',
    print: 'Print',
    exportPDF: 'Export PDF',
    search: 'Search for a course, instructor, lab, or time...',
    showAll: 'Show All',
    allDays: 'All',
    days: {
      sunday: 'Sunday',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
    },
    availableLabs: 'Available Labs',
    lectures: 'lectures',
    lecture: 'lecture',
    noLectures: 'No lectures scheduled for this day',
    noLecturesHoliday: 'No lectures — official holiday',
    noResults: 'No matching results',
    noResultsHint: 'Try adjusting your search or filters',
    today: 'Today',
    now: 'Lecture Now',
    holidays: 'Official Holidays & Vacations',
    holidaysUpcoming: 'upcoming holiday within 2 days',
    holidaysNone: 'No upcoming holidays',
    allHolidays: 'All official holidays',
    todayHoliday: 'Today is an official holiday',
    dayHoliday: 'Holiday',
    rolledOver: 'Moved',
    rolledOverFrom: 'Moved from',
    rolledFromMidweek: 'Mid-week → Thursday',
    inDays: 'in {n} days',
    tomorrow: 'Tomorrow',
    todayLabel: 'Today',
    term: 'Term',
    termCompleted: 'Term Completed',
    termArchived: 'Term ended — schedule archived',
    weekOf: 'Week {n}',
    termStart: 'Term Start',
    termEnd: 'Term End',
    termWeeks: 'Term Weeks',
    currentWeek: 'Current Week',
    loading: 'Loading data...',
    loadError: 'Failed to load data from Google Sheets — using fallback data',
    connectedSheets: 'Connected to Google Sheets',
    fallbackData: 'Demo data',
    refresh: 'Refresh',
    footer: 'Engineering Labs Schedule Management System',
    synced: 'Synced',
    deviceTime: 'Device time',
    room: 'Room',
    course: 'Course',
    instructor: 'Instructor',
    group: 'Group',
    note: 'Note',
    time: 'Time',
    busy: 'Busy',
    vacant: 'Vacant',
    remaining: 'remaining',
    startingSoon: 'Starting soon',
    endingSoon: 'Ending soon',
    notificationStart: 'Lecture started: {course} in {lab}',
    notificationEnd: 'Lecture ended: {course} in {lab}',
    enableNotifications: 'Enable Notifications',
    notificationsEnabled: 'Notifications enabled',
    selectRoom: 'Select a room to export',
    allRooms: 'All Rooms',
    language: 'العربية',
  },
};

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDateForLang(date: Date, lang: Language): string {
  const months = lang === 'ar' ? AR_MONTHS : EN_MONTHS;
  const dayName = translations[lang].days[
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()]
  ];
  if (lang === 'ar') {
    return `${dayName}، ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  return `${dayName}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateStrForLang(dateStr: string, lang: Language): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return formatDateForLang(date, lang);
}

export function formatTime12hForLang(time: string, lang: Language): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return time;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (lang === 'ar') {
    const suffix = h >= 12 ? 'م' : 'ص';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')} ${suffix}`;
  }
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')} ${suffix}`;
}
