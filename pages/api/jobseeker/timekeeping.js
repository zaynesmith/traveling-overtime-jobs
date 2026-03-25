import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";

const PHASE_II_EMAIL = "zayne.smith18@gmail.com";
const TIMEKEEPING_BLOCKED_ASSIGNMENT_STATUSES = ["cancelled", "canceled", "rejected", "ended", "inactive"];

const ACTION_TO_PUNCH_TYPE = {
  clock_in: "clock_in",
  clock_out: "clock_out",
  break_start: "break_start",
  break_end: "break_end",
  lunch_start: "lunch_start",
  lunch_end: "lunch_end",
};

const LEGACY_PUNCH_WRITE_RPC_CANDIDATES = [
  "timekeeping_employee_create_punch",
  "time_create_punch",
  "create_time_punch",
  "clock_in_out",
  "timekeeping_punch_action",
];

const ACTION_RPC_CANDIDATES = {
  clock_in: ["clock_in", ...LEGACY_PUNCH_WRITE_RPC_CANDIDATES],
  clock_out: ["clock_out", ...LEGACY_PUNCH_WRITE_RPC_CANDIDATES],
  break_start: LEGACY_PUNCH_WRITE_RPC_CANDIDATES,
  break_end: LEGACY_PUNCH_WRITE_RPC_CANDIDATES,
  lunch_start: LEGACY_PUNCH_WRITE_RPC_CANDIDATES,
  lunch_end: LEGACY_PUNCH_WRITE_RPC_CANDIDATES,
};

function isPhaseTwoUser(session) {
  return String(session?.user?.email || "").toLowerCase() === PHASE_II_EMAIL;
}

function normalizeAction(value) {
  const action = String(value || "").toLowerCase();
  return ACTION_TO_PUNCH_TYPE[action] ? action : null;
}

function sanitizeLocation(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value;
}

