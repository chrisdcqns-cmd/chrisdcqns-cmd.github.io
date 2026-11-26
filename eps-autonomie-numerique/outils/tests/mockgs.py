# Faux script Google commun (mêmes règles que Code.gs : syncPush_, syncPull_, chk) + commandes de test
import http.server, json, urllib.parse, threading
S={"rows":{}, "seq":0, "fail":False, "old":False, "nochk":False, "posts":0}
KEY="CLE"
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _send(self,code,body,ct="text/javascript"):
        b=body.encode("utf-8"); self.send_response(code); self.send_header("Content-Type",ct+";charset=utf-8"); self.send_header("Access-Control-Allow-Origin","*"); self.send_header("Content-Length",str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        u=urllib.parse.urlparse(self.path); p={k:v[0] for k,v in urllib.parse.parse_qs(u.query,keep_blank_values=True).items()}
        if u.path=="/ctl":
            for k in ("fail","old","nochk"):
                if k in p: S[k]=p[k]=="1"
            if "reset" in p: S["rows"]={}; S["seq"]=0; S["posts"]=0
            return self._send(200,json.dumps({"n":len(S["rows"]),"keys":sorted(S["rows"]),"posts":S["posts"],"u":{k:v[1] for k,v in S["rows"].items()}}),"application/json")
        res={"ok":True,"app":"EPS commun","keyOk":p.get("key")==KEY}
        if res["keyOk"]:
            res["sync"]=1; res["dropv"]=1; res["aiv"]=3
            if not S["old"]: res["chkv"]=1
            if "chk" in p and not S["old"]:
                if S["nochk"]: return self._send(500,"erreur")
                ks=json.loads(p["chk"]); res["chk"]={k:S["rows"][k][1] for k in ks if k in S["rows"]}
            if "pull" in p:
                since=int(float(p.get("since") or 0)); pre=p.get("pre") or ""
                rows=sorted([(v[0],k,v[1],v[2],v[3]) for k,v in S["rows"].items() if v[0]>since and k.startswith(pre)])
                res.update({"seq":S["seq"],"recs":[list(r) for r in rows[:300]],"more":len(rows)>300})
        cb=p.get("callback"); body=json.dumps(res); self._send(200,(cb+"("+body+")") if cb else body)
    def do_POST(self):
        n=int(self.headers.get("Content-Length") or 0); raw=self.rfile.read(n); S["posts"]+=1
        if S["fail"]: return self._send(500,"Service invoked too many times")
        try: d=json.loads(raw)
        except Exception: return self._send(200,"{}")
        if d.get("key")==KEY and d.get("sync"):
            for r in d["sync"].get("recs",[]):
                k=str(r.get("k") or ""); u=float(r.get("u") or 0)
                if not k: continue
                ex=S["rows"].get(k)
                if ex and u<ex[1]: continue
                S["seq"]+=1; S["rows"][k]=[S["seq"],u,1 if r.get("d") else 0,"" if r.get("d") else str(r.get("x") or "")]
        self._send(200,"{}","application/json")
http.server.ThreadingHTTPServer(("127.0.0.1",8899),H).serve_forever()
