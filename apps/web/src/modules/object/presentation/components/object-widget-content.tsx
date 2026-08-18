'use client';

import type { ReactNode } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { ProjectedWidgetConfigView } from '../../domain/object-page.types';
import {
  WIDGET_COLUMN_FORWARD,
  WIDGET_COLUMN_NEW_TAB,
  WIDGET_EMBED_TYPE_WIDGET,
} from '../../domain/widget.constants';

export type ObjectWidgetContentProps = {
  config: ProjectedWidgetConfigView | null;
  /** Optional breadcrumb row above embed (nested `?path=` context). */
  breadcrumbs?: ReactNode;
};

/**
 * Renders widget embed content (legacy `WidgetPage.js` parity).
 *
 * Inline HTML with `<iframe` is injected via `dangerouslySetInnerHTML` without
 * post-body sanitization so embed markup is preserved — same as legacy Waivio.
 */
export function ObjectWidgetContent({ config, breadcrumbs }: ObjectWidgetContentProps) {
  const { t } = useI18n();

  if (!config) {
    return (
      <div className="rounded-card border border-border bg-surface/60 p-card-padding text-body-sm text-muted">
        {breadcrumbs}
        <p className="text-fg">{t('object_widget_empty')}</p>
      </div>
    );
  }

  const isNewTab = config.column === WIDGET_COLUMN_NEW_TAB;
  const isForward = config.column === WIDGET_COLUMN_FORWARD;

  if (isNewTab || isForward) {
    return (
      <div className="rounded-card border border-border bg-surface/60 p-card-padding text-body-sm text-muted">
        {breadcrumbs}
        <p className="text-fg">
          {isNewTab ? t('object_widget_opens_new_tab') : t('object_widget_opens_same_tab')}{' '}
          <a
            href={config.content}
            target={isNewTab ? '_blank' : '_self'}
            rel={isNewTab ? 'noopener noreferrer' : undefined}
            className="text-link underline"
          >
            {t('object_widget_continue_link')}
          </a>
        </p>
      </div>
    );
  }

  const hasInlineIframe = config.content.includes('<iframe');

  if (hasInlineIframe) {
    return (
      <div className="min-h-[60vh] w-full">
        {breadcrumbs}
        <div
          className="w-full [&_iframe]:min-h-[60vh] [&_iframe]:w-full [&_iframe]:border-0"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: config.content }}
        />
      </div>
    );
  }

  if (config.type === WIDGET_EMBED_TYPE_WIDGET) {
    return (
      <div className="min-h-[60vh] w-full">
        {breadcrumbs}
        <iframe
          srcDoc={config.content}
          title={config.title ?? 'Widget'}
          className="min-h-[60vh] w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] w-full">
      {breadcrumbs}
      <iframe
        src={config.content}
        title={config.title ?? 'Widget'}
        className="min-h-[60vh] w-full border-0"
        allowFullScreen
      />
    </div>
  );
}
