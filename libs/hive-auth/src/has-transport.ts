import WebSocket from 'ws';

export type HasTransport = {
  readonly readyState: number;
  send(data: string): void;
  close(): void;
  onMessage(handler: (data: string) => void): void;
  onOpen(handler: () => void): void;
  onClose(handler: () => void): void;
};

export type HasTransportFactory = (url: string) => HasTransport;

export function createWsTransportFactory(): HasTransportFactory {
  return (url: string): HasTransport => {
    const ws = new WebSocket(url);
    let messageHandler: ((data: string) => void) | null = null;
    let openHandler: (() => void) | null = null;
    let closeHandler: (() => void) | null = null;

    ws.on('open', () => {
      openHandler?.();
    });
    ws.on('message', (data) => {
      messageHandler?.(data.toString());
    });
    ws.on('close', () => {
      closeHandler?.();
    });

    return {
      get readyState() {
        return ws.readyState;
      },
      send: (data: string) => {
        ws.send(data);
      },
      close: () => {
        ws.close();
      },
      onMessage: (handler) => {
        messageHandler = handler;
      },
      onOpen: (handler) => {
        openHandler = handler;
        if (ws.readyState === WebSocket.OPEN) {
          handler();
        }
      },
      onClose: (handler) => {
        closeHandler = handler;
      },
    };
  };
}
