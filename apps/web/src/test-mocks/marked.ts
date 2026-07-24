const marked = {
  parse: (input: string) => `<p>${input}</p>`,
  use: () => marked,
  setOptions: () => marked,
  options: {},
  defaults: {},
};

export { marked };
export default marked;
