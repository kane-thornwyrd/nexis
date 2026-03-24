import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  componentStack: string | null;
  error: Error | null;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public state: AppErrorBoundaryState = {
    componentStack: null,
    error: null,
  };

  public static getDerivedStateFromError(error: Error) {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ componentStack: errorInfo.componentStack || null });
    console.error("Unhandled application error", {
      componentStack: errorInfo.componentStack,
      error,
    });
  }

  private readonly handleReload = () => {
    window.location.reload();
  };

  private readonly handleRetry = () => {
    this.setState({ componentStack: null, error: null });
  };

  public render() {
    const { children } = this.props;
    const { componentStack, error } = this.state;

    if (!error) {
      return children;
    }

    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
          <section className="w-full border border-border bg-card/85 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Application error
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              The interface hit an unrecoverable problem.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Try rendering the current tree again, or reload the app if the
              problem persists. The error details are kept below for local
              debugging.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={this.handleRetry}>
                Try again
              </button>
              <button type="button" onClick={this.handleReload}>
                Reload app
              </button>
            </div>

            <details className="mt-6 border border-border bg-background/70 p-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                Error details
              </summary>

              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap wrap-break-word text-xs leading-6 text-muted-foreground">
                {error.stack ?? error.message}
                {componentStack
                  ? `\n\nReact component stack:\n${componentStack}`
                  : ""}
              </pre>
            </details>
          </section>
        </div>
      </main>
    );
  }
}
