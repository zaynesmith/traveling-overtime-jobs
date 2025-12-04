import Link from "next/link";

export default function UpgradeGate({
  eyebrow = "Upgrade to unlock this feature",
  title = "Unlock full recruiting access",
  description,
  benefits = [],
  ctaLabel = "Go to subscription",
  ctaHref = "/dashboard/employer/billing",
}) {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-2xl ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">{description}</p>
          ) : null}

          {benefits.length > 0 ? (
            <ul className="mt-6 grid gap-2 text-sm text-slate-600 sm:text-base">
              {benefits.map((benefit) => (
                <li key={benefit}>• {benefit}</li>
              ))}
            </ul>
          ) : null}

          <Link
            href={ctaHref}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
