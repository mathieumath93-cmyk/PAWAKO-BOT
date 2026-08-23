import * as XLSX from 'xlsx';
import { QuizQuestion } from '../types';

export interface ParsedQuizResult {
  questions: QuizQuestion[];
  errors: string[];
  warnings: string[];
}

/**
 * Parses raw text, CSV, JSON, or Excel ArrayBuffer into QuizQuestion[]
 */
export async function parseQuizFile(file: File): Promise<ParsedQuizResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'json') {
    const text = await file.text();
    return parseQuizJson(text);
  }

  if (extension === 'txt') {
    const text = await file.text();
    return parseQuizText(text);
  }

  // Handle Excel (.xlsx, .xls) and CSV / TSV via SheetJS
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json<any>(firstSheet, { defval: '' });
    
    if (rawData && rawData.length > 0) {
      return parseQuizRows(rawData);
    }
  } catch (err: any) {
    console.warn('[parseQuizFile] XLSX parse failed, falling back to text parsing:', err);
  }

  // Fallback to text parsing
  const text = await file.text();
  return parseQuizText(text);
}

/**
 * Parse JSON string into QuizQuestion[]
 */
export function parseQuizJson(jsonString: string): ParsedQuizResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const questions: QuizQuestion[] = [];

  try {
    const data = JSON.parse(jsonString);
    const array = Array.isArray(data) ? data : data.questions || [];

    if (!Array.isArray(array) || array.length === 0) {
      errors.push('Le fichier JSON ne contient aucun tableau de questions valide.');
      return { questions, errors, warnings };
    }

    array.forEach((item: any, idx: number) => {
      const qText = item.text || item.question || item.titre || `Question ${idx + 1}`;
      const rawOptions = item.options || item.choix || item.answers || [];
      const options = Array.isArray(rawOptions)
        ? rawOptions.map((o) => String(o).trim())
        : ['Option A', 'Option B'];

      let correct = 0;
      if (typeof item.correctAnswer === 'number') {
        correct = item.correctAnswer;
      } else if (typeof item.reponseCorrecte === 'number') {
        correct = item.reponseCorrecte;
      } else if (typeof item.correctAnswer === 'string' || typeof item.reponse === 'string') {
        const val = String(item.correctAnswer || item.reponse).trim();
        correct = parseCorrectAnswerIndex(val, options);
      }

      questions.push({
        id: `q-imported-${Date.now()}-${idx}`,
        text: qText,
        options: options.length >= 2 ? options : [...options, 'Option B'],
        correctAnswer: Math.max(0, Math.min(options.length - 1, correct)),
        explanation: item.explanation || item.explication || '',
      });
    });
  } catch (e: any) {
    errors.push(`Erreur de lecture du JSON : ${e.message}`);
  }

  return { questions, errors, warnings };
}

/**
 * Parses Structured Excel/CSV Rows
 */
export function parseQuizRows(rows: any[]): ParsedQuizResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const questions: QuizQuestion[] = [];

  rows.forEach((row, idx) => {
    const keys = Object.keys(row);
    
    // Find question text
    const qKey = keys.find((k) =>
      /question|intitule|title|titre|q$/i.test(k)
    ) || keys[0];

    const text = String(row[qKey] || '').trim();
    if (!text) return; // skip empty rows

    // Find options
    const options: string[] = [];
    keys.forEach((k) => {
      if (/option|choix|answer|reponse_[0-9]|rep_[0-9]/i.test(k) && !/correct|explanation|explication/i.test(k)) {
        const val = String(row[k] || '').trim();
        if (val) options.push(val);
      }
    });

    // If options not found by key name, look for column 2, 3, 4, 5
    if (options.length < 2) {
      keys.forEach((k, kIdx) => {
        if (kIdx > 0 && !/correct|explication|explanation/i.test(k)) {
          const val = String(row[k] || '').trim();
          if (val && !options.includes(val)) options.push(val);
        }
      });
    }

    // Find correct answer
    const correctKey = keys.find((k) =>
      /correct|reponse_correcte|bonne_reponse|reponse|answer/i.test(k)
    );
    const correctVal = correctKey ? String(row[correctKey]).trim() : '0';
    const correctAnswer = parseCorrectAnswerIndex(correctVal, options);

    // Find explanation
    const expKey = keys.find((k) => /explication|explanation|remarque/i.test(k));
    const explanation = expKey ? String(row[expKey]).trim() : '';

    questions.push({
      id: `q-imported-${Date.now()}-${idx}`,
      text,
      options: options.length >= 2 ? options : ['Choix 1', 'Choix 2'],
      correctAnswer: Math.max(0, Math.min(Math.max(1, options.length) - 1, correctAnswer)),
      explanation,
    });
  });

  if (questions.length === 0) {
    errors.push('Aucune question valide détectée dans le fichier Excel/CSV.');
  }

  return { questions, errors, warnings };
}

/**
 * Parses raw TXT format with Q:, A), B), Reponse: or line-by-line format
 */
