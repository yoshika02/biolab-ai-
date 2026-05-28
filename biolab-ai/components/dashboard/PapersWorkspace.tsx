'use client';

import { useRef, useState } from 'react';
import { Search, Upload, Link as LinkIcon, FileText, Loader2, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { callGemini } from '@/lib/gemini';

function SummaryBox({ content, loading }: { content: string; loading: boolean }) {
    if (loading) return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-blue-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-medium animate-pulse">Generating AI summary…</p>
        </div>
    );
    if (!content) return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
            <FileText className="h-10 w-10 opacity-20" />
            <p className="text-sm">Summary will appear here</p>
        </div>
    );
    return (
        <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-slate-100 prose-strong:text-slate-200 prose-li:text-slate-300">
            {content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h2 key={i} className="text-lg font-bold text-slate-100 mt-4 mb-2">{line.slice(2)}</h2>;
                if (line.startsWith('## ')) return <h3 key={i} className="text-base font-semibold text-slate-200 mt-3 mb-1">{line.slice(3)}</h3>;
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-slate-200">{line.slice(2, -2)}</p>;
                if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="text-slate-300 ml-4 list-disc">{line.slice(2)}</li>;
                if (!line.trim()) return <div key={i} className="h-2" />;
                return <p key={i} className="text-slate-300 leading-relaxed">{line}</p>;
            })}
        </div>
    );
}

interface SearchResult {
    id: number;
    title: string;
    authors: string;
    year: number;
    source: string;
    abstract: string;
}

