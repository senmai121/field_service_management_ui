export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const res = await fetch(`/api/proxy/api/${path}`, options);

  if (res.status === 401) {
    // Redirect to login if unauthenticated
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  return res;
}
