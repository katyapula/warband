"use client";

import { Flex, Select } from "antd";
import { timeChoices, type WorkingHours } from "../model";

const toOptions = (times: string[]) =>
  times.map((t) => ({ value: t, label: t === "24:00" ? "24:00 (midnight)" : t }));

/** Opening and closing time selects on the slot step; closing may be midnight. */
export function HoursPicker({
  value,
  onChange,
  slotStepMinutes,
  invalid,
  labelPrefix,
}: {
  value: WorkingHours;
  onChange: (hours: WorkingHours) => void;
  slotStepMinutes: number;
  invalid?: boolean;
  /** Prefix for the selects' accessible names, e.g. "Default" → "Default opening time". */
  labelPrefix?: string;
}) {
  const choices = timeChoices(slotStepMinutes);
  const openLabel = labelPrefix ? `${labelPrefix} opening time` : "Opening time";
  const closeLabel = labelPrefix ? `${labelPrefix} closing time` : "Closing time";
  const status = invalid ? "error" : undefined;
  return (
    <Flex gap={12} align="center" wrap>
      <Select
        aria-label={openLabel}
        style={{ width: 110 }}
        value={value.openTime}
        options={toOptions(choices.open)}
        status={status}
        onChange={(openTime) => onChange({ ...value, openTime })}
      />
      <span aria-hidden>–</span>
      <Select
        aria-label={closeLabel}
        style={{ width: 160 }}
        value={value.closeTime}
        options={toOptions(choices.close)}
        status={status}
        onChange={(closeTime) => onChange({ ...value, closeTime })}
      />
    </Flex>
  );
}
