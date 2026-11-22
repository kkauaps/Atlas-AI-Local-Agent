import numpy as np, wave
SR=44100; DUR=60; N=SR*DUR
out=np.zeros(N)
bpm=120; beat=60/bpm
def add(sig,t,g=1.0):
    i=int(t*SR); j=min(N,i+len(sig))
    if i<N: out[i:j]+=sig[:j-i]*g
def env(n,d): return np.exp(-np.arange(n)/(SR*d))
# kick
n=int(.35*SR); tt=np.arange(n)/SR
f=50+90*np.exp(-tt*30); kick=np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,.12)
# hat
n2=int(.08*SR); hat=np.diff(np.random.randn(n2+1))*env(n2,.015)*.25
# clap
n3=int(.2*SR); clap=np.random.randn(n3)*env(n3,.05)*.35
def bell(freq,d=.6):
    n=int(d*SR); t=np.arange(n)/SR
    s=np.sin(2*np.pi*freq*t)+.4*np.sin(2*np.pi*freq*2.76*t)*np.exp(-t*8)+.2*np.sin(2*np.pi*freq*5.4*t)*np.exp(-t*14)
    return s*env(n,.22)*.18
def bass(freq,d):
    n=int(d*SR); t=np.arange(n)/SR
    s=np.tanh(3*np.sin(2*np.pi*freq*t))*np.minimum(1,t*80)*np.exp(-t*1.5)
    return s*.22
chords=[(261.63,[523.25,659.25,783.99,1046.5]),(220.0,[440,523.25,659.25,880]),
        (174.61,[349.23,440,523.25,698.46]),(196.0,[392,493.88,587.33,783.99])]
t=0; bar=0
while t<DUR:
    root,notes=chords[(bar//1)%4]
    for b in range(4):
        bt=t+b*beat
        intro = bt<3.5
        if not intro or b%2==0: add(kick,bt,.9)
        if b in (1,3) and not intro: add(clap,bt)
        add(hat,bt+beat/2)
        add(hat,bt+beat/4,.5); add(hat,bt+3*beat/4,.5)
    add(bass(root/2,beat*4),t)
    for k in range(8):
        add(bell(notes[[0,1,2,3,2,1,2,3][k]]),t+k*beat/2)
    t+=4*beat; bar+=1
# whooshes / risers at cuts
for c in [3.5,9,14,24,38,46,53]:
    n=int(.6*SR); x=np.random.randn(n); 
    x=np.convolve(x,np.ones(6)/6,'same')*np.sin(np.linspace(0,np.pi,n))**2*.5
    add(x,c-.45)
    add(kick,c,1.2)
# camera shutter in hook
for c in [0.05,1.2,2.4]:
    n=int(.06*SR); add(np.random.randn(n)*env(n,.01)*.8,c); add(np.random.randn(n)*env(n,.01)*.6,c+.07)
# fade out
fo=int(1.5*SR); out[-fo:]*=np.linspace(1,0,fo)
out=np.tanh(out*1.2); out/=np.abs(out).max()*1.12
st=np.stack([out,out],1)
with wave.open('music.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes())
