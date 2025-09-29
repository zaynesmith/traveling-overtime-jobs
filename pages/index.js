import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Traveling Overtime Jobs</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <section className="hero">
          <div className="overlay" />
          <h1 className="title">Traveling Overtime Jobs</h1>

          <div className="pill-group">
            <a href="/jobseeker/search" className="pill">Search Jobs</a>
            <a href="/employer/post" className="pill">Post Jobs</a>
            <a href="/sign-in?role=employer" className="pill">Employer Login</a>
            <a href="/sign-in?role=jobseeker" className="pill">Jobseeker Login</a>
          </div>
        </section>
      </main>
    </>
  );
}