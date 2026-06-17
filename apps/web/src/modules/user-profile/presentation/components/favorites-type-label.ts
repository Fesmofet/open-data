function formatFavoritesTypeLabel(type: string): string {
  return type
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export { formatFavoritesTypeLabel };
