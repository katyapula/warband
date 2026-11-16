"use client";

import { App, Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TABLE_DESCRIPTION_MAX, TABLE_NAME_MAX, type TableInput } from "@/entities/table/model";
import type { TableRow } from "@/entities/table/repository";
import { applyFieldErrors, clearErrorsOnChange } from "@/shared/ui/fieldErrors";
import { BrandTag } from "@/shared/ui/BrandTag";
import {
  createTableAction,
  setTableActiveAction,
  updateTableAction,
  type TableActionResult,
} from "./actions";

type Editing = { mode: "create" } | { mode: "edit"; table: TableRow } | null;

export function TablesManager({ tables }: { tables: TableRow[] }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<TableInput>();
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, startSaving] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openCreate = () => setEditing({ mode: "create" });
  const openEdit = (table: TableRow) => setEditing({ mode: "edit", table });

  function showErrors(result: Extract<TableActionResult, { ok: false }>) {
    if (!applyFieldErrors(form, result.fieldErrors)) message.error(result.error);
  }

  async function submit() {
    const values = await form.validateFields();
    startSaving(async () => {
      const result =
        editing?.mode === "edit"
          ? await updateTableAction(editing.table.id, values)
          : await createTableAction(values);
      if (!result.ok) return showErrors(result);
      message.success(editing?.mode === "edit" ? "Table updated." : "Table added.");
      setEditing(null);
      router.refresh();
    });
  }

  async function toggle(table: TableRow) {
    setTogglingId(table.id);
    const result = await setTableActiveAction(table.id, !table.isActive);
    setTogglingId(null);
    if (!result.ok) return message.error(result.error);
    message.success(table.isActive ? `${table.name} deactivated.` : `${table.name} reactivated.`);
    router.refresh();
  }

  return (
    <>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }} wrap>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Tables
        </Typography.Title>
        <Button type="primary" onClick={openCreate}>
          Add table
        </Button>
      </Space>

      <Table<TableRow>
        rowKey="id"
        dataSource={tables}
        pagination={false}
        scroll={{ x: true }}
        locale={{ emptyText: "No tables yet. Add the first one." }}
        columns={[
          {
            title: "Name",
            dataIndex: "name",
            render: (name: string, t) => (
              <Typography.Text type={t.isActive ? undefined : "secondary"}>{name}</Typography.Text>
            ),
          },
          {
            title: "Description",
            dataIndex: "description",
            render: (d: string | null) =>
              d ?? <Typography.Text type="secondary">—</Typography.Text>,
          },
          {
            title: "Status",
            dataIndex: "isActive",
            render: (active: boolean) =>
              active ? <BrandTag tone="moss">Active</BrandTag> : <Tag>Inactive</Tag>,
          },
          {
            title: "",
            key: "actions",
            align: "right",
            render: (_, t) => (
              <Space>
                <Button size="small" onClick={() => openEdit(t)}>
                  Edit
                </Button>
                {t.isActive ? (
                  <Popconfirm
                    title={`Deactivate ${t.name}?`}
                    description="It will be hidden from booking. Existing bookings stay as they are."
                    okText="Deactivate"
                    onConfirm={() => toggle(t)}
                  >
                    <Button size="small" danger loading={togglingId === t.id}>
                      Deactivate
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button size="small" loading={togglingId === t.id} onClick={() => toggle(t)}>
                    Reactivate
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing?.mode === "edit" ? `Edit ${editing.table.name}` : "Add table"}
        open={editing !== null}
        okText={editing?.mode === "edit" ? "Save" : "Add"}
        confirmLoading={saving}
        onOk={submit}
        onCancel={() => setEditing(null)}
        destroyOnHidden
      >
        <Form
          form={form}
          onValuesChange={clearErrorsOnChange(form)}
          layout="vertical"
          preserve={false}
          initialValues={
            editing?.mode === "edit"
              ? { name: editing.table.name, description: editing.table.description ?? "" }
              : { name: "", description: "" }
          }
          onFinish={submit}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, whitespace: true, message: "Name is required." }]}
          >
            <Input maxLength={TABLE_NAME_MAX} autoFocus />
          </Form.Item>
          <Form.Item name="description" label="Description" extra="Optional, e.g. size or terrain.">
            <Input.TextArea maxLength={TABLE_DESCRIPTION_MAX} showCount autoSize={{ minRows: 2 }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
