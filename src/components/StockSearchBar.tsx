import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Sparkles, Loader2, Clock, Trash2, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { StockRecommendation } from "../types";

interface StockSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (ticker: string) => void;
  isLoading: boolean;
  onClear: () => void;
  recentSearches?: string[];
  onClearRecentSearches?: () => void;
  stockPool?: StockRecommendation[];
}

const HOT_TICKERS = ["NVDA", "AAPL", "TSLA", "PLTR", "MSFT", "AMZN"];

export const StockSearchBar: React.FC<StockSearchBarProps> = ({
  value,
  onChange,
  onSearch,
  isLoading,
  onClear,
  recentSearches = [],
  onClearRecentSearches,
  stockPool = [],
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Compute dynamic autocomplete suggestions
  const suggestions = useMemo<StockRecommendation[]>(() => {
    const query = value.trim().toUpperCase();

    // When query is empty: return recent searches (if any)
    if (!query) {
      return recentSearches.slice(0, 5).map((t) => {
        const found = stockPool.find((s) => s.ticker.toUpperCase() === t);
        return {
          ticker: t,
          name: found?.name || "历史查找标的",
          category: "历史搜索",
          changePct: found?.changePct,
          isRecent: true,
        };
      });
    }

    // When query is not empty: match from recent searches and current day report stockPool
    const matchedMap = new Map<string, StockRecommendation>();

    // 1. Check recent searches matching query
    recentSearches.forEach((t) => {
      const upper = t.toUpperCase();
      if (upper.includes(query)) {
        const found = stockPool.find((s) => s.ticker.toUpperCase() === upper);
        matchedMap.set(upper, {
          ticker: upper,
          name: found?.name || "历史搜索标的",
          category: "历史记录",
          changePct: found?.changePct,
          isRecent: true,
        });
      }
    });

    // 2. Check stock pool (current day report leaders, movers, watchlist)
    stockPool.forEach((item) => {
      const upperT = item.ticker.toUpperCase();
      const upperName = (item.name || "").toUpperCase();
      const upperCat = (item.category || "").toUpperCase();

      if (upperT.includes(query) || upperName.includes(query) || upperCat.includes(query)) {
        if (!matchedMap.has(upperT)) {
          matchedMap.set(upperT, {
            ...item,
            ticker: upperT,
            isRecent: false,
          });
        }
      }
    });

    // 3. Sort: exact match > startsWith ticker > recent > others
    const list = Array.from(matchedMap.values());
    list.sort((a, b) => {
      const aT = a.ticker;
      const bT = b.ticker;
      if (aT === query) return -1;
      if (bT === query) return 1;
      const aStarts = aT.startsWith(query);
      const bStarts = bT.startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      if (a.isRecent && !b.isRecent) return -1;
      if (!a.isRecent && b.isRecent) return 1;
      return aT.localeCompare(bT);
    });

    return list.slice(0, 7);
  }, [value, recentSearches, stockPool]);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onChange(raw.toUpperCase());
    setIsDropdownOpen(true);
  };

  const handleSelectTicker = (ticker: string) => {
    onChange(ticker);
    setIsDropdownOpen(false);
    onSearch(ticker);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    // If an item is highlighted via arrow keys, select it
    if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      handleSelectTicker(suggestions[highlightedIndex].ticker);
      return;
    }

    const clean = value.trim().toUpperCase();
    if (!clean) return;
    setIsDropdownOpen(false);
    onSearch(clean);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsDropdownOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 >= suggestions.length ? 0 : prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 < 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full justify-between">
      {/* Search Input Group with Dropdown */}
      <div ref={containerRef} className="relative flex items-center gap-2 flex-shrink-0">
        <form onSubmit={handleSubmit} className="relative w-64 md:w-80 flex-shrink-0">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none flex items-center">
            <Search className="w-4 h-4 text-amber-400" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="输入美股代码，如 NVDA..."
            disabled={isLoading}
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-neutral-900 border border-neutral-700 rounded-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono shadow-inner disabled:opacity-60"
          />

          {value && !isLoading ? (
            <button
              type="button"
              onClick={() => {
                onClear();
                setIsDropdownOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 transition-colors cursor-pointer"
              title="清空输入"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : recentSearches.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-amber-400 p-1 transition-colors cursor-pointer"
              title="查看历史与推荐标的"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </form>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!value.trim() || isLoading}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-sm border flex items-center gap-1.5 transition-all flex-shrink-0 shadow-sm ${
            isLoading
              ? "bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed"
              : !value.trim()
              ? "bg-neutral-900 text-neutral-500 border-neutral-800 cursor-not-allowed"
              : "bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-100 hover:border-amber-400/80 active:scale-98 cursor-pointer text-amber-300"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>分析中...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>个股分析</span>
            </>
          )}
        </button>

        {/* Dynamic Autocomplete & Recent Searches Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-72 md:w-88 bg-[#151515] border border-neutral-700 rounded-md shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Dropdown Header */}
            <div className="px-3 py-2 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                {value.trim() ? (
                  <>
                    <Search className="w-3 h-3 text-amber-400" />
                    <span>智能联想推荐 ({suggestions.length})</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>最近搜索历史 (Recent Lookups)</span>
                  </>
                )}
              </span>

              {!value.trim() && recentSearches.length > 0 && onClearRecentSearches && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearRecentSearches();
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center gap-1 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="清空历史记录"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>清空历史</span>
                </button>
              )}
            </div>

            {/* List Items */}
            {suggestions.length > 0 ? (
              <div className="py-1 max-h-64 overflow-y-auto no-scrollbar">
                {suggestions.map((item, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  const isPositive = item.changePct?.includes("+") ?? false;
                  const isNegative = item.changePct?.includes("-") ?? false;

                  return (
                    <button
                      key={`${item.ticker}-${idx}`}
                      type="button"
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelectTicker(item.ticker)}
                      className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                        isHighlighted
                          ? "bg-neutral-800 text-amber-300 border-l-2 border-amber-400 pl-2.5"
                          : "text-neutral-200 hover:bg-neutral-800/60 hover:text-amber-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-bold text-white text-sm tracking-wide shrink-0">
                          {item.ticker}
                        </span>

                        <span className="text-[11px] text-neutral-400 truncate max-w-[130px] sm:max-w-[150px]">
                          {item.name}
                        </span>

                        {item.category && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-sans shrink-0 border ${
                              item.isRecent
                                ? "bg-amber-950/60 text-amber-400 border-amber-800/50"
                                : "bg-neutral-800 text-neutral-400 border-neutral-700"
                            }`}
                          >
                            {item.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.changePct && (
                          <span
                            className={`text-[10px] font-bold flex items-center gap-0.5 ${
                              isPositive
                                ? "text-emerald-400"
                                : isNegative
                                ? "text-rose-400"
                                : "text-neutral-400"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-2.5 h-2.5" />
                            ) : isNegative ? (
                              <TrendingDown className="w-2.5 h-2.5" />
                            ) : null}
                            {item.changePct}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 hover:text-amber-300 flex items-center gap-0.5">
                          分析
                          <ArrowUpRight className="w-3 h-3 text-neutral-500" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : value.trim() ? (
              <div className="p-3 text-center">
                <p className="text-xs text-neutral-400 font-sans">
                  未在当前研报或历史中找到{" "}
                  <span className="text-amber-400 font-mono font-bold">"{value.trim()}"</span>
                </p>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="mt-2 text-xs font-mono text-[#d4af37] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <span>按 Enter 直接向全美股发起深度研报检索</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-neutral-500 font-sans">
                暂无历史记录，请输入代码如 NVDA 或点击右侧热搜标的
              </div>
            )}

            {/* Footer tip */}
            <div className="px-3 py-1.5 bg-neutral-950 border-t border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between font-sans">
              <span>↑↓ 键切换选择，Enter 确认分析</span>
              <span className="font-mono text-neutral-600">Yahoo + Gemini 引擎</span>
            </div>
          </div>
        )}
      </div>

      {/* Hot Tickers Tags */}
      <div className="flex items-center gap-1.5 text-xs text-neutral-400 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-neutral-500 font-mono flex-shrink-0 text-[11px]">热搜:</span>
        <div className="flex items-center gap-1 flex-wrap">
          {HOT_TICKERS.map((ticker) => (
            <button
              key={ticker}
              type="button"
              disabled={isLoading}
              onClick={() => handleSelectTicker(ticker)}
              className="px-2 py-0.5 rounded text-[11px] font-mono text-neutral-400 hover:bg-neutral-800 hover:text-amber-300 border border-transparent hover:border-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {ticker}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
