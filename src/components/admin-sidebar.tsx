import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  FileCheck2,
  FileText,
  FolderTree,
  Home,
  Inbox,
  LogOut,
  Plug,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Tổng quan", url: "/dashboard", icon: Home, exact: true },
  { title: "Doanh nghiệp mới", url: "/dashboard/admin/companies", icon: Building2 },
  { title: "Yêu cầu Claim", url: "/dashboard/admin/claims", icon: FileCheck2 },
  { title: "Bài viết", url: "/dashboard/articles", icon: FileText },
  { title: "Chuyên mục", url: "/dashboard/categories", icon: FolderTree },
  { title: "Sửa chi tiết DN", url: "/dashboard/admin/edit", icon: Building2 },
  { title: "Leads", url: "/dashboard/leads", icon: Inbox },
  { title: "Thống kê", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Nhật ký", url: "/dashboard/audit-log", icon: ScrollText },
  { title: "Tích hợp Hermes", url: "/dashboard/integrations/hermes", icon: Plug },
];

export function AdminSidebar({ role }: { role?: string | null }) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string, exact?: boolean) =>
    exact ? currentPath === url : currentPath === url || currentPath.startsWith(`${url}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-1.5">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold leading-tight">VNSupplier</div>
            <div className="truncate text-[11px] text-muted-foreground">Admin Panel</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Nội dung</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="px-2 py-1.5 text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          Vai trò: <span className="font-medium text-foreground">{role ?? "—"}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
