import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { z } from "zod";
import { formDataToObject, debounce, useFormValidation, parseForm } from "./utils";

describe("formDataToObject", () => {
  it("converts basic single values", () => {
    const formData = new FormData();
    formData.append("name", "John");
    formData.append("email", "john@example.com");

    const result = formDataToObject(formData);

    expect(result).toEqual({
      name: "John",
      email: "john@example.com",
    });
  });

  it("handles array fields with multiple values", () => {
    const formData = new FormData();
    formData.append("roles", "admin");
    formData.append("roles", "user");
    formData.append("name", "John");

    const result = formDataToObject(formData, ["roles"]);

    expect(result).toEqual({
      name: "John",
      roles: ["admin", "user"],
    });
  });

  it("handles array fields with single value", () => {
    const formData = new FormData();
    formData.append("roles", "admin");

    const result = formDataToObject(formData, ["roles"]);

    expect(result).toEqual({
      roles: ["admin"],
    });
  });

  it("returns empty array for array field with no values", () => {
    const formData = new FormData();
    formData.append("name", "John");

    const result = formDataToObject(formData, ["roles"]);

    // roles not in formData, so not in result
    expect(result).toEqual({
      name: "John",
    });
  });

  it("handles empty form data", () => {
    const formData = new FormData();

    const result = formDataToObject(formData);

    expect(result).toEqual({});
  });

  it("non-array duplicate keys return first value only", () => {
    const formData = new FormData();
    formData.append("name", "John");
    formData.append("name", "Jane"); // duplicate, not in arrayFields

    const result = formDataToObject(formData);

    // FormData.get() returns first value
    expect(result.name).toBe("John");
  });

  it("handles empty string values", () => {
    const formData = new FormData();
    formData.append("name", "");
    formData.append("email", "admin@example.com");

    const result = formDataToObject(formData);

    expect(result).toEqual({
      name: "",
      email: "admin@example.com",
    });
  });

  it("handles mixed single and array fields", () => {
    const formData = new FormData();
    formData.append("name", "John");
    formData.append("tags", "typescript");
    formData.append("tags", "react");
    formData.append("permissions", "read");
    formData.append("permissions", "write");
    formData.append("permissions", "delete");

    const result = formDataToObject(formData, ["tags", "permissions"]);

    expect(result).toEqual({
      name: "John",
      tags: ["typescript", "react"],
      permissions: ["read", "write", "delete"],
    });
  });

  it("handles File objects in FormData", () => {
    const formData = new FormData();
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    formData.append("document", file);
    formData.append("name", "John");

    const result = formDataToObject(formData);

    expect(result.name).toBe("John");
    expect(result.document).toBeInstanceOf(File);
    expect((result.document as File).name).toBe("test.txt");
  });

  it("handles multiple files as array", () => {
    const formData = new FormData();
    const file1 = new File(["content1"], "test1.txt");
    const file2 = new File(["content2"], "test2.txt");
    formData.append("documents", file1);
    formData.append("documents", file2);

    const result = formDataToObject(formData, ["documents"]);

    expect(Array.isArray(result.documents)).toBe(true);
    expect((result.documents as File[]).length).toBe(2);
  });
});

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays function execution", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("only executes once for rapid calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resets timer on each call", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);

    debounced(); // reset timer
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes arguments to the debounced function", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("arg1", "arg2");
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("uses arguments from the last call", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("first");
    debounced("second");
    debounced("third");

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("third");
  });

  it("can be called again after debounce completes", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("first");
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    debounced("second");
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("second");
  });

  it("handles zero delay", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 0);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("handles large delays", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 10000);

    debounced();
    vi.advanceTimersByTime(9999);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("parseForm", () => {
  const testSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
  });

  const schemaWithArray = z.object({
    name: z.string().min(1, "Name is required"),
    roles: z.array(z.string()).min(1, "At least one role required"),
  });

  it("parses valid form data", () => {
    const formData = new FormData();
    formData.append("name", "John");
    formData.append("email", "john@example.com");

    const result = parseForm(testSchema, formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "John", email: "john@example.com" });
    }
  });

  it("returns errors for invalid form data", () => {
    const formData = new FormData();
    formData.append("name", "");
    formData.append("email", "invalid");

    const result = parseForm(testSchema, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  it("automatically detects and handles array fields", () => {
    const formData = new FormData();
    formData.append("name", "John");
    formData.append("roles", "admin");
    formData.append("roles", "user");

    const result = parseForm(schemaWithArray, formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roles).toEqual(["admin", "user"]);
    }
  });

  it("handles empty array fields", () => {
    const formData = new FormData();
    formData.append("name", "John");

    const result = parseForm(schemaWithArray, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.roles).toBeDefined();
    }
  });
});

