#!/usr/bin/env python3
# Sirve el build web estático (dist/) para previsualizar la demo.
import functools
import http.server
import socketserver

PORT = 8090
DIRECTORY = "/Users/pablograna/Desktop/Fitnessencial/fitnessencial-app/dist"

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIRECTORY)
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"Serving {DIRECTORY} at http://127.0.0.1:{PORT}")
    httpd.serve_forever()
