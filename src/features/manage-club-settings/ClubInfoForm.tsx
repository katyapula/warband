"use client";

import { App, Button, Card, Form, Input } from "antd";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  CLUB_DESCRIPTION_MAX,
  CLUB_LOCATION_MAX,
  CLUB_NAME_MAX,
  type ClubInfo,
} from "@/entities/club/model";
import { applyFieldErrors, clearErrorsOnChange } from "@/shared/ui/fieldErrors";
import { updateClubInfoAction } from "./actions";

export function ClubInfoForm({ info }: { info: ClubInfo }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<ClubInfo>();
  const [saving, startSaving] = useTransition();

  function submit(values: ClubInfo) {
    startSaving(async () => {
      const result = await updateClubInfoAction(values);
      if (!result.ok) {
        if (!applyFieldErrors(form, result.fieldErrors)) message.error(result.error);
        return;
      }
      message.success("Club details saved.");
      router.refresh();
    });
  }

  return (
    <Card title="Club details">
      <Form
        form={form}
        layout="vertical"
        initialValues={info}
        onValuesChange={clearErrorsOnChange(form)}
        onFinish={submit}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, whitespace: true, message: "Name is required." }]}
        >
          <Input maxLength={CLUB_NAME_MAX} />
        </Form.Item>
        <Form.Item name="location" label="Location" extra="Address or how to find the club.">
          <Input maxLength={CLUB_LOCATION_MAX} />
        </Form.Item>
        <Form.Item name="description" label="Description" extra="Shown on the About page.">
          <Input.TextArea maxLength={CLUB_DESCRIPTION_MAX} showCount autoSize={{ minRows: 3 }} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>
          Save details
        </Button>
      </Form>
    </Card>
  );
}
