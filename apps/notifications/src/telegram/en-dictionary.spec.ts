import { NOTIFICATION_EVENT_TYPES } from '@opden-data-layer/notifications-contract';
import {
  buildNotificationMessage,
  GENERIC_NOTIFICATION_KEY,
  renderTelegramBody,
} from '@opden-data-layer/notifications-messages';
import { minimalNotificationEventPayload } from '@opden-data-layer/notifications-messages/testing';
import { TELEGRAM_RECIPIENT_PARAM } from '../constants/telegram.constants';
import { EN_NOTIFICATION_DICTIONARY } from './en-dictionary';

const PLACEHOLDER_RE = /\{[a-zA-Z0-9_]+\}/;
const YOU_RE = /\b(you|your)\b/i;

const baseEnvelope = {
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx',
  objectId: null,
  actor: 'alice',
};

const telegramRecipient = 'flowmaster';

function renderForTelegram(
  event: Parameters<typeof buildNotificationMessage>[0],
): string {
  const message = buildNotificationMessage(event);
  return renderTelegramBody(message, EN_NOTIFICATION_DICTIONARY, {
    extraParams: { [TELEGRAM_RECIPIENT_PARAM]: telegramRecipient },
  });
}

describe('EN_NOTIFICATION_DICTIONARY', () => {
  it('does not use ambiguous you/your wording', () => {
    for (const template of Object.values(EN_NOTIFICATION_DICTIONARY)) {
      expect(template).not.toMatch(YOU_RE);
    }
  });

  it.each(NOTIFICATION_EVENT_TYPES)(
    'covers %s message key with renderable Telegram copy',
    (type) => {
      const event = {
        ...baseEnvelope,
        type,
        payload: minimalNotificationEventPayload(type),
      } as Parameters<typeof buildNotificationMessage>[0];

      const message = buildNotificationMessage(event);
      if (message.key === GENERIC_NOTIFICATION_KEY) {
        expect(EN_NOTIFICATION_DICTIONARY[message.key]).toBeDefined();
        return;
      }

      expect(EN_NOTIFICATION_DICTIONARY[message.key]).toBeDefined();

      const body = renderForTelegram(event);
      expect(body).not.toMatch(PLACEHOLDER_RE);
      expect(body).not.toMatch(YOU_RE);
    },
  );

  it('renders reply and self-comment with explicit recipient account', () => {
    const replyBody = renderForTelegram({
      ...baseEnvelope,
      type: 'reply',
      payload: {
        author: 'w7ngc',
        permlink: 'c1',
        parentAuthor: 'flowmaster',
        parentPermlink: 'p1',
        isRootPost: false,
        isReplyToComment: true,
      },
    });
    expect(replyBody).toBe('w7ngc has replied to flowmaster\'s comment');

    const myCommentBody = renderForTelegram({
      ...baseEnvelope,
      type: 'my_comment',
      actor: 'flowmaster',
      payload: {
        author: 'flowmaster',
        permlink: 'c2',
        parentAuthor: 'w95hj',
      },
    });
    expect(myCommentBody).toBe('flowmaster replied to w95hj');
  });

  it('renders aggregated vote_like copy without leftover placeholders', () => {
    const body = renderForTelegram({
      ...baseEnvelope,
      type: 'vote_like',
      actor: 'alice',
      payload: {
        voter: 'alice',
        author: 'bob',
        permlink: 'funny-ai-skating',
        weight: 10_000,
        title: 'Funny AI-Generated Figure Skating',
        likesCount: 5,
      },
    });
    expect(body).toBe(
      "alice and 5 others liked flowmaster's post Funny AI-Generated Figure Skating",
    );
  });
});
