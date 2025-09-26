// pages/index.js
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Traveling Overtime Jobs</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        {/* Hero with background image from /public/cover.jpg */}
        <section className="hero">
          <div className="overlay" />
          <h1 className="title">Traveling Overtime Jobs</h1>

          <div className="pill-group">
            <a href="/jobseeker/search" className="pill">Search Jobs</a>
            <a href="/employer/post" className="pill">Post Jobs</a>
            <a href="/employer" className="pill">Employer Login</a>
            <a href="/jobseeker" className="pill">Jobseeker Login</a>
          </div>
        </section>
      </main>

      {/* Page-scoped styles to keep it simple */}
      <style jsx>{`
        .hero {
          position: relative;
          min-height: 65vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          background-image: url("/cover.jpg");
          background-size: cover;
          background-position: center;
          margin: 0;
        }
        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
        }
        .title {
          position: relative;
          color: #fff;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue",
            Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
          font-weight: 800;
          font-size: clamp(28px, 4vw, 44px);
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
          margin: 0 16px 14px;
        }
        .pill-group {
          position: relative;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          padding: 8px 14px;
        }
        .pill {
          display: inline-block;
          background: #fff;
          color: #111;
          border-radius: 999px;
          padding: 9px 14px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.08);
          transition: transform 0.08s ease, box-shadow 0.12s ease;
          white-space: nowrap;
        }
        .pill:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
        }

        /* Mobile spacing so buttons never overlap */
        @media (max-width: 480px) {
          .hero { min-height: 60vh; }
          .pill-group { gap: 8px; padding: 6px 10px; }
          .pill { padding: 8px 12px; font-size: 13px; }
        }
      `}</style>
    </>
  );
}
