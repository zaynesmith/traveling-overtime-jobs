export default function UnauthorizedPage() {
  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 640, margin: "80px auto", padding: 32 }}>
        <h1 style={{ marginTop: 0 }}>Access restricted</h1>
        <p style={{ color: "#475569" }}>
          You don&apos;t have permission to view that area. Switch accounts or contact support if you think this is a mistake.
        </p>
      </div>
    </main>
  );
}