describe("useFormValidation", () => {
  const testSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
  });

  const schemaWithArray = z.object({
    name: z.string().min(1, "Name is required"),
    roles: z.array(z.string()).min(1, "At least one role required"),
  });

  // Override FormData constructor for tests
  beforeEach(() => {
    const originalFormData = globalThis.FormData;
    vi.spyOn(globalThis, "FormData").mockImplementation(function (
      this: FormData,
      form?: HTMLFormElement
    ) {
      // If form has _formData attached (via our mock event), return it
      const event = (form as unknown as { _testFormData?: FormData })?._testFormData;
      if (event) return event;
      return new originalFormData(form);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns server errors when provided", () => {
    const serverErrors = { email: ["Email already in use"] };

    const { result } = renderHook(() =>
      useFormValidation(testSchema, serverErrors)
    );

    expect(result.current.errors).toEqual(serverErrors);
  });

  it("returns empty errors when no server errors", () => {
    const { result } = renderHook(() => useFormValidation(testSchema));

    expect(result.current.errors).toEqual({});
  });

  it("prevents submission and sets client errors when validation fails", () => {
    const { result } = renderHook(() => useFormValidation(testSchema));

    const formData = new FormData();
    formData.append("name", "");
    formData.append("email", "invalid-email");

    const form = document.createElement("form");
    (form as unknown as { _testFormData: FormData })._testFormData = formData;

    const mockPreventDefault = vi.fn();
    const event = {
      currentTarget: form,
      preventDefault: mockPreventDefault,
    } as unknown as React.FormEvent<HTMLFormElement>;

    act(() => {
      result.current.onSubmit(event);
    });

    expect(mockPreventDefault).toHaveBeenCalled();
    expect(result.current.errors.name).toBeDefined();
    expect(result.current.errors.email).toBeDefined();
  });

  it("allows submission when validation passes", () => {
    const { result } = renderHook(() => useFormValidation(testSchema));

    const formData = new FormData();
    formData.append("name", "John");
    formData.append("email", "john@example.com");

    const form = document.createElement("form");
    (form as unknown as { _testFormData: FormData })._testFormData = formData;

    const mockPreventDefault = vi.fn();
    const event = {
      currentTarget: form,
      preventDefault: mockPreventDefault,
    } as unknown as React.FormEvent<HTMLFormElement>;

    act(() => {
      result.current.onSubmit(event);
    });

    expect(mockPreventDefault).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({});
  });

  it("client errors override server errors", () => {
    const serverErrors = { email: ["Server error"] };

    const { result } = renderHook(() =>
      useFormValidation(testSchema, serverErrors)
    );

    // Initially shows server errors
    expect(result.current.errors.email).toEqual(["Server error"]);

    // Trigger client validation
    const formData = new FormData();
    formData.append("name", "John");
    formData.append("email", "bad");

    const form = document.createElement("form");
    (form as unknown as { _testFormData: FormData })._testFormData = formData;

    const event = {
      currentTarget: form,
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent<HTMLFormElement>;

    act(() => {
      result.current.onSubmit(event);
    });

    // Client error should override server error
    expect(result.current.errors.email).toContain("Invalid email");
  });

  it("clears client errors after successful validation", () => {
    const { result } = renderHook(() => useFormValidation(testSchema));

    // First, trigger a validation error
    const badFormData = new FormData();
    badFormData.append("name", "");
    badFormData.append("email", "bad");

    const form1 = document.createElement("form");
    (form1 as unknown as { _testFormData: FormData })._testFormData = badFormData;

    act(() => {
      result.current.onSubmit({
        currentTarget: form1,
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(result.current.errors.name).toBeDefined();

    // Now submit valid data
    const goodFormData = new FormData();
    goodFormData.append("name", "John");
    goodFormData.append("email", "john@example.com");

    const form2 = document.createElement("form");
    (form2 as unknown as { _testFormData: FormData })._testFormData = goodFormData;

    act(() => {
      result.current.onSubmit({
        currentTarget: form2,
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(result.current.errors).toEqual({});
  });

  it("handles array fields correctly", () => {
    const { result } = renderHook(() =>
      useFormValidation(schemaWithArray, undefined)
    );

    // Empty roles should fail
    const formData = new FormData();
    formData.append("name", "John");

    const form = document.createElement("form");
    (form as unknown as { _testFormData: FormData })._testFormData = formData;

    const mockPreventDefault = vi.fn();

    act(() => {
      result.current.onSubmit({
        currentTarget: form,
        preventDefault: mockPreventDefault,
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(mockPreventDefault).toHaveBeenCalled();
    expect(result.current.errors.roles).toBeDefined();
  });

  it("validates array fields with values correctly", () => {
    const { result } = renderHook(() =>
      useFormValidation(schemaWithArray, undefined)
    );

    const formData = new FormData();
    formData.append("name", "John");
    formData.append("roles", "admin");
    formData.append("roles", "user");

    const form = document.createElement("form");
    (form as unknown as { _testFormData: FormData })._testFormData = formData;

    const mockPreventDefault = vi.fn();

    act(() => {
      result.current.onSubmit({
        currentTarget: form,
        preventDefault: mockPreventDefault,
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(mockPreventDefault).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({});
  });
});
