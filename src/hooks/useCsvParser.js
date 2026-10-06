import { useCallback, useRef, useState } from 'react';
import { PARSE_STATUS, SAMPLE_DATA_URL, SAMPLE_FILE_NAME } from '../constants';
import { buildDataset, CsvParseError, parseCsvSource, validateCsvFile } from '../utils/csvHelpers';

const INITIAL_STATE = { status: PARSE_STATUS.IDLE, dataset: null, error: null };
const GENERIC_ERROR = 'Something went wrong while reading the file. Please try again.';

/**
 * Parses CSV files (or the bundled sample) into a normalised dataset.
 * Stale results from an earlier request are ignored if a newer one was started.
 * @returns {{
 *   status: string,
 *   dataset: null | {id:number,fileName:string,fileSize:number,columns:object[],rows:object[],malformedCount:number},
 *   error: string|null,
 *   parseFile: (file: File) => void,
 *   loadSample: () => void,
 *   reset: () => void,
 *   clearError: () => void,
 * }}
 */
export function useCsvParser() {
  const [state, setState] = useState(INITIAL_STATE);
  const requestIdRef = useRef(0);

  const run = useCallback(async (loadSource) => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setState((prev) => ({ ...prev, status: PARSE_STATUS.PARSING, error: null }));

    try {
      const { rawRows, fileName, fileSize } = await loadSource();
      const { columns, rows, malformedCount } = buildDataset(rawRows);
      if (requestId !== requestIdRef.current) return;

      setState({
        status: PARSE_STATUS.READY,
        error: null,
        dataset: { id: requestId, fileName, fileSize, columns, rows, malformedCount },
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setState({
        status: PARSE_STATUS.ERROR,
        dataset: null,
        error: error instanceof CsvParseError ? error.message : GENERIC_ERROR,
      });
    }
  }, []);

  const parseFile = useCallback(
    (file) => {
      if (!file) return;
      const validationError = validateCsvFile(file);
      if (validationError) {
        requestIdRef.current += 1;
        setState({ status: PARSE_STATUS.ERROR, dataset: null, error: validationError });
        return;
      }
      run(async () => ({
        rawRows: await parseCsvSource(file),
        fileName: file.name,
        fileSize: file.size,
      }));
    },
    [run],
  );

  const loadSample = useCallback(() => {
    run(async () => {
      const response = await fetch(SAMPLE_DATA_URL);
      if (!response.ok) throw new CsvParseError('The sample data could not be loaded. Please try again.');
      const text = await response.text();
      return {
        rawRows: await parseCsvSource(text),
        fileName: SAMPLE_FILE_NAME,
        fileSize: new Blob([text]).size,
      };
    });
  }, [run]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setState(INITIAL_STATE);
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      status: prev.dataset ? PARSE_STATUS.READY : PARSE_STATUS.IDLE,
    }));
  }, []);

  return { ...state, parseFile, loadSample, reset, clearError };
}
