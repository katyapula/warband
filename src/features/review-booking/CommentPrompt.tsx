"use client";

import { Alert, Flex, Input, Modal, Typography } from "antd";
import { useState, useTransition } from "react";
import { ADMIN_COMMENT_MAX } from "@/entities/booking/adminInput";

/**
 * A small modal asking for the admin comment before an action (cancel) or
 * on its own. The comment is visible to the booker and admins.
 */
export function CommentPrompt({
  title,
  description,
  okText,
  danger,
  initialComment,
  onSubmit,
  onClose,
}: {
  title: string;
  description?: string;
  okText: string;
  danger?: boolean;
  initialComment: string | null;
  onSubmit: (comment: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onClose: () => void;
}) {
  const [comment, setComment] = useState(initialComment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Modal
      open
      title={title}
      okText={okText}
      okButtonProps={{ danger, loading: pending }}
      cancelButtonProps={{ disabled: pending }}
      onCancel={onClose}
      onOk={() =>
        startTransition(async () => {
          setError(null);
          const result = await onSubmit(comment);
          if (result.ok) onClose();
          else setError(result.error);
        })
      }
    >
      <Flex vertical gap={8}>
        {description && <Typography.Text>{description}</Typography.Text>}
        <label htmlFor="admin-comment">
          <Typography.Text type="secondary">Admin comment (the booker sees it)</Typography.Text>
        </label>
        <Input.TextArea
          id="admin-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={ADMIN_COMMENT_MAX}
          autoSize={{ minRows: 2, maxRows: 6 }}
          autoFocus
        />
        {error && <Alert type="error" role="alert" message={error} />}
      </Flex>
    </Modal>
  );
}
