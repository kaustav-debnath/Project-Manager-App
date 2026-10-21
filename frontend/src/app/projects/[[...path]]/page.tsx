import { ProjectsApp } from "./ProjectsApp";

/**
 * The whole projects namespace is one client-rendered route: /projects,
 * /projects/<slug> and /projects/<slug>/boards/<boardId> are all served from
 * this single exported page, and the browser resolves the slug and board id
 * from the URL. That keeps runtime-created projects and boards reachable,
 * which a static export cannot pre-render.
 */
export function generateStaticParams() {
  return [{ path: [] }];
}

export default function ProjectsPage() {
  return <ProjectsApp />;
}