function formatIso(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function getAllowedActions(lastPunchType, supportsBreaks, supportsLunch) {
  const normalizedLast = String(lastPunchType || "").toLowerCase();

  if (!normalizedLast || ["clock_out", "break_end", "lunch_end"].includes(normalizedLast)) {
    return ["clock_in"];
  }

  if (normalizedLast === "clock_in") {
    const actions = ["clock_out"];
    if (supportsBreaks) actions.unshift("break_start");
    if (supportsLunch) actions.unshift("lunch_start");
    return actions;
  }

  if (normalizedLast === "break_start") return ["break_end"];
  if (normalizedLast === "lunch_start") return ["lunch_end"];

  return ["clock_in"];
}

async function getJobseekerProfileId(userId) {
  const profile = await prisma.jobseekerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return profile?.id || null;
}

async function resolveExistingRpcName(candidates) {
  const rows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT p.proname
      FROM pg_proc p
      INNER JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = ANY (${candidates}::text[])
      ORDER BY array_position(${candidates}::text[], p.proname)
      LIMIT 1
    `,
  );

  return Array.isArray(rows) && rows[0]?.proname ? rows[0].proname : null;
}

async function listActiveAssignments(jobseekerProfileId) {
  return await prisma.$queryRaw(
    Prisma.sql`
      SELECT
        joa.id,
        joa.status,
        joa.job_order_id,
        joa.employer_id,
        joa.project_id,
        joa.start_date,
        joa.end_date,
        jo.job_name,
        jo.city,
        jo.state,
        p.name AS project_name,
        CASE
          WHEN COALESCE(jae.default_cost_code, '') <> '' THEN true
          ELSE false
        END AS supports_breaks,
        CASE
          WHEN COALESCE(jso.lunch_start::text, '') <> '' OR COALESCE(jso.lunch_end::text, '') <> '' THEN true
          ELSE false
        END AS supports_lunch
      FROM (
        SELECT
          a.*,
          jo.project_id
        FROM public.job_order_assignments a
        INNER JOIN public.job_orders jo ON jo.id = a.job_order_id
        WHERE a.jobseeker_id = ${jobseekerProfileId}::uuid
          AND (
            a.status IS NULL
            OR LOWER(a.status) <> ALL (${TIMEKEEPING_BLOCKED_ASSIGNMENT_STATUSES}::text[])
          )
          AND (
            a.assignment_request_id IS NULL
            OR EXISTS (
              SELECT 1
              FROM public.assignment_requests ar
              WHERE ar.id = a.assignment_request_id
                AND LOWER(ar.status) = 'accepted'
            )
          )
        ORDER BY a.start_date DESC NULLS LAST, a.created_at DESC NULLS LAST
      ) joa
      INNER JOIN public.job_orders jo ON jo.id = joa.job_order_id
      LEFT JOIN public.projects p ON p.id = joa.project_id
      LEFT JOIN public.job_order_assignment_extensions jae ON jae.assignment_id = joa.id
      LEFT JOIN LATERAL (
        SELECT so.*
        FROM public.job_order_schedule_overrides so
        WHERE so.job_order_id = joa.job_order_id
          AND so.active = true
        ORDER BY so.effective_start_date DESC NULLS LAST, so.created_at DESC
        LIMIT 1
      ) jso ON true
      ORDER BY joa.start_date DESC NULLS LAST, joa.created_at DESC NULLS LAST
    `,
  );
}

async function getAssignmentStatusSnapshot(jobseekerProfileId, assignmentId) {
  const [latestPunchRows, todaySummaryRows, exceptionRows] = await Promise.all([
    prisma.$queryRaw(
      Prisma.sql`
        SELECT
          tp.id,
          tp.type,
          tp.punch_timestamp_utc,
          tp.assignment_id
        FROM public.time_punches tp
        WHERE tp.jobseeker_id = ${jobseekerProfileId}::uuid
          AND tp.assignment_id = ${assignmentId}::uuid
        ORDER BY tp.punch_timestamp_utc DESC, tp.created_at DESC
        LIMIT 1
      `,
    ),
    prisma.$queryRaw(
      Prisma.sql`
        SELECT
          tds.id,
          tds.assignment_id,
          tds.work_date,
          tds.first_clock_in,
          tds.last_clock_out,
          tds.total_work_minutes_paid,
          tds.status,
          tds.locked_at,
          tds.exception_count
        FROM public.time_daily_summaries tds
        WHERE tds.jobseeker_id = ${jobseekerProfileId}::uuid
          AND tds.assignment_id = ${assignmentId}::uuid
          AND tds.work_date = CURRENT_DATE
        ORDER BY tds.updated_at DESC NULLS LAST, tds.created_at DESC NULLS LAST
        LIMIT 1
      `,
    ),
    prisma.$queryRaw(
      Prisma.sql`
        SELECT COUNT(*)::int AS open_exception_count
        FROM public.time_exceptions te
        WHERE te.jobseeker_id = ${jobseekerProfileId}::uuid
          AND te.assignment_id = ${assignmentId}::uuid
          AND te.work_date = CURRENT_DATE
          AND te.status = 'open'
      `,
    ),
  ]);

  const lastPunch = latestPunchRows?.[0] || null;
  const todaySummary = todaySummaryRows?.[0] || null;
  const openExceptionCount = exceptionRows?.[0]?.open_exception_count || 0;

  const lastType = String(lastPunch?.type || "").toLowerCase();
  const isClockedIn = ["clock_in", "break_end", "lunch_end"].includes(lastType);
  const onBreak = lastType === "break_start";
  const onLunch = lastType === "lunch_start";

  return {
    lastPunchType: lastPunch?.type || null,
    lastPunchTimestamp: formatIso(lastPunch?.punch_timestamp_utc),
    isClockedIn,
    onBreak,
    onLunch,
    todaySummary: {
      id: todaySummary?.id || null,
      firstIn: formatIso(todaySummary?.first_clock_in),
      lastOut: formatIso(todaySummary?.last_clock_out),
      totalWorkedMinutes: Number(todaySummary?.total_work_minutes_paid || 0),
      openShift: Boolean(todaySummary && !todaySummary.last_clock_out),
      hasException: Number(todaySummary?.exception_count || 0) > 0 || openExceptionCount > 0,
      openExceptionCount,
      status: todaySummary?.status || null,
      lockedAt: formatIso(todaySummary?.locked_at),
    },
  };
}

async function getClockCodeRequirement(assignment) {
  const rows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT code_type::text AS code_type
      FROM public.time_clock_codes tcc
      WHERE tcc.employer_id = ${assignment.employer_id}::uuid
        AND (tcc.project_id IS NULL OR tcc.project_id = ${assignment.project_id}::uuid)
        AND tcc.code_date = CURRENT_DATE
        AND tcc.active = true
        AND NOW() BETWEEN tcc.valid_from AND tcc.valid_to
      GROUP BY code_type::text
    `,
  );

  const requiredActions = Array.isArray(rows)
    ? rows
        .map((row) => String(row.code_type || "").toLowerCase())
        .filter((codeType) => ["clock_in", "clock_out", "break_start", "break_end", "lunch_start", "lunch_end"].includes(codeType))
    : [];

  return new Set(requiredActions);
}

