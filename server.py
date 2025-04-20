#!/usr/bin/env python
# -*- coding: utf-8 -*-
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    extensions_map = {
        '': 'application/octet-stream',
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.mp3': 'audio/mpeg',
    }

    def guess_type(self, path):
        base, ext = os.path.splitext(path)
        return self.extensions_map.get(ext.lower(), self.extensions_map[''])

def run(server_class=HTTPServer, handler_class=CustomHandler):
    server_address = ('', PORT)
    httpd = server_class(server_address, handler_class)
    print(f"Servidor iniciado en http://localhost:{PORT}")
    print(f"Sirviendo archivos desde: {DIRECTORY}")
    print("Presiona Ctrl+C para detener el servidor")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nDeteniendo el servidor...")
        httpd.server_close()

if __name__ == '__main__':
    run()
