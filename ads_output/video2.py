import numpy as np, subprocess, math, random, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import json
W,H=1080,1920; FPS=30
SCH=json.load(open('schedule.json')); ST=SCH['starts']; SD=SCH['durs']; DUR=SCH['end']
WT=[]  # per segment: list of (word, t)
for i,line in enumerate(SCH['lines']):
    ws=line.split(); wts=[len(w)+2+(3 if w[-1] in ',:' else 0)+(5 if w[-1] in '.?!' else 0) for w in ws]
    a=ST[i]+0.12; b=ST[i]+SD[i]-0.25; tot=sum(wts); c=0; L=[]
    for w,x in zip(ws,wts): L.append((w,a+(b-a)*c/tot)); c+=x
    WT.append(L)
def wt(seg,k): return WT[seg][k][1]
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
_fc={}
def F(s,p=BOLD):
    k=(int(s),p)
    if k not in _fc: _fc[k]=ImageFont.truetype(p,max(8,int(s)))
    return _fc[k]
YEL=(255,214,0); RED=(225,20,40); WHITE=(255,255,255); GOLD=(255,196,60); GREEN=(30,200,110); DARK=(15,15,20)
def clamp(x,a=0,b=1): return max(a,min(b,x))
def eob(x):  # ease out back
    x=clamp(x); c1=1.9; c3=c1+1; return 1+c3*(x-1)**3+c1*(x-1)**2
def eo(x): x=clamp(x); return 1-(1-x)**3
def grad(c1,c2):
    t=np.linspace(0,1,H)[:,None,None]
    a=np.array(c1)[None,None,:]*(1-t)+np.array(c2)[None,None,:]*t
    a=np.repeat(a,W,1)
    yy,xx=np.mgrid[0:H,0:W]; d=np.sqrt(((xx-W/2)/W)**2+((yy-H/2)/H)**2)
    a=a*(1-0.6*clamp_arr(d*1.3-0.25))[:,:,None]
    return Image.fromarray(a.astype(np.uint8))
def clamp_arr(a): return np.clip(a,0,1)
BG={'dark':grad((40,10,20),(5,5,10)),'red':grad((170,10,30),(60,0,10)),
    'night':grad((10,30,70),(3,5,20)),'gold':grad((120,15,25),(25,5,10)),'green':grad((10,90,50),(2,30,18))}
random.seed(4)
flakes=[(random.random()*W,random.random()*H,40+random.random()*120,2+random.random()*6,random.random()*6) for _ in range(140)]
def snow(img,t,a=255):
    d=ImageDraw.Draw(img)
    for x0,y0,sp,r,ph in flakes:
        y=(y0+sp*t)%H; x=(x0+math.sin(t*1.3+ph)*25)%W
        d.ellipse([x-r,y-r,x+r,y+r],fill=(255,255,255))
def text(img,s,cx,cy,size,fill=WHITE,stroke=0,sf=(0,0,0),bg=None,pad=24,font=BOLD,alpha=1.0,rot=0):
    if alpha<=0.01 or size<4: return
    f=F(size,font)
    l,t,r,b=f.getbbox(s,stroke_width=stroke)
    tw,th=r-l,b-t
    lay=Image.new("RGBA",(tw+pad*2+20,th+pad*2+20),(0,0,0,0)); d=ImageDraw.Draw(lay)
    if bg: d.rounded_rectangle([10,10,tw+pad*2+10,th+pad*2+10],radius=int(size*0.22),fill=bg)
    d.text((10+pad-l,10+pad-t),s,font=f,fill=fill,stroke_width=stroke,stroke_fill=sf)
    if rot: lay=lay.rotate(rot,resample=Image.BICUBIC,expand=True)
    if alpha<1:
        al=lay.getchannel('A').point(lambda v:int(v*alpha)); lay.putalpha(al)
    img.alpha_composite(lay,(int(cx-lay.width/2),int(cy-lay.height/2)))
def pop(img,s,cx,cy,size,lt,start,**kw):
    p=(lt-start)/0.28
    if p<=0: return
    text(img,s,cx,cy,size*eob(p),alpha=clamp(p*2.5),**kw)

