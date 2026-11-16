"use client";

import { Descriptions, Modal, Tag, Typography } from "antd";
import Link from "next/link";

/** What an admin sees of a member. Dates are ISO strings (serialisable). */
export type MemberCard = {
  id: string;
  username: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  telegram: string | null;
  adminNotes: string | null;
  role: "MEMBER" | "ADMIN";
  createdAt: string;
};

const dash = <Typography.Text type="secondary">—</Typography.Text>;

/** Admin-only: a member's profile, opened from their username on the day view. */
export function MemberCardModal({ member, onClose }: { member: MemberCard | null; onClose: () => void }) {
  return (
    <Modal
      open={member !== null}
      onCancel={onClose}
      footer={null}
      title={
        member && (
          <span>
            {member.username}{" "}
            {member.role === "ADMIN" ? <Tag color="red">Admin</Tag> : <Tag>Member</Tag>}
          </span>
        )
      }
    >
      {member && (
        <>
          <Descriptions
            column={1}
            size="small"
            items={[
              { key: "fullName", label: "Full name", children: member.fullName ?? dash },
              {
                key: "email",
                label: "Email",
                children: <a href={`mailto:${member.email}`}>{member.email}</a>,
              },
              {
                key: "phone",
                label: "Phone",
                children: member.phone ? <a href={`tel:${member.phone.replace(/\s/g, "")}`}>{member.phone}</a> : dash,
              },
              {
                key: "telegram",
                label: "Telegram",
                children: member.telegram ? (
                  <a href={`https://t.me/${member.telegram}`} target="_blank" rel="noreferrer">
                    @{member.telegram}
                  </a>
                ) : (
                  dash
                ),
              },
              {
                key: "since",
                label: "Member since",
                children: new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(member.createdAt)),
              },
              {
                key: "notes",
                label: "Admin notes",
                children: member.adminNotes ? (
                  <span style={{ whiteSpace: "pre-wrap" }}>{member.adminNotes}</span>
                ) : (
                  dash
                ),
              },
            ]}
          />
          <Typography.Paragraph type="secondary" style={{ margin: "12px 0 0", fontSize: 13 }}>
            Only admins see this. Edit in <Link href="/admin/members">Admin → Members</Link>.
          </Typography.Paragraph>
        </>
      )}
    </Modal>
  );
}
