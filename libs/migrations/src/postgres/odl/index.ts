import * as m00001 from './00001_odl_schema';
import * as m00002 from './00002_scheduler';
import * as m00003 from './00003_site_canonical';
import * as m00004 from './00004_rank_votes_rank_range';
import * as m00005 from './00005_object_categories';
import * as m00006 from './00006_user_metadata_shop_fields';
import * as m00007 from './00007_user_object_powers';
import * as m00008 from './00008_object_updates_rank_score';
import * as m00009 from './00009_subscription_follow_timestamps';
import * as m00010 from './00010_currency_tables';
import * as m00011 from './00011_object_status';
import * as m00012 from './00012_object_authority_created_at';
import * as m00013 from './00013_discover_indexes';
import * as m00014 from './00014_object_tag_categories';
import * as m00015 from './00015_object_tag_category_items_object_type';
import * as m00016 from './00016_waiv_power_history';
import * as m00017 from './00017_objects_core_created_at';
import * as m00018 from './00018_knowledge_tables';
import * as m00019 from './00019_knowledge_files_description';
import * as m00020 from './00020_knowledge_search_hybrid';
import * as m00021 from './00021_posts_rewards_finalized_at';
import * as m00022 from './00022_post_object_related_images';
import * as m00023 from './00023_user_metadata_hide_favorite_objects';
import * as m00024 from './00024_post_objects_author_index';
import * as m00025 from './00025_user_delegations';
import * as m00026 from './00026_wallet_exemptions';
import type { Migration } from 'kysely';

/** Ordered migrations for OdlMigrationProvider. Schema matches @opden-data-layer/core OdlDatabase and docs/spec/data-model/schema.sql */
export const MIGRATIONS: Record<string, Migration> = {
  '00001_odl_schema': { up: m00001.up, down: m00001.down },
  '00002_scheduler': { up: m00002.up, down: m00002.down },
  '00003_site_canonical': { up: m00003.up, down: m00003.down },
  '00004_rank_votes_rank_range': { up: m00004.up, down: m00004.down },
  '00005_object_categories': { up: m00005.up, down: m00005.down },
  '00006_user_metadata_shop_fields': { up: m00006.up, down: m00006.down },
  '00007_user_object_powers': { up: m00007.up, down: m00007.down },
  '00008_object_updates_rank_score': { up: m00008.up, down: m00008.down },
  '00009_subscription_follow_timestamps': { up: m00009.up, down: m00009.down },
  '00010_currency_tables': { up: m00010.up, down: m00010.down },
  '00011_object_status': { up: m00011.up, down: m00011.down },
  '00012_object_authority_created_at': { up: m00012.up, down: m00012.down },
  '00013_discover_indexes': { up: m00013.up, down: m00013.down },
  '00014_object_tag_categories': { up: m00014.up, down: m00014.down },
  '00015_object_tag_category_items_object_type': {
    up: m00015.up,
    down: m00015.down,
  },
  '00016_waiv_power_history': { up: m00016.up, down: m00016.down },
  '00017_objects_core_created_at': { up: m00017.up, down: m00017.down },
  '00018_knowledge_tables': { up: m00018.up, down: m00018.down },
  '00019_knowledge_files_description': { up: m00019.up, down: m00019.down },
  '00020_knowledge_search_hybrid': { up: m00020.up, down: m00020.down },
  '00021_posts_rewards_finalized_at': { up: m00021.up, down: m00021.down },
  '00022_post_object_related_images': { up: m00022.up, down: m00022.down },
  '00023_user_metadata_hide_favorite_objects': { up: m00023.up, down: m00023.down },
  '00024_post_objects_author_index': { up: m00024.up, down: m00024.down },
  '00025_user_delegations': { up: m00025.up, down: m00025.down },
  '00026_wallet_exemptions': { up: m00026.up, down: m00026.down },
};
