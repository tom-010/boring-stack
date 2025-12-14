"use client"

import { useState, useMemo } from "react"
import { Link } from "react-router"
import { Trash2 } from "lucide-react"
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
import type { Project } from "~/db/schema"

interface ProjectsTableProps {
  projects: Project[]
  onDelete: (id: number) => void
}

const ITEMS_PER_PAGE = 10

export function ProjectsTable({ projects, onDelete }: ProjectsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedProjects = projects.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  )

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50",
    red: "bg-red-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    yellow: "bg-yellow-50",
  }

  const colorDots: Record<string, string> = {
    blue: "bg-blue-500",
    red: "bg-red-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    yellow: "bg-yellow-500",
  }

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
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              paginatedProjects.map((project, idx) => (
                <TableRow
                  key={project.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    colorClasses[project.color as keyof typeof colorClasses]
                  }`}
                >
                  <TableCell className="font-medium text-gray-600">
                    {startIndex + idx + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex items-center gap-2 hover:underline font-medium"
                    >
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          colorDots[project.color as keyof typeof colorDots]
                        }`}
                      />
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-gray-600">
                    {project.description || "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(project.id)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

      <div className="text-sm text-gray-600 text-center">
        Showing {Math.min(startIndex + 1, projects.length)} to{" "}
        {Math.min(startIndex + ITEMS_PER_PAGE, projects.length)} of{" "}
        {projects.length} projects
      </div>
    </div>
  )
}
