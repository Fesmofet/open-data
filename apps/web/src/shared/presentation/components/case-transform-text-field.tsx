'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { Z_INDEX_DROPDOWN_ABOVE_MODAL } from '@/modules/map';
import {
  applyCaseTransform,
  type CaseTransformMode,
} from '@/shared/domain/case-transform';

const DROPDOWN_GAP_PX = 4;
const MENU_MIN_WIDTH_PX = 200;

const CASE_TRANSFORM_ITEMS: ReadonlyArray<{
  mode: CaseTransformMode;
  label: string;
}> = [
  { mode: 'sentence', label: 'Sentence case.' },
  { mode: 'lower', label: 'lowercase' },
  { mode: 'upper', label: 'UPPERCASE' },
  { mode: 'title', label: 'Capitalize Each Word' },
  { mode: 'toggle', label: 'tOGGLE cASE' },
];

type DropdownRect = {
  top: number;
  right: number;
  minWidth: number;
};

function measureMenuRect(button: HTMLButtonElement): DropdownRect {
  const rect = button.getBoundingClientRect();
  return {
    top: rect.bottom + DROPDOWN_GAP_PX,
    right: rect.right,
    minWidth: Math.max(MENU_MIN_WIDTH_PX, rect.width + 120),
  };
}

function focusInputAtEnd(input: HTMLInputElement, length: number): void {
  input.focus();
  input.setSelectionRange(length, length);
}

export type CaseTransformTextFieldProps = {
  value: string;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
  id?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  placeholder?: string;
  type?: 'text' | 'email' | 'url';
  autoComplete?: string;
  label?: ReactNode;
  className?: string;
  inputClassName?: string;
};

export function CaseTransformTextField({
  value,
  onChange,
  disabled = false,
  id: idProp,
  inputRef: inputRefProp,
  placeholder,
  type = 'text',
  autoComplete,
  label,
  className,
  inputClassName,
}: CaseTransformTextFieldProps) {
  const { t } = useI18n();
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const menuId = `${inputId}-case-menu`;
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = inputRefProp ?? internalInputRef;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setDropdownRect(null);
      return;
    }
    setDropdownRect(measureMenuRect(buttonRef.current));
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) {
        return;
      }
      if (menuRef.current?.contains(target)) {
        return;
      }
      if (inputRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [inputRef, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [inputRef, open]);

  const handleSelect = (mode: CaseTransformMode) => {
    const next = applyCaseTransform(value, mode);
    onChange(next);
    setOpen(false);
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (input) {
        focusInputAtEnd(input, next.length);
      }
    });
  };

  const buttonClassName = [
    'inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-body-sm transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
    open
      ? 'border-accent text-accent'
      : 'border-transparent text-muted hover:border-accent hover:text-accent',
    disabled ? 'pointer-events-none opacity-50' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const dropdown =
    open && dropdownRect && portalReady
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={t('case_transform_aria')}
            className="rounded-btn border border-border bg-bg py-1 shadow-card"
            style={{
              position: 'fixed',
              top: dropdownRect.top,
              right: window.innerWidth - dropdownRect.right,
              minWidth: dropdownRect.minWidth,
              zIndex: Z_INDEX_DROPDOWN_ABOVE_MODAL,
            }}
          >
            {CASE_TRANSFORM_ITEMS.map((item) => (
              <button
                key={item.mode}
                type="button"
                role="menuitem"
                className="block w-full px-3 py-1.5 text-left text-body-sm text-fg hover:bg-ghost-surface"
                onClick={() => handleSelect(item.mode)}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <label className={['block text-body-sm', className].filter(Boolean).join(' ')} htmlFor={inputId}>
      {label}
      <div className="relative mt-2">
        <input
          ref={inputRef}
          id={inputId}
          type={type}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          className={[
            'w-full rounded-btn border border-border bg-bg py-2 pe-11 ps-3 text-body-sm text-fg',
            inputClassName,
          ]
            .filter(Boolean)
            .join(' ')}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-1.5">
          <button
            ref={buttonRef}
            type="button"
            disabled={disabled}
            className={`pointer-events-auto ${buttonClassName}`}
            aria-label={t('case_transform_aria')}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault();
              setOpen((prev) => !prev);
            }}
          >
            <span aria-hidden="true">Aa</span>
            <span aria-hidden="true" className="text-[10px] leading-none">
              ▾
            </span>
          </button>
        </div>
      </div>
      {dropdown}
    </label>
  );
}
