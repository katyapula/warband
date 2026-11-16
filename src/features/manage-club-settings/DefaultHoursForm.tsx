"use client";

import { App, Button, Card, Flex, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { WorkingHours } from "@/entities/club/model";
import { HoursPicker } from "@/entities/club/ui/HoursPicker";
import { updateDefaultHoursAction } from "./actions";

export function DefaultHoursForm({
  hours,
  slotStepMinutes,
}: {
  hours: WorkingHours;
  slotStepMinutes: number;
}) {
  const { message } = App.useApp();
  const router = useRouter();
  const [draft, setDraft] = useState(hours);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function change(next: WorkingHours) {
    setDraft(next);
    setError(null);
  }

  function save() {
    startSaving(async () => {
      const result = await updateDefaultHoursAction(draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      message.success("Default working hours saved.");
      router.refresh();
    });
  }

  return (
    <Card title="Default working hours">
      <Flex vertical gap={12}>
        <Typography.Text type="secondary">
          Prefilled when you activate a day; you can change them per day. Changing the defaults
          doesn&apos;t change days that are already active.
        </Typography.Text>
        <HoursPicker
          value={draft}
          onChange={change}
          slotStepMinutes={slotStepMinutes}
          invalid={Boolean(error)}
          labelPrefix="Default"
        />
        {error && (
          <Typography.Text type="danger" role="alert">
            {error}
          </Typography.Text>
        )}
        <div>
          <Button type="primary" loading={saving} onClick={save}>
            Save hours
          </Button>
        </div>
      </Flex>
    </Card>
  );
}
