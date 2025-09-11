// import React, { useState, useEffect } from "react";
// import { Search } from "lucide-react";

// type SearchBarProps = {
//   placeholder?: string;
//   onSearch: (query: string) => void;
//   delay?: number; // debounce delay
// };

// const SearchBar: React.FC<SearchBarProps> = ({
//   placeholder = "Search...",
//   onSearch,
//   delay = 400,
// }) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [debounced, setDebounced] = useState(searchTerm);

//   // Debounce logic
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebounced(searchTerm);
//     }, delay);

//     return () => clearTimeout(timer);
//   }, [searchTerm, delay]);

//   useEffect(() => {
//     onSearch(debounced.trim());
//   }, [debounced, onSearch]);

//   return (
//     <div className="flex items-center w-full max-w-sm rounded-2xl border px-4 py-2 shadow-sm bg-white focus-within:ring-2 ring-blue-500">
//       <Search className="w-5 h-5 text-gray-500" />
//       <input
//         type="text"
//         className="ml-3 w-full outline-none text-sm"
//         placeholder={placeholder}
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//       />
//     </div>
//   );
// };

// export default SearchBar;
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

const SearchBar = ({ placeholder = "Search...", onSearch, className = "" }: SearchBarProps) => {
  const [inputValue, setInputValue] = useState("");

  // Call onSearch whenever inputValue changes (auto-search as user types)
  useEffect(() => {
    onSearch(inputValue);
  }, [inputValue, onSearch]);

  const handleClear = () => {
    setInputValue("");
    // onSearch("") will be called automatically via useEffect
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;