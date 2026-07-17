'use client';

import { useState, type FormEvent } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M3.4 20.4 21 12 3.4 3.6 3 10.2l10.6 1.8L3 13.8z" />
    </svg>
  );
}

/**
 * Visual stub for a future agent chat composer. No network / submit side effects.
 */
export function HomeAgentComposerStub() {
  const { t } = useI18n();
  const [value, setValue] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form
      className="w-full max-w-container-content"
      aria-label={t('home_agent_composer_aria')}
      onSubmit={onSubmit}
    >
      <div className="flex items-center gap-2 rounded-pill border border-border bg-surface-control px-3 py-2 shadow-card">
        <button
          type="button"
          disabled
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill text-fg-secondary disabled:opacity-60"
          aria-label={t('home_agent_composer_attach_aria')}
        >
          <PlusIcon />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('home_agent_composer_placeholder')}
          className="min-w-0 flex-1 border-0 bg-transparent text-body text-fg outline-none placeholder:text-fg-tertiary"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-fg text-bg disabled:opacity-40"
          aria-label={t('home_agent_composer_send_aria')}
        >
          <SendIcon />
        </button>
      </div>
    </form>
  );
}
