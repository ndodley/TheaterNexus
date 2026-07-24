import { useState } from 'react'
import type { ReactNode, KeyboardEvent } from 'react'
import './AdvancedSearchPanel.css'

/**
 * Shared "advanced search" panel used by Movies, Favorites, Showtimes,
 * TheaterShowtimes, and Theaters. Renders the search input + Filter/Search
 * toolbar, and (when the Filter toggle is open) a filters grid containing
 * whatever <AdvancedSearchBlock> children the page passes in.
 *
 * The panel owns its own open/closed state, matching the previous
 * per-page `showAdvanced`/`advOpen` state (which was never read anywhere
 * else on any of those pages).
 */
export interface AdvancedSearchPanelProps {
  /** Current value of the search text input. */
  searchValue: string
  /** Called with the new value whenever the search text input changes. */
  onSearchChange: (value: string) => void
  /** Called when the Search button is clicked. Optional (Theaters has nothing to fetch). */
  onSearch?: () => void
  /** Called when Enter is pressed in the search input. Omit to leave Enter a no-op. */
  onEnter?: () => void
  /** Placeholder text for the search input. */
  placeholder?: string
  /** Use the tighter 12px bottom margin variant (Showtimes, TheaterShowtimes, Theaters). */
  gapped?: boolean
  /** <AdvancedSearchBlock> elements to render inside the filters grid. */
  children?: ReactNode
}

export default function AdvancedSearchPanel({
  searchValue,
  onSearchChange,
  onSearch,
  onEnter,
  placeholder,
  gapped = false,
  children,
}: AdvancedSearchPanelProps) {
  const [open, setOpen] = useState(false)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onEnter?.()
  }

  return (
    <div className={`card adv-search-section${gapped ? ' adv-search-section--gapped' : ''}`}>
      <div className="adv-search">
        <div className="adv-toolbar">
          <div className="adv-input">
            <span className="icon">🔎</span>
            <input
              type="text"
              placeholder={placeholder}
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button className="btn btn-ghost" onClick={() => setOpen(o => !o)} aria-expanded={open}>Filter</button>
          <button className="btn btn-primary" onClick={onSearch}>Search</button>
        </div>

        {open && (
          <div className="adv-grid">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export interface AdvancedSearchBlockProps {
  /** Header label for this collapsible filter block (e.g. "Sort", "Tags"). */
  label: string
  children: ReactNode
}

/** A single collapsible block inside the advanced search filters grid. */
export function AdvancedSearchBlock({ label, children }: AdvancedSearchBlockProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="adv-block">
      <div className="adv-block-header" onClick={() => setOpen(o => !o)}>
        <span>{label}</span><span className="caret">▾</span>
      </div>
      {open && (
        <div className="adv-block-body">
          {children}
        </div>
      )}
    </div>
  )
}
