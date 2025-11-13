// src/lib/api-client.ts

// A simple fetcher function for use with SWR
export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export async function postApi(url: string, body: object) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "An API error occurred");
  }

  return response.json();
}
