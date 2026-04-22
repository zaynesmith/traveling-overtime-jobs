export const EXTERNAL_ONLY_APPLICATION_MESSAGE =
  "This job is not accepting in-app applications. Contact the employer using the details in the description.";

export function canDirectApply(job) {
  return job?.application_mode === "direct_apply";
}
