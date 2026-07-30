# Notifications: батчевая обработка по образцу legacy

## Задачи

- [x] Bulk-методы репозиториев: `findByAccounts` (settings), `findChatIdsByAccounts` (telegram), `findKnownAccounts` (`user_metadata`)
- [x] `DEFAULT_NOTIFICATION_SETTINGS` + гейтинг только для известных пользователей ODL
- [x] Батчевый роутер: bulk-загрузка аудитории, in-memory гейтинг, курсы раз на пачку, `addManyToFeed` и `enqueueMany` одним пайплайном
- [x] Консьюмер отдаёт всю пачку в `routeBatch`, ретраи на уровне пачки
- [x] `drainOwnPending` не блокирует bootstrap, `POSTGRES_POOL_MAX` = 25
- [x] Тесты и документация

## Review

### Корневая причина лага

1. `isAllowedWithSettings` возвращала `true` при отсутствии строки настроек, поэтому консьюмер писал фид и лез в Postgres для **любого** аккаунта Hive из firehose. Legacy (`notificationsHelper.js:93`) возвращал `false` для аккаунтов вне коллекции Waivio.
2. Роутинг шёл по одному событию и по одному получателю: на каждого — отдельные запросы настроек, telegram-подписок и отдельный Redis-пайплайн. Плюс курс USD дёргался на каждый трансфер.

### Что изменилось

- **Гейтинг.** Уведомление получает только зарегистрированный аккаунт ODL: строка в `user_notification_settings` (используется она), либо строка в `user_metadata` / активная `telegram_subscriptions` (применяется `DEFAULT_NOTIFICATION_SETTINGS`, зеркалящий DEFAULT колонок таблицы). Остальные отбрасываются до любого I/O.
- **Батчинг.** `NotificationRouterService.routeBatch` на пачку `XREADGROUP` делает 3 bulk-запроса (`NotificationAudienceService.load`) + максимум 1 запрос курсов, гейтит в памяти (`isAllowed` стал синхронным и без зависимостей), пишет один Redis-пайплайн на фид и один на telegram-очередь.
- **Консьюмер.** Одна пачка → один `routeBatch` → один `XACK` со всеми id. Ретраи на уровне пачки; записи подтверждаются даже при ошибке роутинга, чтобы «отравленная» пачка не вешала стрим. `drainOwnPending` ушёл с критического пути bootstrap.
- **Кэши удалены.** Redis-кэш настроек (вместе с sentinel `__null__` и багом `??`) и `TelegramSubscriptionsCacheService` убраны: bulk-запрос по индексу дешевле N Redis GET и не требует инвалидации. Заодно удалён мёртвый `DEL notifications:cache:settings:*` в chain-indexer.
- `POSTGRES_POOL_MAX` для notifications: 10 → 25 (подстраховка, не фикс).

### Отклонение от плана

План предлагал отдельный `NotificationBatchRouterService` с `NotificationRouterService` как тонкой обёрткой. Сделано в одном классе: `routeBatch` — основной путь, `route(event)` = `routeBatch([event])`. Отдельный класс-форвардер был бы лишней прослойкой.

### Верификация

- `pnpm nx test notifications` — 13 сьютов / 49 тестов, зелёные. Новые проверки: незнакомый аккаунт отбрасывается, известный без строки получает дефолты, telegram-подписчик считается известным, пачка уходит одним `routeBatch`, аудитория грузится один раз, курсы не запрашиваются без transfer-событий.
- `pnpm nx test chain-indexer` (251), `pnpm nx test clients` (13) — зелёные.
- `pnpm typecheck:nest` — 10 проектов, ок. `pnpm nx run notifications:lint` — ок. `pnpm nx build notifications` + `pnpm check:bundle-deps` — ок.
- Предсуществующие ошибки lint в `chain-indexer` (`no-control-regex`, `prefer-const`) не связаны с изменением и не трогались.

### После деплоя проверить

- `XINFO GROUPS chain-indexer:notifications:stream` — `lag` должен упасть до нуля и держаться.
- В логах `Processed N notification events (X/s)` — ожидаем сотни в секунду.
- Трансфер `wiv01` → `flowmaster` приходит в Telegram и на фронт за секунды.
- Регрессия дефолтов: известный юзер без строки `user_notification_settings` уведомления получает.
