export interface NavLink {
  label: string
  /** Compact label for the desktop bar. */
  short: string
  href: string
}

/** Primary navigation, shared by the header, the mobile sheet and the footer. */
export function navLinks(base: string): NavLink[] {
  return [
    { label: "Ranking", short: "Ranking", href: `${base}#ranking` },
    { label: "Breakdowns", short: "Breakdowns", href: `${base}#breakdowns` },
    { label: "Go frameworks", short: "Go", href: `${base}go/` },
    { label: "JS frameworks", short: "JS", href: `${base}js/` },
    { label: "Methodology", short: "Methodology", href: `${base}methodology/` },
  ]
}
