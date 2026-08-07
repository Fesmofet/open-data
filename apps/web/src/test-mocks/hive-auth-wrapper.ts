const HAS = {
  setOptions: () => undefined,
  status: () => ({ host: '', connected: false, timeout: 0 }),
  connect: async () => true,
  authenticate: async () => undefined,
  broadcast: async () => undefined,
  challenge: async () => undefined,
};

export default HAS;
