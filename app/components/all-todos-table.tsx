"use client"

import { useState } from "react"
import { Form, Link } from "react-router"
import { CheckCircle2, Circle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination"
import { Badge } from "~/components/ui/badge"

interface TodoWithRelations {
  id: number
  title: string
  completed: boolean
  priority: string | null
  dueDate: string | null
  createdAt: Date
  userId: string
  project: { id: number; name: string }
  user: { id: string; name: string }
  assignments: Array<{
    user: { id: string; name: string }
  }>
}

interface AllTodosTableProps {
  todos: TodoWithRelations[]
  currentUserId: string
}

const ITEMS_PER_PAGE = 10

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
}

export function AllTodosTable({ todos, currentUserId }: AllTodosTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(todos.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedTodos = todos.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handlePageClick = (page: number) => {
    setCurrentPage(page)
  }

  const renderPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageClick(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageClick(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      )

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageClick(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageClick(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  const getRelation = (todo: TodoWithRelations) => {
    if (todo.userId === currentUserId) {
      return "owner"
    }
    if (todo.assignments.some((a) => a.user.id === currentUserId)) {
      return "assigned"
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-10"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Project</TableHead>
              <TableHead className="hidden md:table-cell">Priority</TableHead>
              <TableHead className="hidden lg:table-cell">Due</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTodos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No todos found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTodos.map((todo, idx) => {
                const relation = getRelation(todo)
                return (
                  <TableRow key={todo.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {startIndex + idx + 1}
                    </TableCell>
                    <TableCell>
                      <Form method="post" style={{ display: "inline" }}>
                        <input type="hidden" name="intent" value="updateTodo" />
                        <input type="hidden" name="id" value={todo.id} />
                        <input
                          type="hidden"
                          name="completed"
                          value={String(!todo.completed)}
                        />
                        <button type="submit" className="cursor-pointer">
                          {todo.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground hover:text-green-500" />
                          )}
                        </button>
                      </Form>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/todos/${todo.id}`}
                        className={`hover:underline font-medium ${
                          todo.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {todo.title}
                      </Link>
                      {relation === "assigned" && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (assigned by {todo.user.name})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Link
                        to={`/projects/${todo.project.id}`}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        {todo.project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Form method="post" style={{ display: "inline" }}>
                        <input type="hidden" name="intent" value="updateTodo" />
                        <input type="hidden" name="id" value={todo.id} />
                        <input
                          type="hidden"
                          name="priority"
                          value={
                            todo.priority === "low"
                              ? "medium"
                              : todo.priority === "medium"
                              ? "high"
                              : "low"
                          }
                        />
                        <button type="submit" className="cursor-pointer">
                          <Badge
                            variant="secondary"
                            className={`${
                              priorityColors[todo.priority || "medium"] || ""
                            } hover:opacity-80`}
                          >
                            {todo.priority || "medium"}
                          </Badge>
                        </button>
                      </Form>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {todo.dueDate || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {new Date(todo.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={handlePrevious}
                  className={`cursor-pointer ${
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                />
              </PaginationItem>

              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext
                  onClick={handleNext}
                  className={`cursor-pointer ${
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center">
        Showing {Math.min(startIndex + 1, todos.length)} to{" "}
        {Math.min(startIndex + ITEMS_PER_PAGE, todos.length)} of {todos.length}{" "}
        todos
      </div>
    </div>
  )
}
