"use client"

import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-bg">
                    <div className="bg-surface border border-line rounded-[14px] p-8 max-w-md w-full mx-4 text-center">
                        <p className="font-display font-medium text-ink text-lg mb-2">Something went wrong</p>
                        <p className="text-sm text-ink-soft mb-6">Please refresh the page to try again.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-accent text-white px-5 py-2 rounded-lg hover:bg-accent-dark transition-colors text-sm font-medium"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}
