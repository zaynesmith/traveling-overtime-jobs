export type JobApplicationMode = "direct_apply" | "external_only";

export type Job = {
  application_mode?: JobApplicationMode | null;
};