async function handleGet(req, res, session) {
  if (!isPhaseTwoUser(session)) {
    return res.status(404).json({ error: "Not found" });
  }

  const jobseekerProfileId = await getJobseekerProfileId(session.user.id);
  if (!jobseekerProfileId) {
    return res.status(200).json({ assignments: [], selectedAssignmentId: null, status: null, message: "No profile found" });
  }

  const assignments = await listActiveAssignments(jobseekerProfileId);
  if (!assignments.length) {
    return res.status(200).json({ assignments: [], selectedAssignmentId: null, status: null, message: "No eligible assignment" });
  }

  const assignmentIdParam = String(req.query.assignmentId || "");
  const selected = assignments.find((row) => row.id === assignmentIdParam) || assignments[0];

  const status = await getAssignmentStatusSnapshot(jobseekerProfileId, selected.id);
  const codeRequirements = await getClockCodeRequirement(selected);

  const supportsBreaks = Boolean(selected.supports_breaks);
  const supportsLunch = Boolean(selected.supports_lunch);
  const allowedActions = getAllowedActions(status.lastPunchType, supportsBreaks, supportsLunch);

  const summaryLocked = Boolean(status?.todaySummary?.lockedAt) || status?.todaySummary?.status === "approved";

  return res.status(200).json({
    // Reuses existing backend reads from immutable punch and summary tables (no payroll math in UI).
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      jobOrderId: assignment.job_order_id,
      projectId: assignment.project_id,
      projectName: assignment.project_name || null,
      jobName: assignment.job_name,
      city: assignment.city,
      state: assignment.state,
      status: assignment.status,
      startDate: assignment.start_date,
      endDate: assignment.end_date,
      supportsBreaks: Boolean(assignment.supports_breaks),
      supportsLunch: Boolean(assignment.supports_lunch),
    })),
    selectedAssignmentId: selected.id,
    status: {
      ...status,
      activeAssignmentId: selected.id,
      allowedActions,
      locked: summaryLocked,
      lockMessage: summaryLocked ? "This day is locked/approved. Punch edits are disabled." : null,
      requiredClockCodes: allowedActions.filter((action) => codeRequirements.has(action)),
    },
  });
}

