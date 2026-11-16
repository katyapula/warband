"use client";

import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ADMIN_NOTES_MAX,
  FULL_NAME_MAX,
  PHONE_MAX,
  USERNAME_MAX,
} from "@/entities/user/model";
import type { MemberRow } from "@/entities/user/repository";
import { applyFieldErrors, clearErrorsOnChange } from "@/shared/ui/fieldErrors";
import { setMemberRoleAction, updateMemberAction } from "./actions";

export type MemberListRow = Omit<MemberRow, "createdAt"> & {
  isYou: boolean;
  /** Why this member's role can't be changed by the viewer, or null. */
  roleLock: string | null;
};

type Values = {
  username: string;
  fullName: string;
  phone: string;
  telegram: string;
  adminNotes: string;
};

const dash = <Typography.Text type="secondary">—</Typography.Text>;

function matches(m: MemberListRow, query: string): boolean {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return true;
  return [m.username, m.fullName, m.email, m.phone, m.telegram].some((v) =>
    v?.toLocaleLowerCase().includes(q),
  );
}

export function MembersManager({ members }: { members: MemberListRow[] }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<Values>();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MemberListRow | null>(null);
  const [saving, startSaving] = useTransition();
  const [changingId, setChangingId] = useState<string | null>(null);

  const visible = useMemo(() => members.filter((m) => matches(m, query)), [members, query]);

  async function submit() {
    if (!editing) return;
    const values = await form.validateFields();
    startSaving(async () => {
      const result = await updateMemberAction(editing.id, values);
      if (!result.ok) {
        if (!applyFieldErrors(form, result.fieldErrors)) message.error(result.error);
        return;
      }
      message.success(`${values.username} saved.`);
      setEditing(null);
      router.refresh();
    });
  }

  async function changeRole(m: MemberListRow) {
    const to = m.role === "ADMIN" ? "MEMBER" : "ADMIN";
    setChangingId(m.id);
    const result = await setMemberRoleAction(m.id, to);
    setChangingId(null);
    if (!result.ok) return message.error(result.error);
    message.success(to === "ADMIN" ? `${m.username} is now an admin.` : `${m.username} is now a member.`);
    router.refresh();
  }

  return (
    <>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }} wrap>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Members
        </Typography.Title>
        <Input.Search
          placeholder="Search name, email, phone, Telegram"
          aria-label="Search members"
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 320, maxWidth: "100%" }}
        />
      </Space>

      <Table<MemberListRow>
        rowKey="id"
        dataSource={visible}
        pagination={false}
        scroll={{ x: true }}
        locale={{ emptyText: query ? "No members match your search." : "No members yet." }}
        columns={[
          {
            title: "Username",
            dataIndex: "username",
            render: (username: string, m) => (
              <Space size={4}>
                {username}
                {m.isYou && <Tag>You</Tag>}
              </Space>
            ),
          },
          { title: "Full name", dataIndex: "fullName", render: (v: string | null) => v ?? dash },
          { title: "Email", dataIndex: "email" },
          { title: "Phone", dataIndex: "phone", render: (v: string | null) => v ?? dash },
          {
            title: "Telegram",
            dataIndex: "telegram",
            render: (v: string | null) => (v ? `@${v}` : dash),
          },
          {
            title: "Role",
            dataIndex: "role",
            render: (role: MemberListRow["role"]) =>
              role === "ADMIN" ? <Tag color="red">Admin</Tag> : <Tag>Member</Tag>,
          },
          {
            title: "",
            key: "actions",
            align: "right",
            render: (_, m) => {
              const roleLabel = m.role === "ADMIN" ? "Remove admin" : "Make admin";
              const roleButton = (
                <Button
                  size="small"
                  danger={m.role === "ADMIN"}
                  disabled={m.roleLock !== null}
                  loading={changingId === m.id}
                >
                  {roleLabel}
                </Button>
              );
              return (
                <Space>
                  <Button size="small" onClick={() => setEditing(m)}>
                    Edit
                  </Button>
                  {m.roleLock ? (
                    <Tooltip title={m.roleLock}>
                      {/* A disabled button swallows hover; the span keeps the tooltip working. */}
                      <span tabIndex={0} aria-label={`${roleLabel}: ${m.roleLock}`}>
                        {roleButton}
                      </span>
                    </Tooltip>
                  ) : (
                    <Popconfirm
                      title={
                        m.role === "ADMIN"
                          ? `Remove admin from ${m.username}?`
                          : `Make ${m.username} an admin?`
                      }
                      description={
                        m.role === "ADMIN"
                          ? "They'll lose access to admin pages."
                          : "They'll be able to manage bookings, members, tables and settings."
                      }
                      okText={roleLabel}
                      onConfirm={() => changeRole(m)}
                    >
                      {roleButton}
                    </Popconfirm>
                  )}
                </Space>
              );
            },
          },
        ]}
      />

      <Modal
        title={editing ? `Edit ${editing.username}` : ""}
        open={editing !== null}
        okText="Save"
        confirmLoading={saving}
        onOk={submit}
        onCancel={() => setEditing(null)}
        destroyOnHidden
      >
        {editing && (
          <Form
            form={form}
            onValuesChange={clearErrorsOnChange(form)}
            layout="vertical"
            preserve={false}
            onFinish={submit}
            initialValues={{
              username: editing.username,
              fullName: editing.fullName ?? "",
              phone: editing.phone ?? "",
              telegram: editing.telegram ?? "",
              adminNotes: editing.adminNotes ?? "",
            }}
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, whitespace: true, message: "Username is required." }]}
            >
              <Input maxLength={USERNAME_MAX} />
            </Form.Item>
            <Form.Item label="Email" extra="Their Google sign-in. It can't be changed.">
              <Input value={editing.email} disabled />
            </Form.Item>
            <Form.Item name="fullName" label="Full name">
              <Input maxLength={FULL_NAME_MAX} />
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input maxLength={PHONE_MAX} inputMode="tel" />
            </Form.Item>
            <Form.Item name="telegram" label="Telegram">
              <Input addonBefore="@" maxLength={33} />
            </Form.Item>
            <Form.Item name="adminNotes" label="Admin notes" extra="Only admins see these.">
              <Input.TextArea maxLength={ADMIN_NOTES_MAX} showCount autoSize={{ minRows: 3 }} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
}
