export type MongoUserExpertise = {
  _id?: { $oid?: string } | string;
  user_name?: string;
  author_permlink?: string;
  weight?: number;
};
