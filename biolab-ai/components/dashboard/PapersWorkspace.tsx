'use client';

import { useState } from 'react';
import { Search, Upload, Link as LinkIcon, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Mock data for search results
const mockSearchResults = [
    { id: 1, title: 'CRISPR-Cas9 mediated genome editing in human cells', source: 'PubMed', year: 2023, authors: 'Smith J, Doe A' },
    { id: 2, title: 'High-throughput screening of small molecule inhibitors', source: 'Nature', year: 2024, authors: 'Wang L, et al.' },
    { id: 3, title: 'Machine learning for predicting protein folding', source: 'Bioinformatics', year: 2022, authors: 'AlphaFold Team' },
];

export function PapersWorkspace() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<typeof mockSearchResults | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<typeof mockSearchResults[0] | null>(null);
    const [summary, setSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    
    // Upload / Link state
    const [linkInput, setLinkInput] = useState('');
    const [uploadMode, setUploadMode] = useState<'search' | 'upload'>('search');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        // Simulate API call
        setTimeout(() => {
            setResults(mockSearchResults);
            setIsSearching(false);
        }, 800);
    };

    const handleSummarize = (paper: typeof mockSearchResults[0]) => {
        setSelectedPaper(paper);
        setIsSummarizing(true);
        setSummary('');
        
        // Simulate AI summary generation
        setTimeout(() => {
            setSummary("This paper discusses the recent advancements in " + paper.title.toLowerCase() + ". The authors propose a novel methodology that significantly improves accuracy and reduces off-target effects. Key findings suggest that this approach could be widely adopted in clinical settings within the next decade, offering a robust framework for future therapeutic interventions.");
            setIsSummarizing(false);
        }, 1500);
    };

    const handleLinkSummarize = (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkInput.trim()) return;
        
        setIsSummarizing(true);
        setSelectedPaper({ id: 99, title: 'Summary from Link', source: 'External', year: new Date().getFullYear(), authors: 'Unknown' });
        
        setTimeout(() => {
            setSummary("This is an AI-generated summary extracted from the provided external link. The document outlines key protocols for lab maintenance and highlights safety procedures required for handling reactive chemical agents.");
            setIsSummarizing(false);
        }, 1500);
    };

    return (
        <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
            {/* Header */}
            <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-500">M2 Literature Review</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Paper Summarizer & Search</h1>
                <p className="mt-2 text-slate-400">Search across platforms or upload your own papers for instant AI summaries.</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex space-x-4 border-b border-slate-800 pb-4">
                <button 
                    onClick={() => setUploadMode('search')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${uploadMode === 'search' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Search Papers
                </button>
                <button 
                    onClick={() => setUploadMode('upload')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${uploadMode === 'upload' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Upload & Summarize
                </button>
            </div>

            {uploadMode === 'search' ? (
                <div className="space-y-6">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Enter keyword to search across platforms..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-2xl border border-slate-700 bg-slate-800/50 py-4 pl-12 pr-32 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="absolute right-2">
                                <Button type="submit" disabled={isSearching} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* Search Results */}
                    {results && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-slate-200">Results</h3>
                                {results.map((paper) => (
                                    <div key={paper.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-medium text-slate-100">{paper.title}</h4>
                                                <p className="mt-1 text-sm text-slate-400">{paper.authors} • {paper.year}</p>
                                                <span className="mt-3 inline-block rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                                                    {paper.source}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                onClick={() => handleSummarize(paper)}
                                                className="flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition"
                                            >
                                                Get Summary <ChevronRight className="ml-1 h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary View */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-slate-200">Summary</h3>
                                <div className="rounded-2xl border border-blue-900/30 bg-blue-950/10 p-6 min-h-[300px]">
                                    {isSummarizing ? (
                                        <div className="flex h-full flex-col items-center justify-center space-y-4 text-blue-400">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                            <p className="text-sm font-medium animate-pulse">Generating AI summary...</p>
                                        </div>
                                    ) : selectedPaper && summary ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                                                <FileText className="h-5 w-5 text-blue-400" />
                                                <h4 className="font-medium text-slate-200 leading-tight">{selectedPaper.title}</h4>
                                            </div>
                                            <div className="prose prose-invert max-w-none">
                                                <p className="text-slate-300 leading-relaxed text-sm">{summary}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center text-slate-500">
                                            <FileText className="h-10 w-10 opacity-20 mb-3" />
                                            <p className="text-sm">Select a paper to view its AI summary</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upload File Section */}
                    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/20 p-8 flex flex-col items-center justify-center text-center transition hover:border-blue-500/50 hover:bg-slate-900/40">
                        <div className="rounded-full bg-slate-800 p-4 mb-4">
                            <Upload className="h-6 w-6 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-200">Upload PDF</h3>
                        <p className="mt-2 text-sm text-slate-400 max-w-[250px]">Drag and drop your research paper here or click to browse files.</p>
                        <Button className="mt-6 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl">
                            Select File
                        </Button>
                    </div>

                    {/* Paste Link Section */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="rounded-full bg-blue-500/10 p-3">
                                <LinkIcon className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-slate-200">Paste Link</h3>
                                <p className="text-sm text-slate-400">Provide a URL to summarize</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleLinkSummarize} className="space-y-4">
                            <input
                                type="url"
                                required
                                placeholder="https://..."
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <Button type="submit" disabled={isSummarizing} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                                {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Summarize Link
                            </Button>
                        </form>
                    </div>

                    {/* Summary Display for Upload/Link */}
                    {selectedPaper && summary && uploadMode === 'upload' && (
                        <div className="md:col-span-2 rounded-2xl border border-blue-900/30 bg-blue-950/10 p-6 mt-4">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                    <h4 className="font-medium text-slate-200 leading-tight">Extracted Summary</h4>
                                </div>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-slate-300 leading-relaxed text-sm">{summary}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
