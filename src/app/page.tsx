"use client";
import { DatePicker, DatePickerProps } from "antd";
import dayjs from "dayjs";
import TabsComponent from "./components/table/TabsComponent";
import { useState } from "react";
import { dayString } from "@entities/types";

export default function Page() {
  const [, setDate] = useState<dayString>();
  const onChange: DatePickerProps["onChange"] = (date, dateString) => {
    setDate(dateString);
  };

  return (
    <div>
      <div style={{ margin: "10px 0" }}>
        <TabsComponent />
        <DatePicker
          onChange={onChange}
          minDate={dayjs()}
          maxDate={dayjs().add(1, "month")}
          defaultValue={dayjs()}
        />
      </div>
    </div>
  );
}
