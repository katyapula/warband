"use client";
import { DatePicker, DatePickerProps } from "antd";
import dayjs from "dayjs";
import TabsComponent from "./components/home/Tabs";

export default function Page() {
  const onChange: DatePickerProps["onChange"] = (date, dateString) => {
    console.log(date, dateString);
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
