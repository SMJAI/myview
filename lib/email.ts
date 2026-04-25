import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'MyView <onboarding@resend.dev>'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function baseHtml(headerBg: string, headerTitle: string, body: string) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <div style="background:${headerBg};padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;color:white;font-size:18px;font-weight:700">${headerTitle}</h1>
      </div>
      <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        ${body}
        <p style="margin:28px 0 0;font-size:12px;color:#9ca3af">Physio Healing Hands · MyView &middot; <a href="https://www.myview.work" style="color:#9ca3af">myview.work</a></p>
      </div>
    </div>
  `
}

function detailsTable(rows: [string, string][]) {
  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
      ${rows.map(([label, value]) => `
        <tr>
          <td style="padding:7px 0;color:#6b7280;width:130px;vertical-align:top">${label}</td>
          <td style="padding:7px 0;font-weight:500">${value}</td>
        </tr>
      `).join('')}
    </table>
  `
}

export async function sendNewRequestNotification({
  employeeName,
  leaveType,
  startDate,
  endDate,
  daysCount,
  reason,
  managerEmails,
}: {
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  daysCount: number
  reason?: string | null
  managerEmails: string[]
}) {
  if (!process.env.RESEND_API_KEY || managerEmails.length === 0) return
  try {
    const rows: [string, string][] = [
      ['Leave type', leaveType],
      ['From', fmt(startDate)],
      ['To', fmt(endDate)],
      ['Working days', `${daysCount} day${daysCount !== 1 ? 's' : ''}`],
    ]
    if (reason) rows.push(['Reason', reason])

    const body = `
      <p style="margin:0 0 16px;font-size:15px;color:#374151">
        <strong>${employeeName}</strong> has submitted a new leave request.
      </p>
      <a href="https://www.myview.work/dashboard/manager/requests"
         style="display:inline-block;margin-bottom:24px;background:#1F9F70;color:white;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        Review Request →
      </a>
      ${detailsTable(rows)}
    `
    await resend.emails.send({
      from: FROM,
      to: managerEmails,
      subject: `New leave request from ${employeeName}`,
      html: baseHtml('#1F9F70', 'New Leave Request', body),
    })
  } catch (err) {
    console.error('[email] sendNewRequestNotification failed:', err)
  }
}

export async function sendRequestReviewedNotification({
  employeeEmail,
  employeeName,
  leaveType,
  startDate,
  endDate,
  daysCount,
  status,
  managerNote,
}: {
  employeeEmail: string
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  daysCount: number
  status: 'approved' | 'rejected'
  managerNote?: string | null
}) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const approved = status === 'approved'
    const color = approved ? '#1F9F70' : '#dc2626'
    const label = approved ? 'Approved ✅' : 'Not Approved'

    const rows: [string, string][] = [
      ['Leave type', leaveType],
      ['From', fmt(startDate)],
      ['To', fmt(endDate)],
      ['Working days', `${daysCount} day${daysCount !== 1 ? 's' : ''}`],
    ]
    if (managerNote) rows.push(['Manager note', `<em>${managerNote}</em>`])

    const body = `
      <p style="margin:0 0 16px;font-size:15px;color:#374151">
        Hi <strong>${employeeName}</strong>, your leave request has been
        <strong style="color:${color}">${approved ? 'approved' : 'not approved'}</strong>.
      </p>
      <a href="https://www.myview.work/dashboard/requests"
         style="display:inline-block;margin-bottom:24px;background:${color};color:white;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        View My Requests →
      </a>
      ${detailsTable(rows)}
    `
    await resend.emails.send({
      from: FROM,
      to: employeeEmail,
      subject: approved ? '✅ Your leave request has been approved' : 'Your leave request was not approved',
      html: baseHtml(color, `Request ${label}`, body),
    })
  } catch (err) {
    console.error('[email] sendRequestReviewedNotification failed:', err)
  }
}
