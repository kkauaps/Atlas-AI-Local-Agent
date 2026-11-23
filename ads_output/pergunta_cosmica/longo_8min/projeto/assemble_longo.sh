#!/bin/bash
# usage: assemble_longo.sh OUT.mp4 Block1 Block2 ...
set -e
OUT=$1; shift
cd "$(dirname "$0")/out/longo"
: > list.txt; for b in "$@"; do echo "file '$b.mp4'" >> list.txt; done
ffmpeg -y -v error -f concat -safe 0 -i list.txt -c copy joined.mp4
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 joined.mp4)
ffmpeg -y -v error -i joined.mp4 -i ../../public/longo/music_long.wav -filter_complex \
 "[1:a]atrim=0:$DUR,asetpts=PTS-STARTPTS,volume=0.55,afade=t=out:st=$(python3 -c "print(max(0,$DUR-3))"):d=3[mus];\
  [0:a]asplit=2[vo][key];\
  [mus][key]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350:makeup=1[duck];\
  [vo][duck]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k "$OUT"
ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$OUT"
