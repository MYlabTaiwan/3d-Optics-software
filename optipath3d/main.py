"""
OptiPath 3D - Optical Bench & Beam Path CAD Suite
=================================================
Main application launcher with crash-free error handling,
dual desktop window (pywebview) and browser fallback modes,
and clean subfolder organization.

Usage:
    python -m optipath3d.main
    or
    python optipath3d/main.py [--browser] [--port 8765]
"""

import os
import sys
import time
import socket
import logging
import argparse
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Setup robust logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("OptiPath3D")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "web")


def find_free_port(start_port: int = 8765, max_attempts: int = 50) -> int:
    """Finds an open TCP port on localhost to avoid port collisions."""
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return start_port


class OptiPathHTTPHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler serving the web application directory."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def log_message(self, format, *args):
        # Mute excessive static file request logs unless in debug mode
        if logger.level <= logging.DEBUG:
            logger.debug("%s - - [%s] %s" % (self.client_address[0], self.log_date_time_string(), format % args))


class ReusableHTTPServer(HTTPServer):
    """HTTP server that allows immediate address reuse to prevent WinError 10048."""
    allow_reuse_address = True


class OptiPathServer:
    """Manages the background HTTP server for OptiPath 3D."""

    def __init__(self, port: int = 8765):
        self.port = find_free_port(port)
        self.server: HTTPServer = None
        self.thread: threading.Thread = None
        self.is_running = False

    def start(self):
        try:
            self.server = ReusableHTTPServer(("127.0.0.1", self.port), OptiPathHTTPHandler)
            self.is_running = True
            self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
            self.thread.start()

            # Ensure local socket is actively answering before launching GUI
            for _ in range(50):
                try:
                    with socket.create_connection(("127.0.0.1", self.port), timeout=0.1):
                        break
                except OSError:
                    time.sleep(0.02)

            logger.info(f"Local HTTP service started at http://127.0.0.1:{self.port}")
            return True
        except Exception as e:
            logger.error(f"Failed to start local HTTP server: {e}", exc_info=True)
            return False

    def stop(self):
        if self.server:
            logger.info("Stopping local HTTP server...")
            self.server.shutdown()
            self.server.server_close()
            self.is_running = False


def launch_app(browser_only: bool = False, port: int = 8765, no_open: bool = False):
    """
    Launches OptiPath 3D application.
    Attempts to launch in native desktop window via pywebview;
    gracefully falls back to default web browser if pywebview is unavailable or fails.
    """
    logger.info("=" * 65)
    logger.info("  OptiPath 3D - Optical Bench & Beam Path CAD Suite")
    logger.info("  Thorlabs, Periscopes, Cage Systems & Olympus/Zeiss Setup")
    logger.info("=" * 65)

    if not os.path.exists(WEB_DIR):
        logger.critical(f"Web assets directory not found at: {WEB_DIR}")
        sys.exit(1)

    server = OptiPathServer(port=port)
    if not server.start():
        sys.exit(1)

    app_url = f"http://127.0.0.1:{server.port}"
    logger.info(f"OptiPath 3D is live at: {app_url}")

    webview_launched = False

    if not browser_only:
        try:
            import webview
            logger.info("Starting native desktop window via pywebview (Edge WebView2)...")

            # Create native desktop window
            window = webview.create_window(
                title="OptiPath 3D - Optical CAD & Beam Path Workstation",
                url=app_url,
                width=1440,
                height=920,
                min_size=(1024, 700),
                confirm_close=False,
                background_color="#0e121a"
            )

            webview_launched = True
            # Enable DevTools (F12) if debug is True
            webview.start(debug=logger.level <= logging.DEBUG)
            logger.info("Desktop window closed.")
        except Exception as e:
            logger.warning(f"Native desktop window unavailable or encountered error: {e}")
            logger.info("Falling back to default web browser...")

    if not webview_launched and not no_open:
        logger.info(f"Opening {app_url} in your default browser...")
        try:
            webbrowser.open(app_url)
        except Exception as e:
            logger.error(f"Could not open browser automatically: {e}")

        print("\n" + "*" * 65)
        print(f"  OptiPath 3D is running!")
        print(f"  Open this URL in any browser: {app_url}")
        print("  Press Ctrl+C in this console to stop the server.")
        print("*" * 65 + "\n")

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Received shutdown signal (Ctrl+C). Exiting cleanly...")

    server.stop()
    logger.info("OptiPath 3D shutdown complete.")


def main():
    parser = argparse.ArgumentParser(description="OptiPath 3D - Optical CAD & Beam Path Workstation")
    parser.add_argument("--browser", action="store_true", help="Launch directly in default web browser")
    parser.add_argument("--port", type=int, default=8765, help="Port to run local server on (default: 8765)")
    parser.add_argument("--no-open", action="store_true", help="Do not automatically open browser")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging output")

    args = parser.parse_args()
    if args.debug:
        logger.setLevel(logging.DEBUG)

    try:
        launch_app(browser_only=args.browser, port=args.port, no_open=args.no_open)
    except Exception as e:
        logger.critical(f"Unhandled fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
