import { UPDATE_TYPES } from '../../update-registry/update-types';
import { OBJECT_TYPES } from '../object-types';
import { ObjectTypeDefinition } from '../types';

export const SKILL_OBJECT_TYPE: ObjectTypeDefinition = {
  object_type: OBJECT_TYPES.SKILL,
  description: 'Agent skill with markdown body and skill metadata.',
  supported_updates: [
    UPDATE_TYPES.STATUS,
    UPDATE_TYPES.IMAGE,
    UPDATE_TYPES.NAME,
    UPDATE_TYPES.TITLE,
    UPDATE_TYPES.IMAGE_BACKGROUND,
    UPDATE_TYPES.PARENT,
    UPDATE_TYPES.TAG_CATEGORY,
    UPDATE_TYPES.TAG_CATEGORY_ITEM,
    UPDATE_TYPES.IMAGE_GALLERY,
    UPDATE_TYPES.IMAGE_GALLERY_ITEM,
    UPDATE_TYPES.WEBSITE,
    UPDATE_TYPES.DESCRIPTION,
    UPDATE_TYPES.PIN,
    UPDATE_TYPES.REMOVE,
    UPDATE_TYPES.DELEGATION,
    UPDATE_TYPES.PROMOTION,
    UPDATE_TYPES.LICENSE,
    UPDATE_TYPES.COMPATIBILITY,
    UPDATE_TYPES.METADATA,
    UPDATE_TYPES.ALLOWED_TOOLS,
    UPDATE_TYPES.REFERENCES,
    UPDATE_TYPES.SKILL_CONTENT,
  ],
  supposed_updates: [],
};
