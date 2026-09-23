export interface SheetTab {
  name: string;
  gid: string;
}

const HOLIDAY_TAB_NAMES = ['vacations', 'vacation', 'holidays', 'holiday', 'إجازات', 'إجازة', 'العطل', 'عطلة'];
const TERM_TAB_NAMES = ['terms', 'term', 'ترم', 'الترم', 'فصل', 'الفصل'];

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function isHolidayTab(name: string): boolean {
  const n = normalize(name);
  return HOLIDAY_TAB_NAMES.some((h) => n === h || n.includes(h));
}

export function isTermTab(name: string): boolean {
  const n = normalize(name);
  return TERM_TAB_NAMES.some((tm) => n === tm || n.includes(tm));
}

/**
 * Fetches pubhtml with ?widget=true to expose tab navigation, then extracts all sheet GIDs+names.
 * widget=true is critical — without it Google only renders the first sheet.
 */
export async function discoverTabs(pubhtmlUrl: string): Promise<SheetTab[]> {
  // ponytail: widget=true forces Google to render tab bar with all sheet names+gids
  const url = pubhtmlUrl.includes('widget=true') ? pubhtmlUrl : `${pubhtmlUrl}?widget=true`;
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`pubhtml ${res.status}`);
  const html = await res.text();

  const tabs: SheetTab[] = [];
  const seen = new Set<string>();

  function addTab(gid: string, name: string) {
    const g = gid.trim(), n = name.trim().replace(/&amp;/g, '&');
    if (g && n && !seen.has(g)) { seen.add(g); tabs.push({ name: n, gid: g }); }
  }

  // Pattern 1: gid=NUMBER in hrefs next to visible tab text
  // e.g. <a href="#gid=1234567890">Sheet Name</a>
  const p1 = /<a\b[^>]*href="[^"]*[?#&]gid=(\d+)[^"]*"[^>]*>\s*([^<]{1,60})\s*<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = p1.exec(html)) !== null) addTab(m[1], m[2]);

  // Pattern 2: data-sheet-id or data-gid attribute with adjacent text
  if (tabs.length === 0) {
    const p2 = /data-(?:sheet-id|gid)="(\d+)"[^>]*>\s*([^<]{1,60})\s*</gi;
    while ((m = p2.exec(html)) !== null) addTab(m[1], m[2]);
  }

  // Pattern 3: <option value="NUMBER">Name</option> (older pubhtml format)
  if (tabs.length === 0) {
    const p3 = /<option\b[^>]*value="(\d+)"[^>]*>([^<]+)<\/option>/gi;
    while ((m = p3.exec(html)) !== null) addTab(m[1], m[2]);
  }

  // Pattern 4: Extract all gid numbers found in the page, map to known names in order
  if (tabs.length === 0) {
    const gids = [...new Set([...html.matchAll(/\bgid[=:](\d+)/g)].map(x => x[1]))];
    const KNOWN_NAMES = ['312', '328', '330', '339', '408', '507', 'Vacations', 'Terms'];
    gids.slice(0, KNOWN_NAMES.length).forEach((g, i) => addTab(g, KNOWN_NAMES[i]));
  }

  console.log('[labs] discoverTabs found:', tabs.map(t => `${t.name}(gid=${t.gid})`));
  return tabs;
}

/**
 * Fallback: probe sequential gids 0..maxProbe via CSV fetch.
 */
export async function probeTabs(csvBaseUrl: string, maxProbe: number): Promise<SheetTab[]> {
  const results = await Promise.all(
    Array.from({ length: maxProbe }, (_, i) => probeTab(csvBaseUrl, i))
  );
  return results.filter((t): t is SheetTab => t !== null);
}

async function probeTab(csvBaseUrl: string, gid: number): Promise<SheetTab | null> {
  try {
    const res = await fetch(`${csvBaseUrl}&gid=${gid}`, { credentials: 'omit' });
    if (!res.ok) return null;
    const text = await res.text();
    const first = text.trimStart();
    if (!first || /^<[!h]/i.test(first)) return null;
    if (text.split('\n').filter(l => l.trim()).length < 2) return null;
    return { name: `Tab ${gid}`, gid: String(gid) };
  } catch {
    return null;
  }
}
