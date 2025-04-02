"use client";
import { Button, Form, FormProps, Input } from "antd";
import useSWRMutation from "swr/mutation";
import { SignupFieldType } from "@entities/types";

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
  const { trigger, isMutating } = useSWRMutation(
    "http://localhost:8080/create",
    sendRequest,
  );
  const onFinish: FormProps<SignupFieldType>["onFinish"] = async (values) => {
    try {
      await trigger({
        email: values.email,
        password: values.password,
      });
    } catch (e) {
      return e;
    }
  };

  return (
    <>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item<SignupFieldType>
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input autoComplete="email" />
        </Form.Item>
        <Form.Item<SignupFieldType>
          label="Password*"
          name="password"
          rules={[
            { required: true, message: "Please enter your password!" },
            { min: 8, message: "Password must be at least 8 characters long" },
            {
              pattern: /[a-zA-Z]/,
              message: "Password must contain at least one letter.",
            },
            {
              pattern: /[0-9]/,
              message: "Password must contain at least one number.",
            },
            {
              pattern: /[^a-zA-Z0-9]/,
              message: "Password must contain at least one special character.",
            },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Button
          htmlType="submit"
          disabled={isMutating}
          type="primary"
          size="large"
        >
          Login
        </Button>
      </Form>
    </>
  );
}
