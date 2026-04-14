"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * Provides the root container for an alert dialog and forwards all props to the underlying AlertDialog root.
 *
 * @param props - Props to be passed through to the AlertDialog root element
 * @returns The rendered AlertDialog root element
 */
function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

/**
 * Renders an alert dialog trigger element and attaches slot metadata.
 *
 * Forwards all props to Radix UI's AlertDialog Trigger and includes a
 * `data-slot="alert-dialog-trigger"` attribute for slot identification.
 *
 * @returns The alert dialog trigger element.
 */
function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

/**
 * Wraps Radix's AlertDialog Portal and forwards all props.
 *
 * @param props - Props accepted by `AlertDialogPrimitive.Portal`, which are forwarded to the underlying portal element.
 * @returns The rendered portal element with `data-slot="alert-dialog-portal"` and any provided props applied.
 */
function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

/**
 * Renders the dimmed backdrop overlay for the alert dialog.
 *
 * The overlay covers the viewport, applies a semi-transparent black background,
 * and includes open/close animation class hooks keyed to Radix UI `data-state`.
 *
 * @returns A React element that renders the alert dialog overlay/backdrop.
 */
function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the alert dialog panel inside a portal with its overlay, default layout, and open/close animations.
 *
 * @param className - Additional CSS class names merged with the component's default styling
 * @returns The alert dialog content element rendered within a portal and overlay
 */
function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

/**
 * Layout container for the alert dialog header.
 *
 * Renders a div with vertical spacing and responsive text alignment for header content.
 *
 * @param className - Additional CSS classes to merge with the header's default styles
 * @returns A div element styled as the alert dialog header
 */
function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

/**
 * Footer container for an alert dialog that arranges action buttons responsively.
 *
 * @param className - Additional CSS classes merged with the component's default layout classes
 * @param props - Additional props forwarded to the underlying `div`
 * @returns The alert dialog footer element
 */
function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a styled title for the alert dialog.
 *
 * @returns A React element for the dialog title with heading typography and any provided `className` merged into its classes.
 */
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

/**
 * Renders the alert dialog description with muted styling and optional extra classes.
 *
 * @param className - Additional CSS classes to merge with the default description styles
 * @returns The rendered description element for an alert dialog
 */
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

/**
 * Renders an action button for the AlertDialog with the library's standard button styling.
 *
 * @returns A React element representing the dialog's action button with merged styling.
 */
function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

/**
 * Renders an alert dialog cancel action button styled as the outlined button variant and forwards all props to the underlying Radix Cancel primitive.
 *
 * @param className - Additional CSS classes to merge with the component's default outlined button styling
 * @param props - All other props are passed through to the underlying Radix `AlertDialogPrimitive.Cancel`
 * @returns The rendered cancel button element for an alert dialog
 */
function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
