import { useState, useEffect } from 'react';

// دالة لتنظيف الرموز الخفية من بداية ملف الـ CSV
function cleanText(text: string): string {
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  return text.trim();
}

export function useTimetableData(spreadsheetId: string, sheetNames: string[]) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      const results: Record<string, any[]> = {};

      try {
        for (const sheetName of sheetNames) {
          // بناء الرابط باستخدام واجهة gviz/tq الرسمية لدعم الشيتات المنشورة والأسماء بدقة
          let url = '';
          if (spreadsheetId.startsWith('2PACX-')) {
            url = `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
          } else {
            url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
          }
          
          try {
            const response = await fetch(url, { credentials: 'omit' });
            
            if (!response.ok) {
              console.warn(`[labs] Failed to fetch sheet "${sheetName}": HTTP status ${response.status}`);
              continue;
            }

            const rawText = await response.text();
            const cleaned = cleanText(rawText);

            // التحقق من أن النتيجة ليست صفحة خطأ HTML
            if (cleaned.startsWith('<!DOCTYPE') || cleaned.startsWith('<html') || cleaned.startsWith('<HTML')) {
              console.warn(`[labs] Sheet "${sheetName}" returned HTML instead of CSV. Check publish settings.`);
              continue;
            }

            // تقسيم السطور وتنظيفها
            const lines = cleaned.split('\n').map(line => line.trim()).filter(Boolean);
            results[sheetName] = lines;
          } catch (err) {
            console.warn(`[labs] Error fetching sheet "${sheetName}":`, err);
          }
        }

        setData(results);
      } catch (err: any) {
        setError(err.message || 'Error fetching timetable data');
      } finally {
        setLoading(false);
      }
    }

    if (spreadsheetId && sheetNames && sheetNames.length > 0) {
      fetchData();
    }
  }, [spreadsheetId, sheetNames]);

  return { data, loading, error };
}
