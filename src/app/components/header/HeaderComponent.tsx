import React from "react";
import Image from "next/image";
import Logo from "@assets/logo.jpg";
import { signIn, signOut, useSession } from "next-auth/react";
import { Header } from "antd/es/layout/layout";
import { Button, Flex } from "antd";

export default function HeaderComponent() {
  const { data: session, status } = useSession();
  console.log("Session:", session, "Status:", status);

  return (
    <Header style={{ background: 0, height: "120px" }}>
      <Flex justify="space-between" align="center">
        <Image src={Logo} width={120} height={120} alt="Logo" priority />
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
      </Flex>
    </Header>
  );
}
