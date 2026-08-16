#!/usr/bin/env python3
import http.server, json, os, pathlib

ROOT = pathlib.Path(__file__).parent
DATA_DIR = ROOT / 'data'

class IslandHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/save':
            length = int(self.headers['Content-Length'])
            body = json.loads(self.rfile.read(length))
            fname = body['file']
            if fname not in ('buildings', 'npcs', 'areas', 'wildlife', 'terrain'):
                self.send_response(400)
                self.end_headers()
                return
            DATA_DIR.mkdir(exist_ok=True)
            out = DATA_DIR / f'{fname}.json'
            out.write_text(json.dumps(body['data'], indent=2))
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/load/'):
            fname = self.path.split('/api/load/')[-1]
            if fname not in ('buildings', 'npcs', 'areas', 'wildlife', 'terrain'):
                self.send_response(400)
                self.end_headers()
                return
            fpath = DATA_DIR / f'{fname}.json'
            if not fpath.exists():
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'not found'}).encode())
                return
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(fpath.read_bytes())
        else:
            super().do_GET()

    def log_message(self, fmt, *args):
        pass

if __name__ == '__main__':
    DATA_DIR.mkdir(exist_ok=True)
    addr = ('', 8181)
    httpd = http.server.HTTPServer(addr, IslandHandler)
    print(f'Island server running at http://localhost:8181')
    httpd.serve_forever()
