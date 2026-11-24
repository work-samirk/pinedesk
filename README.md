# PineDesk prototype

Clickable prototype of PineDesk, an AI-first ticketing desk for bank support teams, shown as the Land Bank workspace. All data is sample data.
One responsive app: desktop shows the web desk, a phone-sized screen shows the mobile layout.

## Screens

- **Inbox**: saved views, channel filters, whose-turn chips, case view with stage bar, AI summary, one thread across channels, AI draft review, private notes, ticket timer and click to call (simulated).
- **Customers**: list, and a profile page with AI summary, timeline with channel logos, cases, details, documents, audit trail and notes. Unmatched social contacts can be linked.
- **Approvals**, **Team and deadlines**, **Reports**, **AI agents** (with the pipeline each agent supplies), **Settings** (colour set per bank).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

Routes use the URL hash (for example `#/inbox/LB-2611-0409`), so it deploys as a static site.

## Theme

Colours and type are CSS variables in `src/styles.css`. A bank re-colours the product with four values (sidebar, primary, primary hover, selected tint). The Land Bank green set is applied from Settings, Brand, or by setting `data-tenant="landbank"` on the `html` element.
