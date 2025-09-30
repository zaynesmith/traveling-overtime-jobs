export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/jobseeker/dashboard",
      permanent: false,
    },
  };
}

export default function JobseekerIndexRedirect() {
  return null;
}
