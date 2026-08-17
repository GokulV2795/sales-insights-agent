const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export function IconDashboard(props) {
  return (
    <svg {...common} {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconProduct(props) {
  return (
    <svg {...common} {...props}>
      <path d="M21 8L12 3 3 8l9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

export function IconFinance(props) {
  return (
    <svg {...common} {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-5 3 3 5-7" />
    </svg>
  );
}

export function IconRevOps(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </svg>
  );
}

export function IconReports(props) {
  return (
    <svg {...common} {...props}>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

export function IconChat(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 4h16v12H7l-3 3V4z" />
    </svg>
  );
}

export function IconRevenue(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.2c0-1 1-1.7 2.5-1.7s2.5.8 2.5 1.8-1 1.5-2.5 1.7-2.5.7-2.5 1.7 1 1.8 2.5 1.8 2.5-.7 2.5-1.7" />
    </svg>
  );
}

export function IconOrders(props) {
  return (
    <svg {...common} {...props}>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  );
}

export function IconTag(props) {
  return (
    <svg {...common} {...props}>
      <path d="M20 12.5L12.5 20 4 11.5V4h7.5L20 12.5z" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8" r="2.4" />
      <path d="M15.5 14.2c2.6.4 4.5 2.7 4.5 5.8" />
    </svg>
  );
}

export function IconRefresh(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" />
      <path d="M18 4v4h-4M6 20v-4h4" />
    </svg>
  );
}

export function IconTrend(props) {
  return (
    <svg {...common} {...props}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

export function IconCrown(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 18h16l-1.5-9-4 3-2.5-5-2.5 5-4-3L4 18z" />
    </svg>
  );
}

export function IconGrid(props) {
  return (
    <svg {...common} {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

export function IconGlobe(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18 14 14 0 010-18z" />
    </svg>
  );
}

export function IconChannel(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="12" r="2.2" />
      <path d="M7.8 7.2L16.2 11M7.8 16.8L16.2 13" />
    </svg>
  );
}
