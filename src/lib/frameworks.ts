/**
 * The curated catalog of Go frameworks tracked by the index.
 *
 * Per the project positioning, this is a hand-curated list of mainstream,
 * general-purpose Go frameworks — not an exhaustive registry. The
 * "trending" section ranks them by their pkg.go.dev "imported by"
 * counts, so each entry carries the canonical package path used for
 * counting (`importPath`), which is not always the repository root.
 *
 * Pure data — no side effects — so both the build pipeline (`pkgsite.ts`)
 * and client-side islands may import it.
 */

export type FrameworkCategory = "web" | "rpc"

export interface FrameworkMeta {
  /** Stable slug used as the identifier across the site. */
  id: string
  /** Human-readable display name. */
  name: string
  /** Canonical pkg.go.dev package path used for imported-by counting. */
  importPath: string
  category: FrameworkCategory
  /** Upstream repository. */
  repoUrl: string
  /** Brand color (hex), used for identity swatches. */
  color: string
  /** One-line description of the framework's typical use. */
  blurb: string
}

export const FRAMEWORK_CATALOG: readonly FrameworkMeta[] = [
  {
    id: "gin",
    name: "Gin",
    importPath: "github.com/gin-gonic/gin",
    category: "web",
    repoUrl: "https://github.com/gin-gonic/gin",
    color: "#008ecb",
    blurb:
      "Battle-tested HTTP framework with a martini-like API, by Manu Arora.",
  },
  {
    id: "echo",
    name: "Echo",
    importPath: "github.com/labstack/echo/v4",
    category: "web",
    repoUrl: "https://github.com/labstack/echo",
    color: "#e6a817",
    blurb:
      "Minimalist high-performance router with middleware and HTTP/2 built in.",
  },
  {
    id: "fiber",
    name: "Fiber",
    importPath: "github.com/gofiber/fiber/v2",
    category: "web",
    repoUrl: "https://github.com/gofiber/fiber",
    color: "#00813f",
    blurb:
      "Express-inspired API layer running on top of the fast fasthttp engine.",
  },
  {
    id: "goframe",
    name: "GoFrame",
    importPath: "github.com/gogf/gf/v2/frame/g",
    category: "web",
    repoUrl: "https://github.com/gogf/gf",
    color: "#00a6fb",
    blurb:
      "Batteries-included full-stack framework with ORM, cache, and CLI tooling.",
  },
  {
    id: "hertz",
    name: "Hertz",
    importPath: "github.com/cloudwego/hertz/pkg/app",
    category: "web",
    repoUrl: "https://github.com/cloudwego/hertz",
    color: "#3e63dd",
    blurb:
      "CloudWeGo's high-performance HTTP framework, built for low latency.",
  },
  {
    id: "grpc-go",
    name: "gRPC-Go",
    importPath: "google.golang.org/grpc",
    category: "rpc",
    repoUrl: "https://github.com/grpc/grpc-go",
    color: "#2fa4e7",
    blurb:
      "Canonical Go implementation of gRPC, maintained by the gRPC project.",
  },
  {
    id: "thrift",
    name: "Thrift",
    importPath: "github.com/apache/thrift/lib/go/thrift",
    category: "rpc",
    repoUrl: "https://github.com/apache/thrift",
    color: "#d97757",
    blurb:
      "Apache Thrift's cross-language RPC and serialization stack, with an official Go library.",
  },
  {
    id: "dubbo",
    name: "Dubbo",
    importPath: "dubbo.apache.org/dubbo-go/v3",
    category: "rpc",
    repoUrl: "https://github.com/apache/dubbo-go",
    color: "#e8a33d",
    blurb:
      "Apache Dubbo's Go implementation — Java-born RPC extended to Go services.",
  },
  {
    id: "kitex",
    name: "Kitex",
    importPath: "github.com/cloudwego/kitex/server",
    category: "rpc",
    repoUrl: "https://github.com/cloudwego/kitex",
    color: "#e5484d",
    blurb:
      "CloudWeGo's RPC framework with codegen-first ergonomics and high throughput.",
  },
] as const
