import * as React from "react";
import { Form as FormPrimitive } from "radix-ui";

import { cn } from "../utils";
import { Label } from "./label";

function Form({ ...props }: React.ComponentProps<typeof FormPrimitive.Root>) {
  return <FormPrimitive.Root data-slot="form" {...props} />;
}

function FormField({
  ...props
}: React.ComponentProps<typeof FormPrimitive.Field>) {
  return <FormPrimitive.Field data-slot="form-field" {...props} />;
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-item"
      className={cn("grid gap-1.5", className)}
      {...props}
    />
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof FormPrimitive.Label>) {
  return (
    <FormPrimitive.Label asChild>
      <Label data-slot="form-label" className={className} {...props} />
    </FormPrimitive.Label>
  );
}

function FormControl({
  ...props
}: React.ComponentProps<typeof FormPrimitive.Control>) {
  return <FormPrimitive.Control data-slot="form-control" {...props} />;
}

function FormMessage({
  className,
  ...props
}: React.ComponentProps<typeof FormPrimitive.Message>) {
  return (
    <FormPrimitive.Message
      data-slot="form-message"
      className={cn("text-xs text-destructive", className)}
      {...props}
    />
  );
}

function FormSubmit({
  className,
  ...props
}: React.ComponentProps<typeof FormPrimitive.Submit>) {
  return (
    <FormPrimitive.Submit
      data-slot="form-submit"
      className={className}
      {...props}
    />
  );
}

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormSubmit,
};
