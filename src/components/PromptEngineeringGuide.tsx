/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PROMPT_ENGINEERING_SECTIONS } from "../data/promptEngineeringData";
import { BookOpen, Copy, Check, ChevronRight } from "lucide-react";

export const PromptEngineeringGuide: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState(PROMPT_ENGINEERING_SECTIONS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeSection =
    PROMPT_ENGINEERING_SECTIONS.find((s) => s.id === activeSectionId) ||
    PROMPT_ENGINEERING_SECTIONS[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* 標題與簡介 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 tracking-wide uppercase">
            <span>Prompt Engineering Discipline</span>
            <span aria-hidden="true">·</span>
            <span>8 大工程化維度 (a~h)</span>
            <span aria-hidden="true">·</span>
            <span>嚴謹架構實踐</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            工程化提示詞設計與教學指引 (Engineering Prompt Design)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            以系統提示詞、少樣本引導、RAG 長上下文、外部工具規範、結構化輸出、手算測試比對、反覆修正與可視化展開全套軟體工程實踐。
          </p>
        </div>
      </div>

      {/* 8 大維度切換導覽與內容主體 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側：8 大維度導覽選單 */}
        <div className="lg:col-span-4 space-y-1.5">
          {PROMPT_ENGINEERING_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                activeSectionId === sec.id
                  ? "bg-amber-50/80 border-amber-300 shadow-xs ring-1 ring-amber-200"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span className="font-mono text-amber-600 font-extrabold uppercase">
                    [{sec.letter}]
                  </span>
                  <span className="truncate">{sec.title}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {sec.subtitle}
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ${
                  activeSectionId === sec.id
                    ? "text-amber-600 translate-x-0.5"
                    : "text-slate-300"
                }`}
              />
            </button>
          ))}
        </div>

        {/* 右側：詳盡內容卡片 */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-5">
            {/* 標題與簡介 */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-mono font-bold text-amber-600 uppercase">
                  SECTION {activeSection.letter.toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {activeSection.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {activeSection.subtitle}
                </p>
              </div>

              {activeSection.codeSnippet && (
                <button
                  onClick={() =>
                    handleCopy(activeSection.codeSnippet!, activeSection.id)
                  }
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copiedId === activeSection.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">已複製提示詞</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>複製提示詞範本</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 核心重點清單 */}
            <div>
              <div className="text-xs font-semibold text-slate-800 mb-2">
                核心設計守則與規範要點：
              </div>
              <div className="space-y-1.5">
                {activeSection.keyPoints.map((kp, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700"
                  >
                    <span className="text-amber-500 font-bold shrink-0">•</span>
                    <span>{kp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 深入闡述說明 */}
            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-100">
              {activeSection.content}
            </div>

            {/* 提示詞範本代碼方塊 */}
            {activeSection.codeSnippet && (
              <div>
                <div className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>提示詞範本 / JSON Schema / 代碼展示：</span>
                  <span className="text-[11px] text-slate-400 font-mono">Prompt & Spec Snippet</span>
                </div>
                <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                  {activeSection.codeSnippet}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
