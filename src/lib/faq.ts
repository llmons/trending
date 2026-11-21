export interface FaqItem {
  question: string
  answer: string
}

export const FAQS: FaqItem[] = [
  {
    question: "Why only a hand-curated set of languages?",
    answer:
      "The index covers common, mainstream programming languages. Niche, esoteric, and non-general-purpose languages are excluded by design — the goal is a readable picture of what most of the world builds with, not a census of every tag GitHub can apply.",
  },
  {
    question: "Do forks count?",
    answer:
      "No. Every query adds fork:false and mirror:false, so a fork created inside the window does not inflate a language's count. Only genuinely new repositories are measured.",
  },
  {
    question: "Why do these numbers differ from GitHub's own language stats?",
    answer:
      "GitHub's per-language statistics rely on Linguist tagging across all time and include historical data. This index counts repository creations inside a fixed rolling window via the search API, which reflects current activity rather than accumulated stock. Search index latency can also shift counts slightly from day to day.",
  },
  {
    question: "How are the star tiers measured?",
    answer:
      "Each tier is its own GitHub search query with a stars qualifier: stars:>=2, stars:>=20, or stars:>=100. Every threshold is inclusive, and the tiers are nested — everything in the ≥100 tier is also counted in the ≥20 and ≥2 tiers. There is deliberately no zero-star tier: repositories below 2 stars, dominated by throwaway experiments, are excluded from every count. Stars are read at fetch time, so a repository that crosses a threshold right after a build is counted in its old tier until the next daily build.",
  },
  {
    question:
      "Does a multi-language repository count toward each of its languages?",
    answer:
      "No. GitHub's search API tags every repository with a single primary language — the one Linguist detects as dominant. A repository that mixes several languages counts only toward its primary one. Crediting secondary languages would take one API call per repository, millions per build, and GitHub offers no aggregate endpoint for it — so the index measures primary-language activity, the same basis as GitHub's own language stats.",
  },
  {
    question: "How often does the data update?",
    answer:
      "Daily. A scheduled CI build re-fetches every count and redeploys the site each day. The one-year window is recomputed at build time from the current date, so the ranking always covers the most recent 365 days.",
  },
  {
    question: "What happens if the API rate-limits the build?",
    answer:
      "Unauthenticated search allows 10 requests per minute per IP, and GitHub Actions shares runner IPs across many repositories, so that pool can be exhausted by other people's workflows. The daily build therefore authenticates with the automatically injected GITHUB_TOKEN, which grants a dedicated 30 requests per minute. The fetcher paces itself to exactly the ceiling of its mode — one request every 6 seconds unauthenticated, 2 seconds authenticated — retries after rate-limit windows, and runs recovery rounds for stragglers. If a fetch still fails, the build fails too and the previously deployed site stays online until the next successful build.",
  },
  {
    question: "How are the Go framework rankings measured?",
    answer:
      "Each framework is counted at one canonical package — the import its quickstart tells you to make — using pkg.go.dev's official imported-by API, which reports how many packages in the public Go module universe import it directly. Unlike the language ranking's rolling one-year window, this is a cumulative snapshot rebuilt daily: adoption stock rather than new activity. About 9 keyless requests paced at one per second, and a failed count fails the build.",
  },
  {
    question: "How are the JS framework rankings measured?",
    answer:
      "Each of the five tracked meta-frameworks is counted at its own npm package — next, astro, @sveltejs/kit, nuxt, @solidjs/start — using the public npm downloads API. The figure is installs over the registry's trailing 30 days, a snapshot rebuilt daily. The meta-framework is counted rather than the renderer on purpose: svelte and solid-js are pulled in transitively by tooling and other libraries, so counting them would measure the surrounding ecosystem and rank Solid roughly fifty times too high. Five keyless requests paced at one per second, and a failed count fails the build.",
  },
  {
    question: "Why not GitHub stars for frameworks?",
    answer:
      "Stars measure attention, not usage — a starred framework may never be imported or installed. For Go, the closest keyless adoption signal is pkg.go.dev imported-by, because Go publishes no public download counter: proxy.golang.org and goproxy.cn expose no per-module download API, and deps.dev carries no download metrics. For JS the registry does publish install totals, so that section uses them instead, with its own caveats. Neither section uses stars.",
  },
]