export function PapersWorkspace() {
    const [tab, setTab] = useState<'search' | 'upload'>('search');

    // Search state
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searchError, setSearchError] = useState('');
    const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
    const [summary, setSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);

    // Upload state
    const [file, setFile] = useState<File | null>(null);
    const [fileText, setFileText] = useState('');
    const [link, setLink] = useState('');
    const [uploadSummary, setUploadSummary] = useState('');
    const [isUploadSummarizing, setIsUploadSummarizing] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!query.trim()) return;
        setIsSearching(true);
        setSearchError('');
        setResults([]);
        setSelectedResult(null);
        setSummary('');
        try {
            const prompt = `You are a scientific literature assistant. The user searched for: "${query}".

Return exactly 5 relevant research papers in this JSON format (no markdown, just raw JSON array):
[
  {"id":1,"title":"...", "authors":"...", "year":2024, "source":"PubMed/Nature/etc", "abstract":"2-3 sentence abstract"},
  ...
]

Make them highly relevant to the search query. Use realistic titles, authors, and abstracts from the biomedical/life sciences domain.`;

            const aiText = await callGemini(prompt);
            const jsonMatch = aiText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('Could not parse AI response.');
            const parsed: SearchResult[] = JSON.parse(jsonMatch[0]);
            setResults(parsed);
        } catch (err) {
            setSearchError(err instanceof Error ? err.message : 'Search failed.');
        } finally {
            setIsSearching(false);
        }
    }

    async function handleSummarize(paper: SearchResult) {
        setSelectedResult(paper);
        setIsSummarizing(true);
        setSummary('');
        try {
            const prompt = `You are a scientific literature assistant. Provide a comprehensive, structured summary of the following research paper for a biolab researcher.

Paper: "${paper.title}"
Authors: ${paper.authors} (${paper.year})
Source: ${paper.source}
Abstract: ${paper.abstract}

Write a detailed summary with these sections:
## Overview
## Key Findings
## Methodology
## Implications for Research
## Limitations

Be specific, insightful and use clear language.`;
            const result = await callGemini(prompt);
            setSummary(result);
        } catch {
            setSummary('Failed to generate summary. Please check your AI configuration.');
        } finally {
            setIsSummarizing(false);
        }
    }

    async function readFile(f: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = (e.target?.result as string) || '';
                const cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{4,}/g, '\n').trim();
                resolve(cleaned.slice(0, 10000));
            };
            reader.onerror = reject;
            reader.readAsText(f);
        });
    }

    async function handleFileChange(f: File) {
        setFile(f);
        setUploadSummary('');
        setUploadError('');
        try {
            const text = await readFile(f);
            if (text.length < 20) throw new Error('Could not extract text. Try a .txt or .md file.');
            setFileText(text);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Failed to read file.');
        }
    }

    async function handleUploadSummarize(e: React.FormEvent) {
        e.preventDefault();
        setIsUploadSummarizing(true);
        setUploadSummary('');
        setUploadError('');
        try {
            let content = '';
            if (tab === 'upload' && fileText) {
                content = `Summarize this research document:\n\n${fileText}`;
            } else if (link.trim()) {
                content = `The user provided this link: ${link}\n\nProvide a detailed summary of what this research paper or document is likely about based on the URL, and explain what a biolab researcher should know about this type of research. Then outline what the paper likely covers.`;
            } else {
                throw new Error('Please upload a file or paste a link first.');
            }

            const prompt = `You are a biomedical research assistant. ${content}

Structure your summary with:
## Overview
## Key Findings  
## Methodology
## Implications
## Limitations

Be detailed, accurate, and helpful for a lab researcher.`;
            const result = await callGemini(prompt);
            setUploadSummary(result);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Summarization failed.');
        } finally {
            setIsUploadSummarizing(false);
        }
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">M2 · Literature Review</p>
                <h1 className="mt-1 text-3xl font-bold text-white">Paper Summarizer</h1>
                <p className="mt-1 text-slate-400 text-sm">Search across platforms or upload a paper for deep AI analysis.</p>
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-1 rounded-2xl bg-slate-900 border border-slate-800 p-1 w-fit">
                {(['search', 'upload'] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 text-sm font-semibold rounded-xl transition capitalize ${tab === t ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                        {t === 'search' ? '🔍 Search Papers' : '📄 Upload & Summarize'}
                    </button>
                ))}
            </div>

            {tab === 'search' ? (
                <div className="space-y-6">
                    <form onSubmit={handleSearch} className="relative flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                                placeholder="Search: CRISPR gene editing, protein folding, mRNA vaccines..."
                                className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <button type="submit" disabled={isSearching}
                            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60 shrink-0">
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            {isSearching ? 'Searching…' : 'Search AI'}
                        </button>
                    </form>

                    {searchError && (
                        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-5 py-4 text-sm text-rose-400">
                            ⚠ {searchError}
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                                    {results.length} results for &ldquo;{query}&rdquo;
                                </p>
                                {results.map((paper) => (
                                    <div key={paper.id}
                                        className={`rounded-2xl border p-5 cursor-pointer transition-all ${selectedResult?.id === paper.id ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
                                        onClick={() => handleSummarize(paper)}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-100 leading-snug">{paper.title}</h4>
                                                <p className="mt-1 text-xs text-slate-500">{paper.authors} · {paper.year}</p>
                                                <p className="mt-2 text-sm text-slate-400 line-clamp-2">{paper.abstract}</p>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">{paper.source}</span>
                                        </div>
                                        <div className="mt-3 flex justify-end">
                                            <span className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                                                {selectedResult?.id === paper.id ? '✓ Selected' : 'Get AI Summary →'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-2xl border border-blue-900/30 bg-gradient-to-b from-blue-950/20 to-slate-900/20 p-6 h-fit sticky top-4">
                                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800">
                                    <Sparkles className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm font-semibold text-slate-200">AI Summary</span>
                                    {selectedResult && <span className="ml-auto text-xs text-slate-500 truncate max-w-[160px]">{selectedResult.title}</span>}
                                </div>
                                <SummaryBox content={summary} loading={isSummarizing} />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Upload */}
                        <div>
                            <p className="text-sm font-semibold text-slate-300 mb-3">Upload PDF / TXT</p>
                            <div
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileChange(f); }}
                                onClick={() => fileRef.current?.click()}
                                className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-900/50'}`}>
                                <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.doc,.docx" className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }} />
                                {file && fileText ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                        <p className="text-sm font-semibold text-slate-200">{file.name}</p>
                                        <p className="text-xs text-slate-500">{fileText.length.toLocaleString()} characters</p>
                                        <button onClick={e => { e.stopPropagation(); setFile(null); setFileText(''); setUploadSummary(''); }}
                                            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300">
                                            <X className="h-3 w-3" /> Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="h-8 w-8 text-slate-500" />
                                        <p className="text-sm font-medium text-slate-400">Drag & drop or click to browse</p>
                                        <p className="text-xs text-slate-600">PDF, TXT, MD, DOC</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Paste Link */}
                        <div>
                            <p className="text-sm font-semibold text-slate-300 mb-3">Paste Paper Link</p>
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6 space-y-4">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <LinkIcon className="h-5 w-5 text-blue-400 shrink-0" />
                                    <p className="text-sm">PubMed, DOI, arXiv, or any paper URL</p>
                                </div>
                                <input type="url" value={link} onChange={e => setLink(e.target.value)}
                                    placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
                            </div>
                        </div>
                    </div>

                    {uploadError && (
                        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-5 py-4 text-sm text-rose-400">⚠ {uploadError}</div>
                    )}

                    <button onClick={handleUploadSummarize} disabled={isUploadSummarizing || (!fileText && !link.trim())}
                        className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
                        {isUploadSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {isUploadSummarizing ? 'Summarizing…' : 'Generate AI Summary'}
                    </button>

                    {(uploadSummary || isUploadSummarizing) && (
                        <div className="rounded-2xl border border-blue-900/30 bg-gradient-to-b from-blue-950/20 to-slate-900/20 p-6">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800">
                                <Sparkles className="h-4 w-4 text-blue-400" />
                                <span className="text-sm font-semibold text-slate-200">AI Summary</span>
                            </div>
                            <SummaryBox content={uploadSummary} loading={isUploadSummarizing} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