# ---------- profile (jawline) ----------
AFTER=[(150,100),(300,40),(430,90),(470,230),(465,280),(522,362),(470,388),(482,420),(466,446),(480,472),(462,505),(478,560),(440,612),(380,628),(325,645),(315,760),(322,920),(130,920),(150,650),(100,450),(110,250)]
BEFORE=[(150,100),(300,40),(430,90),(470,230),(465,280),(522,362),(470,388),(482,420),(466,446),(480,472),(462,505),(474,568),(458,642),(405,712),(345,735),(322,800),(330,920),(120,920),(140,650),(95,450),(105,250)]
def catmull(pts,n=10):
    out=[]; L=len(pts)
    for i in range(L):
        p0,p1,p2,p3=pts[i-1],pts[i],pts[(i+1)%L],pts[(i+2)%L]
        for k in range(n):
            t=k/n; t2=t*t; t3=t2*t
            out.append(tuple(0.5*((2*p1[j])+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3) for j in (0,1)))
    return out
def profile(img,m,ox,oy,sc=1.0,glow=GOLD):
    pts=[(ox+(b[0]+(a[0]-b[0])*m)*sc, oy+(b[1]+(a[1]-b[1])*m)*sc) for a,b in zip(AFTER,BEFORE)]
    poly=catmull(pts)
    lay=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(lay)
    d.line(poly+[poly[0]],fill=glow+(255,),width=18,joint="curve")
    lay=lay.filter(ImageFilter.GaussianBlur(14))
    d=ImageDraw.Draw(lay)
    d.polygon(poly,fill=(245,190,160,255))
    d.line(poly+[poly[0]],fill=(255,255,255,255),width=5,joint="curve")
    # jaw highlight
    jaw=catmull(pts,14)[11*14:15*14]
    if m>0.5:
        a=int(255*clamp((m-0.5)*2))
        d.line(jaw,fill=GREEN+(a,),width=10,joint="curve")
    img.alpha_composite(lay)

def badge(img,s,cy,lt,start,color):
    p=eo((lt-start)/0.35)
    if p<=0: return
    x=W/2+(1-p)*W
    text(img,s,x,cy,52,fill=WHITE,bg=color,pad=24)

def bar_top(img,t):
    d=ImageDraw.Draw(img); d.rectangle([0,0,W*t/DUR,10],fill=YEL)

def captions(img,t):
    for i,L in enumerate(WT):
        if not (L[0][1]-0.05<=t<=ST[i]+SD[i]+0.25): continue
        ci=max(k for k in range(len(L)) if L[k][1]<=t+0.05) if t>=L[0][1]-0.05 else 0
        g=ci//3; chunk=L[g*3:g*3+3]
        size=60; f=F(size)
        words=[w.upper() for w,_ in chunk]
        sp=f.getlength(' ')
        widths=[f.getlength(w) for w in words]; tw=sum(widths)+sp*(len(words)-1)
        if tw>960: size=int(size*960/tw); f=F(size); widths=[f.getlength(w) for w in words]; sp=f.getlength(' '); tw=sum(widths)+sp*(len(words)-1)
        d=ImageDraw.Draw(img); x=W/2-tw/2; y=1775
        d.rounded_rectangle([x-30,y-size*0.75,x+tw+30,y+size*0.75],radius=24,fill=(0,0,0,170))
        for k,w in enumerate(words):
            cur=(g*3+k)==ci
            d.text((x,y),w,font=f,fill=YEL if cur else WHITE,anchor='lm',stroke_width=5,stroke_fill=(0,0,0))
            x+=widths[k]+sp
        return
