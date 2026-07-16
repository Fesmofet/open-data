import { UPDATE_TYPES } from '../../update-registry/update-types';
import { OBJECT_TYPES } from '../object-types';
import { ObjectTypeDefinition } from '../types';

/** Single-writer legal text; edits restricted by LegalDocumentWriteGuard. */
export const LEGAL_DOCUMENT_OBJECT_TYPE: ObjectTypeDefinition = {
  object_type: OBJECT_TYPES.LEGAL_DOCUMENT,
  description: 'Legal document body referenced by OBL offers (single-writer).',
  supported_updates: [
    UPDATE_TYPES.STATUS,
    UPDATE_TYPES.NAME,
    UPDATE_TYPES.TITLE,
    UPDATE_TYPES.DESCRIPTION,
    UPDATE_TYPES.LEGAL_TEXT,
  ],
  supposed_updates: [],
};
