import { Category } from '../types';

export interface ParsedQuickEntry {
  title: string;
  amount: number | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  matchedCategory: Category | null;
  rawText: string;
}

function formatDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Smart NLP-lite parser for quick entry text (Thai & English support)
 */
export function parseQuickEntry(
  input: string,
  availableCategories: Category[] = []
): ParsedQuickEntry {
  let text = input.trim();
  const rawText = text;

  let amount: number | null = null;
  let due_date: string | null = null;
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  const tags: string[] = [];
  let matchedCategory: Category | null = null;

  // 1. Extract Tags (#tag)
  const tagMatches = text.match(/#([\w\u0E00-\u0E7F]+)/g);
  if (tagMatches) {
    tagMatches.forEach((tag) => {
      const cleanTag = tag.replace(/^#/, '');
      tags.push(cleanTag);
      // Remove tag from text
      text = text.replace(tag, '');
    });
  }

  // 2. Extract Priority (!urgent, !high, !low, ด่วนมาก, ด่วน)
  if (/!(urgent|ด่วนมาก)/i.test(text) || /ด่วนมาก/i.test(text)) {
    priority = 'urgent';
    text = text.replace(/!(urgent|ด่วนมาก)|ด่วนมาก/gi, '');
  } else if (/!(high|สำคัญ)/i.test(text) || /\bด่วน\b/i.test(text)) {
    priority = 'high';
    text = text.replace(/!(high|สำคัญ)|\bด่วน\b/gi, '');
  } else if (/!(low|ต่ำ)/i.test(text)) {
    priority = 'low';
    text = text.replace(/!(low|ต่ำ)/gi, '');
  }

  // 3. Extract Amount (e.g. "45 บ.", "150 บาท", "200.-", "฿100", "$50")
  const currencyPrefixMatch = text.match(/(?:฿|\$)\s*([\d,]+(?:\.\d+)?)/);
  const currencySuffixMatch = text.match(/([\d,]+(?:\.\d+)?)\s*(?:บาท|บ\.|บ\b|\.-|baht|thb)/i);

  if (currencyPrefixMatch) {
    amount = parseFloat(currencyPrefixMatch[1].replace(/,/g, ''));
    text = text.replace(currencyPrefixMatch[0], '');
  } else if (currencySuffixMatch) {
    amount = parseFloat(currencySuffixMatch[1].replace(/,/g, ''));
    text = text.replace(currencySuffixMatch[0], '');
  }

  // 4. Extract Due Date (relative Thai & English)
  const now = new Date();
  if (/วันนี้|today/i.test(text)) {
    due_date = formatDateString(now);
    text = text.replace(/วันนี้|today/gi, '');
  } else if (/พรุ่งนี้|tomorrow/i.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    due_date = formatDateString(d);
    text = text.replace(/พรุ่งนี้|tomorrow/gi, '');
  } else if (/มะรืนนี้/i.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    due_date = formatDateString(d);
    text = text.replace(/มะรืนนี้/gi, '');
  } else {
    // Check "อีก N วัน" (in N days)
    const inDaysMatch = text.match(/อีก\s*(\d+)\s*วัน/i);
    if (inDaysMatch) {
      const days = parseInt(inDaysMatch[1], 10);
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      due_date = formatDateString(d);
      text = text.replace(inDaysMatch[0], '');
    }
  }

  // 5. Match Category by Name or Keywords
  const lowerInput = rawText.toLowerCase();
  for (const cat of availableCategories) {
    const catNameLower = cat.name.toLowerCase();
    if (lowerInput.includes(catNameLower)) {
      matchedCategory = cat;
      break;
    }
  }

  // Common keywords matching if not matched directly
  if (!matchedCategory && availableCategories.length > 0) {
    if (/ซื้อ|ตลาด|ห้าง|เซเว่น|ของกิน|ช้อป/i.test(lowerInput)) {
      matchedCategory = availableCategories.find((c) => /ช้อป|ซื้อ|shop/i.test(c.name)) || null;
    } else if (/งาน|ส่ง|ประชุม|การบ้าน|โปรเจกต์|meeting/i.test(lowerInput)) {
      matchedCategory = availableCategories.find((c) => /งาน|work/i.test(c.name)) || null;
    } else if (/จ่าย|บิล|ค่าน้ำ|ค่าไฟ|โอนเงิน|ธนาคาร/i.test(lowerInput)) {
      matchedCategory = availableCategories.find((c) => /เงิน|จ่าย|finance/i.test(c.name)) || null;
    }
  }

  // Clean title
  let title = text.replace(/\s+/g, ' ').trim();
  if (!title) {
    title = rawText;
  }

  return {
    title,
    amount,
    due_date,
    priority,
    tags,
    matchedCategory,
    rawText,
  };
}
