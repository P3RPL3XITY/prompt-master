# Prompt Master

A Claude Code mod that turns your rough prompt into a better one before you send it.

Type a messy draft in the prompt box, click **✨ Prompt Master** (just above the box), and Claude rewrites it in place: goal stated up front, clear task and constraints, typos fixed, filler removed. Your intent, names, file paths and code are kept exactly; nothing is invented. Nothing is sent until you press Enter, and **Undo rewrite** puts your original back.

You can also run it as a slash command: `/prompt-master`.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install prompt-master --marketplace P3RPL3XITY/prompt-master
```

Answer `y` to add the marketplace, then pick a scope (user scope makes it work in every session).

From a shell:

```bash
claude plugin install prompt-master --marketplace P3RPL3XITY/prompt-master
```

In the Claude desktop app: click **+** next to the prompt box → **Plugins** → **Add marketplace** with `P3RPL3XITY/prompt-master`, then **Add plugin**.

## Customize

The rewrite instructions are the `SYSTEM` text at the top of `hooks/register.tsx`, and the model is set in the `$.model.complete` call (default `sonnet`). Edit either to change the style.

## License

MIT