async function handlePost(req, res, session) {
  if (!isPhaseTwoUser(session)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const jobseekerProfileId = await getJobseekerProfileId(session.user.id);
  if (!jobseekerProfileId) {
    return res.status(404).json({ error: "Jobseeker profile not found" });
  }

  const assignmentId = String(req.body?.assignmentId || "");
  const action = normalizeAction(req.body?.action);

  if (!assignmentId || !action) {
    return res.status(400).json({ error: "Valid assignmentId and action are required" });
  }

  const assignmentRows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT
        a.id,
        a.employer_id,
        jo.project_id,
        a.job_order_id
      FROM public.job_order_assignments a
      INNER JOIN public.job_orders jo ON jo.id = a.job_order_id
      WHERE a.id = ${assignmentId}::uuid
        AND a.jobseeker_id = ${jobseekerProfileId}::uuid
        AND (
          a.status IS NULL
          OR LOWER(a.status) <> ALL (${TIMEKEEPING_BLOCKED_ASSIGNMENT_STATUSES}::text[])
        )
        AND (
          a.assignment_request_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.assignment_requests ar
            WHERE ar.id = a.assignment_request_id
              AND LOWER(ar.status) = 'accepted'
          )
        )
      LIMIT 1
    `,
  );

  const assignment = assignmentRows?.[0];
  if (!assignment) {
    return res.status(404).json({ error: "Eligible assignment not found" });
  }

  const statusSnapshot = await getAssignmentStatusSnapshot(jobseekerProfileId, assignment.id);
  const isLocked = Boolean(statusSnapshot?.todaySummary?.lockedAt) || statusSnapshot?.todaySummary?.status === "approved";

  if (isLocked) {
    return res.status(409).json({ error: "This day is locked/approved. Punch actions are disabled." });
  }

  const requiredClockCodes = await getClockCodeRequirement(assignment);
  const enteredCode = String(req.body?.clockCode || "").trim();

  const requiresClockCode = action === "clock_in" || requiredClockCodes.has(action);

  if (requiresClockCode && !/^\d{4}$/.test(enteredCode)) {
    return res.status(400).json({ error: "A valid 4-digit clock code is required for this punch." });
  }

  const latitude = sanitizeLocation(req.body?.latitude);
  const longitude = sanitizeLocation(req.body?.longitude);
  const clientTz = String(req.body?.timezone || "").slice(0, 100) || "UTC";

  const rpcCandidates = ACTION_RPC_CANDIDATES[action] || LEGACY_PUNCH_WRITE_RPC_CANDIDATES;
  const rpcName = await resolveExistingRpcName(rpcCandidates);

  if (!rpcName) {
    return res.status(422).json({
      error: "missing_rpc",
      message: `No supported punch RPC found for action "${action}" in this environment.`,
      expected: rpcCandidates,
    });
  }

  const rpcPayload = {
    assignment_id: assignment.id,
    source: "web",
    requested_by: session.user.id,
    action,
  };

  let rpcResult;

  if (rpcName === "clock_in") {
    const rpcQuery = `SELECT * FROM public.clock_in($1::uuid, $2::text, $3::text, $4::numeric, $5::numeric, $6::jsonb, $7::text)`;
    rpcResult = await prisma.$queryRawUnsafe(
      rpcQuery,
      assignment.id,
      enteredCode || null,
      clientTz,
      latitude,
      longitude,
      JSON.stringify(rpcPayload),
      null,
    );
  } else if (rpcName === "clock_out") {
    const rpcQuery = `SELECT * FROM public.clock_out($1::uuid, $2::text, $3::numeric, $4::numeric, $5::jsonb, $6::text)`;
    rpcResult = await prisma.$queryRawUnsafe(
      rpcQuery,
      assignment.id,
      clientTz,
      latitude,
      longitude,
      JSON.stringify(rpcPayload),
      null,
    );
  } else {
    // Reuse legacy backend RPC for punch creation instead of duplicating payroll/timecard logic in frontend.
    const rpcQuery = `SELECT * FROM public.${rpcName}($1::uuid, $2::text, $3::text, $4::double precision, $5::double precision, $6::text, $7::jsonb)`;
    rpcResult = await prisma.$queryRawUnsafe(
      rpcQuery,
      assignment.id,
      ACTION_TO_PUNCH_TYPE[action],
      enteredCode || null,
      latitude,
      longitude,
      clientTz,
      JSON.stringify(rpcPayload),
    );
  }

  return res.status(200).json({
    ok: true,
    action,
    rpcUsed: rpcName,
    result: rpcResult,
  });
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id || session.user.role !== "jobseeker") {
      return res.status(403).json({ error: "Jobseeker authentication required" });
    }

    if (req.method === "GET") {
      return await handleGet(req, res, session);
    }

    return await handlePost(req, res, session);
  } catch (error) {
    console.error("Timekeeping API failed", error);
    return res.status(500).json({ error: "Failed to load or update timekeeping" });
  }
}
