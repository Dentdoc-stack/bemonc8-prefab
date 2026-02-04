'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Fuse from 'fuse.js';
import { TaskWithStatus } from '@/types';
import { Search, X, MapPin, FileText, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GlobalSearchProps {
    tasks: TaskWithStatus[];
    onSelectResult: (task: TaskWithStatus) => void;
}

interface SearchResult {
    item: TaskWithStatus;
    refIndex: number;
    score?: number;
}

export default function GlobalSearch({ tasks, onSelectResult }: GlobalSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Create Fuse instance with search configuration
    const fuse = useMemo(() => {
        return new Fuse(tasks, {
            keys: [
                { name: 'site_name', weight: 0.4 },
                { name: 'site_id', weight: 0.3 },
                { name: 'task_name', weight: 0.2 },
                { name: 'district', weight: 0.1 },
                { name: 'package_name', weight: 0.1 },
            ],
            threshold: 0.4, // Fuzzy threshold
            includeScore: true,
            minMatchCharLength: 2,
        });
    }, [tasks]);

    // Handle keyboard shortcut (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                setResults([]);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Search on query change
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const searchResults = fuse.search(query).slice(0, 10);
        setResults(searchResults);
    }, [query, fuse]);

    const handleSelect = useCallback((task: TaskWithStatus) => {
        onSelectResult(task);
        setIsOpen(false);
        setQuery('');
        setResults([]);
    }, [onSelectResult]);

    const handleClose = () => {
        setIsOpen(false);
        setQuery('');
        setResults([]);
    };

    return (
        <>
            {/* Search Trigger Button */}
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="gap-2 text-muted-foreground"
            >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    Ctrl+K
                </kbd>
            </Button>

            {/* Search Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20"
                    onClick={handleClose}
                >
                    <div
                        className="w-full max-w-2xl bg-background rounded-lg shadow-xl border overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-2 p-4 border-b">
                            <Search className="h-5 w-5 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                type="text"
                                placeholder="Search sites, tasks, districts..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1 border-0 focus-visible:ring-0 text-lg"
                                autoFocus
                            />
                            <Button variant="ghost" size="icon" onClick={handleClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Results */}
                        <div className="max-h-96 overflow-y-auto">
                            {results.length > 0 ? (
                                <div className="p-2">
                                    {results.map((result, index) => (
                                        <button
                                            key={`${result.item.task_uid}-${index}`}
                                            onClick={() => handleSelect(result.item)}
                                            className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-start gap-3"
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <MapPin className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-foreground truncate">
                                                    {result.item.site_name}
                                                </div>
                                                <div className="text-sm text-muted-foreground truncate flex items-center gap-2">
                                                    <Building2 className="h-3 w-3" />
                                                    {result.item.district} • {result.item.package_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate flex items-center gap-2 mt-1">
                                                    <FileText className="h-3 w-3" />
                                                    {result.item.task_name}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <span className={`text-xs px-2 py-1 rounded-full ${result.item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        result.item.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                            result.item.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {result.item.status}
                                                </span>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {result.item.progress_pct ?? 0}%
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : query.length >= 2 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No results found for &quot;{query}&quot;
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <p className="mb-2">Start typing to search</p>
                                    <p className="text-xs">Search by site name, task, district, or package</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground flex items-center justify-between">
                            <span>Press <kbd className="px-1 py-0.5 bg-background rounded border">ESC</kbd> to close</span>
                            <span>{results.length > 0 && `${results.length} results`}</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
