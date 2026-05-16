// src/harvesters/github.mjs
// Pull recent public events for a GitHub user, convert each meaningful event
// into a Kinetic capture shape ({ text, image_caption }).
//
// No auth required for public events. Rate limit is 60 req/hour per IP for
// unauthenticated callers; one harvest call is one request, so the demo is
// well inside that budget.
//
// Returns at most `max` items, sorted newest first.

const _node = globalThis.process;
const API_BASE = "https://api.github.com";

/**
 * @param {{ username: string, max?: number, sinceHours?: number }} opts
 * @returns {Promise<Array<{ source_id: string, text: string, image_caption: string, occurred_at: string }>>}
 */
export async function harvest({ username, max = 5, sinceHours = 168 }) {
  if (!username || typeof username !== "string") {
    throw new Error("github harvester: `username` is required");
  }
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "kinetic-demo" };
  const token = _node.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE}/users/${encodeURIComponent(username)}/events/public?per_page=30`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`github ${res.status}: ${body.slice(0, 300)}`);
  }
  const events = await res.json();

  const cutoff = Date.now() - sinceHours * 3600 * 1000;
  const items = [];
  for (const ev of events) {
    if (Date.parse(ev.created_at) < cutoff) continue;
    const item = mapEvent(ev);
    if (item) items.push(item);
    if (items.length >= max) break;
  }
  return items;
}

function mapEvent(ev) {
  const repo = ev?.repo?.name || "unknown/repo";
  const when = ev.created_at;
  switch (ev.type) {
    case "PushEvent": {
      const commits = (ev.payload?.commits || []).slice(0, 3);
      if (commits.length === 0) return null;
      const messages = commits.map((c) => `- ${c.message.split("\n")[0]}`).join("\n");
      const branch = ev.payload?.ref?.replace("refs/heads/", "") || "main";
      return {
        source_id: `gh-push-${ev.id}`,
        text: `Pushed ${commits.length} commit(s) to ${repo}@${branch}:\n${messages}`,
        image_caption: "",
        occurred_at: when,
      };
    }
    case "PullRequestEvent": {
      const pr = ev.payload?.pull_request;
      const action = ev.payload?.action || "updated";
      if (!pr) return null;
      return {
        source_id: `gh-pr-${ev.id}`,
        text: `${capitalize(action)} pull request in ${repo}: "${pr.title}". ${pr.body ? pr.body.slice(0, 280) : ""}`.trim(),
        image_caption: pr.html_url ? `PR ${pr.html_url}` : "",
        occurred_at: when,
      };
    }
    case "PullRequestReviewEvent": {
      const pr = ev.payload?.pull_request;
      if (!pr) return null;
      return {
        source_id: `gh-review-${ev.id}`,
        text: `Reviewed pull request in ${repo}: "${pr.title}".`,
        image_caption: "",
        occurred_at: when,
      };
    }
    case "IssuesEvent": {
      const issue = ev.payload?.issue;
      const action = ev.payload?.action || "updated";
      if (!issue) return null;
      return {
        source_id: `gh-issue-${ev.id}`,
        text: `${capitalize(action)} issue in ${repo}: "${issue.title}". ${issue.body ? issue.body.slice(0, 200) : ""}`.trim(),
        image_caption: "",
        occurred_at: when,
      };
    }
    case "CreateEvent": {
      const refType = ev.payload?.ref_type;
      const ref = ev.payload?.ref;
      if (!refType) return null;
      return {
        source_id: `gh-create-${ev.id}`,
        text: `Created ${refType}${ref ? ` "${ref}"` : ""} in ${repo}.`,
        image_caption: "",
        occurred_at: when,
      };
    }
    default:
      return null;
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