export function parseQuizText(rawText: string): ParsedQuizResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const questions: QuizQuestion[] = [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) {
    errors.push('Le texte est vide.');
    return { questions, errors, warnings };
  }

  let currentQ: {
    text: string;
    options: string[];
    correctAnswerStr?: string;
    explanation?: string;
  } | null = null;

  const pushCurrent = () => {
    if (!currentQ || !currentQ.text) return;
    const opts = currentQ.options.length >= 2 ? currentQ.options : ['Choix A', 'Choix B'];
    const correctIdx = parseCorrectAnswerIndex(currentQ.correctAnswerStr || '0', opts);

    questions.push({
      id: `q-txt-${Date.now()}-${questions.length}`,
      text: currentQ.text,
      options: opts,
      correctAnswer: Math.max(0, Math.min(opts.length - 1, correctIdx)),
      explanation: currentQ.explanation || '',
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Question header e.g. "Q1: ...", "Question 1 : ...", "1. ..."
    if (/^(Q[0-9]*[\s.:]|\?|Question\s*[0-9]*[\s.:]|[0-9]+\.\s+)/i.test(line)) {
      if (currentQ) pushCurrent();
      const qText = line.replace(/^(Q[0-9]*[\s.:]|\?|Question\s*[0-9]*[\s.:]|[0-9]+\.\s+)/i, '').trim();
      currentQ = {
        text: qText || line,
        options: [],
      };
      continue;
    }

    if (!currentQ) {
      // First line without Q header
      currentQ = {
        text: line,
        options: [],
      };
      continue;
    }

    // Detect Answer key e.g. "Reponse : A" or "Bonne reponse : 1" or "Correct : ..."
    if (/^(R[eé]ponse|Correct|Bonne r[eé]ponse|Answer)[\s:]/i.test(line)) {
      currentQ.correctAnswerStr = line.replace(/^(R[eé]ponse|Correct|Bonne r[eé]ponse|Answer)[\s:]/i, '').trim();
      continue;
    }

    // Detect Explanation e.g. "Explication : ..."
    if (/^(Explication|Explanation|Note)[\s:]/i.test(line)) {
      currentQ.explanation = line.replace(/^(Explication|Explanation|Note)[\s:]/i, '').trim();
      continue;
    }

    // Detect Options e.g. "A) ...", "- ...", "1) ...", "[x] ..."
    if (/^([A-D1-4][).-]|\*|-|\[[ xX]\])\s+/i.test(line)) {
      const isMarkedCorrect = /^(\*|\[[xX]\])/.test(line) || /\(correct\)/i.test(line);
      const optClean = line
        .replace(/^([A-D1-4][).-]|\*|-|\[[ xX]\])\s+/, '')
        .replace(/\(correct\)/i, '')
        .trim();

      if (optClean) {
        currentQ.options.push(optClean);
        if (isMarkedCorrect) {
          currentQ.correctAnswerStr = String(currentQ.options.length - 1);
        }
      }
      continue;
    }

    // If line doesn't match option prefix but currentQ has fewer options, treat as option if it looks like one, or append to question
    if (currentQ.options.length === 0 && !currentQ.correctAnswerStr) {
      currentQ.text += ' ' + line;
    } else {
      currentQ.options.push(line);
    }
  }

  if (currentQ) pushCurrent();

  if (questions.length === 0) {
    errors.push('Impossible de structurer des questions depuis le texte fourni.');
  }

  return { questions, errors, warnings };
}

/**
 * Helper to convert "A", "B", "1", "2", "Option 1" or zero-based index to index number
 */
function parseCorrectAnswerIndex(val: string, options: string[]): number {
  if (!val) return 0;
  const clean = val.trim().toUpperCase();

  // Single letter A, B, C, D
  if (clean === 'A') return 0;
  if (clean === 'B') return 1;
  if (clean === 'C') return 2;
  if (clean === 'D') return 3;

  // 1-based index numbers 1, 2, 3, 4
  if (/^[1-4]$/.test(clean)) {
    return parseInt(clean, 10) - 1;
  }

  // Exact option text match
  const matchIdx = options.findIndex((opt) => opt.toLowerCase() === val.toLowerCase());
  if (matchIdx >= 0) return matchIdx;

  // Partial option text match
  const partialIdx = options.findIndex((opt) => opt.toLowerCase().includes(val.toLowerCase()));
  if (partialIdx >= 0) return partialIdx;

  // Numeric index
  const num = parseInt(clean, 10);
  if (!isNaN(num)) {
    if (num >= 1 && num <= options.length) return num - 1;
    if (num >= 0 && num < options.length) return num;
  }

  return 0;
}

/**
 * Generate Sample Template Content
 */
export const SAMPLE_TXT_TEMPLATE = `Q1: Quel est le mot de passe de la documentation du Module 1 ?
A) PAWAKO1
B) SECRET2026
C) ADMIN123
D) PAWAKO_FORMATION
Réponse: A
Explication: Le mot de passe indiqué dans le cours est PAWAKO1.

Q2: Quel est le score minimum requis pour valider le quiz du Module 1 ?
A) 8/20
B) 10/20
C) 12/20
D) 16/20
Réponse: C
Explication: Un score minimum de 12/20 est obligatoire pour débloquer le rôle suivant.
`;

export const SAMPLE_CSV_TEMPLATE = `Question,Option 1,Option 2,Option 3,Option 4,Reponse Correcte,Explication
"Quel est le mot de passe du Module 1 ?","PAWAKO1","TEST","1234","AUCUN","1","Le mot de passe officiel est PAWAKO1."
"Combien de messages faut-il pour préparer un PPV ?","2 à 3","8 à 15","50+","1 seul","2","Une structure progressive en 8 à 15 messages est idéale."
`;
