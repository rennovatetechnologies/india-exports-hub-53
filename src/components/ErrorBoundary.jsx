import { Component } from "react";
import FallbackScreen from "@/components/FallbackScreen";

/**
 * Catches render crashes so users never see a blank screen or stack trace.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ui]", error, info?.componentStack || "");
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  retry = () => {
    this.setState({ hasError: false });
    if (typeof this.props.onRetry === "function") {
      this.props.onRetry();
      return;
    }
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <FallbackScreen
          kind="crash"
          compact={this.props.compact}
          onRetry={this.retry}
          retryLabel="Reload"
        />
      );
    }
    return this.props.children;
  }
}
