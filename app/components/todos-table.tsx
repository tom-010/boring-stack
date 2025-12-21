"use client"

import { useState } from "react"
import { Form } from "react-router"
import { Check, Trash2 } from "lucide-react"
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
import { Button } from "~/components/ui/button"
import type { Todo } from "@prisma/client"
import { routes } from "~/lib/routes"

interface TodosTableProps {
  todos: Todo[]
}

const ITEMS_PER_PAGE = 10

export function TodosTable({ todos }: TodosTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(todos.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedTodos = todos.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  )


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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden sm:table-cell">Priority</TableHead>
              <TableHead className="hidden lg:table-cell">Due Date</TableHead>
              <TableHead className="text-right w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTodos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No todos found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTodos.map((todo) => (
                <TableRow
                  key={todo.id}
                  className={`${todo.completed ? "opacity-60" : ""} ${
                    todo.priority === "high" && !todo.completed ? "bg-muted/50" : ""
                  }`}
                >
                  <TableCell>
                    <Form
                      method="put"
                      action={routes.updateTodo.path}
                      style={{ display: "inline" }}
                    >
                      <input type="hidden" name="id" value={todo.id} />
                      <input type="hidden" name="projectId" value={todo.projectId} />
                      <input type="hidden" name="completed" value={String(!todo.completed)} />
                      <button
                        type="submit"
                        className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${
                          todo.completed
                            ? "bg-primary border-primary"
                            : "border-input hover:border-primary"
                        }`}
                      >
                        {todo.completed && <Check size={14} className="text-primary-foreground" />}
                      </button>
                    </Form>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        todo.completed
                          ? "text-muted-foreground line-through"
                          : todo.priority === "low"
                          ? "text-muted-foreground"
                          : "font-medium"
                      }
                    >
                      {todo.title}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {todo.description || "-"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Form
                      method="put"
                      action={routes.updateTodo.path}
                      style={{ display: "inline" }}
                    >
                      <input type="hidden" name="id" value={todo.id} />
                      <input type="hidden" name="projectId" value={todo.projectId} />
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
                      <button
                        type="submit"
                        className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                      >
                        {todo.priority}
                      </button>
                    </Form>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {todo.dueDate
                      ? new Date(todo.dueDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Form
                      method="delete"
                      action={routes.deleteTodo.path}
                      onSubmit={(e) => {
                        if (!window.confirm("Are you sure you want to delete this todo?")) {
                          e.preventDefault()
                        }
                      }}
                      style={{ display: "inline" }}
                    >
                      <input type="hidden" name="id" value={todo.id} />
                      <input type="hidden" name="projectId" value={todo.projectId} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Form>
                  </TableCell>
                </TableRow>
              ))
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
        {Math.min(startIndex + ITEMS_PER_PAGE, todos.length)} of{" "}
        {todos.length} todos
      </div>
    </div>
  )
}
