import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { CheckSquare2, Folder, Users, LogOut, ChevronsUpDown, Search, LayoutDashboard, Bug, ListChecks } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Label } from "~/components/ui/label"
import { authClient } from "~/lib/auth-client"
import type { Role } from "~/lib/roles"

type User = {
  id: string
  name: string
  email: string
  image?: string | null
  roles: Role[]
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: User | null
}

function getNavItems(isAdmin: boolean) {
  const workspaceItems = [
    { title: "Projects", url: "/projects", icon: Folder },
    { title: "My Todos", url: "/my-todos", icon: ListChecks },
  ]

  if (__ENABLE_DASHBOARD__) {
    workspaceItems.unshift({ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard })
  }

  const items = [
    {
      title: "Workspace",
      items: workspaceItems,
    },
  ]

  if (isAdmin) {
    items.push({
      title: "Admin",
      items: [{ title: "Users", url: "/admin/users", icon: Users }],
    })
  }

  // Dev section (always visible for debugging)
  items.push({
    title: "Dev",
    items: [{ title: "Python Bridge", url: "/debug/py", icon: Bug }],
  })

  return items
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = React.useState("")

  const isAdmin = user?.roles.includes("admin") ?? false
  const navItems = React.useMemo(() => getNavItems(isAdmin), [isAdmin])

  const filteredNavItems = React.useMemo(() => {
    if (!searchQuery.trim()) return navItems

    const query = searchQuery.toLowerCase()
    return navItems
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.title.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [searchQuery, navItems])

  async function handleLogout() {
    await authClient.signOut()
    navigate("/login")
  }

  const displayName = user?.name || "User"
  const displayEmail = user?.email || ""
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <CheckSquare2 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">TodoApp</span>
                  <span className="text-xs text-muted-foreground">Workspace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const firstItem = filteredNavItems[0]?.items[0]
            if (firstItem) {
              navigate(firstItem.url)
              setSearchQuery("")
            }
          }}
        >
          <SidebarGroup className="py-0">
            <SidebarGroupContent className="relative">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <SidebarInput
                id="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </SidebarGroupContent>
          </SidebarGroup>
        </form>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <Link to={item.url} onClick={() => setSearchQuery("")}>
                        <item.icon className="size-4" />
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.image || ""} alt={displayName} />
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.image || ""} alt={displayName} />
                      <AvatarFallback className="rounded-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
