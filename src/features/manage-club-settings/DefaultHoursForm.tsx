"use client";

import { App, Button, Card, Flex, Select, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { timeChoices, type WorkingHours } from "@/entities/club/model";
import { updateDefaultHoursAction } from "./actions";

const toOptions = (times: string[]) =>
  times.map((t) => ({ value: t, label: t === "24:00" ? "24:00 (midnight)" : t }));

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
  const choices = timeChoices(slotStepMinutes);

  function change(patch: Partial<WorkingHours>) {
    setDraft((prev) => ({ ...prev, ...patch }));
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
        <Flex gap={12} align="center" wrap>
          <Select
            aria-label="Default opening time"
            style={{ width: 110 }}
            value={draft.openTime}
            options={toOptions(choices.open)}
            status={error ? "error" : undefined}
            onChange={(openTime) => change({ openTime })}
          />
          <span aria-hidden>–</span>
          <Select
            aria-label="Default closing time"
            style={{ width: 160 }}
            value={draft.closeTime}
            options={toOptions(choices.close)}
            status={error ? "error" : undefined}
            onChange={(closeTime) => change({ closeTime })}
          />
        </Flex>
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
