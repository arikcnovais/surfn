"""Tiny static server for local development.

Same as `python3 -m http.server`, but sends Cache-Control: no-store so edits to
the JS modules and generated atlases show up on reload instead of being served
from the browser cache.

    python3 tools/serve.py [port]      # default 8123, serves the project root
"""
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        print(f"serving {ROOT} at http://127.0.0.1:{port}/index.html")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
