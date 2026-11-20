"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    question: "Why only a hand-curated set of languages?",
    answer:
      "The index deliberately covers common, mainstream programming languages. Niche, esoteric, or non-general-purpose languages are excluded by design — the goal is a readable picture of what most of the world builds with, not an exhaustive census of every language GitHub can tag.",
  },
  {
    question: "Do forks count?",
    answer:
      "No. Every query adds fork:false and mirror:false, so a fork created inside the window does not inflate a language's count. Only genuinely new repositories are measured.",
  },
  {
    question: "Why do these numbers differ from GitHub's own language stats?",
    answer:
      "GitHub's per-language statistics rely on Linguist tagging across all time and include historical data. This index counts repository creations inside a fixed rolling window via the search API, which reflects current activity rather than accumulated stock. Search index latency can also shift counts slightly day to day.",
  },
  {
    question: "How are the star tiers measured?",
    answer:
      "Each tier is its own GitHub search query with a stars qualifier: stars:>=2, stars:>=20, or stars:>=100. Every threshold is inclusive, and the tiers are nested — everything in the ≥100 tier is also counted in the ≥20 and ≥2 tiers. There is deliberately no zero-star tier: repositories with fewer than 2 stars, dominated by static-site detritus, are excluded from every count. Stars are counted at fetch time, so a repository that crosses a threshold right after a build is counted in its old tier until the next daily build.",
  },
  {
    question:
      "Does a multi-language repository count toward each of its languages?",
    answer:
      "No. GitHub's search API tags every repository with a single primary language — the one Linguist detects as dominant. A repository that mixes several languages counts only toward its primary one. Crediting secondary languages would require fetching each repository's language breakdown individually, millions of calls per build, and GitHub offers no aggregate endpoint for it — so the index measures primary-language activity, the same basis as GitHub's own language stats.",
  },
  {
    question: "How often does the data update?",
    answer:
      "Daily. A scheduled CI build re-fetches every count and redeploys the site each day. The one-year window is recomputed at build time from the current date, so the ranking always reflects the most recent 365 days.",
  },
  {
    question: "What happens if the API rate-limits the build?",
    answer:
      "Unauthenticated search allows 10 requests per minute per IP — and GitHub Actions shares runner IPs across many repositories, so that pool can be exhausted by other people's workflows. The daily CI build therefore authenticates with the automatically injected GITHUB_TOKEN, which grants a dedicated 30 requests per minute. The fetcher paces itself to exactly the ceiling of its mode — one request every 6 seconds unauthenticated, 2 seconds authenticated — with automatic retries after rate-limit windows and whole-pipeline recovery rounds for stragglers. If a fetch still fails, the build fails too — the site has no data to fall back on — and the previously deployed site simply stays online until the next successful build.",
  },
  {
    question: "How are the Go framework rankings measured?",
    answer:
      "Each framework is counted at one canonical package — the import its quickstart tells you to make — using pkg.go.dev's official imported-by API, which returns how many packages in the public Go module universe import it directly. Unlike the language ranking's rolling one-year window, this is a cumulative snapshot rebuilt daily, measuring adoption stock rather than new activity. The fetch is ~11 keyless requests paced at one per second, and a failed count fails the build.",
  },
  {
    question: "Why not GitHub stars or download counts for frameworks?",
    answer:
      "GitHub stars measure sentiment, not usage — a starred framework may never be imported. Go also has no public download counter: proxy.golang.org and goproxy.cn expose no per-module download-count API, and deps.dev carries no download metrics. Imported-by counts are the closest official, keyless, programmatic evidence of real adoption: packages that directly depend on the framework.",
  },
]

export default function MethodologyFaq() {
  return (
    <Accordion className="mt-6">
      {FAQS.map((faq, index) => (
        <AccordionItem key={faq.question} value={`faq-${index}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent className="leading-relaxed text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
