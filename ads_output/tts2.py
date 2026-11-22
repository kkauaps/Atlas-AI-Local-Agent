from kokoro_onnx import Kokoro
import soundfile as sf, json, sys
k=Kokoro('kokoro-v1.0.onnx','voices-v1.0.bin')
lines=json.load(open(sys.argv[1])); info=[]
for i,t in enumerate(lines):
    x,sr=k.create(t,voice='pf_dora',speed=1.0,lang='pt-br')
    sf.write(f'seg{i:02d}.wav',x,sr); info.append(len(x)/sr); print(i,round(info[-1],2),k.tokenizer.phonemize(t,'pt-br')[:90])
json.dump(info,open('durs.json','w'))
