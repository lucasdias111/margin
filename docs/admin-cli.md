# Admin CLI

The server image includes a small `margin` command for things you can't do from the app. Run it inside the running server container, from the install directory:

```sh
cd /opt/margin
docker compose exec margin-server margin <command>
```

Shell access to the host is the authority here: anyone who can run `docker compose exec` can use these commands.

## reset-password

```sh
docker compose exec margin-server margin reset-password someone@example.com
```

Prints a one-time link that lets that account set a new password. It's valid for 7 days, works once, and replaces any earlier reset link for that account. Use it when the last admin is locked out, or when there's no [mail](mail.md) and no other admin to issue a link from **Instance admin → Accounts**.

Send the link to the person privately: whoever opens it can take over the account.

If no account has that email, it says so and exits with an error.

## setup-link

```sh
docker compose exec margin-server margin setup-link
```

Prints the one-time link that creates the first admin, while the instance has no accounts yet. See [install](install.md#create-the-first-admin). Once any account exists, it says there is no setup link.

The link changes every time the server restarts, so print it again rather than reusing an old one.

## Errors

| Message | Meaning |
|---|---|
| `Can't reach the margin server …` | The server isn't up yet or has crashed. Check `docker compose ps` and `docker compose logs margin-server`. |
| `The server refused the request …` | The container's `INTERNAL_API_KEY` doesn't match the running server's, usually after editing `.env` without `docker compose up -d`. |
| `INTERNAL_API_KEY is not set in this container.` | `.env` is missing it; it's required. |

The CLI talks to the server over `127.0.0.1` inside the container, through an internal API guarded by `INTERNAL_API_KEY` that isn't reachable from outside.
