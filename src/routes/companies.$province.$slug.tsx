import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/companies/$province/$slug")({
  loader: ({ params }) => {
    throw redirect({
      to: "/company/$slug",
      params: { slug: params.slug },
      statusCode: 301,
    });
  },
  component: () => null,
});

