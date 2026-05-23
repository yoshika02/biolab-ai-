'use client';

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";

interface SearchResult {
    id: string;
    title: string;
    type: "protocol" | "paper" | "experiment";
    description?: string;
    href: string;
}

export function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                panelRef.current &&
                inputRef.current &&
                !panelRef.current.contains(e.target as Node) &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (searchQuery: string) => {
        setQuery(searchQuery);

        if (searchQuery.trim().length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        setIsOpen(true);

        try {
            // In production, call /api/search endpoint
            // For now, return mock results
            const mockResults: SearchResult[] = [
                {
                    id: "p1",
                    title: "PCR Protocol - Standard",
                    type: "protocol",
                    description: "DNA amplification protocol using standard PCR technique",
                    href: "/dashboard/protocol?id=p1",
                },
                {
                    id: "p2",
                    title: "DNA Extraction from Plant Tissue",
                    type: "protocol",
                    description: "Protocol for extracting genomic DNA",
                    href: "/dashboard/protocol?id=p2",
                },
                {
                    id: "paper1",
                    title: "CRISPR Gene Editing in Crops",
                    type: "paper",
                    description:
                        "Recent advances in CRISPR technology for agricultural improvement",
                    href: "/dashboard/papers?id=paper1",
                },
                {
                    id: "exp1",
                    title: "Experiment Delta-12",
                    type: "experiment",
                    description: "Cell culture experiment - Week 3",
                    href: "/dashboard/experiments/exp1",
                },
            ];

            // Filter results based on query
            const filtered = mockResults.filter((result) =>
                result.title.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setResults(filtered);
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "protocol":
                return "bg-blue-100 text-blue-700";
            case "paper":
                return "bg-purple-100 text-purple-700";
            case "experiment":
                return "bg-green-100 text-green-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <div className="relative flex-1 max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search protocols, papers, experiments..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-teal-400 focus:outline-none"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery("");
                            setResults([]);
                            setIsOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Search Results Panel */}
            {isOpen && (
                <div
                    ref={panelRef}
                    className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-slate-200 bg-white shadow-lg z-50"
                >
                    {loading ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                            Searching...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                            {query.trim().length < 2
                                ? "Type at least 2 characters to search"
                                : "No results found"}
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto">
                            {results.map((result) => (
                                <Link
                                    key={`${result.type}-${result.id}`}
                                    href={result.href}
                                    onClick={() => {
                                        setIsOpen(false);
                                        setQuery("");
                                    }}
                                    className="block border-b border-slate-100 p-3 transition hover:bg-slate-50 last:border-b-0"
                                >
                                    <div className="flex items-start gap-3">
                                        <span
                                            className={`mt-1 rounded px-2 py-1 text-xs font-medium capitalize ${getTypeColor(
                                                result.type
                                            )}`}
                                        >
                                            {result.type}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-slate-900 truncate">
                                                {result.title}
                                            </h4>
                                            {result.description && (
                                                <p className="text-xs text-slate-600 truncate">
                                                    {result.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
