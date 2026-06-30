import * as React from "react";
import { XIcon } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { TIMBAL_V2_MODAL_SURFACE } from "../design/button-tokens";
import { cn } from "../utils";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] duration-300",
        className,
      )}
      {...props}
    />
  );
}

/** Touch scroll on small viewports without a visible scrollbar track. */
const sheetMobileScrollbarHideClass = cn(
  "max-sm:[scrollbar-width:none] max-sm:[-ms-overflow-style:none]",
  "max-sm:[&_*]:[scrollbar-width:none] max-sm:[&_*]:[-ms-overflow-style:none]",
  "max-sm:[&::-webkit-scrollbar]:hidden max-sm:[&::-webkit-scrollbar]:w-0 max-sm:[&::-webkit-scrollbar]:h-0",
  "max-sm:[&_*::-webkit-scrollbar]:hidden max-sm:[&_*::-webkit-scrollbar]:w-0 max-sm:[&_*::-webkit-scrollbar]:h-0",
);

const sheetContentVariants = cva(
  cn(
    TIMBAL_V2_MODAL_SURFACE,
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 fixed z-[70] flex min-h-0 flex-col gap-4 overflow-y-auto shadow-card-elevated duration-300",
    sheetMobileScrollbarHideClass,
  ),
  {
    variants: {
      side: {
        top: "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top fixed top-4 inset-x-4 mx-auto w-[calc(100vw-2rem)] sm:max-w-lg rounded-2xl p-5",
        bottom:
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom fixed bottom-4 inset-x-4 mx-auto w-[calc(100vw-2rem)] sm:max-w-lg rounded-2xl p-5",
        left: "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left fixed top-4 bottom-4 left-4 w-[calc(100vw-2rem)] rounded-2xl p-5",
        right:
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right fixed top-4 bottom-4 right-4 w-[calc(100vw-2rem)] rounded-2xl p-5",
      },
      size: {
        default: "",
        sm: "",
        md: "",
        lg: "",
        xl: "",
        "2xl": "",
        full: "",
      },
    },
    compoundVariants: [
      { side: "left", size: "default", class: "sm:max-w-md md:max-w-lg" },
      { side: "right", size: "default", class: "sm:max-w-md md:max-w-lg" },
      { side: "left", size: "sm", class: "sm:max-w-sm md:max-w-md" },
      { side: "right", size: "sm", class: "sm:max-w-sm md:max-w-md" },
      { side: "left", size: "md", class: "sm:max-w-md md:max-w-lg" },
      { side: "right", size: "md", class: "sm:max-w-md md:max-w-lg" },
      { side: "left", size: "lg", class: "sm:max-w-lg md:max-w-xl lg:max-w-2xl" },
      { side: "right", size: "lg", class: "sm:max-w-lg md:max-w-xl lg:max-w-2xl" },
      { side: "left", size: "xl", class: "sm:max-w-xl md:max-w-3xl lg:max-w-4xl" },
      { side: "right", size: "xl", class: "sm:max-w-xl md:max-w-3xl lg:max-w-4xl" },
      { side: "left", size: "2xl", class: "sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl" },
      { side: "right", size: "2xl", class: "sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl" },
      { side: "left", size: "full", class: "max-w-[calc(100vw-2rem)]" },
      { side: "right", size: "full", class: "max-w-[calc(100vw-2rem)]" },
    ],
    defaultVariants: {
      side: "right",
      size: "default",
    },
  },
);

function SheetContent({
  className,
  children,
  side = "right",
  size = "default",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetContentVariants> & {
    showCloseButton?: boolean;
  }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(sheetContentVariants({ side, size }), className)}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 transition-[opacity,background-color] hover:bg-ghost-fill-hover hover:opacity-100 focus:ring-2 focus:ring-foreground/10 focus:outline-hidden disabled:pointer-events-none">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-0", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  // Render as a <div> (not Radix's default <p>) so block-level children — a
  // StatusBadge, a row of pills, an icon + text — are valid HTML and don't
  // trigger a "<div> cannot appear as a descendant of <p>" hydration error.
  return (
    <SheetPrimitive.Description asChild>
      <div
        data-slot="sheet-description"
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      />
    </SheetPrimitive.Description>
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
