import { CircleAlert, LoaderCircle, Sparkles, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MAX_FILE_SIZE_BYTES } from '../constants';
import { formatBytes } from '../utils/csvHelpers';

const hasFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes('Files');

/**
 * Drag-and-drop / click-to-browse CSV picker with a "try sample data" shortcut.
 */
export default function FileUpload({
  onFileSelect,
  onLoadSample,
  isParsing,
  error,
  onDismissError,
  autoFocus = false,
}) {
  const inputRef = useRef(null);
  const zoneRef = useRef(null);
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Return keyboard focus to the drop zone after the user removes a file.
  useEffect(() => {
    if (autoFocus) zoneRef.current?.focus();
  }, [autoFocus]);

  // Stop the browser from opening files dropped outside the drop zone.
  useEffect(() => {
    const preventDefault = (event) => {
      if (hasFiles(event)) event.preventDefault();
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  const openFilePicker = () => {
    if (!isParsing) inputRef.current?.click();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  };

  const handleDragEnter = (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = isParsing ? 'none' : 'copy';
  };

  const handleDragLeave = () => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (isParsing) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    event.target.value = ''; // allow selecting the same file again
  };

  const zoneState = isDragging
    ? 'border-indigo-500 bg-indigo-50/70 ring-4 ring-indigo-500/10 dark:border-indigo-400 dark:bg-indigo-500/10'
    : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500 dark:hover:bg-slate-900/60';

  return (
    <div className="space-y-4">
      <div
        ref={zoneRef}
        role="button"
        tabIndex={isParsing ? -1 : 0}
        aria-label="Upload a CSV file: drag and drop it here, or press Enter to browse"
        aria-describedby="upload-hint"
        aria-busy={isParsing}
        aria-disabled={isParsing}
        onClick={openFilePicker}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`focus-ring group relative flex min-h-[15rem] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200 ${zoneState} ${isParsing ? 'cursor-wait' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleInputChange}
        />

        {isParsing ? (
          <div className="flex flex-col items-center gap-3 animate-fade-in" role="status">
            <LoaderCircle className="h-9 w-9 animate-spin text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Parsing your file…</p>
          </div>
        ) : (
          <>
            <span
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200 ${
                isDragging
                  ? 'scale-110 bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-600 group-hover:scale-105 dark:bg-indigo-500/10 dark:text-indigo-400'
              }`}
            >
              <Upload className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              {isDragging ? 'Drop to upload' : 'Drag & drop your CSV here'}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              or <span className="font-medium text-indigo-600 dark:text-indigo-400">click to browse</span>
            </p>
            <p id="upload-hint" className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Only .csv files · up to {formatBytes(MAX_FILE_SIZE_BYTES)} · processed locally in your browser
            </p>
          </>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-fade-in dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={onDismissError}
            className="focus-ring -m-1 rounded-lg p-1 text-rose-500 transition-colors hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-500/20"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="flex justify-center">
        <button type="button" onClick={onLoadSample} disabled={isParsing} className="btn-secondary">
          <Sparkles className="h-4 w-4 text-indigo-500" aria-hidden="true" />
          Try sample data
        </button>
      </div>
    </div>
  );
}
