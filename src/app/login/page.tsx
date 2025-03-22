"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import useSWRMutation from "swr/mutation";

async function sendRequest(
  url: string,
  { arg }: { arg: { email: string; password: string } },
) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(arg),
  }).then((res) => res.json());
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { trigger, isMutating } = useSWRMutation(
    "http://localhost:8080/create",
    sendRequest /* options */,
  );

  return (
    <div>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={async () => {
          try {
            const result = await trigger({
              email: email,
              password: password,
            });
            console.log(result);
          } catch (e) {
            return e;
          }
        }}
        disabled={isMutating}
      >
        Submit
      </button>
      {/*<div>{error && error}</div>*/}
    </div>
  );
}
