import React from 'react';
import { PostCategory } from '../../backend';
import { Input } from '@/components/ui/input';
import { Search, User, X } from 'lucide-react';

interface PostFiltersProps {
  activeCategory: PostCategory | null;
  onCategoryChange: (cat: PostCategory | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showMyPosts: boolean;
  onMyPostsToggle: () => void;
}

const CATEGORIES: { value: PostCategory | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: PostCategory.announcements, label: 'Announcements' },
  { value: PostCategory.general, label: 'General' },
  { value: PostCategory.fun, label: 'Fun' },
  { value: PostCategory.requirements, label: 'Requirements' },
];

export default function PostFilters({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  showMyPosts,
  onMyPostsToggle,
}: PostFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={String(cat.value)}
            onClick={() => onCategoryChange(cat.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeCategory === cat.value && !showMyPosts
                ? 'bg-accent text-accent-foreground shadow-glow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
        <button
          onClick={onMyPostsToggle}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            showMyPosts
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <User size={11} />
          My Posts
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by member name..."
          className="pl-9 h-9 text-sm rounded-lg"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
