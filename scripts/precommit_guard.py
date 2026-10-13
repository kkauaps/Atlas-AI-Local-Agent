"""precommit_guard - bloqueia commit de dados pessoais e segredos.

Instalar (uma vez):  python scripts/precommit_guard.py --instalar
Roda sozinho como .git/hooks/pre-commit; também dá pra rodar à mão sem argumentos.
"""
import os
import re
import sys
import subprocess

BLOQUEADOS = re.compile(r"(^|/)(memorias?\.json|memorias_vetores\.json|conversas\.json|grafo\.json|config\.json|"
                        r"observacoes\.json|lembretes\.json|acoes_ia\.json|jobs\.db.*|mcp\.json|\.env(\..*)?)$"
                        r"|(^|/)(prints|logs|browser_profile|playwright)/")
PERMITIDOS = re.compile(r"(^|/)(\.gitkeep|\.env\.example)$")
SEGREDOS = re.compile(r"(sk-[A-Za-z0-9_\-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|xox[abpr]-[A-Za-z0-9\-]{10,}|"
                      r"AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|AIza[0-9A-Za-z_\-]{35})")


def caminho_bloqueado(p: str) -> bool:
    p = p.replace("\\", "/")
    return bool(BLOQUEADOS.search(p)) and not PERMITIDOS.search(p)


def tem_segredo(texto: str) -> bool:
    return bool(SEGREDOS.search(texto or ""))


def _git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, encoding="utf-8", errors="replace").stdout


def verificar() -> list:
    problemas = []
    for p in [x for x in _git("diff", "--cached", "--name-only", "--diff-filter=ACMR").splitlines() if x]:
        if caminho_bloqueado(p):
            problemas.append(f"{p}: arquivo de dados pessoais/segredos")
            continue
        if tem_segredo(_git("show", f":{p}")):
            problemas.append(f"{p}: parece conter um segredo (token/chave)")
    return problemas


def instalar():
    raiz = _git("rev-parse", "--show-toplevel").strip()
    hook = os.path.join(raiz, ".git", "hooks", "pre-commit")
    with open(hook, "w", encoding="utf-8", newline="\n") as f:
        f.write('#!/bin/sh\nexec python "$(git rev-parse --show-toplevel)/scripts/precommit_guard.py"\n')
    print("hook instalado em", hook)


if __name__ == "__main__":
    if "--instalar" in sys.argv:
        instalar()
        sys.exit(0)
    erros = verificar()
    if erros:
        print("commit bloqueado pelo precommit_guard:\n  " + "\n  ".join(erros))
        sys.exit(1)
