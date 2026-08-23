import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  FileSpreadsheet,
  FileCode,
  Check,
  AlertCircle,
  HelpCircle,
  Download,
  Copy,
  Sparkles,
} from 'lucide-react';
import { QuizQuestion } from '../types';
import {
  parseQuizFile,
  parseQuizText,
  SAMPLE_TXT_TEMPLATE,
  SAMPLE_CSV_TEMPLATE,
} from '../utils/quizParser';

interface QuizImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizTitle?: string;
  onImportQuestions: (questions: QuizQuestion[], replaceExisting: boolean) => void;
}

export const QuizImportModal: React.FC<QuizImportModalProps> = ({
  isOpen,
  onClose,
  quizTitle,
  onImportQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [pastedText, setPastedText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<QuizQuestion[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);
    setErrors([]);

    try {
      const res = await parseQuizFile(file);
      setParsedQuestions(res.questions);
      setErrors(res.errors);
    } catch (err: any) {
      setErrors([`Erreur lors de la lecture du fichier : ${err?.message || err}`]);
      setParsedQuestions([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseText = () => {
    if (!pastedText.trim()) {
      setErrors(['Veuillez coller le texte de votre quiz ci-dessous.']);
      return;
    }
    setIsProcessing(true);
    setErrors([]);
    try {
      const res = parseQuizText(pastedText);
      setParsedQuestions(res.questions);
      setErrors(res.errors);
    } catch (err: any) {
      setErrors([`Erreur de traitement : ${err?.message || err}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedQuestions.length === 0) return;
    onImportQuestions(parsedQuestions, replaceExisting);
    onClose();
  };

  const handleDownloadSample = (type: 'txt' | 'csv') => {
    const content = type === 'txt' ? SAMPLE_TXT_TEMPLATE : SAMPLE_CSV_TEMPLATE;
    const filename = type === 'txt' ? 'modele_quiz_pawako.txt' : 'modele_quiz_pawako.csv';
    const mime = type === 'txt' ? 'text/plain;charset=utf-8;' : 'text/csv;charset=utf-8;';

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Importer des Questions dans le Quiz
            </h3>
            <p className="text-xs text-slate-400">
              {quizTitle ? `Quiz cible : ${quizTitle}` : 'Format TXT, CSV, Excel (.xlsx) ou JSON'}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mb-5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'file'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Fichier Excel / CSV / TXT</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'text'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Copier-Coller du Texte</span>
          </button>
        </div>

        {/* Templates download links */}
        <div className="mb-5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Besoin d'un modèle prêt à remplir ?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadSample('txt')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 text-[11px] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Modèle TXT</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadSample('csv')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 text-[11px] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modèle Excel/CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Content 1: File Upload */}
        {activeTab === 'file' && (
          <div className="space-y-4 mb-5">
            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-950/40 transition-colors group">
              <input
                type="file"
                accept=".txt,.csv,.xlsx,.xls,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="p-3 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 text-slate-400 transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-200">
                  Cliquez ou glissez-déposez votre fichier ici
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Formats acceptés : <code className="text-indigo-300">.xlsx</code>, <code className="text-indigo-300">.csv</code>, <code className="text-indigo-300">.txt</code>, <code className="text-indigo-300">.json</code>
                </p>
              </div>
              {fileName && (
                <div className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{fileName}</span>
                </div>
              )}
            </label>
          </div>
        )}

        {/* Tab Content 2: Raw Text Input */}
        {activeTab === 'text' && (
          <div className="space-y-3 mb-5">
            <textarea
              rows={7}
              placeholder={`Q1: Quelle est la règle principale ?\nA) Respect\nB) Insulte\nC) Ignorer\nRéponse: A\nExplication: Le respect est obligatoire.\n\nQ2: ...`}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleParseText}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyser le Texte</span>
            </button>
          </div>
        )}

        {/* Errors / Warnings */}
        {errors.length > 0 && (
          <div className="mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>Erreurs de détection</span>
            </div>
            {errors.map((err, i) => (
              <p key={i}>• {err}</p>
            ))}
          </div>
        )}

        {/* Preview of Parsed Questions */}
        {parsedQuestions.length > 0 && (
          <div className="space-y-4 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{parsedQuestions.length} Question(s) Détectée(s)</span>
              </h4>

              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
                <input
                  type="checkbox"
                  id="replace_existing_questions"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
                <label htmlFor="replace_existing_questions" className="text-slate-300 cursor-pointer select-none">
                  Remplacer les questions existantes
                </label>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
              {parsedQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2"
                >
                  <div className="font-bold text-white flex items-start gap-2">
                    <span className="text-indigo-400 shrink-0">#{idx + 1}.</span>
                    <span>{q.text}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === q.correctAnswer;
                      return (
                        <div
                          key={optIdx}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold'
                              : 'bg-slate-900 text-slate-300 border border-slate-800/60'
                          }`}
                        >
                          <span>{String.fromCharCode(65 + optIdx)}) {opt}</span>
                          {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="text-[11px] text-slate-400 pl-5 italic">
                      💡 Explication : {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedQuestions.length === 0}
            className={`px-5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              parsedQuestions.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Valider & Importer ({parsedQuestions.length} Q)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
