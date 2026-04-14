"use client"

import * as React from "react"
import { createContext, useContext, useReducer, useCallback, useEffect } from "react"
import { Toast, ToastTitle, ToastDescription } from "@/components/ui/toast"
import { setGlobalToast } from "@/hooks/use-toast"

interface ToastData {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface ToastState {
  toasts: ToastData[]
}

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: ToastData }
  | { type: 'REMOVE_TOAST'; id: string }

const ToastContext = createContext<{
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, 'id'>) => void
  removeToast: (id: string) => void
} | null>(null)

/**
 * Updates the toast list in response to add/remove actions.
 *
 * @param state - The current toast state.
 * @param action - The action to apply: `'ADD_TOAST'` appends `action.toast` to the list; `'REMOVE_TOAST'` removes the toast with `action.id`.
 * @returns The new `ToastState` with the specified toast added or removed, or the original state if the action type is unrecognized.
 */
function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast]
      }
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.id)
      }
    default:
      return state
  }
}

/**
 * Provides toast state and actions to descendant components and renders the toast UI.
 *
 * Registers a global `addToast` function for programmatic use while mounted and clears it on unmount.
 *
 * @param children - React children to be wrapped by the provider
 * @returns The provider element that renders `children` and the `ToastContainer` for active toasts
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] })

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const duration = toast.duration ?? 5000 // Default 5 seconds
    
    dispatch({
      type: 'ADD_TOAST',
      toast: { ...toast, id }
    })

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', id })
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id })
  }, [])

  // Register the global toast function when provider mounts
  useEffect(() => {
    setGlobalToast(addToast)
    
    // Cleanup on unmount
    return () => {
      setGlobalToast(null as any)
    }
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={state.toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * Renders a fixed-position container that displays a list of toast notifications.
 *
 * @param toasts - The toast items to display.
 * @param onRemove - Called with a toast `id` when that toast should be removed (e.g., user closed or auto-removed).
 * @returns The container element with mapped `Toast` components, or `null` when `toasts` is empty.
 */
function ToastContainer({ 
  toasts, 
  onRemove 
}: { 
  toasts: ToastData[]
  onRemove: (id: string) => void 
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onClose={() => onRemove(toast.id)}
          className="mb-4 last:mb-0"
        >
          <ToastTitle>{toast.title}</ToastTitle>
          {toast.description && (
            <ToastDescription>{toast.description}</ToastDescription>
          )}
        </Toast>
      ))}
    </div>
  )
}

/**
 * Accesses the toast context provided by the ToastProvider.
 *
 * @returns The toast context object containing `toasts`, `addToast`, and `removeToast`.
 * @throws Error if called outside of a `ToastProvider`
 */
export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
} 