// components/Header.js
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <>
      <header className="site-header">
        <div className="container">
          <a className="brand" href="/">Traveling Overtime Jobs</a>

          <nav className="nav">
            <a href="/jobseeker/search">Search Jobs</a>
            <a href="/employer/post">Post Jobs</a>
            <a href="/saved">Saved</a>
            <a href="/applications">Applications</a>

            <SignedOut>
              <a className="btn" href="/sign-in">Sign in</a>
              <a className="btn secondary" href="/sign-up">Sign up</a>
            </SignedOut>

            <SignedIn>
              <a className="btn" href="/dashboard">Dashboard</a>
              <UserButton
                appearance={{ elements: { userButtonPopoverCard: { zIndex: 9999 } } }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </nav>
        </div>
      </header>

      <style jsx>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: saturate(160%) blur(6px);
          border-bottom: 1px solid #eee;
        }
        .container {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
        }
        .brand {
          font-weight: 800;
          text-decoration: none;
          color: #111;
        }
        .nav {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .nav a {
          text-decoration: none;
          color: #333;
          padding: 6px 8px;
          border-radius: 8px;
        }
        .nav a:hover { background: #f3f3f3; }
        .btn {
          font-weight: 600;
          border: 1px solid #ddd;
          padding: 6px 10px;
          border-radius: 10px;
          background: #fff;
        }
        .btn.secondary {
          background: #111;
          color: #fff;
          border-color: #111;
        }
        @media (max-width: 560px) {
          .brand { font-size: 14px; }
          .nav { gap: 6px; }
          .btn { padding: 6px 8px; }
        }
      `}</style>
    </>
  );
}
