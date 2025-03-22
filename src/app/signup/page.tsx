"use client";

import useSWRMutation from "swr/mutation";
import { createUser } from "./CreateUser";
import { Button, Divider, Form, Input } from "antd";
import { SignupFieldType } from "@entities/types";

export default function SignupForm() {
  const { trigger, isMutating } = useSWRMutation(
    "http://localhost:8080/create",
    createUser,
  );
  const sendRequest = () => {
    trigger("my_token");
  };

  return (
    <Form onFinish={sendRequest} layout="vertical">
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

      <Divider />

      <Form.Item<SignupFieldType> label="Name" name="name">
        <Input />
      </Form.Item>

      <Form.Item<SignupFieldType> label="Telegram" name="telegram">
        <Input />
      </Form.Item>

      <Form.Item<SignupFieldType> label="Phone number" name="phone">
        <Input />
      </Form.Item>

      <Button
        htmlType="submit"
        disabled={isMutating}
        type="primary"
        size="large"
      >
        Sign Up
      </Button>
    </Form>
  );
}
