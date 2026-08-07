import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectViewService } from '@opden-data-layer/objects-domain';
import {
  AggregatedObjectRepository,
  ObjectAuthorityRepository,
  ObjectFieldReferencesRepository,
  ObjectsCoreRepository,
} from '../../repositories';
import { GovernanceResolverService } from '../governance';
import { expandObjectRefs } from '../object-projection/object-ref-expansion';
import { ListItemsRecursiveCountService } from '../object-projection/list-items-recursive-count.service';
import type { RefSummary } from '../object-projection/projected-object.types';
import {
  getFieldReferenceRule,
  isAllowedFieldReferenceObjectType,
  isFieldReferenceSourceType,
} from './object-field-reference-rules';
import type {
  ObjectFieldReferencesByTypeQuery,
  ObjectFieldReferencesByTypeResponseDto,
  ObjectFieldReferencesSummaryQuery,
  ObjectFieldReferencesSummaryResponseDto,
} from './schemas/object-field-references.schema';

export class ObjectFieldReferenceSourceError extends UnprocessableEntityException {
  constructor(message: string) {
    super(message);
  }
}

@Injectable()
export class GetObjectFieldReferencesSummaryEndpoint {
  constructor(
    private readonly objectsCore: ObjectsCoreRepository,
    private readonly aggregatedObjectRepo: AggregatedObjectRepository,
    private readonly objectViewService: ObjectViewService,
    private readonly governanceResolver: GovernanceResolverService,
    private readonly objectAuthorityRepo: ObjectAuthorityRepository,
    private readonly listItemsRecursiveCountService: ListItemsRecursiveCountService,
    private readonly fieldReferencesRepo: ObjectFieldReferencesRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(
    objectId: string,
    query: ObjectFieldReferencesSummaryQuery,
    locale: string,
    governanceObjectIdFromHeader?: string,
    viewerAccount?: string,
  ): Promise<ObjectFieldReferencesSummaryResponseDto | null> {
    const source = await this.loadSourceContext(objectId);
    if (!source) {
      return null;
    }

    const groups = await Promise.all(
      source.rule.referenceObjectTypes.map(async (referenceObjectType) => {
        const page = await this.loadReferencePage({
          sourceObjectId: source.id,
          sourceObjectType: source.objectType,
          referenceObjectType,
          updateTypes: source.rule.updateTypes,
          skip: 0,
          limit: query.limit,
          locale,
          governanceObjectIdFromHeader,
          viewerAccount,
        });
        if (page.items.length === 0) {
          return null;
        }
        return {
          objectType: referenceObjectType,
          items: page.items,
          hasMore: page.hasMore,
        };
      }),
    );

    return {
      groups: groups.filter((group): group is NonNullable<typeof group> => group != null),
    };
  }

  protected async loadSourceContext(objectId: string): Promise<{
    id: string;
    objectType: string;
    rule: NonNullable<ReturnType<typeof getFieldReferenceRule>>;
  } | null> {
    const id = objectId.trim();
    if (id.length === 0) {
      return null;
    }

    const core = await this.objectsCore.findByObjectIdForPage(id);
    if (!core) {
      return null;
    }

    if (!isFieldReferenceSourceType(core.object_type)) {
      throw new ObjectFieldReferenceSourceError(
        `Object type "${core.object_type}" does not support field references`,
      );
    }

    const rule = getFieldReferenceRule(core.object_type);
    if (!rule) {
      throw new ObjectFieldReferenceSourceError(
        `Object type "${core.object_type}" does not support field references`,
      );
    }

    return { id, objectType: core.object_type, rule };
  }

  protected async loadReferencePage(params: {
    sourceObjectId: string;
    sourceObjectType: string;
    referenceObjectType: string;
    updateTypes: readonly string[];
    skip: number;
    limit: number;
    locale: string;
    governanceObjectIdFromHeader?: string;
    viewerAccount?: string;
  }): Promise<ObjectFieldReferencesByTypeResponseDto> {
    if (
      !isAllowedFieldReferenceObjectType(params.sourceObjectType, params.referenceObjectType)
    ) {
      throw new ObjectFieldReferenceSourceError(
        `Reference object type "${params.referenceObjectType}" is not allowed for source type "${params.sourceObjectType}"`,
      );
    }

    const pageIds = await this.fieldReferencesRepo.findReferencingObjectIds({
      sourceObjectId: params.sourceObjectId,
      referenceObjectType: params.referenceObjectType,
      updateTypes: params.updateTypes,
      skip: params.skip,
      limit: params.limit,
    });

    const trimmed = pageIds.slice(0, params.limit);
    const hasMore = pageIds.length > params.limit;
    const nextCursor = hasMore ? String(params.skip + trimmed.length) : null;

    if (trimmed.length === 0) {
      return { items: [], hasMore: false, cursor: null };
    }

    const governance = await this.governanceResolver.resolveMergedForObjectView(
      params.governanceObjectIdFromHeader,
    );

    const viewer = params.viewerAccount?.trim() || undefined;
    let viewerAdminIds: Set<string> | undefined;
    if (viewer) {
      const refAdminIds = await this.objectAuthorityRepo.findAdministrativeObjectIdsForAccount(
        viewer,
        trimmed,
      );
      viewerAdminIds = new Set(refAdminIds);
    }

    const contentBaseUrl = this.config.get<string | undefined>('ipfs.contentBaseUrl');
    const refSummariesById = await expandObjectRefs(trimmed, {
      aggregatedObjectRepo: this.aggregatedObjectRepo,
      objectViewService: this.objectViewService,
      listItemsRecursiveCountService: this.listItemsRecursiveCountService,
      parentObjectId: params.sourceObjectId,
      governance,
      locale: params.locale,
      contentBaseUrl,
      viewerAccount: viewer,
      viewerAdminIds,
    });

    const items: RefSummary[] = [];
    for (const refId of trimmed) {
      const summary = refSummariesById.get(refId);
      if (summary) {
        items.push(summary);
      }
    }

    return { items, hasMore, cursor: nextCursor };
  }
}

@Injectable()
export class GetObjectFieldReferencesByTypeEndpoint extends GetObjectFieldReferencesSummaryEndpoint {
  async executeByType(
    objectId: string,
    referenceObjectType: string,
    query: ObjectFieldReferencesByTypeQuery,
    locale: string,
    governanceObjectIdFromHeader?: string,
    viewerAccount?: string,
  ): Promise<ObjectFieldReferencesByTypeResponseDto | null> {
    const source = await this.loadSourceContext(objectId);
    if (!source) {
      return null;
    }

    const skip = Number.parseInt(query.cursor?.trim() ?? '0', 10);
    const safeSkip = Number.isFinite(skip) && skip >= 0 ? skip : 0;

    return this.loadReferencePage({
      sourceObjectId: source.id,
      sourceObjectType: source.objectType,
      referenceObjectType: referenceObjectType.trim(),
      updateTypes: source.rule.updateTypes,
      skip: safeSkip,
      limit: query.limit,
      locale,
      governanceObjectIdFromHeader,
      viewerAccount,
    });
  }
}