CUTS=[0]+[ST[i]-0.15 for i in (1,2,3,5,6,7,8)]+[DUR]
def frame(t):
    si=max(i for i in range(len(CUTS)-1) if CUTS[i]<=t); lt=t-CUTS[si]; dur=CUTS[si+1]-CUTS[si]
    if si==0:
        img=BG['dark'].copy().convert("RGBA")
        sx=random.uniform(-8,8) if (lt%1.2)<0.25 else 0
        pop(img,"VOCÊ",W/2+sx,620,150,lt,0.1,stroke=10)
        pop(img,"ESCONDE",W/2+sx,800,150,lt,0.45,stroke=10)
        pop(img,"A PAPADA",W/2+sx,1010,140,lt,0.9,fill=DARK,bg=YEL,rot=-3)
        pop(img,"NAS FOTOS?",W/2+sx,1230,140,lt,1.5,stroke=10)
        # rec frame
        if int(t*2)%2==0: ImageDraw.Draw(img).ellipse([80,120,120,160],fill=RED)
        text(img,"REC",175,140,40)
        d=ImageDraw.Draw(img)
        for (x,y,dx,dy) in [(60,90,1,1),(W-60,90,-1,1),(60,H-90,1,-1),(W-60,H-90,-1,-1)]:
            d.line([(x,y),(x+100*dx,y)],fill=WHITE,width=8); d.line([(x,y),(x,y+100*dy)],fill=WHITE,width=8)
    elif si==1:
        img=BG['night'].copy().convert("RGBA")
        pop(img,"Todo fim de ano",W/2,450,90,lt,0.1)
        pop(img,"é a mesma coisa:",W/2,570,90,lt,0.4)
        items=["Foto só de cima","Mão no queixo","Apaga metade das fotos","A papada aparece..."]
        for i,s in enumerate(items):
            st=wt(1,[6,10,17,21][i])-CUTS[si]
            p=eo((lt-st)/0.3)
            if p>0:
                x=W/2+(1-p)*-W
                text(img,"✖  "+s,x,820+i*170,64,fill=WHITE,bg=(200,20,40,230) if i%2==0 else (0,0,0,200),pad=26)
    elif si==2:
        img=BG['red'].copy().convert("RGBA"); snow(img,t)
        z=1+lt*0.03
        pop(img,"E SE ESSE",W/2,700,130*z,lt,0.1,stroke=8)
        pop(img,"NATAL",W/2,900,230*z,lt,0.5,fill=GOLD,stroke=10,sf=(80,0,10))
        pop(img,"FOSSE",W/2,1110,130*z,lt,1.0,stroke=8)
        pop(img,"DIFERENTE?",W/2,1270,130*z,lt,1.3,fill=DARK,bg=WHITE,rot=2)
    elif si==3:
        img=BG['gold'].copy().convert("RGBA"); snow(img,t)
        pop(img,"Conheça o",W/2,380,80,lt,0.1)
        if lt>0.5:
            lay=Image.new("RGBA",(W,H),(0,0,0,0))
            p=eob((lt-0.5)/0.4)
            text(lay,"4D",W/2,720,380*p,fill=GOLD+(255,))
            g=lay.filter(ImageFilter.GaussianBlur(30)); img.alpha_composite(g); img.alpha_composite(g)
            text(img,"4D",W/2,720,380*p,fill=GOLD,stroke=6,sf=(90,40,0))
            pop(img,"MÉTODO",W/2,500,110,lt,0.6,stroke=6)
        pop(img,"para redução de papada",W/2,960,62,lt,1.4,fill=DARK,bg=WHITE)
        B=[("✔  programa de 30 dias",3),("✔  exercícios faciais guiados",6),("✔  só 10 min por dia",11),("✔  feito em casa",15),("✔  sem agulha, sem cirurgia",19)]
        for i,(b,k) in enumerate(B):
            badge(img,b,1110+i*125,lt,wt(4,k)-CUTS[si],(30,160,90,240) if i==4 else (20,20,25,235))
    elif si==4:
        img=BG['night'].copy().convert("RGBA")
        m=eo(clamp((lt-0.8)/4.2))
        day=1+int(29*clamp((lt-0.8)/4.2))
        if lt>5.6: m=1.0 if int((lt-5.6)*2)%2==1 else 0.0; day=1 if m==0 else 30
        profile(img,m,250,640,0.95,glow=GREEN if m>0.9 else (120,160,255))
        text(img,"30 DIAS DE MÉTODO 4D",W/2,230,76,fill=YEL,stroke=6)
        text(img,f"DIA {day}",W/2,400,150,fill=WHITE,stroke=8)
        d=ImageDraw.Draw(img); d.rounded_rectangle([140,520,W-140,560],radius=20,fill=(55,65,95))
        d.rounded_rectangle([140,520,140+(W-280)*day/30,560],radius=20,fill=GREEN)
        lab="ANTES" if day<=1 else ("DEPOIS" if day>=30 else "EVOLUINDO...")
        text(img,lab,W/2,1600,90,fill=DARK,bg=(WHITE if day<=1 else (GREEN if day>=30 else YEL)),pad=28)
        text(img,"*Ilustração. Resultados variam de pessoa para pessoa.",W/2,1895,24,fill=(200,200,210),font=REG,pad=6)
    elif si==5:
        img=BG['green'].copy().convert("RGBA"); snow(img,t)
        pop(img,"COMECE HOJE",W/2,300,110,lt,0.1,stroke=8)
        pop(img,"e complete os 30 dias",W/2,440,64,lt,0.4)
        pop(img,"ANTES DO NATAL",W/2,560,100,lt,0.7,fill=DARK,bg=GOLD)
        d=ImageDraw.Draw(img)
        cw=150; gx=W/2-cw*3; gy=720
        for i in range(30):
            r,c=divmod(i,6); x=gx+c*cw+75; y=gy+r*150+75
            st=1.0+i*0.11; on=lt>st
            d.rounded_rectangle([x-62,y-62,x+62,y+62],radius=18,fill=(GREEN if on else (25,75,50)),outline=WHITE,width=3)
            text(img,"✔" if on else str(i+1),x,y,56 if on else 44,fill=WHITE,pad=0)
        p=eob((lt-4.5)/0.4)
        if p>0: text(img,"🎄 25/12".replace("🎄 ",""),W/2,1600,110*p,fill=GOLD,stroke=8,sf=(60,0,0))
    elif si==6:
        img=BG['red'].copy().convert("RGBA"); snow(img,t)
        # gift box
        p=eob((lt-0.1)/0.5); s=p
        d=ImageDraw.Draw(img); cx,cy=W/2,820
        if s>0:
            bw,bh=360*s,300*s
            d.rectangle([cx-bw/2,cy-bh/2+40*s,cx+bw/2,cy+bh/2+40*s],fill=(30,140,80))
            d.rectangle([cx-bw/2-20*s,cy-bh/2-30*s,cx+bw/2+20*s,cy-bh/2+40*s],fill=(40,170,100))
            d.rectangle([cx-30*s,cy-bh/2-30*s,cx+30*s,cy+bh/2+40*s],fill=GOLD)
            d.ellipse([cx-120*s,cy-bh/2-110*s,cx-10*s,cy-bh/2-20*s],outline=GOLD,width=int(22*s)+1)
            d.ellipse([cx+10*s,cy-bh/2-110*s,cx+120*s,cy-bh/2-20*s],outline=GOLD,width=int(22*s)+1)
        pop(img,"OFERTA",W/2,300,150,lt,0.4,stroke=10)
        pop(img,"ESPECIAL DE NATAL",W/2,460,90,lt,0.7,fill=DARK,bg=GOLD)
        pop(img,"condição exclusiva",W/2,1180,70,lt,1.5)
        pop(img,"pra quem entrar agora",W/2,1270,70,lt,1.8)
        if lt>wt(7,15)-CUTS[si] and int(lt*3)%2==0:
            text(img,"⚠ POR TEMPO LIMITADO",W/2,1480,72,fill=WHITE,bg=(0,0,0,220))
    else:
        img=BG['gold'].copy().convert("RGBA"); snow(img,t)
        pop(img,"MÉTODO 4D",W/2,330,130,lt,0.1,fill=GOLD,stroke=8,sf=(80,30,0))
        pop(img,"menos papada até o Natal*",W/2,480,62,lt,0.4)
        pulse=1+0.06*math.sin(lt*8)
        p=eob((lt-0.8)/0.4)
        if p>0: text(img,"TOQUE EM SAIBA MAIS",W/2,1050,78*p*pulse,fill=DARK,bg=YEL,pad=44)
        if lt>1.2:
            yb=1330+abs(math.sin(lt*5))*50
            d=ImageDraw.Draw(img)
            for k in range(3):
                y=yb+k*70; d.line([(W/2-70,y),(W/2,y+60),(W/2+70,y)],fill=(255,255,255),width=18,joint="curve")
        text(img,"*Resultados variam de pessoa para pessoa.",W/2,1895,24,fill=(230,220,220),font=REG,pad=6)
    captions(img,t)
    # brand tag
    if si>=3 and si<7:
        text(img,"MÉTODO 4D",150,70,34,fill=DARK,bg=GOLD,pad=12)
    bar_top(img,t)
    # cut flash + punch-in
    if si>0 and lt<0.12:
        a=int(255*(1-lt/0.12)); img.alpha_composite(Image.new("RGBA",(W,H),(255,255,255,a)))
    if lt<0.25 and si>0:
        z=1+0.08*(1-lt/0.25); cw,ch=int(W/z),int(H/z)
        img=img.crop(((W-cw)//2,(H-ch)//2,(W-cw)//2+cw,(H-ch)//2+ch)).resize((W,H),Image.BILINEAR)
    if si==0 and abs(lt-wt(0,10))<0.07:
        img.alpha_composite(Image.new("RGBA",(W,H),(255,255,255,200)))
    return img.convert("RGB")

if len(sys.argv)>1:
    for ts in sys.argv[1:]: frame(float(ts)).save(f"prev_{ts}.png")
    sys.exit()
p=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
  "-i","mix.wav","-c:v","libx264","-preset","medium","-crf","19","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-shortest","-movflags","+faststart","metodo4d_natal_voz.mp4"],stdin=subprocess.PIPE)
for i in range(int(FPS*DUR)):
    p.stdin.write(frame(i/FPS).tobytes())
p.stdin.close(); p.wait()
