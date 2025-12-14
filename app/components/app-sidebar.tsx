"use client"

import { Folder, CheckSquare2, BarChart3 } from "lucide-react"
import { Link } from "react-router"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"

const navItems = [
  { label: "Projects", href: "/", icon: Folder },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <CheckSquare2 className="h-5 w-5" />
          <span>TodoApp</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 px-2 py-2 text-sm font-medium"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t px-4 py-4">
        <p className="text-xs text-muted-foreground">© 2024 TodoApp</p>
      </SidebarFooter>
    </Sidebar>
  )
}
