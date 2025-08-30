export const track = (event: string, props?: Record<string, unknown>) => {
  // TODO: wire to production analytics
  if (typeof window !== "undefined") console.debug("[analytics]", event, props || {});
};