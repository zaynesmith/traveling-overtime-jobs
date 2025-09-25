export default function Home() {
  return (
    <div style={{ textAlign: "center", minHeight: "100vh" }}>
      {/* Background cover photo */}
      <div
        style={{
          backgroundImage: "url('/cover.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "3rem",
          fontWeight: "bold",
          textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
        }}
      >
        Traveling Overtime Jobs
      </div>

      {/* Simple navigation boxes */}
      <div style={{ marginTop: "2rem" }}>
        <a
          href="#"
          style={{
            margin: "1rem",
            padding: "1rem 2rem",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            textDecoration: "none",
            color: "black",
            fontWeight: "600",
          }}
        >
          Search Jobs
        </a>
        <a
          href="#"
          style={{
            margin: "1rem",
            padding: "1rem 2rem",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            textDecoration: "none",
            color: "black",
            fontWeight: "600",
          }}
        >
          Post Jobs
        </a>
        <a
          href="#"
          style={{
            margin: "1rem",
            padding: "1rem 2rem",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            textDecoration: "none",
            color: "black",
            fontWeight: "600",
          }}
        >
          Employers
        </a>
      </div>
    </div>
  );
}
