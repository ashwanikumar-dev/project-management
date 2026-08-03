import { Inngest, step } from "inngest";
import prisma from "../prisma.js";
import sendEmail from "../../configs/nodemailer.js";

export const inngest = new Inngest({ id: "project-management" });

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk", triggers: [{ event: "clerk/user.created" }] },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.create({
      data: {
        id: data.id,
        email: data.email_addresses?.[0]?.email_address,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
        image: data?.image_url,
      },
    });
  },
);

const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk", triggers: [{ event: "clerk/user.deleted" }] },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.delete({
      where: { id: data.id },
    });
  },
);

const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk", triggers: [{ event: "clerk/user.updated" }] },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.update({
      where: { id: data.id },
      data: {
        email: data.email_addresses?.[0]?.email_address,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
        image: data?.image_url,
      },
    });
  },
);

const syncWorkspaceCreation = inngest.createFunction(
  {
    id: "sync-workspace-from-clerk",
    triggers: [{ event: "clerk/organization.created" }],
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        ownerId: data.created_by,
        slug: data.slug,
        image_url: data.image_url,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: "ADMIN",
      },
    });
  },
);

const syncWorkspaceUpdation = inngest.createFunction(
  {
    id: "sync-workspace-update",
    triggers: [{ event: "clerk/organization.updation" }],
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url,
      },
    });
  },
);

const syncWorkspaceDeletion = inngest.createFunction(
  {
    id: "sync-workspace-delete",
    triggers: [{ event: "clerk/organization.deleted" }],
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.delete({
      where: { id: data.id },
    });
  },
);

const syncWorkspaceMemberCreation = inngest.createFunction(
  {
    id: "sync-workspace-member-create",
    triggers: [{ event: "clerk/organizationInvitation.accepted" }],
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: String(data.role.name).toUpperCase(),
      },
    });
  },
);

const sendTaskAssignmentEmail = inngest.createFunction(
  {
    id: "send-task-assignment-mail",
    triggers: [{ event: "app/task.assigned" }],
  },
  async ({ event }) => {
    const { taskId, origin } = event.data;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, project: true },
    });

    await sendEmail({
      to: task.assignee.email,
      subject: `New Task Assignment in ${task.project.name}`,
      body: `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">

  <h2 style="margin: 0 0 20px; color: #111827;">
    ⏰ Task Reminder
  </h2>

  <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
    Hi <strong>${task.assignee.name}</strong>,
  </p>

  <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
    This is a friendly reminder that your assigned task is due soon. Please make sure it is completed before the deadline.
  </p>

  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 24px 0;">

    <p style="margin: 0 0 12px;">
      <strong>Task:</strong> ${task.title}
    </p>

    <p style="margin: 0;">
      <strong>Due Date:</strong>
      ${new Date(task.due_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </p>

  </div>

  <a
    href="${origin}"
    style="display: inline-block; padding: 12px 22px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;"
  >
    View Task
  </a>

  <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
    If the button above doesn't work, copy and paste the following link into your browser:
  </p>

  <p style="margin: 8px 0 0; word-break: break-all; color: #2563eb; font-size: 14px;">
    ${origin}
  </p>

  <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="margin: 0; color: #9ca3af; font-size: 13px;">
    This is an automated notification from <strong>Viora</strong>. Please do not reply to this email.
  </p>

</div>
`,
    });
    if (
      new Date(task.due_date).toLocaleDateString() !==
      new Date(task.due_date).toDateString()
    ) {
      await step.sleepUntil("wait-for-the-due-date", new Date(task.due_date));

      await step.run("check-if-task-is-completed", async () => {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: true, project: true },
        });
        if (!task) return;
        if (task.status !== "DONE") {
          await step.run("send-task-reminder-mail", async () => {
            await sendEmail({
              to: task.assignee.email,
              subject: `Reminder for ${task.project.name}`,
              body: `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">

  <h2 style="margin: 0 0 20px; color: #111827;">
    ⏰ Task Reminder
  </h2>

  <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
    Hi <strong>${task.assignee.name}</strong>,
  </p>

  <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
    This is a friendly reminder that your assigned task is due soon. Please make sure it is completed before the deadline.
  </p>

  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 24px 0;">

    <p style="margin: 0 0 12px;">
      <strong>Task:</strong> ${task.title}
    </p>

    <p style="margin: 0;">
      <strong>Due Date:</strong>
      ${new Date(task.due_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </p>

  </div>

  <a
    href="${origin}"
    style="display: inline-block; padding: 12px 22px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;"
  >
    View Task
  </a>

  <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
    If the button above doesn't work, copy and paste the following link into your browser:
  </p>

  <p style="margin: 8px 0 0; word-break: break-all; color: #2563eb; font-size: 14px;">
    ${origin}
  </p>

  <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="margin: 0; color: #9ca3af; font-size: 13px;">
    This is an automated notification from <strong>Viora</strong>. Please do not reply to this email.
  </p>

</div>
`,
            });
          });
        }
      });
    }
  },
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceDeletion,
  syncWorkspaceUpdation,
  syncWorkspaceMemberCreation,
  sendTaskAssignmentEmail,
];
