# Timekeeping Table Reference

Captured for troubleshooting the jobseeker punch flow and employer visibility.

## Core tables

- `job_order_assignments`
- `job_orders`
- `pay_periods`
- `time_approvals`
- `time_daily_summaries`

## Key relationships used by timekeeping

- `time_daily_summaries.assignment_id -> job_order_assignments.id`
- `time_daily_summaries.jobseeker_id -> jobseekerprofile.id`
- `time_daily_summaries.employer_id -> employerprofile.id`
- `time_daily_summaries.job_order_id -> job_orders.id`
- `time_daily_summaries.project_id -> projects.id`
- `time_daily_summaries.pay_period_id -> pay_periods.id`
- `time_approvals.pay_period_id -> pay_periods.id`
- `job_order_assignments.job_order_id -> job_orders.id`
- `job_order_assignments.jobseeker_id -> jobseekerprofile.id`
- `job_order_assignments.employer_id -> employerprofile.id`

## Constraints to remember

- `job_order_assignments` has unique `(job_order_id, jobseeker_id)`.
- `time_daily_summaries` has unique `(jobseeker_id, job_order_id, work_date)`.
- `job_order_assignments.assignment_request_id` is unique.

## RLS notes

- `job_order_assignments` is read-only to jobseekers/employers via profile ownership checks.
- `time_daily_summaries` allows:
  - jobseeker select access via `jobseeker_id = get_current_jobseeker_id()`
  - employer all-access within employer scope via `employer_id = get_current_employer_id()`
- `pay_periods` and `time_approvals` are employer-scoped via `get_current_employer_id()`.
