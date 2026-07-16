/** OBL catalog object types — keep client-safe (do not import @opden-data-layer/core barrel in client components). */
export const OBL_CATALOG_OBJECT_TYPES = {
  SERVICE_OFFERED: 'service_offered',
  SERVICE_REQUESTED: 'service_requested',
  LEGAL_DOCUMENT: 'legal_document',
} as const;
