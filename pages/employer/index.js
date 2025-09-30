export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/employer/dashboard",
      permanent: false,
    },
  };
}

export default function EmployerIndexRedirect() {
  return null;
}
