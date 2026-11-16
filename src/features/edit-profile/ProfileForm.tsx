"use client";

import { App, Button, Card, Form, Input } from "antd";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  FULL_NAME_MAX,
  PHONE_MAX,
  USERNAME_MAX,
} from "@/entities/user/model";
import type { OwnProfile } from "@/entities/user/repository";
import { applyFieldErrors, clearErrorsOnChange } from "@/shared/ui/fieldErrors";
import { updateOwnProfileAction } from "./actions";

type Values = { username: string; fullName: string; phone: string; telegram: string };

export function ProfileForm({ profile }: { profile: OwnProfile }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<Values>();
  const [saving, startSaving] = useTransition();

  function submit(values: Values) {
    startSaving(async () => {
      const result = await updateOwnProfileAction(values);
      if (!result.ok) {
        if (!applyFieldErrors(form, result.fieldErrors)) message.error(result.error);
        return;
      }
      message.success("Profile saved.");
      router.refresh();
    });
  }

  return (
    <Card title="Your profile" style={{ maxWidth: 560 }}>
      <Form
        form={form}
        onValuesChange={clearErrorsOnChange(form)}
        layout="vertical"
        onFinish={submit}
        initialValues={{
          username: profile.username,
          fullName: profile.fullName ?? "",
          phone: profile.phone ?? "",
          telegram: profile.telegram ?? "",
        }}
      >
        <Form.Item
          name="username"
          label="Username"
          extra="Shown to other members on your bookings."
          rules={[{ required: true, whitespace: true, message: "Username is required." }]}
        >
          <Input maxLength={USERNAME_MAX} />
        </Form.Item>
        <Form.Item label="Email" extra="Your Google sign-in. It can't be changed.">
          <Input value={profile.email} disabled />
        </Form.Item>
        <Form.Item name="fullName" label="Full name" extra="Only you and admins see this.">
          <Input maxLength={FULL_NAME_MAX} />
        </Form.Item>
        <Form.Item name="phone" label="Phone" extra="Only you and admins see this.">
          <Input maxLength={PHONE_MAX} inputMode="tel" />
        </Form.Item>
        <Form.Item name="telegram" label="Telegram" extra="Only you and admins see this.">
          <Input addonBefore="@" maxLength={33} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>
          Save profile
        </Button>
      </Form>
    </Card>
  );
}
