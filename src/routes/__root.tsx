import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Activity } from "react";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { inDevelopment } from "@/constants";
import BaseLayout from "@/layouts/base-layout";

function Root() {
  return (
    <BaseLayout
      leftPanel={
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent className="text-muted-foreground px-2 text-xs">
              Add navigation or a file tree here.
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      }
      rightPanel={
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Details</SidebarGroupLabel>
            <SidebarGroupContent className="text-muted-foreground px-2 text-xs">
              Add details or an inspector here.
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      }
    >
      <Outlet />
      <Activity mode={inDevelopment ? "visible" : "hidden"}>
        <TanStackRouterDevtools />
      </Activity>
    </BaseLayout>
  );
}

export const Route = createRootRoute({
  component: Root,
});
