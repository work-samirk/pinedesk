# PineDesk prototype

Clickable prototype of the PineDesk case desk, white-labelled for Land Bank. All data is sample data.
One responsive app: desktop shows the web desk, a phone-sized screen shows the mobile app layout.

Screens: Inbox with case detail, Customers with timeline, Approvals, Team and deadlines, Reports, AI agents, Settings.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

Routes use the URL hash (for example `#/inbox/LB-2611-0418`), so it deploys as a static site.
