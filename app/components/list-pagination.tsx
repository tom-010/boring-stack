import { ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "~/components/ui/pagination";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  buildPageUrl: (page: number) => string;
}

export function ListPagination({ page, totalPages, buildPageUrl }: ListPaginationProps) {
  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const input = e.currentTarget;
      const newPage = Math.max(1, Math.min(totalPages, parseInt(input.value, 10) || 1));
      window.location.href = buildPageUrl(newPage);
    }
  };

  const renderPaginationItems = () => {
    const paginationItems = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, page - halfVisible);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    paginationItems.push(
      <PaginationItem key="first">
        <PaginationLink
          href={buildPageUrl(1)}
          className={page === 1 ? "pointer-events-none opacity-50" : ""}
        >
          <ChevronsLeft className="h-4 w-4" />
        </PaginationLink>
      </PaginationItem>
    );

    if (start > 1) {
      paginationItems.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (let i = start; i <= end; i++) {
      if (i === page) {
        paginationItems.push(
          <PaginationItem key={i}>
            <input
              type="number"
              min={1}
              max={totalPages}
              defaultValue={page}
              onKeyDown={handlePageInput}
              className="h-9 w-12 text-center text-sm font-medium border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </PaginationItem>
        );
      } else {
        paginationItems.push(
          <PaginationItem key={i}>
            <PaginationLink href={buildPageUrl(i)}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    if (end < totalPages) {
      paginationItems.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    paginationItems.push(
      <PaginationItem key="last">
        <PaginationLink
          href={buildPageUrl(totalPages)}
          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
        >
          <ChevronsRight className="h-4 w-4" />
        </PaginationLink>
      </PaginationItem>
    );

    return paginationItems;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <Pagination>
        <PaginationContent>
          {renderPaginationItems()}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
