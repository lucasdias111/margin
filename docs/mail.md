# Mail (SMTP)

Mail is optional. An instance without it is fully usable.

| | Without mail | With mail |
|---|---|---|
| New accounts | active immediately | must verify their email first (an instance setting, on by default) |
| Forgotten passwords | the sign-in page says to contact an admin, who copies a one-time reset link from **Instance admin → Accounts** | self-service reset by email |
| Meeting invites | hosts share the guest link and download a calendar file (`.ics`) | hosts can also email invites with the calendar file attached |
| Admin | mail status shows as off | mail status, and a button to send a test email |

## Set it up

Add your provider's SMTP details to `/opt/margin/.env` (the installer asks for them too):

```sh
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_FROM=noreply@chat.example.com
```

Apply it with `docker compose up -d`, then send a test email from **Instance admin → Email**.

- The server connects with **STARTTLS and requires it**, usually on port 587. Implicit TLS on port 465 isn't supported, nor is unauthenticated plain SMTP.
- `SMTP_FROM` defaults to `noreply@DOMAIN`. Use an address your provider lets you send from, and set up SPF and DKIM for its domain so mail isn't marked as spam.
- Transactional providers (Postmark, Mailgun, Amazon SES, Brevo and others) and most mailbox providers' SMTP submission work.

Turning mail on later turns the **Require email verification** setting on for new sign-ups; existing accounts aren't affected. You can turn it off under **Instance admin**.
