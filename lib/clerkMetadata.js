export async function updatePublicMetadata(updates) {
  const response = await fetch("/api/user/update-public-metadata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ publicMetadata: updates }),
  });

  if (!response.ok) {
    let message = "Failed to update public metadata.";
    try {
      const error = await response.json();
      if (error?.error) {
        message = error.error;
      }
    } catch (parseError) {
      // Ignore JSON parsing errors and fall back to default message
    }
    throw new Error(message);
  }

  return response.json();
}
