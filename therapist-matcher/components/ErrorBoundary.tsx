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
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                        <p className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</p>
                        <p className="text-sm text-gray-500 mb-4">Please refresh the page to try again.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
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
