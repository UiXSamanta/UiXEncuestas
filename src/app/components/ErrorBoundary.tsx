import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🔴 ErrorBoundary caught error:', error);
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🔴 Error details:', error);
    console.error('🔴 Error info:', errorInfo);
    
    // Don't show error UI for Figma's share-modal errors
    if (error.message && error.message.includes('share-modal')) {
      console.warn('⚠️ Share-modal error caught and suppressed by ErrorBoundary');
      this.setState({ hasError: false, error: null });
      return;
    }
    
    if (error.message && error.message.includes("Cannot read properties of null")) {
      console.warn('⚠️ External script error caught and suppressed by ErrorBoundary');
      this.setState({ hasError: false, error: null });
      return;
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-lg shadow-lg p-8 max-w-lg w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-muted-foreground mb-4">
              An error occurred while loading the application.
            </p>
            <pre className="bg-gray-100 dark:bg-muted text-gray-900 dark:text-foreground p-4 rounded text-sm overflow-auto mb-4">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
