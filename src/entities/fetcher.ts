export const fetcher = (url: string) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer asdasd`,
    },
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });
