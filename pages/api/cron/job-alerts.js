import prisma from "@/lib/prisma";
import { normalizeTrade } from "@/lib/trades";
import { sendEmail } from "@/lib/email/sendgrid";

const HOURS_24_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  );
}

function buildJobLocation(job) {
  const cityState = [job.city, job.state].filter(Boolean).join(", ");
  return cityState || job.location || "Location not specified";
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : "Recently posted";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const secret = req.headers["x-cron-secret"];
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const now = new Date();
    const throttleCutoff = new Date(now.getTime() - HOURS_24_MS);

    const jobseekers = await prisma.jobseekerProfile.findMany({
      where: {
        email_job_alerts: true,
        email: { not: null },
        trade: { not: null },
        AND: [
          { email: { not: "" } },
          { trade: { not: "" } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        trade: true,
        last_job_alert_sent_at: true,
      },
    });

    let processed = 0;
    let sent = 0;

    for (const seeker of jobseekers) {
      processed += 1;

      if (
        seeker.last_job_alert_sent_at &&
        new Date(seeker.last_job_alert_sent_at) > throttleCutoff
      ) {
        continue;
      }

      const normalizedTrade = normalizeTrade(seeker.trade) || seeker.trade?.trim();
      if (!normalizedTrade) {
        continue;
      }

      const lookbackStart =
        seeker.last_job_alert_sent_at
          ? new Date(seeker.last_job_alert_sent_at)
          : new Date(now.getTime() - DEFAULT_LOOKBACK_MS);

      const newJobsCount = await prisma.jobs.count({
        where: {
          trade: { equals: normalizedTrade, mode: "insensitive" },
          posted_at: { gt: lookbackStart },
        },
      });

      if (newJobsCount < 1) {
        continue;
      }

      const jobs = await prisma.jobs.findMany({
        where: {
          trade: { equals: normalizedTrade, mode: "insensitive" },
          posted_at: { gt: lookbackStart },
        },
        orderBy: { posted_at: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          city: true,
          state: true,
          location: true,
          per_diem: true,
          hourly_pay: true,
          posted_at: true,
        },
      });

      const appUrl = getAppUrl();
      const searchUrl = `${appUrl}/jobs?trade=${encodeURIComponent(normalizedTrade)}`;

      const jobLines = jobs
        .map((job) => {
          const location = buildJobLocation(job);
          const posted = formatDate(job.posted_at);
          const payParts = [job.hourly_pay, job.per_diem].filter(Boolean);
          const pay = payParts.length ? ` — ${payParts.join(" | ")}` : "";
          return `<li><strong>${job.title}</strong> (${location}${pay}) — Posted ${posted}</li>`;
        })
        .join("");

      const html = `
        <p>Hi ${seeker.firstName || seeker.lastName || "there"},</p>
        <p>We just posted ${newJobsCount} new ${normalizedTrade} jobs on Traveling Overtime Jobs.</p>
        <ul>${jobLines}</ul>
        <p><a href="${searchUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">View more jobs on TravelingOvertimeJobs.com</a></p>
        <p>You can disable these alerts anytime in your jobseeker settings.</p>
      `;

      const textList = jobs
        .map((job) => {
          const location = buildJobLocation(job);
          const posted = formatDate(job.posted_at);
          const payParts = [job.hourly_pay, job.per_diem].filter(Boolean);
          const pay = payParts.length ? ` — ${payParts.join(" | ")}` : "";
          return `${job.title} (${location}${pay}) — Posted ${posted} — ${appUrl}/jobs/${job.id}`;
        })
        .join("\n");

      const text = `Hi ${seeker.firstName || seeker.lastName || "there"},\n\n` +
        `We just posted ${newJobsCount} new ${normalizedTrade} jobs on Traveling Overtime Jobs.\n\n` +
        `${textList}\n\n` +
        `View more jobs: ${searchUrl}\n\n` +
        `You can disable these alerts anytime in your jobseeker settings.`;

      await sendEmail({
        to: seeker.email,
        subject: `New ${normalizedTrade} jobs just posted on Traveling Overtime Jobs`,
        html,
        text,
      });

      await prisma.jobseekerProfile.update({
        where: { id: seeker.id },
        data: { last_job_alert_sent_at: now },
      });

      sent += 1;
    }

    return res.status(200).json({ processed, sent });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to process job alerts" });
  }
}
