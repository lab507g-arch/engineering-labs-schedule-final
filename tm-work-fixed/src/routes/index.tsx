import { createFileRoute } from "@tanstack/react-router";
import ScheduleApp from "@/components/ScheduleApp";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Engineering Labs Schedule" },
      { name: "description", content: "View and filter the engineering laboratory timetable." },
      { property: "og:title", content: "Engineering Labs Schedule" },
      { property: "og:description", content: "View and filter the engineering laboratory timetable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScheduleApp,
});
