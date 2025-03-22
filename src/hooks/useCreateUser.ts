import useSWRMutation from "swr/mutation";

const createUser = async (
  url: string,
  {
    arg,
  }: {
    arg: {
      name: string;
      email: string;
      telegram: string;
      phone: string;
      password: string;
    };
  },
) => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${arg}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to create user");
  }

  return res.json();
};

export function useCreateUser() {
  return useSWRMutation("http://localhost:8080/create", createUser);
}
