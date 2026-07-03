export { ExpertiseModule } from './expertise.module';
export { GetUserExpertiseCountersEndpoint } from './get-user-expertise-counters.endpoint';
export { GetUserExpertiseObjectsEndpoint } from './get-user-expertise-objects.endpoint';
export {
  userExpertiseObjectsQuerySchema,
  type UserExpertiseObjectsQuery,
  type UserExpertiseCountersResponse,
} from './expertise.schema';
export type {
  ExpertiseProjectedObject,
  PaginatedExpertiseObjects,
} from './paginated-expertise-objects.types';
