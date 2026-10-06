# CSV Viewer

Upload a CSV file and explore it in a fast, filterable, sortable table — entirely in your browser.

## Features

- **CSV upload**: drag and drop or click to browse. Only `.csv` files are accepted (max 50 MB), and invalid files get clear error messages.
- **File summary**: shows the name, size, row count and column count, plus an "Upload new file" reset button.
- **Robust parsing**: handles empty files, header-only files, malformed rows (padded or trimmed to the header width and reported), duplicate or blank headers (`Name`, `Name (2)`, `Column 4`), BOM characters, extra whitespace, quoted fields and multi-line cells.
- **Data table**: columns come from the headers. It has a sticky header, horizontal and vertical scrolling, zebra rows, hover highlight, and truncated cells that show the full value in a tooltip.
- **Smart sorting**: click a header to cycle asc → desc → none. Numbers sort numerically, dates chronologically and text naturally. Empty values always go last.
- **Pagination**: 10 / 25 / 50 / 100 rows per page, page numbers with ellipsis, prev/next, and "Showing X–Y of Z".
- **Global search**: searches every column, debounced by 300 ms.
- **Column filters**: add as many rules as you like (column + operator + value). Rules combine with AND.
  - Text: contains, equals, starts with, ends with (case-insensitive)
  - Number (auto-detected): `=`, `>`, `<`, `>=`, `<=`, between
- **Active filter chips**: each can be removed on its own, and "Clear all filters" resets everything. A live result count shows "Showing 42 of 1,200 rows".
- **Column visibility toggle**: show or hide columns.
- **Export**: download the filtered and sorted rows (visible columns only) as a CSV file.
- **Dark/light mode**: saved in `localStorage`, with no flash on load.
- **Try sample data**: loads a built-in 50-row employee dataset.
- **Responsive and accessible**: works on mobile, tablet and desktop. Labelled controls, `aria-sort`, `aria-expanded`, a keyboard-operable drop zone, visible focus rings, and support for reduced-motion settings.

## Tech stack

- [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) (JavaScript)
- [Tailwind CSS v3](https://tailwindcss.com/) with PostCSS + Autoprefixer
- [PapaParse](https://www.papaparse.com/) for CSV parsing and export
- [lucide-react](https://lucide.dev/) for icons

## Folder structure

```
csv-viewer/
├── public/
│   └── sample_data.csv
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── FileUpload.jsx
│   │   ├── FileInfo.jsx
│   │   ├── SearchBar.jsx
│   │   ├── FilterPanel.jsx
│   │   ├── FilterChips.jsx
│   │   ├── ColumnToggle.jsx
│   │   ├── DataTable.jsx
│   │   ├── Pagination.jsx
│   │   ├── EmptyState.jsx
│   │   └── ThemeToggle.jsx
│   ├── hooks/
│   │   ├── useCsvParser.js
│   │   ├── useFilters.js
│   │   ├── useDebounce.js
│   │   └── useTheme.js
│   ├── utils/
│   │   ├── csvHelpers.js
│   │   └── filterHelpers.js
│   ├── constants/
│   │   └── index.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── .gitignore
└── README.md
```

## Getting started

Requires Node.js 18+.

```bash
npm install       # install dependencies
npm run dev       # start the dev server at http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Screenshots

> Add screenshots here.

| Empty state | Data with filters | Dark mode | Mobile |
| ----------- | ----------------- | --------- | ------ |
| _screenshot_ | _screenshot_     | _screenshot_ | _screenshot_ |

## Design decisions

- **Logic lives in hooks and utils; components only render.** `useCsvParser` turns a file into a normalised dataset. `useFilters` owns all view state (search, rules, sort, pagination, column visibility). The pure helpers in `utils/` hold parsing, type detection, operators and export, so they are easy to test.
- **Rows are arrays indexed by column position**, not objects keyed by header name. Duplicate or blank headers therefore can't collide, and every column stays addressable.
- **Type detection samples up to 1,000 values per column.** A column counts as numeric or date only if every non-empty sampled value parses (common null tokens like `N/A` are ignored). Number parsing understands `1,200`, `$45`, `12%` and `(300)`.
- **Performance for 10k+ rows.** Each row's search text is built once, lower-cased. Filter rules are compiled into predicates once per change, then the app filters, sorts and paginates in memoised steps. Only the current page is rendered.
- **Incomplete rules are ignored** instead of hiding every row. A half-typed "between" doesn't empty the table.
- **View state resets when a new file loads**, using React's "adjust state when a prop changes" pattern rather than effects. Clearing the search applies instantly; only typing is debounced.
- **Safe export.** The file starts with a UTF-8 BOM so Excel reads it correctly, and formulas are escaped to prevent CSV injection.
- **Visual language.** One indigo accent, Inter, rounded-xl/2xl surfaces, soft shadows and subtle borders. Shared `.btn`, `.input` and `.card` classes in `index.css` keep spacing and states consistent.
# csv-viewer
