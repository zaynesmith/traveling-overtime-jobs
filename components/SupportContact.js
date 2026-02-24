export default function SupportContact({ className = "" }) {
  const classes = ["support-contact", className].filter(Boolean).join(" ");

  return (
    <p className={classes}>
      Need help? Contact support at{" "}
      <a href="mailto:support@travelingovertimejobs.com">support@travelingovertimejobs.com</a>.
    </p>
  );
}
