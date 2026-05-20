import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect authenticated task routes to the public task page
// All tasks are now handled in a unified public page at /tasks/$taskId
export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/tasks/$taskId", params: { taskId: params.taskId } });
  },
  component: () => null,
});
