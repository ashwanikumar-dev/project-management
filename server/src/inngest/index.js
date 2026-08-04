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
    console.log(JSON.stringify(event.data, null, 2));
    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: "MEMBER",
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
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 620px; margin: 0 auto; background: #f5f7fb; padding: 32px;">

  <div style="background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e5e7eb; box-shadow:0 8px 30px rgba(0,0,0,0.05);">

    <div style="padding:32px; background:linear-gradient(135deg,#2563eb,#3b82f6); text-align:center;">
      <div style="font-size:42px;">⏰</div>

      <h1 style="margin:16px 0 8px; color:white; font-size:28px; font-weight:700;">
        Task Reminder
      </h1>

      <p style="margin:0; color:rgba(255,255,255,0.9); font-size:15px;">
        Your deadline is approaching.
      </p>
    </div>

    <div style="padding:32px;">

      <p style="margin:0 0 16px; color:#374151; font-size:16px;">
        Hi <strong>${task.assignee.name}</strong>,
      </p>

      <p style="margin:0 0 28px; color:#6b7280; font-size:15px; line-height:1.7;">
        This is a reminder that one of your assigned tasks is approaching its due date.
        Please review it and complete the remaining work before the deadline.
      </p>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:24px;">

        <div style="margin-bottom:18px;">
          <div style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.08em;">
            Task
          </div>

          <div style="margin-top:6px; font-size:18px; font-weight:700; color:#111827;">
            ${task.title}
          </div>
        </div>

        <div>
          <div style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.08em;">
            Due Date
          </div>

          <div style="margin-top:6px; display:inline-block; padding:8px 14px; border-radius:999px; background:#dbeafe; color:#1d4ed8; font-weight:600;">
            ${new Date(task.due_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

      </div>

      <div style="text-align:center; margin:36px 0;">

        <a
  href="${origin}"
  style="
    display:inline-block;
    background-color:#2563eb;
    background:#2563eb;
    color:#ffffff !important;
    text-decoration:none;
    font-weight:700;
    font-size:15px;
    line-height:20px;
    padding:14px 28px;
    border-radius:10px;
    border:1px solid #2563eb;
    mso-padding-alt:0;
  "
>
  <span style="color:#ffffff !important;">
    View Task →
  </span>
</a>

      </div>

      <p style="margin:0; color:#9ca3af; font-size:14px; text-align:center;">
        If the button doesn't work, open this link:
      </p>

      <p style="margin:10px 0 0; text-align:center; word-break:break-word;">
        <a href="${origin}" style="color:#2563eb; text-decoration:none;">
          ${origin}
        </a>
      </p>

    </div>

    <div style="padding:22px; background:#f9fafb; border-top:1px solid #e5e7eb; text-align:center;">

      <p style="margin:0; font-size:13px; color:#9ca3af;">
        Sent automatically by <strong>Viora</strong> • Please do not reply.
      </p>

    </div>

  </div>

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
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 620px; margin: 0 auto; background: #f5f7fb; padding: 32px;">

  <div style="background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e5e7eb; box-shadow:0 8px 30px rgba(0,0,0,0.05);">

    <div style="padding:32px; background:linear-gradient(135deg,#2563eb,#3b82f6); text-align:center;">
      <div style="font-size:42px;">⏰</div>

      <h1 style="margin:16px 0 8px; color:white; font-size:28px; font-weight:700;">
        Task Reminder
      </h1>

      <p style="margin:0; color:rgba(255,255,255,0.9); font-size:15px;">
        Your deadline is approaching.
      </p>
    </div>

    <div style="padding:32px;">

      <p style="margin:0 0 16px; color:#374151; font-size:16px;">
        Hi <strong>${task.assignee.name}</strong>,
      </p>

      <p style="margin:0 0 28px; color:#6b7280; font-size:15px; line-height:1.7;">
        This is a reminder that one of your assigned tasks is approaching its due date.
        Please review it and complete the remaining work before the deadline.
      </p>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:24px;">

        <div style="margin-bottom:18px;">
          <div style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.08em;">
            Task
          </div>

          <div style="margin-top:6px; font-size:18px; font-weight:700; color:#111827;">
            ${task.title}
          </div>
        </div>

        <div>
          <div style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.08em;">
            Due Date
          </div>

          <div style="margin-top:6px; display:inline-block; padding:8px 14px; border-radius:999px; background:#dbeafe; color:#1d4ed8; font-weight:600;">
            ${new Date(task.due_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

      </div>

      <div style="text-align:center; margin:36px 0;">

        <a
  href="${origin}"
  style="
    display:inline-block;
    background-color:#2563eb;
    background:#2563eb;
    color:#ffffff !important;
    text-decoration:none;
    font-weight:700;
    font-size:15px;
    line-height:20px;
    padding:14px 28px;
    border-radius:10px;
    border:1px solid #2563eb;
    mso-padding-alt:0;
  "
>
  <span style="color:#ffffff !important;">
    View Task →
  </span>
</a>

      </div>

      <p style="margin:0; color:#9ca3af; font-size:14px; text-align:center;">
        If the button doesn't work, open this link:
      </p>

      <p style="margin:10px 0 0; text-align:center; word-break:break-word;">
        <a href="${origin}" style="color:#2563eb; text-decoration:none;">
          ${origin}
        </a>
      </p>

    </div>

    <div style="padding:22px; background:#f9fafb; border-top:1px solid #e5e7eb; text-align:center;">

      <p style="margin:0; font-size:13px; color:#9ca3af;">
        Sent automatically by <strong>Viora</strong> • Please do not reply.
      </p>

    </div>

  </div>

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
