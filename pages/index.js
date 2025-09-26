export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="overlay" />
        <h1 className="title">Traveling Overtime Jobs</h1>

        <div className="pill-group">
          <a href="/search" className="pill">Search Jobs</a>
          <a href="/post" className="pill">Post Jobs</a>
          <a href="/sign-in" className="pill">Employer Login</a>
          <a href="/sign-up" className="pill">Jobseeker Login</a>
        </div>
      </section>
    </main>
  );
}
