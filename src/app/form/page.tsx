"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "antd";

export default function Login() {
  const { data: session } = useSession();

  return (
    <div>
      {session ? (
        <>
          <p>Welcome, {session.user?.name}</p>
          {/*{session?.user?.role === "admin" && <p>Admin Panel</p>}*/}
          <Button onClick={() => signOut()}>Sign out</Button>
        </>
      ) : (
        <Button
          type="primary"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Sign in with Google
        </Button>
      )}
    </div>
  );
}
