'use client';

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type UseHorizontalTabOverflowOptions = {
  tabCount: number;
};

export type UseHorizontalTabOverflowResult = {
  rowRef: (node: HTMLDivElement | null) => void;
  setTabRef: (index: number, node: HTMLButtonElement | null) => void;
  overflowIndices: number[];
  hasOverflow: boolean;
  hasMeasured: boolean;
};

function indicesEqual(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function useHorizontalTabOverflow(
  options: UseHorizontalTabOverflowOptions,
): UseHorizontalTabOverflowResult {
  const { tabCount } = options;

  const rowNodeRef = useRef<HTMLDivElement | null>(null);
  const tabNodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [overflowIndices, setOverflowIndices] = useState<number[]>([]);
  const [hasMeasured, setHasMeasured] = useState(false);

  const measure = useCallback(() => {
    const row = rowNodeRef.current;
    if (!row || tabCount === 0) {
      return;
    }

    const firstTab = tabNodeRefs.current[0];
    if (!firstTab || firstTab.offsetHeight === 0) {
      return;
    }

    const firstLineTop = firstTab.offsetTop;
    const nextOverflow: number[] = [];

    for (let index = 0; index < tabCount; index++) {
      const tab = tabNodeRefs.current[index];
      if (!tab) {
        continue;
      }
      if (tab.offsetTop > firstLineTop) {
        nextOverflow.push(index);
      }
    }

    setOverflowIndices((prev) => (indicesEqual(prev, nextOverflow) ? prev : nextOverflow));
    setHasMeasured(true);
  }, [tabCount]);

  useLayoutEffect(() => {
    tabNodeRefs.current.length = tabCount;
    setHasMeasured(false);
    setOverflowIndices([]);
    measure();
  }, [measure, tabCount]);

  useLayoutEffect(() => {
    const row = rowNodeRef.current;
    if (!row) {
      return;
    }

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(row);
    return () => {
      observer.disconnect();
    };
  }, [measure]);

  const overflowSet = useMemo(() => new Set(overflowIndices), [overflowIndices]);

  const rowRef = useCallback((node: HTMLDivElement | null) => {
    rowNodeRef.current = node;
  }, []);

  const setTabRef = useCallback((index: number, node: HTMLButtonElement | null) => {
    tabNodeRefs.current[index] = node;
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  return {
    rowRef,
    setTabRef,
    overflowIndices,
    hasOverflow: overflowSet.size > 0,
    hasMeasured,
  };
}
