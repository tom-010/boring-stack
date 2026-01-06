import { Form } from "react-router";
import { Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
}

export function SearchBar({ placeholder = "Search...", defaultValue = "" }: SearchBarProps) {
  return (
    <Form method="get" className="flex-1 flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          placeholder={placeholder}
          defaultValue={defaultValue}
          className="pl-10"
        />
      </div>
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </Form>
  );
}
