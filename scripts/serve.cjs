const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root=path.resolve(__dirname,'../dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
if(!fs.existsSync(path.join(root,'index.html'))){console.error('Production build missing. Run pnpm build first.');process.exit(1);}
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Invalid URL');return;}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
 fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);});
});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'Port 5173 is already in use. Open http://127.0.0.1:5173/ if the configurator is already running, or close the other server.':err.message);process.exit(1)});
server.listen(5173,'127.0.0.1',()=>{
 console.log('SophiStudio - SophiRobot\nhttp://127.0.0.1:5173/\nPress Ctrl+C to stop.');
 if(process.argv.includes('--open'))require('node:child_process').spawn('rundll32.exe',['url.dll,FileProtocolHandler','http://127.0.0.1:5173/'],{windowsHide:true,stdio:'ignore'}).on('error',()=>console.log('Open http://127.0.0.1:5173/ in your browser.'));
});
